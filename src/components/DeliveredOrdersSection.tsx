import { useMemo, useState } from "react";
import { CheckCircle2, Repeat } from "lucide-react";
import { useStore } from "@/store/useStore";
import { clockTime, relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";

type RangeKey = "today" | "week" | "all";
type RepeatKey = "all" | "repeat";

const ranges: { key: RangeKey; label: string; ms: number | null }[] = [
  { key: "today", label: "Today", ms: 24 * 60 * 60 * 1000 },
  { key: "week", label: "This week", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "all", label: "All", ms: null },
];

export default function DeliveredOrdersSection() {
  const { orders, now } = useStore();
  const [range, setRange] = useState<RangeKey>("week");
  const [repeat, setRepeat] = useState<RepeatKey>("all");

  const delivered = useMemo(() => {
    const cutoff = ranges.find((r) => r.key === range)?.ms;
    return orders
      .filter((o) => o.status === "delivered")
      .filter((o) => {
        const deliveredAt = o.history.find((h) => h.status === "delivered")?.at ?? o.createdAt;
        if (cutoff == null) return true;
        return now - new Date(deliveredAt).getTime() <= cutoff;
      })
      .filter((o) => (repeat === "repeat" ? o.reorderCount > 0 : true))
      .sort((a, b) => {
        const ad = a.history.find((h) => h.status === "delivered")?.at ?? a.createdAt;
        const bd = b.history.find((h) => h.status === "delivered")?.at ?? b.createdAt;
        return new Date(bd).getTime() - new Date(ad).getTime();
      });
  }, [orders, range, repeat, now]);

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
        Delivered Orders
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              range === r.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
        <button
          onClick={() => setRepeat(repeat === "all" ? "repeat" : "all")}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full border transition-colors inline-flex items-center gap-1",
            repeat === "repeat"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:text-foreground",
          )}
        >
          <Repeat className="w-3 h-3" /> Repeat customers
        </button>
      </div>

      <div className="space-y-3">
        {delivered.length === 0 && (
          <div className="card-soft p-6 text-center text-sm text-muted-foreground">
            No delivered orders for this filter
          </div>
        )}
        {delivered.map((o) => {
          const deliveredAt = o.history.find((h) => h.status === "delivered")?.at ?? o.createdAt;
          return (
            <article key={o.id} className="card-soft p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{o.customer}</p>
                    {o.reorderCount > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary-soft text-primary-deep inline-flex items-center gap-0.5">
                        <Repeat className="w-2.5 h-2.5" /> ×{o.reorderCount + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/80 truncate">
                    {o.productName} · Size {o.size}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-primary-deep" />
                    Delivered {clockTime(deliveredAt)} · {relativeTime(deliveredAt, now)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-primary-deep shrink-0">
                  ₹{o.amount.toLocaleString("en-IN")}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
