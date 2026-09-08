// ============================================================================
// RaktSetu - Data Store & Reference Systems
// "Find the Right Blood, Faster"
// ============================================================================

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Bombay (hh)', 'Rh-null'];

export const BLOOD_COMPONENTS = [
  { id: 'prbc', name: 'Packed RBC (PRBC)', short: 'PRBC', desc: 'Packed Red Blood Cells for trauma, anemia, surgeries', shelfLife: '42 Days' },
  { id: 'wb', name: 'Whole Blood (WB)', short: 'Whole Blood', desc: 'Unseparated blood for severe acute hemorrhage', shelfLife: '35 Days' },
  { id: 'sdp', name: 'Single Donor Platelets (SDP)', short: 'SDP Platelets', desc: 'High-yield platelets from single donor (Dengue, Chemo)', shelfLife: '5 Days' },
  { id: 'rdp', name: 'Random Donor Platelets (RDP)', short: 'RDP Platelets', desc: 'Platelet concentrate pooled from whole blood', shelfLife: '5 Days' },
  { id: 'ffp', name: 'Fresh Frozen Plasma (FFP)', short: 'FFP (Plasma)', desc: 'Coagulation factors & clotting support', shelfLife: '1 Year' },
  { id: 'cryo', name: 'Cryoprecipitate', short: 'Cryo', desc: 'Fibrinogen & Factor VIII rich component', shelfLife: '1 Year' }
];

