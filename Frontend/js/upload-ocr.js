// Enhanced upload with client-side OCR and backend API
async function uploadDocument() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput || fileInput.files.length === 0) {
        alert('Please select a file to upload');
        return;
    }

    const file = fileInput.files[0];
    const token = localStorage.getItem('authToken');

    if (!token) {
        alert('Please log in first so we can upload this record to your account.');
        return;
    }

    let ocrText = '';

    try {
        if (window.Tesseract && file.type && file.type.startsWith('image/')) {
            const result = await Tesseract.recognize(file, 'eng', {
                logger: m => console.log('OCR progress', m)
            });
            ocrText = result?.data?.text || '';
        }
    } catch (e) {
        console.warn('OCR failed, continuing without OCR', e);
    }

    const formData = new FormData();
    formData.append('file', file);
    if (ocrText) {
        formData.append('ocrText', ocrText);
    }

    try {
        const response = await fetch('http://localhost:4000/api/records/patients/me', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            alert('Upload failed: ' + (err.error || response.statusText));
            return;
        }

        const data = await response.json();
        alert('Document uploaded and classified as: ' + data.record.department);
        fileInput.value = '';
    } catch (e) {
        console.error(e);
        alert('Network error while uploading. Please try again.');
    }
}

