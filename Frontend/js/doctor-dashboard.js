/**
 * Doctor Dashboard JavaScript
 * Handles patient records and medical file viewing
 */

// Load classified files
function loadClassifiedFiles() {
    const stored = localStorage.getItem('classifiedFiles');
    if (stored) {
        const data = JSON.parse(stored);
        fileAgent.importClassification(data);
    }
}

// Render medical records by department
function renderMedicalRecords() {
    const container = document.getElementById('doctor-files-by-dept');
    if (!container) return;

    container.innerHTML = '';
    
    fileAgent.getAllDepartments().forEach(dept => {
        const deptData = fileAgent.departments[dept];
        const deptInfo = fileAgent.getDepartmentInfo(dept);
        
        // Only show Cardiology for this doctor
        if (dept !== 'Cardiology') return;
        
        const html = `
            <div class="dept-container">
                <div class="dept-section">
                    <div class="dept-header">
                        <div class="dept-header-icon">
                            <i class="bi ${deptInfo.icon}"></i>
                        </div>
                        <div>
                            <h3>${dept}</h3>
                            <small>${deptData.files.length} patient records available</small>
                        </div>
                    </div>
                    <div class="dept-content">
                        ${deptData.files.length > 0 ?
                            `<div class="file-list">
                                ${deptData.files.map(file => `
                                    <div class="file-item">
                                        <div class="file-icon">
                                            <i class="bi bi-file-earmark-pdf"></i>
                                        </div>
                                        <div class="file-info">
                                            <span class="file-name">${file.name}</span>
                                            <span class="file-meta">Date: ${new Date(file.classifiedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div class="file-actions">
                                            <button class="btn btn-sm btn-primary-sm" onclick="viewFile('${file.name}')"><i class="bi bi-eye"></i> View</button>
                                            <button class="btn btn-sm btn-info"><i class="bi bi-download"></i></button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>`
                            : `<div class="no-files-message">
                                <i class="bi bi-inbox"></i>
                                <p>No records available</p>
                            </div>`
                        }
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += html;
    });
}

// Handle navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // Remove active class
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(s => {
                s.style.display = 'none';
            });
            
            // Show selected section
            const selectedSection = document.getElementById(`${section}-section`);
            if (selectedSection) {
                selectedSection.style.display = 'block';
                
                if (section === 'files') {
                    renderMedicalRecords();
                }
            }
        });
    });
}

// View file details
function viewFile(fileName) {
    alert(`Opening ${fileName} for review`);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadClassifiedFiles();
    setupNavigation();
});
