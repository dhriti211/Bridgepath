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

export const DEGREE_LEVELS = ["Bachelor's", "Master's", 'PhD']

export const STAGES = [
  { value: 'studying', label: 'Still studying (F-1)' },
  { value: 'opt', label: 'On OPT' },
  { value: 'stem_opt', label: 'On STEM OPT' },
  { value: 'other', label: 'Something else' },
]

// One-click example student profiles for the demo.
export const STUDENT_EXAMPLES = [
  {
    label: 'MS Computer Science → software engineer',
    form: {
      degree_level: "Master's", major: 'Computer Science', school: '', country: 'India', stem: 'yes',
      stage: 'studying', program_end: '2027-05-15', opt_end: '', target_role: 'Software engineer',
      target_state: 'Anywhere in the US',
      notes: 'Summer internship at a fintech startup on CPT. Backend work in Go and Python.',
    },
  },
  {
    label: 'MS Data Science on OPT → data engineer',
    form: {
      degree_level: "Master's", major: 'Data Science', school: '', country: 'China', stem: 'yes',
      stage: 'opt', program_end: '2026-05-10', opt_end: '2027-07-01', target_role: 'Data engineer',
      target_state: 'Arizona',
      notes: 'Working as a data analyst on OPT at a company that does not sponsor H-1B.',
    },
  },
  {
    label: 'BS Mechanical Engineering → design engineer',
    form: {
      degree_level: "Bachelor's", major: 'Mechanical Engineering', school: '', country: 'Nigeria', stem: 'yes',
      stage: 'studying', program_end: '2027-12-15', opt_end: '', target_role: 'Mechanical design engineer',
      target_state: 'Texas',
      notes: 'SolidWorks and FEA projects, Formula SAE team lead.',
    },
  },
]

export const STEP_LABELS = {
  intake: 'Understanding your background',
  dates: 'Working out your key dates',
  equivalency: 'Matching your degree to the US',
  research: 'Searching official sources',
  policy: 'Checking for recent rule changes',
  synthesis: 'Reading the requirements',
  plan: 'Planning your roadmap',
  verify: 'Checking every source',
}

export const STEP_MODELS = {
  intake: 'Nemotron Nano',
  dates: 'F-1 rules',
  equivalency: 'Nemotron Super',
  research: 'Tavily',
  policy: 'Tavily news',
  synthesis: 'Nemotron Super',
  plan: 'Nemotron Ultra',
  verify: 'Source check',
}
