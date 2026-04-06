/**
 * Doctor Dashboard - HealthClo
 * Wired to backend API for overview stats, patient lists, and appointments.
 */

const API = '/api';

function getToken() {
    return localStorage.getItem('authToken') || '';
}

function authHeaders() {
    return {
        'Authorization': 'Bearer ' + getToken(),
        'Content-Type': 'application/json'
    };
}

// ============================================================
//  AUTH GUARD
// ============================================================
function checkAuth() {
    const token = getToken();
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!token || !user || user.role !== 'doctor') {
        window.location.href = '../login.html';
        return null;
    }
    return user;
}

// ============================================================
//  OVERVIEW STATS
// ============================================================
async function initDashboard() {
    try {
        const res = await fetch(`${API}/doctor/overview`, { headers: authHeaders() });
        if (!res.ok) return;
        const { overview } = await res.json();

        // Update stats grid (matched to IDs if available, else by order)
        const stats = document.querySelectorAll('.stat-card .stat-value');
        if (stats.length >= 4) {
            stats[0].textContent = overview.totalPatients || 0;
            stats[1].textContent = overview.totalRecords || 0;
            stats[2].textContent = overview.activeConsents || 0;
            // Stat 3 for appointments today (can be updated from appointments call)
        }

        // Show verification warning if not verified
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user && !user.is_verified) {
            showVerificationWarning();
        }
    } catch (e) {
        console.warn('Overview stats error:', e);
    }
}

function showVerificationWarning() {
    const main = document.querySelector('.main-content');
    if (!main) return;
    
    const warning = document.createElement('div');
    warning.className = 'alert alert-warning mb-4 d-flex align-items-center';
    warning.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
        <div>
            <strong>Account Pending Verification</strong><br>
            Your account is currently waiting for admin approval. You will have limited access until you are verified.
        </div>
    `;
    main.prepend(warning);
}

// ============================================================
//  MY PATIENTS (from Consents)
// ============================================================
async function loadPatients() {
    const tbody = document.querySelector('#patients-section table tbody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API}/doctor/patients`, { headers: authHeaders() });
        if (!res.ok) return;
        const { patients } = await res.json();

        if (patients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No authorized patients found</td></tr>';
            return;
        }

        tbody.innerHTML = patients.map(p => `
            <tr>
                <td><i class="bi bi-person-circle fs-5 me-2" style="color:var(--primary);"></i> ${p.first_name} ${p.last_name}</td>
                <td>${p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : '—'}</td>
                <td><span class="badge bg-info text-dark">Active Consent</span></td>
                <td>View Allowed</td>
                <td>—</td>
                <td>
                    <button class="btn btn-sm btn-primary-sm" onclick="viewPatientRecords('${p.id}')"><i class="bi bi-eye"></i> View Records</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Patient load error:', e);
    }
}

// ============================================================
//  APPOINTMENTS
// ============================================================
async function loadAppointments() {
    const tbody = document.querySelector('#appointments-section table tbody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API}/appointments/me`, { headers: authHeaders() });
        if (!res.ok) return;
        const { appointments } = await res.json();

        if (appointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No appointments found</td></tr>';
            return;
        }

        tbody.innerHTML = appointments.map(a => {
            const statusClass = { scheduled: 'bg-info', completed: 'bg-success', cancelled: 'bg-danger' }[a.status] || 'bg-secondary';
            return `
                <tr>
                    <td>${new Date(a.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>${a.patient_first_name} ${a.patient_last_name}</td>
                    <td>${a.reason || 'Checkup'}</td>
                    <td><span class="badge ${statusClass}">${a.status}</span></td>
                    <td>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">Action</button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="updateAppointment('${a.id}', 'completed')">Mark Completed</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="updateAppointment('${a.id}', 'cancelled')">Cancel</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error('Appointments load error:', e);
    }
}

async function updateAppointment(id, status) {
    try {
        const res = await fetch(`${API}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            loadAppointments();
        }
    } catch (e) {
        console.error(e);
    }
}

// ============================================================
//  NAVIGATION & UI
// ============================================================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const section = this.dataset.section;
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
            const selected = document.getElementById(`${section}-section`);
            if (selected) {
                selected.style.display = 'block';
                if (section === 'patients') loadPatients();
                if (section === 'appointments') loadAppointments();
            }
        });
    });
}

function viewPatientRecords(patientId) {
    // Navigate to records or handle view
    alert("Functionality to view patient specific records is coming in next release (Requires Consent check logic).");
}

// ============================================================
//  INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    initDashboard();
    setupNavigation();
});
