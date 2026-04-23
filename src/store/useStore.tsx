import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";

export type Size = "S" | "M" | "L" | "XL";
export type Category = "Men" | "Women" | "Ethnic" | "Casual" | "Party Wear";

export interface Product {
  id: string;
  name: string;
  image: string;
  colors: string[];
  sizes: Size[];
  price: number;
  stock: number;
  category: Category;
  sold: number;
}

export type OrderStatus =
  | "new"
  | "accepted"
  | "ready"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "rejected";

export interface StatusEvent {
  status: OrderStatus;
  at: string; // ISO
  note?: string;
}

export interface Order {
  id: string;
  customer: string;
  customerPhone: string;
  productName: string;
  size: Size;
  location: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  history: StatusEvent[];
  reorderCount: number;
}

export interface Payout {
  id: string;
  date: string;
  amount: number;
  method: string;
}

export interface StoreProfile {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
}

export interface PaymentSettings {
  payoutMethod: "Bank" | "UPI";
  upi: string;
  bankHolder: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  autoPayout: boolean;
}

export interface ReturnPolicy {
  windowDays: number;
  acceptsReturns: boolean;
  acceptsExchanges: boolean;
  notes: string;
}

interface StoreCtx {
  products: Product[];
  orders: Order[];
  payouts: Payout[];
  balance: number;
  now: number;
  profile: StoreProfile;
  payment: PaymentSettings;
  returnPolicy: ReturnPolicy;
  addProduct: (p: Omit<Product, "id" | "sold">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  setOrderStatus: (id: string, status: OrderStatus, note?: string) => void;
  withdraw: (amount: number, method: string) => void;
  updateProfile: (p: Partial<StoreProfile>) => void;
  updatePayment: (p: Partial<PaymentSettings>) => void;
  updateReturnPolicy: (p: Partial<ReturnPolicy>) => void;
  logout: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);

// ETA minutes from "accepted" baseline for each status step
export const statusEtaMinutes: Record<OrderStatus, number> = {
  new: 0,
  accepted: 0,
  ready: 15,
  picked_up: 25,
  on_the_way: 35,
  delivered: 55,
  rejected: 0,
};

const seedProducts: Product[] = [
  {
    id: "p1",
    name: "Short Skirt",
    image: "https://images.unsplash.com/photo-1583496661160-fb5886a13d44?w=400&q=80",
    colors: ["#1f1f1f", "#b48ead"],
    sizes: ["S", "M", "L"],
    price: 799,
    stock: 24,
    category: "Women",
    sold: 38,
  },
  {
    id: "p2",
    name: "Trousers",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80",
    colors: ["#3b5998", "#c0392b", "#1f1f1f"],
    sizes: ["S", "M", "L"],
    price: 850,
    stock: 12,
    category: "Casual",
    sold: 27,
  },
  {
    id: "p3",
    name: "Gown",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80",
    colors: ["#1f1f1f", "#3b5998"],
    sizes: ["S", "M", "L", "XL"],
    price: 599,
    stock: 8,
    category: "Party Wear",
    sold: 19,
  },
  {
    id: "p4",
    name: "T-shirt",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
    colors: ["#1f1f1f", "#3b5998", "#e8d8b6"],
    sizes: ["S", "M", "L", "XL"],
    price: 399,
    stock: 45,
    category: "Men",
    sold: 62,
  },
];

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

const seedOrders: Order[] = [
  {
    id: "o1",
    customer: "Sanvi",
    customerPhone: "+919000000001",
    productName: "T-shirt",
    size: "S",
    location: "Siripuram",
    amount: 399,
    status: "new",
    createdAt: minutesAgo(2),
    history: [{ status: "new", at: minutesAgo(2) }],
    reorderCount: 0,
  },
  {
    id: "o2",
    customer: "Priya",
    customerPhone: "+919000000002",
    productName: "Blue Dress",
    size: "M",
    location: "Vuda Colony",
    amount: 1299,
    status: "new",
    createdAt: minutesAgo(4),
    history: [{ status: "new", at: minutesAgo(4) }],
    reorderCount: 1,
  },
  {
    id: "o3",
    customer: "Anjali",
    customerPhone: "+919000000003",
    productName: "Trousers",
    size: "L",
    location: "MVP Colony",
    amount: 850,
    status: "accepted",
    createdAt: minutesAgo(12),
    history: [
      { status: "new", at: minutesAgo(12) },
      { status: "accepted", at: minutesAgo(10) },
    ],
    reorderCount: 0,
  },
  {
    id: "o4",
    customer: "Rohan",
    customerPhone: "+919000000004",
    productName: "Gown",
    size: "M",
    location: "Dwaraka Nagar",
    amount: 599,
    status: "ready",
    createdAt: minutesAgo(28),
    history: [
      { status: "new", at: minutesAgo(28) },
      { status: "accepted", at: minutesAgo(25) },
      { status: "ready", at: minutesAgo(8), note: "Packed in eco bag" },
    ],
    reorderCount: 2,
  },
  {
    id: "o5",
    customer: "Meera",
    customerPhone: "+919000000005",
    productName: "Skirt",
    size: "S",
    location: "Beach Road",
    amount: 799,
    status: "on_the_way",
    createdAt: minutesAgo(45),
    history: [
      { status: "new", at: minutesAgo(45) },
      { status: "accepted", at: minutesAgo(43) },
      { status: "ready", at: minutesAgo(30) },
      { status: "picked_up", at: minutesAgo(20) },
      { status: "on_the_way", at: minutesAgo(8) },
    ],
    reorderCount: 0,
  },
  {
    id: "o6",
    customer: "Kavya",
    customerPhone: "+919000000006",
    productName: "T-shirt",
    size: "M",
    location: "Asilmetta",
    amount: 399,
    status: "delivered",
    createdAt: minutesAgo(180),
    history: [
      { status: "new", at: minutesAgo(180) },
      { status: "accepted", at: minutesAgo(178) },
      { status: "ready", at: minutesAgo(160) },
      { status: "picked_up", at: minutesAgo(150) },
      { status: "on_the_way", at: minutesAgo(140) },
      { status: "delivered", at: minutesAgo(120) },
    ],
    reorderCount: 3,
  },
  {
    id: "o7",
    customer: "Diya",
    customerPhone: "+919000000007",
    productName: "Trousers",
    size: "S",
    location: "Gajuwaka",
    amount: 850,
    status: "delivered",
    createdAt: minutesAgo(60 * 26),
    history: [
      { status: "new", at: minutesAgo(60 * 26) },
      { status: "delivered", at: minutesAgo(60 * 25) },
    ],
    reorderCount: 1,
  },
  {
    id: "o8",
    customer: "Tanvi",
    customerPhone: "+919000000008",
    productName: "Gown",
    size: "L",
    location: "Madhurawada",
    amount: 599,
    status: "delivered",
    createdAt: minutesAgo(60 * 50),
    history: [
      { status: "new", at: minutesAgo(60 * 50) },
      { status: "delivered", at: minutesAgo(60 * 49) },
    ],
    reorderCount: 0,
  },
];

const seedPayouts: Payout[] = [
  { id: "py1", date: "Feb 22", amount: 5000, method: "Bank" },
  { id: "py2", date: "Feb 28", amount: 2000, method: "UPI" },
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [payouts, setPayouts] = useState<Payout[]>(seedPayouts);
  const [balance, setBalance] = useState<number>(12800);
  const [now, setNow] = useState<number>(Date.now());

  // Live ticker so timestamps and ETAs refresh without manual reload
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const addProduct: StoreCtx["addProduct"] = (p) => {
    setProducts((prev) => [
      { ...p, id: `p${Date.now()}`, sold: 0 },
      ...prev,
    ]);
    toast.success("Product added");
  };

  const updateProduct: StoreCtx["updateProduct"] = (id, patch) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    toast.success("Product updated");
  };

  const setOrderStatus: StoreCtx["setOrderStatus"] = (id, status, note) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              history: [...o.history, { status, at: new Date().toISOString(), note }],
            }
          : o,
      ),
    );
    const labels: Record<OrderStatus, string> = {
      new: "New",
      accepted: "Order accepted",
      ready: "Marked ready for pickup",
      picked_up: "Picked up",
      on_the_way: "On the way",
      delivered: "Delivered",
      rejected: "Order rejected",
    };
    toast.success(labels[status]);
  };

  const withdraw: StoreCtx["withdraw"] = (amount, method) => {
    if (amount <= 0 || amount > balance) {
      toast.error("Invalid amount");
      return;
    }
    setBalance((b) => b - amount);
    setPayouts((prev) => [
      { id: `py${Date.now()}`, date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }), amount, method },
      ...prev,
    ]);
    toast.success(`₹${amount.toLocaleString("en-IN")} withdrawn via ${method}`);
  };

  return (
    <Ctx.Provider value={{ products, orders, payouts, balance, now, addProduct, updateProduct, setOrderStatus, withdraw }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
