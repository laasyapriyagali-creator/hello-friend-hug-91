import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function WithdrawScreen() {
  const navigate = useNavigate();
  const { balance, withdraw } = useStore();
  const [method, setMethod] = useState<"Bank" | "UPI">("Bank");
  const [amount, setAmount] = useState("");
  const [holder, setHolder] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upi, setUpi] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    withdraw(Number(amount), method);
    navigate("/earnings");
  };

  return (
    <div className="screen-pad">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Withdraw money</h1>
      </div>

      <div className="card-soft p-4 mb-4 bg-primary-softer">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Available balance</p>
        <p className="text-2xl font-bold text-primary-deep mt-1">
          ₹{balance.toLocaleString("en-IN")}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Choose withdrawal method</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["Bank", "UPI"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  "h-11 rounded-xl text-sm font-medium border transition",
                  method === m
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground/70",
                )}
              >
                {m === "Bank" ? "Bank account" : "UPI"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
          />
        </div>

        {method === "Bank" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="holder">Account holder name</Label>
              <Input id="holder" value={holder} onChange={(e) => setHolder(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank">Bank name</Label>
              <Input id="bank" value={bank} onChange={(e) => setBank(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc">Account number</Label>
              <Input id="acc" value={account} onChange={(e) => setAccount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifsc">IFSC code</Label>
              <Input id="ifsc" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="upi">UPI ID</Label>
            <Input id="upi" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="example@upi" />
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Once edited, it will automatically get saved.
        </p>

        <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary-deep rounded-2xl">
          Withdraw
        </Button>
      </form>
    </div>
  );
}
