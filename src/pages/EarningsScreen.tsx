import { Link } from "react-router-dom";
import { Wallet, TrendingUp, Package } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

export default function EarningsScreen() {
  const { orders, payouts, balance, products } = useStore();

  const todayEarnings = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.amount, 0);
  const ordersCompleted = orders.filter((o) => o.status === "delivered").length;
  const totalOrders = orders.length;
  const totalEarnings = orders.reduce((s, o) => s + o.amount, 0);
  const commission = Math.round(totalEarnings * 0.1);
  const yourEarnings = totalEarnings - commission;

  const topProducts = [...products].sort((a, b) => b.sold - a.sold).slice(0, 3);
  const sizeDemand: Record<string, number> = {};
  products.forEach((p) => p.sizes.forEach((s) => (sizeDemand[s] = (sizeDemand[s] || 0) + p.sold)));
  const topSizes = Object.entries(sizeDemand).sort((a, b) => b[1] - a[1]);
  const maxSize = topSizes[0]?.[1] || 1;

  return (
    <div className="screen-pad">
      <ScreenHeader subtitle="Analysis" title="Earnings" />

      {/* Today */}
      <section className="card-soft p-5 mb-4 bg-gradient-primary text-primary-foreground">
        <p className="text-xs uppercase tracking-wider opacity-90">Today's Earnings</p>
        <p className="text-3xl font-bold mt-1">₹{todayEarnings.toLocaleString("en-IN")}</p>
        <p className="text-sm opacity-90 mt-1">Orders Completed · {ordersCompleted}</p>
      </section>

      {/* This week */}
      <section className="card-soft p-5 mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          This Week
        </h2>
        <dl className="space-y-2 text-sm">
          <Row label="Total Orders" value={totalOrders.toString()} />
          <Row label="Total Earnings" value={`₹${totalEarnings.toLocaleString("en-IN")}`} />
          <Row label="JENOZ's Commission" value={`− ₹${commission.toLocaleString("en-IN")}`} />
          <div className="border-t border-border pt-2">
            <Row
              label="Your Earnings"
              value={`₹${yourEarnings.toLocaleString("en-IN")}`}
              strong
            />
          </div>
        </dl>
      </section>

      {/* Balance */}
      <section className="card-soft p-5 mb-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-1">
          <Wallet className="w-4 h-4" /> Available Balance
        </div>
        <p className="text-3xl font-bold text-primary-deep">
          ₹{balance.toLocaleString("en-IN")}
        </p>
        <Link to="/earnings/withdraw" className="block mt-3">
          <Button className="w-full bg-primary hover:bg-primary-deep h-11 rounded-xl">
            Withdraw money
          </Button>
        </Link>
      </section>

      {/* Analytics */}
      <section className="card-soft p-5 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Top selling
        </h2>
        <ul className="space-y-2">
          {topProducts.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-soft text-primary-deep text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="flex-1 text-sm">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.sold} sold</span>
            </li>
          ))}
        </ul>

        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">
          Sizes in demand
        </h3>
        <div className="space-y-1.5">
          {topSizes.map(([s, n]) => (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="w-6 font-semibold">{s}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary rounded-full"
                  style={{ width: `${(n / maxSize) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-muted-foreground">{n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* History */}
      <section className="card-soft p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" /> Payment History
        </h2>
        <ul className="divide-y divide-border">
          {payouts.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium">{p.date}</p>
                <p className="text-[11px] text-muted-foreground">{p.method}</p>
              </div>
              <p className="text-sm font-semibold text-primary-deep">
                ₹{p.amount.toLocaleString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-bold text-primary-deep text-base" : "font-medium"}>{value}</dd>
    </div>
  );
}
