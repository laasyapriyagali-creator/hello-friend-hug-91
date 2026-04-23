import { Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  phone: string;
  customerName: string;
}

export default function CustomerContactButtons({ phone, customerName }: Props) {
  const smsBody = encodeURIComponent(`Hi ${customerName}, this is your store regarding your order.`);
  return (
    <div className="flex gap-2">
      <Button
        asChild
        size="sm"
        variant="outline"
        className="flex-1 border-border"
      >
        <a href={`tel:${phone}`} aria-label={`Call ${customerName}`}>
          <Phone className="w-4 h-4" /> Call
        </a>
      </Button>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="flex-1 border-border"
      >
        <a href={`sms:${phone}?body=${smsBody}`} aria-label={`Message ${customerName}`}>
          <MessageSquare className="w-4 h-4" /> Message
        </a>
      </Button>
    </div>
  );
}
