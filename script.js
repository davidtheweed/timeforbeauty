// ========================================
// KONFIGURACIJA SUPABASE
// ========================================
// Koristi config.js za sigurniju konfiguraciju
const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://mwapsdsomjjviogysbov.supabase.co';
const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YXBzZHNvbWpqdmlvZ3lzYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTM0MzYsImV4cCI6MjA3MjMyOTQzNn0.N5AFDfF5y6ngrXDXsQHRWb6xbccpOf3C5r5w10Uwjss';

// ========================================
// SUPABASE KLIJENT (inicijalizuje se u DOMContentLoaded)
// ========================================
let supabaseClient;

// ========================================
// ADMIN KONFIGURACIJA
// ========================================
// Hardkodovani kredencijali uklonjeni - sada koristimo Supabase Auth

// ========================================
// GLOBALNE VARIJABLE
// ========================================
let isAdminLoggedIn = false;

// ========================================
// DOM ELEMENTI
// ========================================
const form = document.getElementById('appointmentForm');
const submitBtn = document.querySelector('.submit-btn');
const btnText = document.querySelector('.btn-text');
const btnLoading = document.querySelector('.btn-loading');
const messageDiv = document.getElementById('message');

// Admin elementi
let adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginModal = document.getElementById('adminLoginModal');
const adminLoginForm = document.getElementById('adminLoginForm');
const closeLoginModal = document.getElementById('closeLoginModal');
const mainContainer = document.getElementById('mainContainer');

// ========================================
// ADMIN PLANNER FUNKCIONALNOSTI
// ========================================

// Planner varijable
let plannerTasks = [];
let currentPlannerDate = new Date();
let selectedDate = new Date(); // Trenutno selektovani datum
let aktivniDatum = new Date(); // Aktivni datum za prikaz
let aktivniDatumIndeks = 0; // Indeks aktivnog datuma u nizu
let datumiNiz = []; // Niz svih datuma za prikaz
let prikazaniDatumi = []; // Niz od 4 prikazana datuma
let prikazaniIndeks = 0; // Indeks početnog datuma u prikazanim datumima
let hoverIndeks = 0; // Indeks dana sa hover efektom (samo vizuelno)
let aktivniIndeks = 0; // Indeks aktivnog datuma (za navigaciju)

// Separate calendar variables for each worker
let currentPlannerDate1 = new Date();
let currentPlannerDate2 = new Date();
let aktivniDatum1 = new Date();
let aktivniDatum2 = new Date();

// Planner elementi
const adminPlanner = document.getElementById('adminPlanner');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const closeTaskModal = document.getElementById('closeTaskModal');
const taskModalTitle = document.getElementById('taskModalTitle');

// Edit modal elementi
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeEditModal = document.getElementById('closeEditModal');
const editModalTitle = document.getElementById('editModalTitle');
// const currentMonth = document.getElementById('currentMonth'); // Uklonjen
// const prevMonthBtn = document.getElementById('prevMonthBtn'); // Uklonjen
// const nextMonthBtn = document.getElementById('nextMonthBtn'); // Uklonjen
// const daysNavigation = document.getElementById('daysNavigation'); // Uklonjen - zamenjen kalendarom
// Dual planner elementi
const selectedDayTitle1 = document.getElementById('selectedDayTitle1');
const selectedDateDisplay1 = document.getElementById('selectedDateDisplay1');
const tasksContainer1 = document.getElementById('tasksContainer1');
const selectedDayTitle2 = document.getElementById('selectedDayTitle2');
const selectedDateDisplay2 = document.getElementById('selectedDateDisplay2');
const tasksContainer2 = document.getElementById('tasksContainer2');

// Calendar elements for each worker
const showCalendarBtn1 = document.getElementById('showCalendarBtn1');
const showCalendarBtn2 = document.getElementById('showCalendarBtn2');
const calendarModal1 = document.getElementById('calendarModal1');
const calendarModal2 = document.getElementById('calendarModal2');
const closeCalendarModal1 = document.getElementById('closeCalendarModal1');
const closeCalendarModal2 = document.getElementById('closeCalendarModal2');

