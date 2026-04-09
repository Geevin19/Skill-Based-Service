require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL; // https://xxx.supabase.co
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const host = SUPABASE_URL.replace('https://', '');

// Split into individual statements to run via PostgREST /rpc or direct fetch
const statements = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
  `CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'learner' CHECK (role IN ('learner','mentor','admin')), is_verified BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, verification_token VARCHAR(255), reset_token VARCHAR(255), reset_token_expires TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS profiles (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(255) NOT NULL, bio TEXT, avatar_url VARCHAR(500), location VARCHAR(255), timezone VARCHAR(100), skills TEXT[], experience_years INTEGER DEFAULT 0, hourly_rate DECIMAL(10,2), certifications JSONB DEFAULT '[]', portfolio JSONB DEFAULT '[]', social_links JSONB DEFAULT '{}', is_mentor_approved BOOLEAN DEFAULT FALSE, avg_rating DECIMAL(3,2) DEFAULT 0, total_reviews INTEGER DEFAULT 0, total_sessions INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS sessions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), mentor_id UUID REFERENCES users(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, description TEXT, category VARCHAR(100), skills TEXT[], session_type VARCHAR(20) DEFAULT '1-on-1' CHECK (session_type IN ('1-on-1','group')), duration_minutes INTEGER NOT NULL, price DECIMAL(10,2) NOT NULL, max_participants INTEGER DEFAULT 1, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS availability (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), mentor_id UUID REFERENCES users(id) ON DELETE CASCADE, day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), start_time TIME NOT NULL, end_time TIME NOT NULL, is_recurring BOOLEAN DEFAULT TRUE, specific_date DATE, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS bookings (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), session_id UUID REFERENCES sessions(id) ON DELETE SET NULL, learner_id UUID REFERENCES users(id) ON DELETE CASCADE, mentor_id UUID REFERENCES users(id) ON DELETE CASCADE, scheduled_at TIMESTAMPTZ NOT NULL, duration_minutes INTEGER NOT NULL, status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed','rescheduled')), meeting_link VARCHAR(500), notes TEXT, price DECIMAL(10,2) NOT NULL, cancelled_by UUID REFERENCES users(id), cancel_reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS messages (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), sender_id UUID REFERENCES users(id) ON DELETE CASCADE, receiver_id UUID REFERENCES users(id) ON DELETE CASCADE, booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, content TEXT, file_url VARCHAR(500), file_name VARCHAR(255), file_type VARCHAR(100), is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS reviews (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE, reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE, reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE, rating INTEGER CHECK (rating BETWEEN 1 AND 5), comment TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS payments (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, payer_id UUID REFERENCES users(id) ON DELETE SET NULL, payee_id UUID REFERENCES users(id) ON DELETE SET NULL, amount DECIMAL(10,2) NOT NULL, platform_fee DECIMAL(10,2) DEFAULT 0, net_amount DECIMAL(10,2) NOT NULL, currency VARCHAR(10) DEFAULT 'usd', status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')), stripe_payment_intent_id VARCHAR(255), stripe_transfer_id VARCHAR(255), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, type VARCHAR(50) NOT NULL, title VARCHAR(255) NOT NULL, message TEXT, data JSONB DEFAULT '{}', is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS reports (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), reporter_id UUID REFERENCES users(id) ON DELETE CASCADE, reported_id UUID REFERENCES users(id) ON DELETE CASCADE, reason VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')), created_at TIMESTAMPTZ DEFAULT NOW())`,
];

function execSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: host,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode < 300) resolve(d);
        else reject(new Error(`${res.statusCode}: ${d.slice(0, 100)}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function migrate() {
  console.log('Creating exec_sql function first...');

  // First create a helper SQL function via Supabase's pg extension
  // We'll use the supabase-js client to call pg directly
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  for (const sql of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({ error: { message: 'rpc not available' } }));
    if (error) {
      // fallback: try direct via pg REST
      console.log('RPC not available, trying direct insert approach...');
      break;
    }
    console.log('OK:', sql.slice(0, 50));
  }

  console.log('\nNote: If RPC failed, please run the SQL manually in Supabase SQL Editor.');
  console.log('File: skillswap/backend/src/db/schema.sql');
}

migrate();
