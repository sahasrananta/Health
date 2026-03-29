/**
 * Patient Dashboard JavaScript
 * Fully wired to the backend API.
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
    if (!token || !user || user.role !== 'patient') {
        window.location.href = '../login.html';
        return null;
    }
    return user;
}

// ============================================================
//  TOAST (simple)
// ============================================================
function toast(msg, type = 'success') {
    if (typeof showToast === 'function') { showToast(msg, type); return; }
    alert(msg);
}

// ============================================================
//  POPULATE USER NAME IN NAVBAR
// ============================================================
function populateUserName(user) {
    const nameEl = document.getElementById('navUserName');
    if (nameEl && user) {
        nameEl.textContent = user.first_name || 'Patient';
    }
}

// ============================================================
//  LOAD AND RENDER PROFILE
// ============================================================
async function initProfile() {
    try {
        const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
        if (!res.ok) return;
        const { user } = await res.json();
        
        // Populate inputs if they exist
        const fnameEl = document.getElementById('profileFullName');
        if (fnameEl) fnameEl.value = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        
        const dobEl = document.getElementById('profileDob');
        if (dobEl) dobEl.value = user.dob || '';

        const bloodEl = document.getElementById('profileBlood');
        if (bloodEl && user.blood_type) bloodEl.value = user.blood_type;

        const emailEl = document.getElementById('profileEmail');
        if (emailEl) emailEl.value = user.email || '';

        const phoneEl = document.getElementById('profilePhone');
        if (phoneEl) phoneEl.value = user.phone || '';
        
        populateUserName(user);
        // update localstorage
        localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (e) {
        console.warn('Profile load error:', e);
    }
}

async function saveProfile() {
    const btn = document.getElementById('saveProfileBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...'; }
    
    const fullName = (document.getElementById('profileFullName')?.value || '').trim();
    const [firstName, ...lastArr] = fullName.split(' ');
    const lastName = lastArr.join(' ');
    
    const payload = {
        firstName: firstName || '',
        lastName: lastName || '',
        dob: document.getElementById('profileDob')?.value || '',
        bloodType: document.getElementById('profileBlood')?.value || '',
        email: document.getElementById('profileEmail')?.value || '',
        phone: document.getElementById('profilePhone')?.value || ''
    };

    try {
        const res = await fetch(`${API}/auth/profile`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            toast('Profile updated successfully!', 'success');
            if (data.user) {
                populateUserName(data.user);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
        } else {
            toast(data.error || 'Failed to update profile', 'error');
        }
    } catch (e) {
        toast('Network error saving profile', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Save Changes'; }
    }
}

// ============================================================
//  LOAD OVERVIEW STATS FROM API
// ============================================================
async function loadStats() {
    try {
        const [recRes, conRes] = await Promise.all([
            fetch(`${API}/records/patients/me`, { headers: { 'Authorization': 'Bearer ' + getToken() } }),
            fetch(`${API}/consents/mine`, { headers: { 'Authorization': 'Bearer ' + getToken() } })
        ]);

        if (recRes.ok) {
            const { records } = await recRes.json();
            const el = document.getElementById('stat-total-records');
            if (el) el.textContent = records.length;
        }

        if (conRes.ok) {
            const { consents } = await conRes.json();
            const active = consents.filter(c => c.isActive);
            const pending = consents.filter(c => !c.isActive && !c.revoked_at);

            const elDoctors = document.getElementById('stat-active-doctors');
            if (elDoctors) elDoctors.textContent = active.length;

            const elConsents = document.getElementById('stat-consent-requests');
            if (elConsents) elConsents.textContent = pending.length;
        }
    } catch (e) {
        console.warn('Stats load error:', e);
    }
}

// ============================================================
//  MY RECORDS — load and render by department
// ============================================================
async function loadAndRenderRecords() {
    const container = document.getElementById('patient-records');
    if (!container) return;

    container.innerHTML = '<p style="color:var(--text-muted);padding:20px;">Loading records…</p>';

    try {
        const res = await fetch(`${API}/records/patients/me`, {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });

        if (!res.ok) {
            container.innerHTML = '<p style="color:var(--danger);padding:20px;">Failed to load records.</p>';
            return;
        }

        const { records } = await res.json();

        if (records.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:48px;color:var(--text-muted);">
                    <i class="bi bi-inbox" style="font-size:3rem;"></i>
                    <p class="mt-3">No medical records yet. Upload your first record!</p>
                </div>`;
            return;
        }

        // Group by department
        const byDept = {};
        records.forEach(r => {
            if (!byDept[r.department]) byDept[r.department] = [];
            byDept[r.department].push(r);
        });

        const deptIcons = {
            'Cardiology': 'bi-heart-pulse-fill',
            'Neurology': 'bi-brain',
            'Orthopedics': 'bi-bandaid-fill',
            'Radiology': 'bi-camera-fill',
            'General': 'bi-clipboard2-pulse-fill',
            'Psychiatry': 'bi-emoji-smile-fill',
            'Pathology': 'bi-droplet-fill',
            'Oncology': 'bi-shield-fill',
        };

        let html = '';
        Object.entries(byDept).forEach(([dept, files]) => {
            const icon = deptIcons[dept] || 'bi-folder-fill';
            html += `
            <div class="dept-container mb-4">
                <div class="dept-section">
                    <div class="dept-header">
                        <div class="dept-header-icon"><i class="bi ${icon}"></i></div>
                        <div>
                            <h3>${dept}</h3>
                            <small>${files.length} record${files.length !== 1 ? 's' : ''}</small>
                        </div>
                    </div>
                    <div class="dept-content">
                        <div class="file-list">
                            ${files.map(file => `
                                <div class="file-item">
                                    <div class="file-icon"><i class="bi bi-file-earmark-medical-fill"></i></div>
                                    <div class="file-info">
                                        <span class="file-name">${file.file_name}</span>
                                        <span class="file-meta">
                                            ${file.department} · 
                                            ${new Date(file.created_at).toLocaleDateString()} ·
                                            Confidence: ${Math.round(file.confidence * 100)}%
                                        </span>
                                        ${file.description ? `<span class="file-meta" style="font-style:italic;">${file.description}</span>` : ''}
                                    </div>
                                    <div class="file-actions">
                                        <a href="${API}/records/${file.id}/download"
                                           onclick="this.href=''; downloadRecord('${file.id}'); return false;"
                                           class="btn btn-sm btn-info" title="Download">
                                            <i class="bi bi-download"></i>
                                        </a>
                                        <button class="btn btn-sm btn-danger" onclick="deleteRecord('${file.id}')" title="Delete">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color:var(--danger);padding:20px;">Network error loading records.</p>';
    }
}

// ============================================================
//  DOWNLOAD RECORD
// ============================================================
async function downloadRecord(recordId) {
    try {
        const res = await fetch(`${API}/records/${recordId}/download`, {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        if (!res.ok) { toast('Download failed', 'error'); return; }
        const blob = await res.blob();
        const cd = res.headers.get('Content-Disposition') || '';
        const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        const fname = match ? match[1].replace(/['"]/g, '') : 'record';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fname; a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error(e);
        toast('Download error', 'error');
    }
}

// ============================================================
//  DELETE RECORD
// ============================================================
async function deleteRecord(recordId) {
    if (!confirm('Delete this record permanently?')) return;
    try {
        const res = await fetch(`${API}/records/${recordId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        if (res.ok) {
            toast('Record deleted', 'success');
            loadAndRenderRecords();
            loadStats();
        } else {
            const data = await res.json().catch(() => ({}));
            toast(data.error || 'Delete failed', 'error');
        }
    } catch (e) {
        toast('Network error', 'error');
    }
}

// ============================================================
//  CAMERA SCANNING
// ============================================================
let stream = null;
let capturedBlob = null;

async function initCamera() {
    const video = document.getElementById('scan-video');
    const ui = document.getElementById('camera-scan-ui');
    const zone = document.getElementById('upload-zone');
    const startBtn = document.getElementById('start-scan-btn');

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        ui.style.display = 'block';
        zone.style.display = 'none';
        if (startBtn) startBtn.style.display = 'none';
    } catch (e) {
        console.error('Camera access denied:', e);
        toast('Camera access denied. Please allow camera permissions.', 'error');
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    document.getElementById('camera-scan-ui').style.display = 'none';
    document.getElementById('upload-zone').style.display = 'block';
    const startBtn = document.getElementById('start-scan-btn');
    if (startBtn) startBtn.style.display = 'inline-block';
}

function capturePhoto() {
    const video = document.getElementById('scan-video');
    const canvas = document.getElementById('scan-canvas');
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
        capturedBlob = blob;
        stopCamera();

        // Show a "Captured" message in the upload zone
        const zone = document.getElementById('upload-zone');
        zone.innerHTML = `
            <i class="bi bi-camera-fill" style="color:var(--success);"></i>
            <strong>Photo Captured!</strong>
            <p>Ready to upload and classify. Click to clear and pick a different file.</p>
        `;
        zone.onclick = () => {
            capturedBlob = null;
            zone.innerHTML = `
                <i class="bi bi-cloud-arrow-up"></i>
                <strong>Click to upload or drag & drop</strong>
                <p>PDF, JPG, PNG (Max 15MB) — AI will auto-classify</p>
                <input type="file" id="fileInput2" style="display:none;" accept=".pdf,.jpg,.jpeg,.png">
            `;
            zone.onclick = () => document.getElementById('fileInput2').click();
        };
    }, 'image/jpeg', 0.9);
}

// ============================================================
//  OCR PROCESSING
// ============================================================
async function runOCR(fileOrBlob) {
    if (!window.Tesseract) return '';

    const status = document.getElementById('ocr-status');
    const msg = document.getElementById('ocr-message');
    const bar = document.getElementById('ocr-progress-bar');

    status.style.display = 'block';
    msg.textContent = 'AI is reading document... 0%';
    bar.style.width = '0%';

    try {
        const result = await Tesseract.recognize(fileOrBlob, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const pct = Math.round(m.progress * 100);
                    msg.textContent = `AI is reading document... ${pct}%`;
                    bar.style.width = `${pct}%`;
                }
            }
        });
        return result?.data?.text || '';
    } catch (e) {
        console.warn('OCR failed:', e);
        return '';
    } finally {
        status.style.display = 'none';
    }
}

// ============================================================
//  UPLOAD RECORD
// ============================================================
async function uploadRecord() {
    const fileInput = document.getElementById('fileInput2');
    const descInput = document.getElementById('uploadDescription');
    const btn = document.getElementById('uploadBtn');

    let file = null;
    if (capturedBlob) {
        file = new File([capturedBlob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
    } else if (fileInput && fileInput.files && fileInput.files.length > 0) {
        file = fileInput.files[0];
    }

    if (!file) {
        toast('Please select a file or capture a photo', 'error');
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Processing…'; }

    try {
        // Run OCR if it's an image
        let ocrText = '';
        if (file.type.startsWith('image/')) {
            ocrText = await runOCR(file);
        }

        const formData = new FormData();
        formData.append('file', file);
        if (descInput && descInput.value.trim()) {
            formData.append('description', descInput.value.trim());
        }
        if (ocrText) {
            formData.append('ocrText', ocrText);
        }

        if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Uploading…';

        const res = await fetch(`${API}/records/patients/me`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            body: formData
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            toast(`Uploaded and AI-classified to "${data.record.department}"!`, 'success');
            // Reset state
            capturedBlob = null;
            if (fileInput) fileInput.value = '';
            const zone = document.getElementById('upload-zone');
            if (zone) {
                zone.innerHTML = `
                    <i class="bi bi-cloud-arrow-up"></i>
                    <strong>Click to upload or drag & drop</strong>
                    <p>PDF, JPG, PNG (Max 15MB) — AI will auto-classify</p>
                    <input type="file" id="fileInput2" style="display:none;" accept=".pdf,.jpg,.jpeg,.png">
                `;
                zone.onclick = () => document.getElementById('fileInput2').click();
            }
            if (descInput) descInput.value = '';

            loadStats();
            setTimeout(() => showSection('records'), 1200);
        } else {
            toast(data.error || 'Upload failed', 'error');
        }
    } catch (e) {
        console.error(e);
        toast('Network error during upload', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-cloud-arrow-up-fill"></i> Upload & Auto-Classify'; }
    }
}

// ============================================================
//  CONSENT — load and render
// ============================================================
async function loadAndRenderConsents() {
    const tbody = document.getElementById('consent-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">Loading…</td></tr>';

    try {
        const res = await fetch(`${API}/consents/mine`, {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });

        if (!res.ok) {
            tbody.innerHTML = '<tr><td colspan="6" style="color:var(--danger);text-align:center;">Failed to load consents.</td></tr>';
            return;
        }

        const { consents } = await res.json();

        if (consents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No consent records yet. Grant a doctor access to get started.</td></tr>';
            return;
        }

        tbody.innerHTML = consents.map(c => {
            const status = c.revoked_at
                ? '<span class="badge bg-danger">Revoked</span>'
                : c.isActive
                    ? '<span class="badge bg-success">Active</span>'
                    : '<span class="badge bg-warning text-dark">Expired</span>';

            const revokeBtn = (!c.revoked_at && c.isActive)
                ? `<button class="btn btn-sm btn-danger" onclick="revokeConsent('${c.id}')"><i class="bi bi-x-circle"></i> Revoke</button>`
                : '—';

            const accessLabel = { full: 'Full Access', view: 'View Only', limited: 'Limited' }[c.access_level] || c.access_level;
            const grantedDate = new Date(c.created_at).toLocaleDateString();
            const expiresDate = c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never';

            return `<tr>
                <td><i class="bi bi-person-circle" style="color:var(--primary);"></i> Dr. ${c.doctor_first_name} ${c.doctor_last_name}</td>
                <td>${status}</td>
                <td><span class="badge bg-info text-dark">${accessLabel}</span></td>
                <td>${grantedDate}</td>
                <td>${expiresDate}</td>
                <td>${revokeBtn}</td>
            </tr>`;
        }).join('');

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="color:var(--danger);text-align:center;">Network error.</td></tr>';
    }
}

async function revokeConsent(consentId) {
    if (!confirm('Revoke access for this doctor?')) return;
    try {
        const res = await fetch(`${API}/consents/${consentId}/revoke`, {
            method: 'PATCH',
            headers: authHeaders()
        });
        if (res.ok) {
            toast('Consent revoked successfully', 'success');
            loadAndRenderConsents();
            loadStats();
        } else {
            const data = await res.json().catch(() => ({}));
            toast(data.error || 'Revoke failed', 'error');
        }
    } catch (e) {
        toast('Network error', 'error');
    }
}

// ============================================================
//  GRANT CONSENT MODAL
// ============================================================
async function grantConsent() {
    const emailInput = document.getElementById('grantDoctorEmail');
    const accessSelect = document.getElementById('grantAccessLevel');
    const expiresInput = document.getElementById('grantExpires');

    const email = emailInput ? emailInput.value.trim() : '';
    if (!email) { toast('Please enter a doctor email', 'error'); return; }

    // First look up doctor by email
    try {
        const lookupRes = await fetch(`${API}/auth/me`, {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        // We can't look up by email directly from the public API; guide the user to use doctor ID
        // Instead, post to consents with email approach is not supported by current API.
        // So we look up via search — if that endpoint doesn't exist, show a message.
        toast('Please ask your doctor to share their Doctor ID, then use the ID below.', 'info');
    } catch (e) {
        toast('Network error', 'error');
    }
}

// ============================================================
//  GRANT CONSENT via Doctor ID
// ============================================================
async function grantConsentById() {
    const doctorIdInput = document.getElementById('grantDoctorId');
    const accessSelect = document.getElementById('grantAccessLevel');
    const expiresInput = document.getElementById('grantExpires');

    const doctorId = doctorIdInput ? doctorIdInput.value.trim() : '';
    if (!doctorId) { toast('Please enter the Doctor ID', 'error'); return; }

    const payload = {
        doctorId,
        accessLevel: accessSelect ? accessSelect.value : 'view',
        expiresAt: expiresInput && expiresInput.value ? new Date(expiresInput.value).toISOString() : null
    };

    try {
        const res = await fetch(`${API}/consents`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            toast(data.updated ? 'Consent updated successfully' : 'Consent granted successfully', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addDoctorModal'));
            if (modal) modal.hide();
            loadAndRenderConsents();
            loadStats();
        } else {
            toast(data.error || 'Failed to grant consent', 'error');
        }
    } catch (e) {
        toast('Network error', 'error');
    }
}

// ============================================================
//  LOGOUT
// ============================================================
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '../login.html';
}

// ============================================================
//  INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const user = checkAuth();
    if (!user) return;

    populateUserName(user);
    initProfile();
    loadStats();

    // Wire upload button
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', uploadRecord);
    }
});
