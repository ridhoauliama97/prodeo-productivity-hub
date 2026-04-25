# 🚀 START HERE - Notion Clone Deployment Guide

Your **production-ready Notion clone** is built! Your Supabase credentials are configured. Follow this guide to run it locally in 5 minutes.

## ⚡ Quick Start (5 Minutes)

### Step 1: Initialize Database (2 min)
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **SQL Editor** → **New Query**
3. Open `scripts/01-init-database.sql` from your project folder
4. Copy the entire contents and paste into Supabase
5. Click **Run** button
6. Wait for "Query successful" ✅

**Note:** If you get a permission error, see `SQL_PERMISSION_FIX.md` (already fixed!)

### Step 2: Install & Run (3 min)
```bash
pnpm install
pnpm dev
```

Visit: **http://localhost:3000** 🎉

## ✅ What You Have

A complete Notion clone with:
- ✅ User authentication (signup/login)
- ✅ Team workspaces
- ✅ Rich text documents
- ✅ Databases with custom fields
- ✅ 4 view types: Table, Board, Gallery, Calendar
- ✅ Real-time collaboration
- ✅ Full TypeScript/React code
- ✅ Production security

## 📚 Documentation

| File | Purpose | Time |
|------|---------|------|
| **QUICK_REFERENCE.md** | Commands & structure | 2 min |
| **README.md** | Features & overview | 5 min |
| **GETTING_STARTED.md** | Feature walkthrough | 10 min |
| **DEPLOYMENT.md** | Deploy to production | 15 min |
| **TROUBLESHOOTING.md** | Common issues | As needed |

## 🎯 Next Steps

1. **Initialize database** (follow Step 1 above)
2. **Run locally** (follow Step 2 above)
3. **Test features**:
   - Sign up at `/signup`
   - Create a workspace
   - Create a document
   - Create a database
   - Try different views
4. **Deploy** (when ready - see DEPLOYMENT.md)

## 🔧 Your Supabase Setup

✅ **Configured:**
- URL: `https://db.facadidhognljvafbcii.supabase.co`
- Environment variables set in `.env.local`
- Ready to initialize database

✅ **Next:**
- Run SQL schema from `scripts/01-init-database.sql`
- Verify with: `pnpm run verify-db`

## 📋 Project Structure

```
├── app/                    # Pages (landing, auth, editor)
├── components/             # Rich editor, database views
├── lib/                    # Auth, database clients
├── scripts/               # Database schema SQL
└── Docs: README, DEPLOYMENT, etc.
```

## 🐛 If Something Goes Wrong

| Error | Fix |
|-------|-----|
| "Table already exists" | Continue - it's fine! |
| Cannot connect | Check `.env.local` has credentials |
| Port 3000 in use | `pnpm dev -- -p 3001` |
| Dependencies fail | `pnpm install --force` |

See **TROUBLESHOOTING.md** for more help.

## 💡 Database Details

9 tables created automatically:
- `workspaces`, `user_profiles`, `workspace_members`
- `pages`, `blocks`
- `database_fields`, `database_rows`, `database_values`
- `page_sharing`

All with row-level security and real-time enabled.

## 🚀 Ready?

```bash
# Do these 3 things:
1. Initialize database (see Step 1 above)
2. pnpm install
3. pnpm dev
```

Then open http://localhost:3000 and start building! 🎉

---

**Questions?** Read the docs above or check **TROUBLESHOOTING.md**

**Ready to deploy?** See **DEPLOYMENT.md**