export const CITIES = [
  { id: 'gurugram', name: 'Gurugram (Gurgaon)', state: 'Haryana', lat: 28.4595, lng: 77.0266, radiusKm: 35 },
  { id: 'delhi', name: 'Delhi NCR (Central / South / East / West)', state: 'Delhi', lat: 28.6139, lng: 77.2090, radiusKm: 45 },
  { id: 'noida', name: 'Noida & Greater Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910, radiusKm: 30 },
  { id: 'faridabad', name: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178, radiusKm: 25 },
  { id: 'mumbai', name: 'Mumbai Metropolitan Region', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, radiusKm: 40 },
  { id: 'bengaluru', name: 'Bengaluru (Bangalore)', state: 'Karnataka', lat: 12.9716, lng: 77.5946, radiusKm: 35 }
];

// Initial Verified Blood Centres Dataset with Realistic Inventory, Geocodes, Licences, Contact Info
export const INITIAL_BLOOD_CENTRES = [
  {
    id: 'bc-medanta',
    name: 'Medanta The Medicity Blood Bank & Transfusion Medicine',
    shortName: 'Medanta Blood Bank',
    city: 'gurugram',
    area: 'Sector 38, Gurugram',
    address: 'CH Bakhtawar Singh Road, Near Rajiv Chowk, Sector 38, Gurugram, Haryana 122001',
    lat: 28.4398,
    lng: 77.0425,
    phone: '+91 124 414 1414',
    emergencyHelpline: '+91 124 483 4567',
    nodalOfficer: 'Dr. Neha Agnihotri (Chief Transfusion Officer)',
    licenseNumber: 'DL-HR-GGM-2012-9844',
    nabhAccredited: true,
    govtRecognized: true,
    redCrossAffiliated: false,
    operatingHours: '24x7 Emergency Operational',
    is24x7: true,
    emergencyResponseRating: 4.9,
    avgResponseMinutes: 4,
    lastStockUpdate: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 mins ago
    verifiedBy: 'State Drug Controller & NABH Central Bureau',
    features: ['Component Separation Unit', 'Apheresis Facility (SDP)', 'Irradiation Unit', 'NAT Testing (Nucleic Acid Test)', 'Cryopreservation'],
    stock: {
      'O+': { prbc: 18, wb: 6, sdp: 5, rdp: 14, ffp: 22, cryo: 8 },
      'O-': { prbc: 6, wb: 2, sdp: 3, rdp: 4, ffp: 8, cryo: 3 },
      'A+': { prbc: 14, wb: 4, sdp: 4, rdp: 10, ffp: 16, cryo: 6 },
      'A-': { prbc: 4, wb: 1, sdp: 2, rdp: 3, ffp: 5, cryo: 2 },
      'B+': { prbc: 22, wb: 8, sdp: 6, rdp: 18, ffp: 25, cryo: 9 },
      'B-': { prbc: 5, wb: 2, sdp: 2, rdp: 5, ffp: 7, cryo: 3 },
      'AB+': { prbc: 11, wb: 3, sdp: 3, rdp: 8, ffp: 14, cryo: 5 },
      'AB-': { prbc: 3, wb: 1, sdp: 1, rdp: 2, ffp: 4, cryo: 1 },
      'Bombay (hh)': { prbc: 1, wb: 0, sdp: 0, rdp: 1, ffp: 1, cryo: 0 },
      'Rh-null': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 }
    }
  },
  {
    id: 'bc-rotary-ggn',
    name: 'Rotary Blood Centre Gurugram (NABH Accredited)',
    shortName: 'Rotary Blood Centre',
    city: 'gurugram',
    area: 'Sector 10A, Gurugram',
    address: 'Institutional Area, Near Civil Hospital, Sector 10A, Gurugram, Haryana 122001',
    lat: 28.4552,
    lng: 77.0125,
    phone: '+91 124 225 5777',
    emergencyHelpline: '+91 98112 34567',
    nodalOfficer: 'Dr. Sandeep Khemka',
    licenseNumber: 'DL-HR-GGM-2008-5432',
    nabhAccredited: true,
    govtRecognized: true,
    redCrossAffiliated: true,
    operatingHours: '24x7 Emergency Operational',
    is24x7: true,
    emergencyResponseRating: 4.8,
    avgResponseMinutes: 6,
    lastStockUpdate: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
    verifiedBy: 'Haryana Blood Transfusion Council',
    features: ['Subsidized Emergency Units', 'Mobile Donation Vans', 'NAT Tested Blood', 'Platelet Apheresis'],
    stock: {
      'O+': { prbc: 24, wb: 10, sdp: 4, rdp: 20, ffp: 30, cryo: 10 },
      'O-': { prbc: 5, wb: 1, sdp: 2, rdp: 3, ffp: 6, cryo: 2 },
      'A+': { prbc: 16, wb: 5, sdp: 3, rdp: 12, ffp: 18, cryo: 5 },
      'A-': { prbc: 3, wb: 0, sdp: 1, rdp: 2, ffp: 4, cryo: 1 },
      'B+': { prbc: 28, wb: 12, sdp: 5, rdp: 22, ffp: 35, cryo: 12 },
      'B-': { prbc: 4, wb: 1, sdp: 2, rdp: 4, ffp: 6, cryo: 2 },
      'AB+': { prbc: 12, wb: 4, sdp: 2, rdp: 9, ffp: 15, cryo: 4 },
      'AB-': { prbc: 2, wb: 0, sdp: 1, rdp: 2, ffp: 3, cryo: 1 },
      'Bombay (hh)': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 },
      'Rh-null': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 }
    }
  },
  {
    id: 'bc-fortis-ggn',
    name: 'Fortis Memorial Research Institute (FMRI) Blood Bank',
    shortName: 'Fortis FMRI Blood Bank',
    city: 'gurugram',
    area: 'Sector 44, HUDA City Centre',
    address: 'Sector 44, Opposite HUDA City Centre Metro Station, Gurugram, Haryana 122002',
    lat: 28.4590,
    lng: 77.0725,
    phone: '+91 124 496 2200',
    emergencyHelpline: '+91 124 496 2222',
    nodalOfficer: 'Dr. Aradhana Sachdeva',
    licenseNumber: 'DL-HR-GGM-2014-1102',
    nabhAccredited: true,
    govtRecognized: true,
    redCrossAffiliated: false,
    operatingHours: '24x7 Emergency Operational',
    is24x7: true,
    emergencyResponseRating: 4.7,
    avgResponseMinutes: 5,
    lastStockUpdate: new Date(Date.now() - 19 * 60 * 1000).toISOString(), // 19 mins ago
    verifiedBy: 'Central Drugs Standard Control Organisation (CDSCO)',
    features: ['Advanced Gel Card Crossmatch', 'Platelet Agitator Storage', 'Leukodepleted Blood Bags', '24x7 STAT Testing'],
    stock: {
      'O+': { prbc: 15, wb: 4, sdp: 6, rdp: 12, ffp: 19, cryo: 7 },
      'O-': { prbc: 4, wb: 1, sdp: 2, rdp: 3, ffp: 5, cryo: 2 },
      'A+': { prbc: 12, wb: 3, sdp: 4, rdp: 8, ffp: 14, cryo: 4 },
      'A-': { prbc: 2, wb: 0, sdp: 1, rdp: 2, ffp: 3, cryo: 1 },
      'B+': { prbc: 19, wb: 7, sdp: 5, rdp: 15, ffp: 22, cryo: 8 },
      'B-': { prbc: 3, wb: 1, sdp: 1, rdp: 3, ffp: 5, cryo: 2 },
      'AB+': { prbc: 9, wb: 2, sdp: 2, rdp: 6, ffp: 11, cryo: 3 },
      'AB-': { prbc: 1, wb: 0, sdp: 1, rdp: 1, ffp: 2, cryo: 1 },
      'Bombay (hh)': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 },
      'Rh-null': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 }
    }
  },
  {
    id: 'bc-aiims-delhi',
    name: 'AIIMS Main Blood Bank & Dept. of Transfusion Medicine',
    shortName: 'AIIMS New Delhi Blood Bank',
    city: 'delhi',
    area: 'Ansari Nagar, New Delhi',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
    lat: 28.5672,
    lng: 77.2100,
    phone: '+91 11 2658 8500',
    emergencyHelpline: '+91 11 2659 4444',
    nodalOfficer: 'Prof. (Dr.) Rajendra Chaudhary',
    licenseNumber: 'DL-DL-DEL-1976-0012',
    nabhAccredited: true,
    govtRecognized: true,
    redCrossAffiliated: true,
    operatingHours: '24x7 Emergency Operational',
    is24x7: true,
    emergencyResponseRating: 4.95,
    avgResponseMinutes: 3,
    lastStockUpdate: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    verifiedBy: 'National Apex Blood Centre / Ministry of Health',
    features: ['National Rare Blood Group Registry', 'Plasma Fractionation Support', 'Automated NAT Screening', 'Pediatric Blood Bags'],
    stock: {
      'O+': { prbc: 45, wb: 20, sdp: 12, rdp: 35, ffp: 60, cryo: 25 },
      'O-': { prbc: 12, wb: 4, sdp: 6, rdp: 10, ffp: 18, cryo: 8 },
      'A+': { prbc: 35, wb: 15, sdp: 8, rdp: 25, ffp: 40, cryo: 18 },
      'A-': { prbc: 8, wb: 2, sdp: 3, rdp: 6, ffp: 12, cryo: 5 },
      'B+': { prbc: 50, wb: 22, sdp: 14, rdp: 40, ffp: 65, cryo: 30 },
      'B-': { prbc: 10, wb: 3, sdp: 4, rdp: 8, ffp: 15, cryo: 6 },
      'AB+': { prbc: 25, wb: 8, sdp: 6, rdp: 18, ffp: 30, cryo: 12 },
      'AB-': { prbc: 6, wb: 2, sdp: 2, rdp: 4, ffp: 8, cryo: 3 },
      'Bombay (hh)': { prbc: 2, wb: 1, sdp: 0, rdp: 1, ffp: 2, cryo: 1 },
      'Rh-null': { prbc: 1, wb: 0, sdp: 0, rdp: 0, ffp: 1, cryo: 0 }
    }
  },
  {
    id: 'bc-redcross-delhi',
    name: 'Indian Red Cross Society National Headquarters Blood Centre',
    shortName: 'Red Cross NHQ Blood Centre',
    city: 'delhi',
    area: 'Red Cross Road, New Delhi',
    address: '1, Red Cross Road, Near Parliament Street, New Delhi, Delhi 110001',
    lat: 28.6219,
    lng: 77.2115,
    phone: '+91 11 2371 6441',
    emergencyHelpline: '+91 11 2371 6442',
    nodalOfficer: 'Dr. Vanshree Singh (Director Blood Services)',
    licenseNumber: 'DL-DL-DEL-1962-0001',
    nabhAccredited: true,
    govtRecognized: true,
    redCrossAffiliated: true,
    operatingHours: '24x7 Emergency Operational',
    is24x7: true,
    emergencyResponseRating: 4.85,
    avgResponseMinutes: 5,
    lastStockUpdate: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 mins ago
    verifiedBy: 'Indian Red Cross Society & State Drug Control',
    features: ['Voluntary Non-Remunerated Blood Service', 'Thalassemia Free Issue Support', '24x7 Call Center', 'Refrigerated Transport'],
    stock: {
      'O+': { prbc: 32, wb: 14, sdp: 8, rdp: 28, ffp: 45, cryo: 18 },
      'O-': { prbc: 7, wb: 2, sdp: 3, rdp: 6, ffp: 11, cryo: 4 },
      'A+': { prbc: 22, wb: 9, sdp: 5, rdp: 18, ffp: 28, cryo: 10 },
      'A-': { prbc: 5, wb: 1, sdp: 2, rdp: 4, ffp: 7, cryo: 2 },
      'B+': { prbc: 38, wb: 16, sdp: 10, rdp: 30, ffp: 48, cryo: 20 },
      'B-': { prbc: 6, wb: 2, sdp: 2, rdp: 5, ffp: 9, cryo: 3 },
      'AB+': { prbc: 16, wb: 6, sdp: 4, rdp: 12, ffp: 20, cryo: 7 },
      'AB-': { prbc: 3, wb: 1, sdp: 1, rdp: 2, ffp: 4, cryo: 1 },
      'Bombay (hh)': { prbc: 1, wb: 0, sdp: 0, rdp: 0, ffp: 1, cryo: 0 },
      'Rh-null': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 }
    }
  },
  {
    id: 'bc-max-saket',
    name: 'Max Super Speciality Hospital Blood Transfusion Centre',
    shortName: 'Max Saket Blood Centre',
    city: 'delhi',
    area: 'Saket, South Delhi',
    address: '1, 2, Press Enclave Marg, Saket Institutional Area, New Delhi, Delhi 110017',
    lat: 28.5273,
    lng: 77.2117,
    phone: '+91 11 2651 5050',
    emergencyHelpline: '+91 11 4055 4055',
    nodalOfficer: 'Dr. Gita Sharma',
    licenseNumber: 'DL-DL-DEL-2006-4412',
    nabhAccredited: true,
    govtRecognized: true,
    redCrossAffiliated: false,
    operatingHours: '24x7 Emergency Operational',
    is24x7: true,
    emergencyResponseRating: 4.75,
    avgResponseMinutes: 5,
    lastStockUpdate: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    verifiedBy: 'State Health Authority & NABH',
    features: ['Stem Cell / Bone Marrow Support', 'Automated Cell Separator', 'Leukoreduction Filters'],
    stock: {
      'O+': { prbc: 20, wb: 5, sdp: 7, rdp: 16, ffp: 26, cryo: 11 },
      'O-': { prbc: 5, wb: 1, sdp: 2, rdp: 4, ffp: 7, cryo: 3 },
      'A+': { prbc: 15, wb: 4, sdp: 4, rdp: 11, ffp: 18, cryo: 6 },
      'A-': { prbc: 3, wb: 1, sdp: 1, rdp: 2, ffp: 4, cryo: 1 },
      'B+': { prbc: 24, wb: 8, sdp: 6, rdp: 19, ffp: 30, cryo: 14 },
      'B-': { prbc: 4, wb: 1, sdp: 2, rdp: 3, ffp: 6, cryo: 2 },
      'AB+': { prbc: 10, wb: 3, sdp: 3, rdp: 7, ffp: 12, cryo: 4 },
      'AB-': { prbc: 2, wb: 0, sdp: 1, rdp: 2, ffp: 3, cryo: 1 },
      'Bombay (hh)': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 },
      'Rh-null': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 }
    }
  },
  {
    id: 'bc-safdarjung',
    name: 'VMMC & Safdarjung Hospital Regional Blood Centre',
    shortName: 'Safdarjung Hospital Blood Bank',
    city: 'delhi',
    area: 'Ring Road, Opposite AIIMS, New Delhi',
    address: 'Ring Road, Safdarjung Enclave, New Delhi, Delhi 110029',
    lat: 28.5700,
    lng: 77.2065,
    phone: '+91 11 2616 5060',
    emergencyHelpline: '+91 11 2619 8480',
    nodalOfficer: 'Dr. Sunita Murmu',
    licenseNumber: 'DL-DL-DEL-1981-0199',
    nabhAccredited: true,
    govtRecognized: true,
    redCrossAffiliated: true,
    operatingHours: '24x7 Emergency Operational',
    is24x7: true,
    emergencyResponseRating: 4.7,
    avgResponseMinutes: 6,
    lastStockUpdate: new Date(Date.now() - 32 * 60 * 1000).toISOString(), // 32 mins ago
    verifiedBy: 'Ministry of Health & Family Welfare',
    features: ['Mass Casualty Emergency Protocol', 'Trauma Centre Fast Track', 'Whole Blood & Platelets Buffer'],
    stock: {
      'O+': { prbc: 28, wb: 15, sdp: 5, rdp: 24, ffp: 38, cryo: 14 },
      'O-': { prbc: 6, wb: 2, sdp: 2, rdp: 4, ffp: 9, cryo: 3 },
      'A+': { prbc: 20, wb: 8, sdp: 4, rdp: 15, ffp: 24, cryo: 8 },
      'A-': { prbc: 4, wb: 1, sdp: 1, rdp: 3, ffp: 5, cryo: 2 },
      'B+': { prbc: 34, wb: 14, sdp: 7, rdp: 28, ffp: 42, cryo: 16 },
      'B-': { prbc: 5, wb: 2, sdp: 2, rdp: 4, ffp: 7, cryo: 2 },
      'AB+': { prbc: 14, wb: 5, sdp: 3, rdp: 10, ffp: 16, cryo: 5 },
      'AB-': { prbc: 3, wb: 1, sdp: 1, rdp: 2, ffp: 4, cryo: 1 },
      'Bombay (hh)': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 },
      'Rh-null': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 }
    }
  },
  {
    id: 'bc-jaypee-noida',
    name: 'Jaypee Hospital Blood Bank & Transfusion Medicine',
    shortName: 'Jaypee Hospital Blood Bank',
    city: 'noida',
    area: 'Sector 128, Noida-Greater Noida Expressway',
    address: 'Sector 128, Wish Town, Noida, Uttar Pradesh 201304',
    lat: 28.5175,
    lng: 77.3688,
    phone: '+91 120 412 2222',
    emergencyHelpline: '+91 120 412 2200',
    nodalOfficer: 'Dr. Vivek Mittal',
    licenseNumber: 'DL-UP-NOI-2015-3398',
    nabhAccredited: true,
    govtRecognized: true,
    redCrossAffiliated: false,
    operatingHours: '24x7 Emergency Operational',
    is24x7: true,
    emergencyResponseRating: 4.8,
    avgResponseMinutes: 5,
    lastStockUpdate: new Date(Date.now() - 11 * 60 * 1000).toISOString(), // 11 mins ago
    verifiedBy: 'UP State Blood Transfusion Council',
    features: ['Express Highway Emergency Dispatch', 'SDP Single Donor Apheresis', 'Safe Blood Barcoding'],
    stock: {
      'O+': { prbc: 17, wb: 5, sdp: 5, rdp: 14, ffp: 21, cryo: 7 },
      'O-': { prbc: 4, wb: 1, sdp: 2, rdp: 3, ffp: 6, cryo: 2 },
      'A+': { prbc: 13, wb: 4, sdp: 3, rdp: 10, ffp: 16, cryo: 5 },
      'A-': { prbc: 3, wb: 0, sdp: 1, rdp: 2, ffp: 4, cryo: 1 },
      'B+': { prbc: 21, wb: 7, sdp: 5, rdp: 17, ffp: 27, cryo: 10 },
      'B-': { prbc: 4, wb: 1, sdp: 1, rdp: 3, ffp: 5, cryo: 2 },
      'AB+': { prbc: 9, wb: 2, sdp: 2, rdp: 7, ffp: 12, cryo: 3 },
      'AB-': { prbc: 2, wb: 0, sdp: 1, rdp: 1, ffp: 3, cryo: 1 },
      'Bombay (hh)': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 },
      'Rh-null': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 }
    }
  },
  {
    id: 'bc-apollo-delhi',
    name: 'Indraprastha Apollo Hospitals Blood Bank',
    shortName: 'Apollo Hospitals Blood Bank',
    city: 'delhi',
    area: 'Sarita Vihar, Mathura Road, New Delhi',
    address: 'Sarita Vihar, Delhi Mathura Road, New Delhi, Delhi 110076',
    lat: 28.5401,
    lng: 77.2910,
    phone: '+91 11 2692 5858',
    emergencyHelpline: '+91 11 2987 1066',
    nodalOfficer: 'Dr. Anand Deshpande',
    licenseNumber: 'DL-DL-DEL-1996-0518',
    nabhAccredited: true,
    govtRecognized: true,
    redCrossAffiliated: false,
    operatingHours: '24x7 Emergency Operational',
    is24x7: true,
    emergencyResponseRating: 4.88,
    avgResponseMinutes: 4,
    lastStockUpdate: new Date(Date.now() - 7 * 60 * 1000).toISOString(), // 7 mins ago
    verifiedBy: 'Central Drug Standard Control & JCI Accredited',
    features: ['High Volume Donor Lounge', 'Irradiated Blood for Organ Transplants', 'NAT-PCR Screening'],
    stock: {
      'O+': { prbc: 22, wb: 7, sdp: 7, rdp: 18, ffp: 29, cryo: 12 },
      'O-': { prbc: 5, wb: 2, sdp: 2, rdp: 4, ffp: 7, cryo: 3 },
      'A+': { prbc: 18, wb: 6, sdp: 4, rdp: 13, ffp: 20, cryo: 8 },
      'A-': { prbc: 4, wb: 1, sdp: 2, rdp: 3, ffp: 5, cryo: 2 },
      'B+': { prbc: 26, wb: 9, sdp: 6, rdp: 20, ffp: 33, cryo: 13 },
      'B-': { prbc: 5, wb: 1, sdp: 2, rdp: 4, ffp: 6, cryo: 2 },
      'AB+': { prbc: 12, wb: 4, sdp: 3, rdp: 9, ffp: 15, cryo: 5 },
      'AB-': { prbc: 3, wb: 1, sdp: 1, rdp: 2, ffp: 4, cryo: 1 },
      'Bombay (hh)': { prbc: 1, wb: 0, sdp: 0, rdp: 1, ffp: 1, cryo: 0 },
      'Rh-null': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 }
    }
  },
  {
    id: 'bc-lions-delhi',
    name: 'Lions Blood Centre & Research Institute',
    shortName: 'Lions Blood Centre',
    city: 'delhi',
    area: 'Shalimar Bagh, North Delhi',
    address: 'Club Road, Shalimar Bagh, New Delhi, Delhi 110088',
    lat: 28.7125,
    lng: 77.1610,
    phone: '+91 11 4225 5555',
    emergencyHelpline: '+91 98110 99887',
    nodalOfficer: 'Dr. Praveen Kumar',
    licenseNumber: 'DL-DL-DEL-2001-1402',
    nabhAccredited: true,
    govtRecognized: true,
    redCrossAffiliated: true,
    operatingHours: '24x7 Emergency Operational',
    is24x7: true,
    emergencyResponseRating: 4.72,
    avgResponseMinutes: 7,
    lastStockUpdate: new Date(Date.now() - 48 * 60 * 1000).toISOString(), // 48 mins ago
    verifiedBy: 'Delhi State Blood Transfusion Council',
    features: ['Community Camp Drives', 'Free Platelets for Needy Patients', 'Emergency Blood Courier'],
    stock: {
      'O+': { prbc: 19, wb: 8, sdp: 4, rdp: 15, ffp: 24, cryo: 9 },
      'O-': { prbc: 3, wb: 1, sdp: 1, rdp: 2, ffp: 4, cryo: 1 },
      'A+': { prbc: 14, wb: 5, sdp: 3, rdp: 11, ffp: 16, cryo: 6 },
      'A-': { prbc: 2, wb: 0, sdp: 1, rdp: 2, ffp: 3, cryo: 1 },
      'B+': { prbc: 23, wb: 9, sdp: 5, rdp: 19, ffp: 31, cryo: 11 },
      'B-': { prbc: 4, wb: 1, sdp: 1, rdp: 3, ffp: 5, cryo: 2 },
      'AB+': { prbc: 11, wb: 3, sdp: 2, rdp: 7, ffp: 13, cryo: 4 },
      'AB-': { prbc: 1, wb: 0, sdp: 0, rdp: 1, ffp: 2, cryo: 0 },
      'Bombay (hh)': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 },
      'Rh-null': { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 }
    }
  }
];

