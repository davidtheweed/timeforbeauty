// ========================================
// AUTHENTICATION CHECK SCRIPT
// ========================================

// ========================================
// KONFIGURACIJA SUPABASE
// ========================================
// Koristi config.js za sigurniju konfiguraciju

// ========================================
// SUPABASE KLIJENT
// ========================================
// Koristi globalnu supabaseClient varijablu

// ========================================
// AUTHENTICATION CHECK FUNCTIONS
// ========================================

// Proveri da li je korisnik prijavljen
async function checkAuthentication() {
    try {
        console.log('checkAuthentication pozvana');
        
        // Inicijalizuj Supabase klijent ako nije već inicijalizovan
        if (!supabaseClient) {
            console.log('Inicijalizujem Supabase klijent...');
            const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://mwapsdsomjjviogysbov.supabase.co';
            const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YXBzZHNvbWpqdmlvZ3lzYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTM0MzYsImV4cCI6MjA3MjMyOTQzNn0.N5AFDfF5y6ngrXDXsQHRWb6xbccpOf3C5r5w10Uwjss';
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase klijent inicijalizovan:', supabaseClient);
        }

        // Proveri da li postoji sesija
        console.log('Proveravam sesiju...');
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        console.log('Sesija:', session);
        console.log('Greška:', error);
        
        if (error) {
            console.error('Greška pri proveri sesije:', error);
            redirectToLogin();
            return false;
        }

        if (!session || !session.user) {
            console.log('Nema aktivne sesije');
            redirectToLogin();
            return false;
        }

        console.log('Korisnik je prijavljen:', session.user.email);
        return true;
    } catch (error) {
        console.error('Greška pri proveri autentifikacije:', error);
        redirectToLogin();
        return false;
    }
}

// Proveri da li je korisnik admin
async function checkAdminRole() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session || !session.user) {
            return false;
        }

        // Fallback: Proveri da li je email u admin listi
        const adminEmails = ['davidheh15@gmail.com', 'timeforbeauty67@gmail.com'];
        if (adminEmails.includes(session.user.email)) {
            console.log('Admin email pronađen u fallback listi:', session.user.email);
            return true;
        }

        // Proveri ulogu korisnika iz baze
        const { data, error } = await supabaseClient
            .from('korisnici')
            .select('role')
            .eq('email', session.user.email)
            .single();
        
        if (error) {
            console.log('Greška pri dohvatanju uloge iz baze:', error);
            console.log('Koristim fallback proveru email-a');
            return false;
        }

        const isAdmin = data && data.role === 'admin';
        console.log('Admin uloga iz baze:', isAdmin, 'za email:', session.user.email);
        return isAdmin;
    } catch (error) {
        console.error('Greška pri proveri admin uloge:', error);
        return false;
    }
}

// Preusmeri na login stranicu
function redirectToLogin() {
    console.log('Preusmeravanje na login stranicu...');
    // Očisti localStorage pre preusmeravanja
    localStorage.clear();
    // Koristi window.location.replace da spreči povratak na admin stranicu
    window.location.replace('index.html');
}

// Preusmeri na appointment stranicu (za klijente)
function redirectToAppointment() {
    console.log('Preusmeravanje na appointment stranicu...');
    // Očisti localStorage pre preusmeravanja
    localStorage.clear();
    // Koristi window.location.replace da spreči povratak na admin stranicu
    window.location.replace('appointment.html');
}

// ========================================
// PAGE-SPECIFIC AUTHENTICATION CHECKS
// ========================================

// Proveri autentifikaciju za admin stranicu
async function checkAdminAccess() {
    console.log('checkAdminAccess pozvana');
    
    try {
        // Inicijalizuj Supabase klijent ako nije već inicijalizovan
        if (!supabaseClient) {
            console.log('Inicijalizujem Supabase klijent...');
            const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://mwapsdsomjjviogysbov.supabase.co';
            const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YXBzZHNvbWpqdmlvZ3lzYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTM0MzYsImV4cCI6MjA3MjMyOTQzNn0.N5AFDfF5y6ngrXDXsQHRWb6xbccpOf3C5r5w10Uwjss';
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }

        // JEDAN poziv za sesiju
        console.log('Proveravam sesiju...');
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            console.error('Greška pri proveri sesije:', error);
            return; // Ne preusmeravaj odmah, dozvoli korisniku da koristi appointment formu
        }

        if (!session || !session.user) {
            console.log('Nema aktivne sesije - dozvoli pristup appointment formi');
            return; // Ne preusmeravaj, dozvoli pristup appointment formi
        }

        console.log('Korisnik je prijavljen:', session.user.email);
        
        // Proveri admin ulogu (optimizovano)
        const adminEmails = ['davidheh15@gmail.com', 'timeforbeauty67@gmail.com'];
        if (adminEmails.includes(session.user.email)) {
            console.log('Admin email pronađen u fallback listi:', session.user.email);
            console.log('Admin pristup odobren');
            return;
        }

        // Proveri ulogu iz baze (samo ako nije u fallback listi)
        try {
            const { data, error } = await supabaseClient
                .from('korisnici')
                .select('role')
                .eq('email', session.user.email)
                .single();
            
            if (error) {
                console.log('Greška pri dohvatanju uloge iz baze:', error);
                return; // Dozvoli pristup appointment formi
            }

            const isAdmin = data && data.role === 'admin';
            console.log('Admin uloga iz baze:', isAdmin, 'za email:', session.user.email);
            
            if (isAdmin) {
                console.log('Admin pristup odobren');
            } else {
                console.log('Korisnik nije admin - dozvoli pristup appointment formi');
            }
        } catch (dbError) {
            console.error('Greška pri proveri admin uloge:', dbError);
            return; // Dozvoli pristup appointment formi
        }
        
    } catch (error) {
        console.error('Greška pri proveri autentifikacije:', error);
        return; // Dozvoli pristup appointment formi
    }
}


