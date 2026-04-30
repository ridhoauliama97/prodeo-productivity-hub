/**
 * Utility to send invitation emails via Resend.
 * To use this, add RESEND_API_KEY to your .env.local
 */

export async function sendInvitationEmail({
  to,
  workspaceName,
  inviterName,
  inviteLink,
}: {
  to: string;
  workspaceName: string;
  inviterName: string;
  inviteLink: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set. Email not sent automatically.");
    return { success: false, error: "API Key missing" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Prodeo Hub <onboarding@resend.dev>", // Note: For custom domains, you need to verify them in Resend
        to: [to],
        subject: `${inviterName} invited you to join ${workspaceName} on Prodeo Hub`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
            <h2 style="color: #333;">You've been invited!</h2>
            <p style="font-size: 16px; color: #555;">
              <strong>${inviterName}</strong> has invited you to join the <strong>"${workspaceName}"</strong> workspace on Prodeo Hub.
            </p>
            <div style="margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="font-size: 14px; color: #888;">
              If the button doesn't work, copy and paste this link into your browser: <br />
              <a href="${inviteLink}">${inviteLink}</a>
            </p>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #aaa;">
              Prodeo Hub - The all-in-one productivity tool.
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Resend API Error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

export async function sendPasswordResetEmail({
  to,
  resetLink,
}: {
  to: string;
  resetLink: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set. Email not sent automatically.");
    return { success: false, error: "API Key missing" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Prodeo Hub <onboarding@resend.dev>",
        to: [to],
        subject: "Reset your Prodeo Hub password",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="font-size: 16px; color: #555;">
              We received a request to reset your password for your Prodeo Hub account.
            </p>
            <div style="margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #888;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="font-size: 14px; color: #888;">
              If the button doesn't work, copy and paste this link into your browser: <br />
              <a href="${resetLink}">${resetLink}</a>
            </p>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #aaa;">
              Prodeo Hub - The all-in-one productivity tool.
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error: any) {
    console.error("Error sending reset email:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
