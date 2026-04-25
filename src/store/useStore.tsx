import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { Json } from "@/integrations/supabase/types";

export type Size = "S" | "M" | "L" | "XL";
export type Category = "Men" | "Women" | "Ethnic" | "Casual" | "Party Wear";
export type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "rejected";

export interface Product {
  id: string;
  name: string;
  image: string;
  imagePath?: string | null;
  colors: string[];
  sizes: Size[];
  price: number;
  stock: number;
  stockBySize: Record<string, number>;
  inStock: boolean;
  category: Category;
  sold: number;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  customer: string;
  customerPhone: string;
  productId?: string;
  productName: string;
  size: Size;
  quantity: number;
  location: string;
  customerLatitude?: number | null;
  customerLongitude?: number | null;
  distanceKm?: number | null;
  deliveryEtaLabel?: string | null;
  mapLabel?: string | null;
  trackingStatus?: string | null;
  trackingProgress?: number;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  acceptedAt?: string | null;
  estimatedPickupAt?: string | null;
  estimatedDeliveryAt?: string | null;
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
  logoUrl: string;
  latitude: number;
  longitude: number;
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
  user: User | null;
  session: Session | null;
  loading: boolean;
  products: Product[];
  orders: Order[];
  payouts: Payout[];
  balance: number;
  now: number;
  profile: StoreProfile;
  payment: PaymentSettings;
  returnPolicy: ReturnPolicy;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, storeName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  addProduct: (p: Omit<Product, "id" | "sold" | "inStock" | "stockBySize"> & { imageFile?: File | null }) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product> & { imageFile?: File | null }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  canAcceptOrder: (order: Order) => { ok: boolean; message?: string };
  setOrderStatus: (id: string, status: OrderStatus, note?: string) => Promise<boolean>;
  withdraw: (amount: number, method: string) => void;
  updateProfile: (p: Partial<StoreProfile>) => Promise<void>;
  updatePayment: (p: Partial<PaymentSettings>) => void;
  updateReturnPolicy: (p: Partial<ReturnPolicy>) => void;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

export const statusEtaMinutes: Record<OrderStatus, number> = {
  new: 0,
  accepted: 20,
  preparing: 15,
  ready_for_pickup: 0,
  out_for_delivery: 20,
  delivered: 0,
  rejected: 0,
};

const categoryToDb: Record<Category, "men" | "women" | "ethnic" | "casual" | "party_wear"> = {
  Men: "men",
  Women: "women",
  Ethnic: "ethnic",
  Casual: "casual",
  "Party Wear": "party_wear",
};

const categoryFromDb: Record<string, Category> = {
  men: "Men",
  women: "Women",
  ethnic: "Ethnic",
  casual: "Casual",
  party_wear: "Party Wear",
  kids: "Casual",
  accessories: "Casual",
  other: "Casual",
};

const defaultPayment: PaymentSettings = {
  payoutMethod: "Bank",
  upi: "jenoz@upi",
  bankHolder: "JENOZ Store",
  bankName: "HDFC Bank",
  accountNumber: "•••• 4521",
  ifsc: "HDFC0001234",
  autoPayout: true,
};

const defaultReturnPolicy: ReturnPolicy = {
  windowDays: 7,
  acceptsReturns: true,
  acceptsExchanges: true,
  notes: "Items must be unworn with original tags. Refunds are processed within 5 business days of pickup.",
};

const seedPayouts: Payout[] = [
  { id: "py1", date: "Apr 18", amount: 5000, method: "Bank" },
  { id: "py2", date: "Apr 22", amount: 2000, method: "UPI" },
];

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

function stockFromSizes(sizes: Size[], stock: number) {
  const each = Math.max(0, Math.floor(stock / Math.max(sizes.length, 1)));
  return sizes.reduce<Record<string, number>>((acc, size) => ({ ...acc, [size]: each }), {});
}

function totalStock(stockBySize: Record<string, number>) {
  return Object.values(stockBySize).reduce((sum, n) => sum + Number(n || 0), 0);
}

function safeStock(value: Json): Record<string, number> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, Number(v || 0)]));
}

