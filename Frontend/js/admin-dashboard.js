/**
 * Admin Dashboard JavaScript
 * Handles file classification, department management, and analytics
 */

// Initialize sample data
function initializeSampleData() {
    const sampleFiles = [
        { name: 'patient_heartbeat_ECG.pdf', content: 'ECG report showing normal cardiac rhythm', metadata: { type: 'ECG', date: '2026-02-20' } },
        { name: 'MRI_brain_scan.pdf', content: 'Brain MRI examination report neurological findings', metadata: { type: 'MRI', date: '2026-02-21' } },
        { name: 'xray_fracture_bone.pdf', content: 'X-ray report showing fracture orthopedic assessment', metadata: { type: 'XRay', date: '2026-02-19' } },
        { name: 'blood_pressure_general.pdf', content: 'General physical examination and blood pressure check', metadata: { type: 'Physical', date: '2026-02-21' } },
        { name: 'cardiac_ultrasound_echo.pdf', content: 'Echocardiogram cardiac function heart health', metadata: { type: 'Ultrasound', date: '2026-02-18' } },
        { name: 'psychological_assessment.pdf', content: 'Mental health evaluation psychiatric consultation', metadata: { type: 'Assessment', date: '2026-02-20' } },
    ];

    // Classify all files
    const classified = fileAgent.classifyMultipleFiles(sampleFiles);
    
    // Store in localStorage for persistence
    localStorage.setItem('classifiedFiles', JSON.stringify(fileAgent.departments));
}

// Load classified files from localStorage
function loadClassifiedFiles() {
    const stored = localStorage.getItem('classifiedFiles');
    if (stored) {
        const data = JSON.parse(stored);
        fileAgent.importClassification(data);
    } else {
        initializeSampleData();
    }
}

// Render department table
function renderDepartmentTable() {
    const tbody = document.getElementById('dept-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    fileAgent.getAllDepartments().forEach(dept => {
        const stats = fileAgent.getDepartmentStats(dept);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <i class="bi ${stats.icon}" style="color: ${stats.color};"></i> ${dept}
            </td>
            <td><strong>${stats.fileCount}</strong></td>
            <td>3-5</td>
            <td>Updated today</td>
            <td><span class="badge bg-success">Active</span></td>
            <td>
                <button class="btn btn-sm btn-primary-sm me-2" onclick="viewDepartment('${dept}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Update total files count
    const totalFiles = document.getElementById('total-files');
    if (totalFiles) {
        const count = Object.values(fileAgent.departments).reduce((sum, d) => sum + d.files.length, 0);
        totalFiles.textContent = count;
    }
}

// Render departments section
function renderDepartments() {
    const container = document.getElementById('departments-container');
    if (!container) return;

    container.innerHTML = '';
    
    fileAgent.getAllDepartments().forEach(dept => {
        const deptData = fileAgent.departments[dept];
        const deptInfo = fileAgent.getDepartmentInfo(dept);
        
        const deptHTML = `
            <div class="dept-container">
                <div class="dept-section">
                    <div class="dept-header">
                        <div class="dept-header-icon">
                            <i class="bi ${deptInfo.icon}"></i>
                        </div>
                        <div>
                            <h3>${dept}</h3>
                            <small>${deptData.files.length} files | Last updated: Today</small>
                        </div>
                    </div>
                    <div class="dept-content">
                        ${deptData.files.length > 0 ?
                            `<div class="file-list">
                                ${deptData.files.slice(0, 3).map(file => `
                                    <div class="file-item">
                                        <div class="file-icon">
                                            <i class="bi bi-file-earmark-pdf"></i>
                                        </div>
                                        <div class="file-info">
                                            <span class="file-name">${file.name}</span>
                                            <span class="file-meta">Classified: ${new Date(file.classifiedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div class="file-actions">
                                            <button class="btn btn-sm btn-primary-sm"><i class="bi bi-download"></i></button>
                                            <button class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>`
                            : `<div class="no-files-message">
                                <i class="bi bi-inbox"></i>
                                <p>No files in this department yet</p>
                            </div>`
                        }
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += deptHTML;
    });
}

// Render files by department
function renderFilesByDepartment() {
    const container = document.getElementById('files-by-dept');
    if (!container) return;

    container.innerHTML = '';
    
    fileAgent.getAllDepartments().forEach(dept => {
        const deptData = fileAgent.departments[dept];
        const deptInfo = fileAgent.getDepartmentInfo(dept);
        
        const html = `
            <div class="dept-container">
                <div class="dept-section">
                    <div class="dept-header">
                        <div class="dept-header-icon">
                            <i class="bi ${deptInfo.icon}"></i>
                        </div>
                        <div>
                            <h3>${dept}</h3>
                            <small>${deptData.files.length} files classified</small>
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
                                            <span class="file-meta">Classified: ${new Date(file.classifiedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div class="file-actions">
                                            <button class="btn btn-sm btn-primary-sm" onclick="viewFile('${file.name}')"><i class="bi bi-eye"></i></button>
                                            <button class="btn btn-sm btn-warning" onclick="moveFile('${file.name}')"><i class="bi bi-arrow-left-right"></i></button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteFile('${file.name}')"><i class="bi bi-trash"></i></button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>`
                            : `<div class="no-files-message">
                                <i class="bi bi-inbox"></i>
                                <p>No files in this department yet</p>
                            </div>`
                        }
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += html;
    });
}

// Handle section navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(s => {
                s.style.display = 'none';
            });
            
            // Show selected section
            const selectedSection = document.getElementById(`${section}-section`);
            if (selectedSection) {
                selectedSection.style.display = 'block';
                
                // Re-render content for each section
                if (section === 'overview') {
                    renderDepartmentTable();
                } else if (section === 'departments') {
                    renderDepartments();
                } else if (section === 'files') {
                    renderFilesByDepartment();
                }
            }
        });
    });
}

