/**
 * Mock Data Service
 * 
 * This service provides Tamil Nadu-specific mock data for the application.
 * It includes realistic patient names, locations, doctors, and other data
 * relevant to the Tamil Nadu region.
 */

// Tamil Nadu cities and districts
export const tnCities = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 
  'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukkudi',
  'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 
  'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumarapalayam'
];

// Tamil Nadu common first names
export const tnFirstNames = [
  // Male names
  'Anand', 'Arun', 'Bala', 'Chandran', 'Dhanush', 'Ganesh', 'Harish', 
  'Karthik', 'Kumar', 'Lokesh', 'Mahesh', 'Naveen', 'Prabhu', 'Rajesh', 
  'Ramesh', 'Saravanan', 'Senthil', 'Suresh', 'Thamizh', 'Vijay',
  'Murugan', 'Selvam', 'Rajan', 'Kannan', 'Mani', 'Palani', 'Muthu',
  
  // Female names
  'Anitha', 'Bhavani', 'Chitra', 'Deepa', 'Eswari', 'Geetha', 'Hema', 
  'Indhu', 'Jaya', 'Kala', 'Lakshmi', 'Meena', 'Nithya', 'Padma', 
  'Radha', 'Saranya', 'Tamilselvi', 'Uma', 'Valli', 'Yamuna',
  'Selvi', 'Parvathi', 'Malathi', 'Kavitha', 'Shanthi', 'Revathi'
];

// Tamil Nadu common last names
export const tnLastNames = [
  'Murugan', 'Raman', 'Krishnan', 'Subramanian', 'Venkatesh', 'Narayanan',
  'Sundaram', 'Govindan', 'Kannan', 'Palaniappan', 'Shanmugam', 'Annamalai',
  'Chidambaram', 'Devarajan', 'Elangovan', 'Ganesan', 'Iyengar', 'Jeyaraman',
  'Kalyanasundaram', 'Lakshmanan', 'Muthukumar', 'Natarajan', 'Paramasivam',
  'Rajagopal', 'Srinivasan', 'Thangavelu', 'Vasudevan', 'Veerasamy',
  'Iyer', 'Pillai', 'Nadar', 'Gounder', 'Thevar', 'Chettiar', 'Nayak'
];

// Tamil Nadu hospitals and medical centers
export const tnHospitals = [
  'Apollo Hospitals, Chennai',
  'Madras Medical Mission, Chennai',
  'MIOT International, Chennai',
  'Kauvery Hospital, Chennai',
  'Sri Ramachandra Medical Centre, Chennai',
  'PSG Hospitals, Coimbatore',
  'KG Hospital, Coimbatore',
  'Ganga Medical Centre, Coimbatore',
  'Meenakshi Mission Hospital, Madurai',
  'Velammal Medical College Hospital, Madurai',
  'JIPMER, Puducherry',
  'Mahatma Gandhi Medical College, Puducherry',
  'Christian Medical College, Vellore',
  'Chettinad Hospital, Kelambakkam',
  'SRM Medical College Hospital, Kattankulathur'
];

// Tamil Nadu doctors with specialties
export const tnDoctors = [
  { name: 'Dr. Anand Subramanian', specialty: 'Cardiology', hospital: 'Apollo Hospitals, Chennai' },
  { name: 'Dr. Meena Krishnan', specialty: 'Gynecology', hospital: 'Kauvery Hospital, Chennai' },
  { name: 'Dr. Rajesh Venkatesh', specialty: 'Orthopedics', hospital: 'MIOT International, Chennai' },
  { name: 'Dr. Lakshmi Narayanan', specialty: 'Pediatrics', hospital: 'Sri Ramachandra Medical Centre, Chennai' },
  { name: 'Dr. Senthil Kumar', specialty: 'Neurology', hospital: 'Madras Medical Mission, Chennai' },
  { name: 'Dr. Saranya Raman', specialty: 'Dermatology', hospital: 'Apollo Hospitals, Chennai' },
  { name: 'Dr. Ganesh Palaniappan', specialty: 'Gastroenterology', hospital: 'PSG Hospitals, Coimbatore' },
  { name: 'Dr. Uma Shankar', specialty: 'Endocrinology', hospital: 'KG Hospital, Coimbatore' },
  { name: 'Dr. Karthik Sundaram', specialty: 'Nephrology', hospital: 'Ganga Medical Centre, Coimbatore' },
  { name: 'Dr. Deepa Chandran', specialty: 'Ophthalmology', hospital: 'Meenakshi Mission Hospital, Madurai' },
  { name: 'Dr. Vijay Govindan', specialty: 'Pulmonology', hospital: 'Velammal Medical College Hospital, Madurai' },
  { name: 'Dr. Nithya Kannan', specialty: 'Psychiatry', hospital: 'JIPMER, Puducherry' },
  { name: 'Dr. Prabhu Shanmugam', specialty: 'Urology', hospital: 'Christian Medical College, Vellore' },
  { name: 'Dr. Chitra Devarajan', specialty: 'Oncology', hospital: 'Chettinad Hospital, Kelambakkam' },
  { name: 'Dr. Harish Natarajan', specialty: 'Hematology', hospital: 'SRM Medical College Hospital, Kattankulathur' }
];

