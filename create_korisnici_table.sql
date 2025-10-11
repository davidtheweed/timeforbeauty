-- Kreiranje tabele korisnici
CREATE TABLE korisnici (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dodavanje admin korisnika
INSERT INTO korisnici (email, role) 
VALUES ('davidheh15@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Omogućavanje RLS (Row Level Security)
ALTER TABLE korisnici ENABLE ROW LEVEL SECURITY;

-- Kreiranje politike koja dozvoljava čitanje podataka za authenticated korisnike
CREATE POLICY "Allow authenticated read on korisnici" ON korisnici
    FOR SELECT 
    TO authenticated
    USING (true);

-- Kreiranje politike koja dozvoljava čitanje podataka za anonimne korisnike (za login)
CREATE POLICY "Allow anonymous read on korisnici" ON korisnici
    FOR SELECT 
    TO anon
    USING (true);

-- Kreiranje politike koja dozvoljava insert podataka za authenticated korisnike (za registraciju)
CREATE POLICY "Allow authenticated insert on korisnici" ON korisnici
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Kreiranje politike koja dozvoljava update podataka za authenticated korisnike
CREATE POLICY "Allow authenticated update on korisnici" ON korisnici
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);
