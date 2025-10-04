// ========================================
// ADMIN PROTECTION UPDATES
// ========================================
// Dodajte ove izmene u postojeći script.js

// ========================================
// 1. ADMIN OPERATION PROTECTION
// ========================================

// Zamenite postojeće admin operacije sa zaštićenim verzijama

// STARO (bez zaštite):
// const { data, error } = await supabaseClient
//     .from('appointments')
//     .delete()
//     .eq('id', taskId);

// NOVO (sa zaštitom):
async function deleteAppointmentSafe(appointmentId) {
    if (!window.AdminMiddleware) {
        throw new Error('Admin middleware not loaded');
    }
    
    const result = await window.AdminMiddleware.adminDeleteAppointment(supabaseClient, appointmentId);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    return result.data;
}

// ========================================
// 2. ADMIN PANEL PROTECTION
// ========================================

// Dodajte u showAdminPanel() funkciju:
async function showAdminPanelSafe() {
    try {
        // Proveri admin status pre prikazivanja
        if (window.AdminMiddleware) {
            // Prvo testiraj admin status
            try {
                const { data: testResult, error: testError } = await supabaseClient
                    .rpc('test_admin_status');
                
                if (testError) {
                    console.error('Test admin status error:', testError);
                } else {
                    console.log('Admin status test:', testResult);
                }
            } catch (testErr) {
                console.log('Test function not available, using middleware');
            }
            
            const authResult = await window.AdminMiddleware.checkAdminAuth(supabaseClient);
            console.log('Admin auth result:', authResult);
            
            if (authResult.isAdmin) {
                // Pozovi originalnu showAdminPanel funkciju
                isAdminLoggedIn = true;
                mainContainer.style.display = 'none';
                adminPlanner.style.display = 'block';
                hideAdminLoginModal();
                
                // Sakrij admin login dugme i prikaži back i logout dugmad
                adminLoginBtn.style.display = 'none';
                backBtn.style.display = 'block';
                logoutBtn.style.display = 'block';
                
                // Učitaj obaveze iz Supabase
                if (planner) {
                    planner.loadTasks();
                }
            } else {
                alert(`Nemate admin pristup. Greška: ${authResult.error || 'Nepoznata greška'}`);
            }
        } else {
            // Fallback na postojeću logiku
            isAdminLoggedIn = true;
            mainContainer.style.display = 'none';
            adminPlanner.style.display = 'block';
            hideAdminLoginModal();
            
            // Sakrij admin login dugme i prikaži back i logout dugmad
            adminLoginBtn.style.display = 'none';
            backBtn.style.display = 'block';
            logoutBtn.style.display = 'block';
            
            // Učitaj obaveze iz Supabase
            if (planner) {
                planner.loadTasks();
            }
        }
    } catch (error) {
        console.error('Error in showAdminPanelSafe:', error);
        alert('Greška pri proveri admin pristupa: ' + error.message);
    }
}

// ========================================
// 3. ADMIN DATA LOADING PROTECTION
// ========================================

