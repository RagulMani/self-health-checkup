import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useSession } from "@/components/AuthSessionProvider";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { InlineError } from "@/components/layout/PageStates";
import { RedirectIfAuthed } from "@/components/layout/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const { signUp } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!agreed) return setError("Please confirm you understand this app is not a medical service.");
    setBusy(true);
    const res = await signUp(email.trim(), password, name.trim() || undefined);
    setBusy(false);
    if (!res.success) {
      setError(res.status === 409 ? "An account with this email already exists." : res.error);
      return;
    }
    navigate("/profile?welcome=1", { replace: true });
  }

  return (
    <RedirectIfAuthed>
      <AuthLayout
        title="Create your account"
        subtitle="Start tracking your health in under a minute."
        footer={
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} className="grid gap-4">
          <InlineError message={error} />
          <div className="grid gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" className="h-10" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-10" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm">Confirm</Label>
              <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10" />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">At least 8 characters.</p>
          <label className="flex items-start gap-2.5 rounded-md border bg-muted p-3 text-xs text-muted-foreground">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0D7377]" />
            <span>
              I understand this app gives general wellness information only and does not replace a doctor, diagnosis or emergency care.
            </span>
          </label>
          <Button type="submit" className="h-10" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            Create account
          </Button>
        </form>
      </AuthLayout>
    </RedirectIfAuthed>
  );
}
