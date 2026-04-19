/**
 * Doctor Dashboard - HealthClo
 * Fully wired to backend API — profile, patients, records, appointments.
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
//  DOCTOR PROFILE — fetches fresh data from /api/auth/me
// ============================================================
async function loadDoctorProfile() {
    try {
        // Always fetch fresh from API so all registered fields are present
        const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
        if (!res.ok) {
            console.warn('Could not fetch profile from server, using localStorage.');
            populateProfileFromData(JSON.parse(localStorage.getItem('currentUser') || 'null'));
            return;
        }
        const { user } = await res.json();

        // Keep localStorage in sync with fresh data
        const cached = JSON.parse(localStorage.getItem('currentUser') || '{}');
        localStorage.setItem('currentUser', JSON.stringify({ ...cached, ...user }));

        populateProfileFromData(user);
    } catch (e) {
        console.warn('Profile load error:', e);
        populateProfileFromData(JSON.parse(localStorage.getItem('currentUser') || 'null'));
    }
}

function populateProfileFromData(user) {
    if (!user) return;

    // Update navbar name
    const navName = document.getElementById('navDoctorName');
    if (navName) navName.innerHTML = `<i class="bi bi-person-circle"></i> Dr. ${user.first_name} ${user.last_name}`;

    // Personal info
    setVal('profileFirstName', user.first_name || '');
    setVal('profileLastName', user.last_name || '');
    setVal('profileEmail', user.email || '');
    setVal('profilePhone', user.phone || 'Not provided');
    setVal('profileDob', user.dob || 'Not provided');

    // Professional info
    setVal('profileSpecialization', user.specialization || 'Not specified');
    setVal('profileLicenseNumber', user.license_number || 'Not provided');
    setVal('profileHospitalAffiliation', user.hospital_affiliation || 'Not provided');

    // Account dates
    setVal('profileCreatedAt', user.created_at ? new Date(user.created_at).toLocaleDateString() : '—');

    // Verification status
    const verBox = document.getElementById('verificationStatus');
    if (verBox) {
        if (user.is_verified) {
            verBox.className = 'alert alert-success mb-0';
            verBox.innerHTML = '<i class="bi bi-check-circle-fill"></i> <strong>Verified</strong> — Your profile is approved and visible to patients.';
        } else {
            verBox.className = 'alert alert-warning mb-0';
            verBox.innerHTML = '<i class="bi bi-clock-history"></i> <strong>Pending Verification</strong> — Your profile is under admin review. Some features are limited.';
        }
    }
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// ============================================================
//  OVERVIEW STATS
// ============================================================
async function initDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');

    // Show verification warning if pending
    if (user && !user.is_verified) showVerificationWarning();

    try {
        const res = await fetch(`${API}/doctor/overview`, { headers: authHeaders() });
        if (!res.ok) {
            showDashboardMessage('Could not load dashboard stats. Please try again.');
            return;
        }
        const { overview } = await res.json();

        setTextContent('stat-total-patients', overview.totalPatients ?? 0);
        setTextContent('stat-total-records', overview.totalRecords ?? 0);
        setTextContent('stat-active-consents', overview.activeConsents ?? 0);

        // Recent patients in overview table
        const recentTbody = document.getElementById('recent-patients-tbody');
        if (recentTbody) {
            if (overview.recentPatients && overview.recentPatients.length > 0) {
                recentTbody.innerHTML = overview.recentPatients.map(p => `
                    <tr>
                        <td><i class="bi bi-person-circle me-2 text-primary"></i> ${p.first_name} ${p.last_name}</td>
                        <td>${p.specialization_dept || '—'}</td>
                        <td>${p.consent_date ? new Date(p.consent_date).toLocaleDateString() : '—'}</td>
                        <td><span class="badge bg-success">Active Consent</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary-sm" onclick="showSection('patients')">
                                <i class="bi bi-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `).join('');
            } else {
                recentTbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-5">
                            <i class="bi bi-person-slash" style="font-size: 2rem; color: #ccc;"></i>
                            <p class="mt-2 text-muted">No patients have granted you access yet.</p>
                            <small class="text-muted">Ask patients to search for your name and grant consent.</small>
                        </td>
                    </tr>`;
            }
        }
    } catch (e) {
        console.warn('Overview stats error:', e);
        showDashboardMessage('Network error loading stats.');
    }
}

function setTextContent(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function showDashboardMessage(msg) {
    const main = document.querySelector('.main-content');
    if (!main) return;
    const el = document.createElement('div');
    el.className = 'alert alert-danger mb-4';
    el.innerHTML = `<i class="bi bi-exclamation-triangle"></i> ${msg}`;
    main.prepend(el);
    setTimeout(() => el.remove(), 5000);
}

function showVerificationWarning() {
    // Avoid duplicate banners
    if (document.getElementById('verif-warning-banner')) return;
    const main = document.querySelector('.main-content');
    if (!main) return;
    const warning = document.createElement('div');
    warning.id = 'verif-warning-banner';
    warning.className = 'alert alert-warning mb-4 d-flex align-items-center';
    warning.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
        <div>
            <strong>Account Pending Verification</strong><br>
            Your account is awaiting admin approval. Patient access is limited until verified.
        </div>
    `;
    main.prepend(warning);
}

// ============================================================
//  MY PATIENTS (from Consents)
// ============================================================
async function loadPatients() {
    const tbody = document.getElementById('patients-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div> Loading patients...</td></tr>`;

    try {
        const res = await fetch(`${API}/doctor/patients`, { headers: authHeaders() });
        if (!res.ok) throw new Error('API error');
        const { patients } = await res.json();

        if (patients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <i class="bi bi-inbox" style="font-size: 2rem; color: #ccc;"></i>
                        <p class="mt-3 text-muted"><strong>No patients yet</strong></p>
                        <small>Patients will appear here once they grant you access to their medical records.</small>
                    </td>
                </tr>`;
            return;
        }

        // Search filter
        const searchInput = document.getElementById('patient-search');
        if (searchInput) {
            searchInput.oninput = () => filterPatientTable(patients);
        }

        renderPatientRows(tbody, patients);
    } catch (e) {
        console.error('Patient load error:', e);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle"></i> Failed to load patients. Check your connection.</td></tr>`;
    }
}

function renderPatientRows(tbody, patients) {
    const searchTerm = (document.getElementById('patient-search')?.value || '').toLowerCase();
    const filtered = patients.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No patients match your search.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const age = p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : '—';
        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-person-circle fs-5 me-2" style="color:var(--primary);"></i>
                        <div>
                            <strong>${p.first_name} ${p.last_name}</strong><br>
                            <small class="text-muted">${p.blood_type ? 'Blood: ' + p.blood_type : ''}</small>
                        </div>
                    </div>
                </td>
                <td>${age}</td>
                <td><span class="badge bg-success">Active</span></td>
                <td><span class="badge bg-info text-dark">Full Access</span></td>
                <td>${p.consent_date ? new Date(p.consent_date).toLocaleDateString() : 'Active'}</td>
                <td>
                    <button class="btn btn-sm btn-primary-sm" onclick="viewPatientRecords('${p.id}', '${p.first_name} ${p.last_name}')">
                        <i class="bi bi-file-earmark-text"></i> Records
                    </button>
                </td>
            </tr>`;
    }).join('');
}

function filterPatientTable(patients) {
    const tbody = document.getElementById('patients-tbody');
    if (tbody) renderPatientRows(tbody, patients);
}

// ============================================================
//  MEDICAL RECORDS — view records for consented patients
// ============================================================
async function loadMedicalRecords() {
    const container = document.getElementById('doctor-files-by-dept');
    if (!container) return;

    container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted">Loading accessible records...</p></div>`;

    try {
        // First get list of consented patients
        const pRes = await fetch(`${API}/doctor/patients`, { headers: authHeaders() });
        if (!pRes.ok) throw new Error('Could not load patients');
        const { patients } = await pRes.json();

        if (patients.length === 0) {
            container.innerHTML = `
                <div class="data-table p-5 text-center">
                    <i class="bi bi-file-earmark-lock" style="font-size: 3rem; color:#ccc;"></i>
                    <h5 class="mt-3 text-muted">No Records Accessible</h5>
                    <p class="text-muted">You can only view medical records of patients who have granted you consent.</p>
                </div>`;
            return;
        }

        // Fetch records for each consented patient
        const allRecords = [];
        for (const patient of patients) {
            try {
                const rRes = await fetch(`${API}/records/patient/${patient.id}`, { headers: authHeaders() });
                if (rRes.ok) {
                    const { records } = await rRes.json();
                    records.forEach(r => { r._patientName = `${patient.first_name} ${patient.last_name}`; });
                    allRecords.push(...records);
                }
            } catch (_) { /* skip individual failures */ }
        }

        if (allRecords.length === 0) {
            container.innerHTML = `
                <div class="data-table p-5 text-center">
                    <i class="bi bi-folder2-open" style="font-size: 3rem; color:#ccc;"></i>
                    <h5 class="mt-3 text-muted">No Records Yet</h5>
                    <p class="text-muted">Your ${patients.length} consented patient(s) haven't uploaded any records yet.</p>
                </div>`;
            return;
        }

        // Group by department
        const byDept = {};
        allRecords.forEach(r => {
            const dept = r.department || 'Unclassified';
            if (!byDept[dept]) byDept[dept] = [];
            byDept[dept].push(r);
        });

        container.innerHTML = Object.entries(byDept).map(([dept, records]) => `
            <div class="data-table mb-4">
                <div class="p-3 border-bottom d-flex align-items-center">
                    <i class="bi bi-folder-fill me-2" style="color:var(--primary);"></i>
                    <strong>${dept}</strong>
                    <span class="badge bg-secondary ms-2">${records.length} file${records.length > 1 ? 's' : ''}</span>
                </div>
                <table class="table mb-0">
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Patient</th>
                            <th>Uploaded</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(r => `
                            <tr>
                                <td><i class="bi bi-file-earmark-text me-2 text-primary"></i>${r.original_name || r.filename || 'Record'}</td>
                                <td>${r._patientName}</td>
                                <td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                                <td>
                                    <a href="/api/records/${r.id}/download" class="btn btn-sm btn-outline-primary" target="_blank">
                                        <i class="bi bi-download"></i> Download
                                    </a>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`).join('');
    } catch (e) {
        console.error('Medical records load error:', e);
        container.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> Failed to load records. Please try again.</div>`;
    }
}

