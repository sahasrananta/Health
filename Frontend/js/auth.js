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
//  OTP SYSTEM — WITH REAL-TIME COUNTDOWN & VISUAL FEEDBACK
// ============================================================
let otpTimerIntervals = new Map(); // Track multiple timers
const lastOtpSentForPhone = new Map(); // Track last phone number OTP was sent for

async function sendOtp(containerId) {
    const otpContainer = document.getElementById(containerId);
    if (!otpContainer) return;

    // Validate the phone number first
    const phoneInput = otpContainer.closest('.auth-card') ?
        otpContainer.closest('.auth-card').querySelector('.phone-input') :
        document.querySelector('.phone-input');

    const countryCodeSelect = otpContainer.closest('.auth-card') ?
        otpContainer.closest('.auth-card').querySelector('select') :
        document.querySelector('select'); // Fallback to the first select in the input group

    const rawPhone = phoneInput ? phoneInput.value.trim() : '';
    const countryCode = countryCodeSelect ? countryCodeSelect.value : '+91';

    if (!validatePhone(rawPhone)) {
        showToast('Please enter a valid phone number', 'error');
        if (phoneInput) phoneInput.focus();
        return;
    }

    const phone = `${countryCode}${rawPhone}`;

    showToast('Sending OTP to your phone...', 'info');
    
    // Determine type based on context
    const isRegister = containerId.toLowerCase().includes('reg') || window.location.pathname.includes('register');
    const type = isRegister ? 'register' : 'login';
    
    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, type })
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            // Show OTP fields
            otpContainer.style.display = 'block';
            otpContainer.classList.add('animate-in');
            
            // Clear previous OTP values
            otpContainer.querySelectorAll('.otp-digit').forEach(input => {
                input.value = '';
                input.disabled = false;
            });
            
            // Notification of success
            showToast('Verification code sent!', 'success');
            
            // Handle Mock/Trial Mode Hints (Console Only)
            if (data.otp && data.isTrial) {
                console.log('%c [Trial Mode] Generated OTP: ' + data.otp, 'background: #222; color: #bada55; font-size: 1.2rem; padding: 5px;');
                showToast(`Trial Mode: Code is ${data.otp}`, 'warning');
            }

            const firstInput = otpContainer.querySelector('.otp-digit');
            if (firstInput && (!data.isTrial)) firstInput.focus();
            
            startOtpCountdown(containerId);
            showToast('OTP sent! Check your phone.', 'success');
        } else {
            showToast(data.error || 'Failed to send OTP', 'error');
        }
    } catch (e) {
        showToast('Network error sending OTP', 'error');
    }
}

async function sendEmailOtp(containerId) {
    const otpContainer = document.getElementById(containerId);
    if (!otpContainer) return;

    const emailInput = otpContainer.closest('.auth-card') ?
        otpContainer.closest('.auth-card').querySelector('input[type="email"]') :
        document.querySelector('input[type="email"]');

    if (emailInput && !validateEmail(emailInput.value.trim())) {
        showToast('Please enter a valid email address', 'error');
        emailInput.focus();
        return;
    }
    const emailValue = emailInput.value.trim();

    // UI Feedback: Loading state on button
    const verifyBtn = emailInput.parentElement.querySelector('button');
    const originalBtnText = verifyBtn ? verifyBtn.innerHTML : '';
    if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    }

    otpContainer.style.display = 'block';
    otpContainer.classList.add('animate-in');

    // Clear previous OTP values
    otpContainer.querySelectorAll('.otp-digit').forEach(input => {
        input.value = '';
        input.disabled = false;
        input.style.borderColor = '#e5e7eb';
        input.style.backgroundColor = '#fff';
    });

    const firstInput = otpContainer.querySelector('.otp-digit');
    if (firstInput) firstInput.focus();

    showToast('Sending verification code...', 'info');

    const isRegister = containerId.toLowerCase().includes('reg') || window.location.pathname.includes('register');
    const type = isRegister ? 'register' : 'login';

    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: emailValue, type })
        });
        
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            startOtpCountdown(containerId); // Only start timer on SUCCESS
            showToast('Verification code sent to your email!', 'success');
            
            // Handle Trial Mode (Development)
            if (data.otp && data.isTrial) {
                console.log('%c [Trial Mode] Generated OTP: ' + data.otp, 'background: #222; color: #bada55; font-size: 1.2rem; padding: 5px;');
                
                // Show a more persistent toast for the OTP
                showToast(`[TEST MODE] Your verification code is: ${data.otp}`, 'warning');
                
                const digits = data.otp.split('');
                const inputs = otpContainer.querySelectorAll('.otp-digit');
                digits.forEach((digit, i) => {
                    if (inputs[i]) {
                        inputs[i].value = digit;
                    }
                });
            }
        } else {
            showToast(data.error || 'Failed to send OTP', 'error');
        }
    } catch(e) {
        showToast('Network error sending OTP', 'error');
    } finally {
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = originalBtnText;
        }
    }
}

