"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Monitor,
  LogOut,
  User,
  Building,
  Settings2,
  Users,
  Bell,
  Shield,
  Mail,
  Globe,
  Save,
  Loader2,
  Check,
  X,
  ExternalLink,
  Unlink,
  Link2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Workspace } from "@/lib/types";
import { WorkspaceMembers } from "@/components/workspace-members";
import { createClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CropImageDialog } from "./crop-image-dialog";
import { ConfirmModal } from "./confirm-modal";
import { Switch } from "@/components/ui/switch";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
}: ProfileModalProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile State
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [rawImageSrc, setRawImageSrc] = React.useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [notificationSettings, setNotificationSettings] = React.useState({
    email: {
      mentions: true,
      assignments: true,
      comments: true,
      updates: false,
    },
    desktop: {
      mentions: true,
      assignments: true,
      comments: true,
    },
  });

  // Google connection state
  const [googleStatus, setGoogleStatus] = React.useState<{
    connected: boolean;
    email: string | null;
    loading: boolean;
  }>({ connected: false, email: null, loading: true });
  const [isLinkingGoogle, setIsLinkingGoogle] = React.useState(false);
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = React.useState(false);
  const [googleIdentity, setGoogleIdentity] = React.useState<any>(null);
  const [githubIdentity, setGithubIdentity] = React.useState<any>(null);

  const supabase = createClient();
  const router = useRouter();



  // Fetch Google connection status
  const fetchGoogleStatus = React.useCallback(async () => {
    if (!user) return;
    try {
      setGoogleStatus((prev) => ({ ...prev, loading: true }));
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/auth/google/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setGoogleStatus({
        connected: data.connected || false,
        email: data.email || null,
        loading: false,
      });
    } catch {
      setGoogleStatus({ connected: false, email: null, loading: false });
    }
  }, [user, supabase]);

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setEmail(user.email || "");

      // Get user identities to check linked providers
      const { data: { user: fullUser } } = await supabase.auth.getUser();
      if (fullUser?.identities) {
        setGoogleIdentity(
          fullUser.identities.find((i) => i.provider === 'google') || null
        );
        setGithubIdentity(
          fullUser.identities.find((i) => i.provider === 'github') || null
        );
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setFirstName(data.first_name || data.full_name?.split(" ")[0] || "");
        setLastName(
          data.last_name || data.full_name?.split(" ").slice(1).join(" ") || "",
        );
        setAvatarUrl(data.avatar_url || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        if (data.notification_settings) {
          setNotificationSettings(data.notification_settings);
        }
      }
    };
    fetchProfile();
    fetchGoogleStatus();
  }, [user, supabase, fetchGoogleStatus]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        console.log("Uploading avatar...");
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });
        if (uploadError) {
          console.error(
            "Upload Error Details:",
            JSON.stringify(uploadError, null, 2),
          );
          throw uploadError;
        }
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        finalAvatarUrl = publicUrlData.publicUrl;
        console.log("Avatar uploaded:", finalAvatarUrl);
      }

      console.log("Updating user profile record...");
      
      // Check if username is taken by another user
      if (username) {
        const { data: existingUser, error: checkError } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("username", username)
          .neq("id", user.id)
          .maybeSingle();

        if (existingUser) {
          toast.error("Username is already taken. Please choose another one.");
          setIsUpdatingProfile(false);
          return;
        }
      }

      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        username: username,
        bio: bio,
        avatar_url: finalAvatarUrl,
        notification_settings: notificationSettings,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error(
          "Profile Update Error Details:",
          JSON.stringify(error, null, 2),
        );
        
        if (error.code === "23505") {
          toast.error("Username is already taken. Please choose another one.");
          setIsUpdatingProfile(false);
          return;
        }
        
        throw error;
      }

      if (email && email !== user.email) {
        console.log("Updating email...");
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) {
          console.error(
            "Email Update Error Details:",
            JSON.stringify(emailError, null, 2),
          );
          throw emailError;
        }
        toast.info("Verification link sent to new email address.");
      }

      if (password) {
        // If password is provided here, we'll ignore it and use the dedicated Change Password button
        // to avoid complexity with current password verification in a general profile update
        console.warn("Password provided in profile update. Use the dedicated Security tab instead.");
      }

      toast.success("Profile updated successfully");
      // Clear file selection visually after upload
      setAvatarFile(null);
      setAvatarUrl(finalAvatarUrl);
      window.dispatchEvent(new Event("profile_updated"));
      router.refresh();
    } catch (error: any) {
      console.error("Full Error Object:", error);
      toast.error(
        error.message || error.error_description || "Failed to update profile",
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user || !user.email) return;
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (password.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // 1. Verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        return;
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) throw error;
      toast.success("Account deleted forever.");
      signOut();
      onClose();
      router.push("/login");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(
        "Failed to delete account. You may need to run the SQL profile setup script first.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      setIsLinkingGoogle(true);
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/workspaces`,
          scopes: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      // The user will be redirected to Google OAuth consent screen
      // After granting permission, they'll be redirected back via /auth/callback
    } catch (error: any) {
      console.error('Error linking Google:', error);
      if (error.message?.includes('Identity is already linked')) {
        toast.error('This Google account is already linked to another user.');
      } else if (error.message?.includes('Manual linking is disabled')) {
        toast.error('Account linking is not enabled. Please contact the administrator.');
      } else {
        toast.error(error.message || 'Failed to connect Google account');
      }
      setIsLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!googleIdentity) return;
    try {
      setIsUnlinkingGoogle(true);

      // Remove the identity from Supabase Auth
      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
      if (error) throw error;

      // Remove stored Google tokens
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch('/api/auth/google/status', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }

      setGoogleIdentity(null);
      setGoogleStatus({ connected: false, email: null, loading: false });
      toast.success('Google account disconnected');
    } catch (error: any) {
      console.error('Error unlinking Google:', error);
      if (error.message?.includes('Cannot unlink')) {
        toast.error('Cannot disconnect: you need at least one login method.');
      } else {
        toast.error(error.message || 'Failed to disconnect Google account');
      }
    } finally {
      setIsUnlinkingGoogle(false);
    }
  };

  const handleLinkGithub = async () => {
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/workspaces`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error linking GitHub:', error);
      toast.error(error.message || 'Failed to connect GitHub account');
    }
  };



  return (
    <>
      <CropImageDialog
        isOpen={isCropOpen}
        imageSrc={rawImageSrc}
        onClose={() => {
          setIsCropOpen(false);
          if (rawImageSrc) {
            URL.revokeObjectURL(rawImageSrc);
            setRawImageSrc(null);
          }
        }}
        onCropped={(croppedBlob) => {
          const croppedFile = new File([croppedBlob], "profile_cropped.jpg", {
            type: "image/jpeg",
          });
          setAvatarFile(croppedFile);
          setAvatarUrl(URL.createObjectURL(croppedBlob));
          setIsCropOpen(false);
        }}
      />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:max-w-4xl h-[95vh] sm:h-[85vh] flex flex-col sm:flex-row gap-0 p-0 overflow-hidden rounded-xl border-none shadow-2xl bg-zinc-950">
          <DialogHeader className="sr-only">
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>
          <Tabs
            defaultValue="general"
            className="flex flex-col sm:flex-row w-full h-full"
          >
            {/* Sidebar Area */}
            <div className="w-full sm:w-64 bg-zinc-900/50 border-b sm:border-b-0 sm:border-r border-white/5 py-4 sm:py-6 px-4 flex flex-col gap-4 shrink-0 overflow-x-auto flex-nowrap hide-scrollbar">
              <h3 className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Profile
              </h3>
              <TabsList className="justify-start sm:justify-center flex flex-row sm:flex-col items-center sm:items-stretch h-auto bg-transparent p-0 space-x-2 sm:space-x-0 sm:space-y-1 overflow-x-auto flex-nowrap w-max sm:w-full">
                <TabsTrigger
                  value="general"
                  className="justify-start px-3 py-2 text-sm font-medium data-[state=active]:bg-white/5 data-[state=active]:text-white text-zinc-400 hover:text-white transition-all shrink-0 border-none"
                >
                  <User className="w-4 h-4 sm:mr-2 mr-1" />
                  General
                </TabsTrigger>

                <TabsTrigger
                  value="notifications"
                  className="justify-start px-3 py-2 text-sm font-medium data-[state=active]:bg-white/5 data-[state=active]:text-white text-zinc-400 hover:text-white transition-all shrink-0 border-none"
                >
                  <Bell className="w-4 h-4 sm:mr-2 mr-1" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="justify-start px-3 py-2 text-sm font-medium data-[state=active]:bg-white/5 data-[state=active]:text-white text-zinc-400 hover:text-white transition-all shrink-0 border-none"
                >
                  <Shield className="w-4 h-4 sm:mr-2 mr-1" />
                  Security
                </TabsTrigger>

              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto w-full h-full bg-zinc-950 p-6 sm:p-10 relative">
              <div className="max-w-2xl mx-auto space-y-10">
                <TabsContent
                  value="general"
                  className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        Profile
                      </h2>
                      <p className="text-zinc-500 text-sm">
                        These informations will be displayed publicly.
                      </p>
                    </div>
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={isUpdatingProfile}
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      {isUpdatingProfile ? "Saving..." : "Save changes"}
                    </Button>
                  </header>

                  <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4">
                      <div className="pt-2">
                        <Label className="text-sm font-semibold text-white">
                          Name <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Will appear on receipts, invoices, and other
                          communication.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                          className="bg-zinc-900 border-white/10 text-white h-10"
                        />
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last name"
                          className="bg-zinc-900 border-white/10 text-white h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4">
                      <div className="pt-2">
                        <Label className="text-sm font-semibold text-white">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Used to sign in, for email receipts and product
                          updates.
                        </p>
                      </div>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="bg-zinc-900 border-white/10 text-white h-10"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4">
                      <div className="pt-2">
                        <Label className="text-sm font-semibold text-white">
                          Username <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Your unique username for logging in and your profile
                          URL.
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Input
                          value={username}
                          onChange={(e) =>
                            setUsername(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, ""),
                            )
                          }
                          placeholder="username"
                          className="bg-zinc-900 border-white/10 text-white h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
                      <div className="pt-1">
                        <Label className="text-sm font-semibold text-white">
                          Avatar
                        </Label>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          JPG, GIF or PNG. 1MB Max.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-zinc-500">
                              {(
                                firstName?.charAt(0) ||
                                lastName?.charAt(0) ||
                                ""
                              ).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white text-dark dark:text-white hover:bg-zinc-200 border-none h-8 px-4"
                          onClick={() =>
                            document.getElementById("avatar-input")?.click()
                          }
                        >
                          Choose
                        </Button>
                        <input
                          id="avatar-input"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              const imageUrl = URL.createObjectURL(file);
                              setRawImageSrc(imageUrl);
                              setIsCropOpen(true);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4 text-white">
                      <div className="pt-2">
                        <Label className="text-sm font-semibold">Bio</Label>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Brief description for your profile. URLs are
                          hyperlinked.
                        </p>
                      </div>
                      <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Write something about yourself..."
                        className="bg-zinc-900 border-white/10 text-white min-h-[120px] resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-10 space-y-6">
                    <header>
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        Appearance
                      </h2>
                      <p className="text-zinc-500 text-sm">
                        Customize how the interface looks and feels.
                      </p>
                    </header>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className="flex-1 bg-zinc-900 border-white/10 text-white hover:bg-zinc-800 data-[state=active]:bg-white data-[state=active]:text-black"
                      >
                        <Sun className="w-4 h-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className="flex-1 bg-zinc-900 border-white/10 text-white hover:bg-zinc-800 data-[state=active]:bg-white data-[state=active]:text-black"
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("system")}
                        className="flex-1 bg-zinc-900 border-white/10 text-white hover:bg-zinc-800 data-[state=active]:bg-white data-[state=active]:text-black"
                      >
                        <Monitor className="w-4 h-4 mr-2" />
                        System
                      </Button>
                    </div>
                  </div>
                </TabsContent>



                <TabsContent
                  value="notifications"
                  className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        Notifications
                      </h2>
                      <p className="text-zinc-500 text-sm">
                        Configure how you receive alerts and updates.
                      </p>
                    </div>
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={isUpdatingProfile}
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      {isUpdatingProfile ? "Saving..." : "Save changes"}
                    </Button>
                  </header>

                  <div className="space-y-10 pt-4">
                    {/* Email Notifications Section */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Email Notifications</h3>
                          <p className="text-xs text-zinc-500">Choose what you want to receive in your inbox.</p>
                        </div>
                      </div>

                      <div className="grid gap-4 pl-1">
                        {[
                          { id: "mentions", label: "Mentions", desc: "When someone @mentions you in a page or comment.", icon: "@" },
                          { id: "assignments", label: "Assignments", desc: "When you are assigned to a task or database row.", icon: "📋" },
                          { id: "comments", label: "Comments", desc: "When someone replies to your comments or activity.", icon: "💬" },
                          { id: "updates", label: "Product Updates", desc: "Receive tips, news, and new feature announcements.", icon: "🚀" }
                        ].map((item) => (
                          <div key={`email-${item.id}`} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-900/80 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs grayscale">{item.icon}</span>
                                <Label htmlFor={`email-${item.id}`} className="text-sm font-medium text-zinc-200 cursor-pointer">{item.label}</Label>
                              </div>
                              <p className="text-[11px] text-zinc-500 max-w-[400px]">{item.desc}</p>
                            </div>
                            <Switch
                              id={`email-${item.id}`}
                              checked={(notificationSettings.email as any)[item.id]}
                              onCheckedChange={(checked) => setNotificationSettings({
                                ...notificationSettings,
                                email: { ...notificationSettings.email, [item.id]: checked }
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </section>

                    <Separator className="bg-white/5" />

                    {/* Push Notifications Section */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Desktop Notifications</h3>
                          <p className="text-xs text-zinc-500">Real-time alerts while you are working.</p>
                        </div>
                      </div>

                      <div className="grid gap-4 pl-1">
                        {[
                          { id: "mentions", label: "Mentions", desc: "Show desktop alert when someone mentions you.", icon: "@" },
                          { id: "assignments", label: "Assignments", desc: "Show desktop alert for new task assignments.", icon: "📋" },
                          { id: "comments", label: "Comments", desc: "Show desktop alert for new activity on your items.", icon: "💬" }
                        ].map((item) => (
                          <div key={`desktop-${item.id}`} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-900/80 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs grayscale">{item.icon}</span>
                                <Label htmlFor={`desktop-${item.id}`} className="text-sm font-medium text-zinc-200 cursor-pointer">{item.label}</Label>
                              </div>
                              <p className="text-[11px] text-zinc-500 max-w-[400px]">{item.desc}</p>
                            </div>
                            <Switch
                              id={`desktop-${item.id}`}
                              checked={(notificationSettings.desktop as any)[item.id]}
                              onCheckedChange={(checked) => setNotificationSettings({
                                ...notificationSettings,
                                desktop: { ...notificationSettings.desktop, [item.id]: checked }
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </TabsContent>

                <TabsContent
                  value="security"
                  className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <section className="space-y-6">
                    <header>
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        Security
                      </h2>
                      <p className="text-zinc-500 text-sm">
                        Update your password and manage account security.
                      </p>
                    </header>

                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-white">
                            Current Password
                          </Label>
                          <div className="relative max-w-md">
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter current password"
                              className="bg-zinc-900 border-white/10 text-white h-10 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-white">
                            New Password
                          </Label>
                          <div className="relative max-w-md">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Min. 6 characters"
                              className="bg-zinc-900 border-white/10 text-white h-10 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-white">
                            Confirm New Password
                          </Label>
                          <div className="relative max-w-md">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Repeat new password"
                              className={`bg-zinc-900 text-white h-10 pr-10 ${
                                confirmPassword && password !== confirmPassword
                                  ? "border-red-500 ring-red-500/20"
                                  : "border-white/10"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {confirmPassword && password !== confirmPassword && (
                            <p className="text-[11px] font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                              Passwords do not match
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={handleUpdatePassword}
                        disabled={isUpdatingPassword || !password || !currentPassword || !confirmPassword}
                        className="bg-white text-black hover:bg-zinc-200"
                      >
                        {isUpdatingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </div>
                  </section>

                  <section className="space-y-6 pt-10 border-t border-white/5">
                    <header>
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        Connected Accounts
                      </h2>
                      <p className="text-zinc-500 text-sm">
                        Link your account to external providers for additional features like Google Drive access.
                      </p>
                    </header>

                    <div className="space-y-3">
                      {/* Google Account */}
                      <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-900/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                              <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-white">Google</h4>
                                {googleStatus.loading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                                ) : googleStatus.connected || googleIdentity ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                                    <Check className="h-3 w-3" />
                                    Connected
                                  </span>
                                ) : null}
                              </div>
                              {googleStatus.connected && googleStatus.email ? (
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                  {googleStatus.email} · Google Drive access enabled
                                </p>
                              ) : googleIdentity ? (
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                  {googleIdentity.identity_data?.email || 'Linked'}
                                </p>
                              ) : (
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                  Connect to enable Google Drive access
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {googleStatus.connected || googleIdentity ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                onClick={handleUnlinkGoogle}
                                disabled={isUnlinkingGoogle}
                              >
                                {isUnlinkingGoogle ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Unlink className="h-3.5 w-3.5" />
                                )}
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 border-white/10 bg-white/5 text-white hover:bg-white/10"
                                onClick={handleLinkGoogle}
                                disabled={isLinkingGoogle}
                              >
                                {isLinkingGoogle ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Link2 className="h-3.5 w-3.5" />
                                )}
                                Connect
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* GitHub Account */}
                      <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-900/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-white">GitHub</h4>
                                {githubIdentity ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                                    <Check className="h-3 w-3" />
                                    Connected
                                  </span>
                                ) : null}
                              </div>
                              {githubIdentity ? (
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                  {githubIdentity.identity_data?.user_name || githubIdentity.identity_data?.email || 'Linked'}
                                </p>
                              ) : (
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                  Connect your GitHub account
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {githubIdentity ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase.auth.unlinkIdentity(githubIdentity);
                                    if (error) throw error;
                                    setGithubIdentity(null);
                                    toast.success('GitHub account disconnected');
                                  } catch (error: any) {
                                    toast.error(error.message || 'Failed to disconnect GitHub');
                                  }
                                }}
                              >
                                <Unlink className="h-3.5 w-3.5" />
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 border-white/10 bg-white/5 text-white hover:bg-white/10"
                                onClick={handleLinkGithub}
                              >
                                <Link2 className="h-3.5 w-3.5" />
                                Connect
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6 pt-10 border-t border-white/5">
                    <header>
                      <h2 className="text-2xl font-bold tracking-tight text-red-500">
                        Danger Zone
                      </h2>
                      <p className="text-zinc-500 text-sm">
                        Permanent actions related to your account.
                      </p>
                    </header>
                    <div className="p-4 border border-red-500/20 rounded-lg bg-red-500/5 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-red-500 text-sm">
                          Delete Account
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          All data will be permanently removed.
                        </p>
                      </div>
                      <ConfirmModal
                        onConfirm={handleDeleteAccount}
                        title="Delete Account?"
                        description="Are you absolutely sure you want to delete your entire account? This will delete all your workspaces, pages, and data permanently. This action cannot be undone."
                        variant="danger"
                      >
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeletingAccount}
                        >
                          {isDeletingAccount ? "Deleting..." : "Delete Account"}
                        </Button>
                      </ConfirmModal>
                    </div>
                  </section>
                </TabsContent>


              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