function viewPatientRecords(patientId, patientName) {
    // Switch to medical records section and highlight or filter by patient
    showSection('files');
    // Small delay to let the section render, then optionally highlight
    setTimeout(() => {
        const header = document.querySelector('#files-section .dashboard-header p');
        if (header) header.textContent = `Showing records for: ${patientName}`;
    }, 200);
}

// ============================================================
//  APPOINTMENTS
// ============================================================
async function loadAppointments() {
    const tbody = document.getElementById('appointments-overview-tbody');

    try {
        const res = await fetch(`${API}/appointments/me`, { headers: authHeaders() });
        if (!res.ok) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Appointments feature not yet enabled.</td></tr>';
            return;
        }
        const { appointments } = await res.json();

        const appointmentRows = appointments.length === 0
            ? '<tr><td colspan="5" class="text-center py-4 text-muted">No upcoming appointments</td></tr>'
            : appointments.slice(0, 10).map(a => {
                const statusClass = { scheduled: 'bg-info', completed: 'bg-success', cancelled: 'bg-danger' }[a.status] || 'bg-secondary';
                return `
                    <tr>
                        <td>${new Date(a.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td>${a.patient_first_name || '—'} ${a.patient_last_name || ''}</td>
                        <td>${a.reason || 'Checkup'}</td>
                        <td><span class="badge ${statusClass}">${a.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-success me-1" onclick="updateAppointment('${a.id}', 'completed')">Done</button>
                            <button class="btn btn-sm btn-danger" onclick="updateAppointment('${a.id}', 'cancelled')">Cancel</button>
                        </td>
                    </tr>`;
            }).join('');

        if (tbody) tbody.innerHTML = appointmentRows;

        // Update stat
        setTextContent('stat-appointments-today', appointments.filter(a => {
            const d = new Date(a.starts_at);
            const today = new Date();
            return d.toDateString() === today.toDateString() && a.status === 'scheduled';
        }).length);

    } catch (e) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Appointments not available.</td></tr>';
    }
}

