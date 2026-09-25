# 🌱 EcoNav AI – Multi-Modal Commute & Carbon Planner

**EcoNav AI** is a state-of-the-art, AI-powered sustainable navigation and carbon emissions planning engine. It intelligently analyzes multi-modal transit networks (Road, Electric Vehicles, High-Speed Rail, Maritime Ferries, and Transcontinental Aviation Corridors) to provide realistic, environmentally optimized journeys across both contiguous landmasses and international ocean-separated destinations.

---

## 🚀 Key Innovations & Core Architecture

### 1. Geographic Feasibility Validation (Zero Ocean-Crossing Errors)
* **Problem Solved:** Legacy navigation systems frequently draw straight or arbitrary lines across oceans for non-vehicle (walking, cycling, driving) routes when destinations are separated by bodies of water (e.g. *Chennai ➔ London* or *New York ➔ Paris*).
* **EcoNav Solution:** 
  * Strict physical connectivity and terrain boundary analysis.
  * Detects ocean barriers, disconnected islands, and transcontinental distances.
  * Never generates fake walking, cycling, or driving tracks across water bodies.

### 2. Cross-Water / International Multi-Modal Journey Engine
When origin and destination are separated by a large body of water or transcontinental distances:
* **Infrastructure Discovery:** Automatically identifies the nearest international airport (e.g. `MAA - Chennai Intl`, `LHR - London Heathrow`, `JFK - New York`) or maritime ferry terminal.
* **Leg 1 (Origin Ground Transit):** Real road/metro transit connecting origin to the departure airport.
* **Leg 2 (Aviation Corridor):** Mathematically computed **Great-Circle Geodesic Arc** rendered smoothly across the Earth's spherical curvature on Leaflet maps with an animated aircraft icon.
* **Leg 3 (Destination Ground Transit):** High-speed rail / express metro from the arrival hub to the final destination.
* **Alternative Flight Options:** Standard Aviation Corridor vs. **🌿 AI Eco-Flight (Sustainable Aviation Fuel SAF 80% Offset)**.

### 3. Domestic / Land-Feasible Multi-Modal Matrix
For destinations on the same contiguous landmass (e.g. *Chennai ➔ Bengaluru*, *London ➔ Paris*, *Mumbai ➔ Delhi*):
* **⚡ AI Eco-Route (Electric Vehicle):** Zero direct tailpipe emissions, optimal speed cruising, and energy regeneration.
* **🚗 Standard Highway Route:** Selected vehicle profile (Petrol Car, Diesel Car, Motorcycle) with detailed fuel consumption.
* **🚆 High-Efficiency Express Rail:** Electrified intercity rail transit reducing carbon footprint by over 80% compared to driving.
* **🚲 Active Green Mobility:** Bicycle / E-Bike tracks for short commutes ($\le 35\text{ km}$) with calorie burn metrics.

### 4. Science-Grounded Carbon & ESG Calculations
* Standardized emission models complying with IPCC, ICAO, and DEFRA:
  * **Aviation:** Short-haul ($0.245\text{ kg CO}_2/\text{pkm}$), Medium-haul ($0.185$), Long-haul ($0.150$) + Radiative Forcing Index.
  * **SAF Biofuels:** $80\%$ net lifecycle carbon reduction.
  * **Electric Rail:** $0.032\text{ kg CO}_2/\text{pkm}$.
  * **Electric Vehicles:** $0.00\text{ kg}$ tailpipe ($0.038\text{ kg/km}$ well-to-wheel grid mix).
  * **Internal Combustion:** Petrol ($2.31\text{ kg CO}_2/\text{L}$), Diesel ($2.68\text{ kg CO}_2/\text{L}$).
  * **ESG Trees Offset:** Equivalent number of mature trees required to neutralize the trip emissions per year ($1\text{ tree} \approx 21.77\text{ kg CO}_2/\text{year}$).
  * **Eco-Score Rating:** Dynamic letter grade from **A+** (Zero emission) to **F** (Severe footprint).

---

## 🛠️ Technology Stack

* **Frontend:** Semantic HTML5, CSS3 Glassmorphism Design System, Modern Vanilla JavaScript (ES6+).
* **Interactive Mapping:** [Leaflet.js](https://leafletjs.com/) with CartoDB Dark Matter tiles.
* **Geocoding & Autocomplete:** Komoot Photon OSM API + Nominatim OpenStreetMap fallback + Curated world cities & hubs cache.
* **Road Routing:** OSRM (Open Source Routing Machine) API.
* **Geodesic Trajectories:** Spherical trigonometry & Great Circle navigation interpolation.
* **Deployment:** 100% static, fast, zero-dependency, deployable on **Vercel** (`vercel.json`).

---

## 📂 Project Structure

```text
EcoNav/
├── index.html               # Sleek landing page with search autocomplete & scenario presets
├── route.html               # Split-screen analytics dashboard with Leaflet map & multimodal timeline
├── style.css                # Glassmorphism dark design system tokens & animations
├── js/
│   ├── airports-data.js     # Curated global database of 150+ international airports & ports
│   ├── geo-engine.js        # Great-Circle math, nearest hub finder, land-connectivity validator
│   └── multimodal-planner.js# Multi-modal itinerary synthesis, emission models & cost estimates
├── vercel.json              # Vercel deployment configuration (clean URLs)
└── README.md                # Project documentation
```

---

## 🚦 Getting Started Locally

1. Clone or open the repository folder:
   ```bash
   cd EcoNav
   ```
2. Serve the static files using any local web server:
   ```bash
   npx serve .
   # or with Python:
   python -m http.server 5000
   ```
3. Open `http://localhost:5000` in your web browser.

---

## 🚢 Deploy to Vercel

EcoNav is designed for zero-config deployment on Vercel:
1. Push this repository to GitHub or GitLab.
2. Import the repository in the [Vercel Dashboard](https://vercel.com).
3. Click **Deploy** (Framework Preset: *Other / Static*).
