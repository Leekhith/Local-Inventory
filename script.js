// 1. INITIALIZE MAP (No Zoom Controls)
const map = L.map('map', { zoomControl: false }).setView([17.3850, 78.4867], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 20
}).addTo(map);

// 2. STATE VARIABLES
let markers = [];
let currentSearchTerm = ""; // Stores what we are looking for (e.g., '1BHK')

// 3. LISTEN FOR CATEGORY CLICKS (The slider items)
function triggerSearch(term) {
    currentSearchTerm = term;
    
    // Highlight the active circle
    document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active'); // Highlight clicked one

    performSearch();
}

// 4. MAIN SEARCH FUNCTION
async function performSearch() {
    const btnSearchArea = document.getElementById('btn-search-area');
    const toast = document.getElementById('toast-msg');
    
    // Hide "Search Area" button while searching
    btnSearchArea.classList.add('hidden');
    
    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    // Get Map Center & Bounds
    const center = map.getCenter();
    // Simulate API delay
    // In real app: fetch from Supabase using center.lat, center.lng
    
    // --- SIMULATED DATA (Replace with Supabase later) ---
    // We filter based on currentSearchTerm
    const allData = [
        { name: "Luxury Apt", type: "1BHK", lat: center.lat + 0.002, lng: center.lng + 0.002, price: 15000 },
        { name: "Cozy Studio", type: "1BHK", lat: center.lat - 0.003, lng: center.lng - 0.002, price: 12000 },
        { name: "Family Villa", type: "Villa", lat: center.lat + 0.005, lng: center.lng - 0.005, price: 45000 },
        { name: "Daily Needs", type: "all", lat: center.lat + 0.001, lng: center.lng + 0.001, price: 50 },
    ];

    // Filter logic
    let results = [];
    if (currentSearchTerm === 'all') {
        results = allData;
    } else {
        results = allData.filter(item => item.type === currentSearchTerm);
    }

    // --- HANDLE "NO RESULTS" ---
    if (results.length === 0) {
        toast.innerText = `No ${currentSearchTerm} found nearby!`;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
        return; 
    }

    // --- RENDER MARKERS ---
    results.forEach(shop => {
        const marker = L.marker([shop.lat, shop.lng]).addTo(map);
        
        // Tooltip (Price Tag)
        marker.bindTooltip(`₹${shop.price}`, {
            permanent: true, direction: 'bottom', className: 'price-label'
        });

        // Click Event (Open Bottom Sheet)
        marker.on('click', () => {
             updateSheetContent(shop);
             document.getElementById('bottom-sheet').classList.add('active');
        });
        markers.push(marker);
    });
}

// 5. "SEARCH THIS AREA" LOGIC
map.on('moveend', () => {
    // Only show button if we have searched for something previously
    if (currentSearchTerm !== "") {
        document.getElementById('btn-search-area').classList.remove('hidden');
    }
});

// Button Click Listener
document.getElementById('btn-search-area').addEventListener('click', () => {
    performSearch(); // Re-run search with new map center
});

// 6. BOTTOM SHEET UPDATER (Same as before)
function updateSheetContent(shop) {
    document.getElementById('sheet-shop-name').innerText = shop.name;
    document.getElementById('sheet-product').innerText = shop.type; // or product name
    document.getElementById('sheet-price').innerText = '₹' + shop.price;
    // ... add image logic etc ...
}

// 7. LOCATE ME LOGIC (Updated for new button ID)
document.getElementById('btn-locate').addEventListener('click', () => {
    const btn = document.getElementById('btn-locate');
    document.getElementById('icon-arrow').classList.add('hidden');
    document.getElementById('icon-loading').classList.remove('hidden');

    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy:true });
});

map.on('locationfound', (e) => {
    document.getElementById('icon-arrow').classList.remove('hidden');
    document.getElementById('icon-loading').classList.add('hidden');
    L.circle(e.latlng, { radius: 20 }).addTo(map);
});
