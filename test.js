// test.js - Tool for identifying door coordinates of Tampa Bay restaurants

// Constants for Tampa Bay area bounds
const TAMPA_BAY_BOUNDS = {
  north: 28.1389, // North boundary (roughly Tarpon Springs)
  south: 27.4689, // South boundary (roughly Bradenton)
  east: -82.3458, // East boundary (roughly Plant City)
  west: -82.8458  // West boundary (Gulf of Mexico)
};

// Sample restaurants with approximate locations (these would be fetched from a database in production)
const TAMPA_BAY_RESTAURANTS = [
  { 
    name: "Thai Bay",
    position: { lat: 27.916953, lng: -82.773537 },
    hasBeenMapped: true
  },
  // Add more restaurants here as needed
];

/**
 * Calculate door position based on a viewer's position, heading, and distance
 * @param {Object} viewerPosition - Current position {lat, lng}
 * @param {number} heading - Direction viewer is facing in degrees (0 = north, 90 = east, etc.)
 * @param {number} distance - Distance to door in meters
 * @return {Object} Door position {lat, lng}
 */
function calculateDoorPosition(viewerPosition, heading, distance) {
  // Earth's radius in meters
  const R = 6378137;
  
  // Convert heading from degrees to radians
  const headingRad = heading * Math.PI / 180;
  
  // Convert latitude and longitude to radians
  const lat1 = viewerPosition.lat * Math.PI / 180;
  const lng1 = viewerPosition.lng * Math.PI / 180;
  
  // Calculate new latitude
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
    Math.cos(lat1) * Math.sin(distance / R) * Math.cos(headingRad)
  );
  
  // Calculate new longitude
  const lng2 = lng1 + Math.atan2(
    Math.sin(headingRad) * Math.sin(distance / R) * Math.cos(lat1),
    Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  // Convert back to degrees
  return {
    lat: lat2 * 180 / Math.PI,
    lng: lng2 * 180 / Math.PI
  };
}

/**
 * Create a bounding box around a door position
 * @param {Object} doorPosition - Door position {lat, lng}
 * @param {number} width - Width of door in meters (default: 1)
 * @param {number} height - Height of door in meters (default: 2)
 * @return {Object} Bounding box with NE and SW corners
 */
function createDoorBoundingBox(doorPosition, width = 1, height = 2) {
  // Create points at different offsets to account for door dimensions
  const halfWidth = width / 2;
  const pointNE = calculateDoorPosition(doorPosition, 45, Math.sqrt(2 * Math.pow(halfWidth, 2)));
  const pointSW = calculateDoorPosition(doorPosition, 225, Math.sqrt(2 * Math.pow(halfWidth, 2)));
  
  return {
    northeast: pointNE,
    southwest: pointSW,
    center: doorPosition,
    widthMeters: width,
    heightMeters: height
  };
}

/**
 * Store the door position in the restaurant database
 * @param {string} restaurantName - Name of the restaurant
 * @param {Object} doorPosition - Door position {lat, lng}
 * @param {Object} doorDimensions - Door dimensions {width, height} in meters
 * @param {string} accessibilityIssue - Description of accessibility issue (optional)
 */
function storeDoorPosition(restaurantName, doorPosition, doorDimensions, accessibilityIssue = "") {
  // In a real application, this would send data to your server/database
  const doorData = {
    restaurant: restaurantName,
    position: doorPosition,
    dimensions: doorDimensions,
    boundingBox: createDoorBoundingBox(doorPosition, doorDimensions.width, doorDimensions.height),
    issue: accessibilityIssue,
    timestamp: new Date().toISOString()
  };
  
  console.log("Door data saved:", doorData);
  
  // Here you could add code to save to localStorage or send to server
  let savedDoors = JSON.parse(localStorage.getItem('savedDoors') || '[]');
  savedDoors.push(doorData);
  localStorage.setItem('savedDoors', JSON.stringify(savedDoors));
  
  return doorData;
}

// Instead, add this function to safely get or create map instances
function getMapInstances() {
    // Use existing map and streetView if available, or create new ones
    if (typeof window.map === 'undefined') {
        window.map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 27.9506, lng: -82.4572 }, // Tampa center
            zoom: 13
        });
    }
    
    if (typeof window.streetView === 'undefined') {
        window.streetView = window.map.getStreetView();
    }
    
    return {
        map: window.map,
        streetView: window.streetView
    };
}

/**
 * Find and record door positions from Street View
 * This function requires Google Maps JavaScript API to be loaded
 */
