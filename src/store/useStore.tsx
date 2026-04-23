import { createContext, useContext, useState, ReactNode } from "react";
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

export interface Order {
  id: string;
  customer: string;
  productName: string;
  size: Size;
  location: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Payout {
  id: string;
  date: string;
  amount: number;
  method: string;
}

interface StoreCtx {
  products: Product[];
  orders: Order[];
  payouts: Payout[];
  balance: number;
  addProduct: (p: Omit<Product, "id" | "sold">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  withdraw: (amount: number, method: string) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

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

const seedOrders: Order[] = [
  { id: "o1", customer: "Sanvi", productName: "T-shirt", size: "S", location: "Siripuram", amount: 399, status: "new", createdAt: new Date().toISOString() },
  { id: "o2", customer: "Priya", productName: "Blue Dress", size: "M", location: "Vuda Colony", amount: 1299, status: "new", createdAt: new Date().toISOString() },
  { id: "o3", customer: "Anjali", productName: "Trousers", size: "L", location: "MVP Colony", amount: 850, status: "accepted", createdAt: new Date().toISOString() },
  { id: "o4", customer: "Rohan", productName: "Gown", size: "M", location: "Dwaraka Nagar", amount: 599, status: "ready", createdAt: new Date().toISOString() },
  { id: "o5", customer: "Meera", productName: "Skirt", size: "S", location: "Beach Road", amount: 799, status: "on_the_way", createdAt: new Date().toISOString() },
  { id: "o6", customer: "Kavya", productName: "T-shirt", size: "M", location: "Asilmetta", amount: 399, status: "delivered", createdAt: new Date().toISOString() },
  { id: "o7", customer: "Diya", productName: "Trousers", size: "S", location: "Gajuwaka", amount: 850, status: "delivered", createdAt: new Date().toISOString() },
  { id: "o8", customer: "Tanvi", productName: "Gown", size: "L", location: "Madhurawada", amount: 599, status: "delivered", createdAt: new Date().toISOString() },
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

  const setOrderStatus: StoreCtx["setOrderStatus"] = (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
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
    <Ctx.Provider value={{ products, orders, payouts, balance, addProduct, updateProduct, setOrderStatus, withdraw }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
