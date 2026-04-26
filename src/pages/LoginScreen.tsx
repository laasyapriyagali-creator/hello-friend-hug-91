import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Chrome, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

export default function LoginScreen() {
  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword } = useStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("JENOZ Store");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await signIn(email, password);
      else await signUp(email, password, storeName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotBusy(true);
    try {
      await resetPassword(forgotEmail);
      const { toast } = await import("sonner");
      toast.success("Reset link sent. Check your email.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err) {
      const { toast } = await import("sonner");
      toast.error(err instanceof Error ? err.message : "Could not send reset link");
    } finally {
      setForgotBusy(false);
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
          <h1 className="text-3xl font-bold tracking-tight mt-1">Secure store login</h1>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
          {(["login", "signup"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={cn("h-10 rounded-xl text-sm font-semibold transition", mode === item ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
            >
              {item === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="store">Store name</Label>
              <Input id="store" value={storeName} onChange={(e) => setStoreName(e.target.value)} minLength={2} required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full h-12 rounded-2xl" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
          </Button>
        </form>

        <Button type="button" variant="outline" className="w-full h-12 rounded-2xl" onClick={() => signInWithGoogle().catch((err) => setError(err.message))}>
          <Chrome className="w-4 h-4" /> Continue with Google
        </Button>
      </section>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setForgotOpen(false)}>
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-lg p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h2 className="text-lg font-bold">Reset your password</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We'll email you a secure link to set a new password.
              </p>
            </div>
            <form onSubmit={submitForgot} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">Email</Label>
                <Input id="forgotEmail" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required autoFocus />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setForgotOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 h-11 rounded-xl" disabled={forgotBusy}>
                  {forgotBusy ? "Sending…" : "Send reset link"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
