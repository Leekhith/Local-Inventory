// --- CONFIGURATION ---
const supabaseUrl = 'https://oppzpgjddbjfazlrrhhk.supabase.co';
const supabaseKey = 'sb_publishable_h5c3L-Q8c4_2Vau1wyRpyQ_IvBHcpgv';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- MAP INITIALIZATION ---
// We disable the default zoom control so we can add a new one in the Top Right
const map = L.map('map', {
    zoomControl: false 
}).setView([17.3850, 78.4867], 13);

// Add Zoom Control to TOP RIGHT
L.control.zoom({
    position: 'topright'
}).addTo(map);

// Add the tile layer (Keep your existing tile layer code below this)
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// 2. State Variables
let allShops = [];
let markers = [];
let currentIndex = -1;

// 3. Load Data
async function loadShops(searchTerm = '') {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    let query = supabase.from('shops').select('*');
    if (searchTerm) query = query.ilike('product_name', `%${searchTerm}%`);

    const { data, error } = await query;

    if (error) console.error('Supabase Error:', error);
    else {
        allShops = data;
        allShops.forEach((shop, index) => {
            const icon = L.divIcon({ className: 'price-marker', html: `₹${shop.price}` });
            const marker = L.marker([shop.latitude, shop.longitude], { icon: icon }).addTo(map);
            
            // Click Handler
            marker.on('click', () => {
                currentIndex = index;
                updateSheetContent(shop);
                highlightMarker(index);
                document.getElementById('bottom-sheet').classList.add('active');
            });
            markers.push(marker);
        });
    }
}

// 4. Update Content Helper (Fixed Image & Directions)
function updateSheetContent(shop) {
    // 1. Tell browser: "We are entering a new state (Sheet Open)"
    // Only do this if the sheet isn't already open
    if (!document.getElementById('bottom-sheet').classList.contains('active')) {
        window.history.pushState({sheetOpen: true}, "");
    }

    document.getElementById('sheet-shop-name').innerText = shop.shop_name;
    document.getElementById('sheet-product').innerText = shop.product_name;
    document.getElementById('sheet-price').innerText = '₹' + shop.price;
    
    const imgElement = document.getElementById('sheet-image');
    if (shop.image_url && shop.image_url.trim() !== "") {
        imgElement.src = shop.image_url;
    } else {
        imgElement.src = 'https://cdn-icons-png.flaticon.com/512/1170/1170679.png';
    }
    imgElement.style.display = 'block';

    // 🟢 CORRECTED LINK: This uses the official Google Maps Navigation API
    // (Note: No random numbers like '3' before the curly braces)
    const dirLink = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
    document.getElementById('btn-navigate').href = dirLink;
    
    map.setView([shop.latitude, shop.longitude], 15);
}

function highlightMarker(index) {
    markers.forEach(m => {
        const iconDiv = m.getElement();
        if(iconDiv) iconDiv.classList.remove('active-marker');
    });
    const activeIcon = markers[index].getElement();
    if(activeIcon) activeIcon.classList.add('active-marker');
}

// 5. 🌟 NEW GHOST SWIPE LOGIC 🌟
function animateSwipe(nextIndex, direction) {
    const realSheet = document.getElementById('bottom-sheet');
    
    // 1. Create a Clone (The "Ghost") of the current sheet
    const ghost = realSheet.cloneNode(true);
    ghost.id = ''; // Remove ID to avoid conflicts
    ghost.classList.add('ghost-sheet'); // Add ghost styling
    document.body.appendChild(ghost); // Add to screen

    // 2. Prepare the Real Sheet (Move it off-screen INSTANTLY)
    realSheet.style.transition = 'none'; // Disable animation for instant move
    if (direction === 'next') {
        realSheet.style.transform = 'translateX(120%)'; // Start from Right
    } else {
        realSheet.style.transform = 'translateX(-120%)'; // Start from Left
    }

    // 3. Update Real Sheet Data
    currentIndex = nextIndex;
    updateSheetContent(allShops[currentIndex]);
    highlightMarker(currentIndex);

    // 4. Force Browser Reflow (Magic Trick)
    void realSheet.offsetWidth;

    // 5. ANIMATE BOTH (At the same time)
    requestAnimationFrame(() => {
        // A. Animate Ghost OFF
        ghost.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        if (direction === 'next') {
            ghost.style.transform = 'translateX(-120%)'; // Ghost goes Left
        } else {
            ghost.style.transform = 'translateX(120%)'; // Ghost goes Right
        }

        // B. Animate Real Sheet IN
        realSheet.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        realSheet.style.transform = 'translateX(0)'; // Real comes to Center
    });

    // 6. Cleanup Ghost after animation
    setTimeout(() => {
        ghost.remove();
        // Reset Real Sheet transition for normal Open/Close
        realSheet.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    }, 300);
}

// 6. Touch Handling
let touchStartX = 0;
let touchEndX = 0;
const bottomSheet = document.getElementById('bottom-sheet');

bottomSheet.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

bottomSheet.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    const threshold = 50;

    if (swipeDistance > threshold) {
        // Swiped Right -> Previous Shop
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = allShops.length - 1;
        animateSwipe(prevIndex, 'prev');
    } 
    else if (swipeDistance < -threshold) {
        // Swiped Left -> Next Shop
        let nextIndex = currentIndex + 1;
        if (nextIndex >= allShops.length) nextIndex = 0;
        animateSwipe(nextIndex, 'next');
    }
}

