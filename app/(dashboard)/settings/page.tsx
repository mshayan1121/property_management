"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(1, "Currency is required"),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type CompanyForm = z.infer<typeof companySchema>;

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileForm | null>(null);
  const [company, setCompany] = useState<CompanyForm | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [companySuccess, setCompanySuccess] = useState(false);

  const supabase = createClient();
  const [canManageUsers, setCanManageUsers] = useState(false);

  useEffect(() => {
    const client = createClient();
    async function checkAdmin() {
      const { data: userData } = await client.auth.getUser();
      if (!userData.user) return;
      const { data: profile } = await client
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();
      setCanManageUsers(profile?.role === "admin");
    }
    checkAdmin();
  }, []);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile ?? undefined,
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    values: company ?? undefined,
  });

  useEffect(() => {
    const client = createClient();
    async function load() {
      const { data: userData } = await client.auth.getUser();
      if (!userData.user) return;

      const { data: profileData } = await client
        .from("profiles")
        .select("full_name")
        .eq("id", userData.user.id)
        .single();

      if (profileData) {
        setProfile({ fullName: profileData.full_name });
      } else {
        setProfile({
          fullName:
            userData.user.user_metadata?.full_name ??
            userData.user.email?.split("@")[0] ??
            "User",
        });
      }

      const { data: companyData } = await client
        .from("companies")
        .select("name, timezone, currency")
        .limit(1)
        .single();

      if (companyData) {
        setCompany({
          name: companyData.name,
          timezone: companyData.timezone,
          currency: companyData.currency,
        });
      } else {
        setCompany({
          name: "",
          timezone: "Asia/Dubai",
          currency: "AED",
        });
      }
    }
    load();
  }, []);

  async function onProfileSubmit(data: ProfileForm) {
    setProfileError(null);
    setProfileSuccess(false);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.fullName, updated_at: new Date().toISOString() })
      .eq("id", userData.user.id);

    if (error) {
      setProfileError(error.message);
      return;
    }
    setProfileSuccess(true);
  }

  async function onPasswordSubmit(data: PasswordForm) {
    setPasswordError(null);
    setPasswordSuccess(false);

    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPasswordSuccess(true);
    passwordForm.reset();
  }

  async function onCompanySubmit(data: CompanyForm) {
    setCompanyError(null);
    setCompanySuccess(false);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userData.user.id)
      .single();

    if (profileData?.company_id) {
      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          timezone: data.timezone,
          currency: data.currency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileData.company_id);

      if (error) {
        setCompanyError(error.message);
        return;
      }
    } else {
      const { data: newCompany, error: insertError } = await supabase
        .from("companies")
        .insert({
          name: data.name,
          timezone: data.timezone,
          currency: data.currency,
        })
        .select("id")
        .single();

      if (insertError) {
        setCompanyError(insertError.message);
        return;
      }

      if (newCompany) {
        await supabase
          .from("profiles")
          .update({
            company_id: newCompany.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userData.user.id);
      }
    }
    setCompanySuccess(true);
  }

  const displayName = profile?.fullName ?? "User";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Update your name and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            {profileError && (
              <div
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div
                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground"
                role="status"
              >
                Profile updated.
              </div>
            )}
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage />
                <AvatarFallback className="text-lg">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label htmlFor="profile-fullName">Full name</Label>
                <Input
                  id="profile-fullName"
                  {...profileForm.register("fullName")}
                />
                {profileForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
            >
              {profileForm.formState.isSubmitting ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {canManageUsers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Users & Roles
            </CardTitle>
            <CardDescription>
              Manage team members, roles, and send invites (Admin only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings/users">Manage users</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {canManageUsers && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>
              View create, update, and delete activity across the platform (Admin only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/settings/audit-log">View audit log</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            {passwordError && (
              <div
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div
                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground"
                role="status"
              >
                Password updated.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...passwordForm.register("currentPassword")}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                {...passwordForm.register("newPassword")}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
            >
              {passwordForm.formState.isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
          <CardDescription>Basic company information</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={companyForm.handleSubmit(onCompanySubmit)}
            className="space-y-4"
          >
            {companyError && (
              <div
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {companyError}
              </div>
            )}
            {companySuccess && (
              <div
                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground"
                role="status"
              >
                Company updated.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="company-name">Company name</Label>
              <Input
                id="company-name"
                {...companyForm.register("name")}
              />
              {companyForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {companyForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-timezone">Timezone</Label>
              <Select
                value={companyForm.watch("timezone")}
                onValueChange={(v) => companyForm.setValue("timezone", v)}
              >
                <SelectTrigger id="company-timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                  <SelectItem value="Asia/Muscat">Asia/Muscat</SelectItem>
                  <SelectItem value="Asia/Qatar">Asia/Qatar</SelectItem>
                  <SelectItem value="Asia/Riyadh">Asia/Riyadh</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-currency">Currency</Label>
              <Select
                value={companyForm.watch("currency")}
                onValueChange={(v) => companyForm.setValue("currency", v)}
              >
                <SelectTrigger id="company-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={companyForm.formState.isSubmitting}
            >
              {companyForm.formState.isSubmitting ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
