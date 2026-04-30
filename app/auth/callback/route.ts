import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server-client";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/workspaces";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    const redirectUrl = new URL(next, origin);
    redirectUrl.searchParams.set("auth_error", error);
    if (errorDescription) {
      redirectUrl.searchParams.set("auth_error_description", errorDescription);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();

    // Exchange the code for a session
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      const redirectUrl = new URL(next, origin);
      redirectUrl.searchParams.set("auth_error", "exchange_failed");
      return NextResponse.redirect(redirectUrl);
    }

    // If we have a session with provider token, store it
    if (data?.session) {
      const session = data.session;
      const providerToken = session.provider_token;
      const providerRefreshToken = session.provider_refresh_token;
      const user = session.user;

      console.log("Auth Callback: Session found for user", user?.id);
      console.log("Auth Callback: Provider Token exists:", !!providerToken);
      console.log(
        "Auth Callback: Refresh Token exists:",
        !!providerRefreshToken,
      );

      if (providerToken && user) {
        try {
          // Find the Google identity to get the email
          const googleIdentity = user.identities?.find(
            (identity) => identity.provider === "google",
          );
          const googleEmail =
            googleIdentity?.identity_data?.email || user.email;

          console.log("Auth Callback: Storing tokens for", googleEmail);

          // Store the tokens using admin client (bypasses RLS for reliability)
          const admin = createAdminClient();

          const { error: upsertError } = await admin
            .from("google_tokens")
            .upsert(
              {
                user_id: user.id,
                provider_token: providerToken,
                provider_refresh_token: providerRefreshToken || null,
                email: googleEmail,
                scopes:
                  "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email",
                expires_at: new Date(
                  Date.now() + 3600 * 1000, // Google tokens typically expire in 1 hour
                ).toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "user_id",
              },
            );

          if (upsertError) {
            console.error(
              "Auth Callback: Error upserting to google_tokens:",
              upsertError,
            );
          } else {
            console.log("Auth Callback: Google tokens stored successfully");
          }
        } catch (tokenError) {
          console.error(
            "Auth Callback: Unexpected error storing Google tokens:",
            tokenError,
          );
        }
      } else {
        console.warn(
          "Auth Callback: Missing providerToken or user. Check Supabase OAuth settings.",
        );
      }
    }

    // Redirect to the profile page with success indicator
    const redirectUrl = new URL(next, origin);
    redirectUrl.searchParams.set("google_linked", "true");
    return NextResponse.redirect(redirectUrl);
  }

  // No code provided, redirect to home
  return NextResponse.redirect(new URL(next, origin));
}
