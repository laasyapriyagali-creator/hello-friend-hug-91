CREATE POLICY "Store owners can update order status event notes"
ON public.order_status_events
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = order_status_events.order_id AND s.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = order_status_events.order_id AND s.owner_id = auth.uid()
));