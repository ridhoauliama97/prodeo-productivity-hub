"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
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

  const userId = user?.id;

  useEffect(() => {
    if (!loading && userId) {
      router.push("/workspaces");
    }
  }, [userId, loading, router]);

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
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
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
            <span>Now with Real-time Collaboration</span>
          </div>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold mb-6 text-balance tracking-tight"
        >
          Productivity Hub <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            Your All-in-One Workspace
          </span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance leading-relaxed"
        >
          Create, organize, and collaborate on documents and databases in one
          unified platform. Perfect for teams and individuals who want to stay
          productive and aligned.
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
              Start for Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="px-8 h-12 text-base rounded-full"
          >
            Book a Demo
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
              Everything you need to work better
            </h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to help your team organize knowledge
              and manage projects effortlessly.
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
            {[
              {
                title: "Rich Text Editing",
                description:
                  "Format text with headings, bold, italics, lists, code blocks, and more.",
                icon: <Type className="w-6 h-6 text-primary" />,
              },
              {
                title: "Database Tables",
                description:
                  "Create structured data with custom fields, tags, and dynamic statuses.",
                icon: <Database className="w-6 h-6 text-primary" />,
              },
              {
                title: "Multiple Views",
                description:
                  "Switch seamlessly between Table, Board, Gallery, and Calendar views.",
                icon: <Layout className="w-6 h-6 text-primary" />,
              },
              {
                title: "Real-time Chat",
                description:
                  "Communicate with your team instantly, complete with read receipts.",
                icon: <Users className="w-6 h-6 text-primary" />,
              },
              {
                title: "Workspaces",
                description:
                  "Organize projects, manage access, and invite team members easily.",
                icon: <FolderOpen className="w-6 h-6 text-primary" />,
              },
              {
                title: "Fully Secure",
                description:
                  "Enterprise-grade security with row-level policies and robust authentication.",
                icon: <ShieldCheck className="w-6 h-6 text-primary" />,
              },
            ].map((feature, i) => (
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
              Ready to transform your workflow?
            </h3>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of teams staying productive with Prodeo. No credit
              card required.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="px-10 h-14 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Get Started for Free
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
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
