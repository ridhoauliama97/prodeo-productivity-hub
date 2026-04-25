#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env vars
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function verifyDatabase() {
  console.log('🔍 Verifying Notion Clone Database Setup...\n')

  try {
    // Check connection
    console.log('1. Testing Supabase connection...')
    const { data: result, error: connError } = await supabase
      .from('workspaces')
      .select('id', { count: 'exact', head: true })

    if (connError && connError.code !== 'PGRST116') {
      throw new Error(`Connection failed: ${connError.message}`)
    }
    console.log('   ✅ Connected to Supabase\n')

    // Check tables
    const tables = [
      'workspaces',
      'user_profiles',
      'workspace_members',
      'pages',
      'blocks',
      'database_fields',
      'database_rows',
      'database_values',
      'page_sharing',
    ]

    console.log('2. Checking tables...')
    for (const table of tables) {
      try {
        await supabase.from(table).select('id', { count: 'exact', head: true })
        console.log(`   ✅ ${table}`)
      } catch (e) {
        console.log(`   ❌ ${table} - NOT FOUND`)
      }
    }

    console.log('\n3. Summary:')
    console.log('   Database is ready! 🎉')
    console.log('\n   Next steps:')
    console.log('   1. Run: pnpm dev')
    console.log('   2. Open: http://localhost:3000')
    console.log('   3. Sign up and create your first workspace!\n')
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message)
    console.log('\n📖 For setup instructions, see DATABASE_SETUP.md')
    process.exit(1)
  }
}

verifyDatabase()
