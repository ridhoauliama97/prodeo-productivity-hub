#!/bin/bash

echo "🚀 Notion Clone - Getting Started"
echo "=================================="
echo ""
echo "This script will help you set up your Notion clone."
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ .env.local found"
else
    echo "⚠️  .env.local not found - creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local"
        echo ""
        echo "📝 Important: Edit .env.local and add your Supabase credentials:"
        echo "   NEXT_PUBLIC_SUPABASE_URL=..."
        echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=..."
        echo "   SUPABASE_SERVICE_ROLE_KEY=..."
    fi
fi

echo ""
echo "📋 SETUP CHECKLIST:"
echo ""
echo "1. Initialize Database (in Supabase Dashboard)"
echo "   - Go to SQL Editor → New Query"
echo "   - Copy: scripts/01-init-database.sql"
echo "   - Run the query"
echo ""
echo "2. Install dependencies"
echo "   pnpm install"
echo ""
echo "3. Start dev server"
echo "   pnpm dev"
echo ""
echo "4. Open browser"
echo "   http://localhost:3000"
echo ""
echo "5. Sign up and start using!"
echo ""
echo "📚 Read documentation:"
echo "   - START_HERE.md      → Quick orientation"
echo "   - QUICK_REFERENCE.md → Commands & structure"
echo "   - README.md          → Full overview"
echo "   - DEPLOYMENT.md      → Deploy to production"
echo ""
echo "✨ You're all set! Follow the checklist above to get started."