// Active Emergency Requests (SOS Network)
export const INITIAL_SOS_REQUESTS = [
  {
    id: 'SOS-GGM-4901',
    patientName: 'Karan Sharma',
    patientAge: 42,
    bloodGroup: 'O-',
    component: 'prbc',
    unitsRequired: 3,
    urgency: 'critical',
    hospitalName: 'Medanta The Medicity, Gurugram',
    hospitalBed: 'ICU Bed 14-B (Trauma OT)',
    hospitalCity: 'gurugram',
    patientAttendant: 'Rohit Sharma (Brother)',
    contactPhone: '+91 98711 23450',
    reason: 'Emergency multiple trauma road accident with active internal hemorrhage',
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    status: 'coordinating',
    matchedCentres: ['bc-medanta', 'bc-rotary-ggn'],
    donorsAlertedCount: 14,
    unitsPledgedCount: 2,
    statusHistory: [
      { step: 'broadcasted', title: 'Emergency SOS Broadcast Active', time: new Date(Date.now() - 22 * 60 * 1000).toISOString(), note: 'Verified priority dispatch triggered across Gurugram network' },
      { step: 'matching', title: 'Matched 2 Nearby Blood Banks', time: new Date(Date.now() - 19 * 60 * 1000).toISOString(), note: 'Medanta (6 units) and Rotary Blood Centre (5 units) identified' },
      { step: 'notified', title: '14 Verified O- Donors Alerted', time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), note: 'SMS & WhatsApp emergency beacons delivered within 10km radius' },
      { step: 'coordinating', title: 'Medanta Transfusion Desk Coordinating', time: new Date(Date.now() - 8 * 60 * 1000).toISOString(), note: 'Cross-matching sample received at Lab. 2 units reserved on hold.' }
    ]
  },
  {
    id: 'SOS-DEL-8812',
    patientName: 'Ananya Verma',
    patientAge: 29,
    bloodGroup: 'AB-',
    component: 'sdp',
    unitsRequired: 2,
    urgency: 'urgent',
    hospitalName: 'AIIMS Trauma Centre, New Delhi',
    hospitalBed: 'Hematology Ward 3, Bed 9',
    hospitalCity: 'delhi',
    patientAttendant: 'Suresh Verma (Father)',
    contactPhone: '+91 98100 87654',
    reason: 'Acute Dengue with Severe Thrombocytopenia (Platelets dropped to 11,000/mcL)',
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    status: 'notified',
    matchedCentres: ['bc-aiims-delhi', 'bc-redcross-delhi'],
    donorsAlertedCount: 9,
    unitsPledgedCount: 1,
    statusHistory: [
      { step: 'broadcasted', title: 'SOS Broadcast Registered', time: new Date(Date.now() - 65 * 60 * 1000).toISOString(), note: 'Platelet SDP requirement published' },
      { step: 'matching', title: 'AIIMS & Red Cross NHQ Matched', time: new Date(Date.now() - 58 * 60 * 1000).toISOString(), note: 'AIIMS has 2 units AB- SDP in stock' },
      { step: 'notified', title: 'Apheresis Donors Contacted', time: new Date(Date.now() - 40 * 60 * 1000).toISOString(), note: 'Volunteer apheresis donor en-route to AIIMS blood bank' }
    ]
  },
  {
    id: 'SOS-NOI-3104',
    patientName: 'Harish Chandra',
    patientAge: 61,
    bloodGroup: 'B-',
    component: 'prbc',
    unitsRequired: 2,
    urgency: 'urgent',
    hospitalName: 'Jaypee Hospital, Sector 128 Noida',
    hospitalBed: 'Cardio OT 2',
    hospitalCity: 'noida',
    patientAttendant: 'Meena Chandra (Daughter)',
    contactPhone: '+91 99102 33445',
    reason: 'Emergency Open-Heart Bypass surgery with unexpected blood loss',
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    status: 'resolved',
    matchedCentres: ['bc-jaypee-noida', 'bc-apollo-delhi'],
    donorsAlertedCount: 8,
    unitsPledgedCount: 2,
    statusHistory: [
      { step: 'broadcasted', title: 'SOS Created', time: new Date(Date.now() - 110 * 60 * 1000).toISOString(), note: 'Urgent B- PRBC Requisition' },
      { step: 'matching', title: 'Matched Jaypee Blood Bank', time: new Date(Date.now() - 102 * 60 * 1000).toISOString(), note: '4 units B- available in house' },
      { step: 'notified', title: 'Crossmatch Confirmed', time: new Date(Date.now() - 85 * 60 * 1000).toISOString(), note: 'Compatibility verified with patient serum' },
      { step: 'coordinating', title: 'Units Issued & Dispatched', time: new Date(Date.now() - 50 * 60 * 1000).toISOString(), note: '2 PRBC units transferred to OT 2' },
      { step: 'resolved', title: 'Transfusion Successful • Case Resolved', time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), note: 'Patient vital parameters stabilized. Request closed.' }
    ]
  }
];

