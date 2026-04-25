"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
          <h1 className="text-2xl font-bold">Prodeo</h1>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-4 text-balance">
          Productivity Hub <br /> Your All-in-One Workspace
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
          Create, organize, and collaborate on documents and databases in one
          unified platform. Perfect for teams and individuals who want to stay
          productive.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="px-8">
              Start Free
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="px-8">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card py-20 border-t">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Rich Text Editing",
                description:
                  "Format text with headings, bold, italics, lists, and more",
              },
              {
                title: "Database Tables",
                description:
                  "Create structured data with custom fields and organize information",
              },
              {
                title: "Multiple Views",
                description:
                  "Switch between Table, Board, Gallery, and Calendar views",
              },
              {
                title: "Real-time Collaboration",
                description: "Work together with your team with live updates",
              },
              {
                title: "Workspaces",
                description: "Organize projects and invite team members",
              },
              {
                title: "Fully Local",
                description:
                  "Deploy and run entirely on your own infrastructure",
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
        <p className="text-muted-foreground mb-6">
          Join thousands of teams staying productive with Prodeo
        </p>
        <Link href="/signup">
          <Button size="lg" className="px-8">
            Create Your Account
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2026 Prodeo : Productivity Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
