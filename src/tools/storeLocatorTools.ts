import type { DisplayLinkStructuredResult } from "../types";

// Store data interface
export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
  latitude: number;
  longitude: number;
  directionsUrl: string;
}

// Sample store data extracted from the HTML you provided
export const stores: Store[] = [
  {
    id: "0",
    name: "042 WINE & SPIRITS LLC ( MS - F - 44309 )",
    address: "1378 W GOVERNMENT ST",
    city: "BRANDON",
    state: "MS",
    country: "USA",
    latitude: 32.2841707,
    longitude: -90.0129487,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=1378%20W%20GOVERNMENT%20ST,%20BRANDON,%20MS,%20USA"
  },
  {
    id: "1",
    name: "04 - THIRD STREET ( N1 - F - 062000000004 )",
    address: "125 CHERRY ST",
    city: "CHARLOTTE",
    state: "NC",
    country: "USA",
    latitude: 35.2142465,
    longitude: -80.8319138,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=125%20CHERRY%20ST,%20CHARLOTTE,%20NC,%20USA"
  },
  {
    id: "2",
    name: "05 -WILKINSON CROSSING ( N1 - F - 062000000005 )",
    address: "3120 WILKINSON BLVD",
    city: "CHARLOTTE",
    state: "NC",
    country: "USA",
    latitude: 35.2246711,
    longitude: -80.8920099,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=3120%20WILKINSON%20BLVD,%20CHARLOTTE,%20NC,%20USA"
  },
  {
    id: "3",
    name: "06 - PARK RD. ( N1 - F - 062000000006 )",
    address: "4329 PARK RD",
    city: "CHARLOTTE",
    state: "NC",
    country: "USA",
    latitude: 35.17338095,
    longitude: -80.85072427670407,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=4329%20PARK%20RD,%20CHARLOTTE,%20NC,%20USA"
  },
  {
    id: "4",
    name: "07 - MINT HILL ( N1 - F - 062000000007 )",
    address: "7044 BRIGHTON PARK DR",
    city: "CHARLOTTE",
    state: "NC",
    country: "USA",
    latitude: 35.1713489,
    longitude: -80.66216548615134,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=7044%20BRIGHTON%20PARK%20DR,%20CHARLOTTE,%20NC,%20USA"
  },
  {
    id: "5",
    name: "08 - INDEPENDENCE RD. ( N1 - F - 062000000008 )",
    address: "4047 CONNECTION POINT BLVD",
    city: "CHARLOTTE",
    state: "NC",
    country: "USA",
    latitude: 35.18555805,
    longitude: -80.7587084856914,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=4047%20CONNECTION%20POINT%20BLVD,%20CHARLOTTE,%20NC,%20USA"
  },
  {
    id: "6",
    name: "09 - GRAHAM STREET ( N1 - F - 062000000009 )",
    address: "1609 N GRAHAM ST",
    city: "CHARLOTTE",
    state: "NC",
    country: "USA",
    latitude: 35.243549349999995,
    longitude: -80.83340042527195,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=1609%20N%20GRAHAM%20ST,%20CHARLOTTE,%20NC,%20USA"
  },
  {
    id: "7",
    name: "1010 WASHINGTON WINE & SPIRITS",
    address: "1010 WASHINGTON AVE S",
    city: "MINNEAPOLIS",
    state: "MN",
    country: "USA",
    latitude: 44.97622695,
    longitude: -93.25383695226073,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=1010%20WASHINGTON%20AVE%20S,%20MINNEAPOLIS,%20MN,%20USA"
  },
  {
    id: "8",
    name: "105 SOUTH LIQUORS",
    address: "135 PARK PLAZA BOULEVARD",
    city: "LEBANON JUNCTION",
    state: "KY",
    country: "USA",
    latitude: 37.8280645,
    longitude: -85.7254147,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=135%20PARK%20PLAZA%20BOULEVARD,%20LEBANON%20JUNCTION,%20KY,%20USA"
  },
  {
    id: "9",
    name: "106 MINI MART",
    address: "2107 PLYMOUTH ST",
    city: "BRIDGEWATER",
    state: "MA",
    country: "USA",
    latitude: 41.9962191,
    longitude: -70.9005314,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=2107%20PLYMOUTH%20ST,%20BRIDGEWATER,%20MA,%20USA"
  },
  {
    id: "10",
    name: "108 NORTH MAIN LIQUORS",
    address: "108 N MAIN",
    city: "HEBRON",
    state: "IN",
    country: "USA",
    latitude: 41.318841,
    longitude: -87.200276,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=108%20N%20MAIN,%20HEBRON,%20IN,%20USA"
  },
  {
    id: "11",
    name: "109 LIQUOR AND WINE (LEBANON)",
    address: "443 HIGHWAY 109",
    city: "LEBANON",
    state: "TN",
    country: "USA",
    latitude: 36.1927123,
    longitude: -86.40887049999999,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=443%20HIGHWAY%20109,%20LEBANON,%20TN,%20USA"
  },
  {
    id: "12",
    name: "109 WINES & LIQUORS",
    address: "1344 S WATER AVE",
    city: "GALLATIN",
    state: "TN",
    country: "USA",
    latitude: 36.3568521,
    longitude: -86.439854,
    directionsUrl: "http://maps.google.com/maps?saddr=&daddr=1344%20S%20WATER%20AVE,%20GALLATIN,%20TN,%20USA"
  }
];



