// ========================================
// KONFIGURACIJA SUPABASE
// ========================================
// Koristi config.js za sigurniju konfiguraciju

// ========================================
// SUPABASE KLIJENT
// ========================================
let supabaseClient;

// ========================================
// DOM ELEMENTI
// ========================================
const form = document.getElementById('appointmentForm');
const submitBtn = document.querySelector('.submit-btn');
const btnText = document.querySelector('.btn-text');
const btnLoading = document.querySelector('.btn-loading');
const messageDiv = document.getElementById('message');
const logoutBtn = document.getElementById('logoutBtn');

// ========================================
// SUPABASE AUTH FUNKCIJE
// ========================================

// Supabase Auth logout
async function logoutFromSupabase() {
    try {
        console.log('Starting logout process...');
        
        // Proveri da li postoji aktivna sesija
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        console.log('Current session:', session);
        
        if (sessionError) {
            console.error('Session error:', sessionError);
        }
        
        if (!session) {
            console.log('No active session found, clearing local storage and redirecting...');
            // Očisti localStorage
            localStorage.clear();
            // Preusmerite na login stranicu
            window.location.href = 'index.html';
            return;
        }
        
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
            // Čak i ako logout ne uspe, očisti localStorage i preusmeri
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }
        
        console.log('Logout successful, redirecting...');
        // Očisti localStorage
        localStorage.clear();
        // Preusmerite na login stranicu
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Čak i ako logout ne uspe, očisti localStorage i preusmeri
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// ========================================
// DOGAĐAJI
// ========================================

// Proveri da li je logoutBtn pronađen
if (!logoutBtn) {
    console.error('Logout button not found!');
} else {
    console.log('Logout button found:', logoutBtn);
}

// Logout dugme - dodaj touch event za mobilne uređaje
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Logout clicked');
        await logoutFromSupabase();
    });

    // Touch event za logout dugme na mobilnim uređajima
    logoutBtn.addEventListener('touchend', async (e) => {
        e.preventDefault();
        console.log('Logout touched');
        await logoutFromSupabase();
    });

    // Touchstart event za dodatnu sigurnost
    logoutBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Logout touchstart');
    });

    // Dodatni event listener za sigurnost
    logoutBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        console.log('Logout pointerdown');
    });

    // Dodatni event listener za sigurnost
    logoutBtn.addEventListener('pointerup', async (e) => {
        e.preventDefault();
        console.log('Logout pointerup');
        await logoutFromSupabase();
    });
}

// Slušanje submit događaja forme
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submit pozvan');

    // Dobij trenutnog korisnika
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        showMessage('Morate biti ulogovani da biste zakazali termin.', true);
        return;
    }
    
    // Dobij podatke korisnika iz tabele korisnici
    const { data: userData, error: userError } = await supabaseClient
        .from('korisnici')
        .select('first_name, last_name, phone, email')
        .eq('email', user.email)
        .single();
    
    if (userError || !userData) {
        showMessage('Greška pri dohvatanju podataka korisnika.', true);
        return;
    }

    // Validate worker selection
    const selectedWorker = document.querySelector('input[name="worker"]:checked')?.value;
    if (!selectedWorker) {
        showMessage('Molimo izaberite radnika.', true);
        return;
    }

    // Get selected services
    const selectedServices = Array.from(document.querySelectorAll('input[name="service"]:checked'))
        .map(checkbox => ({
            value: checkbox.value,
            name: checkbox.closest('.service-option').querySelector('.service-name').textContent,
            price: parseInt(checkbox.dataset.price),
            duration: parseInt(checkbox.dataset.duration) || getServiceDuration(checkbox.value)
        }));

    if (selectedServices.length === 0) {
        showMessage('Molimo izaberite bar jednu uslugu.', true);
        return;
    }

    const formData = {
        firstName: userData.first_name + ' ' + userData.last_name,
        phone: userData.phone || 'N/A', // Provide default if phone is null
        email: userData.email,
        services: selectedServices, // Array of selected services
        service: selectedServices.map(s => s.value).join(', '), // For backward compatibility
        worker: selectedWorker,
        date: document.getElementById('date').value, // ISO format: "2025-10-01"
        time: document.getElementById('time').value, // HH:MM format: "14:30"
        notes: document.getElementById('notes').value.trim()
    };

    console.log('Form data:', formData);

    try {
        // Proveri preklapanje termina - izračunaj ukupno trajanje
        const totalDuration = selectedServices.reduce((total, service) => {
            // Koristi data-duration iz HTML-a ako postoji, inače koristi getServiceDuration
            const duration = service.duration || getServiceDuration(service.value);
            return total + duration;
        }, 0);
        const overlapError = await checkTimeOverlap(formData.date, formData.time, totalDuration, formData.worker);
        if (overlapError) {
            showMessage(overlapError, true);
            return;
        }

        // Prikaži loading
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';

        // Pošalji podatke u Supabase
        const result = await sendToSupabase(formData);
        
        if (result.success) {
            showMessage('Termin je uspešno zakažen!', false);
            
            // Show appointment card with booked details
            showAppointmentCard(formData);
            
            form.reset();
        } else {
            showMessage('Greška pri zakazivanju termina.', true);
        }
    } catch (error) {
        console.error('Greška:', error);
        showMessage('Greška pri zakazivanju termina: ' + error.message, true);
    } finally {
        // Sakrij loading
        submitBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
    }
});

// ========================================
// SUPABASE FUNKCIJE
// ========================================

async function sendToSupabase(formData) {
    try {
        console.log('Šaljem podatke u Supabase...');
        
        // Kreiraj termin za svaku uslugu (koristi postojeće kolone)
        const appointmentsToInsert = formData.services.map(service => ({
            first_name: formData.firstName,
            phone: formData.phone,
            email: formData.email,
            service: service.value, // Koristi service.value kao ključ za trajanje
            worker: formData.worker,
            appointment_date: formData.date,
            appointment_time: formData.time,
            notes: formData.notes || null,
            created_at: new Date().toISOString()
        }));

        const { data, error } = await supabaseClient
            .from('appointments')
            .insert(appointmentsToInsert)
            .select();

        console.log('Supabase odgovor - data:', data);
        console.log('Supabase odgovor - error:', error);

        if (error) {
            console.error('Supabase greška:', error);
            throw error;
        }

        console.log('Uspešno poslato u Supabase:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Greška pri slanju podataka:', error);
        throw error;
    }
}