// Novi elementi za navigaciju
// const currentDateText = document.getElementById('currentDateText'); // Uklonjen
// const prevDayBtn = document.getElementById('prevDayBtn'); // Uklonjen
// const nextDayBtn = document.getElementById('nextDayBtn'); // Uklonjen
const backBtn = document.getElementById('backBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Task form elementi
const taskTitleInput = document.getElementById('taskTitle');
const taskTimeInput = document.getElementById('taskTime');
const taskDescriptionInput = document.getElementById('taskDescription');

// Planner klasa
class AdminPlanner {
    constructor() {
        this.init();
    }
    
    // Swipe funkcionalnost za kalendare
    addSwipeNavigation(element, onSwipeLeft, onSwipeRight) {
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
    
    init() {
        // Postavi aktivni datum na današnji datum
        aktivniDatum = new Date();
        aktivniDatum1 = new Date();
        aktivniDatum2 = new Date();
        selectedDate = new Date(aktivniDatum);
        
        this.kreirajDatumiNiz();
        this.bindEvents();
        // Uklonjeno - updateMonthDisplay više nije potreban
        this.updateCurrentDate();
        // Uklonjeno - updateDaySelection više nije potreban
        this.initPlannerCalendar();
        this.bindCalendarModalEvents();
        this.loadTasks();
    }
    
    kreirajDatumiNiz() {
        datumiNiz = [];
        const danas = new Date();
        
        // Kreiraj niz od 30 dana unazad do 30 dana unapred
        for (let i = -30; i <= 30; i++) {
            const datum = new Date(danas);
            datum.setDate(danas.getDate() + i);
            datumiNiz.push(new Date(datum));
        }
        
        // Postavi aktivni datum indeks na današnji datum
        aktivniDatumIndeks = 30; // Indeks za današnji datum
        
        // Kreiraj prikazane datume (4 dana) - aktivniDatum je već postavljen u init()
        this.kreirajPrikazaneDatumi();
    }
    
    kreirajPrikazaneDatumi() {
        prikazaniDatumi = [];
        
        // Kreiraj 4 dana počevši od aktivnog datuma
        for (let i = 0; i < 4; i++) {
            const datum = new Date(aktivniDatum);
            datum.setDate(aktivniDatum.getDate() + i);
            prikazaniDatumi.push(new Date(datum));
        }
        
        // Postavi hover indeks na prvi dan
        hoverIndeks = 0;
        aktivniIndeks = 0;
        
        // Uklonjeno - generisiDaniHTML više nije potreban
    }
    
    generisiDaniHTML() {
        const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
        let html = '';
        
        for (let i = 0; i < prikazaniDatumi.length; i++) {
            const datum = prikazaniDatumi[i];
            const dayName = dayNames[datum.getDay()];
            const dayNumber = datum.getDate();
            const isActive = i === aktivniIndeks ? 'active' : '';
            
            html += `<button class="day-btn ${isActive}" data-day="${i}">
                <div class="day-name">${dayName}</div>
                <div class="day-number">${dayNumber}</div>
            </button>`;
        }
        
        // Uklonjeno - daysNavigation element više ne postoji
        // Kalendar se sada koristi umesto day navigation
    }
    
    bindDayButtons() {
        const dayButtons = document.querySelectorAll('.day-btn');
        dayButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const dayIndex = parseInt(btn.dataset.day);
                this.selectDayByIndex(dayIndex);
            });
        });
    }
    
    bindEvents() {
        // Task modal events
        const handleAddTask = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            console.log('addTaskBtn kliknut - event type:', e ? e.type : 'direct call');
            this.showTaskModal();
        };
        
        addTaskBtn.addEventListener('click', handleAddTask);
        addTaskBtn.addEventListener('touchend', handleAddTask, { passive: false });
        
        closeTaskModal.addEventListener('click', () => this.hideTaskModal());
        taskForm.addEventListener('submit', (e) => this.handleTaskSubmit(e));
        
        // Edit modal events
        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => this.hideEditModal());
        }
        
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }
        
        // Uklonjeno - month i day navigation elementi više ne postoje
        // Kalendar se sada koristi umesto ovih navigacija
        
        // Day selection - event listeneri se dodaju u bindDayButtons()
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === taskModal) {
                this.hideTaskModal();
            }
            if (e.target === editModal) {
                this.hideEditModal();
            }
        });
    }
    
    showTaskModal() {
        taskModalTitle.textContent = 'Dodaj novu obavezu';
        taskForm.reset();
        taskModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Initialize task calendar and time picker
        this.initTaskCalendar();
        this.initTaskTimePicker();
        this.initTaskWorkerSelection();
        this.initTaskDurationSelection();
        
        // Reset time slots
        this.resetTaskTimeSlots();
    }
    
    hideTaskModal() {
        taskModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        taskForm.reset();
        
        // Hide any open pickers
        const taskCalendar = document.getElementById('taskCalendar');
        const taskTimePicker = document.getElementById('taskTimePicker');
        if (taskCalendar) taskCalendar.style.display = 'none';
        if (taskTimePicker) taskTimePicker.style.display = 'none';
    }
    
    // Edit modal methods
    showEditModal(taskId) {
        const task = plannerTasks.find(t => t.id == taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }
        
        editModalTitle.textContent = 'Izmeni termin';
        
        // Store task ID and worker for update
        editForm.dataset.taskId = taskId;
        editForm.dataset.worker = task.worker || 'radnik1';
        
        // Initialize edit calendar and time picker first
        this.initEditCalendar();
        this.initEditTimePicker();
        
        // Then populate form with current task data
        document.getElementById('editDate').value = task.date;
        document.getElementById('editTime').value = task.time;
        document.getElementById('editService').value = task.service;
        document.getElementById('editNotes').value = task.description || '';
        
        // Load booked times for the current date
        this.loadEditBookedTimes(task.date);
        
        editModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    hideEditModal() {
        editModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        editForm.reset();
        
        // Hide any open pickers
        const editCalendar = document.getElementById('editCalendar');
        const editTimePicker = document.getElementById('editTimePicker');
        if (editCalendar) editCalendar.style.display = 'none';
        if (editTimePicker) editTimePicker.style.display = 'none';
    }
    
    async handleEditSubmit(e) {
        e.preventDefault();
        
        const taskId = editForm.dataset.taskId;
        if (!taskId) {
            console.error('No task ID found');
            return;
        }
        
        const formData = new FormData(editForm);
        const editData = {
            date: formData.get('editDate'),
            time: formData.get('editTime'),
            service: formData.get('editService'),
            notes: formData.get('editNotes')
        };
        
        try {
            // Update in Supabase
            const { error } = await supabaseClient
                .from('appointments')
                .update({
                    appointment_date: editData.date,
                    appointment_time: editData.time,
                    service: editData.service,
                    notes: editData.notes || null
                })
                .eq('id', taskId);
            
            if (error) {
                throw error;
            }
            
            // Update local data
            const taskIndex = plannerTasks.findIndex(t => t.id == taskId);
            if (taskIndex !== -1) {
                plannerTasks[taskIndex].date = editData.date;
                plannerTasks[taskIndex].time = editData.time;
                plannerTasks[taskIndex].service = editData.service;
                plannerTasks[taskIndex].description = editData.notes;
            }
            
            // Refresh display
            this.displayTasks();
            this.updatePlannerCalendar();
            this.hideEditModal();
            
            console.log('Appointment updated successfully');
        } catch (error) {
            console.error('Error updating appointment:', error);
            alert('Greška pri ažuriranju termina: ' + error.message);
        }
    }
    
    editTask(taskId) {
        this.showEditModal(taskId);
    }
    
    // Edit calendar and time picker initialization
    initEditCalendar() {
        const editDateInput = document.getElementById('editDate');
        const editCalendar = document.getElementById('editCalendar');
        const editMonthYear = document.getElementById('editMonthYear');
        const editCalendarDates = document.getElementById('editCalendarDates');
        const editPrevMonth = document.getElementById('editPrevMonth');
        const editNextMonth = document.getElementById('editNextMonth');
        
        if (!editDateInput || !editCalendar || !editMonthYear || !editCalendarDates) {
            console.error('Edit calendar elements not found');
            return;
        }
        
        // Remove existing event listeners to prevent duplicates
        editDateInput.removeEventListener('click', this.editDateClickHandler);
        if (editPrevMonth) editPrevMonth.removeEventListener('click', this.editPrevMonthHandler);
        if (editNextMonth) editNextMonth.removeEventListener('click', this.editNextMonthHandler);
        
        // Set current date from input or default to today
        const currentDate = editDateInput.value ? new Date(editDateInput.value) : new Date();
        this.editCurrentDate = new Date(currentDate);
        
        // Create bound event handlers
        this.editDateClickHandler = () => {
            editCalendar.style.display = editCalendar.style.display === 'none' ? 'block' : 'none';
            if (editCalendar.style.display === 'block') {
                this.renderEditCalendar();
            }
        };
        
        this.editPrevMonthHandler = () => {
            this.editCurrentDate.setMonth(this.editCurrentDate.getMonth() - 1);
            this.renderEditCalendar();
        };
        
        this.editNextMonthHandler = () => {
            this.editCurrentDate.setMonth(this.editCurrentDate.getMonth() + 1);
            this.renderEditCalendar();
        };
        
        // Add event listeners
        editDateInput.addEventListener('click', this.editDateClickHandler);
        if (editPrevMonth) editPrevMonth.addEventListener('click', this.editPrevMonthHandler);
        if (editNextMonth) editNextMonth.addEventListener('click', this.editNextMonthHandler);
        
        // Swipe funkcionalnost za edit kalendar
        this.addSwipeNavigation(editCalendar, this.editPrevMonthHandler, this.editNextMonthHandler);
        
        // Initial render
        this.renderEditCalendar();
    }
    
    // Task calendar and time picker initialization
    initTaskCalendar() {
        const taskDateInput = document.getElementById('taskDate');
        const taskCalendar = document.getElementById('taskCalendar');
        const taskMonthYear = document.getElementById('taskMonthYear');
        const taskCalendarDates = document.getElementById('taskCalendarDates');
        const taskPrevMonth = document.getElementById('taskPrevMonth');
        const taskNextMonth = document.getElementById('taskNextMonth');
        
        if (!taskDateInput || !taskCalendar || !taskMonthYear || !taskCalendarDates) {
            console.error('Task calendar elements not found');
            return;
        }
        
        // Remove existing event listeners to prevent duplicates
        taskDateInput.removeEventListener('click', this.taskDateClickHandler);
        if (taskPrevMonth) taskPrevMonth.removeEventListener('click', this.taskPrevMonthHandler);
        if (taskNextMonth) taskNextMonth.removeEventListener('click', this.taskNextMonthHandler);
        document.removeEventListener('click', this.taskCalendarClickOutsideHandler);
        
        // Set current date to today
        this.taskCurrentDate = new Date();
        
        // Create bound event handlers
        this.taskDateClickHandler = (e) => {
            e.stopPropagation(); // Prevent click outside handler from firing
            taskCalendar.style.display = taskCalendar.style.display === 'none' ? 'block' : 'none';
            if (taskCalendar.style.display === 'block') {
                this.renderTaskCalendar();
            }
        };
        
        this.taskPrevMonthHandler = () => {
            this.taskCurrentDate.setMonth(this.taskCurrentDate.getMonth() - 1);
            this.renderTaskCalendar();
        };
        
        this.taskNextMonthHandler = () => {
            this.taskCurrentDate.setMonth(this.taskCurrentDate.getMonth() + 1);
            this.renderTaskCalendar();
        };
        
        // Click outside handler for calendar
        this.taskCalendarClickOutsideHandler = (e) => {
            const datePickerContainer = document.querySelector('.date-picker-container');
            if (datePickerContainer && !datePickerContainer.contains(e.target)) {
                taskCalendar.style.display = 'none';
            }
        };
        
        // Add event listeners
        taskDateInput.addEventListener('click', this.taskDateClickHandler);
        if (taskPrevMonth) taskPrevMonth.addEventListener('click', this.taskPrevMonthHandler);
        if (taskNextMonth) taskNextMonth.addEventListener('click', this.taskNextMonthHandler);
        document.addEventListener('click', this.taskCalendarClickOutsideHandler);
        
        // Swipe funkcionalnost za task kalendar
        this.addSwipeNavigation(taskCalendar, this.taskPrevMonthHandler, this.taskNextMonthHandler);
        
        // Initial render
        this.renderTaskCalendar();
    }
    
    renderEditCalendar() {
        const editMonthYear = document.getElementById('editMonthYear');
        const editCalendarDates = document.getElementById('editCalendarDates');
        
        if (!editMonthYear || !editCalendarDates) return;
        
        const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
                           'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
        
        editMonthYear.textContent = `${monthNames[this.editCurrentDate.getMonth()]} ${this.editCurrentDate.getFullYear()}`;
        
        // Generate calendar dates
        const firstDay = new Date(this.editCurrentDate.getFullYear(), this.editCurrentDate.getMonth(), 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday
        
        let html = '';
        const currentDate = new Date(startDate);
        const selectedDateStr = document.getElementById('editDate').value;
        
        // Generate 42 days (6 weeks)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
        
        for (let i = 0; i < 42; i++) {
            const isCurrentMonth = currentDate.getMonth() === this.editCurrentDate.getMonth();
            const isToday = this.isSameDate(currentDate, new Date());
            const isSelected = selectedDateStr && this.isSameDate(currentDate, new Date(selectedDateStr));
            const isPastDate = currentDate < today;
            
            let classes = 'calendar-date';
            if (!isCurrentMonth) classes += ' disabled';
            if (isPastDate) classes += ' disabled';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            
            html += `<div class="${classes}" data-date="${this.formatDateForCalendar(currentDate)}">${currentDate.getDate()}</div>`;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        editCalendarDates.innerHTML = html;
        
        // Event listeners for dates
        const dateElements = editCalendarDates.querySelectorAll('.calendar-date:not(.disabled)');
        dateElements.forEach(element => {
            element.addEventListener('click', async () => {
                const dateStr = element.dataset.date;
                const [year, month, day] = dateStr.split('-').map(Number);
                const selectedDate = new Date(year, month - 1, day);
                
                console.log('Date selected:', dateStr);
                
                document.getElementById('editDate').value = dateStr;
                document.getElementById('editCalendar').style.display = 'none';
                
                // Update time picker header
                this.updateEditTimePickerHeader(selectedDate);
                
                // Load booked times for the selected date
                await this.loadEditBookedTimes(dateStr);
                
                // Remove previous selected
                dateElements.forEach(el => el.classList.remove('selected'));
                // Add selected to current
                element.classList.add('selected');
            });
        });
    }
    
    renderTaskCalendar() {
        const taskMonthYear = document.getElementById('taskMonthYear');
        const taskCalendarDates = document.getElementById('taskCalendarDates');
        
        if (!taskMonthYear || !taskCalendarDates) return;
        
        const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
                           'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
        
        taskMonthYear.textContent = `${monthNames[this.taskCurrentDate.getMonth()]} ${this.taskCurrentDate.getFullYear()}`;
        
        // Generate calendar dates
        const firstDay = new Date(this.taskCurrentDate.getFullYear(), this.taskCurrentDate.getMonth(), 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday
        
        let html = '';
        const currentDate = new Date(startDate);
        const selectedDateStr = document.getElementById('taskDate').value;
        
        // Generate 42 days (6 weeks)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
        
        for (let i = 0; i < 42; i++) {
            const isCurrentMonth = currentDate.getMonth() === this.taskCurrentDate.getMonth();
            const isToday = this.isSameDate(currentDate, new Date());
            const isSelected = selectedDateStr && this.isSameDate(currentDate, new Date(selectedDateStr));
            const isPastDate = currentDate < today;
            
            let classes = 'calendar-date';
            if (!isCurrentMonth) classes += ' disabled';
            if (isPastDate) classes += ' disabled';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            
            html += `<div class="${classes}" data-date="${this.formatDateForCalendar(currentDate)}">${currentDate.getDate()}</div>`;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        taskCalendarDates.innerHTML = html;
        
        // Event listeners for dates
        const dateElements = taskCalendarDates.querySelectorAll('.calendar-date:not(.disabled)');
        dateElements.forEach(element => {
            element.addEventListener('click', async () => {
                const dateStr = element.dataset.date;
                const [year, month, day] = dateStr.split('-').map(Number);
                const selectedDate = new Date(year, month - 1, day);
                
                console.log('Task date selected:', dateStr);
                
                document.getElementById('taskDate').value = dateStr;
                document.getElementById('taskCalendar').style.display = 'none';
                
                // Update time picker header
                this.updateTaskTimePickerHeader(selectedDate);
                
                // Load booked times for the selected date and worker
                const selectedWorker = document.getElementById('taskWorker').value;
                if (selectedWorker) {
                    await this.loadTaskBookedTimes(dateStr, selectedWorker);
                }
                
                // Remove previous selected
                dateElements.forEach(el => el.classList.remove('selected'));
                // Add selected to current
                element.classList.add('selected');
            });
        });
    }
    
    initEditTimePicker() {
        const editTimeInput = document.getElementById('editTime');
        const editTimePicker = document.getElementById('editTimePicker');
        const editSelectedDateDisplay = document.getElementById('editSelectedDateDisplay');
        
        if (!editTimeInput || !editTimePicker || !editSelectedDateDisplay) {
            console.error('Edit time picker elements not found');
            return;
        }
        
        // Remove existing event listeners to prevent duplicates
        editTimeInput.removeEventListener('click', this.editTimeClickHandler);
        
        // Create bound event handler
        this.editTimeClickHandler = async () => {
            const editDateValue = document.getElementById('editDate').value;
            if (!editDateValue) {
                alert('Molimo prvo izaberite datum');
                return;
            }
            
            console.log('Time picker clicked, date value:', editDateValue);
            
            // Set date in time picker header
            const selectedDate = new Date(editDateValue);
            this.updateEditTimePickerHeader(selectedDate);
            
            // Load booked times for the selected date and worker
            await this.loadEditBookedTimes(editDateValue);
            
            editTimePicker.style.display = editTimePicker.style.display === 'none' ? 'block' : 'none';
        };
        
        // Add event listener
        editTimeInput.addEventListener('click', this.editTimeClickHandler);
        
        // Event listeners for time slots
        const timeSlots = editTimePicker.querySelectorAll('.time-slot');
        timeSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                // Check if time slot is busy
                if (slot.classList.contains('busy')) {
                    alert('Ovaj termin je već zauzet');
                    return;
                }
                
                const time = slot.dataset.time;
                editTimeInput.value = time;
                editTimePicker.style.display = 'none';
                
                // Remove previous selected
                timeSlots.forEach(s => s.classList.remove('selected'));
                // Add selected to current
                slot.classList.add('selected');
            });
        });
    }
    
    updateEditTimePickerHeader(date) {
        const editSelectedDateDisplay = document.getElementById('editSelectedDateDisplay');
        if (!editSelectedDateDisplay) return;
        
        const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
        const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
                           'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
        
        const dayName = dayNames[date.getDay()];
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        
        editSelectedDateDisplay.textContent = `${dayName}, ${day}. ${month} ${year}`;
    }
    
    async loadEditBookedTimes(dateStr) {
        const worker = editForm.dataset.worker;
        const taskId = editForm.dataset.taskId;
        
        console.log('Loading booked times for:', { dateStr, worker, taskId });
        
        try {
            const { data: appointments, error } = await supabaseClient
                .from('appointments')
                .select('appointment_time, service, id')
                .eq('appointment_date', dateStr)
                .eq('worker', worker);
            
            if (error) {
                console.error('Error loading booked times:', error);
                return;
            }
            
            console.log('Found appointments:', appointments);
            
            // Reset all time slots
            const timeSlots = document.querySelectorAll('#editTimePicker .time-slot');
            timeSlots.forEach(slot => {
                slot.classList.remove('busy', 'selected');
            });
            
            // Mark busy times (excluding current appointment being edited)
            if (appointments && appointments.length > 0) {
                const allBlockedTimes = [];
                
                appointments.forEach(appointment => {
                    if (appointment.id != taskId) { // Exclude current appointment
                        const timeWithoutSeconds = appointment.appointment_time.substring(0, 5);
                        const service = appointment.service;
                        const duration = this.getServiceDuration(service);
                        
                        const blockedTimes = this.generateBlockedTimes(timeWithoutSeconds, duration);
                        allBlockedTimes.push(...blockedTimes);
                        
                        console.log(`Blocking times for ${timeWithoutSeconds} (${service}):`, blockedTimes);
                    }
                });
                
                // Remove duplicates
                const uniqueBlockedTimes = [...new Set(allBlockedTimes)];
                console.log('All blocked times:', uniqueBlockedTimes);
                
                // Mark time slots as busy
                timeSlots.forEach(slot => {
                    const timeValue = slot.getAttribute('data-time');
                    if (uniqueBlockedTimes.includes(timeValue)) {
                        slot.classList.add('busy');
                        console.log(`Marked ${timeValue} as busy`);
                    }
                });
            } else {
                console.log('No appointments found for this date and worker');
            }
            
        } catch (error) {
            console.error('Error loading booked times:', error);
        }
    }
    
    // Helper functions for edit modal
    getServiceDuration(service) {
        const durations = {
            'masaza': 60,      // 1 sat
            'masaža': 60,      // 1 sat (ćirilica)
            'terapija': 60,    // 1 sat
            'konsultacija': 30, // 30 minuta
            'pregled': 30,     // 30 minuta
            'drugo': 30,       // 30 minuta
            'obaveza': 30      // 30 minuta za admin obaveze
        };
        return durations[service] || 30; // Default 30 minuta
    }
    
    generateBlockedTimes(startTime, durationMinutes) {
        console.log(`generateBlockedTimes pozvana sa ${startTime} i ${durationMinutes} min`);
        
        const blockedTimes = [];
        const [startHour, startMinute] = startTime.split(':').map(Number);
        
        // Konvertujemo početno vreme u minute
        let currentMinutes = startHour * 60 + startMinute;
        const endMinutes = currentMinutes + durationMinutes;
        
        console.log(`Generišem blokirana vremena od ${startTime} (${currentMinutes} min) do ${endMinutes} min`);
        
        // Generišemo blokirana vremena u 15-minutnim intervalima
        while (currentMinutes <= endMinutes) {
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
    
    // Task time picker functions
    initTaskTimePicker() {
        const taskTimeInput = document.getElementById('taskTime');
        const taskTimePicker = document.getElementById('taskTimePicker');
        const taskSelectedDateDisplay = document.getElementById('taskSelectedDateDisplay');
        
        if (!taskTimeInput || !taskTimePicker || !taskSelectedDateDisplay) {
            console.error('Task time picker elements not found');
            return;
        }
        
        // Remove existing event listeners to prevent duplicates
        taskTimeInput.removeEventListener('click', this.taskTimeClickHandler);
        document.removeEventListener('click', this.taskTimePickerClickOutsideHandler);
        
        // Create bound event handler
        this.taskTimeClickHandler = async (e) => {
            e.stopPropagation(); // Prevent click outside handler from firing
            
            const taskDateValue = document.getElementById('taskDate').value;
            if (!taskDateValue) {
                alert('Molimo prvo izaberite datum');
                return;
            }
            
            console.log('Task time picker clicked, date value:', taskDateValue);
            
            // Set date in time picker header
            const selectedDate = new Date(taskDateValue);
            this.updateTaskTimePickerHeader(selectedDate);
            
            // Load booked times for the selected date and worker
            const selectedWorker = document.getElementById('taskWorker').value;
            if (!selectedWorker) {
                alert('Molimo prvo izaberite radnika');
                return;
            }
            
            await this.loadTaskBookedTimes(taskDateValue, selectedWorker);
            
            // Show the time picker
            taskTimePicker.style.display = 'block';
            console.log('Task time picker shown');
        };
        
        // Click outside handler for time picker
        this.taskTimePickerClickOutsideHandler = (e) => {
            const timePickerContainer = document.querySelector('.time-picker-container');
            if (timePickerContainer && !timePickerContainer.contains(e.target)) {
                taskTimePicker.style.display = 'none';
            }
        };
        
        // Add event listeners
        taskTimeInput.addEventListener('click', this.taskTimeClickHandler);
        document.addEventListener('click', this.taskTimePickerClickOutsideHandler);
    }
    
    updateTaskTimePickerHeader(date) {
        const taskSelectedDateDisplay = document.getElementById('taskSelectedDateDisplay');
        if (!taskSelectedDateDisplay) return;
        
        const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
        const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
                           'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
        
        const dayName = dayNames[date.getDay()];
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        
        taskSelectedDateDisplay.textContent = `${dayName}, ${day}. ${month} ${year}`;
    }
    
    async loadTaskBookedTimes(dateStr, worker) {
        console.log('Loading task booked times for:', { dateStr, worker });
        
        try {
            // Use plannerTasks instead of database query since worker field might not exist in DB
            const appointments = plannerTasks.filter(task => {
                if (task.date !== dateStr) return false;
                if (worker === 'radnik1') {
                    return task.worker === 'radnik1' || !task.worker; // Default to radnik1 if no worker specified
                } else if (worker === 'radnik2') {
                    return task.worker === 'radnik2';
                }
                return false;
            });
            
            console.log('Found appointments for task from plannerTasks:', appointments);
            
            // Reset all time slots
            const timeSlots = document.querySelectorAll('#taskTimePicker .time-slot');
            console.log(`Found ${timeSlots.length} time slots in task picker`);
            timeSlots.forEach(slot => {
                slot.classList.remove('busy', 'selected', 'preview-blocked');
            });
            
            // Mark busy times
            if (appointments && appointments.length > 0) {
                const allBlockedTimes = [];
                
                appointments.forEach(appointment => {
                    const timeWithoutSeconds = appointment.time.substring(0, 5);
                    const service = appointment.service;
                    // Use duration field if available, otherwise fall back to service duration
                    const duration = appointment.duration || this.getServiceDuration(service);
                    
                    const blockedTimes = this.generateBlockedTimes(timeWithoutSeconds, duration);
                    allBlockedTimes.push(...blockedTimes);
                    
                    console.log(`Task blocking times for ${timeWithoutSeconds} (${service}, ${duration}min):`, blockedTimes);
                });
                
                // Remove duplicates
                const uniqueBlockedTimes = [...new Set(allBlockedTimes)];
                console.log('Task all blocked times:', uniqueBlockedTimes);
                
                // Mark time slots as busy
                let busyCount = 0;
                timeSlots.forEach(slot => {
                    const timeValue = slot.getAttribute('data-time');
                    if (uniqueBlockedTimes.includes(timeValue)) {
                        slot.classList.add('busy');
                        busyCount++;
                        console.log(`Task marked ${timeValue} as busy`);
                    }
                });
                console.log(`Marked ${busyCount} time slots as busy`);
                
                // Also preview blocking for the selected duration
                const selectedDuration = document.getElementById('taskDuration').value;
                if (selectedDuration) {
                    this.previewTaskBlocking(timeSlots, parseInt(selectedDuration));
                }
            } else {
                console.log('No appointments found for this date and worker');
            }
            
            // Set up time slot event listeners
            this.setupTaskTimeSlotListeners(timeSlots);
            
        } catch (error) {
            console.error('Error loading task booked times:', error);
        }
    }
    
    resetTaskTimeSlots() {
        const timeSlots = document.querySelectorAll('#taskTimePicker .time-slot');
        timeSlots.forEach(slot => {
            slot.classList.remove('busy', 'selected', 'preview-blocked');
        });
    }
    
    setupTaskTimeSlotListeners(timeSlots) {
        const taskTimeInput = document.getElementById('taskTime');
        const taskTimePicker = document.getElementById('taskTimePicker');
        
        // Remove existing event listeners to prevent duplicates
        timeSlots.forEach(slot => {
            slot.removeEventListener('click', this.taskTimeSlotClickHandler);
        });
        
        // Create bound event handler
        this.taskTimeSlotClickHandler = (event) => {
            const slot = event.target;
            
            // Check if time slot is busy
            if (slot.classList.contains('busy') || slot.classList.contains('preview-blocked')) {
                alert('Ovaj termin je već zauzet ili nije dostupan');
                return;
            }
            
            const time = slot.dataset.time;
            taskTimeInput.value = time;
            taskTimePicker.style.display = 'none';
            
            // Remove previous selected
            timeSlots.forEach(s => s.classList.remove('selected'));
            // Add selected to current
            slot.classList.add('selected');
        };
        
        // Add event listeners to all time slots
        timeSlots.forEach(slot => {
            slot.addEventListener('click', this.taskTimeSlotClickHandler);
        });
    }
    
    previewTaskBlocking(timeSlots, duration) {
        // Remove existing preview classes
        timeSlots.forEach(slot => {
            slot.classList.remove('preview-blocked');
        });
        
        // Add preview blocking for each time slot based on duration
        timeSlots.forEach(slot => {
            if (!slot.classList.contains('busy')) {
                const timeValue = slot.getAttribute('data-time');
                const blockedTimes = this.generateBlockedTimes(timeValue, duration);
                
                // Check if any of the blocked times would conflict with existing appointments
                let hasConflict = false;
                blockedTimes.forEach(blockedTime => {
                    const blockedSlot = Array.from(timeSlots).find(s => s.getAttribute('data-time') === blockedTime);
                    if (blockedSlot && blockedSlot.classList.contains('busy')) {
                        hasConflict = true;
                    }
                });
                
                if (hasConflict) {
                    slot.classList.add('preview-blocked');
                }
            }
        });
    }
    
    getDurationText(duration) {
        const durationMap = {
            '15': '15 min',
            '30': '30 min',
            '45': '45 min',
            '60': '1h',
            '90': '1.5h',
            '120': '2h',
            '180': '3h'
        };
        return durationMap[duration] || duration + ' min';
    }
    
    initTaskWorkerSelection() {
        const taskWorkerSelect = document.getElementById('taskWorker');
        if (!taskWorkerSelect) return;
        
        // Remove existing event listener to prevent duplicates
        taskWorkerSelect.removeEventListener('change', this.taskWorkerChangeHandler);
        
        // Create bound event handler
        this.taskWorkerChangeHandler = async () => {
            const selectedWorker = taskWorkerSelect.value;
            const selectedDate = document.getElementById('taskDate').value;
            
            if (selectedWorker && selectedDate) {
                // Reload booked times for the selected worker and date
                await this.loadTaskBookedTimes(selectedDate, selectedWorker);
            }
        };
        
        // Add event listener
        taskWorkerSelect.addEventListener('change', this.taskWorkerChangeHandler);
    }
    
    initTaskDurationSelection() {
        const taskDurationSelect = document.getElementById('taskDuration');
        if (!taskDurationSelect) return;
        
        // Remove existing event listener to prevent duplicates
        taskDurationSelect.removeEventListener('change', this.taskDurationChangeHandler);
        
        // Create bound event handler
        this.taskDurationChangeHandler = async () => {
            const selectedDuration = taskDurationSelect.value;
            const selectedDate = document.getElementById('taskDate').value;
            const selectedWorker = document.getElementById('taskWorker').value;
            
            if (selectedDuration && selectedDate && selectedWorker) {
                // Reload booked times to show updated blocking based on duration
                await this.loadTaskBookedTimes(selectedDate, selectedWorker);
            }
        };
        
        // Add event listener
        taskDurationSelect.addEventListener('change', this.taskDurationChangeHandler);
    }
    
    async handleTaskSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(taskForm);
        const taskData = {
            worker: formData.get('taskWorker'),
            duration: formData.get('taskDuration'),
            date: formData.get('taskDate'),
            time: formData.get('taskTime'),
            description: formData.get('taskDescription').trim(),
            created_at: new Date().toISOString()
        };
        
        if (!taskData.worker || !taskData.duration || !taskData.date || !taskData.time) {
            alert('Molimo popunite sva obavezna polja.');
            return;
        }
        
        try {
            // Create title based on duration
            const durationText = this.getDurationText(taskData.duration);
            const taskTitle = `Obaveza (${durationText})`;
            
            // Sačuvaj u Supabase koristeći postojeću tabelu appointments
            const { data, error } = await supabaseClient
                .from('appointments')
                .insert([{
                    first_name: taskTitle,
                    phone: '000-000-0000', // Placeholder za obaveze
                    email: 'admin@planer.com', // Placeholder za obaveze
                    service: 'obaveza', // Tip obaveze
                    worker: taskData.worker, // Dodaj worker polje
                    appointment_date: taskData.date,
                    appointment_time: taskData.time,
                    notes: taskData.description,
                    duration: parseInt(taskData.duration), // Dodaj trajanje obaveze
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                throw error;
            }

            // Dodaj task u lokalni array
            const newTask = {
                id: data[0].id,
                title: taskTitle,
                time: taskData.time,
                duration: parseInt(taskData.duration),
                service: 'obaveza', // Admin obaveze imaju service 'obaveza'
                email: 'admin@planer.com', // Placeholder za admin obaveze
                phone: '000-000-0000', // Placeholder za admin obaveze
                description: taskData.description,
                date: taskData.date,
                worker: taskData.worker, // Dodaj worker polje
                created_at: taskData.created_at
            };
            
            plannerTasks.push(newTask);
            this.displayTasks();
            this.updatePlannerCalendar();
            this.hideTaskModal();
            
        } catch (error) {
            console.error('Greška pri čuvanju obaveze:', error);
            alert('Došlo je do greške pri čuvanju obaveze: ' + error.message);
        }
    }
    
    previousMonth() {
        // Pomeri aktivni datum za jedan mesec unazad
        aktivniDatum.setMonth(aktivniDatum.getMonth() - 1);
        
        // Ažuriraj selectedDate
        selectedDate = new Date(aktivniDatum);
        
        // Ažuriraj prikazane datume da odgovaraju novom mesecu
        this.kreirajPrikazaneDatumi();
        
        // Uklonjeno - updateMonthDisplay više nije potreban
        this.updateCurrentDate();
        // Uklonjeno - updateDaySelection više nije potreban
    }
    
    nextMonth() {
        // Pomeri aktivni datum za jedan mesec unapred
        aktivniDatum.setMonth(aktivniDatum.getMonth() + 1);
        
        // Ažuriraj selectedDate
        selectedDate = new Date(aktivniDatum);
        
        // Ažuriraj prikazane datume da odgovaraju novom mesecu
        this.kreirajPrikazaneDatumi();
        
        // Uklonjeno - updateMonthDisplay više nije potreban
        this.updateCurrentDate();
        // Uklonjeno - updateDaySelection više nije potreban
    }
    
    previousDay() {
        // Pomeri aktivni indeks unazad, ali ne ispod 0
        if (aktivniIndeks > 0) {
            aktivniIndeks--;
        } else {
            // Ako je na prvom danu, pomeri sve datume unazad i ostavi na prvom
            for (let i = 0; i < prikazaniDatumi.length; i++) {
                prikazaniDatumi[i].setDate(prikazaniDatumi[i].getDate() - 1);
            }
        }
        
        // Ažuriraj aktivni datum
        aktivniDatum = new Date(prikazaniDatumi[aktivniIndeks]);
        selectedDate = new Date(aktivniDatum);
        
        // Uklonjeno - generisiDaniHTML više nije potreban
        
        // Uklonjeno - updateMonthDisplay više nije potreban
        this.updateCurrentDate();
        // Uklonjeno - updateDaySelection više nije potreban
        this.displayTasks();
        this.updatePlannerCalendar();
    }
    
    nextDay() {
        // Pomeri aktivni indeks unapred, ali ne preko poslednjeg dana
        if (aktivniIndeks < prikazaniDatumi.length - 1) {
            aktivniIndeks++;
        } else {
            // Ako je na poslednjem danu, pomeri sve datume unapred i ostavi na poslednjem
            for (let i = 0; i < prikazaniDatumi.length; i++) {
                prikazaniDatumi[i].setDate(prikazaniDatumi[i].getDate() + 1);
            }
        }
        
        // Ažuriraj aktivni datum
        aktivniDatum = new Date(prikazaniDatumi[aktivniIndeks]);
        selectedDate = new Date(aktivniDatum);
        
        // Uklonjeno - generisiDaniHTML više nije potreban
        
        // Uklonjeno - updateMonthDisplay više nije potreban
        this.updateCurrentDate();
        // Uklonjeno - updateDaySelection više nije potreban
        this.displayTasks();
        this.updatePlannerCalendar();
    }
    
    updateCurrentDate() {
        // Uklonjeno - currentDateText element više ne postoji
        // Datum se sada prikazuje u selectedDayTitle
    }
    
    updateMonthDisplay() {
        const monthNames = [
            'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
            'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
        ];
        // Koristi mesec i godinu aktivnog datuma umesto currentPlannerDate
        currentMonth.textContent = `${monthNames[aktivniDatum.getMonth()]} ${aktivniDatum.getFullYear()}`;
    }
    
    selectDayByIndex(dayIndex) {
        // Ažuriraj aktivni indeks
        aktivniIndeks = dayIndex;
        
        // Animacija prelaska bold-a
        const dayButtons = document.querySelectorAll('.day-btn');
        const currentActive = document.querySelector('.day-btn.active');
        const newActive = dayButtons[dayIndex];
        
        if (currentActive && newActive && currentActive !== newActive) {
            // Ukloni aktivni sa trenutnog
            currentActive.classList.remove('active');
            
            // Dodaj aktivni na novi sa animacijom
            setTimeout(() => {
                newActive.classList.add('active');
            }, 100);
        } else if (newActive) {
            // Ako nema trenutnog aktivnog, samo dodaj na novi
            newActive.classList.add('active');
        }
        
        aktivniDatum = new Date(prikazaniDatumi[dayIndex]);
        selectedDate = new Date(aktivniDatum);
        
        // Uklonjeno - updateMonthDisplay više nije potreban
        this.updateCurrentDate();
        // Uklonjeno - updateDaySelection više nije potreban
        this.displayTasks();
        this.updatePlannerCalendar();
    }
    
    selectDay(dayOfWeek) {
        // Mapiranje HTML data-day na JavaScript getDay()
        // HTML: 0=Ponedeljak, 1=Utorak, 2=Sreda, 3=Četvrtak, 4=Petak, 5=Subota, 6=Nedelja
        // JS:   0=Nedelja,   1=Ponedeljak, 2=Utorak, 3=Sreda, 4=Četvrtak, 5=Petak, 6=Subota
        const jsDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
        
        // Pronađi datum sa tim danom nedelje u prikazanim datumima
        for (let i = 0; i < prikazaniDatumi.length; i++) {
            if (prikazaniDatumi[i].getDay() === jsDayOfWeek) {
                this.selectDayByIndex(i);
                break;
            }
        }
    }
    
    updateDaySelection() {
        // Uklonjeno - day selection se sada radi preko kalendara
        this.updateDayHeader();
    }
    
    updateDayHeader() {
        console.log('updateDayHeader pozvan');
        
        const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
        
        // Update Radnik 1 header
        const formattedDate1 = aktivniDatum1.toLocaleDateString('sr-RS');
        const dayOfWeek1 = aktivniDatum1.getDay();
        const dayName1 = dayNames[dayOfWeek1];
        
        if (selectedDayTitle1) {
            selectedDayTitle1.textContent = `${dayName1} ${formattedDate1}`;
            console.log('selectedDayTitle1 postavljen na:', selectedDayTitle1.textContent);
        } else {
            console.error('selectedDayTitle1 element nije pronađen');
        }
        
        if (selectedDateDisplay1) {
            selectedDateDisplay1.textContent = formattedDate1;
        }
        
        // Update Radnik 2 header
        const formattedDate2 = aktivniDatum2.toLocaleDateString('sr-RS');
        const dayOfWeek2 = aktivniDatum2.getDay();
        const dayName2 = dayNames[dayOfWeek2];
        
        if (selectedDayTitle2) {
            selectedDayTitle2.textContent = `${dayName2} ${formattedDate2}`;
            console.log('selectedDayTitle2 postavljen na:', selectedDayTitle2.textContent);
        } else {
            console.error('selectedDayTitle2 element nije pronađen');
        }
        
        if (selectedDateDisplay2) {
            selectedDateDisplay2.textContent = formattedDate2;
        }
    }
    
    getSelectedDate() {
        return aktivniDatum;
    }
    
    getSelectedDateString() {
        const year = aktivniDatum.getFullYear();
        const month = String(aktivniDatum.getMonth() + 1).padStart(2, '0');
        const day = String(aktivniDatum.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    getSelectedDateStringForWorker(workerNumber) {
        const activeDate = workerNumber === 1 ? aktivniDatum1 : aktivniDatum2;
        const year = activeDate.getFullYear();
        const month = String(activeDate.getMonth() + 1).padStart(2, '0');
        const day = String(activeDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    displayTasks() {
        // Get selected dates for each worker
        const selectedDate1 = this.getSelectedDateStringForWorker(1);
        const selectedDate2 = this.getSelectedDateStringForWorker(2);
        
        // Filter tasks by worker and date
        const radnik1Tasks = plannerTasks.filter(task => 
            task.date === selectedDate1 && (task.worker === 'radnik1' || !task.worker)
        );
        const radnik2Tasks = plannerTasks.filter(task => 
            task.date === selectedDate2 && task.worker === 'radnik2'
        );
        
        // Display tasks for Radnik 1
        this.displayTasksForWorker(radnik1Tasks, tasksContainer1);
        
        // Display tasks for Radnik 2
        this.displayTasksForWorker(radnik2Tasks, tasksContainer2);
    }
    
    displayTasksForWorker(dayTasks, container) {
        if (dayTasks.length === 0) {
            container.innerHTML = `
                <div class="planner-table-container">
                    <table class="planner-table">
                        <thead>
                            <tr>
                                <th>Vreme</th>
                                <th>Ime i prezime</th>
                                <th>Usluga</th>
                                <th>Mail</th>
                                <th>Broj telefona</th>
                                <th>Napomena</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="7" class="no-data">Nema termina za ovaj dan</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
            return;
        }

        // Sortiraj obaveze po vremenu
        dayTasks.sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return timeA.localeCompare(timeB);
        });
        
        const tasksHTML = dayTasks.map(task => {
            const timeDisplay = task.time ? this.formatTime(task.time, task.service, task.duration) : 'Bez vremena';
            const email = task.email || '-';
            const phone = task.phone || '-';
            const notes = task.description || '-';
            
            // Show duration info for tasks
            const titleDisplay = task.duration ? `${task.title} (${this.getDurationText(task.duration.toString())})` : task.title;

            return `
                <tr class="planner-row" data-task-id="${task.id}">
                    <td class="time-cell">${timeDisplay}</td>
                    <td class="name-cell">${titleDisplay}</td>
                    <td class="service-cell">${task.service || '-'}</td>
                    <td class="email-cell">${email}</td>
                    <td class="phone-cell">${phone}</td>
                    <td class="notes-cell">${notes}</td>
                    <td class="actions-cell">
                        <button class="action-btn edit-btn" onclick="planner.editTask('${task.id}')" title="Izmeni termin">
                            ✏️
                        </button>
                        <button class="action-btn delete-btn" onclick="planner.deleteTask('${task.id}')" title="Obriši termin">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="planner-table-container">
                <table class="planner-table">
                    <thead>
                        <tr>
                            <th>Vreme</th>
                            <th>Ime i prezime</th>
                            <th>Usluga</th>
                            <th>Mail</th>
                            <th>Broj telefona</th>
                            <th>Napomena</th>
                            <th>Akcije</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasksHTML}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    formatTime(time, service, duration = null) {
        const [hours, minutes] = time.split(':');
        const startHour = parseInt(hours);
        const startMinute = parseInt(minutes);
        
        // Odredi trajanje usluge - koristi duration ako je dostupan, inače service duration
        const taskDuration = duration || this.getServiceDuration(service);
        
        // Izračunaj završno vreme
        const endMinutes = startHour * 60 + startMinute + taskDuration;
        const endHour = Math.floor(endMinutes / 60);
        const endMinute = endMinutes % 60;
        
        // Formatiraj vremena
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        return `${startTime}-${endTime}`;
    }
    
    getServiceDuration(service) {
        const durations = {
            'masaza': 60,      // 1 sat
            'masaža': 60,      // 1 sat (ćirilica)
            'terapija': 60,    // 1 sat
            'konsultacija': 30, // 30 minuta
            'pregled': 30,     // 30 minuta
            'drugo': 30,       // 30 minuta
            'obaveza': 30      // 30 minuta za admin obaveze
        };
        return durations[service] || 30; // Default 30 minuta
    }
    
    async deleteTask(taskId) {
        // Konvertujemo taskId u number da se poklapa sa task.id tipom
        const numericTaskId = parseInt(taskId);
        
        // Koristi zaštićenu funkciju ako je dostupna
        if (window.AdminProtected && window.AdminProtected.deleteTaskSafe) {
            if (confirm('Da li ste sigurni da želite da obrišete ovu obavezu?')) {
                await window.AdminProtected.deleteTaskSafe(numericTaskId);
            }
            return;
        }
        
        // Fallback na postojeću logiku
        // Proveravamo da li je korisnik autentifikovan
        const user = await checkAuthStatus();
        if (!user) {
            alert('Morate biti ulogovani da biste obrisali obavezu');
            return;
        }
        
        if (confirm('Da li ste sigurni da želite da obrišete ovu obavezu?')) {
            try {
                
                const { data, error } = await supabaseClient
                    .from('appointments')
                    .delete()
                    .eq('id', numericTaskId);
                
                if (error) {
                    console.error('Supabase delete error:', error);
                    throw error;
                }
                
                // Ako nema greške, brisanje je uspešno
                plannerTasks = plannerTasks.filter(t => t.id !== numericTaskId);
                this.displayTasks();
                this.updatePlannerCalendar();
            } catch (error) {
                console.error('Greška pri brisanju obaveze:', error);
                alert('Došlo je do greške pri brisanju obaveze: ' + error.message);
            }
        }
    }
    
    async loadTasks() {
        try {
            // Koristi zaštićenu funkciju ako je dostupna
            if (window.AdminProtected && window.AdminProtected.loadTasksSafe) {
                await window.AdminProtected.loadTasksSafe();
                return;
            }
            
            // Fallback na postojeću logiku
            const { data: allData, error: allError } = await supabaseClient
                .from('appointments')
                .select('*')
                .order('appointment_date', { ascending: true });
            
            if (allError) {
                console.error('Greška pri učitavanju podataka:', allError);
            }
            
            // Koristi sve podatke kao obaveze
            plannerTasks = (allData || []).map(appointment => ({
                id: appointment.id,
                title: appointment.first_name,
                time: appointment.appointment_time,
                service: appointment.service,
                worker: appointment.worker, // Include worker field
                email: appointment.email,
                phone: appointment.phone,
                description: appointment.notes,
                date: appointment.appointment_date,
                created_at: appointment.created_at
            }));
            
            this.displayTasks();
            this.updatePlannerCalendar();
        } catch (error) {
            console.error('Greška pri učitavanju obaveza:', error);
            plannerTasks = [];
            this.displayTasks();
            this.updatePlannerCalendar();
        }
    }
    
    // Inicijalizacija planner kalendara
    initPlannerCalendar() {
        this.plannerCurrentMonth = new Date();
        this.plannerCurrentMonth1 = new Date();
        this.plannerCurrentMonth2 = new Date();
        this.renderPlannerCalendar();
        this.bindPlannerCalendarEvents();
    }
    
    // Renderovanje planner kalendara
    renderPlannerCalendar() {
        this.renderPlannerCalendarForWorker(1);
        this.renderPlannerCalendarForWorker(2);
    }
    
    renderPlannerCalendarForWorker(workerNumber) {
        console.log(`renderPlannerCalendarForWorker ${workerNumber} pozvan`);
        const monthYear = document.getElementById(`plannerMonthYear${workerNumber}`);
        const calendarDates = document.getElementById(`plannerCalendarDates${workerNumber}`);
        
        console.log(`monthYear${workerNumber} element:`, monthYear);
        console.log(`calendarDates${workerNumber} element:`, calendarDates);
        
        if (!monthYear || !calendarDates) {
            console.error(`monthYear${workerNumber} ili calendarDates${workerNumber} nisu pronađeni`);
            return;
        }
        
        // Postavi mesec i godinu
        const monthNames = [
            'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
            'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
        ];
        
        const currentMonth = workerNumber === 1 ? this.plannerCurrentMonth1 : this.plannerCurrentMonth2;
        const activeDate = workerNumber === 1 ? aktivniDatum1 : aktivniDatum2;
        
        monthYear.textContent = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
        
        // Generiši datume za kalendar
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Počni od ponedeljka
        
        let html = '';
        const currentDate = new Date(startDate);
        
        // Generiši 42 dana (6 nedelja)
        for (let i = 0; i < 42; i++) {
            const isCurrentMonth = currentDate.getMonth() === currentMonth.getMonth();
            const isToday = this.isSameDate(currentDate, new Date());
            const isSelected = this.isSameDate(currentDate, activeDate);
            const appointmentsForDate = this.getAppointmentsForDateAndWorker(currentDate, workerNumber);
            
            let classes = 'planner-calendar-date';
            if (!isCurrentMonth) classes += ' disabled';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (appointmentsForDate.length > 0) classes += ' has-appointments';
            
            let badges = '';
            if (appointmentsForDate.length > 0) {
                const workerKey = workerNumber === 1 ? 'radnik1' : 'radnik2';
                const count = appointmentsForDate.length;
                const badgeClass = workerNumber === 1 ? 'radnik1-badge' : 'radnik2-badge';
                badges += `<div class="appointment-badge ${badgeClass}">${count}</div>`;
            }
            
            html += `<div class="${classes}" data-date="${this.formatDateForCalendar(currentDate)}" data-worker="${workerNumber}">
                <span class="date-number">${currentDate.getDate()}</span>
                <div class="appointment-badges">${badges}</div>
            </div>`;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        calendarDates.innerHTML = html;
    }
    
    // Bindovanje event listenera za planner kalendar
    bindPlannerCalendarEvents() {
        console.log('bindPlannerCalendarEvents pozvan');
        
        // Bind events for both workers
        this.bindPlannerCalendarEventsForWorker(1);
        this.bindPlannerCalendarEventsForWorker(2);
    }
    
    bindPlannerCalendarEventsForWorker(workerNumber) {
        const prevBtn = document.getElementById(`plannerPrevMonth${workerNumber}`);
        const nextBtn = document.getElementById(`plannerNextMonth${workerNumber}`);
        const calendarDates = document.getElementById(`plannerCalendarDates${workerNumber}`);
        
        console.log(`prevBtn${workerNumber}:`, prevBtn);
        console.log(`nextBtn${workerNumber}:`, nextBtn);
        console.log(`calendarDates${workerNumber}:`, calendarDates);
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (workerNumber === 1) {
                    this.plannerCurrentMonth1.setMonth(this.plannerCurrentMonth1.getMonth() - 1);
                } else {
                    this.plannerCurrentMonth2.setMonth(this.plannerCurrentMonth2.getMonth() - 1);
                }
                this.renderPlannerCalendar();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (workerNumber === 1) {
                    this.plannerCurrentMonth1.setMonth(this.plannerCurrentMonth1.getMonth() + 1);
                } else {
                    this.plannerCurrentMonth2.setMonth(this.plannerCurrentMonth2.getMonth() + 1);
                }
                this.renderPlannerCalendar();
            });
        }
        
        // Swipe funkcionalnost za planner kalendar
        const plannerCalendar = document.getElementById(`plannerCalendar${workerNumber}`);
        if (plannerCalendar) {
            this.addSwipeNavigation(plannerCalendar, () => {
                if (workerNumber === 1) {
                    this.plannerCurrentMonth1.setMonth(this.plannerCurrentMonth1.getMonth() - 1);
                } else {
                    this.plannerCurrentMonth2.setMonth(this.plannerCurrentMonth2.getMonth() - 1);
                }
                this.renderPlannerCalendar();
            }, () => {
                if (workerNumber === 1) {
                    this.plannerCurrentMonth1.setMonth(this.plannerCurrentMonth1.getMonth() + 1);
                } else {
                    this.plannerCurrentMonth2.setMonth(this.plannerCurrentMonth2.getMonth() + 1);
                }
                this.renderPlannerCalendar();
            });
        }
        
        if (calendarDates) {
            calendarDates.addEventListener('click', (e) => {
                console.log(`Klik na calendarDates${workerNumber}:`, e.target);
                console.log('Klase:', e.target.classList);
                console.log('Data-date:', e.target.dataset.date);
                
                if (e.target.classList.contains('planner-calendar-date') && !e.target.classList.contains('disabled')) {
                    const dateStr = e.target.dataset.date;
                    console.log('Selektovan datum:', dateStr);
                    const selectedDate = new Date(dateStr);
                    
                    // Postavi aktivni datum za odgovarajućeg radnika
                    if (workerNumber === 1) {
                        aktivniDatum1 = new Date(selectedDate);
                    } else {
                        aktivniDatum2 = new Date(selectedDate);
                    }
                    
                    // Ažuriraj prikaz
                    this.updateCurrentDate();
                    this.updateDayHeader();
                    this.displayTasks();
                    this.renderPlannerCalendar();
                    
                    // Zatvori modal nakon izbora datuma
                    this.hideCalendarModal(workerNumber);
                }
            });
        } else {
            console.error(`calendarDates${workerNumber} element nije pronađen`);
        }
    }
    
    // Ažuriranje planner kalendara
    updatePlannerCalendar() {
        this.renderPlannerCalendar();
    }
    
    // Pomoćne funkcije
    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    formatDateForCalendar(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    hasAppointmentsForDate(date) {
        const dateStr = this.formatDateForCalendar(date);
        return plannerTasks.some(task => task.date === dateStr);
    }
    
    getAppointmentsForDate(date) {
        const dateStr = this.formatDateForCalendar(date);
        return plannerTasks.filter(task => task.date === dateStr);
    }
    
    getAppointmentsForDateAndWorker(date, workerNumber) {
        const dateStr = this.formatDateForCalendar(date);
        const workerKey = workerNumber === 1 ? 'radnik1' : 'radnik2';
        return plannerTasks.filter(task => {
            if (task.date !== dateStr) return false;
            if (workerNumber === 1) {
                return task.worker === 'radnik1' || !task.worker;
            } else {
                return task.worker === 'radnik2';
            }
        });
    }
    
    // Calendar Modal Events
    bindCalendarModalEvents() {
        console.log('bindCalendarModalEvents pozvan');
        
        // Radnik 1 calendar events
        const showCalendarBtn1 = document.getElementById('showCalendarBtn1');
        if (showCalendarBtn1) {
            console.log('showCalendarBtn1 element pronađen:', showCalendarBtn1);
            const handleShowCalendar1 = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('showCalendarBtn1 kliknut - event type:', e.type);
                this.showCalendarModal(1);
            };
            
            showCalendarBtn1.addEventListener('click', handleShowCalendar1);
            showCalendarBtn1.addEventListener('touchend', handleShowCalendar1, { passive: false });
        } else {
            console.error('showCalendarBtn1 element nije pronađen');
        }
        
        if (closeCalendarModal1) {
            closeCalendarModal1.addEventListener('click', () => {
                this.hideCalendarModal(1);
            });
        }
        
        if (calendarModal1) {
            calendarModal1.addEventListener('click', (e) => {
                if (e.target === calendarModal1) {
                    this.hideCalendarModal(1);
                }
            });
        }
        
        // Radnik 2 calendar events
        const showCalendarBtn2 = document.getElementById('showCalendarBtn2');
        if (showCalendarBtn2) {
            console.log('showCalendarBtn2 element pronađen:', showCalendarBtn2);
            const handleShowCalendar2 = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('showCalendarBtn2 kliknut - event type:', e.type);
                this.showCalendarModal(2);
            };
            
            showCalendarBtn2.addEventListener('click', handleShowCalendar2);
            showCalendarBtn2.addEventListener('touchend', handleShowCalendar2, { passive: false });
        } else {
            console.error('showCalendarBtn2 element nije pronađen');
        }
        
        if (closeCalendarModal2) {
            closeCalendarModal2.addEventListener('click', () => {
                this.hideCalendarModal(2);
            });
        }
        
        if (calendarModal2) {
            calendarModal2.addEventListener('click', (e) => {
                if (e.target === calendarModal2) {
                    this.hideCalendarModal(2);
                }
            });
        }
        
        // Registration modal elements
        const registrationModal = document.getElementById('registrationModal');
        const closeRegistrationModal = document.getElementById('closeRegistrationModal');
        const registrationForm = document.getElementById('registrationForm');
        
        // Registration modal events
        const registerUserBtn = document.getElementById('registerUserBtn');
        if (registerUserBtn) {
            console.log('registerUserBtn element pronađen:', registerUserBtn);
            const handleRegisterUser = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('registerUserBtn kliknut - event type:', e.type);
                this.showRegistrationModal();
            };
            
            registerUserBtn.addEventListener('click', handleRegisterUser);
            registerUserBtn.addEventListener('touchend', handleRegisterUser, { passive: false });
        } else {
            console.error('registerUserBtn element nije pronađen');
        }
        
        if (closeRegistrationModal) {
            closeRegistrationModal.addEventListener('click', () => {
                this.hideRegistrationModal();
            });
        }
        
        if (registrationModal) {
            registrationModal.addEventListener('click', (e) => {
                if (e.target === registrationModal) {
                    this.hideRegistrationModal();
                }
            });
        }
        
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }
    }
    
    showCalendarModal(workerNumber) {
        console.log(`showCalendarModal ${workerNumber} pozvan`);
        const calendarModal = document.getElementById(`calendarModal${workerNumber}`);
        console.log(`calendarModal${workerNumber} element:`, calendarModal);
        if (calendarModal) {
            calendarModal.style.display = 'block';
            console.log(`Modal ${workerNumber} prikazan`);
            this.renderPlannerCalendar();
        } else {
            console.error(`calendarModal${workerNumber} element nije pronađen`);
        }
    }
    
    hideCalendarModal(workerNumber) {
        const calendarModal = document.getElementById(`calendarModal${workerNumber}`);
        if (calendarModal) {
            calendarModal.style.display = 'none';
        }
    }
    
    // Registration Modal Methods
    showRegistrationModal() {
        const registrationModal = document.getElementById('registrationModal');
        if (registrationModal) {
            registrationModal.style.display = 'block';
        }
    }
    
    hideRegistrationModal() {
        const registrationModal = document.getElementById('registrationModal');
        if (registrationModal) {
            registrationModal.style.display = 'none';
            // Reset form
            const form = document.getElementById('registrationForm');
            if (form) {
                form.reset();
            }
        }
    }
    
    async handleRegistration() {
        const form = document.getElementById('registrationForm');
        const formData = new FormData(form);
        
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        // Validation
        if (password !== confirmPassword) {
            alert('Šifre se ne poklapaju!');
            return;
        }
        
        if (password.length < 6) {
            alert('Šifra mora imati najmanje 6 karaktera!');
            return;
        }
        
        try {
            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone
                    }
                }
            });
            
            if (authError) {
                throw authError;
            }
            
            // Add user to korisnici table with client role
            const { error: dbError } = await supabaseClient
                .from('korisnici')
                .insert([
                    {
                        email: email,
                        role: 'client',
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone
                    }
                ]);
            
            if (dbError) {
                throw dbError;
            }
            
            alert('Korisnik je uspešno registrovan!');
            this.hideRegistrationModal();
            
        } catch (error) {
            console.error('Greška pri registraciji:', error);
            alert('Greška pri registraciji: ' + error.message);
        }
    }
}

