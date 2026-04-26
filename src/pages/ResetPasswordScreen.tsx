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
    // Supabase parses the recovery link and emits a PASSWORD_RECOVERY event
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
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
