import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/jobStore';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Mock workers for local development
const MOCK_WORKERS = [
  {
    id: 'w1', trade: 'plumber', bio: 'Experienced plumber specializing in residential pipe repair and water systems.', experience_years: 8, hourly_rate: 350, rating: 4.8, total_reviews: 127, is_available: true, is_verified: true, radius_km: 15,
    profiles: { full_name: 'Rajesh Kumar', avatar_url: null, city: 'Mumbai', location_lat: 19.076, location_lng: 72.8777 },
  },
  {
    id: 'w2', trade: 'plumber', bio: 'Master plumber with expertise in commercial and residential plumbing.', experience_years: 12, hourly_rate: 450, rating: 4.9, total_reviews: 203, is_available: true, is_verified: true, radius_km: 20,
    profiles: { full_name: 'Suresh Patel', avatar_url: null, city: 'Mumbai', location_lat: 19.082, location_lng: 72.881 },
  },
  {
    id: 'w3', trade: 'electrician', bio: 'Certified electrician handling wiring, panels, and socket repairs.', experience_years: 10, hourly_rate: 400, rating: 4.7, total_reviews: 95, is_available: true, is_verified: true, radius_km: 12,
    profiles: { full_name: 'Anil Sharma', avatar_url: null, city: 'Delhi', location_lat: 28.6139, location_lng: 77.209 },
  },
  {
    id: 'w4', trade: 'electrician', bio: 'Expert in electrical diagnostics, inverter installations, and rewiring.', experience_years: 6, hourly_rate: 300, rating: 4.6, total_reviews: 68, is_available: true, is_verified: true, radius_km: 10,
    profiles: { full_name: 'Vikram Singh', avatar_url: null, city: 'Delhi', location_lat: 28.620, location_lng: 77.215 },
  },
  {
    id: 'w5', trade: 'carpenter', bio: 'Skilled carpenter for furniture repair, door fixing, and woodwork.', experience_years: 15, hourly_rate: 500, rating: 4.9, total_reviews: 312, is_available: true, is_verified: true, radius_km: 25,
    profiles: { full_name: 'Mohammed Ali', avatar_url: null, city: 'Bengaluru', location_lat: 12.9716, location_lng: 77.5946 },
  },
  {
    id: 'w6', trade: 'painter', bio: 'Interior and exterior painting specialist with 9 years of experience.', experience_years: 9, hourly_rate: 350, rating: 4.5, total_reviews: 78, is_available: true, is_verified: true, radius_km: 15,
    profiles: { full_name: 'Deepak Verma', avatar_url: null, city: 'Hyderabad', location_lat: 17.385, location_lng: 78.4867 },
  },
  {
    id: 'w7', trade: 'ac_tech', bio: 'AC repair and servicing expert for split, window, and central AC units.', experience_years: 7, hourly_rate: 400, rating: 4.7, total_reviews: 89, is_available: true, is_verified: true, radius_km: 18,
    profiles: { full_name: 'Kiran Reddy', avatar_url: null, city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707 },
  },
  {
    id: 'w8', trade: 'mason', bio: 'Expert mason for wall repairs, tiling, and concrete work.', experience_years: 11, hourly_rate: 380, rating: 4.6, total_reviews: 56, is_available: true, is_verified: true, radius_km: 20,
    profiles: { full_name: 'Ramesh Gupta', avatar_url: null, city: 'Pune', location_lat: 18.5204, location_lng: 73.8567 },
  },
  {
    id: 'w9', trade: 'welder', bio: 'Welding specialist for gates, grills, and structural steel repairs.', experience_years: 13, hourly_rate: 420, rating: 4.8, total_reviews: 145, is_available: true, is_verified: true, radius_km: 15,
    profiles: { full_name: 'Sanjay Mishra', avatar_url: null, city: 'Kolkata', location_lat: 22.5726, location_lng: 88.3639 },
  },
  {
    id: 'w10', trade: 'other', bio: 'Versatile handyman for general home repairs and maintenance.', experience_years: 5, hourly_rate: 250, rating: 4.4, total_reviews: 42, is_available: true, is_verified: true, radius_km: 10,
    profiles: { full_name: 'Pradeep Yadav', avatar_url: null, city: 'Jaipur', location_lat: 26.9124, location_lng: 75.7873 },
  },
  {
    id: 'w18', trade: 'electrician', bio: 'Specialist in house wiring, switchboards, and electrical fault repair in Bengaluru.', experience_years: 8, hourly_rate: 300, rating: 4.6, total_reviews: 48, is_available: true, is_verified: true, radius_km: 15,
    profiles: { full_name: 'Ajay Nair', avatar_url: null, city: 'Bengaluru', location_lat: 12.9716, location_lng: 77.5946 },
  },
  {
    id: 'w19', trade: 'electrician', bio: 'Residential wiring and electrical installation technician serving Belagavi.', experience_years: 3, hourly_rate: 400, rating: 4.3, total_reviews: 24, is_available: true, is_verified: true, radius_km: 12,
    profiles: { full_name: 'Rahul Kumar', avatar_url: null, city: 'Belagavi', location_lat: 15.8497, location_lng: 74.4977 },
  },
  {
    id: 'w20', trade: 'ac_tech', bio: 'AC Gas charging and cooling system expert operating in Belagavi.', experience_years: 19, hourly_rate: 250, rating: 4.6, total_reviews: 112, is_available: true, is_verified: true, radius_km: 20,
    profiles: { full_name: 'Ravi Yadav', avatar_url: null, city: 'Belagavi', location_lat: 15.8497, location_lng: 74.4977 },
  },
  {
    id: 'w21', trade: 'welder', bio: 'MIG welding specialist for iron gates, window grills, and structural steel in Kochi.', experience_years: 7, hourly_rate: 270, rating: 3.6, total_reviews: 19, is_available: true, is_verified: true, radius_km: 15,
    profiles: { full_name: 'Manoj Singh', avatar_url: null, city: 'Kochi', location_lat: 9.9312, location_lng: 76.2673 },
  },
  {
    id: 'w22', trade: 'painter', bio: 'Texture wall design and premium interior/exterior painter in Kochi.', experience_years: 2, hourly_rate: 650, rating: 4.3, total_reviews: 14, is_available: true, is_verified: true, radius_km: 10,
    profiles: { full_name: 'Ramesh Nair', avatar_url: null, city: 'Kochi', location_lat: 9.9312, location_lng: 76.2673 },
  },
  {
    id: 'w23', trade: 'electrician', bio: 'Senior electrical fault diagnosis and panel specialist in Chennai.', experience_years: 12, hourly_rate: 370, rating: 4.6, total_reviews: 86, is_available: true, is_verified: true, radius_km: 25,
    profiles: { full_name: 'Imran Shetty', avatar_url: null, city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707 },
  },
  {
    id: 'w24', trade: 'ac_tech', bio: 'AC refrigerant gas filling and leak testing technician in Chennai.', experience_years: 4, hourly_rate: 450, rating: 4.2, total_reviews: 31, is_available: true, is_verified: true, radius_km: 15,
    profiles: { full_name: 'Suresh Das', avatar_url: null, city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707 },
  },
  {
    id: 'w25', trade: 'carpenter', bio: 'Master cabinet maker and custom wooden furniture carpenter in Kochi.', experience_years: 22, hourly_rate: 230, rating: 4.4, total_reviews: 154, is_available: true, is_verified: true, radius_km: 20,
    profiles: { full_name: 'Arjun Das', avatar_url: null, city: 'Kochi', location_lat: 9.9312, location_lng: 76.2673 },
  },
  {
    id: 'w26', trade: 'ac_tech', bio: 'HVAC and split AC preventive maintenance technician in Pune.', experience_years: 9, hourly_rate: 750, rating: 3.8, total_reviews: 42, is_available: true, is_verified: true, radius_km: 18,
    profiles: { full_name: 'Kiran Sharma', avatar_url: null, city: 'Pune', location_lat: 18.5204, location_lng: 73.8567 },
  },
  {
    id: 'w27', trade: 'plumber', bio: 'Expert pipe leak detection and burst pipe repair plumber in Hyderabad.', experience_years: 13, hourly_rate: 230, rating: 3.8, total_reviews: 63, is_available: true, is_verified: true, radius_km: 15,
    profiles: { full_name: 'Rahul Rao', avatar_url: null, city: 'Hyderabad', location_lat: 17.3850, location_lng: 78.4867 },
  },
  {
    id: 'w28', trade: 'painter', bio: 'Royal texture painting and dampness treatment specialist in Hyderabad.', experience_years: 13, hourly_rate: 650, rating: 3.7, total_reviews: 57, is_available: true, is_verified: true, radius_km: 20,
    profiles: { full_name: 'Imran Yadav', avatar_url: null, city: 'Hyderabad', location_lat: 17.3850, location_lng: 78.4867 },
  },
  {
    id: 'w29', trade: 'ac_tech', bio: 'Comprehensive AC maintenance and chemical jet cleaning in Chennai.', experience_years: 14, hourly_rate: 580, rating: 4.0, total_reviews: 79, is_available: true, is_verified: true, radius_km: 22,
    profiles: { full_name: 'Ajay Shetty', avatar_url: null, city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707 },
  },
  {
    id: 'w30', trade: 'mason', bio: 'Concrete floor touchup, tile fitting and brickwork mason in Mumbai.', experience_years: 5, hourly_rate: 330, rating: 4.7, total_reviews: 38, is_available: true, is_verified: true, radius_km: 15,
    profiles: { full_name: 'Rahul Patel', avatar_url: null, city: 'Mumbai', location_lat: 19.0760, location_lng: 72.8777 },
  },
  {
    id: 'w31', trade: 'electrician', bio: '5-star rated master electrician for fault diagnosis and rewiring in Belagavi.', experience_years: 15, hourly_rate: 430, rating: 5.0, total_reviews: 142, is_available: true, is_verified: true, radius_km: 30,
    profiles: { full_name: 'Vijay Shetty', avatar_url: null, city: 'Belagavi', location_lat: 15.8497, location_lng: 74.4977 },
  },
  {
    id: 'w32', trade: 'electrician', bio: 'Industrial panel installation and heavy appliance electrician in Chennai.', experience_years: 4, hourly_rate: 620, rating: 3.7, total_reviews: 29, is_available: true, is_verified: true, radius_km: 15,
    profiles: { full_name: 'Imran Rao', avatar_url: null, city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707 },
  },
  {
    id: 'w33', trade: 'other', bio: '20+ years experienced general handyman and device technician in Pune.', experience_years: 21, hourly_rate: 800, rating: 4.3, total_reviews: 168, is_available: true, is_verified: true, radius_km: 25,
    profiles: { full_name: 'Deepak Patel', avatar_url: null, city: 'Pune', location_lat: 18.5204, location_lng: 73.8567 },
  },
  {
    id: 'w34', trade: 'carpenter', bio: 'Veteran door lock, hinge and custom wooden door carpenter in Kochi.', experience_years: 25, hourly_rate: 200, rating: 4.4, total_reviews: 195, is_available: true, is_verified: true, radius_km: 20,
    profiles: { full_name: 'Amit Joshi', avatar_url: null, city: 'Kochi', location_lat: 9.9312, location_lng: 76.2673 },
  },
  {
    id: 'w35', trade: 'plumber', bio: 'Top rated pipe fitting and sanitary installation plumber in Mumbai.', experience_years: 8, hourly_rate: 420, rating: 4.8, total_reviews: 94, is_available: true, is_verified: true, radius_km: 18,
    profiles: { full_name: 'Arjun Nair', avatar_url: null, city: 'Mumbai', location_lat: 19.0760, location_lng: 72.8777 },
  },
  {
    id: 'w36', trade: 'electrician', bio: 'Veteran electrician for complete home rewiring and MCB boxes in Delhi.', experience_years: 25, hourly_rate: 300, rating: 4.5, total_reviews: 210, is_available: true, is_verified: true, radius_km: 20,
    profiles: { full_name: 'Suresh Joshi', avatar_url: null, city: 'Delhi', location_lat: 28.6139, location_lng: 77.2090 },
  },
  {
    id: 'w37', trade: 'carpenter', bio: 'Custom wooden shelves, sofa repair and furniture carpenter in Chennai.', experience_years: 14, hourly_rate: 730, rating: 4.6, total_reviews: 108, is_available: true, is_verified: true, radius_km: 25,
    profiles: { full_name: 'Deepak Shetty', avatar_url: null, city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707 },
  },
  {
    id: 'w38', trade: 'ac_tech', bio: 'Central & split AC maintenance expert serving all of Chennai.', experience_years: 15, hourly_rate: 630, rating: 3.7, total_reviews: 64, is_available: true, is_verified: true, radius_km: 20,
    profiles: { full_name: 'Vijay Rao', avatar_url: null, city: 'Chennai', location_lat: 13.0827, location_lng: 80.2707 },
  },
  {
    id: 'w39', trade: 'electrician', bio: 'Commercial & residential wiring specialist operating in Kochi.', experience_years: 18, hourly_rate: 780, rating: 3.8, total_reviews: 123, is_available: true, is_verified: true, radius_km: 20,
    profiles: { full_name: 'Rahul Shetty', avatar_url: null, city: 'Kochi', location_lat: 9.9312, location_lng: 76.2673 },
  },
  {
    id: 'w40', trade: 'plumber', bio: 'Sanitary fitting, overhead tank and pipe fitting plumber in Hyderabad.', experience_years: 11, hourly_rate: 700, rating: 3.9, total_reviews: 72, is_available: true, is_verified: true, radius_km: 18,
    profiles: { full_name: 'Suresh Kumar', avatar_url: null, city: 'Hyderabad', location_lat: 17.3850, location_lng: 78.4867 },
  },
  {
    id: 'w41', trade: 'mason', bio: '24 years experienced masonry, tile grouting and concrete master in Hyderabad.', experience_years: 24, hourly_rate: 760, rating: 4.2, total_reviews: 180, is_available: true, is_verified: true, radius_km: 25,
    profiles: { full_name: 'Deepak Singh', avatar_url: null, city: 'Hyderabad', location_lat: 17.3850, location_lng: 78.4867 },
  },
  {
    id: 'w42', trade: 'welder', bio: 'Heavy structural steel and iron gate MIG welding pro in Hyderabad.', experience_years: 22, hourly_rate: 530, rating: 4.2, total_reviews: 135, is_available: true, is_verified: true, radius_km: 22,
    profiles: { full_name: 'Suresh Patel', avatar_url: null, city: 'Hyderabad', location_lat: 17.3850, location_lng: 78.4867 },
  },
  {
    id: 'w43', trade: 'plumber', bio: '24 years veteran plumber for leak detection and burst pipe repair in Mumbai.', experience_years: 24, hourly_rate: 270, rating: 3.9, total_reviews: 162, is_available: true, is_verified: true, radius_km: 20,
    profiles: { full_name: 'Rahul Sharma', avatar_url: null, city: 'Mumbai', location_lat: 19.0760, location_lng: 72.8777 },
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTrade = searchParams.get('trade');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // Normalize trade query (e.g. general_repair -> other)
    let targetTrade = rawTrade;
    if (rawTrade === 'general_repair' || rawTrade === 'appliance_repair' || rawTrade === 'electronics') {
      targetTrade = 'other';
    }

    if (isSupabaseConfigured()) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      let query = supabase
        .from('workers')
        .select('*, profiles(full_name, avatar_url, city, location_lat, location_lng)');

      if (targetTrade) {
        query = query.eq('trade', targetTrade);
      }

      const { data: fetchedWorkers } = await query.order('rating', { ascending: false });
      const dbWorkers = fetchedWorkers || [];

      // Always merge mockWorkers from jobStore so all dataset workers are included
      const { mockWorkers, mockProfiles } = await import('@/lib/jobStore');
      const existingIds = new Set(dbWorkers.map((w: any) => w.id));

      let mockList = Array.from(mockWorkers.values())
        .filter(w => !existingIds.has(w.id))
        .map(w => ({
          ...w,
          profiles: mockProfiles.get(w.id) || { full_name: 'Verified Repair Specialist', city: 'Mumbai' }
        }));

      if (targetTrade) {
        mockList = mockList.filter(w => w.trade === targetTrade || w.trade === 'other');
      }

      let result = [...dbWorkers, ...mockList];

      if (lat && lng) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        result = result
          .map((w: any) => {
            const index = parseInt((w.id || '5').replace(/\D/g, '') || '5');
            const wLat = w.profiles?.location_lat ?? (userLat + ((index % 5 - 2) * 0.02));
            const wLng = w.profiles?.location_lng ?? (userLng + ((index % 3 - 1) * 0.02));
            const dist = getDistanceKm(userLat, userLng, wLat, wLng);
            return {
              ...w,
              distance_km: Math.round(dist * 10) / 10,
            };
          })
          .sort((a: any, b: any) => a.distance_km - b.distance_km);
      } else {
        result = result.map((w: any) => ({
          ...w,
          distance_km: Math.round((Math.random() * 5 + 1) * 10) / 10,
        }));
      }

      return NextResponse.json({ workers: result });
    } else {
      // Local mode: use mock workers dynamically from jobStore
      const { mockWorkers, mockProfiles } = await import('@/lib/jobStore');
      let result = Array.from(mockWorkers.values()).map(w => ({
        ...w,
        profiles: mockProfiles.get(w.id) || null
      }));

      if (targetTrade) {
        let filtered = result.filter(w => w.trade === targetTrade);
        if (filtered.length === 0) {
          filtered = result.filter(w => w.trade === 'other');
        }
        result = filtered;
      }

      if (lat && lng) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        result = result.map((w: any) => {
          const index = parseInt((w.id || '5').replace(/\D/g, '') || '5');
          const mockLat = userLat + ((index % 5 - 2) * 0.02);
          const mockLng = userLng + ((index % 3 - 1) * 0.02);
          
          if (w.profiles) {
            w.profiles.location_lat = mockLat;
            w.profiles.location_lng = mockLng;
          }

          const dist = getDistanceKm(userLat, userLng, mockLat, mockLng);
          return {
            ...w,
            distance_km: Math.round(dist * 10) / 10,
          };
        }).sort((a: any, b: any) => a.distance_km - b.distance_km);
      } else {
        result = result.map(w => ({ ...w, distance_km: Math.round((Math.random() * 5 + 1) * 10) / 10 }));
      }

      return NextResponse.json({ workers: result });
    }
  } catch (error) {
    console.error('Workers route error:', error);
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}
