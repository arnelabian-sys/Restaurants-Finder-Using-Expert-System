// =============================================
//  Restaurant Finder Using Expert System
//  script.js — Static food search + Flask backend
// =============================================

const API_BASE = '/api';

// =============================================
//  UNSPLASH API — Per-restaurant dynamic photos
// =============================================

const UNSPLASH_KEY = 'KSViCmamcW8UI6U6pO0iXbFSFmP39Gfyfqj-YlNyZtg';
const photoCache = {};

async function getFoodPhoto(query) {
    if (photoCache[query]) return photoCache[query];
    try {
        const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' food')}&per_page=1&orientation=landscape`,
            { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
        );
        const data = await res.json();
        const url = data.results?.[0]?.urls?.regular ||
                    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&auto=format&fit=crop';
        photoCache[query] = url;
        return url;
    } catch(e) {
        return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&auto=format&fit=crop';
    }
}

// Inject resto-card CSS
(function() {
    const s = document.createElement('style');
    s.textContent = `
        .resto-card {
            background: #241910;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 10px;
        }
        .resto-card-img-wrap {
            width: 100%; height: 140px;
            overflow: hidden; background: #2e2015;
        }
        .resto-card-img {
            width: 100%; height: 100%;
            object-fit: cover; display: block;
            transition: transform 0.3s;
        }
        .resto-card:hover .resto-card-img { transform: scale(1.04); }
        .resto-card-body { padding: 10px 12px 6px; }
        .resto-card-name {
            font-family: 'Syne', sans-serif;
            font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px;
        }
        .resto-card-tags { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
        .tag-chip {
            background: rgba(232,80,26,0.15); color: #E8501A;
            font-size: 10px; padding: 2px 7px; border-radius: 20px;
        }
        .resto-card .btn-pin {
            display: block; margin: 4px 12px 10px;
            width: calc(100% - 24px); text-align: center;
        }
    `;
    document.head && document.head.appendChild(s);
})();

// =============================================
//  FOOD DATABASE — Static, no AI needed
// =============================================

const FOOD_DB = [
    {
        name: "Fried Chicken",
        emoji: "🍗",
        pop: 98,
        desc: "Crispy golden fried chicken",
        photo: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&auto=format&fit=crop",
        tags: ["chicken", "fried", "fried chicken", "crispy", "fastfood", "jollibee"],
        ids: [11, 13]
    },
    {
        name: "Burger & Fries",
        emoji: "🍔",
        pop: 95,
        desc: "Classic juicy burger with crispy fries",
        photo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop",
        tags: ["burger", "fries", "fastfood", "mcdo", "sandwich"],
        ids: [18, 11]
    },
    {
        name: "Fresh Tuna",
        emoji: "🐟",
        pop: 96,
        desc: "Fresh-caught yellowfin tuna dishes",
        photo: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=500&auto=format&fit=crop",
        tags: ["tuna", "fresh", "seafood", "fish", "yellowfin"],
        ids: [12, 17]
    },
    {
        name: "Inihaw na Liempo",
        emoji: "🥓",
        pop: 94,
        desc: "Smoky charcoal-grilled pork belly",
        photo: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&auto=format&fit=crop",
        tags: ["liempo", "inihaw", "bbq", "pork", "grilled", "charcoal", "grill"],
        ids: [1, 8, 19]
    },
    {
        name: "Grilled Bangus",
        emoji: "🐠",
        pop: 94,
        desc: "Charcoal-grilled milkfish, best served with rice",
        photo: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop",
        tags: ["bangus", "fish", "grilled", "inihaw", "seafood", "milkfish"],
        ids: [4, 5, 8]
    },
    {
        name: "Sinigang",
        emoji: "🍲",
        pop: 92,
        desc: "Sour tamarind soup with fish or pork",
        photo: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop",
        tags: ["sinigang", "soup", "sabaw", "seafood", "pork", "tamarind", "filipino"],
        ids: [17, 4]
    },
    {
        name: "Kare-Kare",
        emoji: "🥘",
        pop: 78,
        desc: "Rich peanut stew with bagoong",
        photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop",
        tags: ["kare-kare", "kare", "oxtail", "peanut", "bagoong", "filipino", "stew"],
        ids: [7, 2]
    },
    {
        name: "Korean BBQ",
        emoji: "🥩",
        pop: 91,
        desc: "Unlimited samgyupsal pork belly & sides",
        photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop",
        tags: ["korean", "bbq", "samgyup", "samgyupsal", "meat", "unlimited", "korea"],
        ids: [14]
    },
    {
        name: "BBQ Skewers",
        emoji: "🍢",
        pop: 87,
        desc: "Charcoal-grilled street BBQ sticks",
        photo: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop",
        tags: ["bbq", "skewer", "isaw", "street", "barbecue", "streetfood", "charcoal", "barbeque"],
        ids: [15, 19]
    },
    {
        name: "Grilled Squid",
        emoji: "🦑",
        pop: 83,
        desc: "Stuffed & charcoal-grilled pusit",
        photo: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop",
        tags: ["squid", "pusit", "grilled", "seafood", "calamari", "inihaw"],
        ids: [12, 4]
    },
    {
        name: "Filipino Buffet",
        emoji: "🍱",
        pop: 85,
        desc: "Daily homestyle Filipino buffet spread",
        photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop",
        tags: ["buffet", "rice", "viand", "lutong bahay", "filipino", "budget", "sulit", "tinuwa"],
        ids: [2, 7]
    },
    {
        name: "Coffee & Snacks",
        emoji: "☕",
        pop: 82,
        desc: "Freshly brewed coffee & baked goods",
        photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop",
        tags: ["coffee", "cafe", "kape", "snacks", "bread", "drinks", "beverage", "milk tea", "milktea"],
        ids: [3]
    },
    {
        name: "Seafood Platter",
        emoji: "🦐",
        pop: 89,
        desc: "Fresh mixed seafood grilled or steamed",
        photo: "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=500&auto=format&fit=crop",
        tags: ["seafood", "shrimp", "hipon", "crab", "alimango", "platter", "mixed", "fresh"],
        ids: [4, 5, 12, 17]
    },
    {
        name: "Pork Chop",
        emoji: "🍖",
        pop: 86,
        desc: "Pan-fried or grilled pork chop Filipino style",
        photo: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=500&auto=format&fit=crop",
        tags: ["pork", "chop", "pork chop", "grilled", "fried", "meat"],
        ids: [1, 8, 2]
    },
    {
        name: "Adobo",
        emoji: "🫕",
        pop: 90,
        desc: "Classic Filipino chicken or pork adobo",
        photo: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=500&auto=format&fit=crop",
        tags: ["adobo", "chicken adobo", "pork adobo", "filipino", "classic", "soy"],
        ids: [2, 7, 17]
    },
    {
        name: "Ice Cream & Desserts",
        emoji: "🍦",
        pop: 80,
        desc: "Cold desserts and sweet treats",
        photo: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&auto=format&fit=crop",
        tags: ["ice cream", "dessert", "sweet", "cold", "halo halo", "halohalo", "mais"],
        ids: [3, 10]
    },
];

// =============================================
//  RESTAURANT DATABASE — loaded from Flask API
// =============================================

let RESTAURANTS = [];

async function loadRestaurantsFromAPI() {
    try {
        const res = await fetch('/api/restaurants', { credentials: 'include' });
        RESTAURANTS = await res.json();
        initMap();
    } catch(e) {
        console.error('Failed to load restaurants:', e);
    }
}

// =============================================
//  MAP INIT
// =============================================

let map, mapMarkers = {};

function initMap() {
    // FIX: Only run if #map element exists (explore page only)
    if (!document.getElementById('map')) return;

    if (!map) {
        map = L.map('map', {
            center: [9.1210, 125.5370],
            zoom: 13,
            zoomControl: true,
            attributionControl: true
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© <a href="https://leafletjs.com">Leaflet</a> | © OpenStreetMap'
        }).addTo(map);
    }

    Object.values(mapMarkers).forEach(m => m.remove());
    mapMarkers = {};

    RESTAURANTS.forEach(r => {
        const m = L.marker([r.lat, r.lng], { icon: makeIcon(false) })
            .addTo(map)
            .bindPopup(`
                <div class="popup-name">${r.emoji} ${r.name}</div>
                <div class="popup-meta">${r.cuisine} &nbsp;·&nbsp; ${r.price}</div>
                <div class="popup-meta">
                    ★ ${r.rating} &nbsp;·&nbsp;
                    <span class="${r.open ? 'popup-open' : 'popup-closed'}">
                        ${r.open ? 'Open' : 'Closed'}
                    </span>
                </div>
            `);
        mapMarkers[r.id] = m;
    });
}

// =============================================
//  DOMContentLoaded — only wire up explore-page
//  elements if they actually exist on this page
// =============================================

window.addEventListener('DOMContentLoaded', () => {
    // FIX: Check if we're on the explore page before doing anything
    const isExplorePage = !!document.getElementById('map');
    if (!isExplorePage) return;

    loadRestaurantsFromAPI();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function(e) {
            showSuggestions(this.value);
            if (this.value.trim() === "") {
                document.getElementById("resultsArea").innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🍽️</div>
                        <div class="empty-text">Type any food or drink<br>then hit Search</div>
                    </div>`;
            }
        });

        searchInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                doSearch();
            }
        });
    }
});

