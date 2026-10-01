-- ========================================================
-- Schema migration for User Passwords & Custom System Roles
-- ========================================================

-- 1. Ensure password column exists on user_profiles
ALTER TABLE IF EXISTS public.user_profiles
ADD COLUMN IF NOT EXISTS password text;

-- 2. Add comment
COMMENT ON COLUMN public.user_profiles.password IS 'Plain/hashed staff password for internal verification';

-- 3. Ensure role_permissions table has proper unique constraint if needed
DO 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_code_module_key'
    ) THEN
        -- If constraint does not exist, add unique constraint on (role_code, module_key)
        BEGIN
            ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_code_module_key UNIQUE (role_code, module_key);
        EXCEPTION
            WHEN others THEN NULL;
        END;
    END IF;
END ;
