"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.email !== "superadmin@example.com") {
      router.push("/workspaces")
    }
  }, [user, loading, router])

  if (loading || user?.email !== "superadmin@example.com") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Prodeo Admin Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/workspaces")}
              className="text-sm hover:underline text-muted-foreground"
            >
              Back to Workspaces
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
