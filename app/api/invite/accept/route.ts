import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthUser } from '@/lib/auth-server'

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 2. Find invitation
  const { data: invitation, error: inviteError } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (inviteError || !invitation) {
    return NextResponse.json({ error: "Invitation not found or expired" }, { status: 404 });
  }

  // 3. Add user to workspace
  const { error: insertError } = await admin
    .from("workspace_members")
    .insert({
      workspace_id: invitation.workspace_id,
      user_id: user.id,
      role: invitation.role,
    });

  if (insertError) {
    // If user is already a member, just proceed to mark as accepted
    if (insertError.code !== "23505") {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // 4. Update invitation status
  await admin
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  // 5. Return success
  return NextResponse.json({ 
    success: true, 
    workspace_id: invitation.workspace_id 
  });
}