function startOtpCountdown(containerId) {
    const container = document.getElementById(containerId);
    const timerEl = container ? container.querySelector('.otp-timer') : null;
    const resendBtn = container ? container.querySelector('.otp-resend-btn') : null;

    if (!timerEl) return;

    // Clear any existing timer for this container
    if (otpTimerIntervals.has(containerId)) {
        clearInterval(otpTimerIntervals.get(containerId));
    }

    let seconds = 60;
    const totalSeconds = 60;
    const startTime = Date.now();

    if (resendBtn) {
        resendBtn.style.display = 'none';
        resendBtn.disabled = false;
    }

    // Create progress bar if it doesn't exist
    let progressBar = timerEl.parentElement?.querySelector('.otp-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'otp-progress';
        progressBar.style.cssText = `
            width: 100%;
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            overflow: hidden;
            margin-top: 6px;
        `;
        const progressFill = document.createElement('div');
        progressFill.className = 'otp-progress-fill';
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #10b981, #3b82f6);
            width: 100%;
            transition: width 0.3s ease;
        `;
        progressBar.appendChild(progressFill);
        timerEl.parentElement?.appendChild(progressBar);
    }

    const interval = setInterval(() => {
        seconds--;
        const progress = (seconds / totalSeconds) * 100;
        
        // Update timer text with styling
        timerEl.innerHTML = `
            <span style="color: ${seconds <= 10 ? '#ef4444' : '#6b7280'}; font-weight: 500;">
                <i class="bi bi-hourglass-split" style="margin-right: 4px;"></i>
                ${seconds}s
            </span>
        `;

        // Update progress bar
        const progressFill = progressBar?.querySelector('.otp-progress-fill');
        if (progressFill) {
            const fillColor = seconds <= 10 ? '#ef4444' : (seconds <= 20 ? '#f59e0b' : '#10b981');
            progressFill.style.background = `linear-gradient(90deg, ${fillColor}, #3b82f6)`;
            progressFill.style.width = progress + '%';
        }

        if (seconds <= 0) {
            clearInterval(interval);
            otpTimerIntervals.delete(containerId);
            lastOtpSentForPhone.delete(containerId); // Allow re-send for same number after expiry
            
            // Disable OTP fields
            container.querySelectorAll('.otp-digit').forEach(input => {
                input.disabled = true;
            });
            
            timerEl.innerHTML = '<span style="color: #ef4444; font-weight: 500;"><i class="bi bi-exclamation-circle" style="margin-right: 4px;"></i>OTP Expired</span>';
            
            if (resendBtn) {
                resendBtn.style.display = 'inline-block';
                resendBtn.disabled = false;
                resendBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise" style="margin-right: 4px;"></i>Resend OTP';
            }
            
            // Clear progress bar
            if (progressBar) {
                progressBar.style.display = 'none';
            }
        }
    }, 1000);

    otpTimerIntervals.set(containerId, interval);
}

