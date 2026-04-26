import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Store as StoreIcon,
  FileText,
  CreditCard,
  HelpCircle,
  User,
  Scale,
  ShieldCheck,
  Mail,
  Phone,
  Camera,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type SectionKey =
  | "store-details"
  | "return-policy"
  | "payment-settings"
  | "help-support"
  | "account-settings"
  | "terms"
  | "privacy";

const titles: Record<SectionKey, { title: string; subtitle: string; Icon: typeof StoreIcon }> = {
  "store-details": { title: "Store details", subtitle: "Profile", Icon: StoreIcon },
  "return-policy": { title: "Return & Refund Policy", subtitle: "Policies", Icon: FileText },
  "payment-settings": { title: "Payment settings", subtitle: "Payouts", Icon: CreditCard },
  "help-support": { title: "Help & support", subtitle: "We're here", Icon: HelpCircle },
  "account-settings": { title: "Account settings", subtitle: "Security", Icon: User },
  terms: { title: "Terms & conditions", subtitle: "Legal", Icon: Scale },
  privacy: { title: "Privacy Policy", subtitle: "Legal", Icon: ShieldCheck },
};

export default function AccountDetailScreen() {
  const navigate = useNavigate();
  const { section } = useParams<{ section: SectionKey }>();
  const valid = section && section in titles;
  if (!valid) return <Navigate to="/store" replace />;

  const meta = titles[section as SectionKey];

  return (
    <div className="screen-pad">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate("/store")}
          className="p-2 -ml-2 rounded-full hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-primary-deep font-semibold">
            {meta.subtitle}
          </p>
          <h1 className="text-xl font-bold leading-tight">{meta.title}</h1>
        </div>
      </div>

      {section === "store-details" && <StoreDetailsForm />}
      {section === "return-policy" && <ReturnPolicyForm />}
      {section === "payment-settings" && <PaymentSettingsForm />}
      {section === "help-support" && <HelpSupport />}
      {section === "account-settings" && <AccountSettingsForm />}
      {section === "terms" && <LegalDoc kind="terms" />}
      {section === "privacy" && <LegalDoc kind="privacy" />}
    </div>
  );
}

/* ---------------- Store Details ---------------- */

function StoreDetailsForm() {
  const { profile, updateProfile } = useStore();
  const [form, setForm] = useState(profile);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form);
  };

  const onPickFile = () => fileInputRef.current?.click();

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    try {
      setUploading(true);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        toast.error("Please sign in again to upload");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/logo-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("store-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from("store-logos").getPublicUrl(path);
      const next = { ...form, logoUrl: pub.publicUrl };
      setForm(next);
      await updateProfile({ logoUrl: pub.publicUrl });
      toast.success("Logo updated");
    } catch (err: any) {
      toast.error(err?.message || "Could not upload logo");
    } finally {
      setUploading(false);
    }
  };

  const onRemoveLogo = async () => {
    setForm({ ...form, logoUrl: "" });
    await updateProfile({ logoUrl: "" });
    toast.success("Logo removed");
  };

  const initials = (form.storeName || "S")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="card-soft p-4 flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex items-center justify-center border border-border">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Store logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">{initials}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onPickFile}
            disabled={uploading}
            aria-label="Change logo"
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Store logo</p>
          <p className="text-xs text-muted-foreground">PNG or JPG, up to 5 MB.</p>
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPickFile}
              disabled={uploading}
              className="h-8 rounded-full"
            >
              {form.logoUrl ? "Replace" : "Upload"}
            </Button>
            {form.logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemoveLogo}
                disabled={uploading}
                className="h-8 rounded-full text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onLogoChange}
        />
      </div>

      <Field label="Store name" id="storeName" value={form.storeName} onChange={(v) => setForm({ ...form, storeName: v })} />
      <Field label="Owner name" id="ownerName" value={form.ownerName} onChange={(v) => setForm({ ...form, ownerName: v })} />
      <Field label="Email" id="email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
      <Field label="Phone" id="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} />
      </div>
      <Field label="GSTIN" id="gstin" value={form.gstin} onChange={(v) => setForm({ ...form, gstin: v.toUpperCase() })} />
      <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary-deep rounded-2xl">
        Save changes
      </Button>
    </form>
  );
}

/* ---------------- Return Policy ---------------- */