// Globalna planner instanca
let planner;

// ========================================
// ADMIN FUNKCIONALNOSTI
// ========================================

// Prikazivanje admin login modal-a
function showAdminLoginModal() {
    adminLoginModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Zatvaranje admin login modal-a
function hideAdminLoginModal() {
    adminLoginModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    adminLoginForm.reset();
    hideLoginError();
}

// Funkcije za prikazivanje/skrivanje grešaka
function showLoginError(message) {
    let errorDiv = document.getElementById('loginError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'loginError';
        errorDiv.className = 'error-message';
        adminLoginForm.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideLoginError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

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

// Supabase Auth logout
async function logoutFromSupabase() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            throw error;
        }
        // Preusmerite na login stranicu
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Proverite da li je korisnik ulogovan
async function checkAuthStatus() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

// Prikazivanje admin panel-a
function showAdminPanel() {
    if (window.AdminProtected && window.AdminProtected.showAdminPanelSafe) {
        window.AdminProtected.showAdminPanelSafe();
    } else {
        // Fallback na postojeću logiku
        isAdminLoggedIn = true;
        mainContainer.style.display = 'none';
        adminPlanner.style.display = 'block';
        hideAdminLoginModal();
        
        // Sakrij admin login dugme i prikaži back i logout dugmad
        if (adminLoginBtn) adminLoginBtn.style.display = 'none';
        backBtn.style.display = 'block';
        logoutBtn.style.display = 'block';
        // Učitaj obaveze iz Supabase
        if (planner) {
            planner.loadTasks();
        }
    }
}

// Skrivanje admin panel-a
function hideAdminPanel() {
    isAdminLoggedIn = false;
    adminPlanner.style.display = 'none';
    mainContainer.style.display = 'block';
    
    // Prikaži admin login dugme i sakrij back i logout dugmad
    if (adminLoginBtn) adminLoginBtn.style.display = 'block';
    backBtn.style.display = 'none';
    logoutBtn.style.display = 'none';
}










// ========================================
// NOVI KALENDAR WIDGET
// ========================================

class SimpleCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.monthNames = [
            'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
            'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
        ];
        
        this.init();
    }
    
    init() {
        this.dateInput = document.getElementById('date');
        this.calendar = document.getElementById('calendar');
        this.monthYear = document.getElementById('monthYear');
        this.prevMonth = document.getElementById('prevMonth');
        this.nextMonth = document.getElementById('nextMonth');
        this.calendarDates = document.getElementById('calendarDates');
        
        this.bindEvents();
        this.render();
    }
    
    bindEvents() {
        // Klik na input
        if (this.dateInput) {
            this.dateInput.addEventListener('click', () => this.show());
        }
        
        // Navigacija
        if (this.prevMonth) {
            this.prevMonth.addEventListener('click', () => this.previousMonth());
        }
        if (this.nextMonth) {
            this.nextMonth.addEventListener('click', () => this.nextMonthHandler());
        }
        
        // Klik van kalendara
        document.addEventListener('click', (e) => {
            if (this.calendar && this.dateInput &&
                !this.calendar.contains(e.target) && 
                !this.dateInput.contains(e.target)) {
                this.hide();
            }
        });
    }
    
    show() {
        if (this.calendar) {
            this.calendar.style.display = 'block';
            this.render();
        }
    }
    
    hide() {
        if (this.calendar) {
            this.calendar.style.display = 'none';
        }
    }
    
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }
    
    nextMonthHandler() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }
    
    render() {
        if (!this.monthYear || !this.calendarDates) {
            return; // Nema elemenata za renderovanje
        }
        
        // Ažuriranje header-a
        this.monthYear.textContent = `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        // Brisanje postojećih datuma
        this.calendarDates.innerHTML = '';
        
        // Početak meseca
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        
        // Početni dan nedelje (0=nedelja, konvertujemo da 0=ponedeljak)
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1; // Konvertujemo da ponedeljak bude 0
        
        // Dodavanje praznih dana na početak
        for (let i = 0; i < startDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('calendar-date', 'empty');
            this.calendarDates.appendChild(emptyDiv);
        }
        
        // Dodavanje dana u mesecu
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateDiv = document.createElement('div');
            dateDiv.classList.add('calendar-date');
            dateDiv.textContent = day;
            
            const currentDateObj = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Disable prošle datume
            if (currentDateObj < today) {
                dateDiv.classList.add('disabled');
            } else {
                dateDiv.addEventListener('click', () => this.selectDate(currentDateObj));
            }
            
            // Označavanje selektovanog datuma
            if (this.selectedDate && 
                currentDateObj.toDateString() === this.selectedDate.toDateString()) {
                dateDiv.classList.add('selected');
            }
            
            this.calendarDates.appendChild(dateDiv);
        }
    }
    
    selectDate(date) {
        this.selectedDate = date;
        
        // Formatiranje datuma za prikaz
        const formattedDate = `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}.`;
        if (this.dateInput) {
            this.dateInput.value = formattedDate;
        }
        
        this.hide();
        this.render(); // Za označavanje selektovanog datuma
        
        // Obaveštavamo time picker da je datum promenjen
        console.log('Kalendar selectDate pozvan, proveravam timePicker...');
        if (window.timePicker) {
            console.log('TimePicker pronađen, ažuriram datum');
            window.timePicker.selectedDate = date;
        } else {
            console.log('TimePicker nije pronađen!');
        }
    }
    
    getSelectedDate() {
        return this.selectedDate;
    }
}

// Globalna varijabla za kalendar
let calendar;

// ========================================
// TIME PICKER WIDGET
// ========================================

class TimePicker {
    constructor() {
        this.selectedTime = null;
        this.selectedDate = null;
        this.busyTimes = []; // Lista zauzetih vremena
        
        this.init();
    }
    
    init() {
        this.timeInput = document.getElementById('time');
        this.timePicker = document.getElementById('timePicker');
        this.selectedDateDisplay = document.getElementById('selectedDateDisplay');
        this.timeSlots = document.querySelectorAll('.time-slot');
        
        console.log('TimePicker elementi:');
        console.log('timeInput:', this.timeInput);
        console.log('timePicker:', this.timePicker);
        console.log('selectedDateDisplay:', this.selectedDateDisplay);
        console.log('timeSlots:', this.timeSlots.length);
        
        this.bindEvents();
    }
    
    bindEvents() {
        console.log('Dodavanje event listener-a za TimePicker...');
        
        // Klik na input
        if (this.timeInput) {
            this.timeInput.addEventListener('click', () => {
                console.log('Klik na timeInput');
                this.show();
            });
        } else {
            console.error('timeInput nije pronađen');
        }
        
        // Klik na time slot
        this.timeSlots.forEach(slot => {
            slot.addEventListener('click', () => this.selectTime(slot));
        });
        
        // Event listener za promenu usluge
        const serviceSelect = document.getElementById('service');
        if (serviceSelect) {
            console.log('Dodajem event listener za service select');
            serviceSelect.addEventListener('change', () => {
                console.log('Usluga promenjena na:', serviceSelect.value);
                if (this.selectedDate) {
                    console.log('Pozivam loadBusyTimes jer je datum selektovan');
                    this.loadBusyTimes();
                } else {
                    console.log('Nema selektovan datum, samo ažuriram time slots');
                    this.updateTimeSlots();
                }
                
                // Dodaj preview blocking za novu uslugu
                if (this.selectedDate && serviceSelect.value) {
                    const serviceDuration = this.getServiceDuration(serviceSelect.value);
                    this.previewServiceBlocking(this.timeSlots, serviceDuration);
                }
            });
        } else {
            console.error('Service select element nije pronađen!');
        }
        
        // Klik van time picker-a
        document.addEventListener('click', (e) => {
            if (!this.timePicker.contains(e.target) && 
                !this.timeInput.contains(e.target)) {
                this.hide();
            }
        });
    }
    
    show() {
        console.log('TimePicker.show() pozvana');
        
        // Proverava da li je datum selektovan
        if (!calendar || !calendar.getSelectedDate()) {
            console.log('Datum nije selektovan');
            showMessage('Molimo izaberite datum pre izbora vremena.', 'error');
            return;
        }
        
        console.log('Datum je selektovan, prikazujem time picker');
        this.selectedDate = calendar.getSelectedDate();
        this.updateDateDisplay();
        
        // KORAK 1: Dohvatamo zauzeta vremena
        this.loadBusyTimes();
        
        // Ažuriramo time slots za duration conflicts sa malim delay-om
        setTimeout(() => {
            this.updateTimeSlots();
            
            // Dodaj preview blocking za trenutno selektovanu uslugu
            const serviceSelect = document.getElementById('service');
            if (serviceSelect && serviceSelect.value) {
                const serviceDuration = this.getServiceDuration(serviceSelect.value);
                this.previewServiceBlocking(this.timeSlots, serviceDuration);
            }
        }, 100);
        
        this.timePicker.style.display = 'block';
    }
    
    hide() {
        this.timePicker.style.display = 'none';
    }
    
    updateDateDisplay() {
        if (this.selectedDate) {
            const formattedDate = `${this.selectedDate.getDate()}.${(this.selectedDate.getMonth() + 1).toString().padStart(2, '0')}.${this.selectedDate.getFullYear()}.`;
            this.selectedDateDisplay.textContent = `Izaberite vreme za ${formattedDate}`;
        }
    }
    
    // KORAK 1: Funkcija za dohvatanje zauzetih vremena iz Supabase
    async fetchBusyTimes() {
        if (!this.selectedDate) {
            console.log('Nema selektovanog datuma');
            return [];
        }
        
        try {
            const year = this.selectedDate.getFullYear();
            const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(this.selectedDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            console.log('KORAK 1: Dohvatam zauzeta vremena za datum:', dateString);
            
            const { data, error } = await supabaseClient
                .from('appointments')
                .select('appointment_time, service')
                .eq('appointment_date', dateString);
            
            if (error) {
                console.error('Greška pri dohvatanju zauzetih vremena:', error);
                return [];
            }
            
            console.log('KORAK 1: Zauzeta vremena iz Supabase:', data);
            return data || [];
            
        } catch (error) {
            console.error('KORAK 1: Greška pri dohvatanju zauzetih vremena:', error);
            return [];
        }
    }
    
    // KORAK 3: Funkcija koja poziva fetchBusyTimes i ažurira UI
    async loadBusyTimes() {
        console.log('KORAK 3: Pozivam loadBusyTimes...');
        
        // Dohvatamo zauzeta vremena
        const busyData = await this.fetchBusyTimes();
        console.log('KORAK 3: Podaci dohvaćeni:', busyData);
        
        // KORAK 3: Procesiramo podatke i generišemo blokirana vremena na osnovu trajanja
        const allBlockedTimes = [];
        
        if (busyData && busyData.length > 0) {
            console.log('KORAK 3: Procesiram podatke...');
            busyData.forEach(appointment => {
                console.log('KORAK 3: Procesiram appointment:', appointment);
                const startTime = appointment.appointment_time.substring(0, 5); // HH:MM
                const service = appointment.service;
                const duration = this.getServiceDuration(service);
                
                console.log(`KORAK 3: Usluga: ${service}, trajanje: ${duration} min, početak: ${startTime}`);
                
                const blockedTimes = this.generateBlockedTimes(startTime, duration);
                allBlockedTimes.push(...blockedTimes);
                
                console.log(`KORAK 3: Blokirana vremena za ${service}:`, blockedTimes);
            });
        } else {
            console.log('KORAK 3: Nema podataka za procesiranje');
        }
        
        // Uklanjamo duplikate
        this.busyTimes = [...new Set(allBlockedTimes)];
        console.log('KORAK 3: Sva blokirana vremena:', this.busyTimes);
        this.updateTimeSlots();
    }
    
    // KORAK 3: Funkcija za izračunavanje trajanja usluge u minutima
    getServiceDuration(service) {
        const durations = {
            'masaza': 60,      // 1 sat
            'masaža': 60,      // 1 sat (ćirilica)
            'terapija': 60,    // 1 sat
            'drugo': 30        // 30 minuta
        };
        const duration = durations[service] || 30; // Default 30 minuta
        console.log(`KORAK 3: getServiceDuration za '${service}' vraća ${duration} min`);
        return duration;
    }
    
    // KORAK 3: Funkcija za generisanje blokiranih vremena na osnovu trajanja
    generateBlockedTimes(startTime, durationMinutes) {
        console.log(`KORAK 3: generateBlockedTimes pozvana sa ${startTime} i ${durationMinutes} min`);
        
        const blockedTimes = [];
        const [startHour, startMinute] = startTime.split(':').map(Number);
        
        // Konvertujemo početno vreme u minute
        let currentMinutes = startHour * 60 + startMinute;
        const endMinutes = currentMinutes + durationMinutes;
        
        console.log(`KORAK 3: Generišem blokirana vremena od ${startTime} (${currentMinutes} min) do ${endMinutes} min`);
        
        // Generišemo blokirana vremena u 15-minutnim intervalima
        while (currentMinutes <= endMinutes) {
            const hours = Math.floor(currentMinutes / 60);
            const minutes = currentMinutes % 60;
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            blockedTimes.push(timeString);
            console.log(`KORAK 3: Dodajem blokirano vreme: ${timeString} (${currentMinutes} min)`);
            currentMinutes += 15; // 15-minutni intervali
        }
        
        console.log(`KORAK 3: Ukupno blokiranih vremena: ${blockedTimes.length}`);
        return blockedTimes;
    }
    
    updateTimeSlots() {
        console.log('KORAK 2: Ažuriram time slots, zauzeta vremena:', this.busyTimes);
        
        // Ponovo dohvati time slots u slučaju da su se ažurirali
        this.timeSlots = document.querySelectorAll('.time-slot');
        console.log('Ponovo dohvaćeni time slots:', this.timeSlots.length);
        
        // Dobij selektovanu uslugu
        const serviceSelect = document.getElementById('service');
        const selectedService = serviceSelect ? serviceSelect.value : '';
        const serviceDuration = selectedService ? this.getServiceDuration(selectedService) : 30;
        
        if (!this.getServiceDuration) {
            console.error('getServiceDuration funkcija ne postoji!');
            return;
        }
        
        console.log('updateTimeSlots - selectedService:', selectedService, 'duration:', serviceDuration);
        
        this.timeSlots.forEach(slot => {
            const timeValue = slot.getAttribute('data-time');
            
            // Uklanjanje postojećih klasa
            slot.classList.remove('selected', 'busy', 'disabled', 'preview-blocked');
            
            // KORAK 2: Označavanje zauzetih vremena
            if (this.busyTimes.includes(timeValue)) {
                console.log(`KORAK 2: Označavam ${timeValue} kao zauzeto`);
                slot.classList.add('busy');
            }
            
            // Označavanje selektovanog vremena
            if (this.selectedTime === timeValue) {
                slot.classList.add('selected');
            }
            
            // Disable prošla vremena za današnji dan
            if (this.selectedDate) {
                const today = new Date();
                const isToday = this.selectedDate.toDateString() === today.toDateString();
                
                if (isToday) {
                    const currentTime = new Date();
                    const slotTime = new Date();
                    const [hours, minutes] = timeValue.split(':');
                    slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    if (slotTime <= currentTime) {
                        slot.classList.add('disabled');
                    }
                }
            }
            
            // Disable vremena koja ne mogu da se izaberu zbog trajanja usluge
            if (selectedService && !slot.classList.contains('busy') && !slot.classList.contains('disabled')) {
                console.log(`Proveravam ${timeValue} za duration conflict...`);
                if (this.wouldConflictWithDuration(timeValue, serviceDuration)) {
                    slot.classList.add('preview-blocked');
                    console.log(`KORAK 2: Označavam ${timeValue} kao preview-blocked (${serviceDuration}min)`);
                    console.log('Slot klase nakon dodavanja:', slot.className);
                }
            } else {
                console.log(`Preskačem ${timeValue} - selectedService: ${selectedService}, busy: ${slot.classList.contains('busy')}, disabled: ${slot.classList.contains('disabled')}`);
            }
        });
        
        console.log('KORAK 2: Time slots ažurirani');
        console.log(`Ukupno slotova: ${this.timeSlots.length}, zauzetih: ${this.busyTimes.length}`);
    }
    
    wouldConflictWithDuration(startTime, durationMinutes) {
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
    
    previewServiceBlocking(timeSlots, serviceDuration) {
        console.log(`previewServiceBlocking pozvana sa ${timeSlots.length} slotova, trajanje: ${serviceDuration}min`);
        
        // Remove existing preview classes
        timeSlots.forEach(slot => {
            slot.classList.remove('preview-blocked');
        });
        
        let blockedCount = 0;
        
        // Add preview blocking for each time slot based on service duration
        timeSlots.forEach(slot => {
            if (!slot.classList.contains('busy') && !slot.classList.contains('disabled')) {
                const timeValue = slot.getAttribute('data-time');
                
                // Check if any blocked time would go past work hours
                const wouldConflict = this.wouldConflictWithDuration(timeValue, serviceDuration);
                
                if (wouldConflict) {
                    slot.classList.add('preview-blocked');
                    blockedCount++;
                    console.log(`Preview blocking ${timeValue} for ${serviceDuration}min service`);
                }
            }
        });
        
        console.log(`Preview blocking završeno - blokirano ${blockedCount} slotova`);
    }
    
    selectTime(slot) {
        if (slot.classList.contains('busy') || slot.classList.contains('disabled') || slot.classList.contains('preview-blocked')) {
            console.log('KORAK 2: Pokušaj selekcije zauzetog ili onemogućenog vremena');
            return;
        }
        
        this.selectedTime = slot.getAttribute('data-time');
        
        // Uklanjanje prethodne selekcije
        this.timeSlots.forEach(s => s.classList.remove('selected'));
        
        // Dodavanje nove selekcije
        slot.classList.add('selected');
        
        // Ažuriranje input polja
        this.timeInput.value = this.selectedTime;
        
        this.hide();
    }
    
    getSelectedTime() {
        return this.selectedTime;
    }
    
    reset() {
        this.selectedTime = null;
        this.selectedDate = null;
        this.busyTimes = [];
        this.timeInput.value = '';
        this.timeSlots.forEach(slot => {
            slot.classList.remove('selected', 'busy', 'disabled');
        });
    }
}

// Globalna varijabla za time picker
let timePicker;

// Funkcija za prikazivanje poruke
function showMessage(text, type = 'success') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Sakrij poruku nakon 5 sekundi
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Funkcija za uključivanje loading stanja
function setLoading(loading) {
    if (loading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
    }
}

// Funkcija za proveru preklapanja termina
async function checkTimeOverlap(date, time, service) {
    try {
        // Dohvati sve termine za taj datum
        const { data: existingAppointments, error } = await supabaseClient
            .from('appointments')
            .select('appointment_time, service')
            .eq('appointment_date', date);
        
        if (error) {
            console.error('Greška pri dohvatanju postojećih termina:', error);
            return null; // Ne blokiraj ako ne možemo da proverimo
        }
        
        if (!existingAppointments || existingAppointments.length === 0) {
            return null; // Nema postojećih termina, nema preklapanja
        }
        
        // Izračunaj trajanje nove usluge
        const newServiceDuration = getServiceDuration(service);
        const [newStartHour, newStartMinute] = time.split(':').map(Number);
        const newStartMinutes = newStartHour * 60 + newStartMinute;
        const newEndMinutes = newStartMinutes + newServiceDuration;
        
        // Proveri preklapanje sa svakim postojećim terminom
        for (const appointment of existingAppointments) {
            const existingDuration = getServiceDuration(appointment.service);
            const [existingStartHour, existingStartMinute] = appointment.appointment_time.split(':').map(Number);
            const existingStartMinutes = existingStartHour * 60 + existingStartMinute;
            const existingEndMinutes = existingStartMinutes + existingDuration;
            
            // Proveri da li se termini preklapaju
            if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
                return `Nema dovoljno vremena za selektovanu uslugu. Termin se preklapa sa postojećim terminom u ${appointment.appointment_time}`;
            }
        }
        
        return null; // Nema preklapanja
    } catch (error) {
        console.error('Greška pri proveri preklapanja:', error);
        return null; // Ne blokiraj ako ne možemo da proverimo
    }
}

// Funkcija za određivanje trajanja usluge
function getServiceDuration(service) {
    const durations = {
        'masaza': 60,      // 1 sat
        'masaža': 60,      // 1 sat (ćirilica)
        'terapija': 60,    // 1 sat
        'konsultacija': 30, // 30 minuta
        'pregled': 30,     // 30 minuta
        'drugo': 30        // 30 minuta
    };
    return durations[service] || 30; // Default 30 minuta
}

// Funkcija za validaciju forme
async function validateForm(formData) {
    const errors = [];
    
    // Validacija imena
    if (!formData.firstName.trim()) {
        errors.push('Ime i prezime je obavezno');
    }
    
    // Validacija telefona
    if (!formData.phone.trim()) {
        errors.push('Telefon je obavezan');
    } else if (!/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formData.phone)) {
        errors.push('Unesite validan broj telefona');
    }
    
    // Validacija email-a
    if (!formData.email.trim()) {
        errors.push('Email je obavezan');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Unesite validan email');
    }
    
    // Validacija usluge
    if (!formData.service) {
        errors.push('Izaberite uslugu');
    }
    
    // Validacija datuma
    if (!formData.date) {
        errors.push('Datum je obavezan');
    } else {
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            errors.push('Datum ne može biti u prošlosti');
        }
    }
    
    // Validacija vremena
    if (!formData.time) {
        errors.push('Vreme je obavezno');
    }
    
    // Validacija preklapanja termina
    if (formData.date && formData.time && formData.service) {
        const overlapError = await checkTimeOverlap(formData.date, formData.time, formData.service);
        if (overlapError) {
            errors.push(overlapError);
        }
    }
    
    return errors;
}

// Funkcija za slanje podataka u Supabase
async function submitAppointment(formData) {
    try {
        console.log('Šaljem podatke u Supabase:', formData);
        console.log('Supabase client:', supabaseClient);
        
        const { data, error } = await supabaseClient
            .from('appointments')
            .insert([
                {
                    first_name: formData.firstName,
                    phone: formData.phone,
                    email: formData.email,
                    service: formData.service,
                    appointment_date: formData.date,
                    appointment_time: formData.time,
                    notes: formData.notes || null,
                    created_at: new Date().toISOString()
                }
            ])
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

// ========================================
// DOGAĐAJI
// ========================================

// Admin login dugme - ZAKOMENTARISANO
// adminLoginBtn.addEventListener('click', showAdminLoginModal);

// Zatvaranje modal-a
closeLoginModal.addEventListener('click', hideAdminLoginModal);

// Zatvaranje modal-a klikom van njega
window.addEventListener('click', (event) => {
    if (event.target === adminLoginModal) {
        hideAdminLoginModal();
    }
});

// Admin login forma sa Supabase Auth
adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.textContent = 'Ulogovanje...';
        submitBtn.disabled = true;
        
        const user = await loginWithSupabase(email, password);
        if (user) {
            // Proveri da li je korisnik admin
            const { data: userData, error: userError } = await supabaseClient
                .from('korisnici')
                .select('role')
                .eq('email', email)
                .single();
            
            if (userError || !userData || userData.role !== 'admin') {
                showLoginError('Nemate admin pristup');
                await logoutFromSupabase(); // Odjavi korisnika
                return;
            }
            
            showAdminPanel();
            hideLoginError();
        }
    } catch (error) {
        showLoginError('Pogrešan email ili lozinka');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Admin login dugme - proverava admin status
if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Proveri da li je korisnik admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (isAdmin) {
        showAdminPanel();
    } else {
        // Ako nema admin status, proveri da li je admin email
        const adminEmail = window.APP_CONFIG?.ADMIN_EMAIL || 'davidheh15@gmail.com';
        
        // Proveri da li je admin email u localStorage ili sessionStorage
        const storedEmail = localStorage.getItem('adminEmail') || sessionStorage.getItem('adminEmail');
        
        if (storedEmail === adminEmail) {
            // Ako je admin email, postavi admin status i prikaži panel
            localStorage.setItem('isAdmin', 'true');
            showAdminPanel();
        } else {
            // Otvori login modal umesto alert-a
            showAdminLoginModal();
        }
    }
    });
}

// Nazad dugme u admin sekciji
backBtn.addEventListener('click', async () => {
    // Samo sakrij admin panel, ne logout-uj korisnika
    hideAdminPanel();
});

// Logout dugme u admin sekciji
logoutBtn.addEventListener('click', async () => {
    await logoutFromSupabase();
    hideAdminPanel();
});

// Slušanje submit događaja forme
if (form) {
    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submit pozvan');
    
    // Prikupljanje podataka iz forme
    const selectedDateObj = calendar.getSelectedDate();
    const selectedDate = selectedDateObj ? (() => {
        const year = selectedDateObj.getFullYear();
        const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })() : null;
    const selectedTime = timePicker.getSelectedTime();
    
    console.log('Selektovani datum:', selectedDate);
    console.log('Selektovano vreme:', selectedTime);
    
    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        service: document.getElementById('service').value,
        date: selectedDate,
        time: selectedTime,
        notes: document.getElementById('notes').value.trim()
    };
    
    console.log('Form data:', formData);
    
    // Validacija forme
    const validationErrors = await validateForm(formData);
    console.log('Validacija greške:', validationErrors);
    if (validationErrors.length > 0) {
        console.log('Forma nije validna, prikazujem greške');
        showMessage(validationErrors.join(', '), 'error');
        return;
    }
    
    console.log('Forma je validna, šaljem podatke');
    
    // Uključivanje loading stanja
    setLoading(true);
    
    try {
        // Slanje podataka u Supabase
        await submitAppointment(formData);
        
        // Uspešno slanje
        showMessage('Termin je uspešno zakazan! Kontaktiraćemo vas uskoro.', 'success');
        
        // Resetovanje forme
        form.reset();
        
        // Resetovanje kalendara
        calendar.selectedDate = null;
        calendar.dateInput.value = '';
        
        // Resetovanje time picker-a
        timePicker.reset();
        
        // Ponovno učitavanje zauzetih vremena za trenutni datum
        if (calendar.getSelectedDate()) {
            timePicker.selectedDate = calendar.getSelectedDate();
        }
        
    } catch (error) {
        // Greška pri slanju
        let errorMessage = 'Došlo je do greške pri zakazivanju termina.';
        
        if (error.message) {
            errorMessage += ' ' + error.message;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        // Isključivanje loading stanja
        setLoading(false);
    }
    });
}

// ========================================
// INICIJALIZACIJA
// ========================================

// Inicijalizacija aplikacije
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded pozvan');
    
    // Inicijalizacija Supabase klijenta
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase klijent inicijalizovan:', supabaseClient);
    
    // Inicijalizacija novog kalendara
    calendar = new SimpleCalendar();
    console.log('Kalendar inicijalizovan');
    
    // Inicijalizacija time picker-a sa malim delay-om
    setTimeout(() => {
        timePicker = new TimePicker();
        window.timePicker = timePicker; // Postavljamo kao globalnu varijablu
        console.log('Time picker inicijalizovan');
    }, 100);
    
    // Inicijalizacija planner-a
    planner = new AdminPlanner();
    console.log('Planner inicijalizovan');
    
    // Pronađi admin login dugme
    adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        console.log('Admin login dugme pronađeno');
    } else {
        console.log('Admin login dugme nije pronađeno');
    }
    
    // Dodaj event listener za calendar button direktno
    const showCalendarBtn = document.getElementById('showCalendarBtn');
    if (showCalendarBtn) {
        console.log('showCalendarBtn pronađen, dodajem event listener');
        showCalendarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Calendar button kliknut direktno');
            if (planner) {
                planner.showCalendarModal();
            }
        });
    } else {
        console.error('showCalendarBtn nije pronađen');
    }
});

// Funkcija za inicijalizaciju aplikacije nakon uspešne autentifikacije
// function initializeApp() {
//     console.log('Inicijalizujem aplikaciju...');
//     
//     // Inicijalizacija novog kalendara
//     calendar = new SimpleCalendar();
//     console.log('Kalendar inicijalizovan');
//     
//     // Inicijalizacija time picker-a sa malim delay-om
//     setTimeout(() => {
//         timePicker = new TimePicker();
//         window.timePicker = timePicker; // Postavljamo kao globalnu varijablu
//         console.log('Time picker inicijalizovan');
//     }, 100);
//     
//     // Inicijalizacija planner-a
//     planner = new AdminPlanner();
//     console.log('Planner inicijalizovan');
//     
//     // Dodaj event listener za calendar button direktno
//     const showCalendarBtn = document.getElementById('showCalendarBtn');
//     if (showCalendarBtn) {
//         console.log('showCalendarBtn pronađen, dodajem event listener');
//         showCalendarBtn.addEventListener('click', (e) => {
//             e.preventDefault();
//             console.log('Calendar button kliknut direktno');
//             if (planner) {
//                 planner.showCalendarModal();
//             }
//         });
//     } else {
//         console.error('showCalendarBtn nije pronađen');
//     }
//     
//     console.log('Aplikacija inicijalizovana');
// }
// Uklonjeno jer nije potrebna - aplikacija se inicijalizuje normalno u DOMContentLoaded

// Formatiranje telefona tokom kucanja
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        if (value.startsWith('381')) {
            value = '+' + value;
        } else if (value.startsWith('0')) {
            value = '+381' + value.substring(1);
        } else if (!value.startsWith('+')) {
            value = '+381' + value;
        }
    }
    e.target.value = value;
    });
}

// Automatsko fokusiranje na prvo polje
document.addEventListener('DOMContentLoaded', () => {
    const firstNameInput = document.getElementById('firstName');
    if (firstNameInput) {
        firstNameInput.focus();
    }
});