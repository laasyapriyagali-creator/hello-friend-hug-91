import { Link } from "react-router-dom";
import { Plus, Pencil } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

export default function ProductsScreen() {
  const { products } = useStore();

  return (
    <div className="screen-pad">
      <ScreenHeader subtitle="Add and edit" title="Products" />

      <Link to="/products/new" className="block mb-5">
        <Button className="w-full bg-primary hover:bg-primary-deep h-12 rounded-2xl">
          <Plus className="w-5 h-5" /> Add a product
        </Button>
      </Link>

      <ul className="space-y-3">
        {products.map((p) => (
          <li key={p.id} className="card-soft p-3 flex gap-3">
            <img
              src={p.image}
              alt={p.name}
              className="w-20 h-20 rounded-xl object-cover bg-muted"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold uppercase text-sm tracking-wide truncate">{p.name}</h3>
                <Link
                  to={`/products/${p.id}/edit`}
                  className="text-primary-deep p-1.5 rounded-lg hover:bg-primary-soft"
                  aria-label={`Edit ${p.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </Link>
              </div>
              {p.colors.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase">Colors</span>
                  {p.colors.map((c, i) => (
                    <span
                      key={i}
                      className="w-3.5 h-3.5 rounded-full border border-border"
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${i + 1}`}
                    />
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Sizes: <span className="text-foreground/80">{p.sizes.join(", ")}</span>
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm font-bold text-primary-deep">₹{p.price}</p>
                <p className="text-[11px] text-muted-foreground">Stock: {p.stock}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
