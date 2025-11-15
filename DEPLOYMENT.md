# Deployment Guide - Netlify

## Prerequisites

1. ✅ Supabase tables created (see SUPABASE_SETUP.md)
2. ✅ GitHub account
3. ✅ Netlify account (free tier works perfectly)

## Step 1: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Secret Chat Lite"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/secret-chat-lite.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify**: https://app.netlify.com

2. **Click "Add new site" → "Import an existing project"**

3. **Connect to GitHub**:
   - Select your repository
   - Click "Authorize Netlify"

4. **Configure build settings**:
   - **Build command**: `yarn build`
   - **Publish directory**: `.next`
   - **Base directory**: (leave empty)

5. **Add Environment Variables**:
   - Click "Show advanced"
   - Click "New variable"
   - Add the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL = https://erjqbvgawmpjqusamblk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyanFidmdhd21wanF1c2FtYmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTQzODQsImV4cCI6MjA3ODc3MDM4NH0.18uqfJIF2rgZ1a7cJrqwXGO5lliYGL6rbV9BuBld_DU
   ```

6. **Click "Deploy site"**

7. **Wait for deployment** (usually 2-3 minutes)

8. **Your site is live!** 🎉
   - You'll get a URL like: `https://your-site-name.netlify.app`

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Set environment variables
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://erjqbvgawmpjqusamblk.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyanFidmdhd21wanF1c2FtYmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTQzODQsImV4cCI6MjA3ODc3MDM4NH0.18uqfJIF2rgZ1a7cJrqwXGO5lliYGL6rbV9BuBld_DU"

# Deploy
netlify deploy --prod
```

## Step 3: Configure Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow the instructions to configure DNS

## Environment Variables Required

| Variable Name | Description | Example |
|--------------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://erjqbvgawmpjqusamblk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure all environment variables are set correctly
- Verify Node version is 18 or higher

### App Loads but No Data
- Verify Supabase environment variables are correct
- Check Supabase tables are created
- Verify Realtime is enabled on all tables
- Check browser console for errors

### Private Messages Not Working
- Ensure `private_messages` table exists
- Verify Realtime is enabled for `private_messages`
- Check RLS policies are set correctly

## Post-Deployment Checklist

- ✅ Site loads successfully
- ✅ Ephemeral ID is generated
- ✅ Can post public messages
- ✅ Can reply to posts
- ✅ Can send private messages
- ✅ Real-time updates work
- ✅ Public messages persist after reload
- ✅ Private messages are deleted after reload
- ✅ Search functionality works

## Continuous Deployment

Once connected to GitHub, Netlify automatically:
- Deploys every push to main branch
- Runs builds on pull requests
- Provides deploy previews

Just push to GitHub and Netlify handles the rest!

```bash
git add .
git commit -m "Update feature"
git push
```

## Your Deployed App

After deployment, share your URL with users:
- `https://your-site-name.netlify.app`

Users can:
1. Visit the site
2. Get an ephemeral ID automatically
3. Post messages on the public wall
4. Send private messages to other IDs
5. All without any signup or authentication!

---

**Need help?** Check Netlify docs: https://docs.netlify.com