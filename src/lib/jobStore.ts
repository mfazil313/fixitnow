// Server-side database mock for local development without Supabase
import { Job, AIAnalysisResult, Profile, Worker } from '@/lib/types';

// In-memory collections to represent our database tables
export const mockProfiles = new Map<string, Profile>([
  ['w1', { id: 'w1', full_name: 'Rajesh Kumar', phone: '+91 98765 11111', avatar_url: null, role: 'worker', city: 'Mumbai', location_lat: 19.076, location_lng: 72.8777, created_at: new Date().toISOString() }],
  ['w2', { id: 'w2', full_name: 'Suresh Patel', phone: '+91 98765 22222', avatar_url: null, role: 'worker', city: 'Mumbai', location_lat: 19.082, location_lng: 72.881, created_at: new Date().toISOString() }],
  ['w3', { id: 'w3', full_name: 'Anil Sharma', phone: '+91 98765 33333', avatar_url: null, role: 'worker', city: 'Delhi', location_lat: 28.6139, location_lng: 77.209, created_at: new Date().toISOString() }],
  ['w4', { id: 'w4', full_name: 'Vikram Singh', phone: '+91 98765 44444', avatar_url: null, role: 'worker', city: 'Delhi', location_lat: 28.620, location_lng: 77.215, created_at: new Date().toISOString() }],
  ['w5', { id: 'w5', full_name: 'Mohammed Ali', phone: '+91 98765 55555', avatar_url: null, role: 'worker', city: 'Bengaluru', location_lat: 12.9716, location_lng: 77.5946, created_at: new Date().toISOString() }],
  ['w6', { id: 'w6', full_name: 'Deepak Verma', phone: '+91 98765 66666', avatar_url: null, role: 'worker', city: 'Hyderabad', location_lat: 17.385, location_lng: 78.4867, created_at: new Date().toISOString() }],
  ['w7', { id: 'w7', full_name: 'Kiran Reddy', phone: '+91 98765 77777', avatar_url: null, role: 'worker', city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707, created_at: new Date().toISOString() }],
  ['w8', { id: 'w8', full_name: 'Ramesh Gupta', phone: '+91 98765 88888', avatar_url: null, role: 'worker', city: 'Pune', location_lat: 18.5204, location_lng: 73.8567, created_at: new Date().toISOString() }],
  ['w9', { id: 'w9', full_name: 'Sanjay Mishra', phone: '+91 98765 99999', avatar_url: null, role: 'worker', city: 'Kolkata', location_lat: 22.5726, location_lng: 88.3639, created_at: new Date().toISOString() }],
  ['w10', { id: 'w10', full_name: 'Pradeep Yadav', phone: '+91 98765 00000', avatar_url: null, role: 'worker', city: 'Jaipur', location_lat: 26.9124, location_lng: 75.7873, created_at: new Date().toISOString() }],
  ['w11', { id: 'w11', full_name: 'Manjunath Gowda', phone: '+91 98765 12345', avatar_url: null, role: 'worker', city: 'Bengaluru', location_lat: 12.9716, location_lng: 77.5946, created_at: new Date().toISOString() }],
  ['w12', { id: 'w12', full_name: 'Abdul Hameed', phone: '+91 98765 23456', avatar_url: null, role: 'worker', city: 'Mumbai', location_lat: 19.076, location_lng: 72.8777, created_at: new Date().toISOString() }],
  ['w13', { id: 'w13', full_name: 'Santosh Naik', phone: '+91 98765 34567', avatar_url: null, role: 'worker', city: 'Mangaluru', location_lat: 12.9141, location_lng: 74.8560, created_at: new Date().toISOString() }],
  ['w14', { id: 'w14', full_name: 'Dharmendra Yadav', phone: '+91 98765 45678', avatar_url: null, role: 'worker', city: 'Delhi', location_lat: 28.6139, location_lng: 77.209, created_at: new Date().toISOString() }],
  ['w15', { id: 'w15', full_name: 'Lata Devi', phone: '+91 98765 56789', avatar_url: null, role: 'worker', city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707, created_at: new Date().toISOString() }],
  ['w16', { id: 'w16', full_name: 'Prashanth Shetty', phone: '+91 98765 67890', avatar_url: null, role: 'worker', city: 'Udupi', location_lat: 13.3410, location_lng: 74.7470, created_at: new Date().toISOString() }],
  ['w17', { id: 'w17', full_name: 'Santosh Poojary', phone: '+91 98765 78901', avatar_url: null, role: 'worker', city: 'Mangaluru', location_lat: 12.9141, location_lng: 74.8560, created_at: new Date().toISOString() }],
  ['w18', { id: 'w18', full_name: 'Ajay Nair', phone: '+91 98765 81818', avatar_url: null, role: 'worker', city: 'Bengaluru', location_lat: 12.9716, location_lng: 77.5946, created_at: new Date().toISOString() }],
  ['w19', { id: 'w19', full_name: 'Rahul Kumar', phone: '+91 98765 81919', avatar_url: null, role: 'worker', city: 'Belagavi', location_lat: 15.8497, location_lng: 74.4977, created_at: new Date().toISOString() }],
  ['w20', { id: 'w20', full_name: 'Ravi Yadav', phone: '+91 98765 82020', avatar_url: null, role: 'worker', city: 'Belagavi', location_lat: 15.8497, location_lng: 74.4977, created_at: new Date().toISOString() }],
  ['w21', { id: 'w21', full_name: 'Manoj Singh', phone: '+91 98765 82121', avatar_url: null, role: 'worker', city: 'Kochi', location_lat: 9.9312, location_lng: 76.2673, created_at: new Date().toISOString() }],
  ['w22', { id: 'w22', full_name: 'Ramesh Nair', phone: '+91 98765 82222', avatar_url: null, role: 'worker', city: 'Kochi', location_lat: 9.9312, location_lng: 76.2673, created_at: new Date().toISOString() }],
  ['w23', { id: 'w23', full_name: 'Imran Shetty', phone: '+91 98765 82323', avatar_url: null, role: 'worker', city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707, created_at: new Date().toISOString() }],
  ['w24', { id: 'w24', full_name: 'Suresh Das', phone: '+91 98765 82424', avatar_url: null, role: 'worker', city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707, created_at: new Date().toISOString() }],
  ['w25', { id: 'w25', full_name: 'Arjun Das', phone: '+91 98765 82525', avatar_url: null, role: 'worker', city: 'Kochi', location_lat: 9.9312, location_lng: 76.2673, created_at: new Date().toISOString() }],
  ['w26', { id: 'w26', full_name: 'Kiran Sharma', phone: '+91 98765 82626', avatar_url: null, role: 'worker', city: 'Pune', location_lat: 18.5204, location_lng: 73.8567, created_at: new Date().toISOString() }],
  ['w27', { id: 'w27', full_name: 'Rahul Rao', phone: '+91 98765 82727', avatar_url: null, role: 'worker', city: 'Hyderabad', location_lat: 17.3850, location_lng: 78.4867, created_at: new Date().toISOString() }],
  ['w28', { id: 'w28', full_name: 'Imran Yadav', phone: '+91 98765 82828', avatar_url: null, role: 'worker', city: 'Hyderabad', location_lat: 17.3850, location_lng: 78.4867, created_at: new Date().toISOString() }],
  ['w29', { id: 'w29', full_name: 'Ajay Shetty', phone: '+91 98765 82929', avatar_url: null, role: 'worker', city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707, created_at: new Date().toISOString() }],
  ['w30', { id: 'w30', full_name: 'Rahul Patel', phone: '+91 98765 83030', avatar_url: null, role: 'worker', city: 'Mumbai', location_lat: 19.0760, location_lng: 72.8777, created_at: new Date().toISOString() }],
  ['w31', { id: 'w31', full_name: 'Vijay Shetty', phone: '+91 98765 83131', avatar_url: null, role: 'worker', city: 'Belagavi', location_lat: 15.8497, location_lng: 74.4977, created_at: new Date().toISOString() }],
  ['w32', { id: 'w32', full_name: 'Imran Rao', phone: '+91 98765 83232', avatar_url: null, role: 'worker', city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707, created_at: new Date().toISOString() }],
  ['w33', { id: 'w33', full_name: 'Deepak Patel', phone: '+91 98765 83333', avatar_url: null, role: 'worker', city: 'Pune', location_lat: 18.5204, location_lng: 73.8567, created_at: new Date().toISOString() }],
  ['w34', { id: 'w34', full_name: 'Amit Joshi', phone: '+91 98765 83434', avatar_url: null, role: 'worker', city: 'Kochi', location_lat: 9.9312, location_lng: 76.2673, created_at: new Date().toISOString() }],
  ['w35', { id: 'w35', full_name: 'Arjun Nair', phone: '+91 98765 83535', avatar_url: null, role: 'worker', city: 'Mumbai', location_lat: 19.0760, location_lng: 72.8777, created_at: new Date().toISOString() }],
  ['w36', { id: 'w36', full_name: 'Suresh Joshi', phone: '+91 98765 83636', avatar_url: null, role: 'worker', city: 'Delhi', location_lat: 28.6139, location_lng: 77.2090, created_at: new Date().toISOString() }],
  ['w37', { id: 'w37', full_name: 'Deepak Shetty', phone: '+91 98765 83737', avatar_url: null, role: 'worker', city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707, created_at: new Date().toISOString() }],
  ['w38', { id: 'w38', full_name: 'Vijay Rao', phone: '+91 98765 83838', avatar_url: null, role: 'worker', city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707, created_at: new Date().toISOString() }],
  ['w39', { id: 'w39', full_name: 'Rahul Shetty', phone: '+91 98765 83939', avatar_url: null, role: 'worker', city: 'Kochi', location_lat: 9.9312, location_lng: 76.2673, created_at: new Date().toISOString() }],
  ['w40', { id: 'w40', full_name: 'Suresh Kumar', phone: '+91 98765 84040', avatar_url: null, role: 'worker', city: 'Hyderabad', location_lat: 17.3850, location_lng: 78.4867, created_at: new Date().toISOString() }],
  ['w41', { id: 'w41', full_name: 'Deepak Singh', phone: '+91 98765 84141', avatar_url: null, role: 'worker', city: 'Hyderabad', location_lat: 17.3850, location_lng: 78.4867, created_at: new Date().toISOString() }],
  ['w42', { id: 'w42', full_name: 'Suresh Patel', phone: '+91 98765 84242', avatar_url: null, role: 'worker', city: 'Hyderabad', location_lat: 17.3850, location_lng: 78.4867, created_at: new Date().toISOString() }],
  ['w43', { id: 'w43', full_name: 'Rahul Sharma', phone: '+91 98765 84343', avatar_url: null, role: 'worker', city: 'Mumbai', location_lat: 19.0760, location_lng: 72.8777, created_at: new Date().toISOString() }],
  ['local-user', { id: 'local-user', full_name: 'Local User', phone: '+91 98765 43210', avatar_url: null, role: 'customer', city: 'Mumbai', location_lat: 19.076, location_lng: 72.8777, created_at: new Date().toISOString() }],
]);

