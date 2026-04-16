/**
 * MediCare Hospital Management System
 * Main JavaScript File
 */

document.addEventListener("DOMContentLoaded", function () {
    console.log("MediCare System Loaded Successfully");
    initializeAnimations();
});

/**
 * Initialize animations and effects
 */
function initializeAnimations() {
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

/**
 * Redirect user based on selected role
 */
function redirectUser() {
    let role = document.getElementById("role").value;

    if (role === "patient")
        window.location.href = "patient/dashboard.html";
    else if (role === "doctor")
        window.location.href = "doctor/dashboard.html";
    else if (role === "admin")
        window.location.href = "admin/dashboard.html";
    else
        alert("Please select a valid role");
}

/**
 * Register a new user
 */
function registerUser() {
    const firstNameInput = document.querySelector('input[placeholder="John"]');
    const emailInput = document.querySelector('input[placeholder="you@example.com"]');
    
    if (!firstNameInput || !firstNameInput.value || !emailInput || !emailInput.value) {
        alert("Please fill in all required fields");
        return;
    }

    // Show success message
    alert("Registration Successful! Please complete your profile and login.");
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1500);
}

/**
 * Upload document and classify by department
 */
function uploadDocument() {
    let fileInput = document.getElementById("fileInput");
    if (fileInput && fileInput.files.length === 0) {
        alert("Please select a file to upload");
    } else if (fileInput && fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        alert("Document uploaded successfully: " + fileName + "\nAI Classification in progress...");
        fileInput.value = "";
    }
}

/**
 * Approve patient consent for doctor access
 */
function approveConsent() {
    alert("Consent Approved Successfully! Doctor now has access to your records.");
}

/**
 * Reject patient consent
 */
function rejectConsent() {
    alert("Consent has been rejected. Doctor will not have access to your records.");
}

/**
 * Logout user
 */
function logout(event) {
    if (event) event.preventDefault();
    
    // Set flag to prevent checkSession from auto-redirecting back
    sessionStorage.setItem('loggedOut', 'true');
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('classifiedFiles');
    
    window.location.href = "../login.html";
}

/**
 * Helper function to format dates
 */
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
}

/**
 * Helper function to format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}