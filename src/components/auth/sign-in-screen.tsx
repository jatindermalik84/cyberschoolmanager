import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, GraduationCap, Loader2, Mail, Megaphone, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import csmLogo from "@/assets/csm-logo.png.asset.json";
import { bannerClasses, overlayStyles, type SignInContent } from "@/lib/sign-in-content";

function newCaptcha() {
  return Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join("");
}

const CAPTCHA_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#7c3aed", "#0891b2"];

/** Usernames without an "@" are resolved against this domain. */
const DEFAULT_USERNAME_DOMAIN = "cybrain.co.in";

function toLoginEmail(username: string) {
  const value = username.trim();
  return value.includes("@") ? value : `${value}@${DEFAULT_USERNAME_DOMAIN}`;
}

/** Renders the captcha code as distorted, multi-coloured digits with noise lines. */
function CaptchaImage({ code }: { code: string }) {
  const digits = code.split("");
  return (
    <svg
      aria-hidden
      viewBox="0 0 130 40"
      className="h-9 w-[130px] select-none rounded-md border border-border/70 bg-muted"
    >
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M0 ${8 + i * 11} Q 32 ${2 + ((i * 13) % 30)} 65 ${20 + ((i * 7) % 12)} T 130 ${6 + i * 12}`}
          stroke="currentColor"
          className="text-muted-foreground/40"
          fill="none"
          strokeWidth="1"
        />
      ))}
      {digits.map((d, i) => (
        <text
          key={i}
          x={14 + i * 24}
          y={28 + (i % 2 === 0 ? -2 : 2)}
          fill={CAPTCHA_COLORS[(i + Number(d)) % CAPTCHA_COLORS.length]}
          fontSize={22 + ((Number(d) + i) % 5)}
          fontFamily="Georgia, serif"
          fontStyle={i % 2 === 0 ? "italic" : "normal"}
          fontWeight="700"
          transform={`rotate(${((Number(d) % 5) - 2) * 8} ${14 + i * 24} 24)`}
        >
          {d}
        </text>
      ))}
    </svg>
  );
}

export function SignInScreen({ content }: { content: SignInContent }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState(() => newCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const overlay = overlayStyles(content);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(newCaptcha());
    setCaptchaAnswer("");
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (captchaAnswer.trim() !== captcha) {
      toast.error("Incorrect captcha answer. Please try again.");
      refreshCaptcha();
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: toLoginEmail(email),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      refreshCaptcha();
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
    const { error } = await supabase.auth.resetPasswordForEmail(toLoginEmail(email), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent to your email.");
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      {content.backgroundUrl ? (
        <>
          <img
            aria-hidden
            src={content.backgroundUrl}
            alt=""
            style={overlay.image}
            className="pointer-events-none fixed inset-0 size-full object-cover"
          />
          {overlay.tint ? (
            <div aria-hidden style={overlay.tint} className="pointer-events-none fixed inset-0" />
          ) : null}
        </>
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-sidebar-primary/20 blur-3xl"
      />

      <div className="relative grid flex-1 gap-10 p-6 lg:grid-cols-[1.1fr_1fr] lg:p-10">
        <aside className="hidden flex-col justify-between gap-10 lg:flex">
        <div className="flex items-center gap-2.5">
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

        <div className="max-w-md space-y-5">
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

        <div />
      </aside>

      <main className="flex items-center justify-center">
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
                  type="text"
                  autoComplete="username"
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
              <div className="space-y-1.5">
                <Label htmlFor="captcha">Enter the code shown</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="captcha"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                    placeholder="Enter captcha"
                    className="flex-1"
                  />
                  <CaptchaImage code={captcha} />
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    aria-label="Get a new captcha"
                    className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <RefreshCw className="size-4" />
                  </button>
                </div>
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

      <footer className="relative flex flex-col items-center gap-2 px-6 py-6 text-center sm:flex-row sm:justify-center sm:gap-4 sm:text-left">
        <img src={csmLogo.url} alt="Cyber School Manager logo" className="h-10 w-auto" />
        <p className="max-w-3xl text-xs text-sidebar-foreground/70">
          &copy; {new Date().getFullYear()} Cybrain Software Solutions&reg;. All rights reserved. Cyber
          School Manager&trade; and the CSM logo are trademarks of Cybrain Software Solutions.
        </p>
      </footer>
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