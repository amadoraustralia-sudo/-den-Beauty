-- Security fixes: revoke anon from register_portal_client,
-- tighten logo delete policy, scope profissionais_public_read by salao_id.

-- #1 — register_portal_client: anon não deve conseguir chamar diretamente.
--      O portal faz signUp primeiro (cria sessão authenticated) e só então chama o RPC.
REVOKE EXECUTE ON FUNCTION register_portal_client(text, text, text, uuid) FROM anon;

-- #2 — logos: qualquer usuário autenticado podia deletar logos de outros salões.
--      Restringe ao folder cujo nome é o salao_id do usuário logado.
DROP POLICY IF EXISTS "logos_authenticated_delete" ON storage.objects;
CREATE POLICY "logos_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = get_my_salao_id()::text
  );

-- #3 — profissionais_public_read: expunha profissionais de TODOS os salões para qualquer
--      usuário autenticado (cross-tenant leak). Scopa agora por:
--        • admins  → veem apenas o próprio salão (get_my_salao_id())
--        • clientes → veem apenas salões nos quais estão cadastrados
DROP POLICY IF EXISTS "profissionais_public_read" ON profissionais;
CREATE POLICY "profissionais_public_read" ON profissionais
  FOR SELECT TO authenticated
  USING (
    ativo = true
    AND (
      salao_id = get_my_salao_id()
      OR salao_id IN (
        SELECT salao_id FROM clientes WHERE auth_user_id = auth.uid()
      )
    )
  );
