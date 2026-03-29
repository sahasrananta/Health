/**
 * HealthClo — Authentication Module
 * Handles sign-in, registration, OTP, doctor verification, and password strength
 */

// ============================================================
//  TOAST NOTIFICATION SYSTEM
// ============================================================
function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;

    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill',
        warning: 'bi-exclamation-circle-fill'
    };

    toast.innerHTML = `
        <i class="bi ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="bi bi-x-lg"></i>
        </button>
    `;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));

    // Auto-dismiss after 4s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}


// ============================================================
//  LOGIN PAGE — AUTH MODE TOGGLE (Email / Phone)
// ============================================================
function toggleAuthMode(mode) {
    const emailSection = document.getElementById('emailLoginSection');
    const phoneSection = document.getElementById('phoneLoginSection');
    const emailTab = document.getElementById('emailTab');
    const phoneTab = document.getElementById('phoneTab');

    if (!emailSection || !phoneSection) return;

    if (mode === 'email') {
        emailSection.style.display = 'block';
        phoneSection.style.display = 'none';
        emailTab.classList.add('active');
        phoneTab.classList.remove('active');
    } else {
        emailSection.style.display = 'none';
        phoneSection.style.display = 'block';
        phoneTab.classList.add('active');
        emailTab.classList.remove('active');
    }
}


// ============================================================
//  REGISTRATION — AUTH MODE TOGGLE (Email / Phone)
// ============================================================
function toggleRegAuthMode(mode) {
    const emailSection = document.getElementById('regEmailSection');
    const phoneSection = document.getElementById('regPhoneSection');
    const emailTab = document.getElementById('regEmailTab');
    const phoneTab = document.getElementById('regPhoneTab');

    if (!emailSection || !phoneSection) return;

    if (mode === 'email') {
        emailSection.style.display = 'block';
        phoneSection.style.display = 'none';
        emailTab.classList.add('active');
        phoneTab.classList.remove('active');
    } else {
        emailSection.style.display = 'none';
        phoneSection.style.display = 'block';
        phoneTab.classList.add('active');
        emailTab.classList.remove('active');
    }
}


// ============================================================
//  VALIDATORS
// ============================================================
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    // Accept 10-digit numbers (with optional leading +91 or country code)
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^(\+?\d{1,3})?\d{10}$/.test(cleaned);
}


// ============================================================
//  PASSWORD STRENGTH METER
// ============================================================
function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 'weak', label: 'Weak', color: '#ef4444', width: '33%' };
    if (score <= 4) return { level: 'medium', label: 'Medium', color: '#f59e0b', width: '66%' };
    return { level: 'strong', label: 'Strong', color: '#10b981', width: '100%' };
}

function updatePasswordStrength() {
    const pwdInput = document.getElementById('regPassword');
    const bar = document.getElementById('strengthBar');
    const label = document.getElementById('strengthLabel');

    if (!pwdInput || !bar || !label) return;

    const pwd = pwdInput.value;
    if (pwd.length === 0) {
        bar.style.width = '0%';
        label.textContent = '';
        return;
    }

    const strength = checkPasswordStrength(pwd);
    bar.style.width = strength.width;
    bar.style.background = strength.color;
    label.textContent = strength.label;
    label.style.color = strength.color;
}


// ============================================================
//  OTP SYSTEM (Simulation)
// ============================================================
let otpTimerInterval = null;

function sendOtp(containerId) {
    const otpContainer = document.getElementById(containerId);
    if (!otpContainer) return;

    // Validate the phone number first
    const phoneInput = otpContainer.closest('.auth-card') ?
        otpContainer.closest('.auth-card').querySelector('.phone-input') :
        document.querySelector('.phone-input');

    if (phoneInput && !validatePhone(phoneInput.value)) {
        showToast('Please enter a valid phone number', 'error');
        phoneInput.focus();
        return;
    }

    // Show OTP fields
    otpContainer.style.display = 'block';
    otpContainer.classList.add('animate-in');

    // Focus first OTP input
    const firstInput = otpContainer.querySelector('.otp-digit');
    if (firstInput) firstInput.focus();

    // Start countdown
    startOtpCountdown(containerId);

    showToast('OTP sent to your phone number! (Use 123456 for demo)', 'info');
}