function ReturnPolicyForm() {
  const { returnPolicy, updateReturnPolicy } = useStore();
  const [form, setForm] = useState(returnPolicy);
  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateReturnPolicy(form);
  };
  return (
    <form onSubmit={onSave} className="space-y-4">
      <ToggleRow
        label="Accept returns"
        description="Customers can request a return within the window."
        checked={form.acceptsReturns}
        onChange={(v) => setForm({ ...form, acceptsReturns: v })}
      />
      <ToggleRow
        label="Accept exchanges"
        description="Allow size or colour exchanges."
        checked={form.acceptsExchanges}
        onChange={(v) => setForm({ ...form, acceptsExchanges: v })}
      />
      <div className="space-y-2">
        <Label htmlFor="window">Return window (days)</Label>
        <Input
          id="window"
          inputMode="numeric"
          value={form.windowDays.toString()}
          onChange={(e) =>
            setForm({ ...form, windowDays: Number(e.target.value.replace(/\D/g, "")) || 0 })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes for customers</Label>
        <Textarea
          id="notes"
          rows={4}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary-deep rounded-2xl">
        Save policy
      </Button>
    </form>
  );
}

/* ---------------- Payment Settings ---------------- */

function PaymentSettingsForm() {
  const { payment, updatePayment } = useStore();
  const [form, setForm] = useState(payment);
  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePayment(form);
  };
  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="space-y-2">
        <Label>Default payout method</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["Bank", "UPI"] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setForm({ ...form, payoutMethod: m })}
              className={cn(
                "h-11 rounded-xl text-sm font-medium border transition",
                form.payoutMethod === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground/70",
              )}
            >
              {m === "Bank" ? "Bank account" : "UPI"}
            </button>
          ))}
        </div>
      </div>

      {form.payoutMethod === "Bank" ? (
        <>
          <Field label="Account holder" id="bankHolder" value={form.bankHolder} onChange={(v) => setForm({ ...form, bankHolder: v })} />
          <Field label="Bank name" id="bankName" value={form.bankName} onChange={(v) => setForm({ ...form, bankName: v })} />
          <Field label="Account number" id="account" value={form.accountNumber} onChange={(v) => setForm({ ...form, accountNumber: v })} />
          <Field label="IFSC code" id="ifsc" value={form.ifsc} onChange={(v) => setForm({ ...form, ifsc: v.toUpperCase() })} />
        </>
      ) : (
        <Field label="UPI ID" id="upi" value={form.upi} onChange={(v) => setForm({ ...form, upi: v })} />
      )}

      <ToggleRow
        label="Auto-payout"
        description="Send earnings to your default method weekly."
        checked={form.autoPayout}
        onChange={(v) => setForm({ ...form, autoPayout: v })}
      />

      <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary-deep rounded-2xl">
        Save settings
      </Button>
    </form>
  );
}

/* ---------------- Help & Support ---------------- */

