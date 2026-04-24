import { CheckCircle2, Package, Bike, Truck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Order,
  type OrderStatus,
  statusEtaMinutes,
} from "@/store/useStore";
import { clockTime, etaLabel, relativeTime } from "@/lib/time";

export const trackingSteps: { key: OrderStatus; label: string; icon: typeof Package }[] = [
  { key: "accepted", label: "Accepted", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: Package },
  { key: "ready_for_pickup", label: "Ready", icon: Bike },
  { key: "out_for_delivery", label: "Out", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
];

interface Props {
  order: Order;
  now: number;
}

export default function OrderTimeline({ order, now }: Props) {
  const currentIndex = trackingSteps.findIndex((s) => s.key === order.status);
  const acceptedAt = order.history.find((h) => h.status === "accepted")?.at;
  const baseMs = acceptedAt ? new Date(acceptedAt).getTime() : new Date(order.createdAt).getTime();
  const deliveredEvent = order.history.find((h) => h.status === "delivered");
  const etaTarget = order.status === "out_for_delivery"
    ? order.estimatedDeliveryAt
    : order.estimatedPickupAt || order.estimatedDeliveryAt;
  const etaMs = etaTarget ? new Date(etaTarget).getTime() : baseMs + statusEtaMinutes.delivered * 60_000;

  return (
    <div>
      <ol className="flex items-start justify-between relative">
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-border" aria-hidden />
        <div
          className="absolute top-3 left-3 h-0.5 bg-primary transition-all"
          style={{
            width:
              currentIndex <= 0
                ? "0%"
                : `calc((100% - 1.5rem) * ${currentIndex} / ${trackingSteps.length - 1})`,
          }}
          aria-hidden
        />
        {trackingSteps.map((step, idx) => {
          const Icon = step.icon;
          const reached = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const event = order.history.find((h) => h.status === step.key);
          return (
            <li
              key={step.key}
              className="relative z-10 flex flex-col items-center gap-1.5 flex-1"
            >
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  reached
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                  isCurrent && "ring-4 ring-primary-soft",
                )}
              >
                <Icon className="w-3 h-3" />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium text-center leading-tight",
                  reached ? "text-primary-deep" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              <span className="text-[9px] text-muted-foreground leading-tight">
                {event ? clockTime(event.at) : "—"}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          Updated {relativeTime(order.history[order.history.length - 1].at, now)}
        </span>
        <span className="font-medium text-primary-deep">
          {deliveredEvent
            ? `Delivered · ${clockTime(deliveredEvent.at)}`
            : `${order.status === "out_for_delivery" ? "Delivery" : "Pickup"} ETA ${etaLabel(etaMs, now)}`}
        </span>
      </div>

      {/* Latest note */}
      {(() => {
        const lastNoteEvent = [...order.history].reverse().find((h) => h.note);
        if (!lastNoteEvent) return null;
        const stepLabel = trackingSteps.find((s) => s.key === lastNoteEvent.status)?.label
          ?? lastNoteEvent.status;
        return (
          <p className="mt-2 text-[11px] text-foreground/80 bg-primary-softer rounded-md px-2 py-1.5">
            <span className="font-semibold">{stepLabel} note:</span> {lastNoteEvent.note}
          </p>
        );
      })()}
    </div>
  );
}
