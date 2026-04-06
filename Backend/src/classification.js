const departments = {
  Cardiology: {
    keywords: ['heart', 'cardiac', 'cardio', 'ecg', 'ekg', 'holter', 'stress', 'angio', 'stent', 'arrhythmia', 'blood pressure', 'valve', 'murmur']
  },
  Orthopedics: {
    keywords: ['bone', 'orthopedic', 'fracture', 'joint', 'xray', 'mri', 'spine', 'ligament', 'arthritis', 'surgery', 'vertebra', 'patella', 'hip']
  },
  Neurology: {
    keywords: ['neuro', 'brain', 'nerve', 'eeg', 'seizure', 'migraine', 'brain scan', 'parkinson', 'stroke', 'mri brain', 'dementia', 'alzheimer']
  },
  'General Medicine': {
    keywords: ['general', 'medicine', 'diagnosis', 'physical', 'checkup', 'blood test', 'lab', 'fever', 'cold', 'infection', 'standard', 'primary', 'care']
  },
  Oncology: {
    keywords: ['cancer', 'oncology', 'tumor', 'biopsy', 'chemotherapy', 'radiation', 'metastasis', 'pathology', 'malignant', 'benign', 'carcinoma']
  },
  Psychiatry: {
    keywords: ['mental', 'psychiatric', 'depression', 'anxiety', 'psychology', 'behavioral', 'counseling', 'therapy', 'mood', 'trauma', 'adhd', 'ptsd']
  },
  Pediatrics: {
    keywords: ['child', 'infant', 'pediatric', 'vaccination', 'growth chart', 'adolescent', 'neonatal', 'toddler', 'school physical']
  },
  Dermatology: {
    keywords: ['skin', 'rash', 'dermatology', 'eczema', 'biopsy', 'lesion', 'mole', 'dermis', 'psoriasis', 'acne', 'dermatitis']
  },
  Urology: {
    keywords: ['kidney', 'bladder', 'urinary', 'urology', 'prostate', 'renal', 'nephrology', 'urostomy', 'kidney stone']
  },
  Gastroenterology: {
    keywords: ['stomach', 'colon', 'endoscopy', 'liver', 'digestive', 'gastro', 'gi', 'bowel', 'gastric', 'duodenum', 'intestinal']
  }
};

function countOccurrences(text, keyword) {
  const re = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  return (text.match(re) || []).length;
}

export function classifyRecord({ name, description, content, metadata }) {
  const combined = `${name || ''} ${description || ''} ${content || ''} ${metadata ? JSON.stringify(metadata) : ''}`.toLowerCase();

  let bestDept = 'General Medicine';
  let bestScore = 0;

  for (const [dept, data] of Object.entries(departments)) {
    let score = 0;
    for (const keyword of data.keywords) {
      score += countOccurrences(combined, keyword.toLowerCase());
    }
    if (score > bestScore) {
      bestScore = score;
      bestDept = dept;
    }
  }

  const confidence = bestScore <= 0 ? 0.2 : Math.min(0.95, 0.4 + bestScore * 0.12);
  return { department: bestDept, confidence, score: bestScore };
}

export function listDepartments() {
  return Object.keys(departments);
}

