DROP POLICY IF EXISTS "Store logos are publicly accessible" ON storage.objects;

-- Allow owners to view their own logo file metadata
CREATE POLICY "Owners can view their store logo"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'store-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);