function recordDoorPositionFromStreetView() {
    const { map, streetView } = getMapInstances();
    
    // Check if Street View is initialized
    if (!streetView) {
        alert("Street View is not initialized yet");
        return;
    }

    // Get the current Street View position and heading
    const currentPosition = streetView.getPosition();
    const currentPOV = streetView.getPov();
    
    if (!currentPosition || !currentPOV) {
        alert("Unable to get current position. Make sure you're in Street View mode.");
        return;
    }

    // Format position for display
    const posLat = currentPosition.lat();
    const posLng = currentPosition.lng();
    const heading = currentPOV.heading;
    
    // Estimated distance to the door (user would input this)
    const distanceToDoor = parseFloat(prompt("Estimated distance to door (meters):", "3"));
    
    if (isNaN(distanceToDoor)) {
        alert("Please enter a valid number for distance");
        return;
    }
    
    // Calculate door position based on current position, heading and distance
    const doorPosition = calculateDoorPosition(
        { lat: posLat, lng: posLng },
        heading,
        distanceToDoor
    );
    
    // Get door dimensions from user
    const doorWidth = parseFloat(prompt("Door width (meters):", "1"));
    const doorHeight = parseFloat(prompt("Door height (meters):", "2"));
    
    if (isNaN(doorWidth) || isNaN(doorHeight)) {
        alert("Please enter valid numbers for door dimensions");
        return;
    }
    
    // Get restaurant name
    const restaurantName = prompt("Restaurant name:", "");
    if (!restaurantName) {
        alert("Restaurant name is required");
        return;
    }
    
    // Get accessibility issue description
    const accessibilityIssue = prompt("Describe any accessibility issues:", "");
    
    // Store the door position
    const doorData = storeDoorPosition(
        restaurantName,
        doorPosition, 
        { width: doorWidth, height: doorHeight },
        accessibilityIssue
    );
    
    // Display confirmation with the recorded position
    alert(`Door position recorded for ${restaurantName}:\nLatitude: ${doorPosition.lat.toFixed(6)}\nLongitude: ${doorPosition.lng.toFixed(6)}`);
    
    // Place a marker at the door position
    if (typeof google !== 'undefined' && google.maps) {
        const marker = new google.maps.Marker({
            position: doorPosition,
            map: map,
            title: `${restaurantName} Door`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#FF0000",
                fillOpacity: 0.8,
                strokeWeight: 1
            }
        });

        // Make the marker draggable for position adjustment
        marker.setDraggable(true);

        // Add drag end listener to update position
        marker.addListener('dragend', () => {
            const newPosition = marker.getPosition();
            doorData.position = {
                lat: newPosition.lat(),
                lng: newPosition.lng()
            };
            // Update the stored data
            updateStoredDoorPosition(doorData);
            alert('Door position updated!');
        });
    }
    
    return doorData;
}

// Add this function to update stored door position
function updateStoredDoorPosition(updatedDoorData) {
    let savedDoors = JSON.parse(localStorage.getItem('savedDoors') || '[]');
    const index = savedDoors.findIndex(door => 
        door.restaurant === updatedDoorData.restaurant &&
        door.timestamp === updatedDoorData.timestamp
    );
    
    if (index !== -1) {
        savedDoors[index] = updatedDoorData;
        localStorage.setItem('savedDoors', JSON.stringify(savedDoors));
    }
}

// Update the initialization code
function initializeMapAndStreetView() {
    const { map, streetView } = getMapInstances();

    // Add the record button after Street View is initialized
    addRecordDoorButton();
    
    // Add the export button
    addExportDoorsButton();

    // Add Street View changed listener
    streetView.addListener('position_changed', () => {
        console.log('Street View position changed');
    });
}

// Update the addRecordDoorButton function
function addRecordDoorButton() {
    const button = document.createElement('button');
    button.textContent = 'Record Door Position';
    button.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 1000;
        background: #3498db;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    `;
    
    button.addEventListener('click', recordDoorPositionFromStreetView);
    document.body.appendChild(button);
}

/**
 * List all saved door positions
 */
function listSavedDoorPositions() {
    const savedDoors = JSON.parse(localStorage.getItem('savedDoors') || '[]');
    
    if (savedDoors.length === 0) {
        console.log("No door positions have been saved yet.");
        return [];
    }
    
    console.log(`Found ${savedDoors.length} saved door positions:`);
    savedDoors.forEach((door, index) => {
        console.log(`${index + 1}. ${door.restaurant}: ${door.position.lat.toFixed(6)}, ${door.position.lng.toFixed(6)}`);
    });
    
    return savedDoors;
}

/**
 * Export door positions to a JSON file and also save to localStorage for retrieval in virtual-tour
 */
function exportDoorPositions() {
    const savedDoors = JSON.parse(localStorage.getItem('savedDoors') || '[]');
    
    if (savedDoors.length === 0) {
        alert("No door positions have been saved yet.");
        return [];
    }
    
    // Format for use in the app
    const formattedDoors = savedDoors.map(door => ({
        position: door.position,
        type: 'door',
        content: door.issue || 'Door',
        restaurant: door.restaurant,
        dimensions: {
            width: `${door.dimensions.width * 20}px`, // Scale for display
            height: `${door.dimensions.height * 40}px`, // Scale for display 
            yOffset: door.dimensions.height / 2
        }
    }));
    
    // Save to localStorage in a format that virtual-tour can use
    localStorage.setItem('doorAccessibilityData', JSON.stringify(formattedDoors));
    
    // Create a downloadable file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formattedDoors, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "door_positions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    alert(`Exported ${formattedDoors.length} door positions. This data will be available in the virtual tour.`);
    
    return formattedDoors;
}

// Add button to export door data
function addExportDoorsButton() {
    const button = document.createElement('button');
    button.textContent = 'Export Door Data';
    button.style.cssText = `
        position: absolute;
        top: 10px;
        left: 200px;
        z-index: 1000;
        background: #27ae60;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    `;
    
    button.addEventListener('click', exportDoorPositions);
    document.body.appendChild(button);
}

// Update the initialization listener
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the right page
    if (document.getElementById('map')) {
        // Wait for Google Maps to load
        const checkMapInterval = setInterval(() => {
            if (typeof google !== 'undefined' && google.maps) {
                clearInterval(checkMapInterval);
                initializeMapAndStreetView();
            }
        }, 500);
    }
    
    // Add global functions for console debugging
    window.testUtils = {
        calculateDoorPosition,
        createDoorBoundingBox,
        storeDoorPosition,
        listSavedDoorPositions,
        exportDoorPositions
    };
    
    console.log("Door position recording tools loaded. Use window.testUtils to access functions.");
});