export const mockUsers = new Map<string, any>([
  ['customer@example.com', { id: 'local-user', email: 'customer@example.com', password: 'password', full_name: 'Local User', role: 'customer' }],
  ['worker@example.com', { id: 'w1', email: 'worker@example.com', password: 'password', full_name: 'Rajesh Kumar', role: 'worker' }]
]);

export const mockWorkers = new Map<string, Worker>([
  ['w1', { id: 'w1', trade: 'plumber', bio: 'Experienced plumber specializing in residential pipe repair and water systems.', experience_years: 8, hourly_rate: 350, rating: 4.8, total_reviews: 127, is_available: true, is_verified: true, radius_km: 15 }],
  ['w2', { id: 'w2', trade: 'plumber', bio: 'Master plumber with expertise in commercial and residential plumbing.', experience_years: 12, hourly_rate: 450, rating: 4.9, total_reviews: 203, is_available: true, is_verified: true, radius_km: 20 }],
  ['w3', { id: 'w3', trade: 'electrician', bio: 'Certified electrician handling wiring, panels, and socket repairs.', experience_years: 10, hourly_rate: 400, rating: 4.7, total_reviews: 95, is_available: true, is_verified: true, radius_km: 12 }],
  ['w4', { id: 'w4', trade: 'electrician', bio: 'Expert in electrical diagnostics, inverter installations, and rewiring.', experience_years: 6, hourly_rate: 300, rating: 4.6, total_reviews: 68, is_available: true, is_verified: true, radius_km: 10 }],
  ['w5', { id: 'w5', trade: 'carpenter', bio: 'Skilled carpenter for furniture repair, door fixing, and woodwork.', experience_years: 15, hourly_rate: 500, rating: 4.9, total_reviews: 312, is_available: true, is_verified: true, radius_km: 25 }],
  ['w6', { id: 'w6', trade: 'painter', bio: 'Interior and exterior painting specialist with 9 years of experience.', experience_years: 9, hourly_rate: 350, rating: 4.5, total_reviews: 78, is_available: true, is_verified: true, radius_km: 15 }],
  ['w7', { id: 'w7', trade: 'ac_tech', bio: 'AC repair and servicing expert for split, window, and central AC units.', experience_years: 7, hourly_rate: 400, rating: 4.7, total_reviews: 89, is_available: true, is_verified: true, radius_km: 18 }],
  ['w8', { id: 'w8', trade: 'mason', bio: 'Expert mason for wall repairs, tiling, and concrete work.', experience_years: 11, hourly_rate: 380, rating: 4.6, total_reviews: 56, is_available: true, is_verified: true, radius_km: 20 }],
  ['w9', { id: 'w9', trade: 'welder', bio: 'Welding specialist for gates, grills, and structural steel repairs.', experience_years: 13, hourly_rate: 420, rating: 4.8, total_reviews: 145, is_available: true, is_verified: true, radius_km: 15 }],
  ['w10', { id: 'w10', trade: 'other', bio: 'Versatile handyman for general home repairs and maintenance.', experience_years: 5, hourly_rate: 250, rating: 4.4, total_reviews: 42, is_available: true, is_verified: true, radius_km: 10 }],
  ['w11', { id: 'w11', trade: 'lawn_mower', bio: 'Lawn mowing expert with petrol rotary mowers & turf edging equipment.', experience_years: 7, hourly_rate: 450, rating: 4.9, total_reviews: 115, is_available: true, is_verified: true, radius_km: 20 }],
  ['w12', { id: 'w12', trade: 'tank_cleaner', bio: 'Water storage tank sanitization specialist with high-pressure UV jetting.', experience_years: 9, hourly_rate: 550, rating: 4.8, total_reviews: 164, is_available: true, is_verified: true, radius_km: 25 }],
  ['w13', { id: 'w13', trade: 'interlock_cleaner', bio: 'Interlock driveway pressure washing and moss removal expert.', experience_years: 6, hourly_rate: 480, rating: 4.7, total_reviews: 98, is_available: true, is_verified: true, radius_km: 15 }],
  ['w14', { id: 'w14', trade: 'interlock_paver', bio: 'Master interlock brick layer for pathways, driveways, and patios.', experience_years: 14, hourly_rate: 600, rating: 4.9, total_reviews: 210, is_available: true, is_verified: true, radius_km: 30 }],
  ['w15', { id: 'w15', trade: 'gardener', bio: 'Professional gardener for tree trimming, flower beds, and organic lawn care.', experience_years: 8, hourly_rate: 380, rating: 4.6, total_reviews: 87, is_available: true, is_verified: true, radius_km: 18 }],
  ['w16', { id: 'w16', trade: 'other', bio: 'Certified electronics & general device repair specialist in Udupi.', experience_years: 6, hourly_rate: 350, rating: 4.9, total_reviews: 112, is_available: true, is_verified: true, radius_km: 25 }],
  ['w17', { id: 'w17', trade: 'other', bio: 'Handyman and gadget repair technician in coastal Karnataka.', experience_years: 7, hourly_rate: 320, rating: 4.8, total_reviews: 84, is_available: true, is_verified: true, radius_km: 30 }],
  ['w18', { id: 'w18', trade: 'electrician', bio: 'Specialist in house wiring, switchboards, and electrical fault repair in Bengaluru.', experience_years: 8, hourly_rate: 300, rating: 4.6, total_reviews: 48, is_available: true, is_verified: true, radius_km: 15, services_offered: ['Wiring', 'Fault Diagnosis', 'Switchboard Repair'] }],
  ['w19', { id: 'w19', trade: 'electrician', bio: 'Residential wiring and electrical installation technician serving Belagavi.', experience_years: 3, hourly_rate: 400, rating: 4.3, total_reviews: 24, is_available: true, is_verified: true, radius_km: 12, services_offered: ['Wiring', 'Panel Installation'] }],
  ['w20', { id: 'w20', trade: 'ac_tech', bio: 'AC Gas charging and cooling system expert operating in Belagavi.', experience_years: 19, hourly_rate: 250, rating: 4.6, total_reviews: 112, is_available: true, is_verified: true, radius_km: 20, services_offered: ['Gas Charging', 'Maintenance', 'Cooling Faults'] }],
  ['w21', { id: 'w21', trade: 'welder', bio: 'MIG welding specialist for iron gates, window grills, and structural steel in Kochi.', experience_years: 7, hourly_rate: 270, rating: 3.6, total_reviews: 19, is_available: true, is_verified: true, radius_km: 15, services_offered: ['MIG Welding', 'Gate Repair', 'Grill Work'] }],
  ['w22', { id: 'w22', trade: 'painter', bio: 'Texture wall design and premium interior/exterior painter in Kochi.', experience_years: 2, hourly_rate: 650, rating: 4.3, total_reviews: 14, is_available: true, is_verified: true, radius_km: 10, services_offered: ['Texture Painting', 'Interior Walls', 'Primer'] }],
  ['w23', { id: 'w23', trade: 'electrician', bio: 'Senior electrical fault diagnosis and panel specialist in Chennai.', experience_years: 12, hourly_rate: 370, rating: 4.6, total_reviews: 86, is_available: true, is_verified: true, radius_km: 25, services_offered: ['Fault Diagnosis', 'Short Circuit Repair', 'Full House Wiring'] }],
  ['w24', { id: 'w24', trade: 'ac_tech', bio: 'AC refrigerant gas filling and leak testing technician in Chennai.', experience_years: 4, hourly_rate: 450, rating: 4.2, total_reviews: 31, is_available: true, is_verified: true, radius_km: 15, services_offered: ['Gas Charging', 'Split AC Servicing', 'Dismantling'] }],
  ['w25', { id: 'w25', trade: 'carpenter', bio: 'Master cabinet maker and custom wooden furniture carpenter in Kochi.', experience_years: 22, hourly_rate: 230, rating: 4.4, total_reviews: 154, is_available: true, is_verified: true, radius_km: 20, services_offered: ['Cabinets', 'Modular Kitchen', 'Furniture Assembly'] }],
  ['w26', { id: 'w26', trade: 'ac_tech', bio: 'HVAC and split AC preventive maintenance technician in Pune.', experience_years: 9, hourly_rate: 750, rating: 3.8, total_reviews: 42, is_available: true, is_verified: true, radius_km: 18, services_offered: ['Maintenance', 'PCB Board Repair', 'Gas Topup'] }],
  ['w27', { id: 'w27', trade: 'plumber', bio: 'Expert pipe leak detection and burst pipe repair plumber in Hyderabad.', experience_years: 13, hourly_rate: 230, rating: 3.8, total_reviews: 63, is_available: true, is_verified: true, radius_km: 15, services_offered: ['Leak Repair', 'Drain Cleaning', 'Tap Installation'] }],
  ['w28', { id: 'w28', trade: 'painter', bio: 'Royal texture painting and dampness treatment specialist in Hyderabad.', experience_years: 13, hourly_rate: 650, rating: 3.7, total_reviews: 57, is_available: true, is_verified: true, radius_km: 20, services_offered: ['Texture', 'Waterproofing', 'Wall Putty'] }],
  ['w29', { id: 'w29', trade: 'ac_tech', bio: 'Comprehensive AC maintenance and chemical jet cleaning in Chennai.', experience_years: 14, hourly_rate: 580, rating: 4.0, total_reviews: 79, is_available: true, is_verified: true, radius_km: 22, services_offered: ['Maintenance', 'AC Mounting', 'Thermostat Repair'] }],
  ['w30', { id: 'w30', trade: 'mason', bio: 'Concrete floor touchup, tile fitting and brickwork mason in Mumbai.', experience_years: 5, hourly_rate: 330, rating: 4.7, total_reviews: 38, is_available: true, is_verified: true, radius_km: 15, services_offered: ['Concrete', 'Tile Fitting', 'Plastering'] }],
  ['w31', { id: 'w31', trade: 'electrician', bio: '5-star rated master electrician for fault diagnosis and rewiring in Belagavi.', experience_years: 15, hourly_rate: 430, rating: 5.0, total_reviews: 142, is_available: true, is_verified: true, radius_km: 30, services_offered: ['Fault Diagnosis', 'Wiring', 'Safety Inspection'] }],
  ['w32', { id: 'w32', trade: 'electrician', bio: 'Industrial panel installation and heavy appliance electrician in Chennai.', experience_years: 4, hourly_rate: 620, rating: 3.7, total_reviews: 29, is_available: true, is_verified: true, radius_km: 15, services_offered: ['Panel Installation', 'MCB Replacement', 'Inverter Setup'] }],
  ['w33', { id: 'w33', trade: 'other', bio: '20+ years experienced general handyman and device technician in Pune.', experience_years: 21, hourly_rate: 800, rating: 4.3, total_reviews: 168, is_available: true, is_verified: true, radius_km: 25, services_offered: ['Installation', 'Fixture Mounting', 'Appliance Repair'] }],
  ['w34', { id: 'w34', trade: 'carpenter', bio: 'Veteran door lock, hinge and custom wooden door carpenter in Kochi.', experience_years: 25, hourly_rate: 200, rating: 4.4, total_reviews: 195, is_available: true, is_verified: true, radius_km: 20, services_offered: ['Doors', 'Lock Fitting', 'Frame Repair'] }],
  ['w35', { id: 'w35', trade: 'plumber', bio: 'Top rated pipe fitting and sanitary installation plumber in Mumbai.', experience_years: 8, hourly_rate: 420, rating: 4.8, total_reviews: 94, is_available: true, is_verified: true, radius_km: 18, services_offered: ['Pipe Fitting', 'Sanitary Repair', 'Geyser Service'] }],
  ['w36', { id: 'w36', trade: 'electrician', bio: 'Veteran electrician for complete home rewiring and MCB boxes in Delhi.', experience_years: 25, hourly_rate: 300, rating: 4.5, total_reviews: 210, is_available: true, is_verified: true, radius_km: 20, services_offered: ['Wiring', 'MCB Trip Repair', 'Light Fitting'] }],
  ['w37', { id: 'w37', trade: 'carpenter', bio: 'Custom wooden shelves, sofa repair and furniture carpenter in Chennai.', experience_years: 14, hourly_rate: 730, rating: 4.6, total_reviews: 108, is_available: true, is_verified: true, radius_km: 25, services_offered: ['Furniture', 'Custom Shelves', 'Wood Polishing'] }],
  ['w38', { id: 'w38', trade: 'ac_tech', bio: 'Central & split AC maintenance expert serving all of Chennai.', experience_years: 15, hourly_rate: 630, rating: 3.7, total_reviews: 64, is_available: true, is_verified: true, radius_km: 20, services_offered: ['Maintenance', 'Gas Charging', 'Coil Cleaning'] }],
  ['w39', { id: 'w39', trade: 'electrician', bio: 'Commercial & residential wiring specialist operating in Kochi.', experience_years: 18, hourly_rate: 780, rating: 3.8, total_reviews: 123, is_available: true, is_verified: true, radius_km: 20, services_offered: ['Wiring', 'Distribution Board', 'Earth Leakage'] }],
  ['w40', { id: 'w40', trade: 'plumber', bio: 'Sanitary fitting, overhead tank and pipe fitting plumber in Hyderabad.', experience_years: 11, hourly_rate: 700, rating: 3.9, total_reviews: 72, is_available: true, is_verified: true, radius_km: 18, services_offered: ['Pipe Fitting', 'Overhead Tank Maintenance', 'Pump Repair'] }],
  ['w41', { id: 'w41', trade: 'mason', bio: '24 years experienced masonry, tile grouting and concrete master in Hyderabad.', experience_years: 24, hourly_rate: 760, rating: 4.2, total_reviews: 180, is_available: true, is_verified: true, radius_km: 25, services_offered: ['Concrete', 'Tile Grouting', 'Crack Repair'] }],
  ['w42', { id: 'w42', trade: 'welder', bio: 'Heavy structural steel and iron gate MIG welding pro in Hyderabad.', experience_years: 22, hourly_rate: 530, rating: 4.2, total_reviews: 135, is_available: true, is_verified: true, radius_km: 22, services_offered: ['MIG', 'Iron Frame Fabrication', 'Grill Welding'] }],
  ['w43', { id: 'w43', trade: 'plumber', bio: '24 years veteran plumber for leak detection and burst pipe repair in Mumbai.', experience_years: 24, hourly_rate: 270, rating: 3.9, total_reviews: 162, is_available: true, is_verified: true, radius_km: 20, services_offered: ['Leak Repair', 'Drain Unclogging', 'Water Tank Pump'] }],
]);