async function sendEmailOtp(containerId) {
    const otpContainer = document.getElementById(containerId);
    if (!otpContainer) return;

    const emailInput = otpContainer.closest('.auth-card') ?
        otpContainer.closest('.auth-card').querySelector('input[type="email"]') :
        document.querySelector('input[type="email"]');

    if (emailInput && !validateEmail(emailInput.value)) {
        showToast('Please enter a valid email address', 'error');
        emailInput.focus();
        return;
    }

    otpContainer.style.display = 'block';
    otpContainer.classList.add('animate-in');

    const firstInput = otpContainer.querySelector('.otp-digit');
    if (firstInput) firstInput.focus();

    startOtpCountdown(containerId);
    showToast('Sending verification code...', 'info');

    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: emailInput.value })
        });
        if (res.ok) {
            showToast('Verification code sent to your email! (Check backend console)', 'success');
        } else {
            const data = await res.json().catch(() => ({}));
            showToast(data.error || 'Failed to send OTP', 'error');
        }
    } catch(e) {
        showToast('Network error sending OTP', 'error');
    }
}

function startOtpCountdown(containerId) {
    const container = document.getElementById(containerId);
    const timerEl = container ? container.querySelector('.otp-timer') : null;
    const resendBtn = container ? container.querySelector('.otp-resend-btn') : null;

    if (!timerEl) return;

    let seconds = 60;
    if (resendBtn) resendBtn.style.display = 'none';

    clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(() => {
        seconds--;
        timerEl.textContent = `Resend in ${seconds}s`;
        if (seconds <= 0) {
            clearInterval(otpTimerInterval);
            timerEl.textContent = '';
            if (resendBtn) resendBtn.style.display = 'inline-block';
        }
    }, 1000);
}

// Auto-focus next OTP digit
function handleOtpInput(input, index, maxIndex) {
    if (input.value.length === 1 && index < maxIndex) {
        input.nextElementSibling.focus();
    }
}

function handleOtpKeydown(e, input, index) {
    if (e.key === 'Backspace' && input.value === '' && index > 0) {
        input.previousElementSibling.focus();
    }
}

function getOtpValue(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return '';
    const digits = container.querySelectorAll('.otp-digit');
    return Array.from(digits).map(d => d.value).join('');
}

async function verifyOtp(containerId) {
    const code = getOtpValue(containerId);
    if (code.length !== 6) {
        showToast('Please enter the complete 6-digit OTP', 'error');
        return false;
    }
    const isEmail = containerId.includes('Email');
    const identifier = isEmail ? document.getElementById('regEmail').value : document.getElementById('regPhone').value;

    try {
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ [isEmail ? 'email' : 'phone']: identifier, otp: code })
        });
        if (res.ok) {
            showToast('OTP verified successfully!', 'success');
            return true;
        } else {
            const data = await res.json().catch(()=>({}));
            showToast(data.error || 'Invalid OTP', 'error');
            return false;
        }
    } catch(e) {
        showToast('Network error verifying OTP', 'error');
        return false;
    }
}


// ============================================================
//  LOGIN HANDLER (wired to backend)
// ============================================================
async function handleLogin() {
    const emailTab = document.getElementById('emailTab');
    const isEmailMode = emailTab && emailTab.classList.contains('active');
    const role = document.getElementById('role').value;
    const btn = document.getElementById('loginBtn');

    if (isEmailMode) {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
    } else {
        // For now, phone/OTP login stays as UI-only; ask user to use email
        showToast('For now, please sign in using email and password. Backend login via phone is not yet connected.', 'info');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Signing In...';
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            showToast(data.error || 'Login failed', 'error');
        } else {
            const user = data.user;
            const token = data.token;

            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(user));

            showToast('Login successful! Redirecting...', 'success');

            setTimeout(() => {
                if (user.role === 'patient') window.location.href = 'patient/dashboard.html';
                else if (user.role === 'doctor') window.location.href = 'doctor/dashboard.html';
                else if (user.role === 'admin') window.location.href = 'admin/dashboard.html';
                else window.location.href = 'index.html';
            }, 800);
        }
    } catch (e) {
        console.error(e);
        showToast('Network error while signing in. Please try again.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign In to Dashboard';
        }
    }
}


// ============================================================
//  TOGGLE PASSWORD VISIBILITY
// ============================================================
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
    }
}


