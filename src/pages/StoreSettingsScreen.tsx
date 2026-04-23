import { Link } from "react-router-dom";
import {
  ChevronRight,
  Store as StoreIcon,
  FileText,
  CreditCard,
  HelpCircle,
  User,
  Scale,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

const items = [
  { icon: StoreIcon, label: "Store details", to: "/store/store-details" },
  { icon: FileText, label: "Return & Refund Policy", to: "/store/return-policy" },
  { icon: CreditCard, label: "Payment settings", to: "/store/payment-settings" },
  { icon: HelpCircle, label: "Help & support", to: "/store/help-support" },
  { icon: User, label: "Account settings", to: "/store/account-settings" },
  { icon: Scale, label: "Terms & conditions", to: "/store/terms" },
  { icon: ShieldCheck, label: "Privacy Policy", to: "/store/privacy" },
];

export default function StoreSettingsScreen() {
  const { profile, logout } = useStore();

  return (
    <div className="screen-pad">
      <ScreenHeader subtitle="My Store" title="Account" />

      <div className="card-soft p-4 mb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-soft text-primary-deep flex items-center justify-center font-bold text-lg">
          {profile.storeName[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{profile.storeName}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        </div>
      </div>

      <div className="card-soft overflow-hidden">
        <ul className="divide-y divide-border">
          {items.map(({ icon: Icon, label, to }) => (
            <li key={to}>
              <Link
                to={to}
                className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-primary-softer transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-primary-soft text-primary-deep flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Button
        variant="outline"
        className="w-full mt-4 h-12 rounded-2xl border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
        onClick={logout}
      >
        <LogOut className="w-4 h-4" /> Log out
      </Button>

      <p className="text-center text-[11px] text-muted-foreground mt-6">
        © JENOZ — All rights reserved
      </p>
    </div>
  );
}