function HelpSupport() {
  const faqs = [
    { q: "How do I add a new product?", a: "Go to the Products tab and tap “Add a product”. Upload an image, set price, sizes and stock." },
    { q: "When do payouts happen?", a: "Available balance is paid out on your selected schedule (weekly by default for auto-payout)." },
    { q: "How do I reject an order?", a: "Open the order under New Orders and tap Reject — the customer is notified instantly." },
    { q: "Can I edit a delivered order?", a: "No, delivered orders are final. You can refer to your reorder history under Delivered Orders." },
  ];
  return (
    <div className="space-y-4">
      <div className="card-soft p-4 space-y-3">
        <p className="text-sm font-semibold">Contact JENOZ Partner Support</p>
        <a
          href="mailto:partners@jenoz.shop"
          className="flex items-center gap-3 p-3 rounded-xl bg-primary-softer hover:bg-primary-soft transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-primary-soft text-primary-deep flex items-center justify-center">
            <Mail className="w-4 h-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">Email us</p>
            <p className="text-xs text-muted-foreground">partners@jenoz.shop</p>
          </div>
        </a>
        <a
          href="tel:+911800123123"
          className="flex items-center gap-3 p-3 rounded-xl bg-primary-softer hover:bg-primary-soft transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-primary-soft text-primary-deep flex items-center justify-center">
            <Phone className="w-4 h-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">Call partner line</p>
            <p className="text-xs text-muted-foreground">1800-123-123 · 9am – 9pm</p>
          </div>
        </a>
      </div>

      <div className="card-soft p-4">
        <p className="text-sm font-semibold mb-3">Frequently asked</p>
        <ul className="divide-y divide-border">
          {faqs.map((f) => (
            <li key={f.q} className="py-3">
              <p className="text-sm font-medium">{f.q}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.a}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Account Settings ---------------- */

function AccountSettingsForm() {
  const { logout, updatePassword, deleteAccount } = useStore();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifPayout, setNotifPayout] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const onPwdSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd || pwd !== pwd2) return;
    if (pwd.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPwdBusy(true);
    try {
      await updatePassword(pwd);
      setPwd("");
      setPwd2("");
    } catch (err: any) {
      toast.error(err?.message || "Could not update password");
    } finally {
      setPwdBusy(false);
    }
  };

  const onConfirmDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteOpen(false);
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Could not delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={onPwdSave} className="card-soft p-4 space-y-3">
        <p className="text-sm font-semibold">Change password</p>
        <div className="space-y-2">
          <Label htmlFor="pwd">New password</Label>
          <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={8} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pwd2">Confirm password</Label>
          <Input id="pwd2" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} minLength={8} />
        </div>
        <Button
          type="submit"
          disabled={!pwd || pwd !== pwd2 || pwdBusy}
          className="w-full h-11 bg-primary hover:bg-primary-deep rounded-xl"
        >
          {pwdBusy ? "Updating…" : "Update password"}
        </Button>
      </form>

      <div className="card-soft p-4 space-y-3">
        <p className="text-sm font-semibold">Notifications</p>
        <ToggleRow
          label="New order alerts"
          description="Push and email when a new order arrives."
          checked={notifNewOrder}
          onChange={setNotifNewOrder}
        />
        <ToggleRow
          label="Payout notifications"
          description="Get notified when money lands in your account."
          checked={notifPayout}
          onChange={setNotifPayout}
        />
      </div>

      <Button
        variant="outline"
        className="w-full h-12 rounded-2xl border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
        onClick={() => {
          logout();
          navigate("/store");
        }}
      >
        Log out
      </Button>

      <div className="card-soft p-4 space-y-3 border-destructive/30">
        <div>
          <p className="text-sm font-semibold text-destructive">Danger zone</p>
          <p className="text-xs text-muted-foreground mt-1">
            Permanently delete your store, products, orders and account. This cannot be undone.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => { setDeleteConfirm(""); setDeleteOpen(true); }}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete account
        </Button>
      </div>

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => !deleting && setDeleteOpen(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-2xl border border-destructive/40 shadow-lg p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-lg font-bold text-destructive">Delete your account?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This will permanently remove your store, products, orders, payouts and login.
                <span className="block mt-2 font-medium text-destructive">These changes cannot be undone.</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                autoFocus
                disabled={deleting}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 h-11 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50"
                disabled={deleteConfirm !== "DELETE" || deleting}
                onClick={onConfirmDelete}
              >
                {deleting ? "Deleting…" : "Delete account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Legal documents ---------------- */

function LegalDoc({ kind }: { kind: "terms" | "privacy" }) {
  const content =
    kind === "terms"
      ? [
          { h: "1. Acceptance", p: "By using the JENOZ Partner app you agree to these terms and any updates we publish in-app." },
          { h: "2. Listings", p: "You are responsible for the accuracy of product names, images, prices, sizes and stock you publish." },
          { h: "3. Orders & fulfilment", p: "Once an order is accepted, it must be packed and handed to a delivery partner within the agreed window." },
          { h: "4. Commission", p: "JENOZ retains a 10% platform commission on every completed sale, deducted before payout." },
          { h: "5. Termination", p: "We may suspend partners who repeatedly cancel orders, ship counterfeit goods, or violate community standards." },
        ]
      : [
          { h: "What we collect", p: "Store profile, products, orders, payout details and device data needed to run the partner app." },
          { h: "How we use it", p: "To process orders, calculate payouts, prevent fraud, and improve the partner experience." },
          { h: "Sharing", p: "We share order details with delivery partners and customers, and payout data with regulated payment providers." },
          { h: "Your rights", p: "You can request export or deletion of your data at any time by emailing partners@jenoz.shop." },
          { h: "Security", p: "Data is encrypted in transit and at rest. Access is limited to authorised JENOZ staff on a need-to-know basis." },
        ];
  return (
    <div className="card-soft p-5 space-y-4">
      <p className="text-xs text-muted-foreground">Last updated 22 Apr 2026</p>
      {content.map((c) => (
        <section key={c.h}>
          <h2 className="text-sm font-semibold mb-1">{c.h}</h2>
          <p className="text-sm text-foreground/80 leading-relaxed">{c.p}</p>
        </section>
      ))}
    </div>
  );
}

/* ---------------- Shared bits ---------------- */

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