// Sample types commonly used in Tamil Nadu labs
export const sampleTypes = [
  { id: 1, type_name: 'Blood', type_code: 'BLD', description: 'Whole blood sample' },
  { id: 2, type_name: 'Serum', type_code: 'SER', description: 'Blood serum sample' },
  { id: 3, type_name: 'Plasma', type_code: 'PLS', description: 'Blood plasma sample' },
  { id: 4, type_name: 'Urine', type_code: 'URN', description: 'Urine sample' },
  { id: 5, type_name: 'Stool', type_code: 'STL', description: 'Stool sample' },
  { id: 6, type_name: 'CSF', type_code: 'CSF', description: 'Cerebrospinal fluid' },
  { id: 7, type_name: 'Sputum', type_code: 'SPT', description: 'Sputum sample' },
  { id: 8, type_name: 'Swab', type_code: 'SWB', description: 'Swab sample' },
  { id: 9, type_name: 'Tissue', type_code: 'TSU', description: 'Tissue sample' },
  { id: 10, type_name: 'Bone Marrow', type_code: 'BMA', description: 'Bone marrow aspirate' }
];

// Container types
export const containers = [
  { id: 1, container_name: 'Red Top Tube', color_code: 'Red', sample_type_id: 2, volume_required: '5ml', additive: 'None' },
  { id: 2, container_name: 'Purple Top Tube', color_code: 'Purple', sample_type_id: 1, volume_required: '3ml', additive: 'EDTA' },
  { id: 3, container_name: 'Blue Top Tube', color_code: 'Blue', sample_type_id: 3, volume_required: '2.7ml', additive: 'Sodium Citrate' },
  { id: 4, container_name: 'Green Top Tube', color_code: 'Green', sample_type_id: 3, volume_required: '4ml', additive: 'Heparin' },
  { id: 5, container_name: 'Gray Top Tube', color_code: 'Gray', sample_type_id: 3, volume_required: '4ml', additive: 'Sodium Fluoride' },
  { id: 6, container_name: 'Urine Container', color_code: 'Yellow', sample_type_id: 4, volume_required: '30ml', additive: 'None' },
  { id: 7, container_name: 'Stool Container', color_code: 'Brown', sample_type_id: 5, volume_required: '10g', additive: 'None' },
  { id: 8, container_name: 'CSF Tube', color_code: 'Clear', sample_type_id: 6, volume_required: '1ml', additive: 'None' },
  { id: 9, container_name: 'Sputum Container', color_code: 'Clear', sample_type_id: 7, volume_required: '5ml', additive: 'None' },
  { id: 10, container_name: 'Swab Tube', color_code: 'Pink', sample_type_id: 8, volume_required: 'N/A', additive: 'Transport Medium' }
];

// Common tests performed in Tamil Nadu labs
export const tests = [
  { id: 1, test_name: 'Complete Blood Count (CBC)', sample_type_id: 1, turnaround_time: '1 day', price: 350 },
  { id: 2, test_name: 'Blood Glucose Fasting', sample_type_id: 2, turnaround_time: '1 day', price: 150 },
  { id: 3, test_name: 'HbA1c', sample_type_id: 1, turnaround_time: '1 day', price: 450 },
  { id: 4, test_name: 'Lipid Profile', sample_type_id: 2, turnaround_time: '1 day', price: 600 },
  { id: 5, test_name: 'Liver Function Test', sample_type_id: 2, turnaround_time: '1 day', price: 800 },
  { id: 6, test_name: 'Kidney Function Test', sample_type_id: 2, turnaround_time: '1 day', price: 700 },
  { id: 7, test_name: 'Thyroid Profile', sample_type_id: 2, turnaround_time: '1 day', price: 850 },
  { id: 8, test_name: 'Urine Routine', sample_type_id: 4, turnaround_time: '1 day', price: 200 },
  { id: 9, test_name: 'Stool Routine', sample_type_id: 5, turnaround_time: '1 day', price: 250 },
  { id: 10, test_name: 'Dengue NS1 Antigen', sample_type_id: 2, turnaround_time: '1 day', price: 700 },
  { id: 11, test_name: 'Malaria Parasite', sample_type_id: 1, turnaround_time: '1 day', price: 300 },
  { id: 12, test_name: 'Widal Test', sample_type_id: 2, turnaround_time: '1 day', price: 350 },
  { id: 13, test_name: 'COVID-19 RT-PCR', sample_type_id: 8, turnaround_time: '1-2 days', price: 1200 },
  { id: 14, test_name: 'Vitamin B12', sample_type_id: 2, turnaround_time: '2 days', price: 950 },
  { id: 15, test_name: 'Vitamin D3', sample_type_id: 2, turnaround_time: '2 days', price: 1200 }
];