async function signedImage(path?: string | null, fallback?: string | null) {
  if (!path) return fallback || "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80";
  const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl || fallback || "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>(seedPayouts);
  const [balance, setBalance] = useState<number>(12800);
  const [now, setNow] = useState<number>(Date.now());
  const [profile, setProfile] = useState<StoreProfile>({
    storeName: "JENOZ Store",
    ownerName: "Store Owner",
    email: "",
    phone: "",
    address: "",
    logoUrl: "",
    latitude: 17.6868,
    longitude: 83.2185,
    gstin: "",
  });
  const [payment, setPayment] = useState<PaymentSettings>(defaultPayment);
  const [returnPolicy, setReturnPolicy] = useState<ReturnPolicy>(defaultReturnPolicy);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setStoreId(null);
        setProducts([]);
        setOrders([]);
      }
    });

    supabase.auth.getSession().then(({ data: sessionData }) => {
      setSession(sessionData.session);
      setUser(sessionData.session?.user ?? null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);

  const loadData = async (owner: User) => {
    let { data: store } = await supabase.from("stores").select("*").eq("owner_id", owner.id).maybeSingle();

    if (!store) {
      const storeName = owner.user_metadata?.store_name || owner.user_metadata?.full_name || "JENOZ Store";
      const created = await supabase
        .from("stores")
        .insert({ owner_id: owner.id, name: storeName, location: "Visakhapatnam", contact_phone: "", latitude: 17.6868, longitude: 83.2185 })
        .select("*")
        .single();
      if (created.error) throw created.error;
      store = created.data;

      const inserted = await supabase
        .from("products")
        .insert([
          { store_id: store.id, name: "Classic T-shirt", image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80", price: 399, category: "men", sizes: ["S", "M", "L", "XL"], stock_by_size: { S: 8, M: 10, L: 9, XL: 6 }, sold_count: 62 },
          { store_id: store.id, name: "Trousers", image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80", price: 850, category: "casual", sizes: ["S", "M", "L"], stock_by_size: { S: 0, M: 2, L: 3 }, sold_count: 27 },
          { store_id: store.id, name: "Evening Gown", image_url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80", price: 1299, category: "party_wear", sizes: ["S", "M", "L"], stock_by_size: { S: 2, M: 1, L: 1 }, sold_count: 19 },
        ])
        .select("*");
      if (inserted.error) throw inserted.error;

      const tshirt = inserted.data.find((p) => p.name === "Classic T-shirt")!;
      const trousers = inserted.data.find((p) => p.name === "Trousers")!;
      const gown = inserted.data.find((p) => p.name === "Evening Gown")!;
      const orderRows = await supabase
        .from("orders")
        .insert([
          { store_id: store.id, customer_name: "Sanvi", customer_phone: "+919000000001", delivery_address: "Siripuram, Visakhapatnam", customer_latitude: 17.7203, customer_longitude: 83.3132, map_label: "Siripuram", status: "new", total_amount: 399, created_at: minutesAgo(2) },
          { store_id: store.id, customer_name: "Priya", customer_phone: "+919000000002", delivery_address: "Vuda Colony, Visakhapatnam", customer_latitude: 17.7527, customer_longitude: 83.3422, map_label: "Vuda Colony", status: "new", total_amount: 850, created_at: minutesAgo(4) },
          { store_id: store.id, customer_name: "Meera", customer_phone: "+919000000005", delivery_address: "Beach Road, Visakhapatnam", customer_latitude: 17.7146, customer_longitude: 83.3237, map_label: "Beach Road", status: "delivered", total_amount: 1299, created_at: minutesAgo(120), delivered_at: minutesAgo(65), estimated_delivery_at: minutesAgo(65), tracking_status: "Delivered", tracking_progress: 100 },
        ])
        .select("*");
      if (orderRows.error) throw orderRows.error;
      await supabase.from("order_items").insert([
        { order_id: orderRows.data[0].id, product_id: tshirt.id, product_name: tshirt.name, size: "S", quantity: 1, unit_price: 399 },
        { order_id: orderRows.data[1].id, product_id: trousers.id, product_name: trousers.name, size: "S", quantity: 1, unit_price: 850 },
        { order_id: orderRows.data[2].id, product_id: gown.id, product_name: gown.name, size: "M", quantity: 1, unit_price: 1299 },
      ]);
    }

    const { data: profileRow } = await supabase.from("profiles").select("*").eq("user_id", owner.id).maybeSingle();
    if (!profileRow) {
      await supabase.from("profiles").insert({ user_id: owner.id, display_name: owner.user_metadata?.full_name || "Store Owner", phone: "" });
    }

    setStoreId(store.id);
    const storeAny = store as any;
    setProfile({
      storeName: store.name,
      ownerName: profileRow?.display_name || owner.user_metadata?.full_name || "Store Owner",
      email: owner.email || "",
      phone: store.contact_phone || profileRow?.phone || "",
      address: store.location || "",
      logoUrl: store.logo_url || "",
      latitude: storeAny.latitude ?? 17.6868,
      longitude: storeAny.longitude ?? 83.2185,
      gstin: "",
    });
    await refreshProducts(store.id);
    await refreshOrders(store.id);
  };

  const refreshProducts = async (sid = storeId) => {
    if (!sid) return;
    const { data, error } = await supabase.from("products").select("*").eq("store_id", sid).order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    const mapped = await Promise.all((data || []).map(async (p) => {
      const stockBySize = safeStock(p.stock_by_size);
      return {
        id: p.id,
        name: p.name,
        image: await signedImage(p.image_url?.startsWith("http") ? null : p.image_url, p.image_url),
        imagePath: p.image_url,
        colors: [],
        sizes: (p.sizes as Size[]) || [],
        price: Number(p.price),
        stock: totalStock(stockBySize),
        stockBySize,
        inStock: p.in_stock,
        category: categoryFromDb[p.category] || "Casual",
        sold: p.sold_count,
      };
    }));
    setProducts(mapped);
  };

  const refreshOrders = async (sid = storeId) => {
    if (!sid) return;
    const [{ data: orderRows, error }, { data: itemRows }, { data: eventRows }] = await Promise.all([
      supabase.from("orders").select("*").eq("store_id", sid).order("created_at", { ascending: false }),
      supabase.from("order_items").select("*"),
      supabase.from("order_status_events").select("*").order("created_at", { ascending: true }),
    ]);
    if (error) {
      toast.error(error.message);
      return;
    }
    const mapped = (orderRows || []).map((o) => {
      const orderAny = o as any;
      const firstItem = (itemRows || []).find((i) => i.order_id === o.id);
      const history = (eventRows || [])
        .filter((ev) => ev.order_id === o.id)
        .map((ev) => ({ status: ev.status as OrderStatus, at: ev.created_at, note: ev.note || undefined }));
      return {
        id: o.id,
        customer: o.customer_name,
        customerPhone: o.customer_phone,
        productId: firstItem?.product_id,
        productName: firstItem?.product_name || "Order items",
        size: (firstItem?.size as Size) || "M",
        quantity: firstItem?.quantity || 1,
        location: o.delivery_address,
        customerLatitude: orderAny.customer_latitude,
        customerLongitude: orderAny.customer_longitude,
        distanceKm: orderAny.distance_km == null ? null : Number(orderAny.distance_km),
        deliveryEtaLabel: orderAny.delivery_eta_label,
        mapLabel: orderAny.map_label,
        trackingStatus: orderAny.tracking_status,
        trackingProgress: orderAny.tracking_progress ?? 0,
        amount: Number(o.total_amount),
        status: o.status as OrderStatus,
        createdAt: o.created_at,
        acceptedAt: o.accepted_at,
        estimatedPickupAt: o.estimated_pickup_at,
        estimatedDeliveryAt: o.estimated_delivery_at,
        history: history.length ? history : [{ status: o.status as OrderStatus, at: o.created_at }],
        reorderCount: Math.max(0, (orderRows || []).filter((r) => r.customer_phone === o.customer_phone).length - 1),
      };
    });
    setOrders(mapped);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadData(user).catch((error) => toast.error(error.message)).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!storeId) return;
    const channel = supabase
      .channel(`store-live-${storeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "stores" }, () => user && loadData(user))
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => refreshProducts(storeId))
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => refreshOrders(storeId))
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => refreshOrders(storeId))
      .on("postgres_changes", { event: "*", schema: "public", table: "order_status_events" }, () => refreshOrders(storeId))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const uploadImage = async (file?: File | null) => {
    if (!file || !user) return null;
    const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  };

  const signIn: StoreCtx["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    toast.success("Logged in securely");
  };

  const signUp: StoreCtx["signUp"] = async (email, password, storeName) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin, data: { store_name: storeName.trim() || "JENOZ Store" } },
    });
    if (error) throw error;
    toast.success("Account created. Check your email if confirmation is required.");
  };

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) throw result.error;
  };

  const addProduct: StoreCtx["addProduct"] = async (p) => {
    if (!storeId) return;
    const path = await uploadImage(p.imageFile);
    const stockBySize = stockFromSizes(p.sizes, p.stock || 0);
    const { error } = await supabase.from("products").insert({
      store_id: storeId,
      name: p.name.trim(),
      image_url: path || p.image,
      price: p.price,
      category: categoryToDb[p.category],
      sizes: p.sizes,
      stock_by_size: stockBySize,
      in_stock: totalStock(stockBySize) > 0,
    });
    if (error) throw error;
    toast.success("Product added");
  };

  const updateProduct: StoreCtx["updateProduct"] = async (id, patch) => {
    const path = await uploadImage(patch.imageFile);
    const sizes = patch.sizes || products.find((p) => p.id === id)?.sizes || [];
    const stockBySize = patch.stockBySize || (patch.stock !== undefined ? stockFromSizes(sizes, patch.stock) : undefined);
    const { error } = await supabase.from("products").update({
      name: patch.name?.trim(),
      image_url: path || patch.imagePath || patch.image,
      price: patch.price,
      category: patch.category ? categoryToDb[patch.category] : undefined,
      sizes: patch.sizes,
      stock_by_size: stockBySize,
      in_stock: stockBySize ? totalStock(stockBySize) > 0 : patch.inStock,
    }).eq("id", id);
    if (error) throw error;
    toast.success("Product updated");
  };

  const deleteProduct: StoreCtx["deleteProduct"] = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    toast.success("Product deleted");
  };

  const canAcceptOrder: StoreCtx["canAcceptOrder"] = (order) => {
    if (order.status !== "new") return { ok: true };
    const product = products.find((p) => p.id === order.productId || p.name === order.productName);
    const available = product?.stockBySize?.[order.size] ?? 0;
    if (!product || !product.inStock || available < order.quantity) {
      return { ok: false, message: `Out of stock: ${order.productName} size ${order.size}` };
    }
    return { ok: true };
  };

  const setOrderStatus: StoreCtx["setOrderStatus"] = async (id, status, note) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return false;
    if (status === "accepted") {
      const check = canAcceptOrder(order);
      if (!check.ok) {
        toast.error(check.message || "Insufficient stock");
        return false;
      }
    }
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message.includes("Insufficient stock") ? error.message : "Could not update order");
      return false;
    }
    if (note?.trim()) {
      const { data } = await supabase
        .from("order_status_events")
        .select("id")
        .eq("order_id", id)
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.id) await supabase.from("order_status_events").update({ note: note.trim() }).eq("id", data.id);
    }
    toast.success(status === "rejected" ? "Order rejected" : "Order status updated");
    return true;
  };

  const withdraw: StoreCtx["withdraw"] = (amount, method) => {
    if (amount <= 0 || amount > balance) {
      toast.error("Invalid amount");
      return;
    }
    setBalance((b) => b - amount);
    setPayouts((prev) => [{ id: `py${Date.now()}`, date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }), amount, method }, ...prev]);
    toast.success(`₹${amount.toLocaleString("en-IN")} withdrawn via ${method}`);
  };

  const updateProfile: StoreCtx["updateProfile"] = async (p) => {
    if (!user || !storeId) return;
    const next = { ...profile, ...p };
    const [storeUpdate, profileUpdate] = await Promise.all([
      supabase.from("stores").update({ name: next.storeName, location: next.address, contact_phone: next.phone, logo_url: next.logoUrl, latitude: next.latitude, longitude: next.longitude } as any).eq("id", storeId),
      supabase.from("profiles").upsert({ user_id: user.id, display_name: next.ownerName, phone: next.phone }, { onConflict: "user_id" }),
    ]);
    if (storeUpdate.error) throw storeUpdate.error;
    if (profileUpdate.error) throw profileUpdate.error;
    setProfile(next);
    toast.success("Store details saved");
  };

  const updatePayment: StoreCtx["updatePayment"] = (p) => {
    setPayment((prev) => ({ ...prev, ...p }));
    toast.success("Payment settings saved");
  };

  const updateReturnPolicy: StoreCtx["updateReturnPolicy"] = (p) => {
    setReturnPolicy((prev) => ({ ...prev, ...p }));
    toast.success("Return policy updated");
  };

  const updatePassword: StoreCtx["updatePassword"] = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    toast.success("Password updated");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
  };

  const value = useMemo<StoreCtx>(() => ({
    user,
    session,
    loading,
    products,
    orders,
    payouts,
    balance,
    now,
    profile,
    payment,
    returnPolicy,
    signIn,
    signUp,
    signInWithGoogle,
    addProduct,
    updateProduct,
    deleteProduct,
    canAcceptOrder,
    setOrderStatus,
    withdraw,
    updateProfile,
    updatePayment,
    updateReturnPolicy,
    updatePassword,
    logout,
  }), [user, session, loading, products, orders, payouts, balance, now, profile, payment, returnPolicy, storeId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
