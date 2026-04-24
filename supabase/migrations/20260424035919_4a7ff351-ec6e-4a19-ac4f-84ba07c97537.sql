-- Enums
CREATE TYPE public.order_status AS ENUM ('new', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'rejected');
CREATE TYPE public.product_category AS ENUM ('men', 'women', 'ethnic', 'casual', 'party_wear', 'kids', 'accessories', 'other');

-- Timestamp helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Profiles for logged-in store owners
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Stores
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  location TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their store"
ON public.stores
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create their store"
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their store"
ON public.stores
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their store"
ON public.stores
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
  image_url TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category public.product_category NOT NULL DEFAULT 'other',
  sizes TEXT[] NOT NULL DEFAULT '{}',
  stock_by_size JSONB NOT NULL DEFAULT '{}'::jsonb,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  sold_count INTEGER NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their products"
ON public.products
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Store owners can create their products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Store owners can update their products"
ON public.products
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Store owners can delete their products"
ON public.products
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid()));

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 120),
  customer_phone TEXT NOT NULL DEFAULT '',
  delivery_address TEXT NOT NULL DEFAULT '',
  status public.order_status NOT NULL DEFAULT 'new',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  accepted_at TIMESTAMPTZ,
  estimated_pickup_at TIMESTAMPTZ,
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Store owners can create their orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Store owners can update their orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Store owners can delete their orders"
ON public.orders
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.owner_id = auth.uid()));

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Order items
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
));

CREATE POLICY "Store owners can create order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
));

CREATE POLICY "Store owners can update order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
));

CREATE POLICY "Store owners can delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
));

-- Order timeline history
CREATE TABLE public.order_status_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view order status events"
ON public.order_status_events
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = order_status_events.order_id AND s.owner_id = auth.uid()
));

CREATE POLICY "Store owners can create order status events"
ON public.order_status_events
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = order_status_events.order_id AND s.owner_id = auth.uid()
));

-- Stock protection and timeline automation
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  current_stock INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('accepted', 'preparing') AND OLD.status = 'new' THEN
      FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
        SELECT COALESCE((stock_by_size ->> item.size)::integer, 0)
        INTO current_stock
        FROM public.products
        WHERE id = item.product_id;

        IF current_stock < item.quantity THEN
          RAISE EXCEPTION 'Insufficient stock for % size %', item.product_name, item.size;
        END IF;
      END LOOP;

      FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
        UPDATE public.products
        SET stock_by_size = jsonb_set(
              stock_by_size,
              ARRAY[item.size],
              to_jsonb(((stock_by_size ->> item.size)::integer - item.quantity)),
              true
            ),
            sold_count = sold_count + item.quantity,
            in_stock = EXISTS (
              SELECT 1 FROM jsonb_each_text(jsonb_set(stock_by_size, ARRAY[item.size], to_jsonb(((stock_by_size ->> item.size)::integer - item.quantity)), true)) AS kv(key, value)
              WHERE value::integer > 0
            )
        WHERE id = item.product_id;
      END LOOP;
    END IF;

    IF NEW.status = 'accepted' AND NEW.accepted_at IS NULL THEN
      NEW.accepted_at = now();
      NEW.estimated_pickup_at = now() + interval '20 minutes';
      NEW.estimated_delivery_at = now() + interval '55 minutes';
    ELSIF NEW.status = 'preparing' THEN
      NEW.estimated_pickup_at = now() + interval '15 minutes';
      NEW.estimated_delivery_at = now() + interval '50 minutes';
    ELSIF NEW.status = 'ready_for_pickup' THEN
      NEW.estimated_pickup_at = now();
      NEW.estimated_delivery_at = now() + interval '35 minutes';
    ELSIF NEW.status = 'out_for_delivery' THEN
      NEW.estimated_delivery_at = now() + interval '20 minutes';
    ELSIF NEW.status = 'delivered' THEN
      NEW.delivered_at = now();
      NEW.estimated_delivery_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_order_status_before_update
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_status_change();

CREATE OR REPLACE FUNCTION public.add_order_status_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_events (order_id, status)
    VALUES (NEW.id, NEW.status);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_events (order_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_order_status_event_after_insert_update
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.add_order_status_event();

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Product images are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Store owners can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Store owners can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Store owners can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Helpful indexes
CREATE INDEX idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_orders_store_id_status ON public.orders(store_id, status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_status_events_order_id_created_at ON public.order_status_events(order_id, created_at);

-- Enable realtime updates
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.order_status_events REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_events;