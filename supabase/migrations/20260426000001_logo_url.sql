-- Apply in Supabase SQL Editor

ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;

-- Also run in Supabase Dashboard > Storage > New bucket:
-- Name: logos, Public: true
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;
CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "logos_authenticated_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos');
CREATE POLICY "logos_authenticated_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'logos');
