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

// --- UPDATED DATA & SEARCH LOGIC ---

async function performSearch() {
    const btnSearchArea = document.getElementById('btn-search-area');
    const toast = document.getElementById('toast-msg');
    
    btnSearchArea.classList.add('hidden');
    
    // Clear Markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const center = map.getCenter();

    // --- SIMULATED DATABASE (Updated for your request) ---
    const allData = [
        // 1 BHK
        { name: "Sunny Apartment", type: "1BHK", lat: center.lat + 0.002, lng: center.lng + 0.002, price: 12000, img: "https://cdn-icons-png.flaticon.com/512/609/609803.png" },
        // 2 BHK
        { name: "Royal Residency", type: "2BHK", lat: center.lat - 0.003, lng: center.lng - 0.002, price: 25000, img: "https://cdn-icons-png.flaticon.com/512/609/609803.png" },
        // Chicken
        { name: "Fresh Farms Chicken", type: "Chicken", lat: center.lat + 0.001, lng: center.lng - 0.003, price: 240, img: "https://cdn-icons-png.flaticon.com/512/1046/1046751.png" },
        // Grocery
        { name: "Best Price Wholesale", type: "Grocery", lat: center.lat - 0.001, lng: center.lng + 0.004, price: "Wholesale", img: "https://cdn-icons-png.flaticon.com/512/3724/3724720.png" },
    ];

    // Filter Logic
    let results = [];
    if (currentSearchTerm === 'all') {
        results = allData;
    } else {
        results = allData.filter(item => item.type === currentSearchTerm);
    }

    if (results.length === 0) {
        toast.innerText = `No ${currentSearchTerm} found nearby!`;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
        return; 
    }

    results.forEach(shop => {
        const marker = L.marker([shop.lat, shop.lng]).addTo(map);
        
        // Show Price on Map
        let label = typeof shop.price === 'number' ? `₹${shop.price}` : shop.price;
        marker.bindTooltip(label, {
            permanent: true, direction: 'bottom', className: 'price-label'
        });

        marker.on('click', () => {
             updateSheetContent(shop);
             document.getElementById('bottom-sheet').classList.add('active');
        });
        markers.push(marker);
    });
}

// ... Keep the Sidebar Logic (menuBtn listener) from previous steps ...
// If you lost the sidebar logic, add this back to the bottom:
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

menuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});
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
