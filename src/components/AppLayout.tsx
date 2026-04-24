import { NavLink, Navigate, Outlet } from "react-router-dom";
import { BarChart3, LayoutDashboard, Package, Shirt, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";

const tabs = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/products", label: "Products", icon: Shirt },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/store", label: "Account", icon: Store },
];

export default function AppLayout() {
  const { user, loading } = useStore();

  if (loading) {
    return <div className="app-shell bg-background min-h-screen grid place-items-center text-sm text-muted-foreground">Loading secure dashboard…</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell bg-gradient-soft">
      <Outlet />
      <nav aria-label="Primary" className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur border-t border-border">
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => cn("flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors", isActive ? "text-primary-deep" : "text-muted-foreground hover:text-foreground")}
              >
                {({ isActive }) => (
                  <>
                    <span className={cn("flex items-center justify-center w-9 h-9 rounded-full transition-all", isActive ? "bg-primary-soft" : "bg-transparent")}>
                      <Icon className="w-4 h-4" />
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
