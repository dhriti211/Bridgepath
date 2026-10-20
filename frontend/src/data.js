export const PROFESSIONS = [
  { value: 'nurse', label: 'Registered Nurse' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'teacher', label: 'K-12 Teacher' },
]

export const ENGLISH_TESTS = ['IELTS Academic', 'TOEFL iBT', 'OET', 'PTE Academic', 'Duolingo English Test']

export const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
  'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
]

// One-click example profiles for the demo.
export const EXAMPLES = [
  {
    label: 'Nurse from the Philippines → Arizona',
    form: {
      profession: 'nurse', country: 'Philippines', degree: 'Bachelor of Science in Nursing',
      years_experience: 6, target_state: 'Arizona', english_test_type: 'IELTS Academic', english_test_score: '7.0',
      notes: 'ICU nurse in Manila. Moved to Phoenix on a family visa, working as a caregiver.',
    },
  },
  {
    label: 'Civil engineer from India → Texas',
    form: {
      profession: 'engineer', country: 'India', degree: 'B.Tech Civil Engineering',
      years_experience: 8, target_state: 'Texas', english_test_type: '', english_test_score: '',
      notes: 'Structural design for highway bridges. Green card holder, currently driving rideshare.',
    },
  },
  {
    label: 'Teacher from Mexico → California',
    form: {
      profession: 'teacher', country: 'Mexico', degree: 'Licenciatura en Educación Primaria',
      years_experience: 10, target_state: 'California', english_test_type: 'TOEFL iBT', english_test_score: '95',
      notes: 'Elementary teacher, bilingual Spanish/English. Working as a teaching aide.',
    },
  },
]

export const STEP_LABELS = {
  intake: 'Understanding your background',
  equivalency: 'Matching your degree to the US',
  research: 'Searching official sources',
  synthesis: 'Reading the requirements',
  plan: 'Planning your roadmap',
  verify: 'Checking every source',
}

export const STEP_MODELS = {
  intake: 'Nemotron Nano',
  equivalency: 'Nemotron Ultra',
  research: 'Tavily',
  synthesis: 'Nemotron Super',
  plan: 'Nemotron Ultra',
  verify: 'Source check',
}
