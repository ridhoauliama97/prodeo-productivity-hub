'use client'

import { useEffect, useState, useCallback } from 'react'
import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase-client'
import { fetchWorkspaceById, fetchPages as fetchPagesApi, fetchDatabaseData, fetchWorkspaceMembers } from '@/lib/api-client'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { PageHeader } from '@/components/page-header'
import { SearchModal } from '@/components/modals/search-modal'
import { WorkspaceSettingsModal } from '@/components/modals/settings-modal'
import { ProfileModal } from '@/components/modals/profile-modal'
import { InboxModal } from '@/components/modals/inbox-modal'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import { DatabaseTable } from '@/components/database-table'
import { BoardView } from '@/components/board-view'
import { GalleryView } from '@/components/gallery-view'
import { CalendarView } from '@/components/calendar-view'
import { DatabaseSummary } from "@/components/database-summary"
import { Button } from '@/components/ui/button'
import { 
  LayoutGrid, 
  LayoutList, 
  Grid3x3, 
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database, DatabaseField, DatabaseRow, Page as PageType, Workspace } from '@/lib/types'

type ViewType = 'table' | 'board' | 'gallery' | 'calendar'

export default function DatabasePageComponent() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const pageId = params.pageId as string

  // Database specific state
  const [page, setPage] = useState<PageType | null>(null)
  const [database, setDatabase] = useState<Database | null>(null)
  const [fields, setFields] = useState<DatabaseField[]>([])
  const [rows, setRows] = useState<DatabaseRow[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [viewType, setViewType] = useState<ViewType>('table')
  const [loading, setLoading] = useState(true)

  // Workspace/Sidebar state
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [pages, setPages] = useState<PageType[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isInboxOpen, setIsInboxOpen] = useState(false)

  const supabase = createClient()

  const userId = user?.id;

  useEffect(() => {
    if (authLoading) return
    if (!userId) {
      router.push('/login')
      return
    }

    fetchWorkspace()
    fetchSidebarPages()
    fetchPageData()
    fetchMembers()
  }, [userId, authLoading, pageId, workspaceId, router])

  const fetchWorkspace = async () => {
    try {
      const data = await fetchWorkspaceById(workspaceId)
      setWorkspace(data)
    } catch (err: any) {
      console.error('Error fetching workspace:', err.message)
      setWorkspace({
        id: workspaceId,
        name: 'Workspace',
        owner_id: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Workspace)
    }
  }

  const fetchMembers = async () => {
    try {
      const data = await fetchWorkspaceMembers(workspaceId as string)
      setMembers(data || [])
    } catch (err: any) {
      console.error('Error fetching members:', err.message)
    }
  }

  const fetchSidebarPages = async () => {
    try {
      const data = await fetchPagesApi(workspaceId)
      setPages(data || [])
    } catch (err: any) {
      console.error('Error fetching sidebar pages:', err.message)
    }
  }

  const fetchPageData = async () => {
    try {
      setLoading(true)

      const dbData = await fetchDatabaseData(pageId)
      
      setDatabase(dbData.database)
      setFields(dbData.fields || [])
      setRows(dbData.rows || [])

      const { data: pageData } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .maybeSingle()

      if (pageData) setPage(pageData)

    } catch (err: any) {
      console.error('Error fetching database:', err.message)
      
      try {
        const { data: newDb, error: createError } = await supabase
          .from('databases')
          .insert({ page_id: pageId, workspace_id: workspaceId })
          .select()
          .single()
        
        if (!createError && newDb) {
          setDatabase(newDb)
        }
      } catch (fallbackErr) {
        console.error('Database creation fallback failed:', fallbackErr)
      }
    } finally {
      setLoading(false)
    }
  }

  // Sidebar Handlers
  const handleSelectPage = (selectedPage: PageType) => {
    if (selectedPage.id === pageId) return
    
    if (selectedPage.is_database) {
      router.push(`/workspace/${workspaceId}/database/${selectedPage.id}`)
    } else {
      router.push(`/workspace/${workspaceId}?pageId=${selectedPage.id}`)
    }
  }

  const createNewPage = async (title: string, isDatabase: boolean, parentId?: string) => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .insert({
          workspace_id: workspaceId,
          title: title || 'Untitled',
          created_by: user?.id,
          is_database: isDatabase,
          parent_page_id: parentId,
        })
        .select()
        .single()

      if (error) throw error
      setPages([data, ...pages])
      handleSelectPage(data)
      toast.success('Page created')
    } catch (err) {
      console.error('Error creating page:', err)
      toast.error('Failed to create page')
    }
  }

  const deletePage = async (pid: string) => {
    try {
      await supabase.from('blocks').delete().eq('page_id', pid)
      
      const { data: dbRecord } = await supabase
        .from('databases')
        .select('id')
        .eq('page_id', pid)
        .maybeSingle()

      if (dbRecord) {
        await supabase.from('database_rows').delete().eq('database_id', dbRecord.id)
        await supabase.from('database_fields').delete().eq('database_id', dbRecord.id)
        await supabase.from('databases').delete().eq('id', dbRecord.id)
      }

      const { error } = await supabase.from('pages').delete().eq('id', pid)
      if (error) throw error

      setPages(pages.filter(p => p.id !== pid))
      if (pid === pageId) {
        router.push(`/workspace/${workspaceId}`)
      }
      toast.success('Page deleted')
    } catch (err) {
      console.error('Error deleting page:', err)
    }
  }

  const handleUpdatePage = async (updates: Partial<PageType>) => {
    if (!pageId) return
    try {
      const { data, error } = await supabase
        .from('pages')
        .update(updates)
        .eq('id', pageId)
        .select()
        .single()

      if (error) throw error
      setPage(data)
      setPages(pages.map(p => p.id === data.id ? data : p))
      toast.success('Page updated')
    } catch (err) {
      console.error('Error updating page:', err)
    }
  }

  // Database Handlers
  const handleAddField = async (field: Omit<DatabaseField, 'id' | 'created_at'>) => {
    if (!database) return
    try {
      const { data, error } = await supabase
        .from('database_fields')
        .insert({ ...field, database_id: database.id })
        .select()
        .single()
      if (error) throw error
      setFields([...fields, data])
      toast.success('Field added')
    } catch (err: any) {
      console.error('Error adding field Details:', JSON.stringify(err, null, 2))
      if (err.code === '23505') {
        toast.error(`A field named "${field.name}" already exists.`)
      } else {
        toast.error(err.message || err.details || 'Error adding field')
      }
    }
  }

  const handleAddRow = async (row: Omit<DatabaseRow, 'id' | 'created_at' | 'updated_at'>) => {
    if (!database) return
    try {
      const { data, error } = await supabase
        .from('database_rows')
        .insert({ 
          ...row, 
          database_id: database.id, 
          created_by: user?.id,
          parent_row_id: (row as any).parent_row_id || null
        })
        .select()
        .single()
      if (error) throw error
      setRows([...rows, data])
      toast.success('Row added')
    } catch (err: any) {
      console.error('Error adding row:', err)
      toast.error(err?.message || err?.details || 'Error adding row')
    }
  }

  const isRowCompleted = (props: Record<string, any>) => {
    const completedStatusValues = [
      "completed",
      "accepted",
      "finished",
      "done",
      "accepted/completed",
    ];
    return fields.some((f) => {
      if (f.type !== "select") return false;
      const val = String(props[f.id] || "").toLowerCase();
      return completedStatusValues.includes(val);
    });
  };

  const handleUpdateRow = async (id: string, properties: Record<string, any>) => {
    try {
      let updatedProperties = { ...properties };
      const oldRow = rows.find(r => r.id === id);
      const oldCompleted = oldRow ? isRowCompleted(oldRow.properties) : false;
      const newCompleted = isRowCompleted(updatedProperties);

      // Auto-fill Finished At and trigger column creation if needed
      if (newCompleted) {
        let hasFinishedAt = false;
        let hasCommentar = false;

        let finishedAtField = fields.find((f) => 
          f.name.toLowerCase() === "finished at" || 
          f.name.toLowerCase() === "finished_at" ||
          f.name.toLowerCase() === "completed at"
        );
        let commentarField = fields.find((f) => 
          f.name.toLowerCase() === "commentar" || 
          f.name.toLowerCase() === "comments" ||
          f.name.toLowerCase() === "comment"
        );

        if (finishedAtField) {
          const now = new Date();
          const formattedDate = now.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const formattedTime = now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          }).replace(".", ":");
          
          const timestamp = `${formattedDate}, ${formattedTime}`;
          
          if (!oldCompleted || !updatedProperties[finishedAtField.id]) {
            updatedProperties[finishedAtField.id] = timestamp;
            if (finishedAtField.type === "date") {
              handleUpdateField(finishedAtField.id, { type: "text" });
            }
          }
          hasFinishedAt = true;
        }

        if (commentarField) {
          hasCommentar = true;
        }

        if (!hasFinishedAt) {
          handleAddField({ name: "Finished At", type: "text", database_id: database!.id, order_index: fields.length, is_title_field: false, properties: {} });
        }
        if (!hasCommentar) {
          handleAddField({ name: "Commentar", type: "text", database_id: database!.id, order_index: fields.length + 1, is_title_field: false, properties: {} });
        }
      } else if (oldCompleted && !newCompleted) {
        // Status changed FROM completed to non-completed — clear Finished At
        const finishedAtField = fields.find((f) =>
          f.name.toLowerCase() === "finished at" ||
          f.name.toLowerCase() === "finished_at" ||
          f.name.toLowerCase() === "completed at"
        );

        if (finishedAtField && updatedProperties[finishedAtField.id]) {
          updatedProperties[finishedAtField.id] = "";
          toast.info("Finished At cleared automatically");
        }
      }

      const { error } = await supabase
        .from('database_rows')
        .update({ properties: updatedProperties })
        .eq('id', id)
      if (error) throw error
      setRows(rows.map((r) => (r.id === id ? { ...r, properties: updatedProperties } : r)))
    } catch (err) {
      console.error('Error updating row:', err)
    }
  }

  const handleSaveAll = async (updatedRows: DatabaseRow[]) => {
    try {
      setLoading(true)
      for (const row of updatedRows) {
        const originalRow = rows.find(r => r.id === row.id)
        if (JSON.stringify(originalRow?.properties) !== JSON.stringify(row.properties)) {
          await supabase.from('database_rows').update({ properties: row.properties }).eq('id', row.id)
        }
      }
      setRows(updatedRows)
      toast.success('Database saved')
    } catch (err) {
      console.error('Error saving database:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRow = async (id: string) => {
    try {
      const { error } = await supabase.from('database_rows').delete().eq('id', id)
      if (error) throw error
      setRows(rows.filter((r) => r.id !== id))
      toast.success('Row deleted')
    } catch (err) {
      console.error('Error deleting row:', err)
    }
  }

  const handleUpdateField = async (id: string, updates: Partial<DatabaseField>) => {
    try {
      const { data, error } = await supabase.from('database_fields').update(updates).eq('id', id).select().single()
      if (error) throw error
      setFields(fields.map((f) => (f.id === id ? data : f)))
      toast.success('Field updated')
    } catch (err) {
       console.error('Error updating field:', err)
    }
  }

  const handleDeleteField = async (id: string) => {
    try {
      const { error } = await supabase.from('database_fields').delete().eq('id', id)
      if (error) throw error
      setFields(fields.filter((f) => f.id !== id))
      toast.success('Field deleted')
    } catch (err) {
      console.error('Error deleting field:', err)
    }
  }

  const handleDeleteRows = async (ids: string[]) => {
    try {
      const { error } = await supabase.from('database_rows').delete().in('id', ids)
      if (error) throw error
      setRows(rows.filter((r) => !ids.includes(r.id)))
      toast.success(`${ids.length} rows deleted`)
    } catch (err) {
      console.error('Error deleting rows:', err)
      toast.error('Failed to delete rows')
    }
  }

  const getBreadcrumbs = () => {
    const crumbs = []
    let currentId = page?.parent_page_id
    while (currentId) {
      const parent = pages.find(p => p.id === currentId)
      if (parent) {
        crumbs.unshift({ title: parent.title, id: parent.id })
        currentId = parent.parent_page_id
      } else break
    }
    return crumbs
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading database...</p>
        </div>
      </div>
    )
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <SidebarProvider>
      <AppSidebar
        workspace={workspace}
        pages={pages}
        selectedPageId={pageId}
        onSelectPage={handleSelectPage}
        onCreatePage={createNewPage}
        onDeletePage={deletePage}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
      />

      <SidebarInset>
        {/* Top header bar with sidebar trigger + breadcrumbs */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb) => (
                  <React.Fragment key={crumb.id}>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink
                        className="cursor-pointer"
                        onClick={() => {
                          const target = pages.find(p => p.id === crumb.id)
                          if (target) handleSelectPage(target)
                        }}
                      >
                        {crumb.title || "Untitled"}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </React.Fragment>
                ))}
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {page?.title || "Database"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          {page && (
            <div className="flex flex-col min-h-full pb-20">
              <PageHeader 
                page={page}
                onUpdate={handleUpdatePage}
                breadcrumbs={breadcrumbs}
                onNavigate={(id) => {
                  const target = pages.find(p => p.id === id)
                  if (target) handleSelectPage(target)
                }}
              />
              
              <div className="px-4 py-4">
                <div className="space-y-4">
                  {database ? (
                    <>
                      {/* View selector */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setViewType('table')}
                          variant={viewType === 'table' ? 'default' : 'outline'}
                          size="sm"
                        >
                          <LayoutList className="w-4 h-4 mr-2" />
                          Table
                        </Button>
                        <Button
                          onClick={() => setViewType('board')}
                          variant={viewType === 'board' ? 'default' : 'outline'}
                          size="sm"
                        >
                          <LayoutGrid className="w-4 h-4 mr-2" />
                          Board
                        </Button>
                        <Button
                          onClick={() => setViewType('gallery')}
                          variant={viewType === 'gallery' ? 'default' : 'outline'}
                          size="sm"
                        >
                          <Grid3x3 className="w-4 h-4 mr-2" />
                          Gallery
                        </Button>
                        <Button
                          onClick={() => setViewType('calendar')}
                          variant={viewType === 'calendar' ? 'default' : 'outline'}
                          size="sm"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Calendar
                        </Button>
                      </div>

                      {/* View content */}
                      {viewType === 'table' && (
                        <DatabaseTable
                          fields={fields}
                          rows={rows}
                          workspaceId={workspaceId as string}
                          members={members}
                          onAddField={handleAddField}
                          onAddRow={handleAddRow}
                          onUpdateRow={handleUpdateRow}
                          onDeleteRow={handleDeleteRow}
                          onDeleteRows={handleDeleteRows}
                          onDeleteField={handleDeleteField}
                          onUpdateField={handleUpdateField}
                          onSave={handleSaveAll}
                        />
                      )}

                      {viewType === 'board' && (
                        <BoardView
                          fields={fields}
                          rows={rows}
                          workspaceId={workspaceId as string}
                          members={members}
                          groupByField={fields.find((f) => f.type === 'select')}
                          onAddRow={handleAddRow}
                          onUpdateRow={handleUpdateRow}
                          onDeleteRow={handleDeleteRow}
                        />
                      )}

                      {viewType === 'gallery' && (
                        <GalleryView
                          fields={fields}
                          rows={rows}
                          workspaceId={workspaceId as string}
                          members={members}
                          onAddRow={handleAddRow}
                          onDeleteRow={handleDeleteRow}
                        />
                      )}

                      {viewType === 'calendar' && (
                        <CalendarView
                          fields={fields}
                          rows={rows}
                          dateField={fields.find((f) => f.type === 'date')}
                          onAddRow={handleAddRow}
                          onDeleteRow={handleDeleteRow}
                        />
                      )}

                      {/* AI Summary Section */}
                      <DatabaseSummary fields={fields} rows={rows} />
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Initializing database controls...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Global Modals */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        pages={pages}
        onSelect={handleSelectPage}
      />
      <WorkspaceSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        workspace={workspace || undefined}
        workspaceId={workspaceId}
        onWorkspaceUpdate={(name) => {}}
      />
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
      <InboxModal 
        isOpen={isInboxOpen} 
        onClose={() => setIsInboxOpen(false)} 
      />
    </SidebarProvider>
  )
}