// Funkcija za proveru preklapanja termina (kao u admin kodu)
async function checkTimeOverlap(date, time, duration, worker) {
    try {
        console.log(`Proveravam preklapanje za ${date} ${time} ${duration} min ${worker}`);
        
        // Dohvati sve termine za taj datum i radnika
        const { data: existingAppointments, error } = await supabaseClient
            .from('appointments')
            .select('appointment_time, service, worker, duration')
            .eq('appointment_date', date)
            .eq('worker', worker);
        
        if (error) {
            console.error('Greška pri dohvatanju postojećih termina:', error);
            return null; // Ne blokiraj ako ne možemo da proverimo
        }
        
        if (!existingAppointments || existingAppointments.length === 0) {
            console.log('Nema postojećih termina za ovaj datum i radnika');
            return null; // Nema postojećih termina, nema preklapanja
        }
        
        // Izračunaj trajanje nove usluge
        const newServiceDuration = duration;
        const [newStartHour, newStartMinute] = time.split(':').map(Number);
        const newStartMinutes = newStartHour * 60 + newStartMinute;
        const newEndMinutes = newStartMinutes + newServiceDuration;
        
        console.log(`Nova usluga: ${time} (${newServiceDuration} min) - od ${newStartMinutes} do ${newEndMinutes} min`);
        
        // Grupiši postojeće termine po vremenu i izračunaj ukupno trajanje
        const existingAppointmentsByTime = {};
        existingAppointments.forEach(appointment => {
            const timeWithoutSeconds = appointment.appointment_time.substring(0, 5);
            if (!existingAppointmentsByTime[timeWithoutSeconds]) {
                existingAppointmentsByTime[timeWithoutSeconds] = [];
            }
            existingAppointmentsByTime[timeWithoutSeconds].push(appointment);
        });
        
        // Proveri preklapanje sa svakim postojećim terminom
        for (const [existingTime, appointmentsAtTime] of Object.entries(existingAppointmentsByTime)) {
            // Izračunaj ukupno trajanje za sve usluge u ovom terminu
            const existingTotalDuration = appointmentsAtTime.reduce((total, appointment) => {
                // Koristi duration iz baze ako postoji, inače getServiceDuration
                const duration = appointment.duration || getServiceDuration(appointment.service);
                return total + duration;
            }, 0);
            
            const [existingStartHour, existingStartMinute] = existingTime.split(':').map(Number);
            const existingStartMinutes = existingStartHour * 60 + existingStartMinute;
            const existingEndMinutes = existingStartMinutes + existingTotalDuration;
            
            console.log(`Postojeći termin: ${existingTime} (${existingTotalDuration} min) - od ${existingStartMinutes} do ${existingEndMinutes} min`);
            
            // Proveri da li se termini preklapaju
            if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
                console.log('PRONAĐENO PREKLAPANJE!');
                return `Nema dovoljno vremena za selektovane usluge. Termin se preklapa sa postojećim terminom u ${existingTime}`;
            }
        }
        
        console.log('Nema preklapanja');
        return null; // Nema preklapanja
    } catch (error) {
        console.error('Greška pri proveri preklapanja:', error);
        return null; // Ne blokiraj ako ne možemo da proverimo
    }
}

// ========================================
// POMOĆNE FUNKCIJE
// ========================================

// Funkcija za ažuriranje prikaza izabranih usluga
function updateSelectedServices() {
    const selectedServices = Array.from(document.querySelectorAll('input[name="service"]:checked'));
    const selectedServicesDiv = document.getElementById('selectedServices');
    const selectedServicesList = document.getElementById('selectedServicesList');
    const totalPriceDiv = document.getElementById('totalPrice');
    
    if (selectedServices.length === 0) {
        selectedServicesDiv.style.display = 'none';
        return;
    }
    
    selectedServicesDiv.style.display = 'block';
    
    let totalPrice = 0;
    let servicesHtml = '';
    
    selectedServices.forEach(checkbox => {
        const serviceName = checkbox.closest('.service-option').querySelector('.service-name').textContent;
        const price = parseInt(checkbox.dataset.price);
        const duration = parseInt(checkbox.dataset.duration) || getServiceDuration(checkbox.value);
        totalPrice += price;
        
        servicesHtml += `
            <div class="selected-service-item">
                <span class="service-name">${serviceName}</span>
                <span class="service-details">${duration}min - ${price} din</span>
            </div>
        `;
    });
    
    selectedServicesList.innerHTML = servicesHtml;
    totalPriceDiv.innerHTML = `<strong>Ukupno: ${totalPrice} din</strong>`;
}

