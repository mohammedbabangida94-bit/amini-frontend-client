export function formatReportDate(isoString) {
    if (!isoString) return 'N/A';
    
    const rawDate = new Date(isoString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    };

    return rawDate.toLocaleString('en-US', options);
}

// -------------------------------------------------------------

export function formatLocation(lat, long) {
    // Defensive check for missing location data
    if (lat === null || long === null || typeof lat === 'undefined' || typeof long === 'undefined') {
        return 'Location Not Provided';
    }
    
    // Rounding and Hemisphere logic
    const roundedLat = Math.abs(lat).toFixed(2);
    const roundedLong = Math.abs(long).toFixed(2);

    const latHemisphere = lat >= 0 ? 'N' : 'S';
    const longHemisphere = long >= 0 ? 'E' : 'W';

    const formattedLat = `${roundedLat}° ${latHemisphere}`;
    const formattedLong = `${roundedLong}° ${longHemisphere}`;

    return `Lat: ${formattedLat}, Long: ${formattedLong}`;
}