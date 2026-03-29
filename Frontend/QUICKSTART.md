# MediCare - Quick Start Guide

## 🎯 Getting Started in 5 Minutes

### Step 1: Access the System
1. Open `index.html` in your web browser
2. You'll see the MediCare landing page with features showcase
3. Click "Get Started" or "Sign In"

### Step 2: Login

#### Test Credentials
- **Email**: Any email (demo mode)
- **Password**: Any password (demo mode)
- **Role**: Select your role:
  - 👤 Patient
  - 👨‍⚕️ Doctor  
  - 👨‍💼 Administrator

#### Navigate by Role

---

## 👤 Patient Dashboard Tutorial

### Accessing Your Dashboard
1. Login as "Patient"
2. You'll see your health dashboard with:
   - Total records count
   - Active doctors with access
   - Recent activity timeline
   - Quick statistics

### Managing Medical Records
1. Click "My Records" in sidebar
2. View files organized by department:
   - 💓 Cardiology
   - 🦴 Orthopedics
   - 🧠 Neurology
   - ⚕️ General Medicine
   - 🔬 Oncology
   - 🧘 Psychiatry

### Uploading Documents
1. Click "Upload Record" in sidebar
2. Click the drop zone or select file
3. Choose document type
4. Add optional description
5. Click "Upload Document"
6. File is automatically classified!

### Managing Doctor Access
1. Click "Manage Consent" in sidebar
2. See all doctors with access
3. Grant/revoke permissions
4. Set access levels (Full/View Only/Limited)
5. Set expiration dates

### Your Profile
1. Click "My Profile" in sidebar
2. Update personal information
3. Update blood type and health details
4. Save changes

---

## 👨‍⚕️ Doctor Dashboard Tutorial

### Your Patient List
1. Login as "Doctor"
2. Click "My Patients" to see all patients
3. View:
   - Patient name and age
   - Medical condition
   - Number of records
   - Last update date

### Accessing Medical Records
1. Click "Medical Records" in sidebar
2. See all patient files in your specialty (Cardiology)
3. View files organized by patient:
   - Filename
   - Upload date
   - Status

### Patient Appointments
1. Click "Appointments" in sidebar
2. See all scheduled consultations
3. Patient names and appointment times
4. Confirmation status

### Your Profile
1. Click "My Profile" in sidebar
2. View professional information
3. Update contact details
4. Verify credentials

---

## 👨‍💼 Admin Dashboard Tutorial

### System Overview
1. Login as "Admin"
2. Dashboard shows:
   - Total files across system
   - Pending reviews
   - Active users
   - System health status

### View Department Statistics
1. See all departments with file counts:
   - Cardiology: 5 files
   - Orthopedics: 3 files
   - etc.
2. Monitor recent activity
3. View department status

### Managing Departments
1. Click "Departments" in sidebar
2. See each department with:
   - File count
   - Last updated time
   - Department status
3. Quick options to view/delete

### File Management & Classification
1. Click "File Management" in sidebar
2. See files organized by department
3. Search files by name
4. Upload new files:
   - Click "Upload Files"
   - Select files
   - Optional: Override automatic classification
   - Click "Upload & Classify"
5. Files are auto-classified and organized

### User Management
1. Click "Users" in sidebar
2. See all system users:
   - Doctors
   - Patients
   - Staff
3. View status (Active/Inactive)
4. Edit or remove users

### System Settings
1. Click "Settings" in sidebar
2. Configure:
   - Classification confidence threshold
   - Auto-classification toggle
   - Data retention period
   - Security options
3. Save changes

### Analytics
1. Click "Analytics" in sidebar
2. View charts for:
   - File distribution by department
   - User activity metrics
   - System usage trends

---

## 📊 File Classification System

### How Files Are Automatically Classified

**Example 1: Cardiology File**
- Upload: "Patient_ECG_Report_2026.pdf"
- Contains keywords: "cardiac", "ECG", "heart rate"
- **→ Automatically classified to: Cardiology**

**Example 2: Orthopedics File**
- Upload: "Bone_Fracture_xray_analysis.pdf"
- Contains keywords: "bone", "fracture", "orthopedic"
- **→ Automatically classified to: Orthopedics**

**Example 3: Neurology File**
- Upload: "Brain_MRI_neurological_findings.pdf"
- Contains keywords: "brain", "neuro", "MRI"
- **→ Automatically classified to: Neurology**

### Manual Override (Admin Only)
If auto-classification doesn't work:
1. Open Upload modal
2. Select file
3. Instead of "Auto-classify", select department manually
4. Upload with manual assignment

---

## 💡 Tips & Best Practices