function showMessage(message, isError = false) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
    messageDiv.style.display = 'block';
    
    // Sakrij poruku nakon 5 sekundi
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function showAppointmentCard(formData) {
    console.log('showAppointmentCard pozvana sa:', formData);
    
    // Format date
    const date = new Date(formData.date);
    const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
    const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
                       'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    // Format time
    const time = formData.time;
    const [hours, minutes] = time.split(':');
    const formattedTime = `${hours}:${minutes}`;
    
    // Format worker name
    const workerName = formData.worker === 'radnik1' ? 'Radnik 1' : 'Radnik 2';
    
    // Format service names - handle multiple services
    const serviceNames = {
        // NOKTI
        'manikir': 'Manikir',
        'lakiranje': 'Lakiranje',
        'urasli_nokat': 'Urasli nokat',
        'izlivanje_m': 'Izlivanje noktiju (M)',
        'izlivanje_l': 'Izlivanje noktiju (L)',
        'izlivanje_xl': 'Izlivanje noktiju (XL)',
        'ojacavanje_s': 'Ojačavanje (S)',
        'ojacavanje_m': 'Ojačavanje (M)',
        'ojacavanje_l': 'Ojačavanje (L)',
        'gel_lak_m': 'Gel lak (M)',
        'gel_lak_l': 'Gel lak (L)',
        'korekcija_s': 'Korekcija noktiju (S)',
        'korekcija_m': 'Korekcija noktiju (M)',
        'korekcija_l': 'Korekcija noktiju (L)',
        'korekcija_xl': 'Korekcija noktiju (XL)',
        'badem_korekcija': 'Badem nokti korekcija (L)',
        'skidanje_gela': 'Skidanje gela',
        'saranje_dva_nokta': 'Šaranje dva nokta',
        'medicinski_pedikir': 'Medicinski pedikir',
        'protetika_noznog_nokta': 'Protetika nožnog nokta',
        'pedikir': 'Pedikir',
        'kopca_noznog_nokta': 'Kopča nožnog nokta',
        'izlivanje_jednog_nokta': 'Izlivanje jednog nokta',
        
        // TRETMANI LICA
        'higijenski_tretman': 'Higijenski tretman',
        'mezoterapija_lica': 'Mezoterapija lica',
        'masaza_lica': 'Masaža lica 30min',
        'kraljevski_tretman': 'Kraljevski tretman',
        'parafin': 'Parafin',
        'solarijum': 'Solarijum (1min/40din)',
        'korektivna_sminka': 'Korektivna šminka',
        'sminka': 'Šminka',
        
        // DEPILACIJA
        'depilacija_prepona': 'Depilacija prepona',
        'depilacija_pola_nogu': 'Depilacija pola nogu',
        'depilacija_intime': 'Depilacija intime',
        'depilacija_celih_nogu': 'Depilacija celih nogu',
        'depilacija_dugih_nogu': 'Depilacija dugih nogu',
        'depilacija_ruku': 'Depilacija ruku',
        'depilacija_pazuha': 'Depilacija pazuha',
        'depilacija_stomaka': 'Depilacija stomaka',
        'nausnice': 'Nausnice',
        'obrve_depilacija': 'Obrve',
        
        // MASAŽE
        'relax_masaza': 'Relax masaža',
        'anticelulit_masaza': 'Anticelulit masaža-vakum',
        
        // OBRVE
        'puder_obrve': 'Puder obrve',
        'japanske_obrve': 'Japanske obrve',
        'korekcija_puder_obrve': 'Korekcija puder obrve',
        'osvezavanje_japanskih_obrva': 'Osvežavanje japanskih obrva'
    };
    
    // Handle multiple services
    let serviceName;
    if (formData.services && formData.services.length > 0) {
        // New format with multiple services
        const serviceNamesList = formData.services.map(service => 
            serviceNames[service.value] || service.name
        );
        serviceName = serviceNamesList.join(', ');
    } else {
        // Backward compatibility with single service
        serviceName = serviceNames[formData.service] || formData.service;
    }
    
    // Create appointment data
    const appointmentData = {
        id: Date.now(),
        date: `${dayName}, ${day}. ${month} ${year}`,
        time: formattedTime,
        worker: workerName,
        service: serviceName,
        notes: formData.notes || '',
        createdAt: new Date().toISOString(),
        // Dodaj originalne podatke za brisanje iz Supabase (ISO format)
        originalDate: formData.date, // Format: "2025-10-01"
        originalTime: formData.time  // Format: "14:30"
    };
    
    console.log('Kreiran appointmentData:', appointmentData);
    
    // Save to localStorage
    saveAppointmentToStorage(appointmentData);
    
    // Create and display card
    createAppointmentCard(appointmentData);
    
    console.log('Kartica kreirana i prikazana');
}

function saveAppointmentToStorage(appointmentData) {
    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.unshift(appointmentData); // Add to beginning
    localStorage.setItem('appointments', JSON.stringify(appointments));
}

