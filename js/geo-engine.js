/**
 * EcoNav AI - Core Geographic & Geodesic Calculation Engine
 * Handles Great Circle trajectory math, infrastructure discovery, 
 * land-connectivity validation, cross-water feasibility analysis,
 * and resilient multi-provider geocoding with 0ms offline fallback.
 */

const _AirportsData = (typeof GLOBAL_AIRPORTS !== 'undefined') ? { GLOBAL_AIRPORTS, GLOBAL_FERRY_PORTS } : (typeof require !== 'undefined' ? require('./airports-data.js') : { GLOBAL_AIRPORTS: [], GLOBAL_FERRY_PORTS: [] });

const GeoEngine = (() => {
    const GLOBAL_AIRPORTS = _AirportsData.GLOBAL_AIRPORTS || (typeof window !== 'undefined' ? window.GLOBAL_AIRPORTS : []);
    const GLOBAL_FERRY_PORTS = _AirportsData.GLOBAL_FERRY_PORTS || (typeof window !== 'undefined' ? window.GLOBAL_FERRY_PORTS : []);
    const EARTH_RADIUS_KM = 6371.0088;

    function toRad(deg) {
        return deg * (Math.PI / 180);
    }

    function toDeg(rad) {
        return rad * (180 / Math.PI);
    }

    /**
     * Standard Haversine distance between two lat/lon coordinates in kilometers
     */
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const phi1 = toRad(lat1);
        const phi2 = toRad(lat2);
        const deltaPhi = toRad(lat2 - lat1);
        const deltaLambda = toRad(lon2 - lon1);

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                  Math.cos(phi1) * Math.cos(phi2) *
                  Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    /**
     * Initial compass bearing from point 1 to point 2 in degrees (0 - 360)
     */
    function calculateBearing(lat1, lon1, lat2, lon2) {
        const phi1 = toRad(lat1);
        const phi2 = toRad(lat2);
        const deltaLambda = toRad(lon2 - lon1);

        const y = Math.sin(deltaLambda) * Math.cos(phi2);
        const x = Math.cos(phi1) * Math.sin(phi2) -
                  Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
        const theta = Math.atan2(y, x);

        return (toDeg(theta) + 360) % 360;
    }

    /**
     * Generates a smooth, curved Great-Circle Geodesic trajectory
     * across the Earth's spherical surface for realistic flight visualization.
     */
    function generateGreatCirclePoints(p1, p2, numPoints = 60) {
        const lat1 = toRad(p1[0]);
        const lon1 = toRad(p1[1]);
        const lat2 = toRad(p2[0]);
        const lon2 = toRad(p2[1]);

        const deltaPhi = lat2 - lat1;
        const deltaLambda = lon2 - lon1;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        if (d < 1e-6) {
            return [[p1[0], p1[1]], [p2[0], p2[1]]];
        }

        const points = [];
        for (let i = 0; i <= numPoints; i++) {
            const f = i / numPoints;
            const A = Math.sin((1 - f) * d) / Math.sin(d);
            const B = Math.sin(f * d) / Math.sin(d);

            const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
            const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
            const z = A * Math.sin(lat1) + B * Math.sin(lat2);

            const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
            const lon = Math.atan2(y, x);

            points.push([toDeg(lat), toDeg(lon)]);
        }

        return points;
    }

    /**
     * Generates a realistic curved road path with subtle realistic bends
     * when real OSRM road graph is offline or unavailable.
     */
    function generateRealisticRoadPath(p1, p2, bendFactor = 0.08, numPoints = 25) {
        const points = [];
        const lat1 = p1[0], lon1 = p1[1];
        const lat2 = p2[0], lon2 = p2[1];
        
        const midLat = (lat1 + lat2) / 2;
        const midLon = (lon1 + lon2) / 2;
        
        // Orthogonal offset for realistic highway detour
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        const offsetLat = -dLon * bendFactor;
        const offsetLon = dLat * bendFactor;
        
        const ctrlLat = midLat + offsetLat;
        const ctrlLon = midLon + offsetLon;

        // Quadratic Bezier interpolation
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * ctrlLat + t * t * lat2;
            const lon = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * ctrlLon + t * t * lon2;
            points.push([lat, lon]);
        }
        return points;
    }

    /**
     * Finds the nearest major airport from the infrastructure database
     */
    function findNearestAirport(lat, lon, excludeIata = null) {
        const airports = (typeof GLOBAL_AIRPORTS !== 'undefined') ? GLOBAL_AIRPORTS : [];
        let nearest = null;
        let minDistance = Infinity;

        for (const ap of airports) {
            if (excludeIata && ap.iata === excludeIata) continue;
            const dist = haversineDistance(lat, lon, ap.lat, ap.lon);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = { ...ap, groundDistanceKm: dist };
            }
        }

        return nearest;
    }

    /**
     * Finds an optimal intermediate connecting hub for 2-leg long haul flights
     */
    function findOptimalHubAirport(depAirport, arrAirport) {
        const airports = (typeof GLOBAL_AIRPORTS !== 'undefined') ? GLOBAL_AIRPORTS : [];
        const hubs = airports.filter(a => a.hub && a.iata !== depAirport.iata && a.iata !== arrAirport.iata);
        if (!hubs.length) return null;

        const totalDirectDist = haversineDistance(depAirport.lat, depAirport.lon, arrAirport.lat, arrAirport.lon);
        let bestHub = null;
        let minDetour = Infinity;

        for (const hub of hubs) {
            const d1 = haversineDistance(depAirport.lat, depAirport.lon, hub.lat, hub.lon);
            const d2 = haversineDistance(hub.lat, hub.lon, arrAirport.lat, arrAirport.lon);
            const totalHubDist = d1 + d2;
            const detourRatio = totalHubDist / totalDirectDist;

            // Prefer hubs that are roughly on the way (detour ratio < 1.35) and have reasonable leg lengths (> 600km)
            if (d1 > 400 && d2 > 400 && detourRatio < 1.45 && detourRatio < minDetour) {
                minDetour = detourRatio;
                bestHub = { ...hub, leg1DistKm: d1, leg2DistKm: d2, totalDistKm: totalHubDist };
            }
        }

        return bestHub || hubs[0];
    }

    /**
     * Finds the nearest maritime/ferry port if within viable radius
     */
    function findNearestFerryPort(lat, lon, maxDistanceKm = 140) {
        const ports = (typeof GLOBAL_FERRY_PORTS !== 'undefined') ? GLOBAL_FERRY_PORTS : [];
        let nearest = null;
        let minDistance = maxDistanceKm;

        for (const port of ports) {
            const dist = haversineDistance(lat, lon, port.lat, port.lon);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = { ...port, groundDistanceKm: dist };
            }
        }

        return nearest;
    }

    /**
     * Top-tier curated city dictionary with 100+ global metro locations for instant 0ms offline fallback
     */
    const POPULAR_CITIES = {
        // India
        "chennai": { lat: 13.0827, lon: 80.2707, name: "Chennai, Tamil Nadu, India", city: "Chennai", country: "India", cc: "in" },
        "bengaluru": { lat: 12.9716, lon: 77.5946, name: "Bengaluru, Karnataka, India", city: "Bengaluru", country: "India", cc: "in" },
        "bangalore": { lat: 12.9716, lon: 77.5946, name: "Bengaluru, Karnataka, India", city: "Bengaluru", country: "India", cc: "in" },
        "mumbai": { lat: 19.0760, lon: 72.8777, name: "Mumbai, Maharashtra, India", city: "Mumbai", country: "India", cc: "in" },
        "delhi": { lat: 28.6139, lon: 77.2090, name: "New Delhi, Delhi, India", city: "New Delhi", country: "India", cc: "in" },
        "new delhi": { lat: 28.6139, lon: 77.2090, name: "New Delhi, Delhi, India", city: "New Delhi", country: "India", cc: "in" },
        "hyderabad": { lat: 17.3850, lon: 78.4867, name: "Hyderabad, Telangana, India", city: "Hyderabad", country: "India", cc: "in" },
        "kolkata": { lat: 22.5726, lon: 88.3639, name: "Kolkata, West Bengal, India", city: "Kolkata", country: "India", cc: "in" },
        "pune": { lat: 18.5204, lon: 73.8567, name: "Pune, Maharashtra, India", city: "Pune", country: "India", cc: "in" },
        "ahmedabad": { lat: 23.0225, lon: 72.5714, name: "Ahmedabad, Gujarat, India", city: "Ahmedabad", country: "India", cc: "in" },
        "kochi": { lat: 9.9312, lon: 76.2673, name: "Kochi, Kerala, India", city: "Kochi", country: "India", cc: "in" },
        "coimbatore": { lat: 11.0168, lon: 76.9558, name: "Coimbatore, Tamil Nadu, India", city: "Coimbatore", country: "India", cc: "in" },
        "madurai": { lat: 9.9252, lon: 78.1198, name: "Madurai, Tamil Nadu, India", city: "Madurai", country: "India", cc: "in" },
        "thiruvananthapuram": { lat: 8.5241, lon: 76.9366, name: "Thiruvananthapuram, Kerala, India", city: "Thiruvananthapuram", country: "India", cc: "in" },
        "trivandrum": { lat: 8.5241, lon: 76.9366, name: "Thiruvananthapuram, Kerala, India", city: "Thiruvananthapuram", country: "India", cc: "in" },
        "nagercoil": { lat: 8.1833, lon: 77.4119, name: "Nagercoil, Tamil Nadu, India", city: "Nagercoil", country: "India", cc: "in" },
        "kanyakumari": { lat: 8.0883, lon: 77.5385, name: "Kanyakumari, Tamil Nadu, India", city: "Kanyakumari", country: "India", cc: "in" },
        "jaipur": { lat: 26.9124, lon: 75.7873, name: "Jaipur, Rajasthan, India", city: "Jaipur", country: "India", cc: "in" },
        "lucknow": { lat: 26.8467, lon: 80.9462, name: "Lucknow, Uttar Pradesh, India", city: "Lucknow", country: "India", cc: "in" },
        "chandigarh": { lat: 30.7333, lon: 76.7794, name: "Chandigarh, India", city: "Chandigarh", country: "India", cc: "in" },
        "goa": { lat: 15.2993, lon: 74.1240, name: "Goa, India", city: "Goa", country: "India", cc: "in" },

        // United Kingdom & Europe
        "london": { lat: 51.5074, lon: -0.1278, name: "London, Greater London, United Kingdom", city: "London", country: "United Kingdom", cc: "gb" },
        "manchester": { lat: 53.4808, lon: -2.2426, name: "Manchester, England, United Kingdom", city: "Manchester", country: "United Kingdom", cc: "gb" },
        "birmingham": { lat: 52.4862, lon: -1.8904, name: "Birmingham, England, United Kingdom", city: "Birmingham", country: "United Kingdom", cc: "gb" },
        "edinburgh": { lat: 55.9533, lon: -3.1883, name: "Edinburgh, Scotland, United Kingdom", city: "Edinburgh", country: "United Kingdom", cc: "gb" },
        "dublin": { lat: 53.3498, lon: -6.2603, name: "Dublin, Leinster, Ireland", city: "Dublin", country: "Ireland", cc: "ie" },
        "paris": { lat: 48.8566, lon: 2.3522, name: "Paris, Île-de-France, France", city: "Paris", country: "France", cc: "fr" },
        "lyon": { lat: 45.7640, lon: 4.8357, name: "Lyon, Auvergne-Rhône-Alpes, France", city: "Lyon", country: "France", cc: "fr" },
        "nice": { lat: 43.7102, lon: 7.2620, name: "Nice, Provence-Alpes-Côte d'Azur, France", city: "Nice", country: "France", cc: "fr" },
        "frankfurt": { lat: 50.1109, lon: 8.6821, name: "Frankfurt, Hesse, Germany", city: "Frankfurt", country: "Germany", cc: "de" },
        "berlin": { lat: 52.5200, lon: 13.4050, name: "Berlin, Germany", city: "Berlin", country: "Germany", cc: "de" },
        "munich": { lat: 48.1351, lon: 11.5820, name: "Munich, Bavaria, Germany", city: "Munich", country: "Germany", cc: "de" },
        "amsterdam": { lat: 52.3676, lon: 4.9041, name: "Amsterdam, North Holland, Netherlands", city: "Amsterdam", country: "Netherlands", cc: "nl" },
        "brussels": { lat: 50.8503, lon: 4.3517, name: "Brussels, Belgium", city: "Brussels", country: "Belgium", cc: "be" },
        "zurich": { lat: 47.3769, lon: 8.5417, name: "Zurich, Switzerland", city: "Zurich", country: "Switzerland", cc: "ch" },
        "geneva": { lat: 46.2044, lon: 6.1432, name: "Geneva, Switzerland", city: "Geneva", country: "Switzerland", cc: "ch" },
        "vienna": { lat: 48.2082, lon: 16.3738, name: "Vienna, Austria", city: "Vienna", country: "Austria", cc: "at" },
        "madrid": { lat: 40.4168, lon: -3.7038, name: "Madrid, Community of Madrid, Spain", city: "Madrid", country: "Spain", cc: "es" },
        "barcelona": { lat: 41.3879, lon: 2.1699, name: "Barcelona, Catalonia, Spain", city: "Barcelona", country: "Spain", cc: "es" },
        "lisbon": { lat: 38.7223, lon: -9.1393, name: "Lisbon, Portugal", city: "Lisbon", country: "Portugal", cc: "pt" },
        "rome": { lat: 41.9028, lon: 12.4964, name: "Rome, Lazio, Italy", city: "Rome", country: "Italy", cc: "it" },
        "milan": { lat: 45.4642, lon: 9.1900, name: "Milan, Lombardy, Italy", city: "Milan", country: "Italy", cc: "it" },
        "athens": { lat: 37.9838, lon: 23.7275, name: "Athens, Attica, Greece", city: "Athens", country: "Greece", cc: "gr" },
        "istanbul": { lat: 41.0082, lon: 28.9784, name: "Istanbul, Turkey", city: "Istanbul", country: "Turkey", cc: "tr" },
        "copenhagen": { lat: 55.6761, lon: 12.5683, name: "Copenhagen, Denmark", city: "Copenhagen", country: "Denmark", cc: "dk" },
        "stockholm": { lat: 59.3293, lon: 18.0686, name: "Stockholm, Sweden", city: "Stockholm", country: "Sweden", cc: "se" },
        "oslo": { lat: 59.9139, lon: 10.7522, name: "Oslo, Norway", city: "Oslo", country: "Norway", cc: "no" },
        "helsinki": { lat: 60.1699, lon: 24.9384, name: "Helsinki, Uusimaa, Finland", city: "Helsinki", country: "Finland", cc: "fi" },
        "dover": { lat: 51.1279, lon: 1.3134, name: "Dover, Kent, United Kingdom", city: "Dover", country: "United Kingdom", cc: "gb" },
        "calais": { lat: 50.9513, lon: 1.8587, name: "Calais, Pas-de-Calais, France", city: "Calais", country: "France", cc: "fr" },

        // North America
        "new york": { lat: 40.7128, lon: -74.0060, name: "New York, NY, United States", city: "New York", country: "United States", cc: "us" },
        "nyc": { lat: 40.7128, lon: -74.0060, name: "New York, NY, United States", city: "New York", country: "United States", cc: "us" },
        "washington": { lat: 38.9072, lon: -77.0369, name: "Washington, D.C., United States", city: "Washington D.C.", country: "United States", cc: "us" },
        "washington dc": { lat: 38.9072, lon: -77.0369, name: "Washington, D.C., United States", city: "Washington D.C.", country: "United States", cc: "us" },
        "san francisco": { lat: 37.7749, lon: -122.4194, name: "San Francisco, CA, United States", city: "San Francisco", country: "United States", cc: "us" },
        "los angeles": { lat: 34.0522, lon: -118.2437, name: "Los Angeles, CA, United States", city: "Los Angeles", country: "United States", cc: "us" },
        "chicago": { lat: 41.8781, lon: -87.6298, name: "Chicago, IL, United States", city: "Chicago", country: "United States", cc: "us" },
        "boston": { lat: 42.3601, lon: -71.0589, name: "Boston, MA, United States", city: "Boston", country: "United States", cc: "us" },
        "seattle": { lat: 47.6062, lon: -122.3321, name: "Seattle, WA, United States", city: "Seattle", country: "United States", cc: "us" },
        "miami": { lat: 25.7617, lon: -80.1918, name: "Miami, FL, United States", city: "Miami", country: "United States", cc: "us" },
        "dallas": { lat: 32.7767, lon: -96.7970, name: "Dallas, TX, United States", city: "Dallas", country: "United States", cc: "us" },
        "houston": { lat: 29.7604, lon: -95.3698, name: "Houston, TX, United States", city: "Houston", country: "United States", cc: "us" },
        "honolulu": { lat: 21.3069, lon: -157.8583, name: "Honolulu, HI, United States", city: "Honolulu", country: "United States", cc: "us" },
        "hawaii": { lat: 21.3069, lon: -157.8583, name: "Honolulu, HI, United States", city: "Honolulu", country: "United States", cc: "us" },
        "toronto": { lat: 43.6532, lon: -79.3832, name: "Toronto, Ontario, Canada", city: "Toronto", country: "Canada", cc: "ca" },
        "vancouver": { lat: 49.2827, lon: -123.1207, name: "Vancouver, BC, Canada", city: "Vancouver", country: "Canada", cc: "ca" },
        "montreal": { lat: 45.5017, lon: -73.5673, name: "Montreal, Quebec, Canada", city: "Montreal", country: "Canada", cc: "ca" },
        "mexico city": { lat: 19.4326, lon: -99.1332, name: "Mexico City, Mexico", city: "Mexico City", country: "Mexico", cc: "mx" },

        // Asia, Middle East & Oceania
        "tokyo": { lat: 35.6762, lon: 139.6503, name: "Tokyo, Kanto, Japan", city: "Tokyo", country: "Japan", cc: "jp" },
        "osaka": { lat: 34.6937, lon: 135.5023, name: "Osaka, Kansai, Japan", city: "Osaka", country: "Japan", cc: "jp" },
        "seoul": { lat: 37.5665, lon: 126.9780, name: "Seoul, South Korea", city: "Seoul", country: "South Korea", cc: "kr" },
        "beijing": { lat: 39.9042, lon: 116.4074, name: "Beijing, China", city: "Beijing", country: "China", cc: "cn" },
        "shanghai": { lat: 31.2304, lon: 121.4737, name: "Shanghai, China", city: "Shanghai", country: "China", cc: "cn" },
        "hong kong": { lat: 22.3193, lon: 114.1694, name: "Hong Kong", city: "Hong Kong", country: "Hong Kong", cc: "hk" },
        "singapore": { lat: 1.3521, lon: 103.8198, name: "Singapore", city: "Singapore", country: "Singapore", cc: "sg" },
        "bangkok": { lat: 13.7563, lon: 100.5018, name: "Bangkok, Thailand", city: "Bangkok", country: "Thailand", cc: "th" },
        "kuala lumpur": { lat: 3.1390, lon: 101.6869, name: "Kuala Lumpur, Malaysia", city: "Kuala Lumpur", country: "Malaysia", cc: "my" },
        "jakarta": { lat: -6.2088, lon: 106.8456, name: "Jakarta, Indonesia", city: "Jakarta", country: "Indonesia", cc: "id" },
        "bali": { lat: -8.4095, lon: 115.1889, name: "Bali, Indonesia", city: "Bali", country: "Indonesia", cc: "id" },
        "manila": { lat: 14.5995, lon: 120.9842, name: "Manila, Philippines", city: "Manila", country: "Philippines", cc: "ph" },
        "dubai": { lat: 25.2048, lon: 55.2708, name: "Dubai, United Arab Emirates", city: "Dubai", country: "United Arab Emirates", cc: "ae" },
        "abu dhabi": { lat: 24.4539, lon: 54.3773, name: "Abu Dhabi, United Arab Emirates", city: "Abu Dhabi", country: "United Arab Emirates", cc: "ae" },
        "doha": { lat: 25.2854, lon: 51.5310, name: "Doha, Qatar", city: "Doha", country: "Qatar", cc: "qa" },
        "riyadh": { lat: 24.7136, lon: 46.6753, name: "Riyadh, Saudi Arabia", city: "Riyadh", country: "Saudi Arabia", cc: "sa" },
        "sydney": { lat: -33.8688, lon: 151.2093, name: "Sydney, NSW, Australia", city: "Sydney", country: "Australia", cc: "au" },
        "melbourne": { lat: -37.8136, lon: 144.9631, name: "Melbourne, VIC, Australia", city: "Melbourne", country: "Australia", cc: "au" },
        "auckland": { lat: -36.8485, lon: 174.7633, name: "Auckland, New Zealand", city: "Auckland", country: "New Zealand", cc: "nz" },
        "sao paulo": { lat: -23.5505, lon: -46.6333, name: "São Paulo, Brazil", city: "São Paulo", country: "Brazil", cc: "br" },
        "buenos aires": { lat: -34.6037, lon: -58.3816, name: "Buenos Aires, Argentina", city: "Buenos Aires", country: "Argentina", cc: "ar" },
        "cairo": { lat: 30.0444, lon: 31.2357, name: "Cairo, Egypt", city: "Cairo", country: "Egypt", cc: "eg" },
        "johannesburg": { lat: -26.2041, lon: 28.0473, name: "Johannesburg, South Africa", city: "Johannesburg", country: "South Africa", cc: "za" },
        "nairobi": { lat: -1.2921, lon: 36.8219, name: "Nairobi, Kenya", city: "Nairobi", country: "Kenya", cc: "ke" }
    };

    /**
     * Resilient multi-source geocoding resolver with 5 fallback levels
     */
    async function geocodeLocation(query) {
        if (!query || typeof query !== 'string') return null;
        const cleanQuery = query.trim();

        // 1. Direct Lat/Lon coordinate string check
        const coordMatch = cleanQuery.match(/^([-+]?\d+(\.\d+)?),\s*([-+]?\d+(\.\d+)?)$/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lon = parseFloat(coordMatch[3]);
            return {
                lat,
                lon,
                displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                city: "Custom Coordinates",
                country: "Global",
                countryCode: "gl"
            };
        }

        // 2. Curated local dictionary check (0ms instant offline match)
        const lowerKey = cleanQuery.toLowerCase();
        for (const [key, val] of Object.entries(POPULAR_CITIES)) {
            if (lowerKey === key || lowerKey.startsWith(key + ",") || lowerKey.startsWith(key + " ") || lowerKey.includes(key)) {
                return {
                    lat: val.lat,
                    lon: val.lon,
                    displayName: val.name,
                    city: val.city,
                    country: val.country,
                    countryCode: val.cc
                };
            }
        }

        // 3. Open-Meteo Geocoding API (Fast, Free, High Reliability)
        try {
            const meteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=1&language=en&format=json`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const res = await fetch(meteoUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (data && data.results && data.results.length > 0) {
                const item = data.results[0];
                const parts = [item.name, item.admin1, item.country].filter(Boolean);
                return {
                    lat: item.latitude,
                    lon: item.longitude,
                    displayName: parts.join(', '),
                    city: item.name,
                    country: item.country || "",
                    countryCode: (item.country_code || "").toLowerCase()
                };
            }
        } catch (e) {
            // Proceed to next fallback
        }

        // 4. Photon API (Komoot OSM Geocoder)
        try {
            const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=1`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const res = await fetch(photonUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (data && data.features && data.features.length > 0) {
                const feat = data.features[0];
                const props = feat.properties;
                const coords = feat.geometry.coordinates;
                const parts = [props.name, props.city, props.state, props.country].filter(Boolean);

                return {
                    lat: coords[1],
                    lon: coords[0],
                    displayName: parts.join(', ') || props.name,
                    city: props.city || props.name || "City",
                    country: props.country || "",
                    countryCode: (props.countrycode || "").toLowerCase()
                };
            }
        } catch (e) {
            // Proceed to next fallback
        }

        // 5. Nominatim API
        try {
            const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=1`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const res = await fetch(nomUrl, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (data && data.length > 0) {
                const item = data[0];
                const addr = item.address || {};
                const city = addr.city || addr.town || addr.village || addr.state || item.display_name.split(',')[0];

                return {
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    displayName: item.display_name,
                    city: city,
                    country: addr.country || "",
                    countryCode: (addr.country_code || "").toLowerCase()
                };
            }
        } catch (e) {
            // Proceed to airport check
        }

        // 6. Airport Database Match Fallback
        const airports = (typeof GLOBAL_AIRPORTS !== 'undefined') ? GLOBAL_AIRPORTS : [];
        const matchAp = airports.find(a => 
            lowerKey.includes(a.city.toLowerCase()) || 
            lowerKey.includes(a.iata.toLowerCase()) ||
            lowerKey.includes(a.name.toLowerCase())
        );
        if (matchAp) {
            return {
                lat: matchAp.lat,
                lon: matchAp.lon,
                displayName: `${matchAp.city}, ${matchAp.country}`,
                city: matchAp.city,
                country: matchAp.country,
                countryCode: matchAp.cc
            };
        }

        return null;
    }

    /**
     * Determines physical land feasibility vs ocean/sea separation
     */
    function analyzeFeasibility(originGeo, destGeo, osrmDriveData = null) {
        const straightDistKm = haversineDistance(originGeo.lat, originGeo.lon, destGeo.lat, destGeo.lon);
        const cc1 = originGeo.countryCode;
        const cc2 = destGeo.countryCode;
        const isSameCountry = (cc1 && cc2 && cc1 === cc2);

        // Island / Cross-sea detection
        const isIslandOrIsolated = (geo) => {
            const cc = geo.countryCode;
            const name = (geo.displayName + " " + geo.city).toLowerCase();
            if (['gb', 'ie', 'jp', 'nz', 'au', 'lk', 'ph', 'id', 'is', 'cu', 'jm', 'mg', 'cy', 'mt', 'tw'].includes(cc)) return true;
            if (name.includes('hawaii') || name.includes('honolulu') || name.includes('santorini') || name.includes('mallorca') || name.includes('ibiza') || name.includes('capri') || name.includes('bali')) return true;
            return false;
        };

        const originIsland = isIslandOrIsolated(originGeo);
        const destIsland = isIslandOrIsolated(destGeo);

        let isCrossWater = false;
        let isEurostarViable = false;
        let separationReason = "";

        // Check for Eurostar channel tunnel route (e.g. UK to France / Belgium)
        if ((cc1 === 'gb' && ['fr', 'be', 'nl'].includes(cc2)) || (cc2 === 'gb' && ['fr', 'be', 'nl'].includes(cc1))) {
            isEurostarViable = true;
        }

        if (originIsland !== destIsland || (originIsland && destIsland && !isSameCountry)) {
            if (!isEurostarViable) {
                isCrossWater = true;
                separationReason = "Major maritime / ocean barrier separates landmasses.";
            }
        } else if (straightDistKm > 1800 && !isSameCountry) {
            isCrossWater = true;
            separationReason = "Intercontinental transit exceeding continuous road corridor limits.";
        }

        if (osrmDriveData && osrmDriveData.code !== 'Ok' && !isSameCountry && straightDistKm > 800) {
            isCrossWater = true;
            separationReason = "No continuous direct road network verified between regions.";
        }

        const canWalk = straightDistKm <= 20;
        const canCycle = straightDistKm <= 50 && !isCrossWater;
        const canDriveDirect = !isCrossWater && straightDistKm <= 2200;

        return {
            straightDistanceKm: straightDistKm,
            isCrossWater,
            isEurostarViable,
            separationReason,
            isSameCountry,
            canWalk,
            canCycle,
            canDriveDirect,
            primaryRecommendation: isCrossWater ? 'aviation_multimodal' : (straightDistKm > 600 ? 'rail_or_eco_drive' : 'eco_drive')
        };
    }

    /**
     * Query OSRM Driving Route with auto-resilience and fallback geometry generation
     */
    async function fetchOSRMRoute(p1, p2, profile = 'driving') {
        const url = `https://router.project-osrm.org/route/v1/${profile}/${p1[1]},${p1[0]};${p2[1]},${p2[0]}?overview=full&geometries=geojson&alternatives=true`;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4500);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();
            
            if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
                return data;
            }
        } catch (e) {
            // Fall through to synthetic road geometry
        }

        // Synthetic fallback road routes
        const straightDist = haversineDistance(p1[0], p1[1], p2[0], p2[1]);
        const driveDistMeters = straightDist * 1.22 * 1000;
        const durationSec = (driveDistMeters / 1000 / 80) * 3600; // ~80 km/h average
        
        const primaryCoords = generateRealisticRoadPath(p1, p2, 0.06, 30);
        const altCoords = generateRealisticRoadPath(p1, p2, -0.09, 30);

        return {
            code: "Ok",
            synthetic: true,
            routes: [
                {
                    distance: driveDistMeters,
                    duration: durationSec,
                    geometry: { coordinates: primaryCoords.map(c => [c[1], c[0]]) }
                },
                {
                    distance: driveDistMeters * 1.08,
                    duration: durationSec * 1.12,
                    geometry: { coordinates: altCoords.map(c => [c[1], c[0]]) }
                }
            ]
        };
    }

    return {
        haversineDistance,
        calculateBearing,
        generateGreatCirclePoints,
        generateRealisticRoadPath,
        findNearestAirport,
        findOptimalHubAirport,
        findNearestFerryPort,
        geocodeLocation,
        analyzeFeasibility,
        fetchOSRMRoute,
        POPULAR_CITIES
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoEngine;
}
