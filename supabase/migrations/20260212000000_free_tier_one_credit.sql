-- Free tier: new users get 1 credit (one full plan with all frameworks and export).
-- handle_new_user is updated from account_deletion migration (which set 5).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_credits INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM public.deleted_users WHERE email = new.email) THEN
    initial_credits := 0;
  ELSE
    initial_credits := 1;
  END IF;

  INSERT INTO public.profiles (
    user_id,
    display_name,
    credits,
    extra_credits,
    credits_expires_at,
    tier
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    initial_credits,
    0,
    now() + interval '5 weeks',
    'architect'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
