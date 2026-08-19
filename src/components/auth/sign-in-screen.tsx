import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, GraduationCap, Loader2, Mail, Megaphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import csmLogo from "@/assets/csm-logo.png.asset.json";
import { bannerClasses, type SignInContent } from "@/lib/sign-in-content";

export function SignInScreen({ content }: { content: SignInContent }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function handleReset() {
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent to your email.");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        {content.backgroundUrl ? (
          <>
            <img
              aria-hidden
              src={content.backgroundUrl}
              alt=""
              className="pointer-events-none absolute inset-0 size-full object-cover opacity-25"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-sidebar/70" />
          </>
        ) : null}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-sidebar-primary/20 blur-3xl"
        />

        <div className="relative flex items-center gap-2.5">
          {content.logoUrl ? (
            <img
              src={content.logoUrl}
              alt={`${content.brandName} logo`}
              className="size-10 rounded-md bg-white/90 object-contain p-1"
            />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
          )}
          <span className="font-display text-lg font-semibold text-sidebar-accent-foreground">
            {content.brandName}
          </span>
        </div>

        <div className="relative max-w-md space-y-5">
          {content.bannerEnabled && content.bannerText ? (
            <div
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${bannerClasses(content.bannerTone)}`}
            >
              <Megaphone className="mt-0.5 size-3.5 shrink-0" />
              <span>{content.bannerText}</span>
            </div>
          ) : null}
          <h1 className="font-display text-4xl font-semibold leading-tight text-sidebar-accent-foreground">
            {content.headline}
          </h1>
          {content.description ? (
            <p className="text-sm leading-relaxed text-sidebar-foreground/80">{content.description}</p>
          ) : null}
          {content.highlights.length > 0 ? (
            <ul className="grid gap-2 text-sm text-sidebar-foreground/80">
              {content.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sidebar-primary" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="relative space-y-3">
          <img src={csmLogo.url} alt="Cyber School Manager logo" className="h-12 w-auto" />
          <p className="text-xs text-sidebar-foreground/50">
            &copy; {new Date().getFullYear()} Cybrain Software Solutions&reg;. All rights reserved. Cyber
            School Manager&trade; and the CSM logo are trademarks of Cybrain Software Solutions.
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
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Username</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
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
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </form>
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
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
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