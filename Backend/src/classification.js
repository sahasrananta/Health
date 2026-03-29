const departments = {
  Cardiology: {
    keywords: ['heart', 'cardiac', 'cardio', 'ecg', 'ekg', 'holter', 'stress', 'angio', 'stent', 'arrhythmia', 'blood pressure']
  },
  Orthopedics: {
    keywords: ['bone', 'orthopedic', 'fracture', 'joint', 'xray', 'mri', 'spine', 'ligament', 'arthritis', 'surgery']
  },
  Neurology: {
    keywords: ['neuro', 'brain', 'nerve', 'eeg', 'seizure', 'migraine', 'brain scan', 'parkinson', 'stroke', 'mri brain']
  },
  'General Medicine': {
    keywords: ['general', 'medicine', 'diagnosis', 'physical', 'checkup', 'blood test', 'lab', 'fever', 'cold', 'infection']
  },
  Oncology: {
    keywords: ['cancer', 'oncology', 'tumor', 'biopsy', 'chemotherapy', 'radiation', 'metastasis', 'pathology']
  },
  Psychiatry: {
    keywords: ['mental', 'psychiatric', 'depression', 'anxiety', 'psychology', 'behavioral', 'counseling', 'therapy']
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

