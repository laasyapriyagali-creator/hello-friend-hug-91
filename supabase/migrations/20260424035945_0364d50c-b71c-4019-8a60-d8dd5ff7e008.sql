UPDATE storage.buckets
SET public = false
WHERE id = 'product-images';

DROP POLICY IF EXISTS "Product images are publicly viewable" ON storage.objects;

CREATE POLICY "Store owners can view their product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);