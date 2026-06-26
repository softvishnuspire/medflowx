import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('Starting seeding database...');

  // 1. Roles & Departments are seeded by schema.sql, but let's verify or insert them
  const { data: roleData, error: roleErr } = await supabase.from('roles').select('*');
  if (roleErr) {
    console.error('Error fetching roles:', roleErr);
    return;
  }
  console.log(`Found ${roleData?.length || 0} roles in database.`);

  const { data: deptData, error: deptErr } = await supabase.from('departments').select('*');
  if (deptErr) {
    console.error('Error fetching departments:', deptErr);
    return;
  }
  console.log(`Found ${deptData?.length || 0} departments in database.`);

  // 2. Create or fetch test users in auth
  console.log('Seeding mock users...');
  
  const emails = {
    doctor: 'doctor@medflowx.com',
    reception: 'reception@medflowx.com',
    pharmacy: 'pharmacy@medflowx.com',
    admin: 'admin@medflowx.com'
  };

  const users: Record<string, string> = {}; // role -> authUserId

  for (const [role, email] of Object.entries(emails)) {
    // Check if auth user exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing auth users:', listError);
      return;
    }
    const foundUser = existingUsers.users.find(u => u.email === email);
    
    if (foundUser) {
      console.log(`Auth user ${email} already exists.`);
      users[role] = foundUser.id;
    } else {
      console.log(`Creating auth user for ${email}...`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: 'Password123!',
        email_confirm: true
      });
      if (createError) {
        console.error(`Error creating auth user ${email}:`, createError);
        return;
      }
      if (newUser && newUser.user) {
        users[role] = newUser.user.id;
      }
    }
  }

  // 3. Create profiles
  console.log('Seeding profiles...');
  const roleMap: Record<string, number> = { admin: 1, reception: 2, doctor: 3, pharmacy: 4 };
  const profileNames: Record<string, string> = {
    admin: 'System Admin',
    reception: 'Rita Receptionist',
    doctor: 'Dr. John Doe',
    pharmacy: 'Phil Pharmacist'
  };

  for (const [role, userId] of Object.entries(users)) {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log(`Profile for ${role} already exists.`);
    } else {
      console.log(`Inserting profile for ${role}...`);
      const { error: insertErr } = await supabase.from('profiles').insert({
        id: userId,
        role_id: roleMap[role],
        full_name: profileNames[role],
        email: emails[role as keyof typeof emails],
        phone: role === 'doctor' ? '9876543210' : role === 'reception' ? '9876543211' : role === 'pharmacy' ? '9876543212' : '9876543213',
        is_active: true
      });
      if (insertErr) {
        console.error(`Error inserting profile for ${role}:`, insertErr);
      }
    }
  }

  // 4. Create Doctor
  const doctorUserId = users['doctor'];
  let doctorId: number | null = null;

  const { data: existingDoctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', doctorUserId)
    .single();

  if (existingDoctor) {
    console.log('Doctor record already exists.');
    doctorId = existingDoctor.id;
  } else {
    console.log('Inserting doctor record...');
    const { data: newDoctor, error: docErr } = await supabase
      .from('doctors')
      .insert({
        user_id: doctorUserId,
        department_id: 1, // General Medicine
        qualification: 'MBBS, MD (General Medicine)',
        consultation_fee: 500.00
      })
      .select()
      .single();

    if (docErr) {
      console.error('Error inserting doctor:', docErr);
      return;
    }
    doctorId = newDoctor.id;
  }
  console.log(`Doctor ID: ${doctorId}`);

  // 5. Create Medicines & Batches
  console.log('Seeding medicines...');
  const sampleMedicines = [
    { name: 'Paracetamol 650mg', generic: 'Paracetamol', strength: '650mg', category: 'Analgesics' },
    { name: 'Amoxicillin 500mg', generic: 'Amoxicillin', strength: '500mg', category: 'Antibiotics' },
    { name: 'Cetirizine 10mg', generic: 'Cetirizine Hydrochloride', strength: '10mg', category: 'Antihistamines' },
    { name: 'Ibuprofen 400mg', generic: 'Ibuprofen', strength: '400mg', category: 'NSAIDs' },
    { name: 'Metformin 500mg', generic: 'Metformin Hydrochloride', strength: '500mg', category: 'Antidiabetics' },
    { name: 'Atorvastatin 10mg', generic: 'Atorvastatin Calcium', strength: '10mg', category: 'Antihyperlipidemics' },
    { name: 'Pantoprazole 40mg', generic: 'Pantoprazole Sodium', strength: '40mg', category: 'Antacids' },
    { name: 'Azithromycin 500mg', generic: 'Azithromycin', strength: '500mg', category: 'Antibiotics' },
    { name: 'Amlodipine 5mg', generic: 'Amlodipine Besylate', strength: '5mg', category: 'Antihypertensives' },
    { name: 'Montelukast 10mg', generic: 'Montelukast Sodium', strength: '10mg', category: 'Antiasthmatics' }
  ];

  for (const item of sampleMedicines) {
    // 5a. Check/Create Category
    let categoryId = 1;
    const { data: existingCat } = await supabase
      .from('medicine_categories')
      .select('*')
      .eq('category_name', item.category)
      .single();

    if (existingCat) {
      categoryId = existingCat.id;
    } else {
      const { data: newCat, error: catErr } = await supabase
        .from('medicine_categories')
        .insert({ category_name: item.category })
        .select()
        .single();
      if (!catErr && newCat) {
        categoryId = newCat.id;
      }
    }

    // 5b. Check/Create Medicine
    let medicineId = null;
    const { data: existingMed } = await supabase
      .from('medicines')
      .select('*')
      .eq('medicine_name', item.name)
      .single();

    if (existingMed) {
      medicineId = existingMed.id;
    } else {
      const { data: newMed, error: medErr } = await supabase
        .from('medicines')
        .insert({
          category_id: categoryId,
          medicine_name: item.name,
          generic_name: item.generic,
          strength: item.strength,
          manufacturer: 'Astra Biotech',
          unit: 'Tablet',
          reorder_level: 20
        })
        .select()
        .single();

      if (!medErr && newMed) {
        medicineId = newMed.id;
      }
    }

    if (medicineId) {
      // 5c. Check/Create Batch
      const { data: existingBatch } = await supabase
        .from('medicine_batches')
        .select('*')
        .eq('medicine_id', medicineId)
        .eq('batch_no', 'BAT-2026-01')
        .single();

      if (!existingBatch) {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2); // 2 years expiry

        await supabase.from('medicine_batches').insert({
          medicine_id: medicineId,
          batch_no: 'BAT-2026-01',
          expiry_date: expiryDate.toISOString().split('T')[0],
          purchase_price: 1.50,
          selling_price: 3.00,
          available_quantity: 100
        });
      }
    }
  }

  // 6. Create Patients
  console.log('Seeding patients...');
  const samplePatients = [
    { first_name: 'Alice', last_name: 'Smith', gender: 'Female', age: 29, dob: '1997-04-12', phone: '9988776655', blood_group: 'O+', allergies: 'Sulfa Drugs', medical_history: 'Hypertension diagnosed in 2024.' },
    { first_name: 'Bob', last_name: 'Johnson', gender: 'Male', age: 45, dob: '1981-11-23', phone: '9988776656', blood_group: 'A-', allergies: 'Penicillin', medical_history: 'None.' },
    { first_name: 'Charlie', last_name: 'Brown', gender: 'Male', age: 12, dob: '2014-07-08', phone: '9988776657', blood_group: 'B+', allergies: 'Dust/Pollen', medical_history: 'Asthma since childhood.' }
  ];

  const patientIds: number[] = [];
  for (const pat of samplePatients) {
    const { data: existingPat } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', pat.phone)
      .single();

    if (existingPat) {
      console.log(`Patient ${pat.first_name} already exists.`);
      patientIds.push(existingPat.id);
    } else {
      console.log(`Inserting patient ${pat.first_name}...`);
      const { data: newPat, error: patErr } = await supabase
        .from('patients')
        .insert({
          first_name: pat.first_name,
          last_name: pat.last_name,
          gender: pat.gender,
          age: pat.age,
          dob: pat.dob,
          phone: pat.phone,
          blood_group: pat.blood_group,
          allergies: pat.allergies,
          medical_history: pat.medical_history
        })
        .select()
        .single();

      if (patErr) {
        console.error(`Error inserting patient ${pat.first_name}:`, patErr);
      } else if (newPat) {
        patientIds.push(newPat.id);

        // Seed an address
        await supabase.from('patient_addresses').insert({
          patient_id: newPat.id,
          address_line: '123 Main Street',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001'
        });
      }
    }
  }

  // 7. Seed active visits (status = Waiting or Created)
  console.log('Seeding active visits...');
  if (doctorId && patientIds.length > 0) {
    for (let i = 0; i < patientIds.length; i++) {
      const patientId = patientIds[i];
      const complaints = [
        'Severe headache and mild fever since 2 days',
        'Dry cough, throat irritation, and body pain',
        'Shortness of breath after playing, chest tightness'
      ];

      // Check if there is an active visit (not Closed or Cancelled) for this patient today
      const { data: existingVisits } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .neq('status', 'Closed')
        .neq('status', 'Cancelled');

      if (existingVisits && existingVisits.length > 0) {
        console.log(`Patient ID ${patientId} already has an active visit.`);
      } else {
        console.log(`Creating active visit for patient ID ${patientId}...`);
        const { error: visitErr } = await supabase.from('visits').insert({
          patient_id: patientId,
          doctor_id: doctorId,
          token_no: i + 1,
          chief_complaint: complaints[i % complaints.length],
          status: 'Waiting',
          visit_date: new Date().toISOString()
        });

        if (visitErr) {
          console.error(`Error inserting visit for patient ID ${patientId}:`, visitErr);
        }
      }
    }
  }

  console.log('Database seeding finished successfully!');
}

main().catch((err) => {
  console.error('Error seeding database:', err);
});
