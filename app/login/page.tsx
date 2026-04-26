"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";
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

  const { signIn } = useAuth();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/workspaces");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
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
    }
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
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl shadow-primary/5 border-primary/5">
        <CardHeader className="space-y-2 pb-8">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {content.welcome}
          </CardTitle>
          <CardDescription>
            {content.desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{content.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={content.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{content.password}</Label>
                {/* <button
                  type="button"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {content.forgotPassword}
                </button> */}
              </div>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
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
        </CardContent>
        <CardFooter className="flex justify-center border-t py-4 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            {content.noAccount}{" "}
            <Link href="/signup" className="text-primary hover:underline font-bold">
              {content.signUp}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