// Auto-focus next OTP digit
// Auto-focus next OTP digit + Real-time auto-verification
function handleOtpInput(input, index, maxIndex) {
    if (input.value.length === 1 && index < maxIndex) {
        input.nextElementSibling.focus();
    }
    
    // Auto-verify when last digit is entered
    const container = input.closest('.mb-3[id]');
    if (container && getOtpValue(container.id).length === 6) {
        verifyOtp(container.id);
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

async function resendOtpHandler(containerId) {
    const otpContainer = document.getElementById(containerId);
    if (!otpContainer) return;

    // Determine if this is email or phone OTP
    const isEmailOtp = containerId.includes('Email');
    
    let phone, email;
    if (isEmailOtp) {
        const emailInput = document.getElementById('regEmail') || document.getElementById('loginEmail');
        email = emailInput ? emailInput.value : '';
        if (!email) {
            showToast('Please enter your email address', 'error');
            return;
        }
    } else {
        const phoneInput = document.getElementById('regPhone') || document.getElementById('loginPhone');
        phone = phoneInput ? phoneInput.value : '';
        if (!phone) {
            showToast('Please enter your phone number', 'error');
            return;
        }
    }

    // Call appropriate OTP send function
    if (isEmailOtp) {
        await sendEmailOtp(containerId);
    } else {
        await sendOtp(containerId);
    }
}

async function verifyOtp(containerId) {
    const code = getOtpValue(containerId);
    if (code.length !== 6) {
        showToast('Please enter the complete 6-digit OTP', 'error');
        return false;
    }

    const container = document.getElementById(containerId);
    const digits = container?.querySelectorAll('.otp-digit');
    
    // Visual feedback: Start verifying
    if (digits) {
        digits.forEach(d => {
            d.disabled = true;
            d.style.opacity = '0.7';
        });
    }

    const isEmail = containerId.includes('Email');
    const emailInput = document.getElementById('regEmail') || document.getElementById('loginEmail');
    const phoneInput = document.getElementById('regPhone') || document.getElementById('loginPhone');

    const identifier = isEmail ? (emailInput ? emailInput.value.trim() : '') : (phoneInput ? phoneInput.value.trim() : '');

    try {
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ [isEmail ? 'email' : 'phone']: identifier, otp: code })
        });
        
        if (res.ok) {
            showToast('OTP verified successfully!', 'success');
            if (digits) {
                digits.forEach(d => {
                    d.style.borderColor = '#10b981';
                    d.style.backgroundColor = '#f0fdf4';
                });
            }
            return true;
        } else {
            const data = await res.json().catch(()=>({}));
            showToast(data.error || 'Invalid OTP', 'error');
            // Re-enable digits on failure
            if (digits) {
                digits.forEach(d => {
                    d.disabled = false;
                    d.style.opacity = '1';
                    d.style.borderColor = '#ef4444';
                });
                digits[0].focus();
            }
            return false;
        }
    } catch(e) {
        showToast('Network error verifying OTP', 'error');
        if (digits) digits.forEach(d => { d.disabled = false; d.style.opacity = '1'; });
        return false;
    }
}


