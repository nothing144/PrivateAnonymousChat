# Supabase Setup Instructions for Secret Chat Lite

## Required Tables

You need to create three tables in your Supabase project:

### 1. `public_posts` Table

```sql
CREATE TABLE public_posts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public_posts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we don't have auth)
CREATE POLICY "Enable all access for public_posts" ON public_posts
  FOR ALL USING (true) WITH CHECK (true);
```

### 2. `post_replies` Table

```sql
CREATE TABLE post_replies (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  reply TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE post_replies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we don't have auth)
CREATE POLICY "Enable all access for post_replies" ON post_replies
  FOR ALL USING (true) WITH CHECK (true);
```

### 3. `private_messages` Table (NEW)

```sql
CREATE TABLE private_messages (
  id BIGSERIAL PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we don't have auth)
CREATE POLICY "Enable all access for private_messages" ON private_messages
  FOR ALL USING (true) WITH CHECK (true);
```

## Enable Realtime

After creating the tables, enable Realtime for all three:

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Enable replication for:
   - `public_posts` table
   - `post_replies` table
   - `private_messages` table

Alternatively, you can run this SQL:

```sql
-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
```

## Complete Setup Script

You can run this entire script at once:

```sql
-- Create public_posts table
CREATE TABLE public_posts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_replies table
CREATE TABLE post_replies (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  reply TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create private_messages table
CREATE TABLE private_messages (
  id BIGSERIAL PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Enable all access for public_posts" ON public_posts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for post_replies" ON post_replies
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for private_messages" ON private_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
```

## How to Execute

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/erjqbvgawmpjqusamblk
2. Click on **SQL Editor** in the left sidebar
3. Copy and paste the complete setup script above
4. Click **Run** to execute

That's it! Your Secret Chat Lite backend with private messaging is now ready.