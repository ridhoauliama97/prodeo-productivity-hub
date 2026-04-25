## 🚀 Database Setup Instructions

Your Supabase credentials are now configured. Follow these steps to initialize your database:

### Step 1: Run the SQL Schema (2 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `/scripts/01-init-database.sql` from your project
6. Paste it into the SQL Editor
7. Click **Run** (▶️ button in bottom right)
8. Wait for success message

### Step 2: Verify Database (1 minute)

Run this in your terminal:
```bash
pnpm run verify-db
```

This will check:
- ✅ Supabase connection
- ✅ All required tables exist
- ✅ Row-level security is enabled

### Step 3: Start Development

```bash
pnpm install  # If you haven't already
pnpm dev
```

Visit `http://localhost:3000` and sign up!

---

## 📋 SQL Schema Overview

The initialization script creates:

| Table | Purpose |
|-------|---------|
| `workspaces` | Team/workspace containers |
| `user_profiles` | User account data |
| `workspace_members` | Team membership & roles |
| `pages` | Documents & databases |
| `blocks` | Page content (paragraphs, etc) |
| `database_fields` | Database column definitions |
| `database_rows` | Database entries |
| `database_values` | Cell data |
| `page_sharing` | Access permissions |

---

## ⚠️ Troubleshooting

### "Table already exists" error
This is normal! It means your database has been partially initialized. You can safely:
- Click **Run** again (it will skip existing tables)
- Or proceed to Step 3

### "Permission denied" error
- Make sure you're using your **Service Role Key**, not the Anon Key
- Check your `.env.local` file has the right credentials

### Connection failed
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys are correct
- Check that your Supabase project is active

---

## ✅ Testing Your Setup

Once initialized, try these in your app:

1. **Sign up** at `http://localhost:3000/signup`
2. **Create workspace** from dashboard
3. **Create a document** and edit it
4. **Create a database** and add fields
5. **Test views**: Switch between Table, Board, Gallery, Calendar
