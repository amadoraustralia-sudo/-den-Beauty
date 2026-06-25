-- Fix crítico: remove policy que expunha TODOS os profissionais a qualquer autenticado
-- A policy "public_read_profissionais" (qual = true) bypassa isolamento multi-tenant.
-- As policies corretas (profissionais_select_own_salon, profissionais_public_read
-- e admin_manage_profissionais) já garantem o acesso adequado por salão.

DROP POLICY IF EXISTS "public_read_profissionais" ON profissionais;
