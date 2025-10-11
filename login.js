// ========================================
// KONFIGURACIJA SUPABASE
// ========================================
const SUPABASE_URL = 'https://mwapsdsomjjviogysbov.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YXBzZHNvbWpqdmlvZ3lzYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTM0MzYsImV4cCI6MjA3MjMyOTQzNn0.N5AFDfF5y6ngrXDXsQHRWb6xbccpOf3C5r5w10Uwjss';

// ========================================
// SUPABASE KLIJENT
// ========================================
let supabaseClient;

// ========================================
// DOM ELEMENTI
// ========================================
const loginForm = document.getElementById('loginForm');
const submitBtn = document.querySelector('.submit-btn');
const btnText = document.querySelector('.btn-text');
const btnLoading = document.querySelector('.btn-loading');
const messageDiv = document.getElementById('message');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

// ========================================
// SUPABASE AUTH FUNKCIJE
// ========================================

// Supabase Auth login
async function loginWithSupabase(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        return data.user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Proverite ulogu korisnika
async function getUserRole(email) {
    try {
        const { data, error } = await supabaseClient
            .from('korisnici')
            .select('role')
            .eq('email', email)
            .single();
        
        if (error) {
            console.error('Greška pri dohvatanju uloge:', error);
            return null;
        }
        
        return data.role;
    } catch (error) {
        console.error('Greška pri dohvatanju uloge:', error);
        return null;
    }
}

// Prikazivanje poruke
function showMessage(message, isError = false) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
    messageDiv.style.display = 'block';
    
    // Sakrij poruku nakon 5 sekundi
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// ========================================
// FORGOT PASSWORD FUNKCIJE
// ========================================

// Proveri da li email postoji u Supabase Auth
async function checkEmailExists(email) {
    try {
        // Pokušaj da pošalješ reset password email
        // Supabase će vratiti grešku ako email ne postoji
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        
        if (error) {
            // Ako je greška "User not found", email ne postoji
            if (error.message.includes('User not found') || error.message.includes('Invalid email')) {
                return false;
            }
            throw error;
        }
        
        return true;
    } catch (error) {
        console.error('Greška pri proveri email-a:', error);
        return false;
    }
}

// Kreiraj modal za zaboravljenu lozinku
function createForgotPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'forgot-password-modal';
    modal.innerHTML = `
        <div class="forgot-password-content">
            <div class="forgot-password-header">
                <h3>Zaboravili ste lozinku?</h3>
                <p>Unesite vašu email adresu i poslaćemo vam link za resetovanje lozinke.</p>
            </div>
            <form class="forgot-password-form" id="forgotPasswordForm">
                <div class="form-group">
                    <label for="resetEmail">Email adresa *</label>
                    <input type="email" id="resetEmail" name="resetEmail" required>
                </div>
                <div class="forgot-password-actions">
                    <button type="button" class="cancel-btn" id="cancelResetBtn">Otkaži</button>
                    <button type="submit" class="send-btn" id="sendResetBtn">
                        <span class="btn-text">Pošalji</span>
                        <span class="btn-loading" style="display: none;">Šalje se...</span>
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeneri
    const cancelBtn = modal.querySelector('#cancelResetBtn');
    const form = modal.querySelector('#forgotPasswordForm');
    const sendBtn = modal.querySelector('#sendResetBtn');
    const btnText = sendBtn.querySelector('.btn-text');
    const btnLoading = sendBtn.querySelector('.btn-loading');
    
    // Otkaži
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Zatvori modal klikom van njega
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Submit forma
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value.trim();
        
        if (!email) {
            showMessage('Molimo unesite email adresu.', true);
            return;
        }
        
        try {
            // Prikaži loading
            sendBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-block';
            
            // Proveri da li email postoji
            const emailExists = await checkEmailExists(email);
            
            if (emailExists) {
                showMessage('Email sa instrukcijama za resetovanje lozinke je poslat na vašu adresu.', false);
                document.body.removeChild(modal);
            } else {
                showMessage('Email adresa nije pronađena u sistemu.', true);
            }
        } catch (error) {
            console.error('Greška pri slanju reset email-a:', error);
            showMessage('Greška pri slanju email-a. Pokušajte ponovo.', true);
        } finally {
            // Sakrij loading
            sendBtn.disabled = false;
            btnText.style.display = 'inline-block';
            btnLoading.style.display = 'none';
        }
    });
    
    // Fokus na email polje
    setTimeout(() => {
        document.getElementById('resetEmail').focus();
    }, 100);
}

// ========================================
// DOGAĐAJI
// ========================================

// Forgot password dugme
forgotPasswordBtn.addEventListener('click', () => {
    createForgotPasswordModal();
});

// Login forma
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    try {
        // Prikaži loading
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
        
        // Login sa Supabase Auth
        const user = await loginWithSupabase(email, password);
        
        if (user) {
            // Proverite ulogu korisnika
            const role = await getUserRole(email);
            
            if (role === 'admin') {
                showMessage('Dobrodošao admin!');
                // Sačuvaj admin status i email u localStorage
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('adminEmail', email);
                // Preusmerite na admin panel
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 2000);
            } else if (role === 'client') {
                showMessage('Dobrodošao korisniče!');
                // Sačuvaj client status u localStorage
                localStorage.setItem('isAdmin', 'false');
                // Preusmerite na formu za zakazivanje
                setTimeout(() => {
                    window.location.href = 'appointment.html';
                }, 2000);
            } else {
                showMessage('Greška: Korisnik nema definisanu ulogu.', true);
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Greška pri prijavi: ' + error.message, true);
    } finally {
        // Sakrij loading
        submitBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
    }
});

// ========================================
// INICIJALIZACIJA
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Login stranica učitana');
    
    // Inicijalizacija Supabase klijenta
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase klijent inicijalizovan:', supabaseClient);
    
    // Automatsko fokusiranje na email polje
    document.getElementById('email').focus();
});