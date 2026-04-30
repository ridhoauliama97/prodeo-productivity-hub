"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Command } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [testData, setTestData] = useState<{ link?: string, email?: string, token?: string } | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [lang, setLang] = useState<"en" | "id">("en");

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("landing-lang") as "en" | "id";
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleLang = (newLang: "en" | "id") => {
    setLang(newLang);
    localStorage.setItem("landing-lang", newLang);
  };

  const { signIn, resetPassword } = useAuth();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error(lang === "id" ? "Email harus diisi" : "Email is required");
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      toast.error(
        lang === "id" ? "Kata sandi harus diisi" : "Password is required",
      );
      return;
    }

    setLoading(true);

    try {
      document.cookie = `rememberMe=${rememberMe ? "true" : "false"}; path=/; max-age=31536000`;
      localStorage.setItem("rememberMe", rememberMe ? "true" : "false");
      await signIn(trimmedEmail, password);
      toast.success(lang === "id" ? "Login berhasil" : "Login successful");
      router.push("/workspaces");
    } catch (err: any) {
      const errorMsg =
        err.message || (lang === "id" ? "Gagal masuk" : "Failed to sign in");
      toast.error(errorMsg);
      setError(errorMsg);
      setEmail("");
      setPassword("");
      emailRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = resetEmail.trim();
    if (!trimmedEmail) {
      toast.error(lang === "id" ? "Email harus diisi" : "Email is required");
      return;
    }

    setLoading(true);
    setTestData(null);
    try {
      const data = await resetPassword(trimmedEmail);
      if (data?.link) {
        setTestData(data);
        toast.info(
          lang === "id"
            ? "Mode Testing: Gunakan tombol di bawah untuk reset"
            : "Testing Mode: Use the button below to reset",
        );
      } else {
        toast.success(
          lang === "id"
            ? "Instruksi reset password telah dikirim ke email Anda"
            : "Password reset instructions have been sent to your email",
        );
        setIsForgotPassword(false);
      }
    } catch (err: any) {
      if (err.message?.includes("rate limit")) {
        toast.error(
          lang === "id"
            ? "Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba lagi."
            : "Too many requests. Please wait a moment before trying again.",
        );
      } else {
        toast.error(err.message || "Failed to send reset link");
      }
    } finally {
      setLoading(false);
    }
  };

  const content = {
    en: {
      welcome: "Welcome Back 👋",
      desc: "Enter your credentials to access Prodeo",
      email: "Email",
      emailPlaceholder: "name@example.com",
      password: "Password",
      forgotPassword: "Forgot password?",
      rememberMe: "Remember me",
      signIn: "Sign In",
      signingIn: "Signing in...",
      noAccount: "Don't have an account?",
      signUp: "Sign Up",
      error: "Failed to sign in",
      forgotPassTitle: "Reset Password",
      forgotPassDesc: "Enter your email to receive a password reset link",
      sendLink: "Send Reset Link",
      sendingLink: "Sending...",
      backToLogin: "Back to Login",
    },
    id: {
      welcome: "Selamat Datang Kembali 👋",
      desc: "Masukkan kredensial Anda untuk mengakses Prodeo",
      email: "Email",
      emailPlaceholder: "nama@contoh.com",
      password: "Kata Sandi",
      forgotPassword: "Lupa kata sandi?",
      rememberMe: "Ingat saya",
      signIn: "Masuk",
      signingIn: "Masuk...",
      noAccount: "Belum punya akun?",
      signUp: "Daftar",
      error: "Gagal masuk",
      forgotPassTitle: "Reset Kata Sandi",
      forgotPassDesc: "Masukkan email Anda untuk menerima tautan reset kata sandi",
      sendLink: "Kirim Tautan Reset",
      sendingLink: "Mengirim...",
      backToLogin: "Kembali ke Login",
    },
  }[lang];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="h-9 flex items-center bg-muted/50 rounded-full border border-border/50 p-1">
          <button
            onClick={() => toggleLang("en")}
            className={cn(
              "px-3 h-full text-[10px] font-black rounded-full transition-all duration-300",
              lang === "en"
                ? "bg-background shadow-sm text-primary"
                : "text-muted-foreground/60 hover:text-foreground",
            )}
          >
            EN
          </button>
          <button
            onClick={() => toggleLang("id")}
            className={cn(
              "px-3 h-full text-[10px] font-black rounded-full transition-all duration-300",
              lang === "id"
                ? "bg-background shadow-sm text-primary"
                : "text-muted-foreground/60 hover:text-foreground",
            )}
          >
            ID
          </button>
        </div>
      </div>
      {/* App Logo */}
      <div className="mb-2 flex flex-col items-center gap-4 group cursor-default">
        <div className="relative w-50 h-30 group-hover:scale-110 transition-transform duration-500">
          <Link href="/" className="cursor-pointer relative block w-full h-full">
            {mounted ? (
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
            ) : (
              <div className="w-full h-full bg-primary/10 rounded-2xl animate-pulse" />
            )}
          </Link>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl shadow-primary/5 border-primary/5">
        <CardHeader className="space-y-2 pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isForgotPassword ? content.forgotPassTitle : content.welcome}
          </CardTitle>
          <CardDescription>
            {isForgotPassword ? content.forgotPassDesc : content.desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isForgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="reset-email">{content.email}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder={content.emailPlaceholder}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? content.sendingLink : content.sendLink}
              </Button>

              {testData && (
                <div className="p-3 border border-amber-500/20 bg-amber-500/10 rounded-lg space-y-2 animate-in zoom-in-95 duration-300">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                    Testing Mode
                  </p>
                  <p className="text-xs text-zinc-400">
                    {lang === "id" 
                      ? "Email tidak terkirim karena Resend belum aktif. Klik tombol di bawah untuk langsung ke halaman reset." 
                      : "Email not sent because Resend is not set up. Click the button below to go to the reset page."}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10 h-8 text-xs font-bold"
                    onClick={() => {
                        // Use the internal reset page with direct token verification
                        router.push(`/auth/reset-password?email=${testData.email}&token=${testData.token}`);
                    }}
                  >
                    Open Reset Page (Direct)
                  </Button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-sm text-primary hover:underline font-medium py-2"
              >
                {content.backToLogin}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">{content.email}</Label>
                <Input
                  id="email"
                  type="email"
                  ref={emailRef}
                  autoFocus
                  placeholder={content.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{content.password}</Label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {content.forgotPassword}
                  </button>
                </div>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your Password"
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

              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {content.rememberMe}
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? content.signingIn : content.signIn}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t py-4">
          <p className="text-sm text-muted-foreground">
            {content.noAccount}{" "}
            <Link
              href="/signup"
              className="text-primary hover:underline font-bold"
            >
              {content.signUp}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
