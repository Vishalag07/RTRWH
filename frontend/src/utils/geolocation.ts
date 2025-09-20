export interface LocationData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: -1,
        message: 'Geolocation is not supported by this browser.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get city name
          const cityName = await reverseGeocode(latitude, longitude);
          
          resolve({
            city: cityName,
            country: 'Unknown', // We'll get this from the reverse geocoding
            latitude,
            longitude
          });
        } catch (error) {
          reject({
            code: -2,
            message: 'Failed to get location details'
          });
        }
      },
      (error) => {
        reject({
          code: error.code,
          message: error.message
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'RTRWH-App/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    
    // Extract city name from the response
    const address = data.address || {};
    
    // Try different possible city fields
    const city = address.city || 
                 address.town || 
                 address.village || 
                 address.municipality || 
                 address.county || 
                 address.state_district ||
                 address.state ||
                 'Unknown Location';
    
    return city;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Unknown Location';
  }
}

export function getLocationErrorText(error: GeolocationError): string {
  switch (error.code) {
    case 1:
      return 'Location access denied. Please allow location access to auto-fill your city.';
    case 2:
      return 'Location unavailable. Please check your internet connection.';
    case 3:
      return 'Location request timed out. Please try again.';
    case -1:
      return 'Geolocation is not supported by your browser.';
    case -2:
      return 'Failed to get location details. Please enter your city manually.';
    default:
      return 'Unable to get your location. Please enter your city manually.';
  }
}
