-- Popravka RLS politike za appointments tabelu
-- Kopirajte i pokrenite ovaj kod u Supabase SQL Editor-u

-- Obrišite postojeću politiku
DROP POLICY IF EXISTS "Allow public insert on appointments" ON appointments;

-- Kreirajte novu politiku koja dozvoljava anonimni unos
CREATE POLICY "Allow anonymous insert on appointments" ON appointments
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Kreirajte i politiku za čitanje (opciono)
CREATE POLICY "Allow anonymous select on appointments" ON appointments
    FOR SELECT 
    TO anon
    USING (true);
