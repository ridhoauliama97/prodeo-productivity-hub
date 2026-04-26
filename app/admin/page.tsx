"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash, ShieldAlert } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface AdminUser {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { authFetch } = await import("@/lib/api-client")
      const res = await authFetch("/api/admin/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this user? This action cannot be undone.")) return
    
    try {
      const { authFetch } = await import("@/lib/api-client")
      const res = await authFetch(`/api/admin/users?id=${id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete user")
      toast.success("User deleted successfully")
      setUsers(users.filter(u => u.id !== id))
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Superadmin Dashboard</h2>
        <p className="text-muted-foreground">Manage system users, roles, and permissions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>
            A list of all users currently registered on the Prodeo platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading users...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || "Unknown"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(u.id)}
                              >
                                Copy user ID
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={u.email === 'superadmin@example.com'}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-600 dark:text-yellow-500">
            <ShieldAlert className="w-5 h-5 mr-2" />
            Roles & Permissions
          </CardTitle>
          <CardDescription className="text-yellow-700/80 dark:text-yellow-500/80">
            Currently, global roles are restricted. Only superadmin@example.com has full access to this dashboard. Workspace roles (Owner, Admin, Member, Viewer) are managed within individual workspaces.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
