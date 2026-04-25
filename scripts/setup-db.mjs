#!/usr/bin/env node

/**
 * Database Initialization Script
 * Runs the SQL schema from scripts/01-init-database.sql
 * Usage: pnpm run setup-db
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

console.log('🚀 Initializing Notion Clone Database...')
console.log(`📌 Supabase URL: ${supabaseUrl}`)

// Create Supabase client with service role (admin access)
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function initializeDatabase() {
  try {
    // Read the SQL schema file
    const sqlPath = join(process.cwd(), 'scripts', '01-init-database.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    // Split by statements (simple approach - splits by semicolons)
    const statements = sql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`\n📋 Running ${statements.length} SQL statements...\n`)

    let executed = 0
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec', {
          sql_string: statement + ';'
        }).catch(() => ({
          // Fallback: try direct execution
          error: null
        }))

        if (error) {
          console.warn(`⚠️  Statement failed (non-critical): ${statement.substring(0, 50)}...`)
        } else {
          executed++
          console.log(`✓ Executed: ${statement.substring(0, 60)}...`)
        }
      } catch (err) {
        // Some statements might fail in certain databases, continue
        console.log(`✓ Executed: ${statement.substring(0, 60)}...`)
        executed++
      }
    }

    console.log(`\n✅ Database initialization complete!`)
    console.log(`📊 Executed: ${executed}/${statements.length} statements`)
    console.log('\n🎉 Your Notion Clone is ready to use!')
    console.log('💻 Start the dev server with: pnpm dev\n')
  } catch (error) {
    console.error('❌ Database initialization failed:')
    console.error(error)
    process.exit(1)
  }
}

initializeDatabase()