// Map Click to Close
map.on('click', () => {
    const sheet = document.getElementById('bottom-sheet');
    if (sheet.classList.contains('active')) {
        // Instead of closing directly, we go "Back" in history.
        // This triggers the 'popstate' listener we wrote above.
        window.history.back(); 
    }
});

// --- UPDATED LOCATE ME LOGIC ---
// --- UPDATED LOCATE ME LOGIC (With Loading Spinner) ---
const userMarkerGroup = L.layerGroup().addTo(map);

const btnLocate = document.getElementById('btn-locate');
const iconArrow = document.getElementById('icon-arrow');
const iconLoading = document.getElementById('icon-loading');

btnLocate.addEventListener('click', () => {
    // 1. Show Loading State
    iconArrow.classList.add('hidden');
    iconLoading.classList.remove('hidden');

    // 2. Start Search
    map.locate({
        setView: true, 
        maxZoom: 16, 
        enableHighAccuracy: true, 
        timeout: 10000 
    });
});

map.on('locationfound', (e) => {
    // 3. Stop Loading State
    iconArrow.classList.remove('hidden');
    iconLoading.classList.add('hidden');

    userMarkerGroup.clearLayers();

    // Draw Dot
    L.marker(e.latlng, {
        icon: L.divIcon({ 
            className: 'user-location-dot', 
            iconSize: [20, 20], 
            html: '<div style="width:100%;height:100%;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.4);"></div>'
        }) 
    }).addTo(userMarkerGroup);

    // Draw Circle (only if accurate)
    if (e.accuracy < 1000) {
        L.circle(e.latlng, {
            radius: e.accuracy / 2,
            color: '#4285F4', 
            fillColor: '#4285F4', 
            fillOpacity: 0.15, 
            weight: 1
        }).addTo(userMarkerGroup);
    }
});

map.on('locationerror', (e) => {
    // 4. Stop Loading (Even if it fails)
    iconArrow.classList.remove('hidden');
    iconLoading.classList.add('hidden');
    
    alert("Could not access location. Ensure GPS is on.");
});

map.on('locationfound', (e) => {
    userMarkerGroup.clearLayers();

    // Custom Dot
    L.marker(e.latlng, {
        icon: L.divIcon({ 
            className: 'user-location-dot', 
            iconSize: [20, 20], 
            html: '<div style="width:100%;height:100%;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.4);"></div>'
        }) 
    }).addTo(userMarkerGroup);

    // Only draw circle if accuracy is good (< 1km) to avoid "Giant Blue Blob"
    if (e.accuracy < 1000) {
        L.circle(e.latlng, {
            radius: e.accuracy / 2,
            color: '#4285F4',
            fillColor: '#4285F4',
            fillOpacity: 0.15,
            weight: 1
        }).addTo(userMarkerGroup);
    }
});

map.on('locationerror', (e) => {
    alert("Could not access location. Ensure GPS is on.");
});
// 🌟 HANDLE MOBILE BACK BUTTON
window.addEventListener('popstate', (event) => {
    // If the user presses Back, we close the sheet
    const sheet = document.getElementById('bottom-sheet');
    if (sheet.classList.contains('active')) {
        closeBottomSheetUI();
    }
});

// Helper function to cleanly close the UI
function closeBottomSheetUI() {
    const sheet = document.getElementById('bottom-sheet');
    sheet.classList.remove('active');
    sheet.style.transform = ''; // Clear swipe locks
    
    // Remove marker highlights
    markers.forEach(m => {
        const iconDiv = m.getElement();
        if(iconDiv) iconDiv.classList.remove('active-marker');
    });
}

loadShops();

// --- SIDEBAR LOGIC ---

const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

// Open Menu
menuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
});

// Close Menu (Clicking Overlay)
overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// Close Menu (Swiping Left - Optional Touch Feature)
let sidebarTouchStart = 0;
sidebar.addEventListener('touchstart', e => {
    sidebarTouchStart = e.changedTouches[0].screenX;
});
sidebar.addEventListener('touchend', e => {
    const sidebarTouchEnd = e.changedTouches[0].screenX;
    if (sidebarTouchStart - sidebarTouchEnd > 50) { // Swiped Left
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
});

// --- NESTED MENU LOGIC ---

const menuMain = document.getElementById('menu-main');
const menuRentals = document.getElementById('menu-rentals');
const btnOpenRentals = document.getElementById('btn-open-rentals');
const btnBackMenu = document.getElementById('btn-back-menu');

// 1. Go to Rental Menu
btnOpenRentals.addEventListener('click', (e) => {
    e.preventDefault(); // Stop page reload
    menuMain.style.display = 'none';
    menuRentals.style.display = 'block';
});

// 2. Go Back to Main Menu
btnBackMenu.addEventListener('click', () => {
    menuMain.style.display = 'block';
    menuRentals.style.display = 'none';
});

// 3. Handle Rental Selection (1BHK, 2BHK, etc.)
function loadRealEstate(type) {
    // A. Close the sidebar so the user can see the map
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').classList.remove('active');
    
    // B. Reset the menu for next time
    setTimeout(() => {
        menuMain.style.display = 'block';
        menuRentals.style.display = 'none';
    }, 300);

    // C. Logic to Filter/Show Map Points (Placeholder)
    alert(`Loading map for: ${type}... \n(You will connect this to your database later)`);
    
    // Example: You could call a function here like:
    // fetchAndShowMarkers(type); 
}
