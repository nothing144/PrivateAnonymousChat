# Secret Chat Lite

An anonymous real-time communication platform where users can post public messages and send private messages using temporary IDs.

## Features

✅ **Ephemeral IDs**: Auto-generated 5-character IDs (e.g., E4D9X) for each session
✅ **Public Wall**: Post messages visible to everyone  
✅ **Public Replies**: Reply to any post on the public wall
✅ **Private Messaging**: Send direct messages to any user ID
✅ **Search by ID**: Find posts from specific users
✅ **Real-time Updates**: Instant message delivery using Supabase Realtime
✅ **Auto Cleanup**: All messages deleted when user leaves (reload/close)
✅ **Dark Theme**: Clean, minimal UI design

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Real-time**: Supabase Realtime subscriptions

## Setup Instructions

### 1. Supabase Database Setup

Go to your Supabase SQL Editor and run this script:

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

-- Enable RLS
ALTER TABLE public_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
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

### 2. Environment Variables

Create a `.env` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install & Run

```bash
# Install dependencies
yarn install

# Run development server
yarn dev
```

Open [https://chatanonymouslyy.netlify.app/](https://chatanonymouslyy.netlify.app/)

## How It Works

### Public Wall Flow:
1. User opens app → gets ephemeral ID (e.g., SUM8H)
2. User posts: "Anyone free to chat?"
3. Other users see the post in real-time
4. Anyone can reply publicly
5. Search for specific IDs to filter posts

### Private Messaging Flow:
1. User sees ID in public post (e.g., 6XPPI)
2. Switch to "Private Messages" tab
3. Enter the ID and send a private message
4. Real-time conversation with that user
5. Messages are private between the two users

### Auto Cleanup:
- **Public Wall**: Messages persist and visible to everyone (deleted after 12 hours)
- **Private Messages**: Deleted immediately when user reloads/closes browser
- **New Ephemeral ID**: Generated on every page load

## Project Structure

```
/app
├── app/
│   ├── page.js           # Main app component
│   ├── layout.js         # App layout
│   └── globals.css       # Global styles
├── lib/
│   └── supabase.js       # Supabase client
├── components/ui/        # shadcn components
└── .env                  # Environment variables
```

## Key Features Explained

### Ephemeral IDs
- Generated on every page load
- 5 uppercase alphanumeric characters
- No persistence across sessions

### Real-time Updates
- Supabase Realtime subscriptions
- Instant message delivery
- No polling required

### Privacy & Data Retention
- No authentication required
- No user data stored
- **Public messages**: Persist for 12 hours (visible to all)
- **Private messages**: Deleted immediately on browser close/reload
- Truly anonymous communication with ephemeral IDs

## License

MIT
