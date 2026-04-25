#!/usr/bin/env node

/**
 * Database Seed Script
 * Seeds the database with users, workspaces (teams), and workspace members (roles).
 * Usage: pnpm run seed-db
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Error: Missing Supabase credentials");
  console.error(
    "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

console.log("🚀 Starting Database Seeder...");
console.log(`📌 Supabase URL: ${supabaseUrl}`);

// Create Supabase client with service role (admin access)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  {
    email: "superadmin@example.com",
    password: "password",
    full_name: "Super Admin",
  },
  {
    email: "alice@example.com",
    password: "password",
    full_name: "Alice Smith",
  },
  {
    email: "bob@example.com",
    password: "password",
    full_name: "Bob Jones",
  },
  {
    email: "charlie@example.com",
    password: "password",
    full_name: "Charlie Brown",
  },
];

async function seedDatabase() {
  try {
    const createdUsers = [];

    console.log("\n👥 Seeding Users...");
    const { data: existingUsersData } = await supabase.auth.admin.listUsers();
    const existingUsersList = existingUsersData?.users || [];

    for (const u of USERS) {
      // Check if user already exists
      let user = existingUsersList.find((dbUser) => dbUser.email === u.email);

      if (!user) {
        // Create user
        const { data, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name },
        });
        if (error)
          throw new Error(`Failed to create user ${u.email}: ${error.message}`);
        user = data.user;
        console.log(`✓ Created user: ${u.email} (${user.id})`);
      } else {
        console.log(`✓ User already exists: ${u.email} (${user.id})`);
      }

      // Check user profile exists
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        // Insert user profile
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            full_name: u.full_name,
          });
        if (profileError)
          throw new Error(
            `Failed to create profile for ${u.email}: ${profileError.message}`,
          );
      } else {
        // Update user profile
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({
            full_name: u.full_name,
          })
          .eq("id", user.id);
        if (profileError)
          throw new Error(
            `Failed to update profile for ${u.email}: ${profileError.message}`,
          );
      }

      createdUsers.push({ ...u, id: user.id });
    }

    const adminUser = createdUsers.find((u) => u.email === "superadmin@example.com");
    const alice = createdUsers.find((u) => u.email === "alice@example.com");
    const bob = createdUsers.find((u) => u.email === "bob@example.com");
    const charlie = createdUsers.find((u) => u.email === "charlie@example.com");

    console.log("\n🏢 Seeding Workspaces (Teams)...");

    // Find existing workspaces for admin
    const { data: existingWorkspaces } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_id", adminUser.id);

    let hqWorkspace = existingWorkspaces?.find((w) => w.name === "Global HQ");
    if (!hqWorkspace) {
      const { data, error } = await supabase
        .from("workspaces")
        .insert({
          name: "Global HQ",
          owner_id: adminUser.id,
        })
        .select()
        .single();
      if (error)
        throw new Error(
          `Failed to create Global HQ workspace: ${error.message}`,
        );
      hqWorkspace = data;
      console.log(`✓ Created workspace: Global HQ (${hqWorkspace.id})`);
    } else {
      console.log(`✓ Workspace already exists: Global HQ (${hqWorkspace.id})`);
    }

    let engineeringWorkspace = existingWorkspaces?.find(
      (w) => w.name === "Engineering Team",
    );
    if (!engineeringWorkspace) {
      const { data, error } = await supabase
        .from("workspaces")
        .insert({
          name: "Engineering Team",
          owner_id: adminUser.id,
        })
        .select()
        .single();
      if (error)
        throw new Error(
          `Failed to create Engineering Team workspace: ${error.message}`,
        );
      engineeringWorkspace = data;
      console.log(
        `✓ Created workspace: Engineering Team (${engineeringWorkspace.id})`,
      );
    } else {
      console.log(
        `✓ Workspace already exists: Engineering Team (${engineeringWorkspace.id})`,
      );
    }

    // Prepare members
    const membersToInsert = [
      // Global HQ Members
      { workspace_id: hqWorkspace.id, user_id: adminUser.id, role: "owner" },
      { workspace_id: hqWorkspace.id, user_id: alice.id, role: "admin" },

      // Engineering Team Members
      {
        workspace_id: engineeringWorkspace.id,
        user_id: adminUser.id,
        role: "owner",
      },
      {
        workspace_id: engineeringWorkspace.id,
        user_id: alice.id,
        role: "admin",
      },
      {
        workspace_id: engineeringWorkspace.id,
        user_id: bob.id,
        role: "member",
      },
      {
        workspace_id: engineeringWorkspace.id,
        user_id: charlie.id,
        role: "viewer",
      },
    ];

    console.log("\n🔗 Assigning Roles (Workspace Members)...");
    for (const member of membersToInsert) {
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", member.workspace_id)
        .eq("user_id", member.user_id)
        .maybeSingle();

      if (!existingMember) {
        const { error } = await supabase
          .from("workspace_members")
          .insert(member);
        if (error) {
          console.error(
            `⚠️ Failed to assign role to User ID ${member.user_id}:`,
            error.message,
          );
        } else {
          console.log(
            `✓ Assigned role '${member.role}' to User ID ${member.user_id}`,
          );
        }
      } else {
        const { error } = await supabase
          .from("workspace_members")
          .update({ role: member.role })
          .eq("id", existingMember.id);
        if (error) {
          console.error(
            `⚠️ Failed to update role for User ID ${member.user_id}:`,
            error.message,
          );
        } else {
          console.log(
            `✓ Updated role '${member.role}' for User ID ${member.user_id}`,
          );
        }
      }
    }

    console.log("\n✅ Database seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error.message);
    process.exit(1);
  }
}

seedDatabase();
