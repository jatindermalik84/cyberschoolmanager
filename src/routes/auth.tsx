import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, GraduationCap, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import csmLogo from "@/assets/csm-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Sign in | Cyber School Manager" },
      {
        name: "description",
        content:
          "One sign-in for school admins, teachers, accountants and students. Access your school workspace securely.",
      },
      { property: "og:title", content: "Sign in | Cyber School Manager" },
      { property: "og:description", content: "One sign-in for every role in your school." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) {
      toast.success("Check your email to confirm your account before signing in.");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch {
      setBusy(false);
      toast.error("Google sign-in could not start. Please try again.");
    }
  }

  async function handleReset() {
    if (!email) { toast.error("Enter your email address first."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset link sent to your email.");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-sidebar-primary/20 blur-3xl"
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <span className="font-display text-lg font-semibold text-sidebar-accent-foreground">
            Cyber School Manager
          </span>
        </div>

        <div className="relative max-w-md space-y-5">
          <h1 className="font-display text-4xl font-semibold leading-tight text-sidebar-accent-foreground">
            One workspace for the whole school.
          </h1>
          <p className="text-sm leading-relaxed text-sidebar-foreground/80">
            Admissions, attendance, examinations, fees, transport, library, hostel, payroll and
            communication — all under a single sign-in, whichever role you hold.
          </p>
          <ul className="grid gap-2 text-sm text-sidebar-foreground/80">
            {["Same link for admins, teachers and students", "Multi-school tenancy with strict data isolation", "Self-service password reset"].map(
              (item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sidebar-primary" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="relative space-y-3">
          <img
            src={csmLogo.url}
            alt="Cyber School Manager logo"
            className="h-12 w-auto"
          />
          <p className="text-xs text-sidebar-foreground/50">
            Phase 1 prototype · modules roll out in later phases
          </p>
          <p className="text-xs text-sidebar-foreground/50">
            &copy; {new Date().getFullYear()} Cybrain Software Solutions&reg;. All rights reserved.
            Cyber School Manager&trade; and the CSM logo are trademarks of Cybrain Software Solutions.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-sm border-border/70 shadow-sm">
          <CardHeader className="space-y-1.5">
            <CardTitle className="font-display text-2xl">Sign in to your school</CardTitle>
            <CardDescription>Use the account your school administrator set up.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              disabled={busy}
            >
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-4">
                <form className="space-y-4" onSubmit={handleSignIn}>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.edu.in"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={setPassword}
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="animate-spin" /> : <Mail />} Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form className="space-y-4" onSubmit={handleSignUp}>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Anita Sharma"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email-up">Email</Label>
                    <Input
                      id="email-up"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password-up">Password</Label>
                    <Input
                      id="password-up"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="animate-spin" /> : null} Create account
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    New accounts need a school role assigned by an administrator before modules
                    unlock.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
        aria-controls={id}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

