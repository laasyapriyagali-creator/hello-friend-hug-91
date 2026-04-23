import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useState } from "react";
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
} from "lucide-react";
import { useStore } from "@/store/useStore";
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
  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form);
  };
  return (
    <form onSubmit={onSave} className="space-y-4">
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
  const { logout } = useStore();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifPayout, setNotifPayout] = useState(true);

  const onPwdSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd || pwd !== pwd2) return;
    setPwd("");
    setPwd2("");
    import("sonner").then(({ toast }) => toast.success("Password updated"));
  };

  return (
    <div className="space-y-5">
      <form onSubmit={onPwdSave} className="card-soft p-4 space-y-3">
        <p className="text-sm font-semibold">Change password</p>
        <div className="space-y-2">
          <Label htmlFor="pwd">New password</Label>
          <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pwd2">Confirm password</Label>
          <Input id="pwd2" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
        </div>
        <Button
          type="submit"
          disabled={!pwd || pwd !== pwd2}
          className="w-full h-11 bg-primary hover:bg-primary-deep rounded-xl"
        >
          Update password
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
