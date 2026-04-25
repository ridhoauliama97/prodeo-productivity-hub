'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth-context'
import { fetchWorkspaceById, fetchPages as fetchPagesApi } from '@/lib/api-client'
import type { Workspace, Page as PageType } from '@/lib/types'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { PageHeader } from '@/components/page-header'
import { RichTextEditor } from '@/components/rich-text-editor'
import { SearchModal } from '@/components/modals/search-modal'
import { WorkspaceSettingsModal } from '@/components/modals/settings-modal'
import { ProfileModal } from '@/components/modals/profile-modal'
import { InboxModal } from '@/components/modals/inbox-modal'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { DatabaseTypeSelector } from '@/components/database-type-selector'

export default function WorkspaceDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [pages, setPages] = useState<PageType[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState<PageType | null>(null)
  const [pageContent, setPageContent] = useState('')
  const [loading, setLoading] = useState(true)

  // Modal States
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isInboxOpen, setIsInboxOpen] = useState(false)

  const supabase = createClient()

  const searchParams = useSearchParams()
  const pageIdParam = searchParams.get('pageId')

  const userId = user?.id;

  useEffect(() => {
    if (authLoading) return
    if (!userId) {
      router.push('/login')
      return
    }

    fetchWorkspace()
    fetchPages()
  }, [userId, authLoading, workspaceId, router])

  // Auto-save logic
  useEffect(() => {
    if (!selectedPageId || !pageContent) return

    const timer = setTimeout(() => {
      savePage()
    }, 2000)

    return () => clearTimeout(timer)
  }, [pageContent, selectedPageId])

  const fetchWorkspace = async () => {
    try {
      const data = await fetchWorkspaceById(workspaceId)
      setWorkspace(data)
    } catch (err) {
      console.error('Error fetching workspace:', err)
      setWorkspace({
        id: workspaceId,
        name: 'Workspace',
        owner_id: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Workspace)
    }
  }

  const fetchPages = async () => {
    try {
      const data = await fetchPagesApi(workspaceId)
      const allPages = data || []
      setPages(allPages)
      setLoading(false)

      if (allPages.length > 0 && !selectedPageId) {
        const targetPage = pageIdParam 
          ? allPages.find((p: any) => p.id === pageIdParam) || allPages[0]
          : allPages[0]
        handleSelectPage(targetPage)
      }
    } catch (err) {
      console.error('Error fetching pages:', err)
      setLoading(false)
    }
  }

  const fetchPageContent = async (pageId: string) => {
    try {
      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('order_index', { ascending: true })

      if (error) throw error

      const combinedContent = blocks
        ?.map((block) => block.content.html || '')
        .join('')

      setPageContent(combinedContent || '')
    } catch (err) {
      console.error('Error fetching page content:', err)
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

      if (error) throw error

      const newPage = data[0]
      setPages([newPage, ...pages])
      handleSelectPage(newPage)
      toast.success('Page created')
    } catch (err) {
      console.error('Error creating page:', err)
      toast.error('Failed to create page')
    }
  }

  const savePage = async () => {
    if (!selectedPageId) return

    try {
      await supabase.from('blocks').delete().eq('page_id', selectedPageId)

      if (pageContent) {
        await supabase.from('blocks').insert({
          page_id: selectedPageId,
          type: 'paragraph',
          content: { html: pageContent },
          order_index: 0,
        })
      }
      console.log('Saved page content')
    } catch (err) {
      console.error('Error saving page:', err)
    }
  }

  const deletePage = async (pageId: string) => {
    try {
      const collectDescendants = (id: string): string[] => {
        const children = pages.filter((p) => p.parent_page_id === id)
        return [id, ...children.flatMap((c) => collectDescendants(c.id))]
      }
      const allPageIds = collectDescendants(pageId)

      for (const pid of allPageIds) {
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
      }

      for (const pid of [...allPageIds].reverse()) {
        const { error } = await supabase.from('pages').delete().eq('id', pid)
        if (error) throw error
      }

      const deletedSet = new Set(allPageIds)
      setPages((prev) => prev.filter((p) => !deletedSet.has(p.id)))

      if (selectedPageId && deletedSet.has(selectedPageId)) {
        setSelectedPageId(null)
        setSelectedPage(null)
        setPageContent('')
      }

      toast.success('Page deleted')
    } catch (err) {
      console.error('Error deleting page:', err)
      toast.error('Failed to delete page')
    }
  }

  const handleUpdatePage = async (updates: Partial<PageType>) => {
    if (!selectedPageId) return
    try {
      const { data, error } = await supabase
        .from('pages')
        .update(updates)
        .eq('id', selectedPageId)
        .select()
        .single()

      if (error) throw error
      setSelectedPage(data)
      setPages(pages.map(p => p.id === data.id ? data : p))
      toast.success('Page updated')
    } catch (err) {
      console.error('Error updating page:', err)
      toast.error('Failed to update page')
    }
  }

  const handleConvertToDatabase = async (type: 'table' | 'board' | 'gallery' | 'calendar') => {
    if (!selectedPage || !selectedPageId) return

    try {
      const { error: pageError } = await supabase
        .from('pages')
        .update({ is_database: true })
        .eq('id', selectedPageId)

      if (pageError) throw pageError

      const { data: db, error: dbError } = await supabase
        .from('databases')
        .insert({
          page_id: selectedPageId,
          workspace_id: workspaceId
        })
        .select()
        .single()

      if (dbError) throw dbError

      const { error: fieldError } = await supabase
        .from('database_fields')
        .insert({
          database_id: db.id,
          name: 'Name',
          type: 'title',
          is_title_field: true,
          order_index: 0
        })

      if (fieldError) throw fieldError

      toast.success(`Converted to ${type}`)
      
      const updatedPage = { ...selectedPage, is_database: true }
      setSelectedPage(updatedPage)
      setPages(pages.map(p => p.id === selectedPageId ? updatedPage : p))

      router.push(`/workspace/${workspaceId}/database/${selectedPageId}`)
    } catch (err) {
      console.error('Error converting to database:', err)
      toast.error('Failed to convert to database')
    }
  }

  const getBreadcrumbs = (pageId: string | null) => {
    if (!pageId) return []
    const crumbs = []
    let currentId = pages.find(p => p.id === pageId)?.parent_page_id
    
    while (currentId) {
      const parent = pages.find(p => p.id === currentId)
      if (parent) {
        crumbs.unshift({ title: parent.title, id: parent.id })
        currentId = parent.parent_page_id
      } else {
        break
      }
    }
    return crumbs
  }

  const handleSelectPage = (page: PageType) => {
    if (page.is_database) {
      router.push(`/workspace/${workspaceId}/database/${page.id}`)
      return
    }

    setSelectedPageId(page.id)
    setSelectedPage(page)
    fetchPageContent(page.id)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 animate-pulse" />
          <div className="absolute h-10 w-10 rounded-full border-t-2 border-primary animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-tight">
          Loading workspace...
        </p>
      </div>
    )
  }

  const isContentEmpty = (html: string | undefined | null) => {
    if (!html) return true
    const text = html.replace(/<[^>]*>?/gm, '').trim()
    if (text.length > 0) return false
    if (/<(img|hr|iframe|video|audio)[^>]*>/i.test(html)) return false
    return true
  }

  const breadcrumbs = getBreadcrumbs(selectedPageId)

  return (
    <SidebarProvider>
      <AppSidebar
        workspace={workspace}
        pages={pages}
        selectedPageId={selectedPageId}
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
                          const page = pages.find(p => p.id === crumb.id)
                          if (page) handleSelectPage(page)
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
                    {selectedPage?.title || "No page selected"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          {selectedPage ? (
            <div className="flex flex-col min-h-full pb-20">
              <PageHeader 
                page={selectedPage}
                onUpdate={handleUpdatePage}
                breadcrumbs={getBreadcrumbs(selectedPageId)}
                onNavigate={(id) => {
                  const page = pages.find(p => p.id === id)
                  if (page) handleSelectPage(page)
                }}
              />
              <div className="px-4 py-4">
                <div className="space-y-8">
                    {!selectedPage.is_database && isContentEmpty(pageContent) && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <DatabaseTypeSelector onSelect={handleConvertToDatabase} />
                      </div>
                    )}
                    
                    <div className="animate-in fade-in duration-700">
                      <RichTextEditor
                        content={pageContent}
                        onChange={setPageContent}
                        placeholder={`Write something in ${selectedPage.title}...`}
                      />
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-full p-12 animate-in fade-in duration-500">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                <FileText className="w-20 h-20 text-muted-foreground/40 relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-foreground tracking-tight">No page selected</h3>
              <p className="mt-3 text-center text-muted-foreground max-w-sm leading-relaxed">
                Select a page from the sidebar to view its content, or create a new one to start documenting your ideas.
              </p>
              <Button 
                variant="default" 
                size="lg"
                className="mt-8 px-8 h-11 font-medium rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all dark:shadow-none"
                onClick={() => createNewPage('Untitled', false)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Page
              </Button>
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
        onWorkspaceUpdate={(updatedName) => {
          if (workspace) {
          }
        }}
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
