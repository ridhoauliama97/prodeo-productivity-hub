"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { fetchWorkspacesApi, createWorkspaceApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { ProfileModal } from "@/components/modals/profile-modal";
import type { Workspace } from "@/lib/types";

export default function WorkspacesPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();

  const userId = user?.id;

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      router.push("/login");
      return;
    }

    loadWorkspaces();
  }, [userId, authLoading, router]);

  const loadWorkspaces = async () => {
    try {
      const data = await fetchWorkspacesApi();
      setWorkspaces(data || []);
    } catch (err: any) {
      console.error("Error fetching workspaces:", err.message);
      toast.error(err.message || "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const workspace = await createWorkspaceApi(newWorkspaceName);
      setWorkspaces([...workspaces, workspace]);
      setNewWorkspaceName("");
      toast.success("Workspace created!");
    } catch (err: any) {
      console.error("Error creating workspace:", err.message);
      toast.error(err.message || "Failed to create workspace");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prodeo</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsProfileOpen(true)}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">My Workspaces</h2>

          {/* Create new workspace */}
          <form
            onSubmit={handleCreateWorkspace}
            className="mb-6 p-4 border rounded-lg bg-card"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New workspace name..."
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md bg-background"
              />
              <Button type="submit" disabled={!newWorkspaceName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </form>

          {/* Workspaces grid */}
          {workspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((workspace) => (
                <Card
                  key={workspace.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardContent className="p-6">
                    <Link href={`/workspace/${workspace.id}`}>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {workspace.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Created{" "}
                            {new Date(
                              workspace.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <Button className="w-full" variant="outline">
                          Open Workspace
                        </Button>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No workspaces yet. Create one to get started!
              </p>
            </div>
          )}
        </div>
      </main>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </div>
  );
}
