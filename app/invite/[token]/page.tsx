import { createAdminClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface InvitePageProps {
  params: {
    token: string;
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = params;
  const admin = createAdminClient();

  // 1. Fetch invitation details
  const { data: invitation, error: inviteError } = await admin
    .from("invitations")
    .select(`
      *,
      workspaces (
        name
      ),
      inviter:user_profiles (
        full_name,
        avatar_url
      )
    `)
    .eq("token", token)
    .single();

  if (inviteError || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 2. Check if user is already logged in
  const { data: { user } } = await admin.auth.getUser();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">You've been invited!</CardTitle>
          <CardDescription className="text-base">
            <strong>{invitation.inviter?.full_name || "Someone"}</strong> has invited you to join the 
            <span className="text-primary font-semibold mx-1">"{invitation.workspaces?.name}"</span> 
            workspace on Prodeo Hub.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" /> What you'll get
            </h4>
            <ul className="text-sm space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Access to shared documents and databases
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Real-time collaboration with teammates
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Centralized project management
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {user ? (
            <form action={`/api/invite/accept`} method="POST" className="w-full">
              <input type="hidden" name="token" value={token} />
              <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20">
                Accept Invitation <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          ) : (
            <>
              <Button asChild className="w-full h-11 text-base shadow-lg shadow-primary/20">
                <Link href={`/signup?invite=${token}`}>
                  Sign Up to Join <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Already have an account? <Link href={`/login?invite=${token}`} className="text-primary font-semibold hover:underline">Log In</Link>
              </p>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
