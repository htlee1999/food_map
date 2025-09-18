const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Helper function to read JSON file
const readJsonFile = (filename) => {
  const filePath = path.join(dataDir, filename);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Helper function to write JSON file
const writeJsonFile = (filename, data) => {
  const filePath = path.join(dataDir, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

// Routes

// Get all places
app.get('/api/places', (req, res) => {
  const places = readJsonFile('places.json');
  res.json(places);
});

// Add a new place
app.post('/api/places', (req, res) => {
  const newPlace = req.body;
  
  // Validate required fields
  if (!newPlace.name || !newPlace.address || !newPlace.coords) {
    return res.status(400).json({ error: 'Missing required fields: name, address, coords' });
  }

  // Read existing places
  const places = readJsonFile('places.json');
  
  // Check if place already exists
  const exists = places.some(place => 
    place.name.toLowerCase() === newPlace.name.toLowerCase() && 
    place.address.toLowerCase() === newPlace.address.toLowerCase()
  );

  if (exists) {
    return res.status(409).json({ error: 'Place already exists' });
  }

  // Add new place
  places.push(newPlace);
  
  // Save to file
  if (writeJsonFile('places.json', places)) {
    res.json({ message: 'Place added successfully', place: newPlace });
  } else {
    res.status(500).json({ error: 'Failed to save place' });
  }
});

// Save multiple places (for CSV import)
app.post('/api/places/batch', (req, res) => {
  const { places } = req.body;
  
  if (!Array.isArray(places)) {
    return res.status(400).json({ error: 'Places must be an array' });
  }

  // Read existing places
  const existingPlaces = readJsonFile('places.json');
  
  // Filter out duplicates
  const newPlaces = places.filter(newPlace => 
    !existingPlaces.some(existing => 
      existing.name.toLowerCase() === newPlace.name.toLowerCase() && 
      existing.address.toLowerCase() === newPlace.address.toLowerCase()
    )
  );

  // Add new places
  const allPlaces = [...existingPlaces, ...newPlaces];
  
  // Save to file
  if (writeJsonFile('places.json', allPlaces)) {
    res.json({ 
      message: `Added ${newPlaces.length} new places`, 
      total: allPlaces.length,
      added: newPlaces.length,
      skipped: places.length - newPlaces.length
    });
  } else {
    res.status(500).json({ error: 'Failed to save places' });
  }
});

// Get user preferences (visited/want to visit)
app.get('/api/preferences', (req, res) => {
  const preferences = readJsonFile('preferences.json');
  res.json(preferences);
});

// Save user preferences
app.post('/api/preferences', (req, res) => {
  const preferences = req.body;
  
  if (writeJsonFile('preferences.json', preferences)) {
    res.json({ message: 'Preferences saved successfully' });
  } else {
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
  console.log(`📁 Data directory: ${dataDir}`);
});
