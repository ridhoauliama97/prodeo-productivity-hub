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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Command } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
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

  const { signUp } = useAuth();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName);
      router.push("/workspaces");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const content = {
    en: {
      welcome: "Create Account",
      desc: "Sign up to start using Prodeo",
      fullName: "Full Name",
      fullNamePlaceholder: "John Doe",
      email: "Email",
      emailPlaceholder: "name@example.com",
      password: "Password",
      confirmPassword: "Confirm Password",
      signUp: "Sign Up",
      creating: "Creating account...",
      alreadyAccount: "Already have an account?",
      signIn: "Sign In",
    },
    id: {
      welcome: "Buat Akun",
      desc: "Daftar untuk mulai menggunakan Prodeo",
      fullName: "Nama Lengkap",
      fullNamePlaceholder: "Budi Santoso",
      email: "Email",
      emailPlaceholder: "nama@contoh.com",
      password: "Kata Sandi",
      confirmPassword: "Konfirmasi Kata Sandi",
      signUp: "Daftar",
      creating: "Membuat akun...",
      alreadyAccount: "Sudah punya akun?",
      signIn: "Masuk",
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
          <CardDescription>{content.desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">{content.fullName}</Label>
              <Input
                id="fullName"
                placeholder={content.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="password">{content.password}</Label>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{content.confirmPassword}</Label>
              <div className="relative group">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? content.creating : content.signUp}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t py-4 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            {content.alreadyAccount}{" "}
            <Link href="/login" className="text-primary hover:underline font-bold">
              {content.signIn}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