// ============================================================
//  DOCTOR VERIFICATION FIELDS TOGGLE
// ============================================================
function toggleDoctorFields() {
    const roleSelect = document.getElementById('registerRole');
    const doctorSection = document.getElementById('doctorVerifySection');

    if (!roleSelect || !doctorSection) return;

    if (roleSelect.value === 'doctor') {
        doctorSection.style.display = 'block';
        doctorSection.classList.add('animate-in');
    } else {
        doctorSection.style.display = 'none';
    }
}


// ============================================================
//  ID PROOF FILE UPLOAD
// ============================================================
function handleIdProofUpload(input) {
    const previewContainer = document.getElementById('idProofPreview');
    if (!previewContainer || !input.files || input.files.length === 0) return;

    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024; // 5 MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (!allowedTypes.includes(file.type)) {
        showToast('Only JPG, PNG, and PDF files are accepted', 'error');
        input.value = '';
        previewContainer.innerHTML = '';
        return;
    }

    if (file.size > maxSize) {
        showToast('File size must be less than 5 MB', 'error');
        input.value = '';
        previewContainer.innerHTML = '';
        return;
    }

    const fileSize = file.size < 1024 * 1024
        ? (file.size / 1024).toFixed(1) + ' KB'
        : (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    let previewHTML = '';

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewHTML = `
                <div class="file-preview-card">
                    <img src="${e.target.result}" alt="ID Preview" class="id-preview-img">
                    <div class="file-preview-info">
                        <span class="file-preview-name"><i class="bi bi-file-earmark-image"></i> ${file.name}</span>
                        <span class="file-preview-size">${fileSize}</span>
                    </div>
                    <button type="button" class="file-preview-remove" onclick="removeIdProof()">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            `;
            previewContainer.innerHTML = previewHTML;
        };
        reader.readAsDataURL(file);
    } else {
        previewHTML = `
            <div class="file-preview-card">
                <div class="pdf-icon"><i class="bi bi-file-earmark-pdf-fill"></i></div>
                <div class="file-preview-info">
                    <span class="file-preview-name"><i class="bi bi-file-earmark-pdf"></i> ${file.name}</span>
                    <span class="file-preview-size">${fileSize}</span>
                </div>
                <button type="button" class="file-preview-remove" onclick="removeIdProof()">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
        `;
        previewContainer.innerHTML = previewHTML;
    }

    showToast('ID proof uploaded successfully', 'success');
}

function removeIdProof() {
    const previewContainer = document.getElementById('idProofPreview');
    const fileInput = document.getElementById('idProofInput');
    if (previewContainer) previewContainer.innerHTML = '';
    if (fileInput) fileInput.value = '';
}

function triggerIdUpload() {
    const fileInput = document.getElementById('idProofInput');
    if (fileInput) fileInput.click();
}


// ============================================================
//  DRAG-AND-DROP for ID Upload
// ============================================================
function initDragDrop() {
    const dropZone = document.getElementById('idDropZone');
    if (!dropZone) return;

    ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        const fileInput = document.getElementById('idProofInput');
        if (fileInput && files.length > 0) {
            fileInput.files = files;
            handleIdProofUpload(fileInput);
        }
    });
}


