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
const resetPasswordForm = document.getElementById('resetPasswordForm');
const submitBtn = document.querySelector('.submit-btn');
const btnText = document.querySelector('.btn-text');
const btnLoading = document.querySelector('.btn-loading');
const messageDiv = document.getElementById('message');

// ========================================
// SUPABASE AUTH FUNKCIJE
// ========================================

// Reset password
async function resetPassword(newPassword) {
    try {
        const { data, error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });
        
        if (error) {
            throw error;
        }
        
        return data.user;
    } catch (error) {
        console.error('Reset password error:', error);
        throw error;
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
// DOGAĐAJI
// ========================================

// Reset password forma
resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    
    // Validacija
    if (newPassword.length < 6) {
        showMessage('Lozinka mora imati najmanje 6 karaktera.', true);
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('Lozinke se ne poklapaju.', true);
        return;
    }
    
    try {
        // Prikaži loading
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
        
        // Reset password
        const user = await resetPassword(newPassword);
        
        if (user) {
            showMessage('Lozinka je uspešno promenjena! Preusmeravamo vas na login stranicu...', false);
            
            // Preusmeri na login stranicu nakon 3 sekunde
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showMessage('Greška pri promeni lozinke: ' + error.message, true);
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
    console.log('Reset password stranica učitana');
    
    // Inicijalizacija Supabase klijenta
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase klijent inicijalizovan:', supabaseClient);
    
    // Proveri da li je korisnik autentifikovan
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            showMessage('Niste autentifikovani. Preusmeravamo vas na login stranicu...', true);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    });
    
    // Automatsko fokusiranje na nova lozinka polje
    document.getElementById('newPassword').focus();
});