// Geocoding function to convert location names to coordinates
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error("Google Maps API key is required. Please set GOOGLE_MAPS_API_KEY in your environment variables.");
  }
  
  try {
    // Using Google Maps Geocoding API
    const encodedLocation = encodeURIComponent(location);
    const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${apiKey}`;
    
    console.log("🌐 Making Google Maps API request for:", location);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Google Maps API failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("📡 Google Maps API response status:", data.status);
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      };
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn(`No results found for location: ${location}`);
      return null;
    } else {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Google Maps API error:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

// Find closest stores to a location
export async function findClosestStores(params: { location: string; limit?: number }) {
  const { location, limit = 5 } = params;
  
  console.log("🔍 Starting store search for:", location);
  
  // First, geocode the input location
  console.log("📍 Geocoding location...");
  const coordinates = await geocodeLocation(location);
  
  if (!coordinates) {
    console.log("❌ Geocoding failed for location:", location);
    return {
      content: [
        {
          type: "text",
          text: `Failed to find coordinates for location: ${location}. Please try a more specific location name (e.g., "Chicago, IL" or "Los Angeles, CA").`,
        },
      ],
    };
  }
  
  console.log("✅ Geocoding successful:", `${coordinates.lat}, ${coordinates.lng}`);
  
  // Calculate distances to all stores
  console.log("📏 Calculating distances to", stores.length, "stores...");
  const storesWithDistance = stores.map(store => ({
    ...store,
    distance: calculateDistance(coordinates.lat, coordinates.lng, store.latitude, store.longitude)
  }));
  
  // Sort by distance and take the closest ones
  const closestStores = storesWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
    
  console.log("🎯 Found closest stores:");
  closestStores.forEach((store, index) => {
    console.log(`  ${index + 1}. ${store.name} - ${store.distance.toFixed(1)} miles`);
  });
  
  // Format the results
  const storeList = closestStores.map((store, index) => {
    return [
      `${index + 1}. ${store.name}`,
      `   Address: ${store.address}, ${store.city}, ${store.state}`,
      `   Distance: ${store.distance.toFixed(1)} miles`,
      ""
    ].join("\n");
  }).join("\n");
  
  const resultText = [
    `Found ${closestStores.length} closest stores to ${location}:`,
    `Location coordinates: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
    "",
    storeList
  ].join("\n");

  // Create a single structured result that opens Google Maps with the closest store
  const closestStore = closestStores[0];
  const structuredResult: DisplayLinkStructuredResult = {
    action: "display_link",
    data: {
      url: closestStore.directionsUrl,
      title: `Get Directions to Closest Store`,
      description: `${closestStore.name} - ${closestStore.address}, ${closestStore.city}, ${closestStore.state} (${closestStore.distance.toFixed(1)} miles away)`,
      open_in_new_tab: true,
      auto_navigate: false,
    },
  };

  return {
    content: [
      {
        type: "text",
        text: resultText,
      },
    ],
    structuredContent: [structuredResult],
  };
}

// Tool definition for the store locator
export const findClosestStoresToolDefinition = {
  name: "find-stores-with-shankys-near-me",
  title: "Find Shanky's Whip in a store near me",
  description: "Find the closest stores to a given location (city, state, or address)",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "Location to search from (e.g., 'Chicago, IL', 'California', 'New York, NY')",
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 20,
        default: 5,
        description: "Maximum number of closest stores to return (default: 5)",
      },
    },
    required: ["location"],
  },
};