// Test panels commonly ordered in Tamil Nadu
export const testPanels = [
  { 
    id: 1, 
    panel_name: 'Master Health Checkup', 
    tests: [1, 2, 4, 5, 6, 7, 8],
    price: 2500,
    description: 'Comprehensive health checkup including blood, urine tests'
  },
  { 
    id: 2, 
    panel_name: 'Diabetes Profile', 
    tests: [2, 3],
    price: 550,
    description: 'Tests for diabetes diagnosis and monitoring'
  },
  { 
    id: 3, 
    panel_name: 'Cardiac Risk Profile', 
    tests: [1, 4, 6],
    price: 1500,
    description: 'Assessment of cardiac health and risk factors'
  },
  { 
    id: 4, 
    panel_name: 'Fever Panel', 
    tests: [1, 10, 11, 12],
    price: 1800,
    description: 'Tests for common causes of fever in Tamil Nadu'
  },
  { 
    id: 5, 
    panel_name: 'Anemia Profile', 
    tests: [1, 14],
    price: 1200,
    description: 'Tests to diagnose causes of anemia'
  }
];

// Insurance providers common in Tamil Nadu
export const insuranceProviders = [
  'Star Health Insurance',
  'United India Insurance',
  'National Insurance Company',
  'New India Assurance',
  'ICICI Lombard',
  'Bajaj Allianz',
  'HDFC ERGO',
  'Apollo Munich Health Insurance',
  'Reliance General Insurance',
  'Cholamandalam MS General Insurance',
  'Tamil Nadu Government Health Insurance',
  'Chief Minister\'s Comprehensive Health Insurance Scheme'
];

// Generate a random Tamil Nadu patient
export const generateRandomPatient = () => {
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';
  const firstName = tnFirstNames[Math.floor(Math.random() * tnFirstNames.length)];
  const lastName = tnLastNames[Math.floor(Math.random() * tnLastNames.length)];
  const city = tnCities[Math.floor(Math.random() * tnCities.length)];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const bloodGroup = bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
  
  // Generate a random date of birth (18-80 years old)
  const now = new Date();
  const minAge = 18;
  const maxAge = 80;
  const birthYear = now.getFullYear() - minAge - Math.floor(Math.random() * (maxAge - minAge));
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1; // Avoid invalid dates
  const dateOfBirth = new Date(birthYear, birthMonth, birthDay);
  
  // Generate a random 10-digit phone number starting with 9, 8, or 7
  const phonePrefix = [9, 8, 7][Math.floor(Math.random() * 3)];
  const phoneNumber = phonePrefix + '' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  
  return {
    first_name: firstName,
    last_name: lastName,
    gender: gender,
    date_of_birth: dateOfBirth.toISOString().split('T')[0],
    phone: phoneNumber,
    email: (firstName.toLowerCase() + '.' + lastName.toLowerCase() + '@example.com'),
    address: Math.floor(Math.random() * 100) + 1 + ', ' + ['Main Road', 'Cross Street', 'Temple Street', 'Nehru Street', 'Gandhi Road'][Math.floor(Math.random() * 5)],
    city: city,
    state: 'Tamil Nadu',
    postal_code: Math.floor(Math.random() * 900000) + 600000, // Tamil Nadu PIN codes
    blood_group: bloodGroup,
    insurance_provider: Math.random() > 0.3 ? insuranceProviders[Math.floor(Math.random() * insuranceProviders.length)] : '',
    insurance_id: Math.random() > 0.3 ? 'INS' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0') : ''
  };
};

// Export all mock data
export default {
  tnCities,
  tnFirstNames,
  tnLastNames,
  tnHospitals,
  tnDoctors,
  sampleTypes,
  containers,
  tests,
  testPanels,
  insuranceProviders,
  generateRandomPatient
};