// ============================================================
//  LOGIN HANDLER (wired to backend)
// ============================================================
async function handleLogin() {
    const emailTab = document.getElementById('emailTab');
    const isEmailMode = emailTab && emailTab.classList.contains('active');
    const btn = document.getElementById('loginBtn');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Signing In...';
    }

    try {
        let response, payload;

        if (isEmailMode) {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!validateEmail(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }
            if (password.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }

            response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

        } else {
            // Phone OTP login
            const phoneInput = document.getElementById('loginPhone');
            const countryCodeSelect = document.getElementById('loginCountryCode');
            
            const rawPhone = phoneInput ? phoneInput.value.trim() : '';
            const countryCode = countryCodeSelect ? countryCodeSelect.value : '+91';

            if (!validatePhone(rawPhone)) {
                showToast('Please enter a valid phone number', 'error');
                return;
            }

            const phone = `${countryCode}${rawPhone}`;

            const otp = getOtpValue('loginOtpContainer');
            if (otp.length !== 6) {
                showToast('Please enter the 6-digit OTP sent to your phone', 'error');
                return;
            }

            response = await fetch('/api/auth/login-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            });
        }

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
            const rawPhone = document.getElementById('regPhone').value.trim();
            const countryCode = document.getElementById('regCountryCode').value;
            payload.phone = `${countryCode}${rawPhone}`;
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
async function sendResetLink() {
    const resetEmail = document.getElementById('resetEmail');
    const resetPhone = document.getElementById('resetPhone');
    const resetEmailTab = document.getElementById('resetEmailTab');
    const isEmail = resetEmailTab && resetEmailTab.classList.contains('active');
    const btn = document.querySelector('#forgotPasswordModal .btn-primary-healthcare');

    if (isEmail) {
        if (!resetEmail || !validateEmail(resetEmail.value)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        if (btn) { 
            btn.disabled = true; 
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Sending...';
        }
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail.value, type: 'reset' })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                let successMsg = 'A verification code has been sent to your email. Use it to log in and change your password.';
                
                // Handle Trial Mode (Development)
                if (data.otp && data.isTrial) {
                    successMsg = `[TEST MODE] Verification code generated: ${data.otp}. Use this to verify your identity.`;
                    console.log('%c [Trial Mode] Reset OTP: ' + data.otp, 'background: #222; color: #bada55; font-size: 1.2rem; padding: 5px;');
                }
                
                showToast(successMsg, data.isTrial ? 'warning' : 'success');
                if (data.isTrial) {
                   showToast(`Your code is: ${data.otp}`, 'warning');
                }

                const modalEl = document.getElementById('forgotPasswordModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            } else {
                showToast(data.error || 'Failed to send reset code', 'error');
            }
        } catch (e) {
            console.error('Password reset network error:', e);
            showToast('Network error. Please try again.', 'error');
        } finally {
            if (btn) { 
                btn.disabled = false; 
                btn.innerHTML = '<i class="bi bi-send-fill"></i> Send Reset Link'; 
            }
        }
    } else {
        if (!resetPhone || !validatePhone(resetPhone.value)) {
            showToast('Please enter a valid phone number', 'error');
            return;
        }
        // Phone password reset requires an SMS provider (not yet configured)
        showToast('Phone password reset is not available yet. Please use your email address instead.', 'warning');
    }
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
//  AUTO OTP TRIGGER — Real-time (fires on 10th digit)
// ============================================================

/**
 * Guard: returns true if an OTP was already sent for this phone
 * and the countdown timer is still active.
 */
function isOtpActiveForPhone(containerId, phone) {
    const fullPhone = phone.replace(/[\s\-\(\)]/g, '');
    const timerActive = otpTimerIntervals.has(containerId);
    const lastPhone = lastOtpSentForPhone.get(containerId);
    return timerActive && lastPhone === fullPhone;
}

/**
 * Attaches a real-time input listener to a phone input field.
 * Fires sendOtp() as soon as the user has typed a valid 10-digit number.
 * Includes a 600ms debounce and duplicate-send guard.
 */
function attachRealTimePhoneOtp(phoneInputId, containerId, countryCodeId) {
    const phoneInput = document.getElementById(phoneInputId);
    if (!phoneInput) return;

    let debounceTimer = null;

    phoneInput.addEventListener('input', (e) => {
        const raw = e.target.value.replace(/\D/g, ''); // digits only

        // Only trigger on exactly 10 digits
        if (raw.length !== 10) return;

        const countryCodeEl = countryCodeId ? document.getElementById(countryCodeId) : null;
        const countryCode = countryCodeEl ? countryCodeEl.value : '+91';
        const fullPhone = `${countryCode}${raw}`;

        // Guard: don't re-send if a live timer exists for this exact number
        if (isOtpActiveForPhone(containerId, fullPhone)) {
            return;
        }

        // Debounce 600ms to avoid rapid re-send when user edits digits
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            // Re-check guard after debounce delay
            if (isOtpActiveForPhone(containerId, fullPhone)) return;

            // Record the number we are about to send to
            lastOtpSentForPhone.set(containerId, fullPhone);

            // Visually reveal the OTP box immediately for snappy feel
            const otpContainer = document.getElementById(containerId);
            if (otpContainer) {
                otpContainer.style.display = 'block';
                otpContainer.classList.add('animate-in');
                otpContainer.querySelectorAll('.otp-digit').forEach(inp => {
                    inp.value = '';
                    inp.disabled = false;
                });
            }

            showToast('📱 Sending OTP to your phone...', 'info');

            // Determine context (register vs login)
            const isRegister = containerId.toLowerCase().includes('reg') || window.location.pathname.includes('register');
            const type = isRegister ? 'register' : 'login';

            try {
                const res = await fetch('/api/auth/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: fullPhone, type })
                });
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    showToast('✅ OTP sent! Check your phone.', 'success');
                    startOtpCountdown(containerId);

                    // Trial / dev mode: auto-fill the digits
                    if (data.otp && data.isTrial) {
                        console.log('%c [Trial Mode] Generated OTP: ' + data.otp, 'background: #222; color: #bada55; font-size: 1.2rem; padding: 5px;');
                        showToast(`Trial Mode: Code is ${data.otp}`, 'warning');
                        const digits = data.otp.split('');
                        const inputs = otpContainer ? otpContainer.querySelectorAll('.otp-digit') : [];
                        digits.forEach((digit, i) => { if (inputs[i]) inputs[i].value = digit; });
                    }

                    // Focus first OTP digit
                    const firstDigit = otpContainer ? otpContainer.querySelector('.otp-digit') : null;
                    if (firstDigit && !data.isTrial) firstDigit.focus();
                } else {
                    // Clear the guard so user can retry
                    lastOtpSentForPhone.delete(containerId);
                    showToast(data.error || 'Failed to send OTP', 'error');
                }
            } catch (err) {
                lastOtpSentForPhone.delete(containerId);
                showToast('Network error sending OTP', 'error');
            }
        }, 600);
    });
}