export const mockJobs = new Map<string, Job>();
export const mockBookings = new Map<string, any>();
export const mockMessages = new Map<string, any[]>();
export const mockReviews = new Map<string, any>([
  ['r1', { id: 'r1', worker_id: 'w1', customer_id: 'local-user', rating: 5, comment: 'Highly recommended! Arrived on time, identified the problem instantly, and did a clean job.', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), profiles: { full_name: 'Priya Mehta' } }],
  ['r2', { id: 'r2', worker_id: 'w1', customer_id: 'local-user', rating: 5, comment: 'Professional service at a very reasonable rate. Cleaned up afterwards. Will book again.', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), profiles: { full_name: 'Arjun Singh' } }],
]);

let counter = 1;

function generateId(): string {
  return `local-${Date.now()}-${counter++}`;
}

export function createJob(params: {
  customer_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  location_lat?: number | null;
  location_lng?: number | null;
  location_address?: string | null;
}): Job {
  const id = generateId();
  const job: Job = {
    id,
    customer_id: params.customer_id,
    media_url: params.media_url,
    media_type: params.media_type,
    ai_problem_title: null,
    ai_description: null,
    ai_trade_required: null,
    ai_dimension: null,
    ai_severity: null,
    ai_confidence: null,
    status: 'pending',
    location_lat: params.location_lat ?? null,
    location_lng: params.location_lng ?? null,
    location_address: params.location_address ?? null,
    assigned_worker_id: null,
    created_at: new Date().toISOString(),
  };
  mockJobs.set(id, job);
  return job;
}

export function updateJobWithAI(jobId: string, result: AIAnalysisResult): Job | null {
  const job = mockJobs.get(jobId);
  if (!job) return null;
  job.ai_problem_title = result.problem_title;
  job.ai_description = result.description;
  job.ai_trade_required = result.trade_required;
  job.ai_dimension = result.estimated_dimension;
  job.ai_severity = result.severity;
  job.ai_confidence = result.confidence;
  job.status = 'pending';
  mockJobs.set(jobId, job);
  return job;
}

export function getJob(jobId: string): Job | null {
  return mockJobs.get(jobId) ?? null;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes('YOUR_PROJECT_REF');
}