function loadAppointmentsFromStorage() {
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const container = document.getElementById('appointmentCardsContainer');
    
    if (appointments.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = '';
    
    appointments.forEach(appointment => {
        createAppointmentCard(appointment);
    });
}

function createAppointmentCard(appointmentData) {
    const container = document.getElementById('appointmentCardsContainer');
    
    // Ensure container is visible
    container.style.display = 'block';
    
    const card = document.createElement('div');
    card.className = 'appointment-card';
    card.dataset.appointmentId = appointmentData.id;
    
    const notesHtml = appointmentData.notes ? 
        `<div class="appointment-detail appointment-notes">
            <div class="detail-label">Napomena</div>
            <div class="detail-value">${appointmentData.notes}</div>
        </div>` : '';
    
    card.innerHTML = `
        <div class="appointment-card-header">
            <h3>Vaš zakazani termin</h3>
            <div class="appointment-card-actions">
                <button class="cancel-appointment-btn" data-appointment-id="${appointmentData.id}">
                    Otkaži termin
                </button>
                <div class="appointment-status">Potvrđen</div>
            </div>
        </div>
        <div class="appointment-card-content">
            <div class="appointment-detail">
                <div class="detail-label">Datum</div>
                <div class="detail-value">${appointmentData.date}</div>
            </div>
            <div class="appointment-detail">
                <div class="detail-label">Vreme</div>
                <div class="detail-value">${appointmentData.time}</div>
            </div>
            <div class="appointment-detail">
                <div class="detail-label">Radnik</div>
                <div class="detail-value">${appointmentData.worker}</div>
            </div>
            <div class="appointment-detail">
                <div class="detail-label">Usluga</div>
                <div class="detail-value">${appointmentData.service}</div>
            </div>
            ${notesHtml}
        </div>
    `;
    
    // Add to beginning of container
    container.insertBefore(card, container.firstChild);
    
    // Add event listeners for cancel button (click and touch)
    const cancelBtn = card.querySelector('.cancel-appointment-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            const appointmentId = e.target.dataset.appointmentId;
            if (appointmentId) {
                cancelAppointment(appointmentId);
            }
        });
        
        // Touch event za mobilne uređaje
        cancelBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            const appointmentId = e.target.dataset.appointmentId;
            if (appointmentId) {
                cancelAppointment(appointmentId);
            }
        });
    }
    
    // Scroll to the new card
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Funkcija za otkazivanje termina
async function cancelAppointment(appointmentId) {
    if (!confirm('Da li ste sigurni da želite da otkažete ovaj termin?')) {
        return;
    }
    
    try {
        // Uzmi email trenutnog korisnika
        const { data: { user } } = await supabaseClient.auth.getUser();
        const userEmail = user?.email;
        
        if (!userEmail) {
            showMessage('Greška: Korisnik nije autentifikovan.', true);
            return;
        }
        
        // Pronađi termin u localStorage da dobijemo podatke
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const appointmentToDelete = appointments.find(apt => apt.id === appointmentId);
        
        if (!appointmentToDelete) {
            showMessage('Termin nije pronađen.', true);
            return;
        }
        
        // Briši iz Supabase (samo svoj termin)
        const originalDate = appointmentToDelete.originalDate || appointmentToDelete.date;
        const originalTime = appointmentToDelete.originalTime || appointmentToDelete.time;
        
        console.log('Brišem termin:', {
            email: userEmail,
            originalDate: originalDate,
            originalTime: originalTime,
            appointmentToDelete: appointmentToDelete
        });
        
        // Proveri da li je originalDate u ISO formatu
        if (originalDate && originalDate.includes(',')) {
            console.error('Greška: originalDate nije u ISO formatu:', originalDate);
            console.log('Pokušavam da konvertujem format...');
            
            // Pokušaj da konvertuješ formatiran string u ISO format
            try {
                console.log('Originalni datum za konverziju:', originalDate);
                
                // Ručna konverzija srpskog formata u ISO
                const isoDate = convertSerbianDateToISO(originalDate);
                console.log('Konvertovan datum:', isoDate);
                
                if (!isoDate) {
                    console.error('Neuspešna konverzija datuma');
                    showMessage('Greška: Format datuma nije ispravan.', true);
                    return;
                }
                
                // Koristi konvertovan datum
                const convertedOriginalDate = isoDate;
                const convertedOriginalTime = originalTime;
                
                console.log('Koristim konvertovane podatke:', {
                    convertedOriginalDate,
                    convertedOriginalTime,
                    userEmail
                });
                
                // Pokušaj ponovo sa konvertovanim datumom
                const { data: existingAppointments, error: selectError } = await supabaseClient
                    .from('appointments')
                    .select('*')
                    .eq('email', userEmail)
                    .eq('appointment_date', convertedOriginalDate)
                    .eq('appointment_time', convertedOriginalTime);
                
                if (selectError) {
                    console.error('Greška pri proveri termina sa konvertovanim datumom:', selectError);
                    showMessage(`Greška pri proveri termina: ${selectError.message}`, true);
                    return;
                }
                
                console.log('Pronađeni termini sa konvertovanim datumom:', existingAppointments);
                
                if (!existingAppointments || existingAppointments.length === 0) {
                    console.log('Termin nije pronađen u bazi sa konvertovanim datumom, brišem samo iz localStorage');
                } else {
                    // Briši iz Supabase sa konvertovanim datumom
                    const { error } = await supabaseClient
                        .from('appointments')
                        .delete()
                        .eq('email', userEmail)
                        .eq('appointment_date', convertedOriginalDate)
                        .eq('appointment_time', convertedOriginalTime);
                    
                    if (error) {
                        console.error('Greška pri brisanju iz Supabase sa konvertovanim datumom:', error);
                        showMessage(`Greška pri brisanju termina: ${error.message}`, true);
                        return;
                    }
                    
                    console.log('Termin uspešno obrisan iz Supabase sa konvertovanim datumom');
                }
                
            } catch (conversionError) {
                console.error('Greška pri konverziji datuma:', conversionError);
                showMessage('Greška: Format datuma nije ispravan.', true);
                return;
            }
        } else {
            // Originalni kod za ISO format
            const { data: existingAppointments, error: selectError } = await supabaseClient
                .from('appointments')
                .select('*')
                .eq('email', userEmail)
                .eq('appointment_date', originalDate)
                .eq('appointment_time', originalTime);
            
            if (selectError) {
                console.error('Greška pri proveri termina:', selectError);
                showMessage(`Greška pri proveri termina: ${selectError.message}`, true);
                return;
            }
            
            console.log('Pronađeni termini:', existingAppointments);
            
            if (!existingAppointments || existingAppointments.length === 0) {
                console.log('Termin nije pronađen u bazi, brišem samo iz localStorage');
            } else {
                // Briši iz Supabase
                const { error } = await supabaseClient
                    .from('appointments')
                    .delete()
                    .eq('email', userEmail)
                    .eq('appointment_date', originalDate)
                    .eq('appointment_time', originalTime);
                
                if (error) {
                    console.error('Greška pri brisanju iz Supabase:', error);
                    console.error('Error details:', error.message, error.details, error.hint);
                    showMessage(`Greška pri brisanju termina: ${error.message}`, true);
                    return;
                }
                
                console.log('Termin uspešno obrisan iz Supabase');
            }
        }
        
        // Ukloni iz localStorage
        const updatedAppointments = appointments.filter(apt => apt.id !== appointmentId);
        localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
        
        // Ukloni karticu iz DOM-a
        const card = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
        if (card) {
            card.remove();
        }
        
        // Proveri da li ima još kartica
        const container = document.getElementById('appointmentCardsContainer');
        if (container.children.length === 0) {
            container.style.display = 'none';
        }
        
        showMessage('Termin je uspešno otkazan!', false);
        
    } catch (error) {
        console.error('Greška pri otkazivanju termina:', error);
        showMessage('Greška pri otkazivanju termina.', true);
    }
}

// Funkcija za konverziju srpskog formata datuma u ISO
function convertSerbianDateToISO(serbianDate) {
    try {
        console.log('Konvertujem srpski datum:', serbianDate);
        
        // Mapa srpskih naziva meseci
        const monthMap = {
            'januar': '01', 'februar': '02', 'mart': '03', 'april': '04',
            'maj': '05', 'jun': '06', 'jul': '07', 'avgust': '08',
            'septembar': '09', 'oktobar': '10', 'novembar': '11', 'decembar': '12'
        };
        
        // Parsiraj format: "Sreda, 1. Oktobar 2025"
        const parts = serbianDate.split(', ');
        if (parts.length !== 2) {
            console.error('Neispravan format datuma:', serbianDate);
            return null;
        }
        
        const datePart = parts[1]; // "1. Oktobar 2025"
        const dateParts = datePart.split(' ');
        
        if (dateParts.length !== 3) {
            console.error('Neispravan format datuma:', serbianDate);
            return null;
        }
        
        const day = dateParts[0].replace('.', ''); // "1"
        const monthName = dateParts[1].toLowerCase(); // "oktobar"
        const year = dateParts[2]; // "2025"
        
        const month = monthMap[monthName];
        if (!month) {
            console.error('Nepoznat mesec:', monthName);
            return null;
        }
        
        const isoDate = `${year}-${month}-${day.padStart(2, '0')}`;
        console.log('Konvertovan ISO datum:', isoDate);
        
        return isoDate;
        
    } catch (error) {
        console.error('Greška pri konverziji datuma:', error);
        return null;
    }
}

