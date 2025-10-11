-- ========================================
-- ISPRAVKA is_admin() FUNKCIJE
-- ========================================

-- 1. Obriši postojeću is_admin funkciju
DROP FUNCTION IF EXISTS is_admin();

-- 2. Kreiraj novu is_admin funkciju sa SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Prvo proveri da li je korisnik ulogovan
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    
    -- Proveri da li je email u hardkodovanoj listi
    IF auth.jwt() ->> 'email' IN (
        'davidheh15@gmail.com',
        'timeforbeauty67n@gmail.com'
    ) THEN
        RETURN true;
    END IF;
    
    -- Proveri da li je role = 'admin' u korisnici tabeli
    RETURN EXISTS (
        SELECT 1 
        FROM korisnici 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'admin'
    );
END;
$$;

-- 3. Dodeli dozvole funkciji
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- 4. Testiraj funkciju
SELECT is_admin() as admin_status;

-- 5. Testiraj funkciju sa konkretnim emailom
SELECT 
    'timeforbeauty67n@gmail.com' as email,
    CASE 
        WHEN 'timeforbeauty67n@gmail.com' IN (
            'davidheh15@gmail.com',
            'timeforbeauty67n@gmail.com'
        ) THEN true
        ELSE EXISTS (
            SELECT 1 FROM korisnici 
            WHERE email = 'timeforbeauty67n@gmail.com' 
            AND role = 'admin'
        )
    END as admin_check;