// Proveri autentifikaciju za appointment stranicu
async function checkClientAccess() {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) return;

    const isAdmin = await checkAdminRole();
    if (isAdmin) {
        console.log('Admin pokušava pristup appointment stranici, preusmeravanje na admin...');
        // Očisti localStorage pre preusmeravanja
        localStorage.clear();
        // Koristi window.location.replace da spreči povratak na appointment stranicu
        window.location.replace('admin.html');
        return;
    }

    console.log('Client pristup odobren');
}

// Proveri autentifikaciju za reset password stranicu
async function checkResetPasswordAccess() {
    try {
        console.log('checkResetPasswordAccess: Dozvoljavam pristup reset password stranici');
        // Reset password stranica ne zahteva posebne auth provere
        // Korisnik može doći ovde putem email linka ili direktno
        // Sve potrebne provere se rade u reset-password.js
        return;
    } catch (error) {
        console.error('Greška pri proveri reset password pristupa:', error);
        // U svakom slučaju dozvoli pristup reset password stranici
        return;
    }
}

// ========================================
// LOGOUT FUNCTION
// ========================================

async function logout() {
    try {
        if (!supabaseClient) {
            const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://mwapsdsomjjviogysbov.supabase.co';
            const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YXBzZHNvbWpqdmlvZ3lzYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTM0MzYsImV4cCI6MjA3MjMyOTQzNn0.N5AFDfF5y6ngrXDXsQHRWb6xbccpOf3C5r5w10Uwjss';
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }

        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            console.error('Greška pri logout:', error);
        } else {
            console.log('Uspešno logout');
            // Obriši localStorage
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminEmail');
            // Preusmeri na login
            redirectToLogin();
        }
    } catch (error) {
        console.error('Greška pri logout:', error);
        // U svakom slučaju preusmeri na login
        redirectToLogin();
    }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth check script učitana');
    
    // Inicijalizuj Supabase klijent
    if (!supabaseClient) {
        const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://mwapsdsomjjviogysbov.supabase.co';
        const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YXBzZHNvbWpqdmlvZ3lzYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTM0MzYsImV4cCI6MjA3MjMyOTQzNn0.N5AFDfF5y6ngrXDXsQHRWb6xbccpOf3C5r5w10Uwjss';
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // Dodaj event listener za logout dugme
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// ========================================
// CONTENT VISIBILITY FUNCTIONS
// ========================================

// Prikaži admin sadržaj nakon uspešne autentifikacije
function showAdminContent() {
    console.log('Prikazujem admin sadržaj...');
    
    // Sakrij loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 300);
    }
    
    // Prikaži admin planner
    const adminPlanner = document.getElementById('adminPlanner');
    if (adminPlanner) {
        adminPlanner.style.display = 'block';
    }
    
    // mainContainer ostaje vidljiv po default-u - ne menjamo ga
    // const mainContainer = document.getElementById('mainContainer');
    // if (mainContainer) {
    //     mainContainer.style.display = 'block';
    // }
    
    // adminLoginBtn ostaje vidljivo po default-u - ne menjamo ga
    // const adminLoginBtn = document.getElementById('adminLoginBtn');
    // if (adminLoginBtn) {
    //     adminLoginBtn.style.display = 'block';
    // }
    
    // Prikaži logout dugme
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.style.display = 'block';
    }
    
    console.log('Admin sadržaj prikazan');
    
    // Inicijalizuj aplikaciju nakon što se prikaže sadržaj
    // if (typeof initializeApp === 'function') {
    //     initializeApp();
    // } else {
    //     console.warn('initializeApp funkcija nije dostupna');
    // }
    // Uklonjeno da zadržimo originalnu funkcionalnost
}

// Sakrij admin sadržaj (koristi se pri logout-u)
function hideAdminContent() {
    console.log('Sakrivam admin sadržaj...');
    
    // Prikaži loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.classList.remove('hidden');
    }
    
    // Sakrij admin planner
    const adminPlanner = document.getElementById('adminPlanner');
    if (adminPlanner) {
        adminPlanner.style.display = 'none';
    }
    
    // mainContainer ostaje vidljiv po default-u - ne menjamo ga
    // const mainContainer = document.getElementById('mainContainer');
    // if (mainContainer) {
    //     mainContainer.style.display = 'none';
    // }
    
    // adminLoginBtn ostaje vidljivo po default-u - ne menjamo ga
    // const adminLoginBtn = document.getElementById('adminLoginBtn');
    // if (adminLoginBtn) {
    //     adminLoginBtn.style.display = 'none';
    // }
    
    // Sakrij logout dugme
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.style.display = 'none';
    }
    
    console.log('Admin sadržaj sakriven');
}