// Funkcija za određivanje trajanja usluge
function getServiceDuration(service) {
    const durations = {
        // NOKTI
        'manikir': 30,
        'lakiranje': 30,
        'urasli_nokat': 30,
        'izlivanje_m': 75,
        'izlivanje_l': 75,
        'izlivanje_xl': 90,
        'ojacavanje_s': 45,
        'ojacavanje_m': 60,
        'ojacavanje_l': 60,
        'gel_lak_m': 45,
        'gel_lak_l': 45,
        'korekcija_noktiju_s': 45,
        'korekcija_noktiju_m': 45,
        'korekcija_noktiju_l': 60,
        'korekcija_noktiju_xl': 75,
        'badem_nokti_korekcija': 75,
        'skidanje_gela': 30,
        'saranje_dva_nokta': 15,
        'medicinski_pedikir': 60,
        'protetika_noznog_nokta': 30,
        'pedikir': 60,
        'kopca_noznog_nokta': 60,
        'izlivanje_jednog_nokta': 15,
        
        // TRETMANI LICA
        'higijenski_tretman': 75,
        'mezoterapija_lica': 60,
        'masaza_lica': 45,
        'kraljevski_tretman': 90,
        'parafin': 30,
        'korektivna_sminka': 30,
        'sminka': 60,
        
        // DEPILACIJA
        'depilacija_prepona': 15,
        'depilacija_pola_nogu': 15,
        'depilacija_intime': 15,
        'depilacija_celih_nogu_1': 30,
        'depilacija_celih_nogu_2': 30,
        'depilacija_ruku': 15,
        'depilacija_pazuha': 15,
        'depilacija_stomaka': 15,
        'nausnice': 15,
        'obrve_depilacija': 15,
        
        // MASAŽE
        'relax_masaza': 45,
        'anticelulit_masaza': 75,
        
        // OBRVE
        'puder_obrve': 120,
        'japanske_obrve': 120,
        'korekcija_puder_obrve': 75,
        'osvezavanje_japanskih_obrva': 75,
        
        // ADMIN OBAVEZE
        'obaveza': 30 // Default trajanje za admin obaveze - promenljivo iz baze
    };
    return durations[service] || 15; // Default 15 minuta ako usluga nije pronađena
}

// Funkcija za generisanje blokiranih vremena (kao u admin kodu)
function generateBlockedTimes(startTime, durationMinutes) {
    console.log(`Generišem blokirana vremena za ${startTime} sa trajanjem ${durationMinutes} min`);
    
    const blockedTimes = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    
    // Konvertujemo početno vreme u minute
    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = currentMinutes + durationMinutes;
    
    console.log(`Blokirana vremena od ${startTime} (${currentMinutes} min) do ${endMinutes} min`);
    console.log(`Početno vreme: ${startTime} = ${currentMinutes} minuta`);
    console.log(`Krajnje vreme: ${endMinutes} minuta = ${Math.floor(endMinutes/60)}:${(endMinutes%60).toString().padStart(2, '0')}`);
    
    // Generišemo blokirana vremena u 15-minutnim intervalima
    while (currentMinutes <= endMinutes) { // Changed to <= endMinutes to include end time
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        blockedTimes.push(timeString);
        console.log(`Dodajem blokirano vreme: ${timeString} (${currentMinutes} min)`);
        currentMinutes += 15; // 15-minutni intervali
    }
    
    console.log(`Ukupno blokiranih vremena: ${blockedTimes.length}`);
    return blockedTimes;
}

// Funkcija za preview blocking na osnovu trajanja usluge
function previewServiceBlocking(timeSlots, serviceDuration) {
    console.log(`=== PREVIEW SERVICE BLOCKING POZIVANA ===`);
    console.log(`previewServiceBlocking pozvana sa ${timeSlots.length} slotova, trajanje: ${serviceDuration}min`);
    
    // Remove existing preview classes
    timeSlots.forEach(slot => {
        slot.classList.remove('preview-blocked');
    });
    
    let blockedCount = 0;
    
    // Find all busy times and sort them
    const busyTimes = [];
    timeSlots.forEach(slot => {
        if (slot.classList.contains('busy')) {
            busyTimes.push(slot.getAttribute('data-time'));
        }
    });
    busyTimes.sort();
    
    console.log('Zauzeta vremena (sortirana):', busyTimes);
    
    // Add preview blocking for each time slot based on service duration
    timeSlots.forEach(slot => {
        if (!slot.classList.contains('busy') && !slot.classList.contains('disabled')) {
            const timeValue = slot.getAttribute('data-time');
            const [startHour, startMinute] = timeValue.split(':').map(Number);
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = startMinutes + serviceDuration;
            const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
            
            // Find busy times that would conflict - block if service would end AT busy time or later
            let wouldConflict = false;
            for (const busyTime of busyTimes) {
                const [busyHour, busyMinute] = busyTime.split(':').map(Number);
                const busyMinutes = busyHour * 60 + busyMinute;
                
                // Block if our service would end AFTER busy time starts (not at busy time)
                if (endMinutes > busyMinutes) {
                    // Check if there's any overlap (start before busy time)
                    if (startMinutes < busyMinutes) {
                        wouldConflict = true;
                        console.log(`Preview blocking ${timeValue} - service would end at ${endTime}, conflicts with busy time at ${busyTime}`);
                        break; // Only conflict with the first busy time
                    }
                }
            }
            
            if (wouldConflict) {
                slot.classList.add('preview-blocked');
                blockedCount++;
            }
        }
    });
    
    console.log(`Preview blocking završeno - blokirano ${blockedCount} slotova`);
}

