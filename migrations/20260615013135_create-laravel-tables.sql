-- Create Laravel-compatible tables for LinkedIn Post app

CREATE TABLE IF NOT EXISTS monthly_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER,
  topic_name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  keywords TEXT,
  objectives TEXT,
  target_audience TEXT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_posts INTEGER DEFAULT 10,
  schedule_hours INTEGER[],
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS day_posts (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES monthly_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  post_type VARCHAR(50),
  text_content TEXT,
  hashtags TEXT,
  image_url TEXT,
  image_file TEXT,
  call_to_action TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id BIGSERIAL PRIMARY KEY,
  day_post_id BIGINT UNIQUE REFERENCES day_posts(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  error_message TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_configs (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  position VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "anyone can read monthly_plans" ON monthly_plans
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "authenticated can insert monthly_plans" ON monthly_plans
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update monthly_plans" ON monthly_plans
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated can delete monthly_plans" ON monthly_plans
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "anyone can read day_posts" ON day_posts
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "authenticated can insert day_posts" ON day_posts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update day_posts" ON day_posts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated can delete day_posts" ON day_posts
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "anyone can read scheduled_posts" ON scheduled_posts
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "authenticated can insert scheduled_posts" ON scheduled_posts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update scheduled_posts" ON scheduled_posts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated can delete scheduled_posts" ON scheduled_posts
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "anyone can read app_configs" ON app_configs
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "authenticated can insert app_configs" ON app_configs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update app_configs" ON app_configs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated can delete app_configs" ON app_configs
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "anyone can read contacts" ON contacts
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "authenticated can insert contacts" ON contacts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update contacts" ON contacts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated can delete contacts" ON contacts
  FOR DELETE TO authenticated USING (true);

-- Grant privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON monthly_plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON monthly_plans TO authenticated;
GRANT SELECT ON day_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON day_posts TO authenticated;
GRANT SELECT ON scheduled_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON scheduled_posts TO authenticated;
GRANT SELECT ON app_configs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON app_configs TO authenticated;
GRANT SELECT ON contacts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON contacts TO authenticated;