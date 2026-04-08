-- Database Schema for Family Finance App
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#3B82F6',
  budget_limit NUMERIC(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT DEFAULT '',
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type TEXT CHECK (type IN ('income', 'expense')) DEFAULT 'expense',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Families
CREATE POLICY "Users can view their family" ON families
  FOR SELECT USING (id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage families" ON families
  FOR ALL USING (
    id IN (SELECT family_id FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for Users
CREATE POLICY "Users can view family members" ON users
  FOR SELECT USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- RLS Policies for Categories
CREATE POLICY "Users can manage family categories" ON categories
  FOR ALL USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies for Transactions
CREATE POLICY "Users can manage family transactions" ON transactions
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE family_id IN (SELECT family_id FROM users WHERE id = auth.uid()))
  );

-- RLS Policies for Goals
CREATE POLICY "Users can manage family goals" ON goals
  FOR ALL USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- Enable Realtime for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE goals;

-- Note: Default categories will be created automatically when a user registers
-- See: src/app/register/page.tsx