// Funkcija za proveru da li bi usluga došla do kraja radnog vremena
function wouldConflictWithDuration(startTime, durationMinutes) {
    // Proverava da li bi usluga sa datim trajanjem došla do kraja radnog vremena
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + durationMinutes;
    
    // Pretpostavimo da radno vreme traje do 17:00 (1020 minuta)
    const workEndMinutes = 17 * 60; // 17:00 = 1020 minuta
    
    const wouldConflict = endMinutes > workEndMinutes;
    console.log(`Provera konflikta za ${startTime} (${durationMinutes}min): ${startMinutes} + ${durationMinutes} = ${endMinutes} > ${workEndMinutes} = ${wouldConflict}`);
    
    return wouldConflict;
}

// Swipe funkcionalnost za kalendare
function addSwipeNavigation(element, onSwipeLeft, onSwipeRight) {
    let startX = 0;
    let startY = 0;
    let isSwipe = false;
    
    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwipe = false;
    }, { passive: true });
    
    element.addEventListener('touchmove', (e) => {
        if (!startX || !startY) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const diffX = startX - currentX;
        const diffY = startY - currentY;
        
        // Proverava da li je horizontalni swipe (više od 50px horizontalno i manje od 100px vertikalno)
        if (Math.abs(diffX) > 50 && Math.abs(diffY) < 100) {
            isSwipe = true;
            e.preventDefault(); // Sprečava scroll dok se swipe
        }
    }, { passive: false });
    
    element.addEventListener('touchend', (e) => {
        if (!isSwipe || !startX || !startY) return;
        
        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;
        
        // Swipe levo (sledeći mesec)
        if (diffX > 50) {
            onSwipeRight();
        }
        // Swipe desno (prethodni mesec)
        else if (diffX < -50) {
            onSwipeLeft();
        }
        
        startX = 0;
        startY = 0;
        isSwipe = false;
    }, { passive: true });
}

// ========================================
// KALENDAR FUNKCIONALNOST
// ========================================

// Kalendar varijable
let currentDate = new Date();
let selectedDate = null;

// DOM elementi za kalendar
const dateInput = document.getElementById('date');
const calendar = document.getElementById('calendar');
const monthYear = document.getElementById('monthYear');
const calendarDates = document.getElementById('calendarDates');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

// Inicijalizacija kalendara
function initCalendar() {
    if (!dateInput || !calendar || !monthYear || !calendarDates) {
        console.error('Kalendar elementi nisu pronađeni');
        return;
    }
    
    // Event listener za date input (click i touch)
    dateInput.addEventListener('click', (e) => {
        console.log('Date input kliknut');
        console.log('Date input disabled:', dateInput.disabled);
        console.log('Date input readonly:', dateInput.readOnly);
        
        // Proveri da li je radnik izabran
        const selectedWorker = document.querySelector('input[name="worker"]:checked');
        console.log('Pronađen radnik:', selectedWorker);
        if (!selectedWorker) {
            console.log('Nema izabranog radnika, prikazujem poruku');
            showMessage('Molimo prvo izaberite radnika.', true);
            return;
        }
        
        console.log('Radnik je izabran, otvaram kalendar');
        calendar.style.display = calendar.style.display === 'none' ? 'block' : 'none';
        if (calendar.style.display === 'block') {
            renderCalendar();
        }
    });
    
    // Event listeneri za navigaciju
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
        
        // Touch event za mobilne uređaje
        prevMonthBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
        
        // Touch event za mobilne uređaje
        nextMonthBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Swipe funkcionalnost za mobilne uređaje
    addSwipeNavigation(calendar, () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    }, () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Event listener za zatvaranje kalendara kada se klikne van njega
    document.addEventListener('click', (e) => {
        if (!dateInput.contains(e.target) && !calendar.contains(e.target)) {
            calendar.style.display = 'none';
        }
    });
}

// Renderovanje kalendara
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Postavi mesec i godinu
    monthYear.textContent = `${getMonthName(month)} ${year}`;
    
    // Dobij prvi dan meseca i broj dana u mesecu
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Generiši HTML za datume
    let html = '';
    
    // Prazna polja za dane pre početka meseca
    for (let i = 0; i < startingDay; i++) {
        html += '<div class="calendar-date empty"></div>';
    }
    
    // Datumi u mesecu
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = isSameDate(date, new Date());
        const isSelected = selectedDate && isSameDate(date, selectedDate);
        const isPast = date < new Date().setHours(0, 0, 0, 0);
        
        let classes = 'calendar-date';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (isPast) classes += ' past';
        
        html += `<div class="${classes}" data-date="${formatDate(date)}">${day}</div>`;
    }
    
    calendarDates.innerHTML = html;
    
    // Event listeneri za datume (samo za buduće datume)
    const dateElements = calendarDates.querySelectorAll('.calendar-date:not(.empty):not(.past)');
    dateElements.forEach(element => {
        element.addEventListener('click', () => {
            const dateStr = element.dataset.date;
            // Kreiraj datum bez timezone problema
            const [year, month, day] = dateStr.split('-').map(Number);
            selectedDate = new Date(year, month - 1, day);
            dateInput.value = formatDate(selectedDate);
            calendar.style.display = 'none';
            
            // Ukloni prethodni selected
            dateElements.forEach(el => el.classList.remove('selected'));
            // Dodaj selected na trenutni
            element.classList.add('selected');
        });
        
        // Touch event za mobilne uređaje
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            const dateStr = element.dataset.date;
            // Kreiraj datum bez timezone problema
            const [year, month, day] = dateStr.split('-').map(Number);
            selectedDate = new Date(year, month - 1, day);
            dateInput.value = formatDate(selectedDate);
            calendar.style.display = 'none';
            
            // Ukloni prethodni selected
            dateElements.forEach(el => el.classList.remove('selected'));
            // Dodaj selected na trenutni
            element.classList.add('selected');
        });
    });
}

