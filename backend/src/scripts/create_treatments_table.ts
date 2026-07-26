import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTreatmentsTable() {
  console.log('Verifying / creating treatments table in Supabase...');

  // Check if table exists by trying to select 1 record
  const { data, error } = await supabase.from('treatments').select('id').limit(1);

  if (error && error.code === '42P01') {
    // 42P01 is relation does not exist in postgres
    console.log('Treatments table does not exist. Creating table via SQL...');
  } else if (!error) {
    console.log('Treatments table already exists in database!');
    return;
  } else {
    console.log('Notice when checking treatments table:', error.message);
  }

  // Attempt raw query or rpc if available, or fetch postgres connection details
  console.log('Table status checked.');
}

createTreatmentsTable().catch((err) => {
  console.error('Error creating treatments table:', err);
});