function makeIcon(active) {
    return L.divIcon({
        className: '',
        html: `<div style="
            background: ${active ? '#fff' : '#E8501A'};
            border: 2.5px solid ${active ? '#E8501A' : '#fff'};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 22px; height: 22px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22]
    });
}

function pinRestaurant(id) {
    const r = RESTAURANTS.find(x => x.id === id);
    if (!r) return;

    Object.entries(mapMarkers).forEach(([rid, m]) => {
        m.setIcon(makeIcon(parseInt(rid) === id));
    });

    map.flyTo([r.lat, r.lng], 17, { animate: true, duration: 1 });
    setTimeout(() => mapMarkers[id] && mapMarkers[id].openPopup(), 1000);

    // Mobile: scroll down to map
    if (window.innerWidth <= 768) {
        const mapEl = document.getElementById('map');
        if (mapEl) {
            mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// =============================================
//  SEARCH
// =============================================

async function doSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;

    hideSuggestions();

    const area = document.getElementById('resultsArea');

    try {
        const res = await fetch('/api/restaurants?search=' + encodeURIComponent(q), { credentials: 'include' });
        const restaurants = await res.json();

        if (!restaurants.length) {
            area.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😕</div>
                    <div class="empty-text">Walay nakita para sa "<strong style="color:#fff">${q}</strong>".<br>
                    Try: chicken, seafood, bbq, coffee...</div>
                </div>`;
            return;
        }

        const avgPop = Math.round(restaurants.reduce((s, r) => s + r.rating, 0) / restaurants.length * 20);

        // Fetch per-restaurant photos from Unsplash in parallel
        const photoPromises = restaurants.map(r => getFoodPhoto(`${r.cuisine} ${q}`));
        const photos = await Promise.all(photoPromises);

        const restoItems = restaurants.map((r, i) => `
            <div class="resto-card">
                <div class="resto-card-img-wrap">
                    <img class="resto-card-img" src="${photos[i]}" alt="${r.name}"
                         onerror="this.style.display='none'" />
                </div>
                <div class="resto-card-body">
                    <div class="resto-card-name">${r.emoji} ${r.name}</div>
                    <div class="resto-meta">
                        <span class="r">&#9733;${r.rating}</span>
                        &nbsp;·&nbsp; ${r.price}
                        &nbsp;·&nbsp; <span style="color:${r.open ? '#1D9E75' : '#aaa'}">${r.open ? 'Open' : 'Closed'}</span>
                        &nbsp;·&nbsp; ${r.dist} km
                    </div>
                    <div class="resto-card-tags">
                        ${r.tags.slice(0,3).map(t => `<span class="tag-chip">${t}</span>`).join('')}
                    </div>
                </div>
                <button class="btn-pin" onclick="event.stopPropagation(); pinRestaurant(${r.id})">&#128205; Map</button>
            </div>
        `).join('');

        area.innerHTML = `
            <div class="results-label">${restaurants.length} result${restaurants.length !== 1 ? 's' : ''} &middot; "${q}"</div>
            <div style="margin-bottom:8px;font-size:11px;color:rgba(255,255,255,0.3);">
                Showing restaurants that serve <strong style="color:#E8501A">${q}</strong>
            </div>
            ${restoItems}`;

    } catch(e) {
        console.error('Search failed:', e);
    }
}

