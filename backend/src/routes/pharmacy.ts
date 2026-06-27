import { Router, Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { supabase } from '../supabase';

export function initPharmacyRoutes(app: Express, io: SocketIOServer) {
  const router = Router();

  // 1. GET /api/medicines - List all medicines with current stock levels & active prices
  router.get('/medicines', async (req, res) => {
    try {
      const { data: medicines, error: medError } = await supabase
        .from('medicines')
        .select('*')
        .order('medicine_name', { ascending: true });

      if (medError) throw medError;

      const { data: batches, error: batchError } = await supabase
        .from('medicine_batches')
        .select('*')
        .gt('available_quantity', 0)
        .order('expiry_date', { ascending: true });

      if (batchError) throw batchError;

      // Format medicines to include total stock and the active price (price of the batch closest to expiry)
      const formatted = medicines.map((med) => {
        const medBatches = batches.filter((b) => b.medicine_id === med.id);
        const totalStock = medBatches.reduce((acc, curr) => acc + curr.available_quantity, 0);
        
        // Active price is the selling price of the batch closest to expiry
        const activePrice = medBatches.length > 0 ? medBatches[0].selling_price : 0;

        return {
          ...med,
          total_stock: totalStock,
          unit_price: activePrice,
          batches: medBatches,
        };
      });

      res.json(formatted);
    } catch (error: any) {
      console.error('Error fetching medicines:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. POST /api/medicines - Register a new medicine
  router.post('/medicines', async (req, res) => {
    try {
      const { medicine_name, generic_name, strength, manufacturer, unit, reorder_level } = req.body;

      if (!medicine_name) {
        return res.status(400).json({ error: 'Medicine name is required.' });
      }

      const { data, error } = await supabase
        .from('medicines')
        .insert([
          {
            medicine_name,
            generic_name,
            strength,
            manufacturer,
            unit,
            reorder_level: reorder_level || 10,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error: any) {
      console.error('Error creating medicine:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. POST /api/medicines/stock - Add stock (creates a new batch and logs history)
  router.post('/medicines/stock', async (req, res) => {
    try {
      const { medicine_id, batch_no, expiry_date, purchase_price, selling_price, quantity } = req.body;

      if (!medicine_id || !batch_no || !expiry_date || purchase_price === undefined || selling_price === undefined || !quantity) {
        return res.status(400).json({ error: 'Missing required stock fields.' });
      }

      // Check if batch already exists for this medicine
      const { data: existingBatch, error: checkError } = await supabase
        .from('medicine_batches')
        .select('*')
        .eq('medicine_id', medicine_id)
        .eq('batch_no', batch_no)
        .maybeSingle();

      if (checkError) throw checkError;

      let batchId: string;
      let finalQuantity: number;

      if (existingBatch) {
        // Update existing batch
        finalQuantity = existingBatch.available_quantity + quantity;
        const { data: updatedBatch, error: updateError } = await supabase
          .from('medicine_batches')
          .update({
            available_quantity: finalQuantity,
            purchase_price,
            selling_price,
            expiry_date,
          })
          .eq('id', existingBatch.id)
          .select()
          .single();

        if (updateError) throw updateError;
        batchId = updatedBatch.id;
      } else {
        // Insert new batch
        finalQuantity = quantity;
        const { data: newBatch, error: insertError } = await supabase
          .from('medicine_batches')
          .insert([
            {
              medicine_id,
              batch_no,
              expiry_date,
              purchase_price,
              selling_price,
              available_quantity: quantity,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        batchId = newBatch.id;
      }

      // Log in medicine_stock_history
      const { error: historyError } = await supabase
        .from('medicine_stock_history')
        .insert([
          {
            medicine_id,
            batch_id: batchId,
            transaction_type: 'Purchase',
            quantity,
            balance: finalQuantity,
            remarks: `Added stock. Batch: ${batch_no}`,
          },
        ]);

      if (historyError) throw historyError;

      res.status(200).json({ success: true, message: 'Stock updated successfully.' });
    } catch (error: any) {
      console.error('Error adding stock:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 4. GET /api/pharmacy/queue - Retrieve visits waiting for pharmacy (Sent to Pharmacy)
  router.get('/pharmacy/queue', async (req, res) => {
    try {
      const { data: visits, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_number,
          visit_date,
          token_no,
          status,
          patients (
            id,
            first_name,
            last_name,
            phone,
            gender,
            age,
            dob
          ),
          doctors (
            id,
            profiles!doctors_user_id_fkey (
              full_name
            )
          ),
          diagnoses (
            diagnosis,
            doctor_notes
          ),
          prescriptions (
            id,
            advice,
            prescription_items (
              id,
              medicine_id,
              medicines (
                medicine_name,
                generic_name,
                strength,
                unit
              ),
              dosage,
              frequency,
              duration,
              quantity,
              instructions
            )
          )
        `)
        .eq('status', 'Sent to Pharmacy')
        .order('visit_date', { ascending: true });

      if (error) throw error;

      res.json(visits || []);
    } catch (error: any) {
      console.error('Error fetching pharmacy queue:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 5. POST /api/pharmacy/checkout - Dispense prescription, deduct stock, log invoices & payments
  router.post('/pharmacy/checkout', async (req, res) => {
    try {
      const { visit_id, patient_id, items, discount, payment_mode } = req.body;

      if (!visit_id || !patient_id || !items || !Array.isArray(items) || items.length === 0 || !payment_mode) {
        return res.status(400).json({ error: 'Missing required checkout information.' });
      }

      let totalAmount = 0;
      const saleItemsToInsert: any[] = [];
      const batchUpdates: { id: string; available_quantity: number }[] = [];
      const stockHistoriesToInsert: any[] = [];

      // Process each medicine item for FIFO stock deduction
      for (const item of items) {
        const { medicine_id, quantity: requestedQty, unit_price } = item;
        const lineTotal = requestedQty * unit_price;
        totalAmount += lineTotal;

        // Fetch batches for this medicine order by expiry date (FIFO)
        const { data: batches, error: batchErr } = await supabase
          .from('medicine_batches')
          .select('*')
          .eq('medicine_id', medicine_id)
          .gt('available_quantity', 0)
          .order('expiry_date', { ascending: true });

        if (batchErr) throw batchErr;

        let remainingToDeduct = requestedQty;
        const medicineTotalStock = batches?.reduce((sum, b) => sum + b.available_quantity, 0) || 0;

        if (medicineTotalStock < requestedQty) {
          return res.status(400).json({
            error: `Insufficient stock for medicine ID ${medicine_id}. Requested: ${requestedQty}, Available: ${medicineTotalStock}`,
          });
        }

        for (const batch of batches || []) {
          if (remainingToDeduct <= 0) break;

          const deductFromThisBatch = Math.min(batch.available_quantity, remainingToDeduct);
          remainingToDeduct -= deductFromThisBatch;
          const newQty = batch.available_quantity - deductFromThisBatch;

          // Record batch updates to commit later
          batchUpdates.push({
            id: batch.id,
            available_quantity: newQty,
          });

          // Prepare pharmacy sale item log
          saleItemsToInsert.push({
            medicine_id,
            batch_id: batch.id,
            quantity: deductFromThisBatch,
            unit_price: unit_price,
            total: deductFromThisBatch * unit_price,
          });

          // Prepare stock history log
          stockHistoriesToInsert.push({
            medicine_id,
            batch_id: batch.id,
            transaction_type: 'Sale',
            quantity: -deductFromThisBatch,
            balance: newQty,
            remarks: `Prescription dispensed. Visit ID: ${visit_id}`,
          });
        }
      }

      // Calculate totals
      const discountAmount = discount || 0;
      const finalAmount = Math.max(0, totalAmount - discountAmount);

      // Perform DB updates
      // 1. Create pharmacy sale record
      const { data: saleRecord, error: saleErr } = await supabase
        .from('pharmacy_sales')
        .insert([
          {
            visit_id,
            patient_id,
            total_amount: totalAmount,
            discount: discountAmount,
            final_amount: finalAmount,
          },
        ])
        .select()
        .single();

      if (saleErr) throw saleErr;

      // 2. Insert sale items
      const saleItemsWithSaleId = saleItemsToInsert.map((si) => ({
        ...si,
        sale_id: saleRecord.id,
      }));

      const { error: itemsErr } = await supabase
        .from('pharmacy_sale_items')
        .insert(saleItemsWithSaleId);

      if (itemsErr) throw itemsErr;

      // 3. Update stock batches
      for (const update of batchUpdates) {
        const { error: batchUpErr } = await supabase
          .from('medicine_batches')
          .update({ available_quantity: update.available_quantity })
          .eq('id', update.id);

        if (batchUpErr) throw batchUpErr;
      }

      // 4. Log stock histories
      const { error: histErr } = await supabase
        .from('medicine_stock_history')
        .insert(stockHistoriesToInsert);

      if (histErr) throw histErr;

      // 5. Create invoice
      const { data: invoiceRecord, error: invErr } = await supabase
        .from('invoices')
        .insert([
          {
            visit_id,
            patient_id,
            total_amount: totalAmount,
            discount: discountAmount,
            tax: 0,
            final_amount: finalAmount,
            paid_amount: finalAmount,
            status: 'Paid',
          },
        ])
        .select()
        .single();

      if (invErr) throw invErr;

      // Create invoice items (for pharmacy items)
      const invoiceItems = items.map((item) => ({
        invoice_id: invoiceRecord.id,
        item_type: 'Medicine',
        reference_id: item.medicine_id,
        description: `Medicine: ${item.medicine_name || 'Prescription item'}`,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: invItemsErr } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (invItemsErr) throw invItemsErr;

      // 6. Create payment
      const { error: payErr } = await supabase
        .from('payments')
        .insert([
          {
            invoice_id: invoiceRecord.id,
            amount: finalAmount,
            payment_mode: payment_mode,
            payment_status: 'Paid',
            paid_at: new Date().toISOString(),
          },
        ]);

      if (payErr) throw payErr;

      // 7. Update visit status to 'Dispensed'
      const { error: visitErr } = await supabase
        .from('visits')
        .update({ status: 'Dispensed' })
        .eq('id', visit_id);

      if (visitErr) throw visitErr;

      // 8. Log visit status history
      const { error: statusHistErr } = await supabase
        .from('visit_status_history')
        .insert([
          {
            visit_id,
            status: 'Dispensed',
            remarks: 'Medicines dispensed by pharmacist.',
          },
        ]);

      if (statusHistErr) throw statusHistErr;

      // Emit Socket event for real-time queue refresh
      io.emit('queue-update', { visit_id, status: 'Dispensed' });

      res.status(200).json({ success: true, sale_id: saleRecord.id });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api', router);
}
