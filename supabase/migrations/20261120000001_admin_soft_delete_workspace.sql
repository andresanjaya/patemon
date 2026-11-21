-- One transaction: deletion cannot succeed without its audit record.
CREATE OR REPLACE FUNCTION public.admin_soft_delete_workspace(
  p_wedding_id UUID,
  p_confirmation TEXT,
  p_reason TEXT,
  p_admin_user_id UUID,
  p_admin_email TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  workspace RECORD;
  deleted_at_value TIMESTAMPTZ := now();
BEGIN
  IF length(btrim(p_reason)) < 10 OR length(p_reason) > 1000 OR p_reason IS NULL THEN
    RAISE EXCEPTION 'Invalid deletion reason';
  END IF;

  SELECT id, couple_names, deleted_at INTO workspace
  FROM public.weddings
  WHERE id = p_wedding_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace not found';
  END IF;
  IF p_confirmation IS DISTINCT FROM workspace.couple_names THEN
    RAISE EXCEPTION 'Workspace confirmation mismatch';
  END IF;

  UPDATE public.weddings SET deleted_at = deleted_at_value WHERE id = p_wedding_id;

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, target_type, target_id,
    reason, before_state, after_state, correlation_id
  ) VALUES (
    p_admin_user_id, p_admin_email, 'delete_wedding', 'wedding', p_wedding_id::text,
    btrim(p_reason), to_jsonb(workspace),
    jsonb_build_object('id', p_wedding_id, 'deleted_at', deleted_at_value),
    gen_random_uuid()::text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_soft_delete_workspace(UUID, TEXT, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_workspace(UUID, TEXT, TEXT, UUID, TEXT) TO service_role;
