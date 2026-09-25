/**
 * EcoNav AI - Multi-Modal Journey & Carbon Emission Synthesizer
 * Generates comprehensive multi-leg journeys (Ground + Air + Maritime + Rail + EV)
 * with physics-grounded emissions, real-world cost calculations, and ESG offset metrics.
 */

const _Geo = (typeof GeoEngine !== 'undefined') ? GeoEngine : (typeof require !== 'undefined' ? require('./geo-engine.js') : null);

const MultimodalPlanner = (() => {
    const GeoEngine = _Geo || (typeof window !== 'undefined' ? window.GeoEngine : null);

    // IPCC / ICAO / DEFRA emission factors (kg CO2 per passenger-km or vehicle-km)
    const EMISSION_FACTORS = {
        flight_short: 0.245,    // < 1000 km
        flight_medium: 0.185,   // 1000 - 3500 km
        flight_long: 0.150,     // > 3500 km
        flight_saf: 0.035,      // Sustainable Aviation Fuel (80% lifecycle reduction)
        ferry: 0.115,           // Maritime passenger ferry
        train_electric: 0.032,  // High-speed / Intercity electric rail
        train_diesel: 0.055,    // Regional diesel train
        bus_coach: 0.048,       // Intercity express bus
        car_petrol_base: 2.31,  // kg CO2 per litre of petrol
        car_diesel_base: 2.68,  // kg CO2 per litre of diesel
        bike_petrol_base: 2.31, // kg CO2 per litre
        ev_grid_avg: 0.038,     // Well-to-wheel grid average kg CO2/km (0 tailpipe)
        active_human: 0.000     // Bicycle / Walking
    };

    /**
     * Converts total minutes into clean human-readable text: "11h 45m" or "35m"
     */
    function formatDuration(minutes) {
        const totalMins = Math.max(1, Math.round(minutes));
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        if (h > 0) {
            return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
        }
        return `${m}m`;
    }

    /**
     * Calculates Eco-Score badge grade based on carbon intensity per km
     */
    function calculateEcoScore(carbonKg, distanceKm) {
        if (distanceKm <= 0 || carbonKg <= 0) return { grade: "A+", label: "Zero Emission", color: "#10b981", bg: "rgba(16, 185, 129, 0.2)" };
        const intensity = carbonKg / Math.max(distanceKm, 1);
        if (intensity <= 0.04) return { grade: "A", label: "Ultra Low Impact", color: "#34d399", bg: "rgba(52, 211, 153, 0.2)" };
        if (intensity <= 0.08) return { grade: "B", label: "Low Emission", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.2)" };
        if (intensity <= 0.14) return { grade: "C", label: "Moderate Impact", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.2)" };
        if (intensity <= 0.22) return { grade: "D", label: "High Emission", color: "#f97316", bg: "rgba(249, 115, 22, 0.2)" };
        return { grade: "F", label: "Severe Footprint", color: "#ef4444", bg: "rgba(239, 68, 68, 0.2)" };
    }

    /**
     * Compute flight metrics based on great circle distance
     */
    function computeFlightMetrics(distanceKm, isSaf = false) {
        const cruisingHours = distanceKm / 840;
        const flightTimeMinutes = (cruisingHours * 60) + 35;
        
        let factor = EMISSION_FACTORS.flight_long;
        if (distanceKm < 1000) factor = EMISSION_FACTORS.flight_short;
        else if (distanceKm < 3500) factor = EMISSION_FACTORS.flight_medium;

        if (isSaf) factor = EMISSION_FACTORS.flight_saf;

        const carbonKg = distanceKm * factor;
        const trees = carbonKg / 21.77; // 1 tree absorbs ~21.77 kg/year
        const costUSD = 65 + (distanceKm * 0.072);

        return {
            flightTimeMinutes,
            carbonKg,
            treesNeeded: Math.ceil(trees),
            costUSD
        };
    }

    /**
     * Synthesize Cross-Water / International Multi-Modal Journey Matrix
     */
    async function planCrossWaterJourney(originGeo, destGeo, config = {}) {
        const currencySymbol = config.currencySymbol || "₹";
        const currencyRate = config.currencyRate || 1.0;

        // 1. Discover departure and arrival airports
        const depAirport = GeoEngine.findNearestAirport(originGeo.lat, originGeo.lon);
        const arrAirport = GeoEngine.findNearestAirport(destGeo.lat, destGeo.lon, depAirport ? depAirport.iata : null);

        // Ground Leg 1 (Origin -> Departure Airport)
        let leg1Coords = [[originGeo.lat, originGeo.lon], [depAirport.lat, depAirport.lon]];
        let leg1DistKm = depAirport.groundDistanceKm;
        let leg1DurationMins = Math.max(15, (leg1DistKm / 40) * 60);
        
        try {
            const osrmLeg1 = await GeoEngine.fetchOSRMRoute([originGeo.lat, originGeo.lon], [depAirport.lat, depAirport.lon]);
            if (osrmLeg1.code === 'Ok' && osrmLeg1.routes && osrmLeg1.routes[0]) {
                leg1DistKm = osrmLeg1.routes[0].distance / 1000;
                leg1DurationMins = osrmLeg1.routes[0].duration / 60;
                leg1Coords = osrmLeg1.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            }
        } catch (e) {}

        // Direct Aviation Leg 2 (Departure Airport -> Arrival Airport)
        const flightDistKm = GeoEngine.haversineDistance(depAirport.lat, depAirport.lon, arrAirport.lat, arrAirport.lon);
        const flightGeodesicPoints = GeoEngine.generateGreatCirclePoints(
            [depAirport.lat, depAirport.lon],
            [arrAirport.lat, arrAirport.lon],
            70
        );
        const standardFlightMetrics = computeFlightMetrics(flightDistKm, false);
        const safFlightMetrics = computeFlightMetrics(flightDistKm, true);

        // Ground Leg 3 (Arrival Airport -> Destination)
        let leg3Coords = [[arrAirport.lat, arrAirport.lon], [destGeo.lat, destGeo.lon]];
        let leg3DistKm = arrAirport.groundDistanceKm;
        let leg3DurationMins = Math.max(15, (leg3DistKm / 45) * 60);

        try {
            const osrmLeg3 = await GeoEngine.fetchOSRMRoute([arrAirport.lat, arrAirport.lon], [destGeo.lat, destGeo.lon]);
            if (osrmLeg3.code === 'Ok' && osrmLeg3.routes && osrmLeg3.routes[0]) {
                leg3DistKm = osrmLeg3.routes[0].distance / 1000;
                leg3DurationMins = osrmLeg3.routes[0].duration / 60;
                leg3Coords = osrmLeg3.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            }
        } catch (e) {}

        const airportCheckinBufferMins = 105;
        const airportArrivalBufferMins = 45;

        const routes = [];

        // --- Route 1: Direct Multi-Modal Aviation (Recommended) ---
        const totalDist1 = leg1DistKm + flightDistKm + leg3DistKm;
        const totalDurationMins1 = leg1DurationMins + airportCheckinBufferMins + standardFlightMetrics.flightTimeMinutes + airportArrivalBufferMins + leg3DurationMins;
        const groundCarbon1 = (leg1DistKm * 0.12) + (leg3DistKm * 0.05);
        const totalCarbon1 = standardFlightMetrics.carbonKg + groundCarbon1;
        const totalCost1 = (standardFlightMetrics.costUSD * 86.5 * currencyRate) + (leg1DistKm * 15 * currencyRate) + (leg3DistKm * 20 * currencyRate);

        routes.push({
            id: "flight_direct",
            type: "cross_water",
            name: "✈️ Direct Aviation Express (Fastest)",
            category: "flight",
            badge: "Direct Flight ⚡",
            color: "#38bdf8",
            totalDistanceKm: totalDist1,
            totalDurationMins: totalDurationMins1,
            totalCarbonKg: totalCarbon1,
            totalCost: totalCost1,
            ecoScore: calculateEcoScore(totalCarbon1, totalDist1),
            treesNeeded: Math.ceil(totalCarbon1 / 21.77),
            summary: `Fastest non-stop corridor via ${depAirport.iata} ➔ ${arrAirport.iata} with integrated city transit connections.`,
            layers: [
                { type: "ground_leg1", coords: leg1Coords, color: "#10b981", weight: 5, dashArray: null, title: `Ground Transit: ${originGeo.city} to ${depAirport.iata}` },
                { type: "flight_geodesic", coords: flightGeodesicPoints, color: "#38bdf8", weight: 5, dashArray: "6, 8", title: `Non-Stop Flight: ${depAirport.iata} ➔ ${arrAirport.iata}` },
                { type: "ground_leg3", coords: leg3Coords, color: "#a855f7", weight: 5, dashArray: null, title: `Ground Transit: ${arrAirport.iata} to ${destGeo.city}` }
            ],
            markers: [
                { type: "origin", lat: originGeo.lat, lon: originGeo.lon, title: `Origin: ${originGeo.displayName}`, icon: "origin" },
                { type: "dep_airport", lat: depAirport.lat, lon: depAirport.lon, title: `🛫 Departure: ${depAirport.name} (${depAirport.iata})`, icon: "airport_dep", iata: depAirport.iata },
                { type: "arr_airport", lat: arrAirport.lat, lon: arrAirport.lon, title: `🛬 Arrival: ${arrAirport.name} (${arrAirport.iata})`, icon: "airport_arr", iata: arrAirport.iata },
                { type: "destination", lat: destGeo.lat, lon: destGeo.lon, title: `🏁 Destination: ${destGeo.displayName}`, icon: "destination" }
            ],
            timeline: [
                { step: 1, mode: "ground_origin", icon: "🚖", title: `Ground Transit to ${depAirport.iata}`, desc: `Express transfer from ${originGeo.city} to ${depAirport.name}.`, duration: formatDuration(leg1DurationMins), distance: `${leg1DistKm.toFixed(1)} km`, carbon: `${(leg1DistKm * 0.12).toFixed(1)} kg CO₂` },
                { step: 2, mode: "airport_dep", icon: "🛫", title: `Airport Check-in & Security (${depAirport.iata})`, desc: `Baggage drop, security clearance, and priority boarding.`, duration: formatDuration(airportCheckinBufferMins), distance: `Terminal`, carbon: `0.0 kg CO₂` },
                { step: 3, mode: "flight", icon: "✈️", title: `Aviation Corridor: ${depAirport.iata} ➔ ${arrAirport.iata}`, desc: `High-altitude Great Circle flight cruising at 36,000 ft.`, duration: formatDuration(standardFlightMetrics.flightTimeMinutes), distance: `${Math.round(flightDistKm)} km`, carbon: `${standardFlightMetrics.carbonKg.toFixed(1)} kg CO₂` },
                { step: 4, mode: "airport_arr", icon: "🛬", title: `Terminal Arrival & Customs (${arrAirport.iata})`, desc: `Passport control, baggage recovery, and metro connection.`, duration: formatDuration(airportArrivalBufferMins), distance: `Terminal`, carbon: `0.0 kg CO₂` },
                { step: 5, mode: "ground_dest", icon: "🚆", title: `Express Rail to ${destGeo.city}`, desc: `High-speed airport rail to final destination.`, duration: formatDuration(leg3DurationMins), distance: `${leg3DistKm.toFixed(1)} km`, carbon: `${(leg3DistKm * 0.05).toFixed(1)} kg CO₂` }
            ]
        });

        // --- Route 2: AI Eco-Flight (SAF 80% Carbon Reduction + EV Shuttles) ---
        const totalCarbon2 = safFlightMetrics.carbonKg + (leg1DistKm * 0.02) + (leg3DistKm * 0.02);
        const totalCost2 = totalCost1 * 1.08;

        routes.push({
            id: "flight_saf_eco",
            type: "cross_water",
            name: "🌿 AI Eco-Flight (SAF 80% Offset)",
            category: "eco_flight",
            badge: "80% Cleaner ✨",
            color: "#10b981",
            totalDistanceKm: totalDist1,
            totalDurationMins: totalDurationMins1,
            totalCarbonKg: totalCarbon2,
            totalCost: totalCost2,
            ecoScore: calculateEcoScore(totalCarbon2, totalDist1),
            treesNeeded: Math.ceil(totalCarbon2 / 21.77),
            summary: `Sustainable aviation powered by Sustainable Aviation Fuel (SAF) and EV ground fleets, slashing emissions by ${(totalCarbon1 - totalCarbon2).toFixed(1)} kg CO₂!`,
            layers: [
                { type: "ground_leg1", coords: leg1Coords, color: "#10b981", weight: 5, dashArray: null, title: `EV Fleet: ${originGeo.city} to ${depAirport.iata}` },
                { type: "flight_geodesic", coords: flightGeodesicPoints, color: "#10b981", weight: 5, dashArray: "4, 6", title: `SAF Biofuel Flight: ${depAirport.iata} ➔ ${arrAirport.iata}` },
                { type: "ground_leg3", coords: leg3Coords, color: "#10b981", weight: 5, dashArray: null, title: `Electric Rail: ${arrAirport.iata} to ${destGeo.city}` }
            ],
            markers: routes[0].markers,
            timeline: [
                { step: 1, mode: "ground_origin", icon: "⚡", title: `Electric Shuttle to ${depAirport.iata}`, desc: `Zero-tailpipe EV transfer (${leg1DistKm.toFixed(1)} km).`, duration: formatDuration(leg1DurationMins), distance: `${leg1DistKm.toFixed(1)} km`, carbon: `${(leg1DistKm * 0.02).toFixed(1)} kg CO₂` },
                { step: 2, mode: "airport_dep", icon: "🛫", title: `Priority Green Check-in (${depAirport.iata})`, desc: `Digital pass & paperless boarding.`, duration: formatDuration(airportCheckinBufferMins), distance: `Terminal`, carbon: `0.0 kg CO₂` },
                { step: 3, mode: "flight", icon: "🌱", title: `SAF Biofuel Flight: ${depAirport.iata} ➔ ${arrAirport.iata}`, desc: `Sustainable aviation fuel reducing net atmospheric carbon by 80%.`, duration: formatDuration(safFlightMetrics.flightTimeMinutes), distance: `${Math.round(flightDistKm)} km`, carbon: `${safFlightMetrics.carbonKg.toFixed(1)} kg CO₂` },
                { step: 4, mode: "airport_arr", icon: "🛬", title: `Green Terminal Arrival (${arrAirport.iata})`, desc: `Automated e-Gates to rail terminal.`, duration: formatDuration(airportArrivalBufferMins), distance: `Terminal`, carbon: `0.0 kg CO₂` },
                { step: 5, mode: "ground_dest", icon: "🚆", title: `Renewable Electric Rail to ${destGeo.city}`, desc: `Direct 100% wind/solar-powered rail transit.`, duration: formatDuration(leg3DurationMins), distance: `${leg3DistKm.toFixed(1)} km`, carbon: `${(leg3DistKm * 0.02).toFixed(1)} kg CO₂` }
            ]
        });

        // --- Route 3: Global Connecting Hub Corridor (Multi-Hop Aviation) ---
        const transitHub = GeoEngine.findOptimalHubAirport(depAirport, arrAirport);
        if (transitHub && flightDistKm > 1600) {
            const legA_Dist = transitHub.leg1DistKm;
            const legB_Dist = transitHub.leg2DistKm;
            const flightArcA = GeoEngine.generateGreatCirclePoints([depAirport.lat, depAirport.lon], [transitHub.lat, transitHub.lon], 45);
            const flightArcB = GeoEngine.generateGreatCirclePoints([transitHub.lat, transitHub.lon], [arrAirport.lat, arrAirport.lon], 45);

            const metricsA = computeFlightMetrics(legA_Dist, false);
            const metricsB = computeFlightMetrics(legB_Dist, false);
            const layoverMins = 120; // 2 hour layover

            const totalDist3 = leg1DistKm + legA_Dist + legB_Dist + leg3DistKm;
            const totalDurationMins3 = leg1DurationMins + airportCheckinBufferMins + metricsA.flightTimeMinutes + layoverMins + metricsB.flightTimeMinutes + airportArrivalBufferMins + leg3DurationMins;
            const totalCarbon3 = metricsA.carbonKg + metricsB.carbonKg + groundCarbon1 + 18; // slightly higher takeoff/climb emissions
            const totalCost3 = totalCost1 * 0.88; // connecting flights often 12% cheaper

            routes.push({
                id: "flight_connecting_hub",
                type: "cross_water",
                name: `🌐 Hub Transfer (via ${transitHub.iata} - Budget)`,
                category: "flight_hub",
                badge: "Economy Hub 🏷️",
                color: "#f59e0b",
                totalDistanceKm: totalDist3,
                totalDurationMins: totalDurationMins3,
                totalCarbonKg: totalCarbon3,
                totalCost: totalCost3,
                ecoScore: calculateEcoScore(totalCarbon3, totalDist3),
                treesNeeded: Math.ceil(totalCarbon3 / 21.77),
                summary: `Budget multi-hop flight route connecting via major global hub at ${transitHub.name} (${transitHub.city}).`,
                layers: [
                    { type: "ground_leg1", coords: leg1Coords, color: "#10b981", weight: 4, dashArray: null, title: `Ground Transit to ${depAirport.iata}` },
                    { type: "flight_geodesic_1", coords: flightArcA, color: "#f59e0b", weight: 4, dashArray: "5, 7", title: `Flight Leg 1: ${depAirport.iata} ➔ ${transitHub.iata}` },
                    { type: "flight_geodesic_2", coords: flightArcB, color: "#f59e0b", weight: 4, dashArray: "5, 7", title: `Flight Leg 2: ${transitHub.iata} ➔ ${arrAirport.iata}` },
                    { type: "ground_leg3", coords: leg3Coords, color: "#a855f7", weight: 4, dashArray: null, title: `Ground Transit to ${destGeo.city}` }
                ],
                markers: [
                    { type: "origin", lat: originGeo.lat, lon: originGeo.lon, title: `Origin: ${originGeo.displayName}`, icon: "origin" },
                    { type: "dep_airport", lat: depAirport.lat, lon: depAirport.lon, title: `🛫 Departure: ${depAirport.iata}`, icon: "airport_dep", iata: depAirport.iata },
                    { type: "transit_hub", lat: transitHub.lat, lon: transitHub.lon, title: `🔄 Layover Hub: ${transitHub.name} (${transitHub.iata})`, icon: "airport_dep", iata: transitHub.iata },
                    { type: "arr_airport", lat: arrAirport.lat, lon: arrAirport.lon, title: `🛬 Arrival: ${arrAirport.iata}`, icon: "airport_arr", iata: arrAirport.iata },
                    { type: "destination", lat: destGeo.lat, lon: destGeo.lon, title: `🏁 Destination: ${destGeo.displayName}`, icon: "destination" }
                ],
                timeline: [
                    { step: 1, mode: "ground_origin", icon: "🚖", title: `Transit to ${depAirport.iata}`, desc: `Local transfer from ${originGeo.city}.`, duration: formatDuration(leg1DurationMins), distance: `${leg1DistKm.toFixed(1)} km`, carbon: `${(leg1DistKm * 0.12).toFixed(1)} kg CO₂` },
                    { step: 2, mode: "flight", icon: "✈️", title: `Flight Leg 1: ${depAirport.iata} ➔ ${transitHub.iata}`, desc: `Airway corridor to transit hub in ${transitHub.city}.`, duration: formatDuration(metricsA.flightTimeMinutes), distance: `${Math.round(legA_Dist)} km`, carbon: `${metricsA.carbonKg.toFixed(1)} kg CO₂` },
                    { step: 3, mode: "layover", icon: "🔄", title: `Transit Layover at ${transitHub.iata}`, desc: `Terminal transfer & connection gate boarding (${transitHub.name}).`, duration: formatDuration(layoverMins), distance: `Hub Area`, carbon: `0.0 kg CO₂` },
                    { step: 4, mode: "flight", icon: "✈️", title: `Flight Leg 2: ${transitHub.iata} ➔ ${arrAirport.iata}`, desc: `Connecting flight to destination hub.`, duration: formatDuration(metricsB.flightTimeMinutes), distance: `${Math.round(legB_Dist)} km`, carbon: `${metricsB.carbonKg.toFixed(1)} kg CO₂` },
                    { step: 5, mode: "ground_dest", icon: "🚆", title: `Final Rail Transit to ${destGeo.city}`, desc: `Express rail to ${destGeo.city}.`, duration: formatDuration(leg3DurationMins), distance: `${leg3DistKm.toFixed(1)} km`, carbon: `${(leg3DistKm * 0.05).toFixed(1)} kg CO₂` }
                ]
            });
        }

        // --- Route 4: High-Speed Undersea Tunnel / Ferry Corridor (Where Applicable, e.g. London <-> Paris) ---
        const isChannelCross = (originGeo.countryCode === 'gb' && destGeo.countryCode === 'fr') || (originGeo.countryCode === 'fr' && destGeo.countryCode === 'gb');
        if (isChannelCross || flightDistKm < 600) {
            const railDist = flightDistKm * 1.25;
            const railDuration = Math.max(135, (railDist / 220) * 60 + 45); // ~2h 15m Eurostar
            const railCarbon = railDist * EMISSION_FACTORS.train_electric;
            const railCost = (85 * 86.5 * currencyRate);

            const eurostarCoords = [
                [originGeo.lat, originGeo.lon],
                [51.5314, -0.1261], // St Pancras
                [51.1279, 1.3134],  // Dover / Folkestone
                [50.9513, 1.8587],  // Calais
                [48.8809, 2.3553],  // Gare du Nord
                [destGeo.lat, destGeo.lon]
            ];

            routes.push({
                id: "cross_channel_eurostar",
                type: "cross_water",
                name: "🚆 Eurostar Undersea High-Speed Rail",
                category: "rail_tunnel",
                badge: "94% Less Carbon 🌟",
                color: "#a855f7",
                totalDistanceKm: railDist,
                totalDurationMins: railDuration,
                totalCarbonKg: railCarbon,
                totalCost: railCost,
                ecoScore: calculateEcoScore(railCarbon, railDist),
                treesNeeded: Math.ceil(railCarbon / 21.77),
                summary: `Downtown-to-downtown high-speed electric rail through the Channel Tunnel, saving over ${(totalCarbon1 - railCarbon).toFixed(1)} kg of CO₂!`,
                layers: [
                    { type: "eurostar_rail", coords: eurostarCoords, color: "#a855f7", weight: 5, dashArray: "4, 4", title: "Eurostar High-Speed Tunnel Corridor" }
                ],
                markers: [
                    { type: "origin", lat: originGeo.lat, lon: originGeo.lon, title: `Start: ${originGeo.displayName}`, icon: "origin" },
                    { type: "station", lat: 51.5314, lon: -0.1261, title: `🚆 London St Pancras`, icon: "station" },
                    { type: "station", lat: 48.8809, lon: 2.3553, title: `🚆 Paris Gare du Nord`, icon: "station" },
                    { type: "destination", lat: destGeo.lat, lon: destGeo.lon, title: `End: ${destGeo.displayName}`, icon: "destination" }
                ],
                timeline: [
                    { step: 1, mode: "station_dep", icon: "🚉", title: `Board High-Speed Terminal`, desc: `Rapid 30-minute passport check and platform boarding.`, duration: `30m`, distance: `Station`, carbon: `0.0 kg` },
                    { step: 2, mode: "rail", icon: "🚆", title: `Channel Tunnel High-Speed Rail`, desc: `Cruising at 300 km/h under the English Channel with 100% electric traction.`, duration: formatDuration(railDuration - 45), distance: `${Math.round(railDist)} km`, carbon: `${railCarbon.toFixed(1)} kg CO₂` },
                    { step: 3, mode: "arrival", icon: "🏁", title: `Arrive Downtown ${destGeo.city}`, desc: `Direct central terminus arrival with zero taxi delay.`, duration: `15m`, distance: `0 km`, carbon: `0.0 kg` }
                ]
            });
        }

        return routes;
    }

    /**
     * Synthesize Contiguous Land Multi-Modal Journey Matrix
     */
    async function planLandFeasibleJourneys(originGeo, destGeo, osrmDriveData, config = {}) {
        const fuelPrice = config.fuelPrice || 103.50;
        const vehicleType = config.vehicle || "petrol";
        const currencyRate = config.currencyRate || 1.0;

        const mainRoute = osrmDriveData.routes[0];
        const driveDistKm = mainRoute.distance / 1000;
        const driveDurationMins = mainRoute.duration / 60;
        const primaryRoadCoords = mainRoute.geometry.coordinates.map(c => [c[1], c[0]]);

        // Secondary / Alternative Road Geometry
        let altRoadCoords = primaryRoadCoords;
        if (osrmDriveData.routes.length > 1) {
            altRoadCoords = osrmDriveData.routes[1].geometry.coordinates.map(c => [c[1], c[0]]);
        } else {
            altRoadCoords = GeoEngine.generateRealisticRoadPath([originGeo.lat, originGeo.lon], [destGeo.lat, destGeo.lon], -0.08, 30);
        }

        const routes = [];

        // --- Route 1: AI Smart Eco-Route (Electric Vehicle Priority) ---
        const evEfficiencyKwhPerKm = 0.16;
        const evElectricityRate = 8.50 * currencyRate;
        const evCost = driveDistKm * evEfficiencyKwhPerKm * evElectricityRate;
        const evCarbon = driveDistKm * EMISSION_FACTORS.ev_grid_avg;

        routes.push({
            id: "land_ev_eco",
            type: "land",
            name: "⚡ AI Smart Eco-Route (Electric Vehicle)",
            category: "ev",
            badge: "Zero Tailpipe ✨",
            color: "#10b981",
            totalDistanceKm: driveDistKm,
            totalDurationMins: driveDurationMins * 1.04,
            totalCarbonKg: evCarbon,
            totalCost: evCost,
            ecoScore: calculateEcoScore(evCarbon, driveDistKm),
            treesNeeded: Math.ceil(evCarbon / 21.77),
            summary: `Energy-optimized EV corridor maximizing battery regenerative braking with zero direct tailpipe emissions.`,
            layers: [
                { type: "road_ev", coords: primaryRoadCoords, color: "#10b981", weight: 6, dashArray: null, title: "AI Optimized Eco-Corridor" }
            ],
            markers: [
                { type: "origin", lat: originGeo.lat, lon: originGeo.lon, title: `Start: ${originGeo.displayName}`, icon: "origin" },
                { type: "destination", lat: destGeo.lat, lon: destGeo.lon, title: `Destination: ${destGeo.displayName}`, icon: "destination" }
            ],
            timeline: [
                { step: 1, mode: "departure", icon: "🚗", title: `Depart ${originGeo.city}`, desc: `Battery at 90% SOC. Optimal eco-navigation engaged.`, duration: `0m`, distance: `0 km`, carbon: `0.0 kg` },
                { step: 2, mode: "drive", icon: "⚡", title: `Eco-Cruising Corridor`, desc: `Cruising in high-efficiency speed window (${driveDistKm.toFixed(1)} km).`, duration: formatDuration(driveDurationMins * 1.04), distance: `${driveDistKm.toFixed(1)} km`, carbon: `${evCarbon.toFixed(1)} kg CO₂` },
                { step: 3, mode: "arrival", icon: "🏁", title: `Arrive ${destGeo.city}`, desc: `Reached with zero localized emissions.`, duration: `0m`, distance: `0 km`, carbon: `0.0 kg` }
            ]
        });

        // --- Route 2: Standard Road Vehicle (Selected Fuel Type Baseline) ---
        let fuelMileage = 15.0; // km/L
        let carbonBasePerLiter = EMISSION_FACTORS.car_petrol_base;
        let vehicleLabel = "Petrol Car";

        if (vehicleType === 'diesel') {
            fuelMileage = 18.0;
            carbonBasePerLiter = EMISSION_FACTORS.car_diesel_base;
            vehicleLabel = "Diesel Car";
        } else if (vehicleType === 'bike') {
            fuelMileage = 45.0;
            carbonBasePerLiter = EMISSION_FACTORS.bike_petrol_base;
            vehicleLabel = "Motorcycle / Scooter";
        }

        const litersUsed = driveDistKm / fuelMileage;
        const roadFuelCost = litersUsed * fuelPrice;
        const roadCarbonKg = litersUsed * carbonBasePerLiter;

        routes.push({
            id: "land_standard_drive",
            type: "land",
            name: `🚗 Direct Highway Route (${vehicleLabel})`,
            category: "standard",
            badge: "Direct Highway 🛣️",
            color: "#3b82f6",
            totalDistanceKm: driveDistKm,
            totalDurationMins: driveDurationMins,
            totalCarbonKg: roadCarbonKg,
            totalCost: roadFuelCost,
            ecoScore: calculateEcoScore(roadCarbonKg, driveDistKm),
            treesNeeded: Math.ceil(roadCarbonKg / 21.77),
            summary: `Standard expressway route via primary tollways consuming ~${litersUsed.toFixed(1)} Litres of fuel.`,
            layers: [
                { type: "road_standard", coords: primaryRoadCoords, color: "#3b82f6", weight: 5, dashArray: null, title: "Standard Highway Expressway" }
            ],
            markers: [
                { type: "origin", lat: originGeo.lat, lon: originGeo.lon, title: `Start: ${originGeo.displayName}`, icon: "origin" },
                { type: "destination", lat: destGeo.lat, lon: destGeo.lon, title: `Destination: ${destGeo.displayName}`, icon: "destination" }
            ],
            timeline: [
                { step: 1, mode: "departure", icon: "🚦", title: `Depart ${originGeo.city}`, desc: `Highway ramp access.`, duration: `0m`, distance: `0 km`, carbon: `0.0 kg` },
                { step: 2, mode: "drive", icon: "⛽", title: `Highway Transit`, desc: `Driving ${driveDistKm.toFixed(1)} km consuming ${litersUsed.toFixed(1)}L fuel.`, duration: formatDuration(driveDurationMins), distance: `${driveDistKm.toFixed(1)} km`, carbon: `${roadCarbonKg.toFixed(1)} kg CO₂` },
                { step: 3, mode: "arrival", icon: "🏁", title: `Arrive ${destGeo.city}`, desc: `Trip completed.`, duration: `0m`, distance: `0 km`, carbon: `0.0 kg` }
            ]
        });

        // --- Route 3: Alternate Scenic / Non-Toll Corridor ---
        const altDistKm = driveDistKm * 1.07;
        const altDurationMins = driveDurationMins * 1.15;
        const altLiters = altDistKm / (fuelMileage * 1.05); // steadier speed saves slight fuel
        const altCost = altLiters * fuelPrice * 0.95; // save toll fees
        const altCarbon = altLiters * carbonBasePerLiter;

        routes.push({
            id: "land_scenic_route",
            type: "land",
            name: "🛣️ Alternate Scenic / Non-Toll Corridor",
            category: "scenic",
            badge: "Low Congestion 🌿",
            color: "#06b6d4",
            totalDistanceKm: altDistKm,
            totalDurationMins: altDurationMins,
            totalCarbonKg: altCarbon,
            totalCost: altCost,
            ecoScore: calculateEcoScore(altCarbon, altDistKm),
            treesNeeded: Math.ceil(altCarbon / 21.77),
            summary: `Alternative bypass corridor avoiding heavy urban toll gates and metropolitan bottlenecks.`,
            layers: [
                { type: "road_scenic", coords: altRoadCoords, color: "#06b6d4", weight: 4, dashArray: "4, 6", title: "Scenic Bypass Corridor" }
            ],
            markers: [
                { type: "origin", lat: originGeo.lat, lon: originGeo.lon, title: `Start: ${originGeo.displayName}`, icon: "origin" },
                { type: "destination", lat: destGeo.lat, lon: destGeo.lon, title: `Destination: ${destGeo.displayName}`, icon: "destination" }
            ],
            timeline: [
                { step: 1, mode: "departure", icon: "🛣️", title: `Bypass Corridor Access`, desc: `Depart via scenic regional arterial bypass.`, duration: `0m`, distance: `0 km`, carbon: `0.0 kg` },
                { step: 2, mode: "drive", icon: "🌲", title: `Steady Speed Cruising`, desc: `Smooth steady velocity across ${altDistKm.toFixed(1)} km.`, duration: formatDuration(altDurationMins), distance: `${altDistKm.toFixed(1)} km`, carbon: `${altCarbon.toFixed(1)} kg CO₂` },
                { step: 3, mode: "arrival", icon: "🏁", title: `Arrive ${destGeo.city}`, desc: `Downtown arrival.`, duration: `0m`, distance: `0 km`, carbon: `0.0 kg` }
            ]
        });

        // --- Route 4: High-Efficiency Intercity Electric Rail ---
        const trainDistKm = driveDistKm * 0.95;
        const trainDurationMins = Math.max(30, (trainDistKm / 100) * 60) + 30;
        const trainCarbonKg = trainDistKm * EMISSION_FACTORS.train_electric;
        const trainCost = (120 + (trainDistKm * 1.85)) * currencyRate;

        routes.push({
            id: "land_train",
            type: "land",
            name: "🚆 High-Efficiency Express Rail",
            category: "train",
            badge: "Ultra Low CO₂ ⚡",
            color: "#8b5cf6",
            totalDistanceKm: trainDistKm,
            totalDurationMins: trainDurationMins,
            totalCarbonKg: trainCarbonKg,
            totalCost: trainCost,
            ecoScore: calculateEcoScore(trainCarbonKg, trainDistKm),
            treesNeeded: Math.ceil(trainCarbonKg / 21.77),
            summary: `Intercity electric railway eliminating ${(roadCarbonKg - trainCarbonKg).toFixed(1)} kg of CO₂ compared to personal car driving!`,
            layers: [
                { type: "rail", coords: primaryRoadCoords, color: "#8b5cf6", weight: 5, dashArray: "6, 6", title: "High-Speed Rail Line" }
            ],
            markers: [
                { type: "origin", lat: originGeo.lat, lon: originGeo.lon, title: `Station: ${originGeo.city} Central`, icon: "station" },
                { type: "destination", lat: destGeo.lat, lon: destGeo.lon, title: `Station: ${destGeo.city} Terminus`, icon: "station" }
            ],
            timeline: [
                { step: 1, mode: "station_dep", icon: "🚉", title: `Board at ${originGeo.city} Central`, desc: `Platform boarding & reserved seating.`, duration: `20m`, distance: `Station`, carbon: `0.0 kg` },
                { step: 2, mode: "rail", icon: "🚆", title: `Electric Rail Transit`, desc: `High-speed rail line across ${trainDistKm.toFixed(1)} km with regenerative grid braking.`, duration: formatDuration(trainDurationMins - 30), distance: `${trainDistKm.toFixed(1)} km`, carbon: `${trainCarbonKg.toFixed(1)} kg CO₂` },
                { step: 3, mode: "station_arr", icon: "🏁", title: `Arrive ${destGeo.city} Station`, desc: `Downtown central arrival.`, duration: `10m`, distance: `0 km`, carbon: `0.0 kg` }
            ]
        });

        // --- Route 5: Intercity Eco-Coach / Bus Transit ---
        const busDistKm = driveDistKm * 1.02;
        const busDurationMins = driveDurationMins * 1.25;
        const busCarbonKg = busDistKm * EMISSION_FACTORS.bus_coach;
        const busCost = (80 + (busDistKm * 1.2)) * currencyRate;

        routes.push({
            id: "land_coach",
            type: "land",
            name: "🚌 Intercity Express Eco-Coach",
            category: "bus",
            badge: "Shared Transit 👥",
            color: "#f59e0b",
            totalDistanceKm: busDistKm,
            totalDurationMins: busDurationMins,
            totalCarbonKg: busCarbonKg,
            totalCost: busCost,
            ecoScore: calculateEcoScore(busCarbonKg, busDistKm),
            treesNeeded: Math.ceil(busCarbonKg / 21.77),
            summary: `High-capacity express motorcoach dividing emissions across 45+ passengers.`,
            layers: [
                { type: "coach", coords: primaryRoadCoords, color: "#f59e0b", weight: 4, dashArray: "3, 6", title: "Intercity Bus Corridor" }
            ],
            markers: [
                { type: "origin", lat: originGeo.lat, lon: originGeo.lon, title: `Coach Station: ${originGeo.city}`, icon: "station" },
                { type: "destination", lat: destGeo.lat, lon: destGeo.lon, title: `Coach Station: ${destGeo.city}`, icon: "station" }
            ],
            timeline: [
                { step: 1, mode: "departure", icon: "🚌", title: `Board Coach at ${originGeo.city}`, desc: `Luggage storage & check-in.`, duration: `15m`, distance: `Terminal`, carbon: `0.0 kg` },
                { step: 2, mode: "transit", icon: "🛣️", title: `Express Highway Transit`, desc: `Non-stop highway bus transit over ${busDistKm.toFixed(1)} km.`, duration: formatDuration(busDurationMins - 20), distance: `${busDistKm.toFixed(1)} km`, carbon: `${busCarbonKg.toFixed(1)} kg CO₂` },
                { step: 3, mode: "arrival", icon: "🏁", title: `Arrive ${destGeo.city}`, desc: `Arrival at bus hub.`, duration: `5m`, distance: `0 km`, carbon: `0.0 kg` }
            ]
        });

        // --- Route 6: Active Mobility (Bicycle / E-Bike) for Distances < 45 km ---
        if (driveDistKm <= 45) {
            const bikeDurationMins = (driveDistKm / 17) * 60;
            const caloriesBurned = Math.round(driveDistKm * 34);

            routes.push({
                id: "land_bicycle",
                type: "active",
                name: "🚲 Active Green Mobility (E-Bike / Cycle)",
                category: "bike",
                badge: "100% Clean 🌱",
                color: "#ec4899",
                totalDistanceKm: driveDistKm,
                totalDurationMins: bikeDurationMins,
                totalCarbonKg: 0.00,
                totalCost: 0.00,
                ecoScore: { grade: "A+", label: "Zero Emission", color: "#10b981", bg: "rgba(16, 185, 129, 0.2)" },
                treesNeeded: 0,
                summary: `100% emission-free active commute burning ~${caloriesBurned} kcal with zero fuel cost.`,
                layers: [
                    { type: "active", coords: altRoadCoords, color: "#ec4899", weight: 4, dashArray: "3, 5", title: "Dedicated Cycle Track" }
                ],
                markers: [
                    { type: "origin", lat: originGeo.lat, lon: originGeo.lon, title: `Start: ${originGeo.displayName}`, icon: "origin" },
                    { type: "destination", lat: destGeo.lat, lon: destGeo.lon, title: `End: ${destGeo.displayName}`, icon: "destination" }
                ],
                timeline: [
                    { step: 1, mode: "pedal", icon: "🚲", title: `Depart on Cycle / E-Bike`, desc: `Dedicated green cycling lane.`, duration: `0m`, distance: `0 km`, carbon: `0.0 kg` },
                    { step: 2, mode: "pedal", icon: "💪", title: `Active Commute`, desc: `Cardio health benefit: ${caloriesBurned} kcal burned over ${driveDistKm.toFixed(1)} km.`, duration: formatDuration(bikeDurationMins), distance: `${driveDistKm.toFixed(1)} km`, carbon: `0.0 kg` },
                    { step: 3, mode: "arrival", icon: "🏁", title: `Arrived Clean & Energized`, desc: `Zero tailpipe footprint.`, duration: `0m`, distance: `0 km`, carbon: `0.0 kg` }
                ]
            });
        }

        return routes;
    }

    return {
        formatDuration,
        calculateEcoScore,
        planCrossWaterJourney,
        planLandFeasibleJourneys
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultimodalPlanner;
}
