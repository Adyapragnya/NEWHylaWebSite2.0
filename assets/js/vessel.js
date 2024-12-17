async function fetchLocationAndTime() {
    const locationElement = document.getElementById('location-time');

    // Check if Geolocation is available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            // Reverse geocoding to get the city
            try {
                const response = await fetch(`https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                const city = data.address.city || data.address.town || data.address.village || 'Unknown Location';

                // Get current date and time in the user's timezone
                const now = new Date();
                const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
                const formatter = new Intl.DateTimeFormat('en-US', options);
                const formattedDate = formatter.format(now);

                // Convert date to DD/MM/YYYY with month in words
                const day = now.getDate().toString().padStart(2, '0');
                const month = now.toLocaleString('en-US', { month: 'short' });
                const year = now.getFullYear();
                const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                // Format output as DD/Mon/YYYY HH:MM AM/PM
                const formattedDateTime = `${day}/${month}/${year} <br> ${time}`;

                // Update the HTML content
                locationElement.innerHTML = `${city} <br> ${formattedDateTime}`;
            } catch (error) {
                locationElement.innerHTML = `Error fetching location <br> --/---/---- --:-- --`;
                console.error('Error fetching location data:', error);
            }
        }, (error) => {
            console.error('Geolocation error:', error);
            locationElement.innerHTML = `Location unavailable <br> --/---/---- --:-- --`;
        });
    } else {
        locationElement.innerHTML = `Geolocation not supported <br> --/---/---- --:-- --`;
    }
}

// Call the function on page load
fetchLocationAndTime();


// ===================================================================================== //

document.addEventListener("DOMContentLoaded", () => {
const container = document.getElementById("vessel-data-container");

// Function to fetch vessel data from multiple APIs
async function fetchVesselData() {
try {
    const urls = [
        "https://app.greenhyla.com/auth/api/get-vessel-histories",
        "https://hyla.greenhyla.com/auth/api/get-vessel-histories"
    ];

    // Fetch data from both APIs concurrently
    const responses = await Promise.all(urls.map(url => fetch(url)));
    const dataArrays = await Promise.all(responses.map(res => res.json()));

    // Combine data from both APIs into a single array
    const combinedData = dataArrays.flat();

    // Filter out vessels where geofenceName or geofenceFlag is null or undefined
    const filteredData = combinedData.filter(vessel => 
        vessel.history?.[0]?.geofenceName && vessel.history?.[0]?.geofenceFlag
    );

    // Remove duplicate vessels based on IMO (unique identifier)
    const uniqueVessels = [];
    const seen = new Set();

    filteredData.forEach(vessel => {
        if (!seen.has(vessel.IMO)) {
            seen.add(vessel.IMO);
            uniqueVessels.push(vessel);
        }
    });

    // Combine multiple vessel alerts into a single line
    const vesselAlerts = uniqueVessels.map(vessel => {
        const history = vessel.history[0]; // Get the first history record
        return `🚢 <strong>${vessel.vesselName}</strong> @ ${history.geofenceName}`;
    }).join(" &nbsp;&nbsp; | &nbsp;&nbsp; "); // Separator

    // Populate the ticker container
    container.innerHTML = `<span>${vesselAlerts}</span>`;

    // Adjust scrolling speed after loading content
    adjustScrollingSpeed();

} catch (error) {
    console.error("Error fetching vessel data:", error);
    container.innerHTML = "<span>⚠️ Unable to fetch vessel data. Please try again later.</span>";
}
}

// Function to adjust scroll speed dynamically
function adjustScrollingSpeed() {
const tickerWrapper = document.querySelector('.ticker-wrapper');
const containerWidth = document.querySelector('.ticker-content').offsetWidth;
const contentWidth = tickerWrapper.scrollWidth;

// Calculate a proportional duration: longer content = slower scroll
const baseDuration = 30; // Base duration (in seconds) for one full container width
const duration = Math.max(baseDuration, contentWidth / containerWidth * baseDuration);

// Apply dynamic animation duration
tickerWrapper.style.animation = `scroll-ticker ${duration}s linear infinite`;
}

// Initial call and refresh every 10 seconds
fetchVesselData();
setInterval(fetchVesselData, 10000); // Refresh every 10 seconds
});