// Pomoćne funkcije
function getMonthName(month) {
    const months = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 
                   'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
    return months[month];
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isSameDate(date1, date2) {
    return date1.toDateString() === date2.toDateString();
}

// ========================================
// TIME PICKER FUNKCIONALNOST
// ========================================

// DOM elementi za time picker
const timeInput = document.getElementById('time');
const timePicker = document.getElementById('timePicker');
const selectedDateDisplay = document.getElementById('selectedDateDisplay');

// Inicijalizacija time picker-a
function initTimePicker() {
    if (!timeInput || !timePicker || !selectedDateDisplay) {
        console.error('Time picker elementi nisu pronađeni');
        return;
    }
    
    // Event listener za time input (click i touch)
    timeInput.addEventListener('click', async () => {
        console.log('Time input kliknut');
        console.log('dateInput.value:', dateInput.value);
        console.log('selectedDate:', selectedDate);
        
        // Proveri da li je radnik izabran
        const selectedWorker = document.querySelector('input[name="worker"]:checked');
        if (!selectedWorker) {
            showMessage('Molimo prvo izaberite radnika.', true);
            return;
        }
        
        if (!dateInput.value) {
            alert('Molimo prvo izaberite datum');
            return;
        }
        
        // Postavi datum u time picker header
        selectedDateDisplay.textContent = formatDateForDisplay(selectedDate);
        
        // Učitaj zauzete termine za izabrani datum
        console.log('Pozivam loadBookedTimes...');
        await loadBookedTimes();
        
        timePicker.style.display = timePicker.style.display === 'none' ? 'block' : 'none';
        console.log('Time picker display:', timePicker.style.display);
    });
    
    // Event listeneri za time slot-ove
    const timeSlots = timePicker.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            // Proveri da li je termin zauzet ili blokiran zbog trajanja
            if (slot.classList.contains('busy')) {
                alert('Ovaj termin je već zauzet');
                return;
            }
            
            if (slot.classList.contains('preview-blocked')) {
                alert('Ovaj termin ne može da se izabere zbog trajanja usluge');
                return;
            }
            
            const time = slot.dataset.time;
            timeInput.value = time;
            timePicker.style.display = 'none';
            
            // Ukloni prethodni selected
            timeSlots.forEach(s => s.classList.remove('selected'));
            // Dodaj selected na trenutni
            slot.classList.add('selected');
        });
        
        // Touch event za mobilne uređaje
        slot.addEventListener('touchend', (e) => {
            e.preventDefault();
            // Proveri da li je termin zauzet ili blokiran zbog trajanja
            if (slot.classList.contains('busy')) {
                alert('Ovaj termin je već zauzet');
                return;
            }
            
            if (slot.classList.contains('preview-blocked')) {
                alert('Ovaj termin ne može da se izabere zbog trajanja usluge');
                return;
            }
            
            const time = slot.dataset.time;
            timeInput.value = time;
            timePicker.style.display = 'none';
            
            // Ukloni prethodni selected
            timeSlots.forEach(s => s.classList.remove('selected'));
            // Dodaj selected na trenutni
            slot.classList.add('selected');
        });
    });
    
    // Event listener za zatvaranje time picker-a kada se klikne van njega
    document.addEventListener('click', (e) => {
        if (!timeInput.contains(e.target) && !timePicker.contains(e.target)) {
            timePicker.style.display = 'none';
        }
    });
    
    // Event listener za promenu usluga
    const serviceCheckboxes = document.querySelectorAll('input[name="service"]');
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateSelectedServices();
            // Ažuriraj preview blocking ako je time picker otvoren
            if (timePicker.style.display === 'block' && selectedDate) {
                const selectedServices = Array.from(document.querySelectorAll('input[name="service"]:checked'));
                const totalDuration = selectedServices.reduce((total, checkbox) => {
                    const duration = parseInt(checkbox.dataset.duration) || getServiceDuration(checkbox.value);
                    return total + duration;
                }, 0);
                const timeSlots = timePicker.querySelectorAll('.time-slot');
                previewServiceBlocking(timeSlots, totalDuration);
            }
        });
    });
}

// Učitavanje zauzetih termina za izabrani datum
async function loadBookedTimes() {
    if (!selectedDate) {
        console.log('Nema izabranog datuma');
        return;
    }
    
    // Get selected worker
    const selectedWorker = document.querySelector('input[name="worker"]:checked')?.value;
    if (!selectedWorker) {
        console.log('Nema izabranog radnika');
        return;
    }
    
    try {
        const dateStr = formatDate(selectedDate);
        console.log('Učitavam termine za datum:', dateStr, 'radnik:', selectedWorker);
        console.log('selectedDate:', selectedDate);
        
        const { data: appointments, error } = await supabaseClient
            .from('appointments')
            .select('appointment_time, service, worker, duration')
            .eq('appointment_date', dateStr)
            .eq('worker', selectedWorker);
        
        if (error) {
            console.error('Greška pri učitavanju termina:', error);
            return;
        }
        
        console.log('Zauzeti termini za radnika:', appointments);
        console.log('timePicker element:', timePicker);
        
        // Debug: Proveri duration za svaki termin
        if (appointments && appointments.length > 0) {
            appointments.forEach(appointment => {
                const duration = appointment.duration || getServiceDuration(appointment.service);
                console.log(`Termin ${appointment.appointment_time}: service=${appointment.service}, duration=${duration}min (${appointment.duration ? 'iz baze' : 'iz funkcije'}), worker=${appointment.worker}`);
            });
        }
        
        // Resetuj sve time slot-ove
        const timeSlots = timePicker.querySelectorAll('.time-slot');
        console.log('Pronađeno time slot-ova:', timeSlots.length);
        
        timeSlots.forEach(slot => {
            slot.classList.remove('busy', 'selected');
        });
        
        // Označi zauzete termine koristeći istu logiku kao admin
        if (appointments && appointments.length > 0) {
            const allBlockedTimes = [];
            
            // Grupiši termine po vremenu (više usluga može biti u istom terminu)
            const appointmentsByTime = {};
            appointments.forEach(appointment => {
                const timeWithoutSeconds = appointment.appointment_time.substring(0, 5);
                if (!appointmentsByTime[timeWithoutSeconds]) {
                    appointmentsByTime[timeWithoutSeconds] = [];
                }
                appointmentsByTime[timeWithoutSeconds].push(appointment);
            });
            
            // Za svaki termin, izračunaj ukupno trajanje svih usluga
            Object.keys(appointmentsByTime).forEach(time => {
                const appointmentsAtTime = appointmentsByTime[time];
                console.log('Obrađujem termin:', time, 'sa', appointmentsAtTime.length, 'usluga');
                
                // Izračunaj ukupno trajanje za sve usluge u ovom terminu
                const totalDuration = appointmentsAtTime.reduce((total, appointment) => {
                    // Koristi duration iz baze ako postoji, inače getServiceDuration
                    const duration = appointment.duration || getServiceDuration(appointment.service);
                    console.log('Usluga:', appointment.service, 'Trajanje:', duration, 'min (', appointment.duration ? 'iz baze' : 'iz funkcije', ')');
                    return total + duration;
                }, 0);
                
                console.log('Ukupno trajanje za termin', time, ':', totalDuration, 'min');
                
                // Generiši blokirana vremena
                const blockedTimes = generateBlockedTimes(time, totalDuration);
                allBlockedTimes.push(...blockedTimes);
            });
            
            // Ukloni duplikate
            const uniqueBlockedTimes = [...new Set(allBlockedTimes)];
            console.log('Sva blokirana vremena:', uniqueBlockedTimes);
            
            // Označi time slot-ove kao zauzete
            timeSlots.forEach(slot => {
                const timeValue = slot.getAttribute('data-time');
                if (uniqueBlockedTimes.includes(timeValue)) {
                    slot.classList.add('busy');
                    console.log('Označen kao zauzet:', timeValue);
                } else {
                    slot.classList.remove('busy');
                }
            });
        } else {
            console.log('Nema zauzetih termina za ovaj datum i radnika');
        }
        
        // Dodaj preview blocking za trenutno selektovane usluge
        const selectedServices = Array.from(document.querySelectorAll('input[name="service"]:checked'));
        if (selectedServices.length > 0) {
            const totalDuration = selectedServices.reduce((total, checkbox) => {
                const duration = parseInt(checkbox.dataset.duration) || getServiceDuration(checkbox.value);
                return total + duration;
            }, 0);
            previewServiceBlocking(timeSlots, totalDuration);
        }
        
    } catch (error) {
        console.error('Greška pri učitavanju termina:', error);
    }
}

