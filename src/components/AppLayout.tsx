import { NavLink, Outlet } from "react-router-dom";
import { Package, Shirt, Wallet, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Orders", icon: Package, end: true },
  { to: "/products", label: "Products", icon: Shirt },
  { to: "/earnings", label: "Earnings", icon: Wallet },
  { to: "/store", label: "Store", icon: Store },
];

export default function AppLayout() {
  return (
    <div className="app-shell bg-gradient-soft">
      <Outlet />
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur border-t border-border"
      >
        <ul className="grid grid-cols-4">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                    isActive ? "text-primary-deep" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full transition-all",
                        isActive ? "bg-primary-soft" : "bg-transparent",
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