// ============================================================
//  REGISTER HANDLER (wired to backend)
// ============================================================
async function handleRegister() {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const dob = document.getElementById('regDob').value;
    const blood = document.getElementById('regBlood').value;
    const password = document.getElementById('regPassword').value;
    const confirmPwd = document.getElementById('regConfirmPassword').value;
    const role = document.getElementById('registerRole').value;
    const terms = document.getElementById('termsCheck').checked;
    const btn = document.getElementById('registerBtn');

    // Determine auth mode
    const regEmailTab = document.getElementById('regEmailTab');
    const isEmailMode = regEmailTab && regEmailTab.classList.contains('active');

    // Basic validations
    if (!firstName || !lastName) {
        showToast('Please enter your full name', 'error');
        return;
    }

    if (isEmailMode) {
        const email = document.getElementById('regEmail').value;
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        // Verify email OTP length
        const otp = getOtpValue('regEmailOtpContainer');
        if (otp.length !== 6) {
            showToast('Please verify your email with the 6-digit code', 'error');
            return;
        }
    } else {
        const phone = document.getElementById('regPhone').value;
        if (!validatePhone(phone)) {
            showToast('Please enter a valid phone number', 'error');
            return;
        }
        const otp = getOtpValue('regPhoneOtpContainer');
        if (otp.length !== 6) {
            showToast('Please verify your phone with the OTP', 'error');
            return;
        }
    }

    if (!dob) {
        showToast('Please enter your date of birth', 'error');
        return;
    }
    if (!blood) {
        showToast('Please select your blood type', 'error');
        return;
    }

    const strength = checkPasswordStrength(password);
    if (strength.level === 'weak') {
        showToast('Password is too weak. Use uppercase, lowercase, numbers, and symbols.', 'error');
        return;
    }
    if (password !== confirmPwd) {
        showToast('Passwords do not match', 'error');
        return;
    }

    // Doctor-specific validations
    if (role === 'doctor') {
        const license = document.getElementById('medLicense').value.trim();
        const specialization = document.getElementById('specialization').value;
        const hospital = document.getElementById('hospitalAffiliation').value.trim();
        const idProofInput = document.getElementById('idProofInput');

        if (!license) {
            showToast('Please enter your medical license number', 'error');
            return;
        }
        if (!specialization) {
            showToast('Please select your specialization', 'error');
            return;
        }
        if (!hospital) {
            showToast('Please enter your hospital/clinic affiliation', 'error');
            return;
        }
        if (!idProofInput || !idProofInput.files || idProofInput.files.length === 0) {
            showToast('Please upload your ID proof for verification', 'error');
            return;
        }
    }

    if (!terms) {
        showToast('Please agree to the Terms of Service and Privacy Policy', 'error');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Creating Account...';
    }

    try {
        const isEmail = isEmailMode;
        const payload = {
            role,
            firstName,
            lastName,
            dob,
            bloodType: blood,
            password,
            otp: isEmailMode ? getOtpValue('regEmailOtpContainer') : getOtpValue('regPhoneOtpContainer')
        };

        if (isEmail) {
            payload.email = document.getElementById('regEmail').value;
        } else {
            payload.phone = document.getElementById('regPhone').value;
        }

        if (role === 'doctor') {
            payload.specialization = document.getElementById('specialization').value;
            payload.licenseNumber = document.getElementById('medLicense').value.trim();
            payload.hospitalAffiliation = document.getElementById('hospitalAffiliation').value.trim();
        }

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            showToast(data.error || 'Registration failed', 'error');
        } else {
            if (role === 'doctor') {
                showToast('Account created! Your doctor credentials will be verified within 24–48 hours.', 'success');
            } else {
                showToast('Account created successfully! Redirecting to login...', 'success');
            }

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    } catch (e) {
        console.error(e);
        showToast('Network error while creating account. Please try again.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-person-plus"></i> Create Account';
        }
    }
}


// ============================================================
//  FORGOT PASSWORD MODAL
// ============================================================
function sendResetLink() {
    const resetEmail = document.getElementById('resetEmail');
    const resetPhone = document.getElementById('resetPhone');
    const resetEmailTab = document.getElementById('resetEmailTab');
    const isEmail = resetEmailTab && resetEmailTab.classList.contains('active');

    if (isEmail) {
        if (!resetEmail || !validateEmail(resetEmail.value)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        showToast('Password reset link sent to your email!', 'success');
    } else {
        if (!resetPhone || !validatePhone(resetPhone.value)) {
            showToast('Please enter a valid phone number', 'error');
            return;
        }
        showToast('Password reset OTP sent to your phone!', 'success');
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
    if (modal) modal.hide();
}

function toggleResetMode(mode) {
    const emailSection = document.getElementById('resetEmailSection');
    const phoneSection = document.getElementById('resetPhoneSection');
    const emailTab = document.getElementById('resetEmailTab');
    const phoneTab = document.getElementById('resetPhoneTab');

    if (!emailSection || !phoneSection) return;

    if (mode === 'email') {
        emailSection.style.display = 'block';
        phoneSection.style.display = 'none';
        emailTab.classList.add('active');
        phoneTab.classList.remove('active');
    } else {
        emailSection.style.display = 'none';
        phoneSection.style.display = 'block';
        phoneTab.classList.add('active');
        emailTab.classList.remove('active');
    }
}


// ============================================================
//  INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    // Initialize drag-drop for doctor ID upload
    initDragDrop();

    // Auto-attach role change listener on register page
    const roleSelect = document.getElementById('registerRole');
    if (roleSelect) {
        roleSelect.addEventListener('change', toggleDoctorFields);
    }

    // Auto-attach password strength listener
    const pwdInput = document.getElementById('regPassword');
    if (pwdInput) {
        pwdInput.addEventListener('input', updatePasswordStrength);
    }
});
