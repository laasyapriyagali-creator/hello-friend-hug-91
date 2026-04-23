import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useStore, Size, Category } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const ALL_SIZES: Size[] = ["S", "M", "L", "XL"];
const SWATCHES = ["#1f1f1f", "#ffffff", "#b48ead", "#3b5998", "#c0392b", "#e8d8b6", "#2ecc71", "#f39c12"];
const CATEGORIES: Category[] = ["Men", "Women", "Ethnic", "Casual", "Party Wear"];

export default function ProductFormScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const existing = id ? products.find((p) => p.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [image, setImage] = useState(
    existing?.image ?? "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80",
  );
  const [colors, setColors] = useState<string[]>(existing?.colors ?? []);
  const [sizes, setSizes] = useState<Size[]>(existing?.sizes ?? []);
  const [price, setPrice] = useState<string>(existing?.price.toString() ?? "");
  const [stock, setStock] = useState<string>(existing?.stock.toString() ?? "");
  const [category, setCategory] = useState<Category>(existing?.category ?? "Women");

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImage(url);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      image,
      colors,
      sizes,
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      category,
    };
    if (!payload.name || !payload.price) return;
    if (existing) updateProduct(existing.id, payload);
    else addProduct(payload);
    navigate("/products");
  };

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="screen-pad">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{existing ? "Edit product" : "Add a product"}</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <label className="card-soft border-dashed border-2 border-primary/30 bg-primary-softer aspect-[4/3] flex items-center justify-center cursor-pointer overflow-hidden relative">
          {image ? (
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-primary-deep">
              <ImagePlus className="w-10 h-10" />
              <span className="text-sm mt-2">Upload media</span>
            </div>
          )}
          <input type="file" accept="image/*" className="sr-only" onChange={onPickImage} />
        </label>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Floral Dress" />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                  category === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground/70",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Colors</Label>
          <div className="flex flex-wrap gap-2">
            {SWATCHES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggle(colors, c, setColors)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition",
                  colors.includes(c) ? "border-primary-deep scale-110" : "border-border",
                )}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sizes</Label>
          <div className="flex gap-2">
            {ALL_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggle(sizes, s, setSizes)}
                className={cn(
                  "w-12 h-10 rounded-lg text-sm font-semibold border transition",
                  sizes.includes(s)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground/70",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input id="price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="799" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} placeholder="10" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">You can change this later</p>

        <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary-deep rounded-2xl">
          {existing ? "Save changes" : "Add product"}
        </Button>

        {existing && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-2xl border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" /> Delete product
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{existing.name}" will be removed from your catalogue. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-2">
                <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="flex-1 bg-destructive hover:bg-destructive/90"
                  onClick={() => {
                    deleteProduct(existing.id);
                    navigate("/products");
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </form>
    </div>
  );
}
