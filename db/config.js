require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_KEY;

// Initialize the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function connectDB() {
  try {
    console.log('Supabase client initialized');
    return supabase;
  } catch (error) {
    console.error('Supabase initialization error:', error.message);
    process.exit(1);
  }
}

module.exports = { connectDB, supabase };
