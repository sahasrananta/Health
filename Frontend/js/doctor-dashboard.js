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
//  DOCTOR PROFILE LOADING
// ============================================================
async function loadDoctorProfile() {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!user) return;

        // Update navbar name
        const navName = document.getElementById('navDoctorName');
        if (navName) {
            navName.textContent = `${user.first_name} ${user.last_name}`;
        }

        // Update profile section
        document.getElementById('profileFirstName').value = user.first_name || '';
        document.getElementById('profileLastName').value = user.last_name || '';
        document.getElementById('profileEmail').value = user.email || user.phone || '';
        document.getElementById('profilePhone').value = user.phone || 'N/A';
        document.getElementById('profileSpecialization').value = user.specialization || 'Not specified';
        document.getElementById('profileLicenseNumber').value = user.license_number || 'Not provided';
        document.getElementById('profileHospitalAffiliation').value = user.hospital_affiliation || 'Not provided';

        // Verification status
        const verificationStatus = document.getElementById('verificationStatus');
        if (user.is_verified) {
            verificationStatus.innerHTML = '<i class="bi bi-check-circle-fill" style="color: #28a745;"></i> <strong style="color: #28a745;">Verified</strong> - Your profile is approved and visible to patients.';
        } else {
            verificationStatus.innerHTML = '<i class="bi bi-clock-history" style="color: #ffc107;"></i> <strong style="color: #ffc107;">Pending Verification</strong> - Your profile is under admin review.';
        }
    } catch (e) {
        console.warn('Profile loading error:', e);
    }
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
    const tbody = document.querySelector('#patients-tbody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API}/doctor/patients`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to load patients');
        const { patients } = await res.json();

        if (patients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <i class="bi bi-inbox" style="font-size: 2rem; color: #ccc;"></i>
                        <p class="mt-3 text-muted"><strong>No patients yet</strong></p>
                        <small>Patients will appear here once they grant you access to their medical records.</small>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = patients.map(p => `
            <tr>
                <td><i class="bi bi-person-circle fs-5 me-2" style="color:var(--primary);"></i> ${p.first_name} ${p.last_name}</td>
                <td>${p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : '—'}</td>
                <td><span class="badge bg-success">Active Consent</span></td>
                <td><span class="badge bg-info text-dark">Full Access</span></td>
                <td>${new Date().toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary-sm" onclick="viewPatientRecords('${p.id}')">
                        <i class="bi bi-eye"></i> View Records
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Patient load error:', e);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle"></i> Error loading patients
                </td>
            </tr>
        `;
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
//  PROFILE MANAGEMENT
// ============================================================
async function showDeleteAccountModal() {
    const confirmed = confirm(
        '⚠️ WARNING: This will permanently delete your account and all associated data.\n\n' +
        'This action CANNOT be undone.\n\n' +
        'Click OK to proceed with deletion, or Cancel to keep your account.'
    );

    if (!confirmed) return;

    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) return;

    try {
        const res = await fetch(`${API}/auth/delete-account`, {
            method: 'DELETE',
            headers: authHeaders(),
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            alert('✅ Account deleted successfully. Redirecting to homepage...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        } else {
            const data = await res.json();
            alert('❌ Error: ' + (data.error || 'Failed to delete account'));
        }
    } catch (e) {
        console.error('Delete account error:', e);
        alert('❌ Error deleting account. Please try again.');
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

    const confirmPassword = prompt('Confirm your new password:');
    if (confirmPassword !== newPassword) {
        alert('❌ Passwords do not match');
        return;
    }

    try {
        const res = await fetch(`${API}/auth/change-password`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (res.ok) {
            alert('✅ Password changed successfully');
        } else {
            const data = await res.json();
            alert('❌ Error: ' + (data.error || 'Failed to change password'));
        }
    } catch (e) {
        console.error('Change password error:', e);
        alert('❌ Error changing password. Please try again.');
    }
}

function downloadAccountData() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) return;

    const data = {
        exportDate: new Date().toISOString(),
        profile: user,
        note: 'This is an export of your account data in JSON format.'
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthclo-account-${user.id}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert('✅ Account data downloaded successfully');
}

function logoutDoctor() {
    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) {
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
    setupNavigation();
});
