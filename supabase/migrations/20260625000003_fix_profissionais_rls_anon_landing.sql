-- Fix: profissionais_anon_landing_read expunha todos os profissionais
-- de qualquer salão com slug para usuários AUTENTICADOS (admins, clientes).
-- Restringe ao papel anon apenas + refatora profissionais_public_read.

DROP POLICY IF EXISTS "profissionais_anon_landing_read" ON profissionais;
CREATE POLICY "profissionais_anon_landing_read" ON profissionais
  FOR SELECT TO anon
  USING (
    ativo = true
    AND salao_id IN (
      SELECT id FROM configuracoes WHERE ativo = true AND slug IS NOT NULL
    )
  );

-- profissionais_public_read: apenas salões onde o usuário está cadastrado como cliente.
-- Remove o braço salao_id = get_my_salao_id() (coberto por profissionais_select_own_salon).
DROP POLICY IF EXISTS "profissionais_public_read" ON profissionais;
CREATE POLICY "profissionais_public_read" ON profissionais
  FOR SELECT TO authenticated
  USING (
    ativo = true
    AND salao_id IN (
      SELECT salao_id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );
