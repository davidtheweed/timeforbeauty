// ========================================
// ADMIN MIDDLEWARE FUNCTIONS
// ========================================

// ========================================
// ADMIN AUTHENTICATION MIDDLEWARE
// ========================================

/**
 * Proverava da li je korisnik autentifikovan i ima admin ulogu
 * @param {Object} supabaseClient - Supabase klijent
 * @returns {Promise<Object>} - { isAdmin: boolean, user: Object|null, error: string|null }
 */
async function checkAdminAuth(supabaseClient) {
    try {
        // 1. Proveri da li je korisnik autentifikovan
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
            console.error('Session error:', sessionError);
            return { isAdmin: false, user: null, error: 'Session error' };
        }

        if (!session || !session.user) {
            return { isAdmin: false, user: null, error: 'Not authenticated' };
        }

        // 2. Proveri admin ulogu
        const isAdmin = await checkAdminRole(supabaseClient, session.user.email);
        
        return { 
            isAdmin, 
            user: session.user, 
            error: isAdmin ? null : 'Not admin' 
        };
        
    } catch (error) {
        console.error('Admin auth check error:', error);
        return { isAdmin: false, user: null, error: 'Auth check failed' };
    }
}

/**
 * Proverava da li korisnik ima admin ulogu
 * @param {Object} supabaseClient - Supabase klijent
 * @param {string} email - Email korisnika
 * @returns {Promise<boolean>}
 */
async function checkAdminRole(supabaseClient, email) {
    try {
        // 1. Prvo proveri hardkodovane admin emailove
        const adminEmails = ['davidheh15@gmail.com', 'timeforbeauty67@gmail.com'];
        if (adminEmails.includes(email)) {
            console.log('Admin access granted via hardcoded email:', email);
            return true;
        }

        // 2. Pokušaj da proveri ulogu iz baze podataka
        try {
            const { data, error } = await supabaseClient
                .from('korisnici')
                .select('role')
                .eq('email', email)
                .single();

            if (error) {
                console.log('Role check error (likely RLS blocking):', error.message);
                // Ako je greška zbog RLS-a, korisnik verovatno nije admin
                return false;
            }

            if (data && data.role === 'admin') {
                console.log('Admin access granted via database role:', email);
                return true;
            }
        } catch (dbError) {
            console.log('Database role check failed (likely RLS):', dbError.message);
            // Ako ne možemo da pristupimo bazi zbog RLS-a, korisnik nije admin
            return false;
        }

        console.log('User is not admin:', email);
        return false;
    } catch (error) {
        console.error('Role check failed:', error);
        return false;
    }
}

// ========================================
// ADMIN OPERATION WRAPPERS
// ========================================

/**
 * Wrapper za admin operacije - proverava autentifikaciju pre izvršavanja
 * @param {Function} operation - Funkcija koja se izvršava
 * @param {Object} supabaseClient - Supabase klijent
 * @returns {Promise<Object>} - Rezultat operacije ili greška
 */
async function withAdminAuth(operation, supabaseClient) {
    const authResult = await checkAdminAuth(supabaseClient);
    
    if (!authResult.isAdmin) {
        return {
            success: false,
            error: 'Access denied: Admin role required',
            code: 'ADMIN_REQUIRED'
        };
    }

    try {
        const result = await operation();
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Admin operation error:', error);
        return {
            success: false,
            error: error.message || 'Operation failed',
            code: 'OPERATION_ERROR'
        };
    }
}

// ========================================
// ADMIN DATABASE OPERATIONS
// ========================================

/**
 * Sigurno dohvatanje svih termina (samo za admin)
 * @param {Object} supabaseClient - Supabase klijent
 * @returns {Promise<Object>}
 */
async function adminGetAllAppointments(supabaseClient) {
    return withAdminAuth(async () => {
        const { data, error } = await supabaseClient
            .from('appointments')
            .select('*')
            .order('appointment_date', { ascending: true });

        if (error) throw error;
        return data;
    }, supabaseClient);
}

/**
 * Sigurno brisanje termina (samo za admin)
 * @param {Object} supabaseClient - Supabase klijent
 * @param {number} appointmentId - ID termina
 * @returns {Promise<Object>}
 */
async function adminDeleteAppointment(supabaseClient, appointmentId) {
    return withAdminAuth(async () => {
        const { data, error } = await supabaseClient
            .from('appointments')
            .delete()
            .eq('id', appointmentId)
            .select();

        if (error) throw error;
        return data;
    }, supabaseClient);
}

/**
 * Sigurno ažuriranje termina (samo za admin)
 * @param {Object} supabaseClient - Supabase klijent
 * @param {number} appointmentId - ID termina
 * @param {Object} updateData - Podaci za ažuriranje
 * @returns {Promise<Object>}
 */
async function adminUpdateAppointment(supabaseClient, appointmentId, updateData) {
    return withAdminAuth(async () => {
        const { data, error } = await supabaseClient
            .from('appointments')
            .update(updateData)
            .eq('id', appointmentId)
            .select();

        if (error) throw error;
        return data;
    }, supabaseClient);
}

/**
 * Sigurno dohvatanje svih korisnika (samo za admin)
 * @param {Object} supabaseClient - Supabase klijent
 * @returns {Promise<Object>}
 */
async function adminGetAllUsers(supabaseClient) {
    return withAdminAuth(async () => {
        const { data, error } = await supabaseClient
            .from('korisnici')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }, supabaseClient);
}

/**
 * Sigurno kreiranje novog korisnika (samo za admin)
 * @param {Object} supabaseClient - Supabase klijent
 * @param {Object} userData - Podaci korisnika
 * @returns {Promise<Object>}
 */
async function adminCreateUser(supabaseClient, userData) {
    return withAdminAuth(async () => {
        const { data, error } = await supabaseClient
            .from('korisnici')
            .insert([userData])
            .select();

        if (error) throw error;
        return data;
    }, supabaseClient);
}

/**
 * Sigurno ažuriranje korisnika (samo za admin)
 * @param {Object} supabaseClient - Supabase klijent
 * @param {string} email - Email korisnika
 * @param {Object} updateData - Podaci za ažuriranje
 * @returns {Promise<Object>}
 */
async function adminUpdateUser(supabaseClient, email, updateData) {
    return withAdminAuth(async () => {
        const { data, error } = await supabaseClient
            .from('korisnici')
            .update(updateData)
            .eq('email', email)
            .select();

        if (error) throw error;
        return data;
    }, supabaseClient);
}

// ========================================
// ADMIN STATISTICS AND REPORTS
// ========================================

/**
 * Sigurno dohvatanje admin statistika
 * @param {Object} supabaseClient - Supabase klijent
 * @returns {Promise<Object>}
 */
async function adminGetStats(supabaseClient) {
    return withAdminAuth(async () => {
        // Pozovi admin funkciju iz baze
        const { data, error } = await supabaseClient
            .rpc('get_admin_stats');

        if (error) throw error;
        return data;
    }, supabaseClient);
}

/**
 * Sigurno dohvatanje admin izveštaja
 * @param {Object} supabaseClient - Supabase klijent
 * @param {string} startDate - Početni datum
 * @param {string} endDate - Krajnji datum
 * @returns {Promise<Object>}
 */
async function adminGetReport(supabaseClient, startDate, endDate) {
    return withAdminAuth(async () => {
        // Pozovi admin funkciju iz baze
        const { data, error } = await supabaseClient
            .rpc('get_admin_report', {
                start_date: startDate,
                end_date: endDate
            });

        if (error) throw error;
        return data;
    }, supabaseClient);
}

// ========================================
// ADMIN ACTIVITY LOG
// ========================================

/**
 * Sigurno dohvatanje admin activity log-a
 * @param {Object} supabaseClient - Supabase klijent
 * @param {number} limit - Limit broja zapisa
 * @returns {Promise<Object>}
 */
async function adminGetActivityLog(supabaseClient, limit = 100) {
    return withAdminAuth(async () => {
        const { data, error } = await supabaseClient
            .from('admin_activity_log')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }, supabaseClient);
}

// ========================================
// EXPORT FUNCTIONS
// ========================================

// Eksportuj funkcije za korišćenje u aplikaciji
window.AdminMiddleware = {
    checkAdminAuth,
    checkAdminRole,
    withAdminAuth,
    adminGetAllAppointments,
    adminDeleteAppointment,
    adminUpdateAppointment,
    adminGetAllUsers,
    adminCreateUser,
    adminUpdateUser,
    adminGetStats,
    adminGetReport,
    adminGetActivityLog
};
