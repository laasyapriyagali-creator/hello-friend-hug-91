import { ChevronRight, Store as StoreIcon, FileText, CreditCard, HelpCircle, User, Scale, ShieldCheck } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";

const items = [
  { icon: StoreIcon, label: "Store details" },
  { icon: FileText, label: "Return & Refund Policy" },
  { icon: CreditCard, label: "Payment settings" },
  { icon: HelpCircle, label: "Help & support" },
  { icon: User, label: "Account settings" },
  { icon: Scale, label: "Terms & conditions" },
  { icon: ShieldCheck, label: "Privacy Policy" },
];

export default function StoreSettingsScreen() {
  return (
    <div className="screen-pad">
      <ScreenHeader subtitle="My Store" title="Account" />

      <div className="card-soft overflow-hidden">
        <ul className="divide-y divide-border">
          {items.map(({ icon: Icon, label }) => (
            <li key={label}>
              <button className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-primary-softer transition-colors">
                <span className="w-9 h-9 rounded-full bg-primary-soft text-primary-deep flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-6">
        © JENOZ — All rights reserved
      </p>
    </div>
  );
}