async function updateAppointment(id, status) {
    try {
        const res = await fetch(`${API}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ status })
        });
        if (res.ok) loadAppointments();
    } catch (e) {
        console.error(e);
    }
}

// ============================================================
//  NAVIGATION
// ============================================================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            const section = this.dataset.section;
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
            const selected = document.getElementById(`${section}-section`);
            if (selected) {
                selected.style.display = 'block';
                if (section === 'patients') loadPatients();
                if (section === 'files') loadMedicalRecords();
                if (section === 'appointments') loadAppointments();
                if (section === 'profile') loadDoctorProfile();
                if (section === 'overview') initDashboard();
            }
        });
    });

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.querySelector('.sidebar-nav');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
        });
        if (overlay) overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

function showSection(section) {
    const navLink = document.querySelector(`.sidebar-nav .nav-link[data-section="${section}"]`);
    if (navLink) navLink.click();
}

// ============================================================
//  ACCOUNT MANAGEMENT & PROFILE SAVING
// ============================================================
async function saveProfile() {
    const btn = document.getElementById('saveProfileBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...';
    }
    
    const firstName = document.getElementById('profileFirstName')?.value || '';
    const lastName = document.getElementById('profileLastName')?.value || '';
    const dob = document.getElementById('profileDob')?.value || '';
    const email = document.getElementById('profileEmail')?.value || '';
    const phone = document.getElementById('profilePhone')?.value || '';
    const specialization = document.getElementById('profileSpecialization')?.value || '';
    const licenseNumber = document.getElementById('profileLicenseNumber')?.value || '';
    const hospitalAffiliation = document.getElementById('profileHospitalAffiliation')?.value || '';

    const payload = {
        firstName, lastName, dob, email, phone, specialization, licenseNumber, hospitalAffiliation
    };

    try {
        const res = await fetch(`${API}/auth/profile`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            alert('✅ Profile updated successfully!');
            if (data.user) {
                // Update local storage and UI
                const cached = JSON.parse(localStorage.getItem('currentUser') || '{}');
                localStorage.setItem('currentUser', JSON.stringify({ ...cached, ...data.user }));
                populateProfileFromData(data.user);
            }
        } else {
            alert('❌ ' + (data.error || 'Failed to update profile'));
        }
    } catch (e) {
        console.error('Network error saving profile', e);
        alert('❌ Network error saving profile');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg"></i> Save Changes';
        }
    }
}

async function showDeleteAccountModal() {
    const confirmed = confirm(
        '⚠️ WARNING: This will permanently delete your account and ALL associated data.\n\n' +
        'This action CANNOT be undone.\n\n' +
        'Click OK to proceed, or Cancel to keep your account.'
    );
    if (!confirmed) return;

    const password = prompt('Enter your current password to confirm deletion:');
    if (!password) return;

    try {
        const res = await fetch(`${API}/auth/delete-account`, {
            method: 'DELETE',
            headers: authHeaders(),
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            alert('✅ Account deleted successfully.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        } else {
            const data = await res.json();
            alert('❌ ' + (data.error || 'Failed to delete account'));
        }
    } catch (e) {
        alert('❌ Network error. Please try again.');
    }
}

async function showChangePasswordModal() {
    const currentPassword = prompt('Enter your current password:');
    if (!currentPassword) return;

    const newPassword = prompt('Enter your new password (min 8 characters):');
    if (!newPassword || newPassword.length < 8) {
        alert('❌ Password must be at least 8 characters');
        return;
    }

    const confirmPassword = prompt('Confirm new password:');
    if (confirmPassword !== newPassword) {
        alert('❌ Passwords do not match');
        return;
    }

    try {
        const res = await fetch(`${API}/auth/change-password`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (res.ok) {
            alert('✅ Password changed successfully');
        } else {
            alert('❌ ' + (data.error || 'Failed to change password'));
        }
    } catch (e) {
        alert('❌ Network error. Please try again.');
    }
}

function downloadAccountData() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) return;
    const data = { exportDate: new Date().toISOString(), profile: user };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthclo-doctor-${user.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function logoutDoctor() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '../login.html';
    }
}

// ============================================================
//  INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    loadDoctorProfile();
    initDashboard();
    loadAppointments();
    setupNavigation();
});
