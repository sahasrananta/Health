/**
 * File Classification Agent
 * Automatically categorizes files by medical department
 */

class FileClassificationAgent {
    constructor() {
        this.departments = {
            'Cardiology': {
                keywords: ['heart', 'cardiac', 'cardio', 'ecg', 'ekg', 'holter', 'stress', 'angio', 'stent', 'arrhythmia', 'blood pressure'],
                icon: 'bi-heart',
                color: '#e63946',
                files: []
            },
            'Orthopedics': {
                keywords: ['bone', 'orthopedic', 'fracture', 'joint', 'xray', 'mri', 'spine', 'ligament', 'arthritis', 'surgery'],
                icon: 'bi-bones',
                color: '#f59e0b',
                files: []
            },
            'Neurology': {
                keywords: ['neuro', 'brain', 'nerve', 'eeg', 'seizure', 'migraine', 'brain scan', 'parkinson', 'stroke', 'mri brain'],
                icon: 'bi-brain',
                color: '#0ea5e9',
                files: []
            },
            'General Medicine': {
                keywords: ['general', 'medicine', 'diagnosis', 'physical', 'checkup', 'blood test', 'lab', 'fever', 'cold', 'infection'],
                icon: 'bi-bandage',
                color: '#10b981',
                files: []
            },
            'Oncology': {
                keywords: ['cancer', 'oncology', 'tumor', 'biopsy', 'chemotherapy', 'radiation', 'metastasis', 'pathology'],
                icon: 'bi-microscope',
                color: '#8b5cf6',
                files: []
            },
            'Psychiatry': {
                keywords: ['mental', 'psychiatric', 'depression', 'anxiety', 'psychology', 'behavioral', 'counseling', 'therapy'],
                icon: 'bi-person-heart',
                color: '#ec4899',
                files: []
            }
        };
    }

    /**
     * Classify a file based on its name, content, or metadata
     * @param {Object} file - File object {name, content, metadata}
     * @returns {string} - Department classification
     */
    classifyFile(file) {
        const fileName = file.name.toLowerCase();
        const fileContent = file.content ? file.content.toLowerCase() : '';
        const fileMetadata = file.metadata ? JSON.stringify(file.metadata).toLowerCase() : '';

        const combinedText = `${fileName} ${fileContent} ${fileMetadata}`;

        let maxScore = 0;
        let classifiedDept = 'General Medicine'; // Default fallback

        for (const [dept, data] of Object.entries(this.departments)) {
            let score = 0;
            
            data.keywords.forEach(keyword => {
                const occurrences = (combinedText.match(new RegExp(keyword, 'g')) || []).length;
                score += occurrences;
            });

            if (score > maxScore) {
                maxScore = score;
                classifiedDept = dept;
            }
        }

        return classifiedDept;
    }

    /**
     * Classify multiple files at once
     * @param {Array} files - Array of file objects
     * @returns {Object} - Organized files by department
     */
    classifyMultipleFiles(files) {
        const result = JSON.parse(JSON.stringify(this.departments));

        files.forEach(file => {
            const dept = this.classifyFile(file);
            result[dept].files.push({
                ...file,
                classified: true,
                classifiedAt: new Date().toISOString()
            });
        });

        return result;
    }

    /**
     * Get department info
     * @param {string} dept - Department name
     * @returns {Object} - Department data
     */
    getDepartmentInfo(dept) {
        return this.departments[dept] || null;
    }

    /**
     * Get all departments
     * @returns {Array} - List of all departments
     */
    getAllDepartments() {
        return Object.keys(this.departments);
    }

    /**
     * Get files by department
     * @param {string} dept - Department name
     * @returns {Array} - Files in department
     */
    getFilesByDepartment(dept) {
        return this.departments[dept]?.files || [];
    }

    /**
     * Get stats for a department
     * @param {string} dept - Department name
     * @returns {Object} - Statistics
     */
    getDepartmentStats(dept) {
        const deptData = this.departments[dept];
        if (!deptData) return null;

        return {
            department: dept,
            fileCount: deptData.files.length,
            icon: deptData.icon,
            color: deptData.color,
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Get all department statistics
     * @returns {Array} - All department stats
     */
    getAllStats() {
        return Object.keys(this.departments).map(dept => this.getDepartmentStats(dept));
    }

    /**
     * Merge new files with existing classification
     * @param {Array} newFiles - New files to add
     */
    addFiles(newFiles) {
        const classified = this.classifyMultipleFiles(newFiles);
        
        for (const [dept, data] of Object.entries(classified)) {
            this.departments[dept].files = [...(this.departments[dept].files || []), ...data.files];
        }

        return classified;
    }

    /**
     * Remove a file from classification
     * @param {string} fileName - Name of file to remove
     * @returns {boolean} - Success status
     */
    removeFile(fileName) {
        for (const dept of Object.values(this.departments)) {
            dept.files = dept.files.filter(f => f.name !== fileName);
        }
        return true;
    }

    /**
     * Move file to different department
     * @param {string} fileName - File name
     * @param {string} targetDept - Target department
     * @returns {boolean} - Success status
     */
    moveFile(fileName, targetDept) {
        let file = null;
        
        for (const dept of Object.values(this.departments)) {
            const fileIndex = dept.files.findIndex(f => f.name === fileName);
            if (fileIndex !== -1) {
                file = dept.files[fileIndex];
                dept.files.splice(fileIndex, 1);
                break;
            }
        }

        if (file && this.departments[targetDept]) {
            this.departments[targetDept].files.push({
                ...file,
                movedAt: new Date().toISOString()
            });
            return true;
        }
        return false;
    }

    /**
     * Export classified data
     * @returns {Object} - Complete classification data
     */
    exportClassification() {
        return {
            exportDate: new Date().toISOString(),
            totalFiles: Object.values(this.departments).reduce((sum, d) => sum + d.files.length, 0),
            departments: this.departments
        };
    }

    /**
     * Import classification data
     * @param {Object} data - Classification data
     */
    importClassification(data) {
        if (data.departments) {
            this.departments = data.departments;
            return true;
        }
        return false;
    }
}

// Initialize global agent instance
const fileAgent = new FileClassificationAgent();