function setupAutoOtpTrigger() {
    // --- Registration page ---
    const regEmailInput = document.getElementById('regEmail');
    if (regEmailInput) {
        regEmailInput.addEventListener('blur', (e) => {
            const email = e.target.value.trim();
            if (email && validateEmail(email)) {
                sendEmailOtp('regEmailOtpContainer');
            }
        });
    }

    // Real-time trigger for registration phone
    attachRealTimePhoneOtp('regPhone', 'regPhoneOtpContainer', 'regCountryCode');

    // --- Login page ---
    // Real-time trigger for login phone
    attachRealTimePhoneOtp('loginPhone', 'loginOtpContainer', 'loginCountryCode');
}


// ============================================================
//  INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    // Initialize drag-drop for doctor ID upload
    initDragDrop();

    // Set up auto OTP trigger on registration page
    setupAutoOtpTrigger();

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
// ============================================================
//  SESSION PERSISTENCE
// ============================================================
function checkSession() {
    // If we just logged out, don't auto-redirect back (prevents loop)
    if (sessionStorage.getItem('loggedOut') === 'true') {
        return;
    }

    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser');
    
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user && user.role) {
                const dashboard = {
                    patient: 'patient/dashboard.html',
                    doctor: 'doctor/dashboard.html',
                    admin: 'admin/dashboard.html'
                }[user.role];
                
                if (dashboard) {
                    // Adjust path based on current location
                    const prefix = window.location.pathname.includes('/patient/') || 
                                 window.location.pathname.includes('/doctor/') || 
                                 window.location.pathname.includes('/admin/') ? '../' : '';
                    
                    // Only redirect if we are on a landing/auth page
                    const isAuthPage = window.location.pathname.endsWith('login.html') || 
                                      window.location.pathname.endsWith('register.html') || 
                                      window.location.pathname.endsWith('index.html') ||
                                      window.location.pathname === '/';
                    
                    if (isAuthPage) {
                        window.location.href = prefix + dashboard;
                    }
                }
            }
        } catch (e) {
            console.warn('Session check failed:', e);
            localStorage.clear();
        }
    }
}