// Voluntary Emergency Donors Registry
export const INITIAL_DONORS = [
  { id: 'dn-101', name: 'Vikramaditya Roy', bloodGroup: 'O-', city: 'gurugram', area: 'DLF Phase 4, Gurugram', distanceKm: 3.2, donationsCount: 14, lastDonationDaysAgo: 110, eligibleNow: true, canTravelMin: 30, phone: '+91 98118 44001', badge: 'Hero Donor (10+)' },
  { id: 'dn-102', name: 'Pooja Bhatnagar', bloodGroup: 'O-', city: 'gurugram', area: 'Sector 56, Golf Course Ext.', distanceKm: 4.8, donationsCount: 6, lastDonationDaysAgo: 95, eligibleNow: true, canTravelMin: 45, phone: '+91 98710 55112', badge: 'Silver Donor' },
  { id: 'dn-103', name: 'Amitabh Sen', bloodGroup: 'AB-', city: 'delhi', area: 'Hauz Khas, South Delhi', distanceKm: 5.5, donationsCount: 8, lastDonationDaysAgo: 140, eligibleNow: true, canTravelMin: 30, phone: '+91 98109 66223', badge: 'Rare Group Hero' },
  { id: 'dn-104', name: 'Deepak Rao', bloodGroup: 'B-', city: 'gurugram', area: 'Sector 14, Old Gurugram', distanceKm: 2.1, donationsCount: 11, lastDonationDaysAgo: 105, eligibleNow: true, canTravelMin: 20, phone: '+91 99990 77334', badge: 'Hero Donor (10+)' },
  { id: 'dn-105', name: 'Dr. Shreya Sengupta', bloodGroup: 'A-', city: 'delhi', area: 'Saket, New Delhi', distanceKm: 6.2, donationsCount: 9, lastDonationDaysAgo: 120, eligibleNow: true, canTravelMin: 25, phone: '+91 98188 88445', badge: 'Medical Volunteer' },
  { id: 'dn-106', name: 'Kavita Menon', bloodGroup: 'Bombay (hh)', city: 'delhi', area: 'Connaught Place, New Delhi', distanceKm: 8.0, donationsCount: 5, lastDonationDaysAgo: 150, eligibleNow: true, canTravelMin: 60, phone: '+91 98200 99556', badge: 'Ultra-Rare Phenotype Registry' }
];