// Upload files function
function uploadFiles() {
    const fileInput = document.getElementById('fileInput');
    const deptSelect = document.getElementById('deptSelect');
    
    if (fileInput.files.length === 0) {
        alert('Please select files to upload');
        return;
    }

    const newFiles = Array.from(fileInput.files).map(file => ({
        name: file.name,
        content: `File content of ${file.name}`,
        metadata: { size: file.size, type: file.type }
    }));

    if (deptSelect.value) {
        // Manual override
        newFiles.forEach(file => {
            fileAgent.departments[deptSelect.value].files.push({
                ...file,
                classified: true,
                classifiedAt: new Date().toISOString(),
                manual: true
            });
        });
    } else {
        // Auto-classify
        const classified = fileAgent.classifyMultipleFiles(newFiles);
    }

    // Save to localStorage
    localStorage.setItem('classifiedFiles', JSON.stringify(fileAgent.departments));

    // Close modal and refresh
    const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
    modal.hide();

    // Reset form
    fileInput.value = '';
    deptSelect.value = '';

    // Refresh current view
    renderFilesByDepartment();
    renderDepartmentTable();

    alert('Files uploaded and classified successfully!');
}

// View file details
function viewFile(fileName) {
    alert(`Viewing file: ${fileName}`);
}

// Move file to different department
function moveFile(fileName) {
    const depts = fileAgent.getAllDepartments();
    const deptList = depts.join('\n');
    const targetDept = prompt(`Move file to department:\n\n${deptList}`, '');
    
    if (targetDept && fileAgent.moveFile(fileName, targetDept)) {
        localStorage.setItem('classifiedFiles', JSON.stringify(fileAgent.departments));
        renderFilesByDepartment();
        alert(`File moved to ${targetDept} successfully!`);
    }
}

// Delete file
function deleteFile(fileName) {
    if (confirm(`Delete ${fileName} permanently?`)) {
        fileAgent.removeFile(fileName);
        localStorage.setItem('classifiedFiles', JSON.stringify(fileAgent.departments));
        renderFilesByDepartment();
        renderDepartmentTable();
        alert('File deleted successfully!');
    }
}

// View department details
function viewDepartment(dept) {
    // Navigate to departments section and highlight the department
    document.querySelector('[data-section="departments"]').click();
}

// Search files
function setupSearch() {
    const searchInput = document.getElementById('file-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.file-item');
        
        items.forEach(item => {
            const fileName = item.querySelector('.file-name').textContent.toLowerCase();
            if (fileName.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadClassifiedFiles();
    setupNavigation();
    renderDepartmentTable();
    setupSearch();
    
    // Add click handler for upload modal
    const uploadBtn = document.querySelector('[data-bs-target="#uploadModal"]');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            // Reset form when opening modal
            document.getElementById('fileInput').value = '';
            document.getElementById('deptSelect').value = '';
        });
    }
});
