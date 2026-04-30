"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    
    const checkSession = async () => {
      // 1. Check for direct OTP in URL (Testing Mode / Bypass)
      const searchParams = new URLSearchParams(window.location.search);
      const emailParam = searchParams.get('email');
      const tokenParam = searchParams.get('token');

      if (emailParam && tokenParam) {
        console.log("Direct OTP detected, verifying...");
        const { error } = await supabase.auth.verifyOtp({
          email: emailParam,
          token: tokenParam,
          type: 'recovery'
        });

        if (error) {
          console.error("Direct verification error:", error);
          toast.error("Verification failed: " + error.message);
        } else {
          console.log("Direct verification successful!");
          setVerifying(false);
          return;
        }
      }

      // 2. Check for existing session or hash fragment
      const url = window.location.href;
      const hasCredentials = url.includes('access_token=') || url.includes('code=') || url.includes('token_hash=');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setVerifying(false);
      } else if (!hasCredentials && !emailParam) {
        // No session, no hash, no OTP params - this is actually invalid
        const timeout = setTimeout(() => {
          toast.error("No active session found. Please request a new link.");
          router.push("/login");
        }, 3000);
        return () => clearTimeout(timeout);
      } else {
        // Polling as a last resort for hash fragments
        const interval = setInterval(async () => {
          const { data: { session: s } } = await supabase.auth.getSession();
          if (s) {
            setVerifying(false);
            clearInterval(interval);
          }
        }, 1500);
        return () => clearInterval(interval);
      }
    };
    
    checkSession();

    // Listen for auth state changes as well
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setVerifying(false);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Password has been reset successfully");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || verifying) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030303]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
          <div className="text-center space-y-2">
            <p className="text-zinc-400 font-medium animate-pulse">Verifying secure link...</p>
            <p className="text-zinc-600 text-xs max-w-[250px]">
              Supabase is establishing a secure session from your reset link.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-zinc-500 border-zinc-800 hover:bg-zinc-900"
            onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) setVerifying(false);
                else toast.error("Still waiting for session...");
            }}
          >
            Check Session Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="relative w-40 h-20">
          <Image
            src={
              resolvedTheme === "dark"
                ? "/logo-bg-dark.png"
                : "/logo-bg-white.png"
            }
            alt="Prodeo Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl shadow-primary/5 border-primary/5">
        <CardHeader className="space-y-2 pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create New Password
          </CardTitle>
          <CardDescription>
            Enter your new password below to regain access to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={
                  confirmPassword && password !== confirmPassword
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