// Hospital Requisition Logs
export const INITIAL_HOSPITAL_REQUISITIONS = [
  {
    id: 'REQ-MED-2026-091',
    hospitalName: 'Medanta The Medicity',
    hospitalId: 'hosp-medanta',
    doctorName: 'Dr. Rajesh Ahlawat (Director Urology & Renal)',
    patientUHID: 'MED-UHID-982144',
    patientName: 'Manish Tyagi',
    bedNumber: 'ICU-3 Bed 7',
    bloodGroup: 'O+',
    component: 'prbc',
    units: 4,
    urgency: 'critical',
    crossMatchSampleSent: true,
    status: 'In Progress (2/4 Reserved)',
    requestedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'REQ-FMRI-2026-044',
    hospitalName: 'Fortis Memorial Research Institute',
    hospitalId: 'hosp-fortis',
    doctorName: 'Dr. Subhash Chandra (Cardiology)',
    patientUHID: 'FMRI-UHID-441209',
    patientName: 'Radha Devi',
    bedNumber: 'CCU Bed 12',
    bloodGroup: 'A+',
    component: 'ffp',
    units: 3,
    urgency: 'urgent',
    crossMatchSampleSent: true,
    status: 'Ready for Collection',
    requestedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString()
  }
];

// Complete Red Cell & Plasma Compatibility Matrix
export const COMPATIBILITY_RULES = {
  'O-': {
    canReceiveRBCFrom: ['O-'],
    canGiveRBCTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    isUniversalRBCDonor: true,
    canReceivePlasmaFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canGivePlasmaTo: ['O-', 'O+'],
    notes: 'Universal Red Cell Donor. Essential in emergency trauma before patient blood group is determined.'
  },
  'O+': {
    canReceiveRBCFrom: ['O-', 'O+'],
    canGiveRBCTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceivePlasmaFrom: ['O+', 'A+', 'B+', 'AB+'],
    canGivePlasmaTo: ['O+', 'O-'],
    notes: 'Most common blood group. High demand in emergency care.'
  },
  'A-': {
    canReceiveRBCFrom: ['O-', 'A-'],
    canGiveRBCTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceivePlasmaFrom: ['A-', 'A+', 'AB-', 'AB+'],
    canGivePlasmaTo: ['A-', 'A+', 'O-', 'O+'],
    notes: 'Can safely receive O- red cells if A- is unavailable.'
  },
  'A+': {
    canReceiveRBCFrom: ['O-', 'O+', 'A-', 'A+'],
    canGiveRBCTo: ['A+', 'AB+'],
    canReceivePlasmaFrom: ['A+', 'AB+'],
    canGivePlasmaTo: ['A+', 'A-', 'O+', 'O-'],
    notes: 'Second most common group. Compatible with A and O donors.'
  },
  'B-': {
    canReceiveRBCFrom: ['O-', 'B-'],
    canGiveRBCTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceivePlasmaFrom: ['B-', 'B+', 'AB-', 'AB+'],
    canGivePlasmaTo: ['B-', 'B+', 'O-', 'O+'],
    notes: 'Rare Rh-negative group. O- is emergency substitute.'
  },
  'B+': {
    canReceiveRBCFrom: ['O-', 'O+', 'B-', 'B+'],
    canGiveRBCTo: ['B+', 'AB+'],
    canReceivePlasmaFrom: ['B+', 'AB+'],
    canGivePlasmaTo: ['B+', 'B-', 'O+', 'O-'],
    notes: 'Common in South Asia. Very frequent requirement.'
  },
  'AB-': {
    canReceiveRBCFrom: ['O-', 'A-', 'B-', 'AB-'],
    canGiveRBCTo: ['AB-', 'AB+'],
    canReceivePlasmaFrom: ['AB-', 'AB+'],
    canGivePlasmaTo: ['AB-', 'AB+', 'A-', 'A+', 'B-', 'B+', 'O-', 'O+'],
    notes: 'Universal Plasma Donor for Rh-negative recipients.'
  },
  'AB+': {
    canReceiveRBCFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canGiveRBCTo: ['AB+'],
    isUniversalRBCRecipient: true,
    canReceivePlasmaFrom: ['AB+'],
    canGivePlasmaTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    isUniversalPlasmaDonor: true,
    notes: 'Universal Red Cell Recipient & Universal Plasma Donor.'
  },
  'Bombay (hh)': {
    canReceiveRBCFrom: ['Bombay (hh)'],
    canGiveRBCTo: ['Bombay (hh)', 'O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    notes: 'Extremely rare phenotype (1 in 10,000 in India). Can ONLY receive blood from another Bombay phenotype donor.'
  },
  'Rh-null': {
    canReceiveRBCFrom: ['Rh-null'],
    canGiveRBCTo: ['All Rh-negative and Rh-positive groups'],
    notes: '"Golden Blood" lacking all Rh antigens. Requires specialized ultra-rare registry coordination.'
  }
};

// NLP Extraction Dictionary for Natural-Language Search & Emergency AI
export const NLP_KEYWORDS = {
  bloodGroups: {
    'o-': 'O-',
    'o negative': 'O-',
    'o -ve': 'O-',
    'o-ve': 'O-',
    'o-negative': 'O-',
    'o+': 'O+',
    'o positive': 'O+',
    'o +ve': 'O+',
    'o+ve': 'O+',
    'a-': 'A-',
    'a negative': 'A-',
    'a -ve': 'A-',
    'a+': 'A+',
    'a positive': 'A+',
    'a +ve': 'A+',
    'b-': 'B-',
    'b negative': 'B-',
    'b -ve': 'B-',
    'b+': 'B+',
    'b positive': 'B+',
    'b +ve': 'B+',
    'ab-': 'AB-',
    'ab negative': 'AB-',
    'ab -ve': 'AB-',
    'ab+': 'AB+',
    'ab positive': 'AB+',
    'ab +ve': 'AB+',
    'bombay': 'Bombay (hh)',
    'bombay phenotype': 'Bombay (hh)',
    'hh': 'Bombay (hh)',
    'rh null': 'Rh-null',
    'golden blood': 'Rh-null'
  },
  components: {
    'prbc': 'prbc',
    'packed rbc': 'prbc',
    'packed red blood cells': 'prbc',
    'red blood': 'prbc',
    'rbc': 'prbc',
    'blood': 'prbc',
    'whole blood': 'wb',
    'wb': 'wb',
    'platelet': 'sdp',
    'platelets': 'sdp',
    'sdp': 'sdp',
    'single donor': 'sdp',
    'rdp': 'rdp',
    'random donor': 'rdp',
    'plasma': 'ffp',
    'ffp': 'ffp',
    'fresh frozen plasma': 'ffp',
    'cryo': 'cryo',
    'cryoprecipitate': 'cryo'
  },
  urgency: {
    'urgent': 'urgent',
    'urgently': 'urgent',
    'emergency': 'critical',
    'immediate': 'critical',
    'now': 'critical',
    'critical': 'critical',
    'stat': 'critical',
    'today': 'urgent',
    'tomorrow': 'moderate',
    'planned': 'moderate'
  },
  locations: {
    'gurugram': 'gurugram',
    'gurgaon': 'gurugram',
    'medanta': 'gurugram',
    'fortis': 'gurugram',
    'cyber hub': 'gurugram',
    'cyber city': 'gurugram',
    'dlf': 'gurugram',
    'delhi': 'delhi',
    'new delhi': 'delhi',
    'aiims': 'delhi',
    'saket': 'delhi',
    'safdarjung': 'delhi',
    'red cross': 'delhi',
    'apollo': 'delhi',
    'noida': 'noida',
    'greater noida': 'noida',
    'jaypee': 'noida',
    'faridabad': 'faridabad',
    'mumbai': 'mumbai',
    'bengaluru': 'bengaluru',
    'bangalore': 'bengaluru'
  }
};