// Zamenite postojeće loadTasks() funkciju:
async function loadTasksSafe() {
    try {
        if (window.AdminMiddleware) {
            const result = await window.AdminMiddleware.adminGetAllAppointments(supabaseClient);
            
            if (result.success) {
                // Konvertuj appointments u planner tasks format
                plannerTasks = (result.data || []).map(appointment => ({
                    id: appointment.id,
                    title: appointment.first_name,
                    time: appointment.appointment_time,
                    service: appointment.service,
                    worker: appointment.worker,
                    email: appointment.email,
                    phone: appointment.phone,
                    date: appointment.appointment_date,
                    notes: appointment.notes,
                    duration: appointment.duration
                }));
                
                // Ažuriraj prikaz ako planner postoji
                if (window.planner && window.planner.updateTasksDisplay) {
                    window.planner.updateTasksDisplay();
                }
            } else {
                console.error('Failed to load tasks:', result.error);
                showError('Ne možete da učitavate termine. Proverite admin pristup.');
            }
        } else {
            // Fallback na postojeću logiku
            if (window.planner && window.planner.loadTasks) {
                await window.planner.loadTasks();
            }
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showError('Greška pri učitavanju termina.');
    }
}

// ========================================
// 4. ADMIN TASK OPERATIONS PROTECTION
// ========================================

// Zamenite postojeće deleteTask() funkciju:
async function deleteTaskSafe(taskId) {
    try {
        if (window.AdminMiddleware) {
            const result = await window.AdminMiddleware.adminDeleteAppointment(supabaseClient, taskId);
            
            if (result.success) {
                console.log('Task deleted successfully');
                await loadTasksSafe(); // Reload tasks
                
                // Ažuriraj prikaz ako planner postoji
                if (window.planner && window.planner.updateTasksDisplay) {
                    window.planner.updateTasksDisplay();
                }
            } else {
                console.error('Failed to delete task:', result.error);
                showError('Ne možete da brišete termine. Proverite admin pristup.');
            }
        } else {
            // Fallback na postojeću logiku
            if (window.planner && window.planner.deleteTask) {
                await window.planner.deleteTask(taskId);
            }
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showError('Greška pri brisanju termina.');
    }
}

// Zamenite postojeće updateTask() funkciju:
async function updateTaskSafe(taskId, updateData) {
    try {
        if (window.AdminMiddleware) {
            const result = await window.AdminMiddleware.adminUpdateAppointment(supabaseClient, taskId, updateData);
            
            if (result.success) {
                console.log('Task updated successfully');
                await loadTasksSafe(); // Reload tasks
            } else {
                console.error('Failed to update task:', result.error);
                showError('Ne možete da ažurirate termine. Proverite admin pristup.');
            }
        } else {
            // Fallback na postojeću logiku
            updateTask(taskId, updateData);
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showError('Greška pri ažuriranju termina.');
    }
}

// ========================================
// 5. ADMIN USER MANAGEMENT PROTECTION
// ========================================

// Zamenite postojeće user registration funkcije:
async function registerUserSafe(userData) {
    try {
        if (window.AdminMiddleware) {
            const result = await window.AdminMiddleware.adminCreateUser(supabaseClient, userData);
            
            if (result.success) {
                console.log('User created successfully');
                return result.data;
            } else {
                console.error('Failed to create user:', result.error);
                throw new Error(result.error);
            }
        } else {
            // Fallback na postojeću logiku
            return registerUser(userData);
        }
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// ========================================
// 6. ADMIN STATISTICS PROTECTION
// ========================================

// Dodajte sigurnu funkciju za statistike:
async function getAdminStatsSafe() {
    try {
        if (window.AdminMiddleware) {
            const result = await window.AdminMiddleware.adminGetStats(supabaseClient);
            
            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to get stats:', result.error);
                return null;
            }
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting stats:', error);
        return null;
    }
}

// ========================================
// 7. ADMIN REPORT PROTECTION
// ========================================

// Dodajte sigurnu funkciju za izveštaje:
async function getAdminReportSafe(startDate, endDate) {
    try {
        if (window.AdminMiddleware) {
            const result = await window.AdminMiddleware.adminGetReport(supabaseClient, startDate, endDate);
            
            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to get report:', result.error);
                return null;
            }
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting report:', error);
        return null;
    }
}

// ========================================
// 8. ADMIN ACTIVITY LOG PROTECTION
// ========================================

// Dodajte sigurnu funkciju za activity log:
async function getAdminActivityLogSafe(limit = 100) {
    try {
        if (window.AdminMiddleware) {
            const result = await window.AdminMiddleware.adminGetActivityLog(supabaseClient, limit);
            
            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to get activity log:', result.error);
                return null;
            }
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting activity log:', error);
        return null;
    }
}

// ========================================
// 9. ERROR HANDLING FUNCTIONS
// ========================================

function showError(message) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

// ========================================
// 10. INITIALIZATION
// ========================================

// Dodajte u DOMContentLoaded event listener:
document.addEventListener('DOMContentLoaded', () => {
    // Postojeća inicijalizacija...
    
    // Dodajte admin middleware proveru
    if (window.AdminMiddleware) {
        console.log('Admin middleware loaded successfully');
        
        // Proveri admin status na početku
        window.AdminMiddleware.checkAdminAuth(supabaseClient).then(authResult => {
            if (authResult.isAdmin) {
                console.log('Admin authenticated:', authResult.user.email);
            } else {
                console.log('Not admin or not authenticated');
            }
        });
    } else {
        console.warn('Admin middleware not loaded - using fallback logic');
    }
});

// ========================================
// 11. EXPORT FUNCTIONS
// ========================================

// Eksportuj zaštićene funkcije
window.AdminProtected = {
    deleteAppointmentSafe,
    showAdminPanelSafe,
    loadTasksSafe,
    deleteTaskSafe,
    updateTaskSafe,
    registerUserSafe,
    getAdminStatsSafe,
    getAdminReportSafe,
    getAdminActivityLogSafe,
    showError,
    showSuccess
};
