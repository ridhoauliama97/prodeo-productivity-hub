# Product Requirements Document (PRD)

# Prodeo Projects — Fitur Lengkap & Roadmap Pengembangan

**Versi:** 2.0  
**Tanggal:** 19 April 2026  
**Status:** Draft Aktif  
**Dibuat oleh:** Engineering Team  
**Stack:** Next.js 16 · React 19 · TypeScript · Supabase · TipTap · Tailwind CSS v4 · shadcn/ui

---

## Daftar Isi

1. [Executive Summary](#1-executive-summary)
2. [Visi Produk & Tujuan Strategis](#2-visi-produk--tujuan-strategis)
3. [Analisis Status Saat Ini](#3-analisis-status-saat-ini)
4. [Fitur yang Sedang Dikerjakan](#4-fitur-yang-sedang-dikerjakan)
5. [Spesifikasi Fitur Baru](#5-spesifikasi-fitur-baru)
   - [F-01: Hierarki Halaman & Navigasi](#f-01-hierarki-halaman--navigasi)
   - [F-02: Slash Command Menu](#f-02-slash-command-menu)
   - [F-03: Block Types yang Diperluas](#f-03-block-types-yang-diperluas)
   - [F-04: Cover Halaman & Ikon](#f-04-cover-halaman--ikon)
   - [F-05: Global Search (Cmd+K)](#f-05-global-search-cmdk)
   - [F-06: Komentar & Diskusi](#f-06-komentar--diskusi)
   - [F-07: Mention System (@mention)](#f-07-mention-system-mention)
   - [F-08: Version History](#f-08-version-history)
   - [F-09: Templates](#f-09-templates)
   - [F-10: Database Enhancements](#f-10-database-enhancements)
   - [F-11: Tambahan View Database](#f-11-tambahan-view-database)
   - [F-12: Sharing & Permissions](#f-12-sharing--permissions)
   - [F-13: Export & Import](#f-13-export--import)
   - [F-14: Notifikasi & Email](#f-14-notifikasi--email)
   - [F-15: Sidebar Enhancements](#f-15-sidebar-enhancements)
   - [F-16: Fitur AI (AI Assistant)](#f-16-fitur-ai-ai-assistant)
   - [F-17: Mobile Experience](#f-17-mobile-experience)
   - [F-18: Pengaturan Lanjutan (Settings)](#f-18-pengaturan-lanjutan-settings)
   - [F-19: API Publik & Webhooks](#f-19-api-publik--webhooks)
   - [F-20: Offline & PWA Support](#f-20-offline--pwa-support)
6. [Arsitektur Teknis & Perubahan Database](#6-arsitektur-teknis--perubahan-database)
7. [Roadmap Implementasi (4 Fase)](#7-roadmap-implementasi-4-fase)
8. [Metrik Keberhasilan (KPI)](#8-metrik-keberhasilan-kpi)
9. [Risiko & Mitigasi](#9-risiko--mitigasi)
10. [Dependensi & Keputusan Teknis](#10-dependensi--keputusan-teknis)

---

## 1. Executive Summary

Aplikasi ini merupakan kloning fungsional Notion yang dibangun di atas Next.js 16, Supabase, dan TipTap. Tahap pertama telah berhasil menghadirkan fondasi inti termasuk autentikasi, editor dokumen, database view (Table/Board/Gallery/Calendar), fitur tim/workspace, dan kolaborasi real-time.

PRD ini mendefinisikan **20 kelompok fitur baru** yang diperlukan untuk menjadikan aplikasi ini setara dengan pengalaman pengguna Notion sesungguhnya, mulai dari peningkatan editor, sistem pencarian global, komentar inline, version history, template, hingga fitur AI asistan.

**Target Pengguna:**

- Tim kecil hingga menengah (2–50 orang)
- Individu yang membutuhkan workspace all-in-one
- Developer yang ingin self-host tool produktivitas

---

## 2. Visi Produk & Tujuan Strategis

### Visi

Menjadi alternatif Notion open-source yang dapat di-self-host, dengan fitur lengkap, performa tinggi, dan pengalaman pengguna yang intuitif.

### Tujuan Strategis

| # | Tujuan | Indikator Sukses |
|---|--------|-----------------|
| S1 | Paritas fitur dengan Notion core | ≥ 90% fitur Notion Free Plan tersedia |
| S2 | Performa tinggi | LCP < 2.5 detik, INP < 200ms |
| S3 | Kolaborasi real-time mulus | Latensi update < 500ms antar pengguna |
| S4 | Pengalaman editor kelas dunia | Editor bisa handle dokumen 500+ blok tanpa lag |
| S5 | Ekosistem template | ≥ 30 template bawaan tersedia |

### Prinsip Desain

- **Simplicity First** — antarmuka tidak membingungkan pengguna baru
- **Keyboard-first** — semua fitur utama bisa diakses tanpa mouse
- **Offline-capable** — bisa bekerja tanpa internet, sync saat kembali online
- **Performance-obsessed** — tidak ada operasi UI yang memblokir thread utama

---

## 3. Analisis Status Saat Ini

### ✅ Sudah Selesai (Baseline)

| Kategori | Fitur |
|----------|-------|
| **Auth** | Sign up, Login, JWT, session, auth context |
| **Database** | 9 tabel Supabase, RLS, real-time subscriptions |
| **Editor** | Rich text (TipTap), CRUD dokumen |
| **Database App** | 8+ tipe field, CRUD record, filter, sort |
| **Views** | Table, Board/Kanban, Gallery, Calendar |
| **Tim** | Workspace, undangan anggota, role (Owner/Admin/Member/Viewer) |
| **Real-time** | WebSocket, presence tracking, live user count |
| **Keamanan** | RLS, JWT, HTTPS ready |
| **Docs** | 11 file dokumentasi |

### 🔴 Gap Analysis — Fitur yang Hilang

```
Hierarki halaman (nested pages)     ████████████████ KRITIS
Slash command (/)                   ████████████████ KRITIS
Block types tambahan                ████████████░░░░ TINGGI
Cover & icon halaman                ████████████░░░░ TINGGI
Global search (Cmd+K)               ████████████████ KRITIS
Komentar & diskusi inline           ████████████░░░░ TINGGI
@mention system                     ████████░░░░░░░░ MEDIUM
Version history                     ████████░░░░░░░░ MEDIUM
Templates                           ████████░░░░░░░░ MEDIUM
Database: Relation & Rollup         ████████████░░░░ TINGGI
Timeline/Gantt view                 ████████░░░░░░░░ MEDIUM
Sharing halaman publik              ████████████░░░░ TINGGI
Export (PDF/Markdown)               ████████░░░░░░░░ MEDIUM
Sistem notifikasi + email           ████████████░░░░ TINGGI (In Progress)
Sidebar drag-and-drop               ████████░░░░░░░░ MEDIUM
Fitur AI                            ████░░░░░░░░░░░░ LOW
Mobile experience                   ████████░░░░░░░░ MEDIUM
Settings lanjutan                   ████████░░░░░░░░ MEDIUM
API publik & webhooks               ████░░░░░░░░░░░░ LOW
Offline/PWA                         ████░░░░░░░░░░░░ LOW
```

---

## 4. Fitur yang Sedang Dikerjakan

### 🔄 IN PROGRESS: Notification Badge & Notification Feed

**Konteks:** Transisi dari "inbox sebagai live scan assigned tasks" menjadi "notification feed model" berbasis tabel `notifications`.

#### Perubahan Database

```sql
-- Fungsi Postgres untuk trigger notifikasi assignment
CREATE OR REPLACE FUNCTION notify_on_assignment()
RETURNS TRIGGER AS $$
DECLARE
  old_assignees JSONB;
  new_assignees JSONB;
  added_user_id TEXT;
BEGIN
  old_assignees := COALESCE(OLD.properties->'assigned_to', '[]'::JSONB);
  new_assignees := COALESCE(NEW.properties->'assigned_to', '[]'::JSONB);

  -- Iterasi user ID baru yang belum ada di old_assignees
  FOR added_user_id IN
    SELECT jsonb_array_elements_text(new_assignees)
    EXCEPT
    SELECT jsonb_array_elements_text(old_assignees)
  LOOP
    INSERT INTO notifications (
      user_id, type, title, message,
      related_entity_type, related_entity_id, read, created_at
    ) VALUES (
      added_user_id::UUID,
      'assignment',
      'Kamu ditugaskan ke sebuah tugas',
      'Kamu telah ditugaskan ke: ' || COALESCE(NEW.properties->>'name', 'Untitled'),
      'database_row',
      NEW.id,
      FALSE,
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_row_assignment
  AFTER UPDATE ON public.database_rows
  FOR EACH ROW
  WHEN (OLD.properties IS DISTINCT FROM NEW.properties)
  EXECUTE FUNCTION notify_on_assignment();
```

#### Perubahan Komponen

**`sidebar.tsx`**

- State `unreadCount: number`
- Query awal: `notifications WHERE read = false AND user_id = auth.uid()`
- Realtime listener: `supabase.channel('notifications').on('postgres_changes', ...)`
- UI: Badge merah dengan angka di sebelah tombol "Inbox"
- Badge hilang ketika count = 0

**`api/inbox/route.ts`**

- `GET`: Fetch dari tabel `notifications` ORDER BY `created_at DESC`, dengan pagination (limit 50)
- `PATCH /api/inbox/read-all`: Set `read = true` untuk semua notifikasi user
- `PATCH /api/inbox/:id/read`: Set `read = true` untuk satu notifikasi

**`modals/inbox-modal.tsx`**

- Fetch dari API baru (notification-based)
- Memanggil `PATCH /read-all` saat modal dibuka → badge di sidebar hilang
- Render: judul notifikasi, pesan, timestamp, status read/unread

#### Acceptance Criteria

- [ ] User A assign task ke User B → badge User B naik dalam < 1 detik
- [ ] User B buka inbox modal → badge hilang
- [ ] Refresh halaman → badge count tetap akurat
- [ ] Notifikasi terurut dari terbaru ke terlama
- [ ] "Mark all as read" berfungsi dari modal

---

## 5. Spesifikasi Fitur Baru

---

### F-01: Hierarki Halaman & Navigasi

**Prioritas:** 🔴 KRITIS  
**Estimasi:** 2 minggu

#### Deskripsi

Pengguna dapat membuat halaman bersarang (nested pages) dengan kedalaman tak terbatas. Sidebar menampilkan tree dengan expand/collapse, dan halaman memiliki breadcrumb navigasi.

#### User Stories

- Sebagai pengguna, saya ingin membuat sub-halaman di dalam halaman agar bisa mengorganisir konten secara hierarkis
- Sebagai pengguna, saya ingin melihat posisi saya dalam hierarki halaman melalui breadcrumb
- Sebagai pengguna, saya ingin memindahkan halaman dari satu parent ke parent lain (drag-and-drop atau "Move to")

#### Perubahan Database

```sql
-- Tambahkan kolom parent_id dan path ke tabel pages
ALTER TABLE pages
  ADD COLUMN parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  ADD COLUMN path TEXT[], -- ['workspace_id', 'page_a_id', 'page_b_id']
  ADD COLUMN depth INTEGER DEFAULT 0,
  ADD COLUMN sort_order INTEGER DEFAULT 0,
  ADD COLUMN is_in_sidebar BOOLEAN DEFAULT TRUE;

-- Index untuk query hierarki
CREATE INDEX idx_pages_parent_id ON pages(parent_id);
CREATE INDEX idx_pages_path ON pages USING GIN(path);

-- Function untuk mendapatkan semua descendant
CREATE OR REPLACE FUNCTION get_page_descendants(p_page_id UUID)
RETURNS TABLE(id UUID, title TEXT, depth INTEGER) AS $$
  WITH RECURSIVE tree AS (
    SELECT id, title, parent_id, depth FROM pages WHERE id = p_page_id
    UNION ALL
    SELECT p.id, p.title, p.parent_id, p.depth
    FROM pages p
    INNER JOIN tree t ON p.parent_id = t.id
  )
  SELECT id, title, depth FROM tree WHERE id != p_page_id;
$$ LANGUAGE sql;
```

#### Komponen Baru/Modifikasi

**`components/sidebar/page-tree.tsx`** (BARU)

- Recursive tree component untuk render hierarki halaman
- State: expand/collapse per node (persist di localStorage)
- Hover: tampilkan tombol "+" untuk tambah sub-halaman dan "⋯" untuk actions
- Drag-to-reorder (gunakan `@dnd-kit/sortable`)

**`components/breadcrumb.tsx`** (BARU)

- Fetch ancestor chain dari `pages` menggunakan kolom `path`
- Klik item breadcrumb untuk navigasi
- Truncate jika > 4 level (tampilkan "...")

**`app/[workspaceId]/[...pageId]/page.tsx`** (MODIFIKASI)

- Route dinamis untuk nested pages
- Tampilkan breadcrumb di atas konten halaman

#### API

```
GET    /api/pages?workspace_id=&parent_id=   → list children
POST   /api/pages                            → create (dengan parent_id opsional)
PATCH  /api/pages/:id/move                   → { new_parent_id, sort_order }
DELETE /api/pages/:id                        → cascade delete children
```

#### Acceptance Criteria

- [ ] Bisa membuat sub-halaman minimal 5 level dalam
- [ ] Breadcrumb akurat menampilkan seluruh path
- [ ] Hapus parent page → children ikut terhapus (cascade)
- [ ] Pindah halaman ke parent baru memperbarui path & depth
- [ ] Sidebar tree persist state expand/collapse setelah refresh

---

### F-02: Slash Command Menu

**Prioritas:** 🔴 KRITIS  
**Estimasi:** 1.5 minggu

#### Deskripsi

Mengetik `/` di dalam editor memunculkan command palette interaktif yang memungkinkan pengguna menyisipkan berbagai tipe blok tanpa menggunakan mouse.

#### User Stories

- Sebagai pengguna, saya ingin mengetik `/` lalu nama blok untuk menyisipkannya
- Sebagai pengguna, saya ingin memfilter pilihan blok saat saya mengetik setelah `/`
- Sebagai pengguna, saya ingin menavigasi dengan keyboard (Arrow, Enter, Escape)

#### Implementasi TipTap

```typescript
// extensions/slash-command.ts
import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { SlashCommandList } from '@/components/editor/slash-command-list'

export const SLASH_COMMANDS = [
  // Text
  { id: 'heading1', label: 'Heading 1', icon: 'H1', shortcut: '# ', category: 'basic' },
  { id: 'heading2', label: 'Heading 2', icon: 'H2', shortcut: '## ', category: 'basic' },
  { id: 'heading3', label: 'Heading 3', icon: 'H3', shortcut: '### ', category: 'basic' },
  { id: 'bulletList', label: 'Bullet List', icon: '•', shortcut: '- ', category: 'basic' },
  { id: 'numberedList', label: 'Numbered List', icon: '1.', shortcut: '1. ', category: 'basic' },
  { id: 'todoList', label: 'To-do List', icon: '☐', shortcut: '[] ', category: 'basic' },
  { id: 'toggleList', label: 'Toggle', icon: '▶', category: 'basic' },
  { id: 'quote', label: 'Quote', icon: '"', shortcut: '> ', category: 'basic' },
  { id: 'divider', label: 'Divider', icon: '—', shortcut: '--- ', category: 'basic' },
  { id: 'callout', label: 'Callout', icon: '💡', category: 'basic' },

  // Media
  { id: 'image', label: 'Image', icon: '🖼️', category: 'media' },
  { id: 'video', label: 'Video Embed', icon: '🎥', category: 'media' },
  { id: 'file', label: 'File Attachment', icon: '📎', category: 'media' },
  { id: 'embed', label: 'Web Embed', icon: '🔗', category: 'media' },

  // Code & Math
  { id: 'code', label: 'Code Block', icon: '<>', shortcut: '``` ', category: 'advanced' },
  { id: 'math', label: 'Math Block', icon: 'Σ', shortcut: '$$ ', category: 'advanced' },
  { id: 'table', label: 'Simple Table', icon: '⊞', category: 'advanced' },

  // Database
  { id: 'linkedDatabase', label: 'Linked View of DB', icon: '🗃️', category: 'database' },
  { id: 'newDatabase', label: 'New Database', icon: '⊞', category: 'database' },

  // AI
  { id: 'aiWrite', label: 'AI: Write...', icon: '✨', category: 'ai' },
  { id: 'aiSummarize', label: 'AI: Summarize', icon: '✨', category: 'ai' },
]

export const SlashCommand = Extension.create({
  name: 'slashCommand',
  // ... TipTap suggestion plugin implementation
})
```

**`components/editor/slash-command-list.tsx`** (BARU)

- Render daftar command dengan kategori
- Search/filter realtime saat mengetik setelah `/`
- Keyboard navigation (Up/Down/Enter/Escape)
- Recent commands (5 terakhir, simpan di localStorage)

#### Acceptance Criteria

- [ ] `/` memunculkan menu dalam < 100ms
- [ ] Filter berfungsi (ketik `/head` → hanya tampilkan Heading options)
- [ ] Keyboard navigation berfungsi penuh
- [ ] Escape menutup menu tanpa efek samping
- [ ] Semua command menyisipkan blok yang benar

---

### F-03: Block Types yang Diperluas

**Prioritas:** 🔴 KRITIS  
**Estimasi:** 2.5 minggu

#### Deskripsi

Memperluas tipe blok editor dari yang sudah ada (paragraf, heading, list, todo, code) dengan tambahan blok-blok kunci yang ada di Notion.

#### Blok Baru yang Diperlukan

| Block Type | Deskripsi | Extension TipTap |
|-----------|-----------|-----------------|
| **Callout** | Kotak info berwarna dengan emoji icon | Custom Node |
| **Toggle** | Accordion expand/collapse dengan konten di dalamnya | Custom Node |
| **Divider** | Garis pemisah horizontal | `HorizontalRule` |
| **Image** | Upload & embed gambar dengan caption | Custom Node + Supabase Storage |
| **File Attachment** | Upload file arbitrer | Custom Node + Supabase Storage |
| **Video Embed** | Embed YouTube, Vimeo via URL | Custom Node |
| **Web Embed / Bookmark** | Preview URL dengan title, desc, thumbnail | Custom Node |
| **Math Equation** | Render LaTeX (inline & block) | `Mathematics` ext |
| **Code Block dengan syntax highlight** | 100+ bahasa, copy button | `CodeBlockLowlight` |
| **Simple Table** | Tabel ringan dalam dokumen (bukan database) | `Table` ext |
| **Linked Page** | Mention/embed halaman lain | Custom Node |
| **Synced Block** | Blok yang disinkronkan ke beberapa halaman | Custom Node + DB |
| **Column Layout** | 2/3 kolom layout | Custom Node |

#### Skema Database untuk Blok Tambahan

```sql
-- Tabel untuk blok yang memerlukan state tersendiri (synced blocks, toggles)
CREATE TABLE page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'synced_block', 'toggle', etc.
  content JSONB,
  synced_source_id UUID REFERENCES page_blocks(id), -- NULL jika ini adalah source
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel untuk file/media uploads
CREATE TABLE page_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'image', 'file', 'video'
  storage_path TEXT NOT NULL, -- path di Supabase Storage
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  metadata JSONB, -- { width, height, duration, etc. }
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Supabase Storage Setup

```
Bucket: page-media (public untuk gambar, private untuk file)
  ├── images/
  │   └── {workspace_id}/{page_id}/{uuid}.{ext}
  └── files/
      └── {workspace_id}/{page_id}/{uuid}_{filename}
```

#### Acceptance Criteria

- [ ] Upload gambar: drag-drop, paste, atau pilih file
- [ ] Gambar resize dengan drag handle
- [ ] Caption gambar bisa diedit
- [ ] Callout: pilih emoji icon dan warna background
- [ ] Toggle: klik untuk expand/collapse, bisa nested
- [ ] Code block: syntax highlighting, copy button, pilih bahasa
- [ ] Math: render LaTeX realtime saat mengetik
- [ ] Column layout: drag untuk resize kolom

---

### F-04: Cover Halaman & Ikon

**Prioritas:** 🔴 TINGGI  
**Estimasi:** 1 minggu

#### Deskripsi

Setiap halaman dapat memiliki cover image di bagian atas dan ikon (emoji atau gambar kustom) yang ditampilkan di sidebar dan title halaman.

#### User Stories

- Sebagai pengguna, saya ingin menetapkan cover image (dari upload, URL, atau galeri bawaan) untuk halaman saya
- Sebagai pengguna, saya ingin memilih emoji sebagai ikon halaman yang terlihat di sidebar
- Sebagai pengguna, saya ingin menggeser posisi vertikal cover image

#### Perubahan Database

```sql
ALTER TABLE pages
  ADD COLUMN icon JSONB, -- { type: 'emoji'|'url', value: '🚀'|'https://...' }
  ADD COLUMN cover JSONB; -- { type: 'upload'|'url'|'unsplash'|'gradient', value: '...', position_y: 0.3 }
```

#### Komponen Baru

**`components/page/page-cover.tsx`** (BARU)

- Tampilkan cover image dengan `object-fit: cover`
- Hover: tampilkan tombol "Change cover", "Reposition", "Remove"
- Repositioning mode: drag cover secara vertikal

**`components/page/cover-picker.tsx`** (BARU)

- Tab: Upload | Link | Unsplash | Gradient
- Unsplash search via Unsplash API (atau curated collection)
- 6 preset gradient bawaan

**`components/page/icon-picker.tsx`** (BARU)

- Emoji picker (gunakan `emoji-mart`)
- Upload custom image
- Remove icon option

**`components/page/page-header.tsx`** (MODIFIKASI)

- Render icon di atas title
- Render cover di atas header area
- Title dengan `contenteditable` untuk edit inline

#### Acceptance Criteria

- [ ] Cover image ter-render responsif di semua ukuran layar
- [ ] Reposition cover: drag up/down dan persist
- [ ] Emoji picker: search, kategori, skin tone
- [ ] Icon muncul di sidebar tree dan breadcrumb
- [ ] Cover & icon disinkronkan realtime ke semua viewer

---

### F-05: Global Search (Cmd+K)

**Prioritas:** 🔴 KRITIS  
**Estimasi:** 1.5 minggu

#### Deskripsi

Command palette terpusat yang dapat diakses dengan `Cmd+K` (Mac) / `Ctrl+K` (Windows) untuk mencari halaman, database records, membuat halaman baru, dan menjalankan quick actions.

#### User Stories

- Sebagai pengguna, saya ingin menekan Cmd+K dan langsung mencari konten
- Sebagai pengguna, saya ingin mencari berdasarkan judul dan isi halaman
- Sebagai pengguna, saya ingin melihat "recently visited" saat palette baru dibuka

#### Implementasi

**`components/global-search/search-modal.tsx`** (BARU)

```typescript
interface SearchResult {
  id: string
  type: 'page' | 'database' | 'database_record'
  title: string
  icon?: string
  breadcrumb: string[] // ['Workspace', 'Parent Page']
  highlight?: string // snippet teks yang cocok
  lastEdited: Date
}

// API endpoint untuk search
// GET /api/search?q={query}&workspace_id={id}&limit=20
// - Full-text search menggunakan Postgres tsvector
// - Search pada: pages.title, pages.content (text), databases.title, database_rows.properties
```

**Postgres Full-Text Search Setup**

```sql
-- Tambahkan search vector ke tabel pages
ALTER TABLE pages ADD COLUMN search_vector TSVECTOR;

-- Trigger untuk update search_vector
CREATE OR REPLACE FUNCTION update_pages_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.content::TEXT, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pages_search_vector_update
  BEFORE INSERT OR UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_pages_search_vector();

CREATE INDEX idx_pages_search ON pages USING GIN(search_vector);
```

**UI Features**

- Input debounce 200ms
- Keyboard navigation (Up/Down/Enter)
- Grouped results: Pages, Databases, Records
- Recent searches (localStorage, max 10)
- Quick actions: "Create new page", "New database"
- Filter toggle: Tipe konten, "Hanya workspace ini"

#### Acceptance Criteria

- [ ] Cmd+K / Ctrl+K membuka search dari mana saja
- [ ] Hasil muncul dalam < 300ms setelah debounce
- [ ] Full-text search pada judul dan isi halaman
- [ ] Recent pages muncul saat query kosong
- [ ] Escape menutup modal
- [ ] Keyboard navigation penuh (tanpa mouse)

---

### F-06: Komentar & Diskusi

**Prioritas:** 🔴 TINGGI  
**Estimasi:** 2 minggu

#### Deskripsi

Pengguna dapat menambahkan komentar pada teks yang dipilih (inline comment) atau pada halaman secara umum (page comment). Mendukung thread balasan dan resolusi.

#### User Stories

- Sebagai pengguna, saya ingin memilih teks dan menambahkan komentar pada bagian tersebut
- Sebagai pengguna, saya ingin membalas komentar dalam satu thread
- Sebagai pengguna, saya ingin menandai komentar sebagai "resolved"
- Sebagai pemilik halaman, saya ingin melihat semua komentar aktif dalam satu panel

#### Perubahan Database

```sql
CREATE TABLE page_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Untuk inline comment: simpan posisi teks
  inline_ref JSONB, -- { from: 10, to: 25, text: "selected text", block_id: "..." }

  parent_id UUID REFERENCES page_comments(id), -- NULL untuk root comment, SET untuk reply
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE page_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view comments on shared pages"
  ON page_comments FOR SELECT
  USING (page_id IN (
    SELECT id FROM pages WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));
```

#### Komponen Baru

**TipTap Comment Extension**

```typescript
// Marks teks yang ada comment-nya dengan highlight kuning
// Klik → popover muncul dengan comment thread
```

**`components/comments/comment-panel.tsx`** (BARU)

- Panel kanan yang bisa toggle show/hide
- List semua comment thread di halaman ini
- Filter: Active / Resolved
- Klik thread → scroll ke posisi teks terkait

**`components/comments/comment-thread.tsx`** (BARU)

- Render root comment + replies
- Input field untuk reply
- Tombol Resolve/Reopen
- Edit/Delete komentar sendiri
- Format waktu relatif ("2 jam yang lalu")

#### Realtime

```typescript
supabase.channel(`comments-${pageId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'page_comments',
    filter: `page_id=eq.${pageId}`
  }, handleCommentChange)
  .subscribe()
```

#### Acceptance Criteria

- [ ] Pilih teks → tombol comment bubble muncul
- [ ] Komentar meng-highlight teks dengan warna
- [ ] Highlight hilang saat comment di-resolve
- [ ] Reply thread berfungsi
- [ ] Komentar baru muncul realtime tanpa refresh
- [ ] Panel komentar menampilkan semua thread

---

### F-07: Mention System (@mention)

**Prioritas:** 🟡 MEDIUM  
**Estimasi:** 1 minggu

#### Deskripsi

Pengguna dapat menyebut anggota workspace, halaman lain, atau tanggal dalam editor. Mention ke user menghasilkan notifikasi.

#### Tipe Mention

| Trigger | Tipe | Contoh Output |
|---------|------|--------------|
| `@user` | User mention | `@Budi` dengan avatar dan link ke profil |
| `@page` | Page mention | `@Judul Halaman` dengan link ke halaman |
| `@date` | Date mention | `@Tomorrow`, `@Next Monday` |
| `@today` | Today shortcut | Tanggal hari ini |

#### Implementasi TipTap

```typescript
// extensions/mention.ts — reuse TipTap MentionExtension
// Pisahkan 3 extension: UserMention, PageMention, DateMention
// Masing-masing trigger karakter yang sama (@) tapi resolve berbeda

// API untuk suggestions
GET /api/suggestions/users?q={query}&workspace_id={id}
GET /api/suggestions/pages?q={query}&workspace_id={id}
```

**Notifikasi dari Mention**

- User yang di-mention → dapat notifikasi (via trigger Postgres pada tabel `page_comments` atau TipTap content update)
- Tampil di Inbox sebagai: "Budi menyebut kamu di [nama halaman]"

#### Acceptance Criteria

- [ ] `@B` → dropdown dengan anggota workspace yang namanya mengandung "B"
- [ ] Pilih user → inline chip dengan nama dan avatar mini
- [ ] User yang di-mention mendapat notifikasi dalam < 2 detik
- [ ] `@halaman` → pilih halaman yang ada, jadi link

---

### F-08: Version History

**Prioritas:** 🟡 MEDIUM  
**Estimasi:** 1.5 minggu

#### Deskripsi

Setiap perubahan konten halaman disimpan sebagai snapshot yang dapat dilihat dan dipulihkan.

#### User Stories

- Sebagai pengguna, saya ingin melihat riwayat perubahan halaman
- Sebagai pengguna, saya ingin membandingkan versi lama dengan versi terbaru
- Sebagai pengguna, saya ingin memulihkan halaman ke versi tertentu

#### Perubahan Database

```sql
CREATE TABLE page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content JSONB NOT NULL, -- snapshot konten TipTap JSON
  title TEXT,
  version_number INTEGER,
  change_summary TEXT, -- auto-generated atau manual
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-snapshot trigger setiap 30 menit edit atau saat halaman di-blur
-- Atau: simpan setiap kali user menekan Ctrl+S
CREATE INDEX idx_page_versions_page_id ON page_versions(page_id, created_at DESC);
```

**Strategi Snapshot**

- Snapshot dibuat setiap: 30 menit interval aktif editing, atau pada Ctrl+S, atau saat halaman ditinggalkan
- Retain: semua versi 24 jam terakhir (per jam), 30 hari terakhir (per hari), arsip bulanan

#### Komponen Baru

**`components/version-history/history-panel.tsx`** (BARU)

- Sidebar kanan khusus version history
- Daftar versi: tanggal, penulis, preview singkat
- Klik versi → tampilkan diff highlight (Added: hijau, Removed: merah)
- Tombol "Restore this version"

**Diff Visualisasi**

```typescript
// Gunakan library: jsondiffpatch atau diff-match-patch
// Render HTML diff dari dua TipTap JSON snapshot
```

#### Acceptance Criteria

- [ ] History panel bisa dibuka dari menu halaman (⋯)
- [ ] List versi dengan timestamp dan nama editor
- [ ] Preview diff antara dua versi
- [ ] Restore ke versi lama (konfirmasi sebelum restore)
- [ ] Versi terbaru selalu di atas

---

### F-09: Templates

**Prioritas:** 🟡 MEDIUM  
**Estimasi:** 1.5 minggu

#### Deskripsi

Pengguna dapat membuat halaman atau database baru dari template. Tersedia template bawaan (system) dan template kustom buatan user.

#### Jenis Template

| Jenis | Contoh |
|-------|--------|
| **Page Template** | Meeting Notes, Project Brief, Weekly Review, SOP |
| **Database Template** | Task Tracker, Bug Tracker, CRM, Content Calendar, Reading List |
| **Record Template** | Template untuk row baru dalam database |

#### Perubahan Database

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id), -- NULL = system template
  created_by UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('page', 'database', 'record')),
  category TEXT, -- 'productivity', 'engineering', 'marketing', etc.
  name TEXT NOT NULL,
  description TEXT,
  icon JSONB,
  cover JSONB,
  content JSONB NOT NULL, -- snapshot lengkap (TipTap JSON / database schema)
  is_public BOOLEAN DEFAULT FALSE, -- share ke semua workspace
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Komponen Baru

**`components/templates/template-gallery.tsx`** (BARU)

- Grid gallery dengan filter: Semua, Halaman, Database, Kategori
- Search template
- Preview template sebelum digunakan
- Tombol "Use Template" → buat halaman/database baru dari template

**"Save as Template" dari halaman/database yang sudah ada**

- Tombol di menu ⋯ halaman: "Save as Template"
- Modal: nama template, deskripsi, pilih privat/workspace-wide

#### Template Bawaan (Minimum 15)

- Meeting Notes, Project Brief, Sprint Planning, Bug Report
- Weekly Review, Habit Tracker, Reading List, OKR Tracker
- Product Roadmap, Content Calendar, CRM Database
- Employee Directory, Interview Tracker, Budget Planner, Recipe Book

#### Acceptance Criteria

- [ ] Template gallery bisa difilter dan dicari
- [ ] Membuat halaman dari template menyalin semua konten
- [ ] Record template muncul saat klik "+ New" di database
- [ ] "Save as Template" berfungsi dari halaman/database manapun
- [ ] Minimal 15 template sistem tersedia

---

### F-10: Database Enhancements

**Prioritas:** 🔴 TINGGI  
**Estimasi:** 3 minggu

#### Deskripsi

Menambahkan tipe field lanjutan dan fitur database yang lebih powerful: Relation, Rollup, Formula, dan Sub-items.

#### F-10.1: Relation Field

Menghubungkan dua database sehingga record di satu DB bisa di-link ke record di DB lain.

```sql
-- Tabel untuk menyimpan relasi antar database
CREATE TABLE database_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  target_database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  source_field_name TEXT NOT NULL,
  target_field_name TEXT, -- field balik di target (bi-directional)
  relation_type TEXT DEFAULT 'many_to_many', -- many_to_many, one_to_many
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel untuk data relasi per row
CREATE TABLE database_row_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_row_id UUID REFERENCES database_rows(id) ON DELETE CASCADE,
  target_row_id UUID REFERENCES database_rows(id) ON DELETE CASCADE,
  relation_id UUID REFERENCES database_relations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_row_id, target_row_id, relation_id)
);
```

**UI:**

- Field type baru "Relation" di database properties
- Saat edit cell: search dan pilih record dari database target
- Tampilkan chip dengan nama record terkait
- "Show relation" → link ke record tujuan

#### F-10.2: Rollup Field

Agregasi nilai dari field di database yang di-relate.

```typescript
// Rollup types yang didukung
type RollupFunction =
  | 'count'          // Hitung jumlah related records
  | 'count_values'   // Hitung nilai non-empty
  | 'count_unique'   // Hitung nilai unik
  | 'sum'            // Jumlahkan nilai number
  | 'average'        // Rata-rata nilai number
  | 'min' | 'max'    // Min/Max
  | 'earliest_date'  // Tanggal paling awal
  | 'latest_date'    // Tanggal paling akhir
  | 'show_unique'    // Tampilkan nilai unik sebagai list
```

```sql
-- Rollup disimpan sebagai field definition dalam database schema
-- { type: 'rollup', relation_field: 'Tasks', rollup_field: 'Status', function: 'count' }
```

#### F-10.3: Formula Field

Field yang dikalkulasi berdasarkan nilai field lain, mirip Excel.

```typescript
// Formula engine ringan menggunakan parser expression
// Fungsi yang didukung:
// - Aritmatika: +, -, *, /, ^, ()
// - String: concat(), length(), substring(), upper(), lower()
// - Date: dateBetween(), dateAdd(), now()
// - Logic: if(), and(), or(), not()
// - Number: round(), abs(), floor(), ceil()
// Contoh: if(prop("Status") == "Done", "✅", "⏳")
// Contoh: dateBetween(prop("Due Date"), now(), "days") + " days left"
```

**UI:**

- Field type "Formula" → formula editor dengan syntax highlighting dan autocomplete prop names
- Preview hasil formula di bawah editor

#### F-10.4: Sub-items / Sub-rows

Row bisa memiliki child rows (hierarki task).

```sql
ALTER TABLE database_rows
  ADD COLUMN parent_row_id UUID REFERENCES database_rows(id);
```

**UI:**

- Toggle expand di kiri row untuk lihat/tambah sub-items
- Table view: indent sub-items
- Board view: tampilkan count sub-items di card

#### Acceptance Criteria

- [ ] Relation field bisa link ke database manapun dalam workspace
- [ ] Rollup menghitung Count, Sum, Average dari related records
- [ ] Formula field mendukung ekspresi dasar (aritmatika, string, tanggal, kondisi)
- [ ] Sub-items bisa collapse/expand di table view
- [ ] Perubahan relasi realtime ke semua viewer

---

### F-11: Tambahan View Database

**Prioritas:** 🟡 MEDIUM  
**Estimasi:** 2 minggu

#### F-11.1: List View

View paling simpel: satu kolom list dengan properti di sebelah kanan.

```typescript
// Komponen: components/database/views/list-view.tsx
// - Render row sebagai list item horizontal
// - Klik row → open record modal
// - Drag-to-reorder (opsional)
// - Pagination atau virtual scroll
```

#### F-11.2: Timeline / Gantt View

Visualisasi timeline berbasis tanggal mulai dan tanggal selesai.

```typescript
// Komponen: components/database/views/timeline-view.tsx
// Library: gunakan react-gantt-chart atau buat kustom dengan CSS Grid
// Features:
// - Zoom: Hari / Minggu / Bulan / Kuartal / Tahun
// - Grouping: berdasarkan field pilihan
// - Bar bisa didrag untuk mengubah tanggal
// - Dependencies antar task (opsional, Phase selanjutnya)
```

**Konfigurasi view:**

```typescript
interface TimelineViewConfig {
  startDateField: string   // field yang digunakan sebagai start date
  endDateField: string     // field yang digunakan sebagai end date
  groupBy?: string         // field grouping opsional
  colorField?: string      // field untuk warna bar
  zoom: 'day' | 'week' | 'month' | 'quarter'
}
```

#### Acceptance Criteria

- [ ] List view render semua record dengan properti terpilih
- [ ] Timeline view menampilkan bar berdasarkan date range
- [ ] Zoom timeline antara Minggu/Bulan/Kuartal
- [ ] Drag bar di timeline mengubah tanggal record

---

### F-12: Sharing & Permissions

**Prioritas:** 🔴 TINGGI  
**Estimasi:** 1.5 minggu

#### Deskripsi

Pengguna dapat berbagi halaman kepada orang tertentu atau mempublikasikannya ke internet.

#### User Stories

- Sebagai pengguna, saya ingin berbagi halaman ke email tertentu dengan akses view-only
- Sebagai pengguna, saya ingin mendapatkan link publik yang bisa dibuka siapa saja
- Sebagai admin workspace, saya ingin mengatur permission per halaman

#### Perubahan Database

```sql
CREATE TABLE page_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id),

  -- Untuk share ke email spesifik
  shared_with_email TEXT,
  shared_with_user_id UUID REFERENCES auth.users(id),

  -- Untuk public link
  is_public BOOLEAN DEFAULT FALSE,
  public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),

  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'comment', 'edit')),
  inherit_children BOOLEAN DEFAULT TRUE, -- sub-pages juga ikut di-share
  password TEXT, -- opsional password protection
  expires_at TIMESTAMPTZ, -- opsional expiry

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Komponen Baru

**`components/sharing/share-modal.tsx`** (BARU)

- Tab: Share to people | Publish to web
- Input email dengan permission dropdown (View/Comment/Edit)
- Toggle public link + copy button
- Tampilkan daftar orang yang sudah punya akses
- Toggle "include sub-pages"

**Public Page Route**

```
app/public/[token]/page.tsx
  - Tidak memerlukan auth
  - Fetch konten halaman via token
  - Read-only render (atau allow comments jika permission = 'comment')
  - Header minimal: judul workspace, "Made with [AppName]"
```

#### Acceptance Criteria

- [ ] Share ke email → email invitation dikirim (atau langsung akses jika user sudah terdaftar)
- [ ] Public link berfungsi tanpa login
- [ ] Permission levels (View/Comment/Edit) berfungsi dengan benar
- [ ] Revoke akses dari daftar orang yang punya akses
- [ ] Public page responsive di mobile

---

### F-13: Export & Import

**Prioritas:** 🟡 MEDIUM  
**Estimasi:** 1.5 minggu

#### F-13.1: Export

| Format | Konten yang Bisa Di-export |
|--------|--------------------------|
| **Markdown (.md)** | Halaman dokumen |
| **PDF** | Halaman dokumen (print-style) |
| **HTML** | Halaman dokumen (standalone) |
| **CSV** | Database records |
| **JSON** | Seluruh workspace (untuk backup) |

**Implementasi Export**

```typescript
// Markdown: konversi TipTap JSON → Markdown menggunakan tiptap-markdown
// PDF: gunakan puppeteer (server-side) atau html2canvas + jsPDF (client-side)
// CSV: konversi database_rows + properties ke CSV

// API endpoint
POST /api/export
Body: { pageId?, databaseId?, format: 'md'|'pdf'|'html'|'csv'|'json' }
Response: File download stream
```

#### F-13.2: Import

| Format | Sumber |
|--------|--------|
| **Notion export (.zip)** | Import dari Notion (Markdown + CSV) |
| **Markdown (.md)** | File markdown apapun |
| **CSV** | Import ke database |

```typescript
// Import Notion:
// 1. User upload .zip
// 2. Backend ekstrak, parse markdown files, convert ke TipTap JSON
// 3. Parse CSV files, buat database dengan schema dari headers
// 4. Preserve hierarki folder sebagai hierarki halaman

// API endpoint
POST /api/import
  - multipart/form-data: file
  - Body: { type: 'notion'|'markdown'|'csv', target_workspace_id, target_page_id? }
```

#### Acceptance Criteria

- [ ] Export halaman ke Markdown menghasilkan file valid
- [ ] Export database ke CSV dengan semua kolom
- [ ] Export PDF dengan layout yang rapi
- [ ] Import Markdown → halaman baru dengan konten
- [ ] Import CSV → database baru dengan field dari header
- [ ] Import Notion ZIP (partial): halaman dan database dasar

---

### F-14: Notifikasi & Email

**Prioritas:** 🔴 TINGGI (sebagian sudah In Progress)  
**Estimasi:** 1 minggu (sisa, setelah badge selesai)

#### Tipe Notifikasi

| Trigger | Pesan Notifikasi |
|---------|-----------------|
| Ditugaskan ke task | "Budi menugaskan kamu ke [Nama Task]" |
| Di-mention di halaman | "Ani menyebut kamu di [Nama Halaman]" |
| Comment di halaman yang kamu ikuti | "Rio berkomentar di [Nama Halaman]" |
| Reply ke komentar kamu | "Sari membalas komentarmu di [Nama Halaman]" |
| Halaman dibagikan kepadamu | "Deni berbagi [Nama Halaman] denganmu" |
| Diundang ke workspace | "Kamu diundang ke workspace [Nama Workspace]" |
| Diubah perannya | "Peranmu di [Workspace] diubah menjadi [Role]" |

#### Notifikasi Email

```typescript
// Gunakan Resend atau Nodemailer + SMTP
// Email dikirim untuk notifikasi penting jika user tidak online > 5 menit

// Template email yang dibutuhkan:
// - task-assignment.tsx (React Email template)
// - mention-notification.tsx
// - comment-notification.tsx
// - page-shared.tsx
// - workspace-invite.tsx (sudah ada, tingkatkan desain)

// User Preferences untuk notifikasi
// Settings → Notifications:
//   [x] Email saat ditugaskan
//   [x] Email saat di-mention
//   [ ] Email saat ada komentar baru
//   [x] Notifikasi push browser
```

#### Perubahan Database

```sql
-- Preferences notifikasi per user
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email_assignments BOOLEAN DEFAULT TRUE,
  email_mentions BOOLEAN DEFAULT TRUE,
  email_comments BOOLEAN DEFAULT FALSE,
  email_page_shares BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Acceptance Criteria

- [ ] Semua trigger notifikasi di atas menghasilkan notifikasi
- [ ] Email dikirim untuk notifikasi kritis (assignment, mention)
- [ ] User bisa disable email per kategori di Settings
- [ ] "Mark all as read" membersihkan badge

---

### F-15: Sidebar Enhancements

**Prioritas:** 🟡 MEDIUM  
**Estimasi:** 1 minggu

#### F-15.1: Favorit

```sql
ALTER TABLE pages ADD COLUMN is_favorited_by UUID[]; -- array user IDs
-- Atau tabel terpisah:
CREATE TABLE user_favorites (
  user_id UUID REFERENCES auth.users(id),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  sort_order INTEGER,
  PRIMARY KEY (user_id, page_id)
);
```

**UI:** Seksi "Favorites" di atas sidebar tree, bisa drag-reorder, tombol ⭐ di halaman.

#### F-15.2: Recently Visited

```sql
CREATE TABLE user_page_history (
  user_id UUID REFERENCES auth.users(id),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, page_id)
);
-- Keep only last 20 per user (trigger atau cron)
```

**UI:** Seksi "Recent" di bawah Favorites, 5 halaman terakhir.

#### F-15.3: Drag-to-Reorder Sidebar

- Gunakan `@dnd-kit/sortable` untuk reorder halaman dalam sidebar
- Drag halaman ke parent berbeda → move page
- Visual drop indicator saat drag

#### F-15.4: Collapse Sidebar

- Tombol collapse sidebar → sidebar menjadi icon-only (lebar 48px)
- Sidebar melebar kembali saat hover (auto-expand)
- Persist state di localStorage

#### Acceptance Criteria

- [ ] Favorit: tambah, hapus, reorder
- [ ] Recently visited: max 10 halaman, FIFO
- [ ] Drag halaman di sidebar untuk reorder
- [ ] Sidebar bisa di-collapse dan di-expand

---

### F-16: Fitur AI (AI Assistant)

**Prioritas:** 🟢 LOW (Phase 4)  
**Estimasi:** 2 minggu

#### Deskripsi

Integrasikan AI writing assistant langsung ke dalam editor menggunakan Anthropic API.

#### Fitur AI

| Perintah | Fungsi |
|----------|--------|
| **AI: Write** | Generate teks dari prompt |
| **AI: Continue writing** | Lanjutkan paragraf yang ada |
| **AI: Summarize** | Ringkas teks yang dipilih |
| **AI: Make shorter** | Persingkat teks |
| **AI: Make longer** | Perluas teks |
| **AI: Fix grammar** | Perbaiki grammar dan ejaan |
| **AI: Translate** | Terjemahkan ke bahasa tertentu |
| **AI: Change tone** | Formal / Casual / Professional |
| **AI: Brainstorm** | Generate bullet point ide |
| **AI: Explain** | Jelaskan teks yang dipilih |

**Implementasi via Anthropic API (sudah punya akses)**

```typescript
// components/editor/ai-toolbar.tsx
// Muncul saat teks dipilih, dengan tombol AI
// Atau via slash command: /ai ...

// API endpoint
POST /api/ai/assist
Body: {
  action: 'write'|'summarize'|'fix'|'translate'|...,
  selectedText?: string,
  context?: string,  // teks sekitar
  prompt?: string,   // untuk 'write' dan 'translate'
  language?: string  // untuk 'translate'
}

// Gunakan streaming response
// Model: claude-sonnet-4-20250514
```

**AI Block**

```
[✨ AI Block]
Input: "Buatkan ringkasan meeting notes ini"
→ Generate teks dan masukkan sebagai blok konten
```

#### Acceptance Criteria

- [ ] AI toolbar muncul saat teks dipilih
- [ ] AI response streaming ke editor
- [ ] "Regenerate" untuk mendapatkan respons berbeda
- [ ] "Accept" / "Discard" sebelum teks dimasukkan
- [ ] AI tidak berjalan tanpa konfirmasi user (tidak auto-generate)

---

### F-17: Mobile Experience

**Prioritas:** 🟡 MEDIUM  
**Estimasi:** 1.5 minggu

#### Deskripsi

Optimasi pengalaman pengguna di perangkat mobile (smartphone dan tablet).

#### Perubahan

**Sidebar Mobile**

- Sidebar tersembunyi secara default di mobile
- Swipe kanan untuk buka sidebar, atau tombol hamburger
- Bottom navigation bar untuk: Home, Search, Inbox, Settings

**Editor Mobile**

- Toolbar editor muncul di atas keyboard (menggunakan `position: sticky`)
- Touch-friendly block handles
- Swipe untuk delete blok (dengan konfirmasi)

**Database Mobile**

- Default ke List view atau Card view yang lebih compact
- Swipe kiri pada row untuk reveal action buttons (Edit, Delete)
- Filter dan sort dalam bottom sheet

**Responsive Breakpoints**

| Ukuran | Perilaku |
|--------|---------|
| < 640px (Mobile) | Bottom nav, sidebar overlay, simplified editor |
| 640-1024px (Tablet) | Sidebar collapse-able, touch-friendly |
| > 1024px (Desktop) | Pengalaman penuh |

#### Acceptance Criteria

- [ ] Semua fitur utama accessible di mobile
- [ ] Editor bisa digunakan di layar sentuh
- [ ] Sidebar tidak menutupi konten di mobile
- [ ] Database bisa dibaca dan diedit di mobile

---

### F-18: Pengaturan Lanjutan (Settings)

**Prioritas:** 🟡 MEDIUM  
**Estimasi:** 1.5 minggu

#### Halaman Settings yang Diperlukan

**My Account**

- Ubah nama, foto profil
- Ubah email (dengan verifikasi)
- Ubah password
- Hapus akun
- Export data personal (GDPR)

**My Notifications**

- Toggle per kategori notifikasi
- Email digest: Langsung / Harian / Mingguan / Tidak pernah

**My Connected Apps**

- OAuth connections (Google, GitHub)
- API token management (personal access tokens)

**Workspace Settings** (hanya Owner/Admin)

- Ubah nama dan icon workspace
- Domain kustom (opsional, Phase 4)
- Danger zone: hapus workspace

**Members** (sudah ada, enhancement)

- Filter dan search member
- Bulk role change
- Invite via link (bukan hanya email)

**Plans & Billing** (opsional jika ada monetisasi)

- Plan Free / Pro
- Upgrade CTA
- Invoice history

#### Komponen Baru

**`app/settings/layout.tsx`** (BARU)

- Layout dua kolom: sidebar navigasi settings | konten
- Breadcrumb: Settings > [halaman]

#### Acceptance Criteria

- [ ] User bisa update profil dan foto
- [ ] User bisa change password
- [ ] Notification preferences tersimpan di database
- [ ] Workspace settings hanya tampil untuk Owner/Admin
- [ ] Hapus akun: konfirmasi 2x, email verifikasi

---

### F-19: API Publik & Webhooks

**Prioritas:** 🟢 LOW (Phase 4)  
**Estimasi:** 2 minggu

#### Deskripsi

REST API publik untuk integrasi pihak ketiga, dengan dokumentasi Swagger dan sistem webhook.

#### API Endpoints Publik

```
Authentication: Bearer {personal_access_token}

Pages:
  GET    /api/v1/pages
  POST   /api/v1/pages
  GET    /api/v1/pages/:id
  PATCH  /api/v1/pages/:id
  DELETE /api/v1/pages/:id

Databases:
  GET    /api/v1/databases
  GET    /api/v1/databases/:id
  GET    /api/v1/databases/:id/records
  POST   /api/v1/databases/:id/records
  PATCH  /api/v1/databases/:id/records/:recordId

Workspaces:
  GET    /api/v1/workspaces
  GET    /api/v1/workspaces/:id/members
```

#### Webhook System

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['page.created', 'record.updated', ...]
  secret TEXT NOT NULL, -- HMAC-SHA256 signing secret
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Events yang didukung:**
`page.created`, `page.updated`, `page.deleted`, `record.created`, `record.updated`, `record.deleted`, `member.invited`, `member.removed`

#### Acceptance Criteria

- [ ] API merespons dengan format JSON standar
- [ ] Rate limiting: 100 req/menit per token
- [ ] Swagger UI tersedia di `/api/v1/docs`
- [ ] Webhook dikirim dalam < 5 detik setelah event
- [ ] Retry logic untuk webhook gagal (3x dengan exponential backoff)

---

### F-20: Offline & PWA Support

**Prioritas:** 🟢 LOW (Phase 4)  
**Estimasi:** 2 minggu

#### Deskripsi

Aplikasi bisa diinstall sebagai PWA dan bekerja secara offline untuk membaca dan mengedit dokumen.

#### Implementasi

- **next-pwa** atau **Workbox** untuk service worker
- Cache strategi: Network First untuk API, Cache First untuk assets
- **IndexedDB** (via Dexie.js) untuk menyimpan dokumen offline
- Sync queue untuk operasi saat offline

```typescript
// Saat offline:
// 1. Baca dari IndexedDB
// 2. Tulis ke pending_operations queue
// Saat kembali online:
// 3. Sync pending_operations ke server
// 4. Resolve conflicts (last-write-wins atau manual)
```

#### Acceptance Criteria

- [ ] Aplikasi bisa diinstall di Android/iOS/Desktop
- [ ] Halaman yang sudah pernah dibuka bisa dibaca offline
- [ ] Edit offline tersimpan dan di-sync saat online kembali
- [ ] Indikator status offline di UI

---

## 6. Arsitektur Teknis & Perubahan Database

### Schema Overview Setelah Semua Fitur

```
TABLES (Existing + New):
├── auth.users (Supabase)
├── profiles (existing)
├── workspaces (existing)
├── workspace_members (existing)
│
├── pages (existing + alterasi)
│   ├── + parent_id, path, depth, sort_order
│   ├── + icon, cover
│   └── + search_vector
│
├── page_blocks (BARU)
├── page_media (BARU)
├── page_comments (BARU)
├── page_versions (BARU)
├── page_shares (BARU)
│
├── databases (existing)
├── database_fields (existing + baru)
│   └── + support untuk Relation, Rollup, Formula
├── database_rows (existing)
│   └── + parent_row_id (sub-items)
├── database_relations (BARU)
├── database_row_relations (BARU)
│
├── notifications (existing + diperluas)
├── notification_preferences (BARU)
│
├── templates (BARU)
├── user_favorites (BARU)
├── user_page_history (BARU)
│
├── webhooks (BARU, Phase 4)
└── page_versions (BARU)
```

### Pertimbangan Performa

| Area | Strategi |
|------|---------|
| **Editor** | TipTap collaborative dengan Yjs (CRDT) untuk conflict-free concurrent editing |
| **Realtime** | Supabase Realtime untuk perubahan data; presence via Supabase Presence |
| **Search** | Postgres FTS dengan GIN index; pertimbangkan Meilisearch untuk skala besar |
| **Images** | Lazy loading, next/image dengan blur placeholder, WebP conversion |
| **Database views** | Virtual scrolling untuk >500 rows (react-virtual) |
| **Caching** | React Query (TanStack Query) untuk client-side cache dengan stale-while-revalidate |

### Infrastruktur Tambahan

```yaml
# Tambahkan ke docker-compose atau environment
services:
  # Untuk export PDF server-side
  - puppeteer (atau Browserless)

  # Untuk email
  - Resend API (atau Postmark)

  # Untuk AI features
  - Anthropic API (sudah ada akses)

  # Storage untuk media
  - Supabase Storage (built-in, config bucket)
```

---

## 7. Roadmap Implementasi (4 Fase)

### 🏃 Phase 1: Core UX (Minggu 1–6) — HIGHEST PRIORITY

**Tujuan:** Pengalaman editor dan navigasi yang solid

| Minggu | Fitur | Estimasi |
|--------|-------|---------|
| 1–2 | **F-01** Hierarki Halaman (nested pages, breadcrumb) | 2w |
| 2 | **F-04** Cover & Icon Halaman | 1w |
| 3 | **F-02** Slash Command Menu | 1.5w |
| 3–5 | **F-03** Block Types Diperluas (image, toggle, callout, code, math, table, embed) | 2.5w |
| 5–6 | **F-05** Global Search (Cmd+K) | 1.5w |
| 6 | **F-15** Sidebar Enhancements (Favorit, Recent, Collapse, Drag) | 1w |

**Deliverable:** Editor sekelas Notion dengan hierarki halaman penuh

---

### 🤝 Phase 2: Collaboration & Data (Minggu 7–13)

**Tujuan:** Kolaborasi tim dan database yang lebih powerful

| Minggu | Fitur | Estimasi |
|--------|-------|---------|
| 7–8 | **F-06** Komentar & Diskusi (inline + page level) | 2w |
| 8 | **F-07** @Mention System | 1w |
| 8 | **F-14** Notifikasi lengkap + Email (sisa dari In Progress) | 1w |
| 9 | **F-12** Sharing & Public Pages | 1.5w |
| 9–10 | **F-08** Version History | 1.5w |
| 10–11 | **F-09** Templates (15+ template bawaan) | 1.5w |
| 11–13 | **F-10** Database Enhancements (Relation, Rollup, Formula, Sub-items) | 3w |

**Deliverable:** Fitur kolaborasi lengkap dan database sekelas Notion

---

### 📊 Phase 3: Views, Settings & Mobile (Minggu 14–18)

**Tujuan:** Kelengkapan fitur dan UX mobile

| Minggu | Fitur | Estimasi |
|--------|-------|---------|
| 14–15 | **F-11** Timeline/Gantt View + List View | 2w |
| 15–16 | **F-13** Export (MD, PDF, CSV) + Import (Notion, CSV) | 1.5w |
| 16–17 | **F-18** Settings Lanjutan (Profile, Notifikasi, Workspace) | 1.5w |
| 17–18 | **F-17** Mobile Experience (responsive overhaul) | 1.5w |

**Deliverable:** Produk yang siap digunakan profesional

---

### 🚀 Phase 4: Advanced Features (Minggu 19–26)

**Tujuan:** Fitur premium dan ekosistem

| Minggu | Fitur | Estimasi |
|--------|-------|---------|
| 19–20 | **F-16** AI Assistant (Anthropic API) | 2w |
| 21–22 | **F-19** API Publik + Webhooks | 2w |
| 23–24 | **F-20** Offline/PWA Support | 2w |
| 25–26 | Polishing, bug fixing, performance optimization | 2w |

**Deliverable:** Platform siap enterprise dan self-host

---

## 8. Metrik Keberhasilan (KPI)

### Metrik Teknis

| Metrik | Target |
|--------|--------|
| Largest Contentful Paint (LCP) | < 2.5 detik |
| Interaction to Next Paint (INP) | < 200ms |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Editor load time (500 blok) | < 1 detik |
| Search response time | < 300ms |
| Realtime sync latency | < 500ms |
| API p95 response time | < 500ms |
| Supabase storage usage | < 10GB/workspace (soft limit) |

### Metrik Produk

| Metrik | Target Phase 1 | Target Phase 4 |
|--------|---------------|---------------|
| Fitur paritas Notion Free | 60% | 90% |
| Templates tersedia | 5 | 30+ |
| Block types tersedia | 5 (baseline) | 18+ |
| Database field types | 8 (baseline) | 14+ |
| Database views | 4 (baseline) | 7 |

### Metrik Kualitas Kode

| Metrik | Target |
|--------|--------|
| TypeScript strict mode | 100% |
| Test coverage (unit) | > 60% |
| Zero console errors di production | ✅ |
| Lighthouse score | > 90 |
| Accessibility score (axe) | > 90 |

---

## 9. Risiko & Mitigasi

| # | Risiko | Dampak | Kemungkinan | Mitigasi |
|---|--------|--------|-------------|---------|
| R1 | Kompleksitas Relation field menyebabkan performa lambat | Tinggi | Medium | Gunakan materialized views dan index yang tepat; lazy load related records |
| R2 | TipTap collaborative (Yjs) sulit diintegrasikan | Tinggi | Medium | Mulai tanpa Yjs (lock-based), tambah Yjs di Phase 2; ada provider Hocuspocus |
| R3 | Upload media menghabiskan Supabase Storage quota | Medium | Low | Kompresi gambar sebelum upload; limit 10MB per file; soft quota per workspace |
| R4 | Formula engine kompleks dan bug-prone | Medium | High | Mulai dengan subset formula sederhana; gunakan library formula yang sudah teruji |
| R5 | Version history menghabiskan storage database | Medium | Medium | Deduplication: simpan diff, bukan full snapshot; retain policy (hapus versi > 30 hari) |
| R6 | AI response lambat mengganggu UX editor | Low | Medium | Streaming response; loading state yang jelas; AI berjalan di background |
| R7 | Export PDF server-side butuh puppeteer yang berat | Low | Low | Alternatif: pakai html2canvas + jsPDF di client; atau Browserless cloud |
| R8 | Slash command conflict dengan keyboard shortcut lain | Low | Low | Test menyeluruh di semua browser; fallback non-conflicting shortcut |

---

## 10. Dependensi & Keputusan Teknis

### Package Dependencies Baru

```json
{
  "dependencies": {
    // Editor Extensions
    "@tiptap/extension-mention": "^2.x",
    "@tiptap/extension-mathematics": "^2.x",
    "@tiptap/extension-code-block-lowlight": "^2.x",
    "@tiptap/extension-table": "^2.x",
    "lowlight": "^3.x",
    "katex": "^0.x",

    // Drag & Drop
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^7.x",

    // Search & Virtualization
    "react-virtual": "^3.x",  // atau @tanstack/react-virtual

    // Client Cache
    "@tanstack/react-query": "^5.x",

    // Emoji
    "emoji-mart": "^5.x",

    // Diff (Version History)
    "diff-match-patch": "^1.x",

    // Export
    "tiptap-markdown": "^0.x",  // TipTap ke Markdown
    "html2canvas": "^1.x",
    "jspdf": "^2.x",

    // Email
    "@react-email/components": "^0.x",
    "resend": "^3.x",

    // Date
    "date-fns": "^3.x",

    // PWA (Phase 4)
    "next-pwa": "^5.x",
    "dexie": "^3.x"
  }
}
```

### Keputusan Teknis Penting

| Keputusan | Pilihan | Reasoning |
|-----------|---------|-----------|
| Realtime collaboration | Supabase Realtime (tetap) | Sudah terpasang, cukup untuk Phase 1-2 |
| Full collaborative (CRDT) | Yjs + Hocuspocus | Phase 2+ jika needed |
| Email provider | Resend | Developer-friendly, gratis tier 3k email/bulan |
| PDF export | Client-side (html2canvas + jsPDF) | Tidak perlu server tambahan |
| Formula engine | Kustom parser sederhana | Library besar terlalu overkill untuk subset yang dibutuhkan |
| AI model | claude-sonnet-4-20250514 | Sudah ada akses Anthropic API |
| Search (skala kecil) | Postgres FTS | Built-in Supabase, cukup untuk 100k dokumen |
| Search (skala besar) | Meilisearch | Pertimbangkan di Phase 4 jika perlu |

---

## Appendix: Checklist Review PRD

Sebelum implementasi setiap fitur, pastikan:

- [ ] Perubahan database sudah didokumentasikan dan migration script siap
- [ ] API endpoints sudah terdefinisi dengan request/response schema
- [ ] Komponen baru sudah diidentifikasi (BARU vs MODIFIKASI)
- [ ] Acceptance Criteria bisa diuji secara manual
- [ ] Pertimbangan performa sudah dipikirkan
- [ ] RLS policies sudah didesain (tidak ada data leak antar workspace)
- [ ] UI mockup atau referensi visual tersedia sebelum coding
- [ ] Error states sudah dirancang (empty state, error state, loading state)
- [ ] Mobile experience sudah dipertimbangkan

---

*Dokumen ini adalah living document. Update setiap ada perubahan scope, estimasi, atau keputusan teknis.*

**Versi History:**

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.0 | — | Baseline (fitur inti selesai) |
| 2.0 | 19 Apr 2026 | PRD lengkap 20 fitur, 4-fase roadmap |