// Formatiranje datuma za prikaz
function formatDateForDisplay(date) {
    if (!date) return '';
    const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
    const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 
                       'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day}. ${month} ${year}`;
}

// ========================================
// INICIJALIZACIJA
// ========================================

// ========================================
// WORKER SELECTION FUNCTIONALITY
// ========================================

function initWorkerSelection() {
    console.log('initWorkerSelection pozvana');
    const workerCards = document.querySelectorAll('.worker-card');
    const workerRadios = document.querySelectorAll('input[name="worker"]');
    
    console.log('Pronađeno worker kartica:', workerCards.length);
    console.log('Pronađeno worker radio dugmadi:', workerRadios.length);
    
    // Add click and touch event listeners to worker cards
    workerCards.forEach((card, index) => {
        console.log(`Dodajem event listener za worker karticu ${index + 1}`);
        card.addEventListener('click', () => {
            console.log(`Worker kartica ${index + 1} kliknuta`);
            const radio = card.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                console.log('Radio button označen:', radio.value);
                updateWorkerCardSelection();
                
                // Omogući date i time input
                const dateInput = document.getElementById('date');
                const timeInput = document.getElementById('time');
                if (dateInput) {
                    dateInput.disabled = false;
                    dateInput.placeholder = 'Kliknite da izaberete datum';
                    console.log('Date input omogućen');
                }
                if (timeInput) {
                    timeInput.disabled = false;
                    timeInput.placeholder = 'Izaberite datum pa zatim vreme';
                    console.log('Time input omogućen');
                }
                
                // Reload booked times when worker changes
                if (selectedDate) {
                    loadBookedTimes();
                }
            }
        });
        
        // Touch event za mobilne uređaje
        card.addEventListener('touchend', (e) => {
            e.preventDefault();
            console.log(`Worker kartica ${index + 1} touch`);
            const radio = card.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                console.log('Radio button označen (touch):', radio.value);
                updateWorkerCardSelection();
                
                // Omogući date i time input
                const dateInput = document.getElementById('date');
                const timeInput = document.getElementById('time');
                if (dateInput) {
                    dateInput.disabled = false;
                    dateInput.placeholder = 'Kliknite da izaberete datum';
                    console.log('Date input omogućen (touch)');
                }
                if (timeInput) {
                    timeInput.disabled = false;
                    timeInput.placeholder = 'Izaberite datum pa zatim vreme';
                    console.log('Time input omogućen (touch)');
                }
                
                // Reload booked times when worker changes
                if (selectedDate) {
                    loadBookedTimes();
                }
            }
        });
    });
    
    // Add change event listeners to radio buttons
    workerRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateWorkerCardSelection();
            
            // Omogući date i time input
            const dateInput = document.getElementById('date');
            const timeInput = document.getElementById('time');
            if (dateInput) {
                dateInput.disabled = false;
                dateInput.placeholder = 'Kliknite da izaberete datum';
            }
            if (timeInput) {
                timeInput.disabled = false;
                timeInput.placeholder = 'Izaberite datum pa zatim vreme';
            }
            
            // Reload booked times when worker changes
            if (selectedDate) {
                loadBookedTimes();
            }
        });
    });
}

function updateWorkerCardSelection() {
    const workerCards = document.querySelectorAll('.worker-card');
    const selectedRadio = document.querySelector('input[name="worker"]:checked');
    
    workerCards.forEach(card => {
        card.classList.remove('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio && radio.checked) {
            card.classList.add('selected');
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Appointment stranica učitana');
    
    // Inicijalizacija Supabase klijenta
    const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://mwapsdsomjjviogysbov.supabase.co';
    const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YXBzZHNvbWpqdmlvZ3lzYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTM0MzYsImV4cCI6MjA3MjMyOTQzNn0.N5AFDfF5y6ngrXDXsQHRWb6xbccpOf3C5r5w10Uwjss';
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase klijent inicijalizovan:', supabaseClient);
    
    // Proveri da li postoji aktivna sesija
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    console.log('Initial session check:', session);
    
    if (sessionError) {
        console.error('Session error on page load:', sessionError);
    }
    
    if (!session) {
        console.log('No active session found, redirecting to login...');
        window.location.href = 'index.html';
        return;
    }
    
    // Inicijalizacija kalendara
    initCalendar();
    
    // Inicijalizacija time picker-a
    initTimePicker();
    
    // Inicijalizacija worker selection
    initWorkerSelection();
    
    // Učitaj postojeće kartice
    loadAppointmentsFromStorage();
    
    // Automatsko fokusiranje na prvo polje
    const serviceField = document.getElementById('service');
    if (serviceField) {
        serviceField.focus();
    }
});
