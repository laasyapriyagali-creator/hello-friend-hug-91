import { Bell, Check, X } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

const weekly = [
  { day: "Mon", value: 8 },
  { day: "Tue", value: 5 },
  { day: "Wed", value: 0 },
  { day: "Thu", value: 2 },
  { day: "Fri", value: 7 },
  { day: "Sat", value: 4 },
  { day: "Sun", value: 10 },
];

export default function OrdersScreen() {
  const { orders, setOrderStatus } = useStore();
  const newOrders = orders.filter((o) => o.status === "new");
  const todaysCount = orders.filter((o) => o.status !== "rejected").length;
  const completedToday = orders.filter((o) => o.status === "delivered").length;
  const weekTotal = weekly.reduce((a, b) => a + b.value, 0);
  const pending = orders.filter((o) => ["new", "accepted", "ready", "on_the_way", "picked_up"].includes(o.status)).length;
  const max = Math.max(...weekly.map((w) => w.value), 1);

  return (
    <div className="screen-pad">
      <ScreenHeader
        subtitle="JENOZ Partner"
        title="Orders"
        right={
          <button className="relative p-2 rounded-full bg-primary-soft text-primary-deep" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            {newOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {newOrders.length}
              </span>
            )}
          </button>
        }
      />

      {/* New orders */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          New Orders
        </h2>
        <div className="space-y-3">
          {newOrders.length === 0 && (
            <div className="card-soft p-6 text-center text-sm text-muted-foreground">
              No new orders right now ✨
            </div>
          )}
          {newOrders.map((o) => (
            <article key={o.id} className="card-soft p-4 animate-slide-up">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-soft text-primary-deep flex items-center justify-center font-semibold">
                  {o.customer[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{o.customer}</p>
                  <p className="text-sm text-foreground/80">
                    {o.productName} · Size {o.size}
                  </p>
                  <p className="text-xs text-muted-foreground">📍 {o.location}</p>
                </div>
                <p className="text-sm font-semibold text-primary-deep">
                  ₹{o.amount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary-deep"
                  onClick={() => setOrderStatus(o.id, "accepted")}
                >
                  <Check className="w-4 h-4" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => setOrderStatus(o.id, "rejected")}
                >
                  <X className="w-4 h-4" /> Reject
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 mb-6">
        <div className="card-soft p-4 bg-primary-softer">
          <p className="text-xs text-muted-foreground">Today's Orders</p>
          <p className="text-3xl font-bold text-primary-deep mt-1">{todaysCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed: {completedToday}</p>
        </div>
        <div className="card-soft p-4 bg-primary-softer">
          <p className="text-xs text-muted-foreground">This Week</p>
          <p className="text-3xl font-bold text-primary-deep mt-1">{weekTotal}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending: {pending}</p>
        </div>
      </section>

      {/* Weekly bar chart */}
      <section className="card-soft p-5">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
          Weekly Order Stats
        </h2>
        <div className="flex items-end justify-between gap-2 h-36">
          {weekly.map((w) => (
            <div key={w.day} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-gradient-primary transition-all"
                style={{ height: `${(w.value / max) * 100}%`, minHeight: w.value === 0 ? "4px" : "8px" }}
                aria-label={`${w.day}: ${w.value} orders`}
              />
              <span className="text-[10px] font-medium text-muted-foreground">{w.day}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
