"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Database, 
  Users, 
  Zap, 
  MousePointer2, 
  Layout, 
  Search,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function DocsPage() {
  const [lang, setLang] = useState<"en" | "id">("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("docs-lang") as "en" | "id";
    if (savedLang) setLang(savedLang);

    const handleLangChange = () => {
      const currentLang = localStorage.getItem("docs-lang") as "en" | "id";
      if (currentLang) setLang(currentLang);
    };

    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const content = {
    en: {
      badge: "Prodeo Documentation",
      title: <>Next-Generation <br /><span className="text-primary italic">Productivity Hub</span></>,
      intro: "Welcome to the official Prodeo Hub documentation. Learn how to maximize your workspace for smarter and faster collaboration.",
      quickStartTitle: "Quick Start Guide",
      quickSteps: [
        { step: "01", title: "Create a Workspace", desc: "Workspaces are the top-level containers for your projects. Invite team members to collaborate." },
        { step: "02", title: "Add your first Page", desc: "Click the '+' button in the sidebar to create a new page. You can start with a blank document or a database." },
        { step: "03", title: "Organize with Folders", desc: "Drag and drop pages to create nested structures and keep your work organized." }
      ],
      editorTitle: "Rich Text Editor",
      editorDesc: "A clean yet powerful writing experience. Use slash commands to insert content blocks instantly.",
      editorFeatures: [
        { label: "Markdown Support", desc: "Write fast with standard markdown syntax." },
        { label: "Slash Commands", desc: "Type '/' to insert images, tables, or databases." },
        { label: "Live Collaboration", desc: "See team member cursors in real-time while editing." }
      ],
      dbTitle: "Structured Databases",
      dbDesc: "Transform your pages into powerful databases. Organize projects, track tasks, and manage data with flexible views.",
      dbViews: [
        { name: "Table View", color: "text-blue-500" },
        { name: "Board View", color: "text-amber-500" },
        { name: "Gallery View", color: "text-rose-500" },
        { name: "Calendar View", color: "text-green-500" }
      ],
      chatTitle: "Real-time Chat",
      chatDesc: "Communicate with your team without switching apps. Prodeo Hub includes a powerful real-time chat system built into every workspace.",
      chatItems: [
        { name: "Alex", msg: "Hey team, how's the progress?", time: "10:00 AM" },
        { name: "Sarah", msg: "Almost done with the design!", time: "10:02 AM" },
        { name: "You", msg: "Great! Let's review it later.", time: "10:05 AM" }
      ],
      chatFeatures: [
        "Instant messaging with low latency",
        "Read receipts and typing indicators",
        "Emoji reactions for quick feedback",
        "Channel-based organization"
      ],
      shortcutTitle: "Keyboard Shortcuts",
      shortcutDesc: "Boost your productivity with these essential keyboard shortcuts. Master Prodeo Hub without leaving your keyboard.",
      shortcutCats: [
        { 
          title: "General", 
          items: [
            { key: "Ctrl + K", desc: "Open global search" },
            { key: "Ctrl + /", desc: "Toggle sidebar" },
            { key: "Ctrl + S", desc: "Save changes (auto-saves)" }
          ]
        },
        { 
          title: "Editor", 
          items: [
            { key: "/", desc: "Open slash command menu" },
            { key: "Ctrl + B", desc: "Bold text" },
            { key: "Ctrl + I", desc: "Italic text" }
          ]
        }
      ],
      securityTitle: "Workspace Security",
      securityDesc: "Prodeo Hub uses enterprise-grade security to ensure your data is always safe and accessible only to authorized members.",
      securityItems: [
        { title: "Row Level Security (RLS)", desc: "Every piece of data is protected at the database level, ensuring cross-workspace isolation." },
        { title: "Member Roles", desc: "Define who can view, edit, or manage your workspace content with granular permissions." }
      ],
      ctaTitle: "Still need help?",
      ctaDesc: "Our support team is always here to help you get the most out of Prodeo Hub.",
      ctaBtn1: "Contact Support",
      ctaBtn2: "Community Forum"
    },
    id: {
      badge: "Dokumentasi Prodeo",
      title: <>Pusat Produktivitas <br /><span className="text-primary italic">Generasi Berikutnya</span></>,
      intro: "Selamat datang di dokumentasi resmi Prodeo Hub. Pelajari cara memaksimalkan workspace Anda untuk kolaborasi yang lebih cerdas dan cepat.",
      quickStartTitle: "Panduan Cepat",
      quickSteps: [
        { step: "01", title: "Buat Workspace", desc: "Workspace adalah kontainer tingkat atas untuk proyek Anda. Undang anggota tim untuk berkolaborasi." },
        { step: "02", title: "Tambahkan Halaman Pertama", desc: "Klik tombol '+' di sidebar untuk membuat halaman baru. Mulai dengan dokumen kosong atau database." },
        { step: "03", title: "Atur dengan Folder", desc: "Seret dan lepas halaman untuk membuat struktur bertingkat dan menjaga pekerjaan tetap teratur." }
      ],
      editorTitle: "Editor Teks Kaya",
      editorDesc: "Pengalaman menulis yang bersih namun bertenaga. Gunakan perintah slash untuk menyisipkan blok konten secara instan.",
      editorFeatures: [
        { label: "Markdown Support", desc: "Tulis cepat dengan sintaks markdown standar." },
        { label: "Slash Commands", desc: "Ketik '/' untuk menyisipkan gambar, tabel, atau database." },
        { label: "Live Collaboration", desc: "Lihat kursor anggota tim secara real-time saat mengedit." }
      ],
      dbTitle: "Database Terstruktur",
      dbDesc: "Ubah halaman Anda menjadi database yang kuat. Atur proyek, lacak tugas, dan kelola data dengan tampilan yang fleksibel.",
      dbViews: [
        { name: "Tampilan Tabel", color: "text-blue-500" },
        { name: "Tampilan Board", color: "text-amber-500" },
        { name: "Tampilan Galeri", color: "text-rose-500" },
        { name: "Tampilan Kalender", color: "text-green-500" }
      ],
      chatTitle: "Chat Real-time",
      chatDesc: "Berkomunikasi dengan tim Anda tanpa berpindah aplikasi. Prodeo Hub menyertakan sistem chat real-time yang kuat di setiap workspace.",
      chatItems: [
        { name: "Alex", msg: "Halo tim, bagaimana progressnya?", time: "10:00 AM" },
        { name: "Sarah", msg: "Hampir selesai dengan desainnya!", time: "10:02 AM" },
        { name: "Anda", msg: "Bagus! Mari kita tinjau nanti.", time: "10:05 AM" }
      ],
      chatFeatures: [
        "Pesan instan dengan latensi rendah",
        "Indikator pesan dibaca dan sedang mengetik",
        "Reaksi emoji untuk umpan balik cepat",
        "Pengaturan berbasis channel"
      ],
      shortcutTitle: "Pintasan Keyboard",
      shortcutDesc: "Tingkatkan produktivitas Anda dengan pintasan keyboard esensial ini. Kuasai Prodeo Hub tanpa meninggalkan keyboard Anda.",
      shortcutCats: [
        { 
          title: "Umum", 
          items: [
            { key: "Ctrl + K", desc: "Buka pencarian global" },
            { key: "Ctrl + /", desc: "Tampilkan/sembunyikan sidebar" },
            { key: "Ctrl + S", desc: "Simpan perubahan (auto-save)" }
          ]
        },
        { 
          title: "Editor", 
          items: [
            { key: "/", desc: "Buka menu perintah slash" },
            { key: "Ctrl + B", desc: "Tebalkan teks" },
            { key: "Ctrl + I", desc: "Miringkan teks" }
          ]
        }
      ],
      securityTitle: "Keamanan Workspace",
      securityDesc: "Prodeo Hub menggunakan keamanan kelas enterprise untuk memastikan data Anda selalu aman dan hanya dapat diakses oleh anggota yang berwenang.",
      securityItems: [
        { title: "Row Level Security (RLS)", desc: "Setiap bagian data dilindungi pada tingkat database, memastikan isolasi antar workspace." },
        { title: "Peran Anggota", desc: "Tentukan siapa yang dapat melihat, mengedit, atau mengelola konten workspace Anda dengan izin yang terperinci." }
      ],
      ctaTitle: "Masih butuh bantuan?",
      ctaDesc: "Tim dukungan kami selalu siap membantu Anda memaksimalkan penggunaan Prodeo Hub.",
      ctaBtn1: "Hubungi Dukungan",
      ctaBtn2: "Forum Komunitas"
    }
  }[lang];

  return (
    <div className="space-y-24 pb-20">
      {/* Introduction */}
      <section id="introduction" className="scroll-mt-24">
        <motion.div 
          key={`intro-${lang}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Badge variant="outline" className="px-4 py-1 border-primary/20 bg-primary/5 text-primary rounded-full font-medium">
            {content.badge}
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            {content.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            {content.intro}
          </p>
        </motion.div>
      </section>

      {/* Quick Start */}
      <section id="quick-start" className="scroll-mt-24 pt-8 border-t border-muted/50">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              {content.quickStartTitle}
            </h2>
            <div className="space-y-8 mt-10">
              {content.quickSteps.map((item, i) => (
                <motion.div 
                  key={`${i}-${lang}`}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 group"
                >
                  <span className="text-4xl font-black text-muted/30 group-hover:text-primary/20 transition-colors tabular-nums italic">
                    {item.step}
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">{item.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-muted/30 rounded-3xl p-8 border border-muted/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <Sparkles className="h-6 w-6 text-primary/40 animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-2 w-24 bg-primary/20 rounded-full" />
              <div className="h-8 w-48 bg-foreground/10 rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted-foreground/10 rounded-md" />
                <div className="h-4 w-5/6 bg-muted-foreground/10 rounded-md" />
                <div className="h-4 w-4/6 bg-muted-foreground/10 rounded-md" />
              </div>
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="h-20 bg-background border rounded-xl" />
                <div className="h-20 bg-background border rounded-xl" />
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* Rich Text Editor */}
      <section id="documents" className="scroll-mt-24 pt-8 border-t border-muted/50">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            key={`editor-text-${lang}`}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              {content.editorTitle}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {content.editorDesc}
            </p>
            <div className="space-y-4">
              {content.editorFeatures.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card border rounded-2xl p-6 shadow-2xl shadow-primary/5 relative"
          >
            <div className="flex items-center gap-2 mb-4 border-b pb-4">
              <div className="h-3 w-3 rounded-full bg-red-500/20" />
              <div className="h-3 w-3 rounded-full bg-amber-500/20" />
              <div className="h-3 w-3 rounded-full bg-green-500/20" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-1/2 bg-foreground/10 rounded" />
              <div className="h-4 w-full bg-muted-foreground/5 rounded" />
              <div className="h-4 w-full bg-muted-foreground/5 rounded" />
              <div className="h-4 w-5/6 bg-muted-foreground/20 rounded-full animate-pulse" />
            </div>
            <MousePointer2 className="absolute top-1/2 right-1/4 h-5 w-5 text-primary drop-shadow-md" />
          </motion.div>
        </div>
      </section>

      {/* Databases */}
      <section id="databases" className="scroll-mt-24 pt-8 border-t border-muted/50">
        <motion.div 
          key={`db-${lang}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-green-500" />
            </div>
            {content.dbTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            {content.dbDesc}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {content.dbViews.map((view, i) => (
              <div key={i} className="p-4 bg-background border rounded-xl flex items-center justify-between group hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center ${view.color}`}>
                    <Layout className={`h-4 w-4 ${view.name.includes("Board") || view.name.includes("Papan") ? "rotate-90" : ""}`} />
                  </div>
                  <span className="font-medium text-sm">{view.name}</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary" />
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Real-time Chat */}
      <section id="collaboration" className="scroll-mt-24 pt-8 border-t border-muted/50">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            key={`chat-ui-${lang}`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="order-2 md:order-1 bg-muted/40 rounded-2xl p-8 border border-muted/50 flex flex-col gap-4"
          >
            {content.chatItems.map((chat, i) => (
              <div key={i} className={`p-3 rounded-xl max-w-[80%] ${chat.name === "You" || chat.name === "Anda" ? "bg-primary text-primary-foreground self-end" : "bg-background border self-start"}`}>
                <div className="flex justify-between items-end gap-4 mb-1">
                  <span className="text-[10px] font-bold uppercase opacity-70">{chat.name}</span>
                  <span className="text-[10px] opacity-50">{chat.time}</span>
                </div>
                <p className="text-sm">{chat.msg}</p>
              </div>
            ))}
          </motion.div>
          <motion.div 
            key={`chat-text-${lang}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-1 md:order-2"
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-purple-500" />
              </div>
              {content.chatTitle}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {content.chatDesc}
            </p>
            <ul className="space-y-3">
              {content.chatFeatures.map((text, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section id="shortcuts" className="scroll-mt-24 pt-8 border-t border-muted/50">
        <motion.div 
          key={`shortcuts-${lang}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-orange-500" />
            </div>
            {content.shortcutTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            {content.shortcutDesc}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {content.shortcutCats.map((cat, i) => (
              <div key={i} className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground/70 px-3 border-l-2 border-primary/20">{cat.title}</h4>
                {cat.items.map((item, j) => (
                  <div key={j} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-muted/50">
                    <span className="text-sm">{item.desc}</span>
                    <kbd className="px-2 py-1 bg-background border rounded text-[10px] font-bold shadow-sm">{item.key}</kbd>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Workspace Security */}
      <section id="permissions" className="scroll-mt-24 pt-8 border-t border-muted/50">
        <motion.div 
          key={`security-${lang}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-rose-500" />
            </div>
            {content.securityTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">
            {content.securityDesc}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.securityItems.map((item, i) => (
              <div key={i} className="p-6 bg-card border rounded-2xl">
                <h4 className="font-bold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Call to action */}
      <motion.section 
        key={`cta-${lang}`}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mt-20 p-8 md:p-12 bg-primary rounded-3xl text-primary-foreground relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">{content.ctaTitle}</h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            {content.ctaDesc}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button className="px-8 h-12 rounded-full bg-white text-primary font-bold hover:bg-white/90 transition-colors">
              {content.ctaBtn1}
            </button>
            <button className="px-8 h-12 rounded-full bg-primary-foreground/10 border border-white/20 text-white font-bold hover:bg-white/10 transition-colors">
              {content.ctaBtn2}
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
