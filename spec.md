# BharatRoads

## Current State
- UserApp has text inputs for pickup/destination
- Fare is calculated with fixed 10km distance
- After booking, a simulated "map" shows a grid with emoji car moving via random lat/lng updates
- No real GPS location access
- No actual map rendering

## Requested Changes (Diff)

### Add
- GPS location access via browser `navigator.geolocation` to auto-fill pickup with current location (reverse geocoded via OpenStreetMap Nominatim API)
- Interactive map using Leaflet.js (react-leaflet) showing:
  - User's current location marker
  - Destination marker
  - Route polyline drawn between pickup and destination using OpenRouteService or OSRM
  - Animated driver marker moving toward pickup
- Live fare calculation based on actual distance (km) between pickup and destination using Haversine formula
- Ola/Uber style bottom-sheet booking UI: map takes full screen, booking form slides up from bottom

### Modify
- UserApp: replace static fare (10km) with dynamic fare based on real coordinates distance
- UserApp: replace simulated grid "map" with real Leaflet map
- UserApp: add GPS button on pickup input to detect current location

### Remove
- Simulated grid map with random lat/lng coordinates display

## Implementation Plan
1. Install react-leaflet and leaflet packages
2. Rewrite UserApp to Ola/Uber style: full-screen map (Leaflet/OpenStreetMap) at top, bottom-sheet booking form
3. Add GPS detection: browser geolocation -> reverse geocode via Nominatim -> set pickup text and map center
4. Add destination geocoding: when destination typed, geocode via Nominatim to get coordinates
5. Draw route polyline between pickup and destination coordinates
6. Calculate real distance (Haversine) and update fare dynamically
7. After booking: show animated driver marker moving toward pickup on the actual map
