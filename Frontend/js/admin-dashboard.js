/**
 * Admin Dashboard - HealthClo
 * Manages system overview, user verification, and doctor management.
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
    if (!token || !user || user.role !== 'admin') {
        window.location.href = '../login.html';
        return null;
    }
    return user;
}

// ============================================================
//  OVERVIEW & STATS
// ============================================================
async function loadOverview() {
    try {
        const res = await fetch(`${API}/admin/overview`, { headers: authHeaders() });
        if (!res.ok) return;
        const { overview } = await res.json();

        // Update basic stats
        const totalFiles = document.getElementById('total-files');
        if (totalFiles) totalFiles.textContent = overview.totalRecords || 0;

        const activeUsers = document.getElementById('active-users');
        if (activeUsers) activeUsers.textContent = overview.totalUsers || 0;

        // Pending doctors counts (will be updated specifically)
        await loadPendingDoctorsCount(overview);
    } catch (e) {
        console.warn('Overview stats error:', e);
    }
}

async function loadPendingDoctorsCount(overview) {
    try {
        const res = await fetch(`${API}/admin/doctors/pending`, { headers: authHeaders() });
        if (res.ok) {
            const { pending } = await res.json();
            const el = document.getElementById('pending-reviews');
            if (el) el.textContent = pending.length;
        }
    } catch (e) {
        console.warn('Pending count load error:', e);
    }
}

// ============================================================
//  LOAD DOCTORS & USERS
// ============================================================
async function loadAllUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    try {
        const res = await fetch(`${API}/admin/users`, { headers: authHeaders() });
        if (!res.ok) return;
        const { users } = await res.json();

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => {
            const statusClass = u.is_verified ? 'bg-success' : 'bg-warning text-dark';
            const statusLabel = u.is_verified ? 'Verified' : 'Pending';
            const roleClass = { patient: 'bg-info text-dark', doctor: 'bg-primary' }[u.role] || 'bg-secondary';

            let actions = `<button class="btn btn-sm btn-outline-danger" title="Delete User"><i class="bi bi-trash"></i></button>`;
            if (u.role === 'doctor' && !u.is_verified) {
                actions = `<button type="button" class="btn btn-sm btn-success me-2" onclick="verifyDoctor(event, '${u.id}')" title="Verify Doctor"><i class="bi bi-check-circle"></i> Verify</button>` + actions;
            }

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-person-circle fs-5 me-2" style="color:var(--primary);"></i>
                            <div><strong>${u.first_name} ${u.last_name}</strong><br><small class="text-muted">${u.email || u.phone}</small></div>
                        </div>
                    </td>
                    <td><span class="badge ${roleClass}">${u.role.toUpperCase()}</span></td>
                    <td>—</td>
                    <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                    <td>${new Date(u.created_at).toLocaleDateString()}</td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error('User load error:', e);
    }
}

// ============================================================
//  DOCTOR VERIFICATION logic
// ============================================================
async function verifyDoctor(event, id) {
    if (event) event.preventDefault();
    console.log('Attempting to verify doctor:', id);
    
    // UI Feedback: Disable button temporarily
    const btn = event ? event.currentTarget : null;
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verifying...';
    }

    try {
        const res = await fetch(`${API}/admin/doctors/${id}/verify`, {
            method: 'POST',
            headers: authHeaders()
        });
        
        const data = await res.json().catch(() => ({}));
        
        if (res.ok) {
            console.log('Doctor verified successfully:', data);
            if (typeof showToast === 'function') showToast('Doctor verified successfully!', 'success');
            else alert('Doctor verified successfully!');
            
            // Re-load data to sync UI
            await loadAllUsers();
            await loadOverview();
        } else {
            console.error('Verification failed:', data);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
            alert(data.error || 'Verification failed');
        }
    } catch (e) {
        console.error('Network error during verification:', e);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
        alert('Verification failed: Network error or server is down. Please check your connection.');
    }
}

// ============================================================
//  SIDEBAR NAVIGATION
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
            if (selected) selected.style.display = 'block';

            if (section === 'users') loadAllUsers();
            if (section === 'audit') loadAuditLogs();
        });
    });
}

// ============================================================
//  AUDIT LOGS
// ============================================================
async function loadAuditLogs() {
    const tbody = document.getElementById('audit-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading logs...</td></tr>';

    try {
        const res = await fetch(`${API}/admin/audit-logs`, { headers: authHeaders() });
        if (!res.ok) return;
        const { logs } = await res.json();

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No audit logs found</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(l => {
            const time = new Date(l.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
            return `
                <tr>
                    <td><small class="text-muted">${time}</small></td>
                    <td><strong>${l.actor_name || 'System'}</strong><br><small class="text-muted">${l.actor_id}</small></td>
                    <td><span class="badge bg-secondary-subtle text-dark border">${l.action}</span></td>
                    <td><small>${l.target_id || '—'}</small></td>
                    <td><span class="badge bg-success-subtle text-success">SUCCESS</span></td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error('Audit load error:', e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Failed to load logs</td></tr>';
    }
}

// ============================================================
//  INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    loadOverview();
    setupNavigation();
});