### Naming Convention
✅ **Good**: `ECG_Report_Patient_2026-02-20.pdf`
❌ **Bad**: `Document1.pdf`

**Why?** More descriptive filenames help with classification and searching.

### File Organization
- Use consistent naming for similar documents
- Include department keywords in filename
- Add date information for tracking

### Doctor Access
- Review who has access to your records regularly
- Set expiration dates for temporary access
- Use "Limited Access" for sensitive info

### Department-Based Workflow
- All Cardiology files grouped together
- Easy to find all related records
- Department heads can manage their files
- Doctors can quickly access specialization records

---

## 🔍 Department Keywords Guide

### Cardiology 💓
**Keywords**: heart, cardiac, cardio, ECG, EKG, holter, stress, angio, stent, arrhythmia, blood pressure, echocardiogram

### Orthopedics 🦴
**Keywords**: bone, orthopedic, fracture, joint, xray, MRI, spine, ligament, arthritis, surgery

### Neurology 🧠
**Keywords**: neuro, brain, nerve, EEG, seizure, migraine, brain scan, parkinson, stroke, MRI brain

### General Medicine ⚕️
**Keywords**: general, medicine, diagnosis, physical, checkup, blood test, lab, fever, cold, infection

### Oncology 🔬
**Keywords**: cancer, oncology, tumor, biopsy, chemotherapy, radiation, metastasis, pathology

### Psychiatry 🧘
**Keywords**: mental, psychiatric, depression, anxiety, psychology, behavioral, counseling, therapy

---

## ⚙️ Advanced Features

### Search Functionality
- Search for files by name in File Management
- Real-time filtering as you type
- Case-insensitive search

### Move Files Between Departments
- Click the move icon on any file
- Select target department
- File is reassigned

### Download Records
- Click download icon on files
- Saves to your device
- Maintains privacy and security

### Delete Records
- Click delete icon
- Confirm deletion
- Permanent removal (use carefully)

---

## 📱 Mobile Experience

The system is fully responsive:
- **Desktop**: Full feature dashboard
- **Tablet**: Optimized sidebar navigation
- **Mobile**: Touch-friendly interface
- All features available on mobile

### Mobile Tips:
1. Use portrait mode for better navigation
2. Hamburger menu in mobile sidebar
3. Tap any stat card to see details
4. Swipe to scroll tables

---

## 🆘 Troubleshooting

### Issue: Files not appearing in dashboard
- **Solution**: Refresh the page (Ctrl+R or Cmd+R)
- Check localStorage is enabled
- Clear browser cache if needed

### Issue: Files not classified correctly
- **Solution**: Admin can manually move files
- Use File Management section
- Select target department

### Issue: Can't login
- **Solution**: Check role selection (Patient/Doctor/Admin)
- Try refreshing the page
- Clear browser cookies

### Issue: Design looks broken
- **Solution**: Update your browser
- Clear browser cache
- Check JavaScript is enabled

---

## 📚 File Formats Supported

✅ **Supported**:
- PDF (.pdf)
- Images (JPG, PNG, GIF)
- Documents (DOC, DOCX)
- Spreadsheets (XLSX, CSV)

⚠️ **Size Limits**:
- Max 50MB per file
- Recommended: <10MB for faster upload

---

## 🔐 Security Reminders

1. **Always logout** when done
2. **Don't share credentials** with others
3. **Review permissions** regularly
4. **Report suspicious activity** to admin
5. **Keep password secure**

---

## 🎓 Learning Pathways

### First Time User?
1. Start with index.html landing page
2. Read features section
3. Watch department overview
4. Try demo login

### Patient Journey:
1. Register new account
2. Complete profile
3. Upload first document
4. Grant doctor access
5. Monitor records

### Doctor Journey:
1. Login with doctor role
2. Check patient list
3. Review medical records
4. Schedule appointments
5. Manage consultations

### Admin Journey:
1. Login with admin role
2. Review system overview
3. Check file classifications
4. Manage user accounts
5. Configure settings

---

## 📞 Need Help?

### Quick Links:
- **README.md**: Full system documentation
- **index.html**: Feature overview
- **Sidebar Help**: Context-specific information
- **Dashboard Tips**: Built-in guidance

---

## ✅ Verification Checklist

After setup, verify everything works:
- [ ] Landing page loads
- [ ] Login page displays all roles
- [ ] Patient dashboard functional
- [ ] Doctor dashboard shows records
- [ ] Admin dashboard operational
- [ ] File upload works
- [ ] Auto-classification active
- [ ] Department separation visible
- [ ] Search functionality works
- [ ] Responsive on mobile

---

**Welcome to MediCare!** 🏥

Start by clicking "Get Started" on the landing page or login with your role to explore the system.
