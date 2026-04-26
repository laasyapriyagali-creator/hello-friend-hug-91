import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    // Listen for recovery / sign-in events first
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });

    const init = async () => {
      try {
        // 1) Hash-fragment style links: #access_token=...&refresh_token=...&type=recovery
        const hash = window.location.hash?.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken && refreshToken) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!setErr && mounted) {
            setReady(true);
            // Clean the URL so tokens aren't visible
            window.history.replaceState({}, document.title, "/reset-password");
            return;
          }
          if (setErr) {
            setError(setErr.message);
          }
        }

        // 2) PKCE / query-param style links: ?code=...
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!exErr && mounted) {
            setReady(true);
            window.history.replaceState({}, document.title, "/reset-password");
            return;
          }
          if (exErr) setError(exErr.message);
        }

        // 3) Fallback: maybe a session already exists
        const { data: s } = await supabase.auth.getSession();
        if (s.session && mounted) {
          setReady(true);
          return;
        }

        // Nothing worked — surface a helpful message
        if (mounted && !accessToken && !code) {
          setError("This reset link is invalid or has expired. Request a new one from the login screen.");
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Could not verify reset link");
      }
    };

    init();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pwd.length < 8) return setError("Password must be at least 8 characters");
    if (pwd !== pwd2) return setError("Passwords do not match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate("/orders", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app-shell bg-background min-h-screen px-5 py-10 flex flex-col justify-center">
      <section className="space-y-6">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
            <LockKeyhole className="w-6 h-6" />
          </div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">JENOZ Partner</p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Set a new password</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {ready
              ? "Enter your new password below. You'll stay signed in afterwards."
              : "Verifying your reset link…"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pwd">New password</Label>
            <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={8} required disabled={!ready} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd2">Confirm new password</Label>
            <Input id="pwd2" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} minLength={8} required disabled={!ready} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full h-12 rounded-2xl" disabled={busy || !ready}>
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </section>
    </main>
  );
}
