-- Backfill missing company_name and harden registration profile creation.

-- 1) Backfill legacy placeholders so existing users stop showing fallback text.
UPDATE public.users
SET
  company_name = name,
  updated_at = NOW()
WHERE
  (company_name IS NULL OR btrim(company_name) = '' OR company_name = '未設定車行名稱')
  AND name IS NOT NULL
  AND btrim(name) <> '';

-- 2) Ensure handle_new_user maps company_name robustly from metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role CONSTANT TEXT := 'user';
  user_name TEXT;
  user_phone TEXT;
  user_company TEXT;
  existing_role TEXT;
BEGIN
  existing_role := NEW.raw_app_meta_data->>'role';

  IF existing_role IS NULL OR existing_role = '' THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', default_role)
    WHERE id = NEW.id;
  END IF;

  user_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    '未設定姓名'
  );

  user_phone := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone_number'), ''),
    ''
  );

  user_company := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'company'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'shop_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'shopName'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'business_name'), ''),
    user_name,
    '未設定車行名稱'
  );

  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      phone,
      company_name,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      user_name,
      user_phone,
      user_company,
      'pending',
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      RAISE WARNING '[handle_new_user] User % already exists in public.users. Skipping insert.', NEW.id;
    WHEN not_null_violation THEN
      RAISE WARNING '[handle_new_user] NOT NULL violation for user %. email=%, name=%, company=%',
        NEW.id, NEW.email, user_name, user_company;
      BEGIN
        INSERT INTO public.users (id, email, name, phone, company_name, status)
        VALUES (NEW.id, COALESCE(NEW.email, 'unknown@email.com'), '未設定', '', '未設定', 'pending');
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[handle_new_user] Fallback insert also failed: %', SQLERRM;
      END;
    WHEN OTHERS THEN
      RAISE WARNING '[handle_new_user] Unexpected error for user %: SQLSTATE=% MESSAGE=%',
        NEW.id, SQLSTATE, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

