import { useState } from "react";
import { Bell, Check, MapPin, Navigation, X } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { useStore, type OrderStatus } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import OrderTimeline from "@/components/OrderTimeline";
import CustomerContactButtons from "@/components/CustomerContactButtons";
import AdvanceStatusDialog from "@/components/AdvanceStatusDialog";
import DeliveredOrdersSection from "@/components/DeliveredOrdersSection";
import { relativeTime } from "@/lib/time";

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  accepted: "preparing",
  preparing: "ready_for_pickup",
  ready_for_pickup: "out_for_delivery",
  out_for_delivery: "delivered",
};

const nextLabel: Partial<Record<OrderStatus, string>> = {
  accepted: "Start Preparing",
  preparing: "Ready for Pickup",
  ready_for_pickup: "Out for Delivery",
  out_for_delivery: "Mark Delivered",
};

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
  const { orders, setOrderStatus, now, canAcceptOrder } = useStore();
  const [pending, setPending] = useState<{ id: string; next: OrderStatus; label: string } | null>(
    null,
  );

  const newOrders = orders.filter((o) => o.status === "new");
  const activeOrders = orders.filter((o) =>
    ["accepted", "preparing", "ready_for_pickup", "out_for_delivery"].includes(o.status),
  );
  const todaysCount = orders.filter((o) => o.status !== "rejected").length;
  const completedToday = orders.filter((o) => o.status === "delivered").length;
  const weekTotal = weekly.reduce((a, b) => a + b.value, 0);
  const pendingCount = orders.filter((o) =>
    ["new", "accepted", "preparing", "ready_for_pickup", "out_for_delivery"].includes(o.status),
  ).length;
  const max = Math.max(...weekly.map((w) => w.value), 1);

  return (
    <div className="screen-pad">
      <ScreenHeader
        subtitle="JENOZ Partner"
        title="Orders"
        right={
          <button
            className="relative p-2 rounded-full bg-primary-soft text-primary-deep"
            aria-label="Notifications"
          >
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
          {newOrders.map((o) => {
            const stockCheck = canAcceptOrder(o);
            return (
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
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {relativeTime(o.createdAt, now)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-primary-deep">
                  ₹{o.amount.toLocaleString("en-IN")}
                </p>
              </div>
              <LocationSummary order={o} />
              {!stockCheck.ok && (
                <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                  {stockCheck.message}
                </div>
              )}
              <div className="mt-3 space-y-2">
                <CustomerContactButtons phone={o.customerPhone} customerName={o.customer} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary-deep"
                    disabled={!stockCheck.ok}
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
              </div>
            </article>
            );
          })}
        </div>
      </section>

      {/* Order tracking */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Order Tracking
        </h2>
        <div className="space-y-3">
          {activeOrders.length === 0 && (
            <div className="card-soft p-6 text-center text-sm text-muted-foreground">
              No orders in progress
            </div>
          )}
          {activeOrders.map((o) => {
            const next = nextStatus[o.status];
            return (
              <article key={o.id} className="card-soft p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{o.customer}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {o.productName} · Size {o.size} · 📍 {o.location}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-primary-deep shrink-0">
                    ₹{o.amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <LocationSummary order={o} compact />
                <OrderTimeline order={o} now={now} />

                <div className="mt-4 space-y-2">
                  <CustomerContactButtons phone={o.customerPhone} customerName={o.customer} />
                  {next && (
                    <Button
                      size="sm"
                      className="w-full bg-primary hover:bg-primary-deep"
                      onClick={() =>
                        setPending({ id: o.id, next, label: nextLabel[o.status]! })
                      }
                    >
                      {nextLabel[o.status]}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Delivered Orders */}
      <DeliveredOrdersSection />

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
          <p className="text-xs text-muted-foreground mt-1">Pending: {pendingCount}</p>
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
                style={{
                  height: `${(w.value / max) * 100}%`,
                  minHeight: w.value === 0 ? "4px" : "8px",
                }}
                aria-label={`${w.day}: ${w.value} orders`}
              />
              <span className="text-[10px] font-medium text-muted-foreground">{w.day}</span>
            </div>
          ))}
        </div>
      </section>

      <AdvanceStatusDialog
        open={!!pending}
        onOpenChange={(v) => !v && setPending(null)}
        title={pending?.label ?? ""}
        description="Add a quick note for the next handler (optional)."
        confirmLabel={pending?.label ?? "Confirm"}
        onConfirm={(note) => {
          if (pending) setOrderStatus(pending.id, pending.next, note);
        }}
      />
    </div>
  );
}


function LocationSummary({ order, compact = false }: { order: import("@/store/useStore").Order; compact?: boolean }) {
  const mapsUrl = order.customerLatitude && order.customerLongitude
    ? `https://www.google.com/maps/search/?api=1&query=${order.customerLatitude},${order.customerLongitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.location)}`;

  return (
    <div className={compact ? "mb-4 rounded-xl bg-primary-softer p-3" : "mt-3 rounded-xl bg-primary-softer p-3"}>
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 text-primary-deep" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">Customer address</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{order.location}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <span className="rounded-lg bg-card px-2 py-1 text-muted-foreground">Distance: <b className="text-foreground">{order.distanceKm ? `${order.distanceKm} km` : "Syncing"}</b></span>
            <span className="rounded-lg bg-card px-2 py-1 text-muted-foreground">ETA: <b className="text-foreground">{order.deliveryEtaLabel || "Calculating"}</b></span>
          </div>
        </div>
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-full bg-card p-2 text-primary-deep" aria-label="Open customer location map">
          <Navigation className="h-4 w-4" />
        </a>
      </div>
      {order.status === "out_for_delivery" && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{order.trackingStatus || "Delivery partner en route"}</span>
            <span>{order.trackingProgress || 0}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${order.trackingProgress || 0}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
