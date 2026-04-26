"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Sun,
  ArrowRight,
  Sparkles,
  Type,
  Database,
  Layout,
  Users,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [lang, setLang] = useState<"en" | "id">("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("landing-lang") as "en" | "id";
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleLang = (newLang: "en" | "id") => {
    setLang(newLang);
    localStorage.setItem("landing-lang", newLang);
  };

  const userId = user?.id;

  useEffect(() => {
    if (!loading && userId) {
      router.push("/workspaces");
    }
  }, [userId, loading, router]);

  const content = {
    en: {
      signIn: "Sign In",
      getStarted: "Get Started",
      sparkle: "Now with Real-time Collaboration",
      heroTitle: (
        <>
          Productivity Hub <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            Your All-in-One Workspace
          </span>
        </>
      ),
      heroDesc: "Create, organize, and collaborate on documents and databases in one unified platform. Perfect for teams and individuals who want to stay productive and aligned.",
      startFree: "Start for Free",
      bookDemo: "Book a Demo",
      featuresTitle: "Everything you need to work better",
      featuresDesc: "Powerful features designed to help your team organize knowledge and manage projects effortlessly.",
      features: [
        {
          title: "Rich Text Editing",
          description: "Format text with headings, bold, italics, lists, code blocks, and more.",
          icon: <Type className="w-6 h-6 text-primary" />,
        },
        {
          title: "Database Tables",
          description: "Create structured data with custom fields, tags, and dynamic statuses.",
          icon: <Database className="w-6 h-6 text-primary" />,
        },
        {
          title: "Multiple Views",
          description: "Switch seamlessly between Table, Board, Gallery, and Calendar views.",
          icon: <Layout className="w-6 h-6 text-primary" />,
        },
        {
          title: "Real-time Chat",
          description: "Communicate with your team instantly, complete with read receipts.",
          icon: <Users className="w-6 h-6 text-primary" />,
        },
        {
          title: "Workspaces",
          description: "Organize projects, manage access, and invite team members easily.",
          icon: <FolderOpen className="w-6 h-6 text-primary" />,
        },
        {
          title: "Fully Secure",
          description: "Enterprise-grade security with row-level policies and robust authentication.",
          icon: <ShieldCheck className="w-6 h-6 text-primary" />,
        },
      ],
      ctaTitle: "Ready to transform your workflow?",
      ctaDesc: "Join thousands of teams staying productive with Prodeo. No credit card required.",
      ctaBtn: "Get Started for Free",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact",
    },
    id: {
      signIn: "Masuk",
      getStarted: "Mulai Sekarang",
      sparkle: "Sekarang dengan Kolaborasi Real-time",
      heroTitle: (
        <>
          Pusat Produktivitas <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            Ruang Kerja All-in-One Anda
          </span>
        </>
      ),
      heroDesc: "Buat, atur, dan berkolaborasi pada dokumen dan database dalam satu platform terpadu. Sempurna untuk tim dan individu yang ingin tetap produktif dan selaras.",
      startFree: "Mulai Gratis",
      bookDemo: "Jadwalkan Demo",
      featuresTitle: "Segala yang Anda butuhkan untuk bekerja lebih baik",
      featuresDesc: "Fitur canggih yang dirancang untuk membantu tim Anda mengatur pengetahuan dan mengelola proyek dengan mudah.",
      features: [
        {
          title: "Editor Teks Kaya",
          description: "Format teks dengan judul, tebal, miring, daftar, blok kode, dan lainnya.",
          icon: <Type className="w-6 h-6 text-primary" />,
        },
        {
          title: "Tabel Database",
          description: "Buat data terstruktur dengan kolom khusus, tag, dan status dinamis.",
          icon: <Database className="w-6 h-6 text-primary" />,
        },
        {
          title: "Berbagai Tampilan",
          description: "Beralih dengan mulus antara tampilan Tabel, Papan, Galeri, dan Kalender.",
          icon: <Layout className="w-6 h-6 text-primary" />,
        },
        {
          title: "Chat Real-time",
          description: "Berkomunikasi dengan tim Anda secara instan, lengkap dengan tanda terima baca.",
          icon: <Users className="w-6 h-6 text-primary" />,
        },
        {
          title: "Ruang Kerja",
          description: "Atur proyek, kelola akses, dan undang anggota tim dengan mudah.",
          icon: <FolderOpen className="w-6 h-6 text-primary" />,
        },
        {
          title: "Keamanan Penuh",
          description: "Keamanan tingkat perusahaan dengan kebijakan tingkat baris dan autentikasi yang kuat.",
          icon: <ShieldCheck className="w-6 h-6 text-primary" />,
        },
      ],
      ctaTitle: "Siap untuk mengubah alur kerja Anda?",
      ctaDesc: "Bergabunglah dengan ribuan tim yang tetap produktif bersama Prodeo. Tanpa kartu kredit.",
      ctaBtn: "Mulai Sekarang Gratis",
      privacy: "Privasi",
      terms: "Ketentuan",
      contact: "Kontak",
    }
  }[lang];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Image
            src={
              resolvedTheme === "dark"
                ? "/logo-bg-dark.png"
                : "/logo-bg-white.png"
            }
            alt="Prodeo"
            width={280}
            height={80}
            className="h-20 w-auto object-contain"
            style={{ width: "auto" }}
            priority
          />
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline">{content.signIn}</Button>
            </Link>
            <Link href="/signup">
              <Button>{content.getStarted}</Button>
            </Link>
            
            <div className="h-9 flex items-center bg-muted/50 rounded-full border border-border/50 p-1 mx-1">
              <button
                onClick={() => toggleLang("en")}
                className={cn(
                  "px-2 h-full text-[10px] font-black rounded-full transition-all duration-300",
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
                  "px-2 h-full text-[10px] font-black rounded-full transition-all duration-300",
                  lang === "id"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground/60 hover:text-foreground",
                )}
              >
                ID
              </button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="rounded-full"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden max-w-6xl mx-auto px-4 py-32 text-center">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <Sparkles className="w-4 h-4" />
            <span>{content.sparkle}</span>
          </div>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold mb-6 text-balance tracking-tight"
        >
          {content.heroTitle}
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance leading-relaxed"
        >
          {content.heroDesc}
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/signup">
            <Button
              size="lg"
              className="px-8 h-12 text-base rounded-full gap-2"
            >
              {content.startFree} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="px-8 h-12 text-base rounded-full"
          >
            {content.bookDemo}
          </Button>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t bg-background/50 backdrop-blur-sm overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              {content.featuresTitle}
            </h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {content.featuresDesc}
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {content.features.map((feature, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
                className="group p-8 bg-card rounded-2xl border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto bg-card border rounded-3xl p-12 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <h3 className="text-4xl font-bold mb-6">
              {content.ctaTitle}
            </h3>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              {content.ctaDesc}
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="px-10 h-14 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                {content.ctaBtn}
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <Image
              src={
                resolvedTheme === "dark"
                  ? "/logo-bg-dark.png"
                  : "/logo-bg-white.png"
              }
              alt="Prodeo Icon"
              width={150}
              height={100}
            />
            <span className="font-semibold text-foreground"></span>
          </div>
          <p>
            &copy; {new Date().getFullYear()} Prodeo : Productivity Hub. All
            rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">
              {content.privacy}
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              {content.terms}
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              {content.contact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
