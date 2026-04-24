ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT 17.6868,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 83.2185;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS customer_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS distance_km NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS delivery_eta_minutes INTEGER,
ADD COLUMN IF NOT EXISTS delivery_eta_label TEXT,
ADD COLUMN IF NOT EXISTS map_label TEXT,
ADD COLUMN IF NOT EXISTS tracking_status TEXT NOT NULL DEFAULT 'Awaiting store confirmation',
ADD COLUMN IF NOT EXISTS tracking_progress INTEGER NOT NULL DEFAULT 0 CHECK (tracking_progress BETWEEN 0 AND 100);

CREATE OR REPLACE FUNCTION public.distance_km_between(lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT round((6371 * acos(
    least(1, greatest(-1,
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
      sin(radians(lat1)) * sin(radians(lat2))
    ))
  ))::numeric, 2)
$$;

CREATE OR REPLACE FUNCTION public.apply_order_delivery_estimates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  store_lat DOUBLE PRECISION;
  store_lng DOUBLE PRECISION;
  computed_distance NUMERIC;
BEGIN
  SELECT latitude, longitude INTO store_lat, store_lng
  FROM public.stores
  WHERE id = NEW.store_id;

  IF NEW.customer_latitude IS NOT NULL AND NEW.customer_longitude IS NOT NULL AND store_lat IS NOT NULL AND store_lng IS NOT NULL THEN
    computed_distance := public.distance_km_between(store_lat, store_lng, NEW.customer_latitude, NEW.customer_longitude);
    NEW.distance_km := computed_distance;

    IF computed_distance <= 3 THEN
      NEW.delivery_eta_minutes := 15;
      NEW.delivery_eta_label := 'Nearby · 10–15 mins';
    ELSIF computed_distance <= 10 THEN
      NEW.delivery_eta_minutes := 35;
      NEW.delivery_eta_label := 'Medium distance · 20–40 mins';
    ELSE
      NEW.delivery_eta_minutes := 75;
      NEW.delivery_eta_label := 'Far · 1 hour+';
    END IF;
  END IF;

  IF NEW.map_label IS NULL OR NEW.map_label = '' THEN
    NEW.map_label := NEW.delivery_address;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.tracking_status := COALESCE(NEW.tracking_status, 'Awaiting store confirmation');
    NEW.tracking_progress := COALESCE(NEW.tracking_progress, 0);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' THEN
      NEW.tracking_status := 'Store accepted · preparing soon';
      NEW.tracking_progress := 15;
      NEW.estimated_delivery_at := COALESCE(NEW.estimated_delivery_at, now() + make_interval(mins => COALESCE(NEW.delivery_eta_minutes, 45)));
    ELSIF NEW.status = 'preparing' THEN
      NEW.tracking_status := 'Packing order';
      NEW.tracking_progress := 35;
    ELSIF NEW.status = 'ready_for_pickup' THEN
      NEW.tracking_status := 'Ready for pickup';
      NEW.tracking_progress := 55;
    ELSIF NEW.status = 'out_for_delivery' THEN
      NEW.tracking_status := 'Delivery partner en route';
      NEW.tracking_progress := 75;
      NEW.estimated_delivery_at := now() + make_interval(mins => COALESCE(NEW.delivery_eta_minutes, 45));
    ELSIF NEW.status = 'delivered' THEN
      NEW.tracking_status := 'Delivered';
      NEW.tracking_progress := 100;
    ELSIF NEW.status = 'rejected' THEN
      NEW.tracking_status := 'Rejected by store';
      NEW.tracking_progress := 0;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_order_delivery_estimates_before_insert_update ON public.orders;
CREATE TRIGGER apply_order_delivery_estimates_before_insert_update
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.apply_order_delivery_estimates();

ALTER TABLE public.stores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;