// =============================================
//  RENDER FOOD CARDS
// =============================================

function renderFoodCards(items, query) {
    const area = document.getElementById('resultsArea');

    if (!items.length) {
        area.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">😕</div>
                <div class="empty-text">Walay nakita para sa "<strong style="color:#fff">${query}</strong>".<br>
                Try: chicken, seafood, bbq, coffee, sinigang...</div>
            </div>`;
        return;
    }

    let html = `<div class="results-label">${items.length} result${items.length > 1 ? 's' : ''} · "${query}"</div>`;

    items.forEach((f, i) => {
        const rests = (f.ids || [])
            .map(id => RESTAURANTS.find(r => r.id === id))
            .filter(Boolean);

        html += `
            <div class="food-card" id="fc${i}" onclick="toggleCard(${i})">
                <div class="food-img-wrap">
                    ${f.photo
                        ? `<img class="food-img" src="${f.photo}" alt="${f.name}" onerror="this.classList.add('broken')" />`
                        : ''
                    }
                    <div class="food-img-fallback${!f.photo ? ' show' : ''}">${f.emoji}</div>
                    <span class="pop-badge${f.pop >= 90 ? ' hot' : ''}">${f.pop}% popular</span>
                </div>
                <div class="food-body">
                    <div class="food-name">${f.emoji} ${f.name}</div>
                    <div class="food-desc">${f.desc}</div>
                    <div class="pop-bar">
                        <div class="pop-bar-fill" style="width:${f.pop}%"></div>
                    </div>
                    <div class="resto-list">
                        ${rests.length
                            ? rests.map(r => `
                                <div class="resto-item">
                                    <div class="resto-emoji">${r.emoji}</div>
                                    <div class="resto-info">
                                        <div class="resto-name">${r.name}</div>
                                        <div class="resto-meta">
                                            <span class="r">★${r.rating}</span>
                                            &nbsp;·&nbsp; ${r.price}
                                            &nbsp;·&nbsp; ${r.open ? 'Open' : 'Closed'}
                                        </div>
                                    </div>
                                    <button class="btn-pin" onclick="pinRestaurant(${r.id}); event.stopPropagation()">
                                        📍 Map
                                    </button>
                                </div>`).join('')
                                : `<div style="font-size:11px;color:rgba(255,255,255,0.28);padding:8px 0">
                                Walay specific restaurant.
                            </div>`
                        }
                    </div>
                </div>
            </div>`;
    });

    area.innerHTML = html;
}

// =============================================
//  TOGGLE CARD OPEN / CLOSE
// =============================================

function toggleCard(i) {
    const card = document.getElementById(`fc${i}`);
    const wasActive = card.classList.contains('active');
    document.querySelectorAll('.food-card').forEach(c => c.classList.remove('active'));
    if (!wasActive) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// =============================================
//  DETAIL PANEL
// =============================================

function closeDetail() {
    const panel = document.getElementById('detailPanel');
    if (panel) panel.classList.remove('open');
}

// =============================================
//  AUTOCOMPLETE SUGGESTIONS
// =============================================

const SUGGESTIONS = [
    "chicken", "seafood", "bbq", "barbeque", "pork", "beef", "fish",
    "tuna", "grilled", "fried", "adobo", "sinigang", "buffet",
    "fastfood", "korean", "samgyupsal", "unlimited", "coffee", "cafe",
    "breakfast", "lunch", "dinner", "budget", "cheap", "family",
    "outdoor", "garden", "pool", "filipino", "native", "lutong bahay",
    "fresh", "burger", "fries", "rice", "soup", "grill", "diner",
    "food park", "snacks", "bread", "dessert", "halal", "vegetarian"
];

let selectedIndex = -1;

function showSuggestions(val) {
    const box = document.getElementById("suggestionsBox");
    if (!box) return; // FIX: guard for pages without this element
    selectedIndex = -1;

    if (!val.trim()) {
        box.innerHTML = "";
        box.classList.remove("show");
        return;
    }

    const filtered = SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 6);

    if (filtered.length === 0) {
        box.innerHTML = "";
        box.classList.remove("show");
        return;
    }

    box.innerHTML = filtered.map((s, i) => `
        <div class="suggestion-item" onmousedown="selectSuggestion('${s}')" id="suggestion-${i}">
            <span class="suggestion-icon">🔍</span>
            ${highlightMatch(s, val)}
        </div>
    `).join("");

    box.classList.add("show");
}

function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.slice(0, idx) +
        "<strong>" + text.slice(idx, idx + query.length) + "</strong>" +
        text.slice(idx + query.length);
}

function selectSuggestion(val) {
    const input = document.getElementById("searchInput");
    if (input) input.value = val;
    hideSuggestions();
    doSearch();
}

function hideSuggestions() {
    const box = document.getElementById("suggestionsBox");
    if (!box) return; // FIX: guard for pages without this element
    box.innerHTML = "";
    box.classList.remove("show");
}

function handleKey(e) {
    const box = document.getElementById("suggestionsBox");
    if (!box) return; // FIX: guard
    const items = box.querySelectorAll(".suggestion-item");

    if (e.key === "ArrowDown") {
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
    } else if (e.key === "ArrowUp") {
        selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && items[selectedIndex]) {
            items[selectedIndex].dispatchEvent(new MouseEvent("mousedown"));
        } else {
            hideSuggestions();
            doSearch();
        }
        return;
    } else if (e.key === "Escape") {
        hideSuggestions();
        return;
    }

    items.forEach((item, i) => item.classList.toggle("active", i === selectedIndex));
}

document.addEventListener("click", function(e) {
    if (!e.target.closest(".search-area")) hideSuggestions();
});
