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

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Reset password stranica učitana');
    
    // Inicijalizacija Supabase klijenta
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase klijent inicijalizovan:', supabaseClient);
    
    // Proverava URL parametre za reset password token
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');
    
    if (type === 'recovery' && accessToken) {
        console.log('Reset password token pronađen u URL-u');
        try {
            // Postavi sesiju na osnovu tokena iz URL-a
            const { data, error } = await supabaseClient.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });
            
            if (error) {
                console.error('Greška pri postavljanju sesije:', error);
                showMessage('Link za resetovanje lozinke nije valjan ili je istekao.', true);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
                return;
            }
            
            console.log('Reset password sesija uspešno postavljena');
            showMessage('Možete da unesete novu lozinku.', false);
        } catch (error) {
            console.error('Greška pri obradi reset password linka:', error);
            showMessage('Greška pri obradi linka za resetovanje lozinke.', true);
        }
    } else {
        // Ako nema reset password tokena, proveri da li postoji sesija
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            showMessage('Niste došli preko validnog linka za resetovanje lozinke.', true);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
            return;
        }
    }
    
    // Automatsko fokusiranje na nova lozinka polje
    document.getElementById('newPassword').focus();
});
