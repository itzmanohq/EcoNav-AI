/**
 * EcoNav AI - Global Transportation Infrastructure Database
 * Comprehensive database of international airports, major connection hubs,
 * high-speed rail nodes, and maritime ferry ports worldwide.
 */

const GLOBAL_AIRPORTS = [
    // --- India & South Asia ---
    { iata: "MAA", name: "Chennai International Airport", city: "Chennai", country: "India", cc: "in", lat: 12.9941, lon: 80.1709, type: "international", hub: true },
    { iata: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India", cc: "in", lat: 28.5562, lon: 77.1000, type: "international", hub: true },
    { iata: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India", cc: "in", lat: 19.0896, lon: 72.8656, type: "international", hub: true },
    { iata: "BLR", name: "Kempegowda International Airport", city: "Bengaluru", country: "India", cc: "in", lat: 13.1986, lon: 77.7066, type: "international", hub: true },
    { iata: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad", country: "India", cc: "in", lat: 17.2403, lon: 78.4294, type: "international", hub: true },
    { iata: "CCU", name: "Netaji Subhash Chandra Bose International Airport", city: "Kolkata", country: "India", cc: "in", lat: 22.6547, lon: 88.4467, type: "international", hub: true },
    { iata: "COK", name: "Cochin International Airport", city: "Kochi", country: "India", cc: "in", lat: 10.1520, lon: 76.3922, type: "international", hub: false },
    { iata: "TRV", name: "Thiruvananthapuram International Airport", city: "Thiruvananthapuram", country: "India", cc: "in", lat: 8.4821, lon: 76.9200, type: "international", hub: false },
    { iata: "GOI", name: "Manohar International Airport (Mopa / Dabolim)", city: "Goa", country: "India", cc: "in", lat: 15.3808, lon: 73.8314, type: "international", hub: false },
    { iata: "AMD", name: "Sardar Vallabhbhai Patel International Airport", city: "Ahmedabad", country: "India", cc: "in", lat: 23.0772, lon: 72.6347, type: "international", hub: false },
    { iata: "PNQ", name: "Pune International Airport", city: "Pune", country: "India", cc: "in", lat: 18.5822, lon: 73.9197, type: "international", hub: false },
    { iata: "CJB", name: "Coimbatore International Airport", city: "Coimbatore", country: "India", cc: "in", lat: 11.0300, lon: 77.0434, type: "international", hub: false },
    { iata: "IXM", name: "Madurai Airport", city: "Madurai", country: "India", cc: "in", lat: 9.8345, lon: 78.0934, type: "domestic", hub: false },
    { iata: "TRZ", name: "Tiruchirappalli International Airport", city: "Tiruchirappalli", country: "India", cc: "in", lat: 10.7654, lon: 78.7097, type: "international", hub: false },
    { iata: "JAI", name: "Jaipur International Airport", city: "Jaipur", country: "India", cc: "in", lat: 26.8242, lon: 75.8122, type: "international", hub: false },
    { iata: "LKO", name: "Chaudhary Charan Singh International Airport", city: "Lucknow", country: "India", cc: "in", lat: 26.7606, lon: 80.8893, type: "international", hub: false },
    { iata: "GAU", name: "Lokpriya Gopinath Bordoloi International Airport", city: "Guwahati", country: "India", cc: "in", lat: 26.1061, lon: 91.5859, type: "international", hub: false },
    { iata: "IXC", name: "Shaheed Bhagat Singh International Airport", city: "Chandigarh", country: "India", cc: "in", lat: 30.6735, lon: 76.7885, type: "domestic", hub: false },
    { iata: "CMB", name: "Bandaranaike International Airport", city: "Colombo", country: "Sri Lanka", cc: "lk", lat: 7.1808, lon: 79.8841, type: "international", hub: true },
    { iata: "DAC", name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "Bangladesh", cc: "bd", lat: 23.8433, lon: 90.3978, type: "international", hub: true },
    { iata: "KTM", name: "Tribhuvan International Airport", city: "Kathmandu", country: "Nepal", cc: "np", lat: 27.6966, lon: 85.3591, type: "international", hub: false },
    { iata: "ISB", name: "Islamabad International Airport", city: "Islamabad", country: "Pakistan", cc: "pk", lat: 33.5494, lon: 72.8258, type: "international", hub: false },
    { iata: "KHI", name: "Jinnah International Airport", city: "Karachi", country: "Pakistan", cc: "pk", lat: 24.9065, lon: 67.1608, type: "international", hub: false },
    { iata: "MLE", name: "Velana International Airport", city: "Male", country: "Maldives", cc: "mv", lat: 4.1918, lon: 73.5290, type: "international", hub: false },

    // --- United Kingdom & Ireland ---
    { iata: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom", cc: "gb", lat: 51.4700, lon: -0.4543, type: "international", hub: true },
    { iata: "LGW", name: "London Gatwick Airport", city: "London", country: "United Kingdom", cc: "gb", lat: 51.1537, lon: -0.1821, type: "international", hub: true },
    { iata: "STN", name: "London Stansted Airport", city: "London", country: "United Kingdom", cc: "gb", lat: 51.8860, lon: 0.2389, type: "international", hub: false },
    { iata: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom", cc: "gb", lat: 53.3537, lon: -2.2750, type: "international", hub: true },
    { iata: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom", cc: "gb", lat: 52.4539, lon: -1.7480, type: "international", hub: false },
    { iata: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", cc: "gb", lat: 55.9500, lon: -3.3725, type: "international", hub: false },
    { iata: "GLA", name: "Glasgow Airport", city: "Glasgow", country: "United Kingdom", cc: "gb", lat: 55.8719, lon: -4.4331, type: "international", hub: false },
    { iata: "BRS", name: "Bristol Airport", city: "Bristol", country: "United Kingdom", cc: "gb", lat: 51.3827, lon: -2.7191, type: "international", hub: false },
    { iata: "NCL", name: "Newcastle Airport", city: "Newcastle", country: "United Kingdom", cc: "gb", lat: 55.0375, lon: -1.6917, type: "international", hub: false },
    { iata: "BFS", name: "Belfast International Airport", city: "Belfast", country: "United Kingdom", cc: "gb", lat: 54.6575, lon: -6.2158, type: "international", hub: false },
    { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", cc: "ie", lat: 53.4264, lon: -6.2499, type: "international", hub: true },
    { iata: "ORK", name: "Cork Airport", city: "Cork", country: "Ireland", cc: "ie", lat: 51.8413, lon: -8.4911, type: "international", hub: false },

    // --- Western & Central Europe ---
    { iata: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", cc: "fr", lat: 49.0097, lon: 2.5479, type: "international", hub: true },
    { iata: "ORY", name: "Paris Orly Airport", city: "Paris", country: "France", cc: "fr", lat: 48.7262, lon: 2.3652, type: "international", hub: false },
    { iata: "NCE", name: "Nice Côte d'Azur Airport", city: "Nice", country: "France", cc: "fr", lat: 43.6584, lon: 7.2159, type: "international", hub: false },
    { iata: "LYS", name: "Lyon-Saint Exupéry Airport", city: "Lyon", country: "France", cc: "fr", lat: 45.7256, lon: 5.0811, type: "international", hub: false },
    { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", cc: "de", lat: 50.0379, lon: 8.5622, type: "international", hub: true },
    { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", cc: "de", lat: 48.3537, lon: 11.7750, type: "international", hub: true },
    { iata: "BER", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", cc: "de", lat: 52.3667, lon: 13.5033, type: "international", hub: true },
    { iata: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "Germany", cc: "de", lat: 53.6304, lon: 9.9882, type: "international", hub: false },
    { iata: "DUS", name: "Düsseldorf Airport", city: "Düsseldorf", country: "Germany", cc: "de", lat: 51.2895, lon: 6.7668, type: "international", hub: false },
    { iata: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands", cc: "nl", lat: 52.3105, lon: 4.7683, type: "international", hub: true },
    { iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", cc: "be", lat: 50.9014, lon: 4.4844, type: "international", hub: false },
    { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", cc: "ch", lat: 47.4582, lon: 8.5555, type: "international", hub: true },
    { iata: "GVA", name: "Geneva Airport", city: "Geneva", country: "Switzerland", cc: "ch", lat: 46.2370, lon: 6.1092, type: "international", hub: false },
    { iata: "VIE", name: "Vienna International Airport", city: "Vienna", country: "Austria", cc: "at", lat: 48.1103, lon: 16.5697, type: "international", hub: true },

    // --- Southern & Eastern Europe ---
    { iata: "MAD", name: "Adolfo Suárez Madrid–Barajas Airport", city: "Madrid", country: "Spain", cc: "es", lat: 40.4839, lon: -3.5680, type: "international", hub: true },
    { iata: "BCN", name: "Josep Tarradellas Barcelona-El Prat Airport", city: "Barcelona", country: "Spain", cc: "es", lat: 41.2974, lon: 2.0833, type: "international", hub: true },
    { iata: "AGP", name: "Málaga Airport", city: "Málaga", country: "Spain", cc: "es", lat: 36.6749, lon: -4.4991, type: "international", hub: false },
    { iata: "LIS", name: "Humberto Delgado Airport", city: "Lisbon", country: "Portugal", cc: "pt", lat: 38.7742, lon: -9.1342, type: "international", hub: true },
    { iata: "OPO", name: "Francisco Sá Carneiro Airport", city: "Porto", country: "Portugal", cc: "pt", lat: 41.2421, lon: -8.6786, type: "international", hub: false },
    { iata: "FCO", name: "Leonardo da Vinci–Fiumicino Airport", city: "Rome", country: "Italy", cc: "it", lat: 41.8003, lon: 12.2389, type: "international", hub: true },
    { iata: "MXP", name: "Milan Malpensa Airport", city: "Milan", country: "Italy", cc: "it", lat: 45.6301, lon: 8.7255, type: "international", hub: true },
    { iata: "VCE", name: "Venice Marco Polo Airport", city: "Venice", country: "Italy", cc: "it", lat: 45.5053, lon: 12.3519, type: "international", hub: false },
    { iata: "NAP", name: "Naples International Airport", city: "Naples", country: "Italy", cc: "it", lat: 40.8860, lon: 14.2908, type: "international", hub: false },
    { iata: "ATH", name: "Athens International Airport", city: "Athens", country: "Greece", cc: "gr", lat: 37.9364, lon: 23.9445, type: "international", hub: true },
    { iata: "JTR", name: "Santorini National Airport", city: "Santorini", country: "Greece", cc: "gr", lat: 36.3992, lon: 25.4793, type: "international", hub: false },
    { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", cc: "tr", lat: 41.2753, lon: 28.7519, type: "international", hub: true },
    { iata: "SAW", name: "Sabiha Gökçen International Airport", city: "Istanbul", country: "Turkey", cc: "tr", lat: 40.8986, lon: 29.3092, type: "international", hub: false },
    { iata: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", country: "Poland", cc: "pl", lat: 52.1672, lon: 20.9679, type: "international", hub: true },
    { iata: "PRG", name: "Václav Havel Airport Prague", city: "Prague", country: "Czech Republic", cc: "cz", lat: 50.1008, lon: 14.2600, type: "international", hub: false },
    { iata: "BUD", name: "Budapest Ferenc Liszt International Airport", city: "Budapest", country: "Hungary", cc: "hu", lat: 47.4369, lon: 19.2556, type: "international", hub: false },

    // --- Northern Europe & Baltics ---
    { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", cc: "dk", lat: 55.6180, lon: 12.6508, type: "international", hub: true },
    { iata: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Sweden", cc: "se", lat: 59.6498, lon: 17.9238, type: "international", hub: true },
    { iata: "OSL", name: "Oslo Airport Gardermoen", city: "Oslo", country: "Norway", cc: "no", lat: 60.1976, lon: 11.1004, type: "international", hub: true },
    { iata: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinki", country: "Finland", cc: "fi", lat: 60.3172, lon: 24.9633, type: "international", hub: true },
    { iata: "KEF", name: "Keflavík International Airport", city: "Reykjavik", country: "Iceland", cc: "is", lat: 63.9850, lon: -22.6056, type: "international", hub: false },

    // --- North America (USA, Canada, Mexico) ---
    { iata: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States", cc: "us", lat: 40.6413, lon: -73.7781, type: "international", hub: true },
    { iata: "EWR", name: "Newark Liberty International Airport", city: "Newark / New York", country: "United States", cc: "us", lat: 40.6895, lon: -74.1745, type: "international", hub: true },
    { iata: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States", cc: "us", lat: 40.7769, lon: -73.8740, type: "domestic", hub: false },
    { iata: "BOS", name: "Logan International Airport", city: "Boston", country: "United States", cc: "us", lat: 42.3656, lon: -71.0096, type: "international", hub: true },
    { iata: "IAD", name: "Washington Dulles International Airport", city: "Washington D.C.", country: "United States", cc: "us", lat: 38.9531, lon: -77.4565, type: "international", hub: true },
    { iata: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "United States", cc: "us", lat: 41.9742, lon: -87.9073, type: "international", hub: true },
    { iata: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", country: "United States", cc: "us", lat: 33.6407, lon: -84.4277, type: "international", hub: true },
    { iata: "MIA", name: "Miami International Airport", city: "Miami", country: "United States", cc: "us", lat: 25.7959, lon: -80.2870, type: "international", hub: true },
    { iata: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "United States", cc: "us", lat: 32.8998, lon: -97.0403, type: "international", hub: true },
    { iata: "DEN", name: "Denver International Airport", city: "Denver", country: "United States", cc: "us", lat: 39.8561, lon: -104.6737, type: "international", hub: true },
    { iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States", cc: "us", lat: 33.9416, lon: -118.4085, type: "international", hub: true },
    { iata: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "United States", cc: "us", lat: 37.6213, lon: -122.3790, type: "international", hub: true },
    { iata: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", country: "United States", cc: "us", lat: 47.4502, lon: -122.3088, type: "international", hub: true },
    { iata: "LAS", name: "Harry Reid International Airport", city: "Las Vegas", country: "United States", cc: "us", lat: 36.0840, lon: -115.1537, type: "international", hub: false },
    { iata: "HNL", name: "Daniel K. Inouye International Airport", city: "Honolulu", country: "United States", cc: "us", lat: 21.3187, lon: -157.9224, type: "international", hub: true },
    { iata: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada", cc: "ca", lat: 43.6777, lon: -79.6248, type: "international", hub: true },
    { iata: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "Canada", cc: "ca", lat: 49.1967, lon: -123.1815, type: "international", hub: true },
    { iata: "YUL", name: "Montréal-Trudeau International Airport", city: "Montreal", country: "Canada", cc: "ca", lat: 45.4657, lon: -73.7455, type: "international", hub: true },
    { iata: "MEX", name: "Mexico City International Airport", city: "Mexico City", country: "Mexico", cc: "mx", lat: 19.4361, lon: -99.0719, type: "international", hub: true },

    // --- East Asia & Southeast Asia ---
    { iata: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", cc: "jp", lat: 35.5494, lon: 139.7798, type: "international", hub: true },
    { iata: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan", cc: "jp", lat: 35.7720, lon: 140.3929, type: "international", hub: true },
    { iata: "KIX", name: "Kansai International Airport", city: "Osaka", country: "Japan", cc: "jp", lat: 34.4320, lon: 135.2304, type: "international", hub: true },
    { iata: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea", cc: "kr", lat: 37.4602, lon: 126.4407, type: "international", hub: true },
    { iata: "PEK", name: "Beijing Capital International Airport", city: "Beijing", country: "China", cc: "cn", lat: 40.0799, lon: 116.6031, type: "international", hub: true },
    { iata: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai", country: "China", cc: "cn", lat: 31.1443, lon: 121.8083, type: "international", hub: true },
    { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong", cc: "hk", lat: 22.3080, lon: 113.9185, type: "international", hub: true },
    { iata: "TPE", name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "Taiwan", cc: "tw", lat: 25.0797, lon: 121.2342, type: "international", hub: true },
    { iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", cc: "sg", lat: 1.3644, lon: 103.9915, type: "international", hub: true },
    { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", cc: "th", lat: 13.6900, lon: 100.7501, type: "international", hub: true },
    { iata: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia", cc: "my", lat: 2.7456, lon: 101.7072, type: "international", hub: true },
    { iata: "CGK", name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia", cc: "id", lat: -6.1256, lon: 106.6558, type: "international", hub: true },
    { iata: "DPS", name: "Ngurah Rai (Bali) International Airport", city: "Denpasar / Bali", country: "Indonesia", cc: "id", lat: -8.7482, lon: 115.1672, type: "international", hub: false },
    { iata: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", country: "Philippines", cc: "ph", lat: 14.5086, lon: 121.0194, type: "international", hub: true },
    { iata: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam", cc: "vn", lat: 10.8188, lon: 106.6519, type: "international", hub: true },

    // --- Middle East & Global Connectors ---
    { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", cc: "ae", lat: 25.2532, lon: 55.3657, type: "international", hub: true },
    { iata: "AUH", name: "Zayed International Airport", city: "Abu Dhabi", country: "United Arab Emirates", cc: "ae", lat: 24.4330, lon: 54.6511, type: "international", hub: true },
    { iata: "DOH", name: "Hamad International Airport", city: "Doha", country: "Qatar", cc: "qa", lat: 25.2731, lon: 51.6081, type: "international", hub: true },
    { iata: "RUH", name: "King Khalid International Airport", city: "Riyadh", country: "Saudi Arabia", cc: "sa", lat: 24.9576, lon: 46.6988, type: "international", hub: true },
    { iata: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "Saudi Arabia", cc: "sa", lat: 21.6796, lon: 39.1565, type: "international", hub: true },

    // --- Oceania & Pacific ---
    { iata: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", cc: "au", lat: -33.9461, lon: 151.1772, type: "international", hub: true },
    { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", cc: "au", lat: -37.6690, lon: 144.8410, type: "international", hub: true },
    { iata: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia", cc: "au", lat: -27.3842, lon: 153.1175, type: "international", hub: true },
    { iata: "PER", name: "Perth Airport", city: "Perth", country: "Australia", cc: "au", lat: -31.9403, lon: 115.9668, type: "international", hub: true },
    { iata: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", cc: "nz", lat: -37.0082, lon: 174.7850, type: "international", hub: true },

    // --- South America & Africa ---
    { iata: "GRU", name: "São Paulo/Guarulhos International Airport", city: "São Paulo", country: "Brazil", cc: "br", lat: -23.4356, lon: -46.4731, type: "international", hub: true },
    { iata: "EZE", name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina", cc: "ar", lat: -34.8222, lon: -58.5358, type: "international", hub: true },
    { iata: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egypt", cc: "eg", lat: 30.1219, lon: 31.4056, type: "international", hub: true },
    { iata: "JNB", name: "O. R. Tambo International Airport", city: "Johannesburg", country: "South Africa", cc: "za", lat: -26.1392, lon: 28.2460, type: "international", hub: true },
    { iata: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "Kenya", cc: "ke", lat: -1.3192, lon: 36.9278, type: "international", hub: true }
];

/**
 * Curated Global Maritime, Ferry & High Speed Rail Terminals
 */
const GLOBAL_FERRY_PORTS = [
    { id: "DOV", name: "Port of Dover Ferry Terminal", city: "Dover", country: "United Kingdom", lat: 51.1279, lon: 1.3323, connectsTo: ["CAL"] },
    { id: "CAL", name: "Port of Calais Ferry Terminal", city: "Calais", country: "France", lat: 50.9686, lon: 1.8672, connectsTo: ["DOV"] },
    { id: "STP_RAIL", name: "London St Pancras International (Eurostar)", city: "London", country: "United Kingdom", lat: 51.5314, lon: -0.1261, connectsTo: ["PARIS_NORD"] },
    { id: "PARIS_NORD", name: "Paris Gare du Nord (Eurostar)", city: "Paris", country: "France", lat: 48.8809, lon: 2.3553, connectsTo: ["STP_RAIL"] },
    { id: "HOL", name: "Holyhead Ferry Port", city: "Holyhead", country: "United Kingdom", lat: 53.3087, lon: -4.6294, connectsTo: ["DUB_P"] },
    { id: "DUB_P", name: "Dublin Port Ferry Terminal", city: "Dublin", country: "Ireland", lat: 53.3486, lon: -6.2086, connectsTo: ["HOL"] },
    { id: "HEL_P", name: "Helsinki Port West Terminal", city: "Helsinki", country: "Finland", lat: 60.1500, lon: 24.9167, connectsTo: ["TAL_P"] },
    { id: "TAL_P", name: "Port of Tallinn Passenger Terminal", city: "Tallinn", country: "Estonia", lat: 59.4447, lon: 24.7600, connectsTo: ["HEL_P"] },
    { id: "PIR", name: "Piraeus Port Terminal", city: "Athens", country: "Greece", lat: 37.9472, lon: 23.6372, connectsTo: ["SAN_P"] },
    { id: "SAN_P", name: "Santorini Athinios Ferry Port", city: "Santorini", country: "Greece", lat: 36.3860, lon: 25.4312, connectsTo: ["PIR"] },
    { id: "HK_MFT", name: "Hong Kong Macau Ferry Terminal", city: "Hong Kong", country: "Hong Kong", lat: 22.2882, lon: 114.1517, connectsTo: ["MAC_OP"] },
    { id: "MAC_OP", name: "Macau Outer Harbour Ferry Terminal", city: "Macau", country: "Macau", lat: 22.1979, lon: 113.5593, connectsTo: ["HK_MFT"] }
];

// Export to window if running in browser, or module.exports in Node
if (typeof window !== 'undefined') {
    window.GLOBAL_AIRPORTS = GLOBAL_AIRPORTS;
    window.GLOBAL_FERRY_PORTS = GLOBAL_FERRY_PORTS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GLOBAL_AIRPORTS, GLOBAL_FERRY_PORTS };
}
