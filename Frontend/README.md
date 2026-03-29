# MediCare Hospital Management System

## 🏥 Overview
MediCare is a modern, AI-powered Hospital Management System that provides secure centralized healthcare management with intelligent document classification and consent management.

## ✨ Key Features

### 1. **Attractive Healthcare Interface**
- **Modern Professional Design**: Gradient-based UI with healthcare color scheme
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Bootstrap 5 Integration**: Clean, accessible components
- **Bootstrap Icons**: Comprehensive healthcare-specific icons

### 2. **AI-Powered File Classification Agent**
- **Intelligent Department Separation**: Files automatically classified to:
  - 💓 Cardiology
  - 🦴 Orthopedics
  - 🧠 Neurology
  - ⚕️ General Medicine
  - 🔬 Oncology
  - 🧘 Psychiatry

- **Smart Keyword Matching**: Analyzes file names and metadata to classify documents
- **Manual Override**: Administrators can manually assign departments
- **Real-time Processing**: Instant classification on upload

### 3. **Role-Based Dashboards**

#### **Patient Dashboard**
- View medical records organized by department
- Upload new medical documents
- Grant/revoke doctor access permissions
- Track document history and consent status
- Manage personal health information

#### **Doctor Dashboard**
- Access patient records in your specialty
- View department-organized files
- Track patient appointments and consultations
- Manage patient information
- View classification confidence

#### **Admin Dashboard**
- System overview and analytics
- Department management
- File management and classification
- User management
- System settings and configuration
- Performance metrics

### 4. **Department-Based Data Organization**
- Files automatically separated by medical department
- Quick filtering and search capabilities
- View file count per department
- Department-specific statistics and analytics
- Color-coded department identification

### 5. **Security & Compliance**
- HIPAA Compliant architecture
- End-to-end encryption
- Secure data transmission
- Patient consent management
- Access control and permissions
- Audit trails for file access

## 📁 Project Structure

```
Frontend/
├── index.html                 # Landing page with feature showcase
├── login.html                 # User authentication
├── register.html              # User registration
├── admin/
│   └── dashboard.html         # Admin dashboard with full system access
├── doctor/
│   └── dashboard.html         # Doctor dashboard with patient records
├── patient/
│   ├── dashboard.html         # Patient main dashboard
│   ├── records.html           # Medical records view
│   ├── upload.html            # Document upload page
│   ├── consent.html           # Consent management
│   └── ...
├── css/
│   └── style.css              # Modern healthcare styling
├── js/
│   ├── script.js              # Main functionality
│   ├── fileClassificationAgent.js  # AI classification engine
│   ├── admin-dashboard.js     # Admin dashboard logic
│   ├── doctor-dashboard.js    # Doctor dashboard logic
│   └── patient-dashboard.js   # Patient dashboard logic
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- No server setup required (works offline with localStorage)

### Installation
1. Clone or download the repository
2. Open `index.html` in your web browser
3. Navigate through the system

### Demo Access
- **Patient**: Login as "Patient" → Access patient dashboard
- **Doctor**: Login as "Doctor" → Access doctor dashboard
- **Admin**: Login as "Admin" → Access admin dashboard

## 🎯 File Classification System

### How It Works
1. **Upload**: User uploads a medical document
2. **Analysis**: System analyzes filename, content, and metadata
3. **Matching**: AI matches keywords to department classification
4. **Organization**: File is placed in appropriate department
5. **Access**: Users can view files organized by department

### Classification Keywords
- **Cardiology**: heart, cardiac, ECG, EKG, arrhythmia, blood pressure
- **Orthopedics**: bone, fracture, joint, xray, spine, arthritis
- **Neurology**: brain, nerve, EEG, seizure, migraine, stroke
- **General Medicine**: general, diagnosis, checkup, blood test, lab
- **Oncology**: cancer, tumor, biopsy, chemotherapy, radiation
- **Psychiatry**: mental, psychology, depression, anxiety, therapy

## 💾 Data Storage

### LocalStorage
- Files are stored in browser's localStorage for demo purposes
- Perfect for testing and development
- Can be cleared using browser developer tools

### Production Implementation
For production, implement backend with:
- Database (SQL/NoSQL)
- File storage (AWS S3, Azure Blob Storage)
- API endpoints
- Authentication service

## 🎨 Design Features

### Color Scheme
- **Primary**: #0066cc (Healthcare Blue)
- **Secondary**: #00a884 (Medical Green)
- **Danger**: #e63946 (Alert Red)
- **Gradients**: Professional healthcare aesthetic

### Responsive Breakpoints
- Desktop: Full feature set
- Tablet: Optimized layout
- Mobile: Touch-friendly interface

## 📊 Analytics & Reporting

### Available Metrics
- Total files across system
- Files per department
- Active users
- System health status
- Pending reviews
- User activity trends

## 🔐 Security Considerations

### Current Implementation
- Secure role-based access
- Data persistence with localStorage
- Client-side classification

### Production Requirements
- HTTPS encryption
- Backend authentication
- Database encryption
- HIPAA compliance
- Regular security audits
- Access logging

## 📱 Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🛠️ Customization

### Adding New Departments
Edit `fileClassificationAgent.js`:
```javascript
'New Department': {
    keywords: ['keyword1', 'keyword2'],
    icon: 'bi-icon-name',
    color: '#hexcolor',
    files: []
}
```

### Modifying Styles
Edit `css/style.css` to customize:
- Colors
- Fonts
- Spacing
- Animations
- Responsive breakpoints

## 📞 Features Demo

### Admin Panel Features
- ✅ System overview with statistics
- ✅ Department management
- ✅ File management and reclassification
- ✅ User management
- ✅ Classification settings
- ✅ Security configuration

### Doctor Panel Features
- ✅ Patient list and records
- ✅ Department-organized files
- ✅ Appointment management
- ✅ Profile management
- ✅ Medical record access

### Patient Panel Features
- ✅ Dashboard with statistics
- ✅ Medical records by department
- ✅ Document upload with auto-classification
- ✅ Consent management
- ✅ Doctor access control
- ✅ Profile management

## 🚀 Future Enhancements

- [ ] Backend API integration
- [ ] Real database implementation
- [ ] Advanced search and filtering
- [ ] Document annotations
- [ ] Video consultation integration
- [ ] Mobile native apps
- [ ] Two-factor authentication
- [ ] Advanced analytics dashboard
- [ ] Machine learning improvements
- [ ] Integration with external systems

## 📄 License
This project is provided as-is for demonstration and educational purposes.

## 👥 Support
For questions or issues, please refer to the system documentation or contact the development team.

---

**MediCare** - Transforming Healthcare Management with AI & Security
