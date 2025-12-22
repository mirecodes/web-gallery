
export async function getCityFromCoordinates(latitude: number, longitude: number): Promise<string | undefined> {
  try {
    // Using OpenStreetMap Nominatim API
    // Note: Please respect their usage policy (max 1 request per second)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          'Accept-Language': 'en', // Get results in English
          'User-Agent': 'GalleryApp/1.0' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    // Extract city/town/village
    const address = data.address;
    const city = address.city || address.town || address.village || address.county || address.state;
    const country = address.country;

    if (city && country) {
      return `${city}, ${country}`;
    } else if (city) {
      return city;
    } else if (country) {
      return country;
    }
    
    return undefined;
  } catch (error) {
    console.warn('Failed to get city name:', error);
    return undefined;
  }
}
