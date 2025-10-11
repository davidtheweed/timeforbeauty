# Stranica za Zakazivanje Termina

Jednostavna web stranica za zakazivanje termina sa Supabase backend-om.

## Funkcionalnosti

- ✅ Forma sa svim potrebnim poljima (ime, telefon, email, usluga, datum, vreme, napomena)
- ✅ Validacija forme na frontend strani
- ✅ Integracija sa Supabase bazom podataka
- ✅ Responsive dizajn (prilagođeno za mobilne telefone)
- ✅ Moderni dizajn sa svetlo roze i bež kombinacijom
- ✅ Loading animacije i poruke o uspehu/grešci

## Instalacija i Pokretanje

### 1. Kloniranje ili preuzimanje fajlova
Preuzmite sve fajlove u jedan folder.

### 2. Instalacija zavisnosti
```bash
npm install
```

### 3. Konfiguracija Supabase

1. Idite na [supabase.com](https://supabase.com) i kreirajte novi projekat
2. U vašem Supabase dashboard-u, idite na Settings > API
3. Kopirajte `Project URL` i `anon public` ključ
4. Otvorite `script.js` fajl i zamenite:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
   ```
   sa vašim stvarnim vrednostima.

### 4. Kreiranje tabele u Supabase

U Supabase SQL Editor-u, pokrenite sledeći SQL kod:

```sql
-- Kreiranje tabele za zakazivanje termina
CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    service TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kreiranje indeksa za bolje performanse
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_email ON appointments(email);

-- Omogućavanje RLS (Row Level Security)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Kreiranje politike koja dozvoljava unos podataka
CREATE POLICY "Allow public insert on appointments" ON appointments
    FOR INSERT WITH CHECK (true);
```

### 5. Pokretanje aplikacije

```bash
# Opcija 1: Koristeći npm script
npm start

# Opcija 2: Koristeći live-server za development
npm run dev

# Opcija 3: Jednostavno otvorite index.html u browser-u
```

Aplikacija će biti dostupna na `http://localhost:3000`

## Struktura Fajlova

```
├── index.html          # Login stranica (glavna)
├── style.css           # CSS stilovi
├── script.js           # JavaScript funkcionalnost
├── package.json        # NPM konfiguracija
└── README.md          # Dokumentacija
```

## Funkcionalnosti Forme

### Polja forme:
- **Ime i prezime** (obavezno)
- **Telefon** (obavezno, automatski formatiranje)
- **Email** (obavezno, validacija)
- **Usluga** (dropdown sa opcijama)
- **Datum** (obavezno, ne može biti u prošlosti)
- **Vreme** (obavezno)
- **Napomena** (opciono)

### Validacija:
- Sva obavezna polja moraju biti popunjena
- Email mora biti u validnom formatu
- Telefon se automatski formatira
- Datum ne može biti u prošlosti
- Maksimalni datum je godinu dana unapred

## Dizajn

- **Boje**: Svetlo roze (#ff9ec7) i bež (#f5f5dc) kombinacija
- **Responsive**: Prilagođeno za sve veličine ekrana
- **Animacije**: Smooth hover efekti i loading animacije
- **Tipografija**: Moderne, čitljive fontove

## Tehnologije

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + API)
- **Biblioteke**: @supabase/supabase-js

## Podrška

Za pitanja ili probleme, proverite:
1. Da li su Supabase URL i ključ ispravno postavljeni
2. Da li je tabela `appointments` kreirana u Supabase
3. Da li su RLS politike ispravno konfigurisane
4. Da li je internet konekcija stabilna

## Licenca

MIT License - slobodno koristite i modifikujte prema potrebi.
