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
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
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

  const supabase = createClient();
  const router = useRouter();



  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setEmail(user.email || "");
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
  }, [user, supabase]);

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
        console.log("Updating password...");
        const { error: pwdError } = await supabase.auth.updateUser({
          password,
        });
        if (pwdError) {
          console.error(
            "Password Update Error Details:",
            JSON.stringify(pwdError, null, 2),
          );
          throw pwdError;
        }
        setPassword("");
        toast.success("Password updated successfully");
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

  const handleLinkAccount = async (provider: "google" | "github") => {
    try {
      const { data, error } = await supabase.auth.linkIdentity({ provider });
      if (error) throw error;
      toast.success(`Successfully linked ${provider} account`);
    } catch (error: any) {
      console.error(`Error linking ${provider}:`, error);
      toast.error(`Error connecting to ${provider}`);
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

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-white">
                          New Password
                        </Label>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Leave blank to keep current"
                          className="bg-zinc-900 border-white/10 text-white max-w-md h-10"
                        />
                      </div>
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isUpdatingProfile || !password}
                        className="bg-white text-black hover:bg-zinc-200"
                      >
                        Change Password
                      </Button>
                    </div>
                  </section>

                  <section className="space-y-6 pt-10 border-t border-white/5">
                    <header>
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        Connected Accounts
                      </h2>
                      <p className="text-zinc-500 text-sm">
                        Link your account to social providers.
                      </p>
                    </header>
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="flex-1 bg-zinc-900 border-white/10 text-white"
                        onClick={() => handleLinkAccount("google")}
                      >
                        Google
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-zinc-900 border-white/10 text-white"
                        onClick={() => handleLinkAccount("github")}
                      >
                        GitHub
                      </Button>
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
