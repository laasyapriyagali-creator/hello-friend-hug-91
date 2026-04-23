import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: (note?: string) => void;
}

export default function AdvanceStatusDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: Props) {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note.trim() || undefined);
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="status-note" className="text-xs text-muted-foreground">
            Optional note (packing, pickup, handoff…)
          </Label>
          <Textarea
            id="status-note"
            placeholder="e.g. Packed in eco bag, fragile"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={3}
          />
          <p className="text-[10px] text-muted-foreground text-right">{note.length}/200</p>
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary-deep"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
