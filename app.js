// ============================================================================
// RaktSetu (रक्तसेतु) — Main Application Core Logic
// "When every minute matters, finding the right blood should be as simple as searching for it."
// ============================================================================

import {
  BLOOD_GROUPS,
  BLOOD_COMPONENTS,
  CITIES,
  INITIAL_BLOOD_CENTRES,
  INITIAL_SOS_REQUESTS,
  INITIAL_DONORS,
  INITIAL_HOSPITAL_REQUISITIONS,
  COMPATIBILITY_RULES,
  NLP_KEYWORDS
} from './data.js';

// Global State
class Store {
  constructor() {
    this.storageKeyPrefix = 'raktsetu_';
    this.state = {
      bloodCentres: this.load('centres', INITIAL_BLOOD_CENTRES),
      sosRequests: this.load('sos_requests', INITIAL_SOS_REQUESTS),
      donors: this.load('donors', INITIAL_DONORS),
      hospitalRequisitions: this.load('hospital_reqs', INITIAL_HOSPITAL_REQUISITIONS),
      activeRole: 'patient', // 'patient' | 'blood_centre' | 'hospital' | 'admin'
      activeTab: 'search', // 'search' | 'map' | 'sos_network' | 'compatibility' | 'ai_assistant' | 'donors'
      selectedCity: 'gurugram',
      userCoords: { lat: 28.4595, lng: 77.0266, name: 'Gurugram (Cyber City / Sector 29)' }, // default
      searchParams: {
        bloodGroup: 'O-',
        component: 'prbc',
        quantity: 2,
        radiusKm: 25,
        urgency: 'critical', // 'critical' (<1h), 'urgent' (1-4h), 'planned' (24h)
        sortBy: 'smart', // 'smart', 'distance', 'stock', 'freshness'
        verifiedOnly: false,
        is24x7Only: false,
        searchQuery: ''
      },
      selectedCentreModal: null,
      selectedSosModal: null,
      requisitionModalOpen: false,
      donorModalOpen: false,
      sosModalOpen: false,
      printSlipData: null,
      aiChatHistory: [
        { sender: 'ai', text: 'Namaste! I am **RaktSetu AI Emergency Assistant**. You can tell me your emergency in plain language (e.g. *"Urgent 3 units of O-negative PRBC needed in Gurugram"*) or ask questions about blood compatibility, donor guidelines, and emergency protocols. How can I help right now?' }
      ],
      soundEnabled: true,
      language: 'en', // 'en' | 'hi'
      nightMode: false,
      lastSimulationTime: Date.now()
    };

    // Save initial state if empty
    this.save('centres', this.state.bloodCentres);
    this.save('sos_requests', this.state.sosRequests);
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(this.storageKeyPrefix + key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn('LocalStorage error:', e);
      return fallback;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(this.storageKeyPrefix + key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  update(fn) {
    fn(this.state);
    this.save('centres', this.state.bloodCentres);
    this.save('sos_requests', this.state.sosRequests);
    this.save('donors', this.state.donors);
    this.save('hospital_reqs', this.state.hospitalRequisitions);
    renderApp();
  }
}

export const store = new Store();
let leafletMap = null;
let mapMarkers = [];
let userRadiusCircle = null;

// Audio Chime Synthesizer using Web Audio API
function playEmergencyChime(type = 'match') {
  if (!store.state.soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'match') {
      // Pleasant alert chime (A4 -> C#5 -> E5)
      const notes = [440, 554.37, 659.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
      });
    } else if (type === 'sos') {
      // Urgent high-priority double beep
      [880, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.14);
      });
    }
  } catch (err) {
    console.warn('Audio chime error:', err);
  }
}

// Toast Notification Manager
export function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const borderColors = {
    info: 'border-sky-500 bg-slate-900/95 text-sky-100 shadow-sky-900/30',
    success: 'border-emerald-500 bg-slate-900/95 text-emerald-100 shadow-emerald-900/30',
    emergency: 'border-brand-500 bg-slate-900/95 text-brand-100 shadow-brand-900/40 animate-pulse-fast',
    warning: 'border-amber-500 bg-slate-900/95 text-amber-100 shadow-amber-900/30'
  };

  const icons = {
    info: 'info',
    success: 'check-circle-2',
    emergency: 'alert-triangle',
    warning: 'alert-circle'
  };

  toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-xl transition-all duration-300 transform translate-y-4 opacity-0 ${borderColors[type] || borderColors.info}`;
  toast.innerHTML = `
    <div class="mt-0.5 text-lg">
      <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5"></i>
    </div>
    <div class="flex-1">
      <h4 class="text-sm font-bold text-white">${title}</h4>
      <p class="text-xs text-slate-300 mt-0.5">${message}</p>
    </div>
    <button class="text-slate-400 hover:text-white p-1" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  // Auto dismiss
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Distance Calculation (Haversine Formula)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal
}

// Format Relative Time (Stock Freshness)
export function formatRelativeTime(dateIso) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));

  if (diffMins < 1) return 'Just now (<1m)';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hr ago';
  if (diffHours < 24) return `${diffHours} hrs ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

// Freshness Badge Helper
export function getFreshnessBadge(dateIso) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));

  if (diffMins <= 15) {
    return {
      label: `🟢 Live Sync • ${formatRelativeTime(dateIso)}`,
      css: 'badge-live',
      score: 100,
      isFresh: true
    };
  } else if (diffMins <= 60) {
    return {
      label: `🟡 Updated ${formatRelativeTime(dateIso)}`,
      css: 'badge-moderate',
      score: 80,
      isFresh: true
    };
  } else {
    return {
      label: `🟠 Updated ${formatRelativeTime(dateIso)} (Verify via Call)`,
      css: 'badge-stale',
      score: 40,
      isFresh: false
    };
  }
}

// Smart Ranking & Matching Engine
export function getRankedCentres() {
  const { bloodCentres, searchParams, userCoords } = store.state;
  const { bloodGroup, component, quantity, radiusKm, verifiedOnly, is24x7Only, sortBy, searchQuery } = searchParams;

  const results = bloodCentres.map(centre => {
    const distance = calculateDistance(userCoords.lat, userCoords.lng, centre.lat, centre.lng);
    const groupStock = centre.stock[bloodGroup] || { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 };
    const availableUnits = groupStock[component] || 0;
    const freshness = getFreshnessBadge(centre.lastStockUpdate);

    // Multi-factor weighted score calculation
    // 1. Distance Score (0-100, closer is higher)
    const distanceScore = Math.max(0, 100 - (distance / (radiusKm || 25)) * 100);

    // 2. Stock Score (0-100)
    let stockScore = 0;
    if (availableUnits >= quantity) {
      stockScore = 100;
    } else if (availableUnits > 0) {
      stockScore = 50 + (availableUnits / quantity) * 40;
    } else {
      stockScore = 0;
    }

    // 3. Freshness Score (0-100)
    const freshnessScore = freshness.score;

    // 4. Verification & Operational Bonus (0-100)
    let trustScore = 70;
    if (centre.nabhAccredited) trustScore += 15;
    if (centre.govtRecognized) trustScore += 10;
    if (centre.is24x7) trustScore += 5;

    // Overall Smart Match Score (Weighted)
    const smartScore = Math.round(
      (distanceScore * 0.35) +
      (stockScore * 0.30) +
      (freshnessScore * 0.20) +
      (trustScore * 0.15)
    );

    // Compatibility check (e.g. what alternative blood groups can also satisfy this requirement)
    const compatibleGroups = COMPATIBILITY_RULES[bloodGroup]?.canReceiveRBCFrom || [bloodGroup];
    let totalCompatibleUnits = 0;
    compatibleGroups.forEach(bg => {
      totalCompatibleUnits += (centre.stock[bg]?.[component] || 0);
    });

    return {
      ...centre,
      distance,
      availableUnits,
      freshness,
      smartScore,
      totalCompatibleUnits,
      compatibleGroups,
      isExactStockAvailable: availableUnits >= quantity,
      isLowStock: availableUnits > 0 && availableUnits < quantity,
      isOutOfStock: availableUnits === 0
    };
  });

  // Filter Results
  let filtered = results.filter(item => {
    // Distance filter
    if (radiusKm && item.distance > radiusKm) return false;
    // Verified only filter
    if (verifiedOnly && !item.nabhAccredited && !item.govtRecognized) return false;
    // 24x7 filter
    if (is24x7Only && !item.is24x7) return false;
    // Text search query filter
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q) || item.area.toLowerCase().includes(q) || item.address.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    return true;
  });

  // Sort Results
  filtered.sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance - b.distance;
    } else if (sortBy === 'stock') {
      return b.availableUnits - a.availableUnits;
    } else if (sortBy === 'freshness') {
      return new Date(b.lastStockUpdate) - new Date(a.lastStockUpdate);
    } else {
      // Default: 'smart' match score
      // Prioritize available stock, then highest smartScore
      if (a.availableUnits > 0 && b.availableUnits === 0) return -1;
      if (a.availableUnits === 0 && b.availableUnits > 0) return 1;
      return b.smartScore - a.smartScore;
    }
  });

  return filtered;
}

// NLP Entity Extraction Parser for RaktSetu AI
export function parseNaturalLanguageEmergency(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  let extracted = {
    bloodGroup: null,
    component: null,
    quantity: null,
    urgency: null,
    location: null
  };

  // 1. Extract Blood Group
  for (const [key, bg] of Object.entries(NLP_KEYWORDS.bloodGroups)) {
    // Regex for word boundary or isolated token
    const regex = new RegExp(`\\b${key.replace('+', '\\+')}\\b`, 'i');
    if (regex.test(lower)) {
      extracted.bloodGroup = bg;
      break;
    }
  }

  // 2. Extract Component
  for (const [key, comp] of Object.entries(NLP_KEYWORDS.components)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lower)) {
      extracted.component = comp;
      break;
    }
  }

  // 3. Extract Quantity (e.g. "2 units", "3 bags", "4 bottles", "1 unit")
  const qtyMatch = lower.match(/(\d+)\s*(unit|units|bag|bags|bottle|bottles|packet|packets|pints)?/);
  if (qtyMatch && qtyMatch[1]) {
    const val = parseInt(qtyMatch[1], 10);
    if (val >= 1 && val <= 20) {
      extracted.quantity = val;
    }
  }

  // 4. Extract Urgency
  for (const [key, urg] of Object.entries(NLP_KEYWORDS.urgency)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lower)) {
      extracted.urgency = urg;
      break;
    }
  }

  // 5. Extract Location
  for (const [key, loc] of Object.entries(NLP_KEYWORDS.locations)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lower)) {
      extracted.location = loc;
      break;
    }
  }

  return extracted;
}

// Translations / Multilingual Text
export const I18N = {
  en: {
    tagline: 'When every minute matters, finding the right blood should be as simple as searching for it.',
    needBloodNow: 'Need Blood Now',
    emergencySearch: '1-Click Emergency Blood Search',
    verifiedCentres: 'Nearby Verified Blood Centres',
    stockFreshness: 'Stock Freshness',
    callCentre: 'Call Blood Bank',
    directions: 'Get Directions',
    viewDetails: 'Stock Breakdown',
    requestHold: 'Emergency Hold Request',
    sosBroadcast: 'Emergency SOS Network',
    compatibility: 'Blood Compatibility Guide',
    raktSetuAi: 'RaktSetu AI Assistant',
    donors: 'Hero Donors Registry',
    unitsAvailable: 'Units Available',
    outOfStock: 'Reported Out of Stock',
    units: 'units'
  },
  hi: {
    tagline: 'जब हर मिनट कीमती हो, सही रक्त खोजना उतना ही सरल होना चाहिए जितना कि एक खोज करना।',
    needBloodNow: 'तत्काल रक्त चाहिए',
    emergencySearch: '1-क्लिक आपातकालीन रक्त खोज',
    verifiedCentres: 'सत्यापित नजदीकी रक्त केंद्र',
    stockFreshness: 'स्टॉक ताजगी',
    callCentre: 'कॉल करें',
    directions: 'दिशा देखें',
    viewDetails: 'स्टॉक विवरण',
    requestHold: 'आपातकालीन रिज़र्वेशन',
    sosBroadcast: 'इमरजेंसी SOS नेटवर्क',
    compatibility: 'रक्त अनुकूलता मार्गदर्शिका',
    raktSetuAi: 'रक्तसेतु AI सहायक',
    donors: 'दाता सूची',
    unitsAvailable: 'उपलब्ध यूनिट्स',
    outOfStock: 'स्टॉक उपलब्ध नहीं',
    units: 'यूनिट'
  }
};

// Main App Render Function
export function renderApp() {
  const root = document.getElementById('app-root');
  if (!root) return;

  const {
    activeRole,
    activeTab,
    searchParams,
    userCoords,
    selectedCity,
    sosRequests,
    donors,
    hospitalRequisitions,
    language,
    soundEnabled
  } = store.state;

  const t = I18N[language] || I18N.en;
  const activeSosCount = sosRequests.filter(s => s.status !== 'resolved').length;

  root.innerHTML = `
    <!-- Top Emergency Announcement Marquee -->
    <div class="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-900 text-white text-xs font-semibold py-1.5 px-4 overflow-hidden border-b border-brand-500/30">
      <div class="flex items-center justify-between max-w-7xl mx-auto gap-4">
        <div class="flex items-center gap-2 whitespace-nowrap">
          <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
            LIVE 24x7
          </span>
          <span class="hidden sm:inline">Verified Emergency Blood Coordination Grid • Delhi NCR, Gurugram, Noida, Mumbai, Bengaluru</span>
        </div>
        <div class="flex items-center gap-4 text-[11px] whitespace-nowrap">
          <span class="text-red-200">National Helpline: <a href="tel:104" class="underline font-bold text-white hover:text-red-200">104 / 112</a></span>
          <button id="btn-toggle-sound" class="text-xs hover:text-red-200 flex items-center gap-1 opacity-90 hover:opacity-100">
            <i data-lucide="${soundEnabled ? 'volume-2' : 'volume-x'}" class="w-3.5 h-3.5"></i>
            <span>${soundEnabled ? 'Alert Sound ON' : 'Muted'}</span>
          </button>
          <button id="btn-toggle-lang" class="text-xs px-2 py-0.5 rounded bg-brand-800/80 hover:bg-brand-600 font-bold">
            ${language === 'en' ? 'हिंदी' : 'English'}
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation Header -->
    <header class="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-4">
          
          <!-- Brand Logo -->
          <div class="flex items-center gap-3 cursor-pointer" onclick="window.setAppTab('search')">
            <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/40">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
              </svg>
              <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-xl font-extrabold font-heading tracking-tight text-white">RaktSetu</span>
                <span class="text-xs font-semibold text-brand-400 font-sans">रक्तसेतु</span>
              </div>
              <p class="text-[10px] text-slate-400 font-medium hidden sm:block">Emergency Blood Discovery & Coordination</p>
            </div>
          </div>

          <!-- Main Desktop Navigation Tabs -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button onclick="window.setAppTab('search')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'search' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'}">
              <i data-lucide="search" class="w-3.5 h-3.5"></i>
              <span>Emergency Search</span>
            </button>
            <button onclick="window.setAppTab('map')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'map' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'}">
              <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
              <span>Live Map View</span>
            </button>
            <button onclick="window.setAppTab('sos_network')" class="relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'sos_network' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'}">
              <i data-lucide="radio" class="w-3.5 h-3.5 text-red-400"></i>
              <span>Emergency SOS</span>
              ${activeSosCount > 0 ? `<span class="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse">${activeSosCount}</span>` : ''}
            </button>
            <button onclick="window.setAppTab('ai_assistant')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'ai_assistant' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'}">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-300"></i>
              <span>RaktSetu AI</span>
            </button>
            <button onclick="window.setAppTab('compatibility')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'compatibility' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'}">
              <i data-lucide="activity" class="w-3.5 h-3.5"></i>
              <span>Compatibility</span>
            </button>
            <button onclick="window.setAppTab('donors')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'donors' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'}">
              <i data-lucide="users" class="w-3.5 h-3.5"></i>
              <span>Hero Donors</span>
            </button>
          </nav>

          <!-- Right Action Bar & Role Selector -->
          <div class="flex items-center gap-2.5">
            
            <!-- Quick SOS Trigger Button -->
            <button onclick="window.openSosModal()" class="relative group flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-red-600 to-brand-600 hover:from-red-500 hover:to-brand-500 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-red-600/40 emergency-beacon transition-all transform active:scale-95">
              <i data-lucide="zap" class="w-4 h-4 text-amber-200 fill-amber-200 animate-bounce"></i>
              <span class="hidden sm:inline">BROADCAST SOS</span>
              <span class="sm:hidden">SOS</span>
            </button>

            <!-- Role Portal Selector Dropdown -->
            <div class="relative">
              <select id="role-selector" class="bg-slate-900 text-slate-200 text-xs font-bold border border-slate-700 rounded-xl px-2.5 py-2 pr-7 cursor-pointer hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="patient" ${activeRole === 'patient' ? 'selected' : ''}>👤 Public / Patient Portal</option>
                <option value="blood_centre" ${activeRole === 'blood_centre' ? 'selected' : ''}>🏥 Blood Centre Dashboard</option>
                <option value="hospital" ${activeRole === 'hospital' ? 'selected' : ''}>🏨 Hospital Emergency Desk</option>
                <option value="admin" ${activeRole === 'admin' ? 'selected' : ''}>🛡️ Admin Control Desk</option>
              </select>
            </div>

          </div>
        </div>

        <!-- Mobile Horizontal Tab Bar -->
        <div class="md:hidden flex items-center overflow-x-auto py-2 gap-1.5 border-t border-slate-800/80 no-scrollbar">
          <button onclick="window.setAppTab('search')" class="whitespace-nowrap px-3 py-1 rounded-xl text-xs font-bold ${activeTab === 'search' ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400'}">Search</button>
          <button onclick="window.setAppTab('map')" class="whitespace-nowrap px-3 py-1 rounded-xl text-xs font-bold ${activeTab === 'map' ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400'}">Live Map</button>
          <button onclick="window.setAppTab('sos_network')" class="whitespace-nowrap px-3 py-1 rounded-xl text-xs font-bold ${activeTab === 'sos_network' ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400'}">SOS Alerts (${activeSosCount})</button>
          <button onclick="window.setAppTab('ai_assistant')" class="whitespace-nowrap px-3 py-1 rounded-xl text-xs font-bold ${activeTab === 'ai_assistant' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}">AI Guide</button>
          <button onclick="window.setAppTab('compatibility')" class="whitespace-nowrap px-3 py-1 rounded-xl text-xs font-bold ${activeTab === 'compatibility' ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400'}">Compatibility</button>
          <button onclick="window.setAppTab('donors')" class="whitespace-nowrap px-3 py-1 rounded-xl text-xs font-bold ${activeTab === 'donors' ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400'}">Donors</button>
        </div>
      </div>
    </header>

    <!-- Main Dynamic Content Body based on Role & Tab -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      ${renderRoleView(activeRole, activeTab, t)}
    </main>

    <!-- Global Modals Render -->
    ${renderModals()}

    <!-- Simple Footer with Medical & Legal Disclaimer -->
    <footer class="mt-auto bg-slate-950 border-t border-slate-900 py-8 text-slate-400 text-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-white text-sm">RaktSetu (रक्तसेतु)</span>
            <span class="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-bold">Govt & NABH Integrated</span>
          </div>
          <p class="text-slate-400 mt-1 max-w-xl text-[11px] leading-relaxed">
            RaktSetu is a digital discovery and coordination bridge connecting emergency patients with licensed blood centres. Actual testing, cross-matching, reservation, and issuance are strictly governed by authorized medical practitioners and transfusion officers.
          </p>
        </div>
        <div class="flex items-center gap-4 text-xs font-semibold">
          <a href="#" onclick="window.openMedicalDisclaimer(); return false;" class="text-slate-400 hover:text-white underline">Transfusion Protocols</a>
          <a href="#" onclick="window.openDonorRegistration(); return false;" class="text-brand-400 hover:text-brand-300">Register as Hero Donor</a>
          <button onclick="window.triggerSimulatedStockUpdate()" class="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-[11px] flex items-center gap-1.5">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i>
            <span>Simulate Live Stock Update</span>
          </button>
        </div>
      </div>
    </footer>
  `;

  // Initialize Lucide Icons
  lucide.createIcons();

  // Attach Event Handlers
  attachEventHandlers();

  // If Map Tab is Active, Initialize Leaflet Map
  if (activeTab === 'map') {
    initLeafletMap();
  }
}

// Render Content based on Role View
function renderRoleView(role, tab, t) {
  if (role === 'blood_centre') {
    return renderBloodCentrePortal();
  } else if (role === 'hospital') {
    return renderHospitalPortal();
  } else if (role === 'admin') {
    return renderAdminPortal();
  }

  // Default: Patient / Public Portal Tabs
  switch (tab) {
    case 'map':
      return renderMapView();
    case 'sos_network':
      return renderSosNetworkView();
    case 'ai_assistant':
      return renderAiAssistantView();
    case 'compatibility':
      return renderCompatibilityView();
    case 'donors':
      return renderDonorsView();
    case 'search':
    default:
      return renderPatientSearchView(t);
  }
}

// ----------------------------------------------------------------------------
// VIEW 1: Patient / Public Emergency Search View
// ----------------------------------------------------------------------------
function renderPatientSearchView(t) {
  const { searchParams, selectedCity, userCoords } = store.state;
  const rankedCentres = getRankedCentres();
  const exactMatches = rankedCentres.filter(c => c.isExactStockAvailable);
  const partialMatches = rankedCentres.filter(c => c.isLowStock);
  const outOfStockMatches = rankedCentres.filter(c => c.isOutOfStock);

  return `
    <div class="space-y-6">

      <!-- Hero Emergency 1-Click Search Hub -->
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div class="relative z-10 space-y-6">
          
          <!-- Heading & Mission -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/40 text-brand-300 text-xs font-bold mb-2">
                <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>EMERGENCY MODE ACTIVE • FAST TRACK</span>
              </div>
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black font-heading tracking-tight text-white">
                Find The Right Blood, <span class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-brand-400 to-rose-300">Faster</span>
              </h1>
              <p class="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
                Real-time verified inventory across accredited blood centres. Save hours calling hospitals in critical moments.
              </p>
            </div>

            <!-- City Location Switcher & GPS Detector -->
            <div class="flex items-center gap-2 self-start md:self-auto bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
              <i data-lucide="map-pin" class="w-4 h-4 text-brand-400 ml-2"></i>
              <select id="city-selector" class="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-4">
                ${CITIES.map(c => `
                  <option value="${c.id}" ${selectedCity === c.id ? 'selected' : ''} class="bg-slate-900 text-white">${c.name}</option>
                `).join('')}
              </select>
              <button id="btn-detect-gps" class="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-all" title="Auto-detect GPS Location">
                <i data-lucide="crosshair" class="w-3 h-3 text-emerald-400"></i>
                <span class="hidden sm:inline">GPS</span>
              </button>
            </div>
          </div>

          <!-- AI Natural-Language Search Box -->
          <div class="relative">
            <div class="flex items-center bg-slate-950/90 border border-brand-500/40 rounded-2xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
              <div class="p-2 text-brand-400">
                <i data-lucide="sparkles" class="w-5 h-5 animate-pulse"></i>
              </div>
              <input
                type="text"
                id="nlp-search-input"
                placeholder="Describe your emergency in normal words (e.g. 'Urgent 2 units O-negative PRBC near Cyber Hub Gurugram')..."
                value="${searchParams.searchQuery || ''}"
                class="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none px-2 font-medium"
              />
              <button id="btn-nlp-search" class="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-brand-600/30">
                <span>Auto-Match</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
            <div class="flex items-center gap-2 mt-2 px-1 text-[11px] text-slate-400 overflow-x-auto no-scrollbar">
              <span class="text-slate-500 whitespace-nowrap font-bold">Quick Examples:</span>
              <button class="nlp-sample-btn hover:text-brand-300 underline whitespace-nowrap" data-query="Need 3 units O- PRBC in Gurugram immediately">"3 units O- PRBC in Gurugram"</button> •
              <button class="nlp-sample-btn hover:text-brand-300 underline whitespace-nowrap" data-query="Urgent SDP Platelets for Dengue patient at Medanta">"SDP Platelets at Medanta"</button> •
              <button class="nlp-sample-btn hover:text-brand-300 underline whitespace-nowrap" data-query="2 units B+ whole blood in Delhi">"2 units B+ blood Delhi"</button>
            </div>
          </div>

          <!-- Structured Emergency Parameters Grid -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
            
            <!-- 1. Blood Group Selector (1-Tap Buttons) -->
            <div class="space-y-1.5 md:col-span-2">
              <label class="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>1. Select Required Blood Group</span>
                <span class="text-[10px] text-brand-400 font-normal">All 8 ABO/Rh + Rare Phenotypes</span>
              </label>
              <div class="grid grid-cols-5 sm:grid-cols-5 gap-1.5">
                ${BLOOD_GROUPS.map(bg => `
                  <button
                    data-bg="${bg}"
                    class="btn-select-bg py-2 px-1 rounded-xl text-xs font-extrabold transition-all border ${searchParams.bloodGroup === bg ? 'bg-brand-600 text-white border-brand-400 shadow-md shadow-brand-600/40 scale-[1.02]' : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-600 hover:bg-slate-800'}"
                  >
                    ${bg}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 2. Blood Component Selector -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>2. Blood Component</span>
              </label>
              <select id="component-selector" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                ${BLOOD_COMPONENTS.map(comp => `
                  <option value="${comp.id}" ${searchParams.component === comp.id ? 'selected' : ''}>
                    ${comp.name}
                  </option>
                `).join('')}
              </select>
              <p class="text-[10px] text-slate-400 leading-tight">
                ${BLOOD_COMPONENTS.find(c => c.id === searchParams.component)?.desc || ''}
              </p>
            </div>

            <!-- 3. Quantity & Urgency Filter -->
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-300">3. Units</label>
                <div class="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                  <button id="btn-qty-minus" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center">-</button>
                  <span id="qty-display" class="flex-1 text-center text-xs font-extrabold text-white">${searchParams.quantity}</span>
                  <button id="btn-qty-plus" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center">+</button>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-300">4. Urgency</label>
                <select id="urgency-selector" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="critical" ${searchParams.urgency === 'critical' ? 'selected' : ''}>🔴 Immediate (&lt;1h)</option>
                  <option value="urgent" ${searchParams.urgency === 'urgent' ? 'selected' : ''}>🟠 Urgent (1-4h)</option>
                  <option value="planned" ${searchParams.urgency === 'planned' ? 'selected' : ''}>🟢 Planned (24h)</option>
                </select>
              </div>
            </div>

          </div>

          <!-- Secondary Filters Row (Radius, Sort By, Verified Badge) -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
            <div class="flex flex-wrap items-center gap-3">
              <span class="text-slate-400 font-semibold">Radius:</span>
              <div class="flex items-center gap-1">
                ${[10, 25, 50].map(r => `
                  <button data-radius="${r}" class="btn-radius px-2.5 py-1 rounded-lg text-xs font-bold ${searchParams.radiusKm === r ? 'bg-slate-700 text-white border border-slate-500' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'}">${r} km</button>
                `).join('')}
              </div>

              <label class="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer ml-2">
                <input type="checkbox" id="chk-verified-only" ${searchParams.verifiedOnly ? 'checked' : ''} class="rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-brand-500">
                <span>NABH / Govt Verified Only</span>
              </label>

              <label class="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input type="checkbox" id="chk-24x7-only" ${searchParams.is24x7Only ? 'checked' : ''} class="rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-brand-500">
                <span>24x7 Open Only</span>
              </label>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-semibold">Sort By:</span>
              <select id="sort-selector" class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-bold focus:outline-none">
                <option value="smart" ${searchParams.sortBy === 'smart' ? 'selected' : ''}>⚡ Smart Match (Recommended)</option>
                <option value="distance" ${searchParams.sortBy === 'distance' ? 'selected' : ''}>📍 Distance (Closest First)</option>
                <option value="stock" ${searchParams.sortBy === 'stock' ? 'selected' : ''}>📦 Highest Stock First</option>
                <option value="freshness" ${searchParams.sortBy === 'freshness' ? 'selected' : ''}>⏱️ Newest Update First</option>
              </select>
            </div>
          </div>

        </div>
      </section>

      <!-- Live Search Results Header & Metrics -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h2 class="text-xl font-bold font-heading text-white flex items-center gap-2">
            <span>Verified Centres for <strong class="text-brand-400">${searchParams.bloodGroup}</strong> ${BLOOD_COMPONENTS.find(c => c.id === searchParams.component)?.short}</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">${rankedCentres.length} Found</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Ranked by proximity from <strong>${userCoords.name}</strong>, verified stock availability, and update freshness.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="window.setAppTab('map')" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all">
            <i data-lucide="map" class="w-3.5 h-3.5 text-sky-400"></i>
            <span>Switch to Map View</span>
          </button>
        </div>
      </div>

      <!-- Result Cards Container -->
      <div class="space-y-4">
        ${rankedCentres.length === 0 ? `
          <div class="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-4">
            <div class="w-14 h-14 bg-red-950/60 rounded-full flex items-center justify-center text-red-400 mx-auto border border-red-800">
              <i data-lucide="alert-octagon" class="w-7 h-7"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">No Centres Found Within Selected Radius</h3>
              <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">
                No blood banks within ${searchParams.radiusKm} km match your exact criteria. You can widen your radius or trigger an Emergency SOS broadcast across our verified hospital and donor network.
              </p>
            </div>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button onclick="window.setSearchRadius(50)" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white">
                Expand to 50 km
              </button>
              <button onclick="window.openSosModal()" class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white emergency-beacon">
                Broadcast Emergency SOS
              </button>
            </div>
          </div>
        ` : rankedCentres.map((centre, index) => renderCentreCard(centre, index, searchParams)).join('')}
      </div>

      <!-- No Stock / Rare Blood Group Fallback SOS Banner -->
      ${exactMatches.length === 0 ? `
        <div class="p-6 rounded-3xl bg-gradient-to-r from-brand-950 via-slate-900 to-brand-950 border border-brand-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">CRITICAL AVAILABILITY</span>
              <h4 class="text-sm font-bold text-white">Blood inventory is low/scarce in nearby centres</h4>
            </div>
            <p class="text-xs text-slate-300 max-w-2xl">
              Do not lose valuable time traveling without confirmation. RaktSetu can immediately broadcast an emergency requisition ticket to verified hospitals and eligible on-call donors in ${selectedCity}.
            </p>
          </div>
          <button onclick="window.openSosModal()" class="whitespace-nowrap px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs tracking-wider shadow-lg shadow-brand-600/50 emergency-beacon">
            ACTIVATE EMERGENCY SOS
          </button>
        </div>
      ` : ''}

    </div>
  `;
}

// ----------------------------------------------------------------------------
// Centre Card Render Helper
// ----------------------------------------------------------------------------
function renderCentreCard(centre, index, searchParams) {
  const { bloodGroup, component, quantity } = searchParams;
  const isTopMatch = index === 0 && centre.availableUnits >= quantity;
  const componentInfo = BLOOD_COMPONENTS.find(c => c.id === component);

  // Stock Status Indicator
  let stockBadgeHtml = '';
  if (centre.availableUnits >= quantity) {
    stockBadgeHtml = `
      <div class="text-right">
        <span class="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">${centre.availableUnits}</span>
        <span class="text-xs text-emerald-300 font-bold block">Units Available</span>
      </div>
    `;
  } else if (centre.availableUnits > 0) {
    stockBadgeHtml = `
      <div class="text-right">
        <span class="text-2xl sm:text-3xl font-black text-amber-400 font-mono">${centre.availableUnits}</span>
        <span class="text-xs text-amber-300 font-bold block">Low Stock (&lt; ${quantity} needed)</span>
      </div>
    `;
  } else {
    stockBadgeHtml = `
      <div class="text-right">
        <span class="text-2xl sm:text-3xl font-black text-red-400 font-mono">0</span>
        <span class="text-xs text-red-300 font-bold block">Out of Stock</span>
      </div>
    `;
  }

  return `
    <div class="glass-card glass-card-hover rounded-3xl p-5 sm:p-6 transition-all relative overflow-hidden ${isTopMatch ? 'border-brand-500/60 shadow-lg shadow-brand-900/20' : ''}">
      
      ${isTopMatch ? `
        <div class="absolute top-0 right-0 bg-gradient-to-l from-brand-600 to-transparent text-white text-[10px] font-extrabold px-4 py-1 rounded-bl-2xl">
          ⭐ TOP RECOMMENDED MATCH
        </div>
      ` : ''}

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        <!-- Left Details -->
        <div class="space-y-3 flex-1">
          
          <!-- Verification Badges & Freshness Ticker -->
          <div class="flex flex-wrap items-center gap-2 text-[11px]">
            ${centre.nabhAccredited ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                <i data-lucide="shield-check" class="w-3 h-3 text-sky-400"></i>
                <span>NABH Accredited</span>
              </span>
            ` : ''}
            ${centre.govtRecognized ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                <i data-lucide="award" class="w-3 h-3 text-emerald-400"></i>
                <span>Govt Recognized</span>
              </span>
            ` : ''}
            ${centre.is24x7 ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                <i data-lucide="clock" class="w-3 h-3 text-amber-400"></i>
                <span>24x7 Open</span>
              </span>
            ` : ''}
            
            <!-- Stock Freshness Indicator Badge -->
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${centre.freshness.css} font-bold">
              <span>${centre.freshness.label}</span>
            </span>
          </div>

          <!-- Name & Distance Info -->
          <div>
            <h3 class="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <span>${centre.name}</span>
            </h3>
            <p class="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-brand-400 flex-shrink-0"></i>
              <span>${centre.address}</span>
            </p>
          </div>

          <!-- Smart Ranking Score, ETA & Features Pills -->
          <div class="flex flex-wrap items-center gap-4 text-xs pt-1">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 font-semibold">Distance:</span>
              <strong class="text-white font-mono text-sm">${centre.distance} km</strong>
              <span class="text-[11px] text-slate-400 font-mono">(~${Math.round(centre.distance * 2.2 + 5)} mins drive)</span>
            </div>

            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 font-semibold">Match Score:</span>
              <span class="px-2 py-0.5 rounded-lg bg-brand-950 text-brand-300 font-mono font-black border border-brand-800">
                ${centre.smartScore} / 100
              </span>
            </div>

            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 font-semibold">Response:</span>
              <span class="text-amber-300 font-bold flex items-center gap-0.5">
                ★ ${centre.emergencyResponseRating}
              </span>
              <span class="text-slate-500 font-mono text-[11px]">(&lt;${centre.avgResponseMinutes}m avg)</span>
            </div>
          </div>

        </div>

        <!-- Right Stock Status & Action Buttons -->
        <div class="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800">
          
          <!-- Stock Quantity Display -->
          ${stockBadgeHtml}

          <!-- Direct Action Buttons -->
          <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            
            <!-- Call Blood Bank Helpline -->
            <a
              href="tel:${centre.emergencyHelpline || centre.phone}"
              class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/30 transition-all active:scale-95"
            >
              <i data-lucide="phone-call" class="w-4 h-4"></i>
              <span>Call Bank</span>
            </a>

            <!-- Get Directions (Google Maps / Leaflet) -->
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=${centre.lat},${centre.lng}"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
            >
              <i data-lucide="navigation" class="w-4 h-4 text-sky-400"></i>
              <span class="hidden sm:inline">Directions</span>
            </a>

            <!-- View Complete Component Breakdown Modal -->
            <button
              onclick="window.openCentreModal('${centre.id}')"
              class="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1"
              title="View full inventory across all components"
            >
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
              <span>Breakdown</span>
            </button>

            <!-- Emergency Requisition / Hold Request -->
            <button
              onclick="window.openRequisitionModal('${centre.id}')"
              class="px-3 py-2.5 rounded-xl bg-brand-900/80 hover:bg-brand-800 text-brand-200 border border-brand-700 font-bold text-xs transition-all flex items-center gap-1"
            >
              <i data-lucide="bookmark-plus" class="w-3.5 h-3.5"></i>
              <span>Hold Request</span>
            </button>

          </div>

        </div>

      </div>

    </div>
  `;
}

// ----------------------------------------------------------------------------
// VIEW 2: Interactive Leaflet Map View
// ----------------------------------------------------------------------------
function renderMapView() {
  const { searchParams, userCoords } = store.state;
  const rankedCentres = getRankedCentres();

  return `
    <div class="space-y-4">
      
      <!-- Top Map Header Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 class="text-lg font-bold font-heading text-white flex items-center gap-2">
            <i data-lucide="map-pin" class="w-5 h-5 text-brand-500"></i>
            <span>Live Geographic Discovery Map</span>
          </h2>
          <p class="text-xs text-slate-400">
            Visualizing accredited blood centres within <strong>${searchParams.radiusKm} km</strong> of your coordinates.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-xs">
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-emerald-500"></span> In Stock (&gt;= ${searchParams.quantity})</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-amber-500"></span> Low Stock</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-red-500"></span> 0 Units</span>
          </div>
          <button onclick="window.setAppTab('search')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1">
            <i data-lucide="list" class="w-3.5 h-3.5"></i>
            <span>List View</span>
          </button>
        </div>
      </div>

      <!-- Map Container -->
      <div class="relative w-full h-[600px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        <div id="leaflet-map-element" class="w-full h-full"></div>
      </div>

    </div>
  `;
}

// Initialize Leaflet Map Engine
function initLeafletMap() {
  setTimeout(() => {
    const mapElement = document.getElementById('leaflet-map-element');
    if (!mapElement) return;

    const { userCoords, searchParams } = store.state;
    const rankedCentres = getRankedCentres();

    // Destroy existing map instance if any
    if (leafletMap) {
      leafletMap.remove();
      leafletMap = null;
    }

    // Initialize Leaflet Map
    leafletMap = L.map('leaflet-map-element', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([userCoords.lat, userCoords.lng], 12);

    // Dark Matter CartoDB Basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(leafletMap);

    // User Location Pulsing Marker
    const userIcon = L.divIcon({
      className: 'custom-map-pin pin-user',
      html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black">YOU</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
      .addTo(leafletMap)
      .bindPopup(`
        <div class="p-3 text-slate-900">
          <h4 class="font-extrabold text-xs text-sky-900">Your Current Location</h4>
          <p class="text-[11px] text-slate-700 mt-0.5">${userCoords.name}</p>
        </div>
      `);

    // Radius Circle Overlay
    if (searchParams.radiusKm) {
      userRadiusCircle = L.circle([userCoords.lat, userCoords.lng], {
        color: '#ef233c',
        fillColor: '#ef233c',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '5, 5',
        radius: searchParams.radiusKm * 1000
      }).addTo(leafletMap);
    }

    // Plot Blood Centres
    mapMarkers = [];
    rankedCentres.forEach(centre => {
      let pinClass = 'pin-red';
      if (centre.availableUnits >= searchParams.quantity) {
        pinClass = 'pin-green';
      } else if (centre.availableUnits > 0) {
        pinClass = 'pin-yellow';
      }

      const icon = L.divIcon({
        className: `custom-map-pin ${pinClass}`,
        html: `<div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shadow-lg">${centre.availableUnits}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([centre.lat, centre.lng], { icon })
        .addTo(leafletMap)
        .bindPopup(`
          <div class="p-4 bg-slate-900 text-white rounded-2xl max-w-xs space-y-2 border border-slate-700">
            <div>
              <span class="text-[10px] px-2 py-0.5 rounded-full ${centre.freshness.css} font-bold">${centre.freshness.label}</span>
              <h4 class="font-bold text-sm text-white mt-1.5">${centre.name}</h4>
              <p class="text-xs text-slate-400">${centre.address}</p>
            </div>
            <div class="flex items-center justify-between border-t border-slate-800 pt-2 text-xs">
              <div>
                <span class="text-slate-400">Stock (${searchParams.bloodGroup}):</span>
                <strong class="text-emerald-400 font-mono ml-1 text-sm">${centre.availableUnits} Units</strong>
              </div>
              <div>
                <span class="text-slate-400">Distance:</span>
                <strong class="text-white font-mono ml-1">${centre.distance} km</strong>
              </div>
            </div>
            <div class="flex items-center gap-2 pt-2">
              <a href="tel:${centre.emergencyHelpline || centre.phone}" class="flex-1 text-center py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg">Call Now</a>
              <button onclick="window.openCentreModal('${centre.id}')" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg">Details</button>
            </div>
          </div>
        `);

      mapMarkers.push(marker);
    });

  }, 100);
}

// ----------------------------------------------------------------------------
// VIEW 3: Emergency SOS Broadcast Network & Live Tracker
// ----------------------------------------------------------------------------
function renderSosNetworkView() {
  const { sosRequests } = store.state;

  return `
    <div class="space-y-6">
      
      <!-- Top Broadcast Banner -->
      <div class="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 border border-brand-500/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-800 text-xs font-bold">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>PUBLIC EMERGENCY BROADCAST GRID</span>
          </div>
          <h2 class="text-2xl font-black font-heading text-white">
            Emergency Blood Request Network
          </h2>
          <p class="text-xs text-slate-300 max-w-xl">
            When blood centres face severe shortages, RaktSetu broadcasts high-priority alerts to verified hospitals, nearby blood banks, and verified voluntary hero donors.
          </p>
        </div>

        <button onclick="window.openSosModal()" class="whitespace-nowrap px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-brand-600 hover:from-red-500 hover:to-brand-500 text-white font-black text-xs tracking-wider shadow-xl shadow-red-600/40 emergency-beacon transition-all transform active:scale-95">
          + CREATE NEW EMERGENCY SOS
        </button>
      </div>

      <!-- Live Requests Feed -->
      <div class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-lg font-bold font-heading text-white flex items-center gap-2">
            <i data-lucide="radio" class="w-4 h-4 text-red-500 animate-pulse"></i>
            <span>Active Emergency Requisitions (${sosRequests.length})</span>
          </h3>
          <span class="text-xs text-slate-400">Live Real-Time Status</span>
        </div>

        <div class="space-y-4">
          ${sosRequests.map(req => renderSosCard(req)).join('')}
        </div>
      </div>

    </div>
  `;
}

// SOS Ticket Card Render
function renderSosCard(req) {
  const statusColors = {
    broadcasted: 'bg-red-950 text-red-300 border-red-800',
    matching: 'bg-sky-950 text-sky-300 border-sky-800',
    notified: 'bg-amber-950 text-amber-300 border-amber-800',
    coordinating: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    resolved: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  };

  const steps = [
    { key: 'broadcasted', label: '1. Broadcasted' },
    { key: 'matching', label: '2. Matched' },
    { key: 'notified', label: '3. Donors Alerted' },
    { key: 'coordinating', label: '4. Coordinating' },
    { key: 'resolved', label: '5. Transfused / Closed' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === req.status);

  return `
    <div class="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-5">
      
      <!-- Top Row Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-brand-950 border border-brand-800 text-brand-400 flex items-center justify-center font-mono font-black text-lg shadow-inner">
            ${req.bloodGroup}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-slate-400">${req.id}</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusColors[req.status] || 'bg-slate-800'}">
                ${req.status.toUpperCase()}
              </span>
              <span class="text-[11px] text-slate-500 font-mono">• ${formatRelativeTime(req.createdAt)}</span>
            </div>
            <h4 class="text-base font-bold text-white mt-0.5">
              ${req.patientName} (${req.patientAge}y) • ${req.unitsRequired} Units ${BLOOD_COMPONENTS.find(c => c.id === req.component)?.short || 'PRBC'}
            </h4>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- WhatsApp Quick Share Card -->
          <button onclick="window.shareSosWhatsApp('${req.id}')" class="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all" title="Share formatted emergency card on WhatsApp">
            <i data-lucide="share-2" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>WhatsApp Alert</span>
          </button>

          <!-- Printable Hospital Slip -->
          <button onclick="window.printRequisitionSlip('${req.id}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            <span>Print Slip</span>
          </button>

          <!-- Stage Simulator / Admin Progress -->
          <button onclick="window.advanceSosStage('${req.id}')" class="px-3 py-1.5 bg-brand-900/60 hover:bg-brand-800 text-brand-200 border border-brand-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all" title="Advance status to next stage">
            <i data-lucide="fast-forward" class="w-3.5 h-3.5"></i>
            <span>Next Stage</span>
          </button>
        </div>
      </div>

      <!-- Hospital Location & Case Details -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850">
        <div>
          <span class="text-slate-500 block">Hospital & Ward:</span>
          <strong class="text-slate-200">${req.hospitalName}</strong>
          <span class="text-slate-400 block text-[11px]">${req.hospitalBed}</span>
        </div>
        <div>
          <span class="text-slate-500 block">Attendant / Contact:</span>
          <strong class="text-slate-200">${req.patientAttendant}</strong>
          <a href="tel:${req.contactPhone}" class="text-brand-400 hover:underline block text-[11px] font-mono">${req.contactPhone}</a>
        </div>
        <div>
          <span class="text-slate-500 block">Medical Reason:</span>
          <p class="text-slate-300 text-[11px] leading-relaxed line-clamp-2">${req.reason}</p>
        </div>
      </div>

      <!-- Visual 5-Stage Live Progress Stepper -->
      <div class="space-y-2 pt-1">
        <div class="grid grid-cols-5 gap-1.5">
          ${steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return `
              <div class="text-center space-y-1">
                <div class="h-2 rounded-full transition-all ${isCurrent ? 'bg-brand-500 animate-pulse' : (isCompleted ? 'bg-emerald-500' : 'bg-slate-800')}"></div>
                <span class="text-[10px] font-bold block ${isCurrent ? 'text-brand-400' : (isCompleted ? 'text-emerald-400' : 'text-slate-500')}">
                  ${step.label}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Live Timeline Log -->
      <div class="space-y-1.5 border-t border-slate-800 pt-3">
        <span class="text-[11px] font-bold text-slate-400">Activity Log & Verification Updates:</span>
        <div class="space-y-1 max-h-24 overflow-y-auto pr-1">
          ${req.statusHistory.map(h => `
            <div class="flex items-start gap-2 text-[11px] text-slate-300">
              <span class="text-slate-500 font-mono whitespace-nowrap">${formatRelativeTime(h.time)}</span>
              <span class="font-bold text-white">• ${h.title}:</span>
              <span class="text-slate-400">${h.note}</span>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

// ----------------------------------------------------------------------------
// VIEW 4: RaktSetu AI Emergency Assistant & Guide
// ----------------------------------------------------------------------------
function renderAiAssistantView() {
  const { aiChatHistory } = store.state;

  return `
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- AI Header -->
      <div class="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-800/60 rounded-3xl p-6 shadow-2xl space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/80 text-indigo-300 border border-indigo-700 text-xs font-bold">
          <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-300"></i>
          <span>AI EMERGENCY TRANSFUSION ASSISTANT</span>
        </div>
        <h2 class="text-2xl font-black font-heading text-white">
          RaktSetu AI Emergency Consultation
        </h2>
        <p class="text-xs text-slate-300 max-w-2xl">
          Get instantaneous answers regarding blood compatibility rules, emergency red cell substitutes, platelet apheresis eligibility, and emergency coordination procedures.
        </p>
      </div>

      <!-- Quick Emergency Prompt Chips -->
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="text-slate-400 font-bold">Ask AI:</span>
        <button class="ai-chip px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold" data-prompt="What blood group can be given to an O- patient in an extreme emergency?">
          "Can O- receive from any other group?"
        </button>
        <button class="ai-chip px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold" data-prompt="Explain Bombay Blood Group and how to coordinate rare blood units in India.">
          "What is Bombay blood group?"
        </button>
        <button class="ai-chip px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold" data-prompt="What documents and samples must a family bring to a blood bank to collect PRBC units?">
          "Required documents for blood collection?"
        </button>
      </div>

      <!-- Chat Thread Container -->
      <div class="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <div id="ai-chat-thread" class="space-y-4 max-h-[420px] overflow-y-auto pr-2">
          ${aiChatHistory.map(msg => `
            <div class="flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
              ${msg.sender === 'ai' ? `
                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <i data-lucide="bot" class="w-4 h-4"></i>
                </div>
              ` : ''}
              <div class="max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-brand-600 text-white font-medium rounded-br-none shadow-md shadow-brand-600/30' : 'bg-slate-900 border border-slate-700 text-slate-200 rounded-bl-none shadow-inner'}">
                ${msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
              </div>
              ${msg.sender === 'user' ? `
                <div class="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0">
                  <i data-lucide="user" class="w-4 h-4"></i>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Chat Input Bar -->
        <div class="flex items-center gap-2 pt-3 border-t border-slate-800">
          <input
            type="text"
            id="ai-chat-input"
            placeholder="Type your question or emergency requirement..."
            class="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button id="btn-send-ai-chat" class="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30">
            <span>Ask</span>
            <i data-lucide="send" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

    </div>
  `;
}

// ----------------------------------------------------------------------------
// VIEW 5: Interactive Blood Compatibility Matrix
// ----------------------------------------------------------------------------
function renderCompatibilityView() {
  const { searchParams } = store.state;
  const currentGroup = searchParams.bloodGroup;
  const info = COMPATIBILITY_RULES[currentGroup] || COMPATIBILITY_RULES['O-'];

  return `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <h2 class="text-2xl font-black font-heading text-white flex items-center gap-2">
          <i data-lucide="activity" class="w-6 h-6 text-brand-500"></i>
          <span>Blood & Plasma Compatibility Reference Grid</span>
        </h2>
        <p class="text-xs text-slate-300 max-w-2xl">
          Understand transfusion compatibility rules for Red Blood Cells (PRBC/Whole Blood) and Fresh Frozen Plasma (FFP).
        </p>
      </div>

      <!-- Quick Interactive Focus Selector -->
      <div class="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">
        <div>
          <label class="text-xs font-bold text-slate-400 block mb-2">Select Patient Blood Group to View Compatible Transfusions:</label>
          <div class="grid grid-cols-5 sm:grid-cols-10 gap-2">
            ${BLOOD_GROUPS.map(bg => `
              <button data-compat-bg="${bg}" class="btn-compat-bg py-2.5 rounded-xl text-xs font-black border ${currentGroup === bg ? 'bg-brand-600 text-white border-brand-400 shadow-lg shadow-brand-600/40 scale-105' : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'}">
                ${bg}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Detail Breakdown for Selected Blood Group -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
          
          <!-- Red Blood Cells Compatibility -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-brand-400 flex items-center gap-2">
              <i data-lucide="droplet" class="w-4 h-4 text-red-500 fill-red-500"></i>
              <span>Red Blood Cells (PRBC) Transfusion Rules</span>
            </h3>

            <div class="space-y-2">
              <span class="text-xs text-slate-400 block">Can Safely Receive Red Cells From:</span>
              <div class="flex flex-wrap gap-2">
                ${(info.canReceiveRBCFrom || []).map(bg => `
                  <span class="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-black">
                    ✓ ${bg}
                  </span>
                `).join('')}
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-xs text-slate-400 block">Can Safely Donate Red Cells To:</span>
              <div class="flex flex-wrap gap-2">
                ${(info.canGiveRBCTo || []).map(bg => `
                  <span class="px-3 py-1 bg-sky-950 text-sky-300 border border-sky-800 rounded-xl text-xs font-black">
                    → ${bg}
                  </span>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Plasma (FFP) Compatibility -->
          <div class="space-y-4 md:border-l md:border-slate-800 md:pl-6">
            <h3 class="text-sm font-bold text-amber-400 flex items-center gap-2">
              <i data-lucide="shield" class="w-4 h-4 text-amber-400"></i>
              <span>Plasma (FFP) Transfusion Rules</span>
            </h3>

            <div class="space-y-2">
              <span class="text-xs text-slate-400 block">Can Safely Receive Plasma From:</span>
              <div class="flex flex-wrap gap-2">
                ${(info.canReceivePlasmaFrom || ['Compatible ABO']).map(bg => `
                  <span class="px-3 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-xl text-xs font-black">
                    ✓ ${bg}
                  </span>
                `).join('')}
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-xs text-slate-400 block">Can Safely Donate Plasma To:</span>
              <div class="flex flex-wrap gap-2">
                ${(info.canGivePlasmaTo || ['Compatible ABO']).map(bg => `
                  <span class="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-black">
                    → ${bg}
                  </span>
                `).join('')}
              </div>
            </div>
          </div>

        </div>

        <!-- Clinical Notes Box -->
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
          <i data-lucide="info" class="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0"></i>
          <div>
            <strong class="text-white">Clinical Note:</strong> ${info.notes || 'Crossmatching is mandatory before transfusion.'}
          </div>
        </div>

      </div>

    </div>
  `;
}

// ----------------------------------------------------------------------------
// VIEW 6: Voluntary Hero Donors Registry
// ----------------------------------------------------------------------------
function renderDonorsView() {
  const { donors } = store.state;

  return `
    <div class="space-y-6">
      
      <!-- Top Banner -->
      <div class="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border border-rose-800/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold">
            <i data-lucide="heart-handshake" class="w-3.5 h-3.5 text-red-400"></i>
            <span>COMMUNITY LIFESAVER NETWORK</span>
          </div>
          <h2 class="text-2xl font-black font-heading text-white">
            Verified Voluntary Hero Donors
          </h2>
          <p class="text-xs text-slate-300 max-w-xl">
            Pre-screened, voluntary non-remunerated donors who have pledged to respond to emergency calls within 30-45 minutes.
          </p>
        </div>

        <button onclick="window.openDonorRegistration()" class="whitespace-nowrap px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs tracking-wider shadow-lg shadow-emerald-700/30 transition-all">
          + REGISTER AS HERO DONOR
        </button>
      </div>

      <!-- Donors Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${donors.map(dn => `
          <div class="glass-card rounded-3xl p-5 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center font-mono font-black text-lg shadow-inner">
                  ${dn.bloodGroup}
                </div>
                <div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold border border-slate-700">
                    ${dn.badge}
                  </span>
                  <h4 class="text-sm font-bold text-white mt-1">${dn.name}</h4>
                  <p class="text-[11px] text-slate-400">${dn.area}</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-3 rounded-xl border border-slate-850">
              <div>
                <span class="text-slate-500 block">Total Donations:</span>
                <strong class="text-white">${dn.donationsCount} times</strong>
              </div>
              <div>
                <span class="text-slate-500 block">ETA Radius:</span>
                <strong class="text-emerald-400">${dn.canTravelMin} mins</strong>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <span class="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Eligible & On-Call</span>
              </span>
              <a href="tel:${dn.phone}" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1">
                <i data-lucide="phone" class="w-3.5 h-3.5"></i>
                <span>Call Donor</span>
              </a>
            </div>
          </div>
        `).join('')}
      </div>

    </div>
  `;
}

// ----------------------------------------------------------------------------
// VIEW 7: Blood Centre Inventory Management Dashboard
// ----------------------------------------------------------------------------
function renderBloodCentrePortal() {
  const { bloodCentres } = store.state;
  const currentCentre = bloodCentres[0]; // Active managed blood centre (Medanta)

  return `
    <div class="space-y-6">
      
      <!-- Centre Dashboard Header -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 text-xs font-bold">
              LICENSED BLOOD CENTRE DESK
            </span>
            <span class="text-xs text-slate-400 font-mono">Lic: ${currentCentre.licenseNumber}</span>
          </div>
          <h2 class="text-2xl font-black font-heading text-white mt-1">
            ${currentCentre.name}
          </h2>
          <p class="text-xs text-slate-400">${currentCentre.address}</p>
        </div>

        <div class="flex items-center gap-3">
          <button onclick="window.refreshCentreTimestamp('${currentCentre.id}')" class="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-700/30 transition-all">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            <span>Sync Timestamp to NOW</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div class="glass-card p-4 rounded-2xl border border-slate-800">
          <span class="text-slate-400">Total Blood Units:</span>
          <p class="text-2xl font-black text-white font-mono mt-1">162 Units</p>
        </div>
        <div class="glass-card p-4 rounded-2xl border border-slate-800">
          <span class="text-slate-400">Last Verified Sync:</span>
          <p class="text-xs font-bold text-emerald-400 font-mono mt-2">${formatRelativeTime(currentCentre.lastStockUpdate)}</p>
        </div>
        <div class="glass-card p-4 rounded-2xl border border-slate-800">
          <span class="text-slate-400">Emergency Dispatches Today:</span>
          <p class="text-2xl font-black text-brand-400 font-mono mt-1">18 Dispatches</p>
        </div>
        <div class="glass-card p-4 rounded-2xl border border-slate-800">
          <span class="text-slate-400">Operating Status:</span>
          <p class="text-xs font-extrabold text-emerald-300 font-mono mt-2">24x7 STAT Operational</p>
        </div>
      </div>

      <!-- Component-Wise Stock Management Grid -->
      <div class="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-white">Component-Wise Live Inventory Manager</h3>
            <p class="text-xs text-slate-400">Click + / - to adjust current reported stock units in real time.</p>
          </div>
          <span class="text-xs text-slate-400">Auto-saved to Network</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="text-slate-400 border-b border-slate-800">
                <th class="py-2.5 px-3">Blood Group</th>
                <th class="py-2.5 px-3">Packed RBC (PRBC)</th>
                <th class="py-2.5 px-3">Whole Blood (WB)</th>
                <th class="py-2.5 px-3">Single Donor Platelets (SDP)</th>
                <th class="py-2.5 px-3">Platelet Concentrate (RDP)</th>
                <th class="py-2.5 px-3">Plasma (FFP)</th>
                <th class="py-2.5 px-3">Cryoprecipitate</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-850">
              ${BLOOD_GROUPS.map(bg => {
                const stock = currentCentre.stock[bg] || { prbc: 0, wb: 0, sdp: 0, rdp: 0, ffp: 0, cryo: 0 };
                return `
                  <tr class="hover:bg-slate-900/40">
                    <td class="py-3 px-3 font-mono font-black text-white text-sm bg-slate-950/40">${bg}</td>
                    ${['prbc', 'wb', 'sdp', 'rdp', 'ffp', 'cryo'].map(comp => `
                      <td class="py-3 px-3">
                        <div class="flex items-center gap-1.5">
                          <button onclick="window.updateCentreStock('${currentCentre.id}', '${bg}', '${comp}', -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center">-</button>
                          <span class="w-8 text-center font-mono font-bold ${stock[comp] > 0 ? 'text-white' : 'text-slate-600'}">${stock[comp] || 0}</span>
                          <button onclick="window.updateCentreStock('${currentCentre.id}', '${bg}', '${comp}', 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center">+</button>
                        </div>
                      </td>
                    `).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

// ----------------------------------------------------------------------------
// VIEW 8: Hospital Emergency Requisition Desk
// ----------------------------------------------------------------------------
function renderHospitalPortal() {
  const { hospitalRequisitions } = store.state;

  return `
    <div class="space-y-6">
      
      <!-- Hospital Desk Header -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-bold">
              INSTITUTIONAL EMERGENCY DESK
            </span>
            <span class="text-xs text-slate-400 font-mono">Hospital Code: HOSP-NCR-092</span>
          </div>
          <h2 class="text-2xl font-black font-heading text-white mt-1">
            Emergency Transfusion Requisition Portal
          </h2>
          <p class="text-xs text-slate-400">Order, reserve, and track cross-matched blood bags directly with participating centres.</p>
        </div>

        <button onclick="window.openHospitalRequisitionModal()" class="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>Create Emergency Requisition</span>
        </button>
      </div>

      <!-- Requisitions Log Table -->
      <div class="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 class="text-base font-bold text-white">Active Patient Requisitions</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="text-slate-400 border-b border-slate-800">
                <th class="py-3 px-3">Requisition ID</th>
                <th class="py-3 px-3">Patient & UHID</th>
                <th class="py-3 px-3">Doctor</th>
                <th class="py-3 px-3">Bed / OT</th>
                <th class="py-3 px-3">Component Required</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-850">
              ${hospitalRequisitions.map(req => `
                <tr class="hover:bg-slate-900/40">
                  <td class="py-3 px-3 font-mono font-bold text-slate-300">${req.id}</td>
                  <td class="py-3 px-3">
                    <strong class="text-white block">${req.patientName}</strong>
                    <span class="text-[10px] text-slate-500 font-mono">${req.patientUHID}</span>
                  </td>
                  <td class="py-3 px-3 text-slate-300">${req.doctorName}</td>
                  <td class="py-3 px-3 text-slate-300">${req.bedNumber}</td>
                  <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded-lg bg-brand-950 text-brand-300 font-mono font-black border border-brand-800">
                      ${req.units} Units • ${req.bloodGroup} ${req.component.toUpperCase()}
                    </span>
                  </td>
                  <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px]">
                      ${req.status}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <button onclick="window.printRequisitionSlip('${req.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold">
                      Print Voucher
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

// ----------------------------------------------------------------------------
// VIEW 9: Admin Verification & Network Health Desk
// ----------------------------------------------------------------------------
function renderAdminPortal() {
  const { bloodCentres, sosRequests } = store.state;

  return `
    <div class="space-y-6">
      
      <!-- Admin Header -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold">
            PLATFORM REGULATORY & AUDIT CONTROL
          </span>
        </div>
        <h2 class="text-2xl font-black font-heading text-white">
          RaktSetu Network Verification & Health Desk
        </h2>
        <p class="text-xs text-slate-400">Review blood centre licenses, audit emergency SOS requests, and monitor network security.</p>
      </div>

      <!-- Network Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div class="glass-card p-4 rounded-2xl border border-slate-800">
          <span class="text-slate-400">Total Verified Centres:</span>
          <p class="text-2xl font-black text-white font-mono mt-1">${bloodCentres.length}</p>
        </div>
        <div class="glass-card p-4 rounded-2xl border border-slate-800">
          <span class="text-slate-400">NABH Compliance Rate:</span>
          <p class="text-2xl font-black text-emerald-450 text-emerald-400 font-mono mt-1">100%</p>
        </div>
        <div class="glass-card p-4 rounded-2xl border border-slate-800">
          <span class="text-slate-400">Active SOS Alerts:</span>
          <p class="text-2xl font-black text-red-400 font-mono mt-1">${sosRequests.filter(s => s.status !== 'resolved').length}</p>
        </div>
        <div class="glass-card p-4 rounded-2xl border border-slate-800">
          <span class="text-slate-400">Fraud / Abuse Flags:</span>
          <p class="text-2xl font-black text-emerald-400 font-mono mt-1">0 Active</p>
        </div>
      </div>

      <!-- Verified Centres Compliance Table -->
      <div class="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 class="text-base font-bold text-white">Verified Blood Bank Registrations</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="text-slate-400 border-b border-slate-800">
                <th class="py-3 px-3">Centre Name</th>
                <th class="py-3 px-3">State / City</th>
                <th class="py-3 px-3">Drug Controller License</th>
                <th class="py-3 px-3">Accreditation</th>
                <th class="py-3 px-3">Nodal Officer</th>
                <th class="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-850">
              ${bloodCentres.map(c => `
                <tr class="hover:bg-slate-900/40">
                  <td class="py-3 px-3 font-bold text-white">${c.name}</td>
                  <td class="py-3 px-3 text-slate-300">${c.area}</td>
                  <td class="py-3 px-3 font-mono text-slate-400">${c.licenseNumber}</td>
                  <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold">
                      ${c.nabhAccredited ? 'NABH Certified' : 'State Council'}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-slate-300">${c.nodalOfficer}</td>
                  <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px]">
                      VERIFIED ACTIVE
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

// ----------------------------------------------------------------------------
// MODALS & OVERLAYS RENDER
// ----------------------------------------------------------------------------
function renderModals() {
  const { selectedCentreModal, selectedSosModal, sosModalOpen, donorModalOpen, requisitionModalOpen, printSlipData } = store.state;

  return `
    <!-- 1. Centre Inventory & Details Breakdown Modal -->
    ${selectedCentreModal ? renderCentreBreakdownModal(selectedCentreModal) : ''}

    <!-- 2. Create Emergency SOS Modal -->
    ${sosModalOpen ? renderCreateSosModal() : ''}

    <!-- 3. Register as Hero Donor Modal -->
    ${donorModalOpen ? renderDonorRegistrationModal() : ''}

    <!-- 4. Hospital Requisition Creation Modal -->
    ${requisitionModalOpen ? renderCreateHospitalRequisitionModal() : ''}

    <!-- 5. Printable Emergency Blood Slip Modal -->
    ${printSlipData ? renderPrintSlipModal(printSlipData) : ''}
  `;
}

// Centre Breakdown Modal
function renderCentreBreakdownModal(centre) {
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div class="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold">
                VERIFIED TRANSFUSION CENTRE
              </span>
              <span class="text-xs text-slate-400 font-mono">${centre.licenseNumber}</span>
            </div>
            <h3 class="text-lg font-bold text-white mt-1">${centre.name}</h3>
            <p class="text-xs text-slate-400">${centre.address}</p>
          </div>
          <button onclick="window.closeModals()" class="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Contact & Officers -->
        <div class="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div>
            <span class="text-slate-500 block">Nodal Transfusion Officer:</span>
            <strong class="text-slate-200">${centre.nodalOfficer}</strong>
          </div>
          <div>
            <span class="text-slate-500 block">Emergency Helpline (24x7):</span>
            <a href="tel:${centre.emergencyHelpline || centre.phone}" class="text-emerald-400 font-mono font-bold hover:underline">${centre.emergencyHelpline || centre.phone}</a>
          </div>
        </div>

        <!-- Component Stock Table -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold text-slate-300">Current Reported Stock Units Across All Components:</h4>
          <div class="overflow-x-auto border border-slate-800 rounded-2xl">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="bg-slate-950 text-slate-400">
                  <th class="py-2.5 px-3">Group</th>
                  <th class="py-2.5 px-3">PRBC</th>
                  <th class="py-2.5 px-3">Whole Blood</th>
                  <th class="py-2.5 px-3">Platelets SDP</th>
                  <th class="py-2.5 px-3">Platelets RDP</th>
                  <th class="py-2.5 px-3">Plasma (FFP)</th>
                  <th class="py-2.5 px-3">Cryo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-850">
                ${BLOOD_GROUPS.map(bg => {
                  const s = centre.stock[bg] || {};
                  return `
                    <tr class="hover:bg-slate-800/30">
                      <td class="py-2 px-3 font-mono font-bold text-white bg-slate-950/40">${bg}</td>
                      <td class="py-2 px-3 font-mono ${s.prbc > 0 ? 'text-emerald-400 font-bold' : 'text-slate-600'}">${s.prbc || 0}</td>
                      <td class="py-2 px-3 font-mono ${s.wb > 0 ? 'text-emerald-400 font-bold' : 'text-slate-600'}">${s.wb || 0}</td>
                      <td class="py-2 px-3 font-mono ${s.sdp > 0 ? 'text-emerald-400 font-bold' : 'text-slate-600'}">${s.sdp || 0}</td>
                      <td class="py-2 px-3 font-mono ${s.rdp > 0 ? 'text-emerald-400 font-bold' : 'text-slate-600'}">${s.rdp || 0}</td>
                      <td class="py-2 px-3 font-mono ${s.ffp > 0 ? 'text-emerald-400 font-bold' : 'text-slate-600'}">${s.ffp || 0}</td>
                      <td class="py-2 px-3 font-mono ${s.cryo > 0 ? 'text-emerald-400 font-bold' : 'text-slate-600'}">${s.cryo || 0}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <a href="tel:${centre.emergencyHelpline || centre.phone}" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5">
            <i data-lucide="phone-call" class="w-4 h-4"></i>
            <span>Call Centre Now</span>
          </a>
        </div>

      </div>
    </div>
  `;
}

// Create Emergency SOS Modal
function renderCreateSosModal() {
  const { searchParams, selectedCity } = store.state;

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div class="relative w-full max-w-lg bg-slate-900 border border-brand-500/50 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        
        <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 text-[10px] font-black">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              <span>EMERGENCY SOS BEACON</span>
            </div>
            <h3 class="text-lg font-bold text-white">Broadcast Emergency Blood Request</h3>
          </div>
          <button onclick="window.closeModals()" class="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-create-sos" class="space-y-4 text-xs">
          
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Patient Full Name *</label>
              <input type="text" id="sos-patient-name" required placeholder="e.g. Ramesh Chandra" class="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Patient Age *</label>
              <input type="number" id="sos-patient-age" required min="1" max="110" placeholder="e.g. 45" class="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Blood Group *</label>
              <select id="sos-blood-group" class="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-bold">
                ${BLOOD_GROUPS.map(bg => `<option value="${bg}" ${searchParams.bloodGroup === bg ? 'selected' : ''}>${bg}</option>`).join('')}
              </select>
            </div>
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Component *</label>
              <select id="sos-component" class="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-bold">
                ${BLOOD_COMPONENTS.map(c => `<option value="${c.id}" ${searchParams.component === c.id ? 'selected' : ''}>${c.short}</option>`).join('')}
              </select>
            </div>
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Units Required *</label>
              <input type="number" id="sos-units" required min="1" max="10" value="${searchParams.quantity || 2}" class="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-bold" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="font-bold text-slate-300">Hospital Name & Ward / Bed *</label>
            <input type="text" id="sos-hospital" required placeholder="e.g. Medanta Gurugram, ICU Ward 3, Bed 12" class="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Attendant Name & Relation *</label>
              <input type="text" id="sos-attendant" required placeholder="e.g. Vikas Sharma (Son)" class="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Emergency Phone Number *</label>
              <input type="tel" id="sos-phone" required placeholder="+91 98110 xxxxx" class="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="font-bold text-slate-300">Clinical Reason / Diagnosis</label>
            <textarea id="sos-reason" rows="2" placeholder="e.g. Emergency surgery with internal hemorrhage, platelets dropped critically" class="w-full bg-slate-950 border border-slate-750 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"></textarea>
          </div>

          <div class="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-[11px] text-red-200">
            ⚠️ <strong>Emergency Verification:</strong> Only submit genuine medical requirements. False requests delay life-saving coordination.
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" onclick="window.closeModals()" class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
            <button type="submit" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-brand-600 hover:from-red-500 hover:to-brand-500 text-white font-black tracking-wide emergency-beacon">
              BROADCAST SOS NOW
            </button>
          </div>
        </form>

      </div>
    </div>
  `;
}

// Donor Registration Modal
function renderDonorRegistrationModal() {
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div class="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 space-y-5">
        
        <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-lg font-bold text-white">Join Voluntary Hero Donor Registry</h3>
            <p class="text-xs text-slate-400">Pledge to save lives during critical shortages.</p>
          </div>
          <button onclick="window.closeModals()" class="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-register-donor" class="space-y-4 text-xs">
          <div class="space-y-1">
            <label class="font-bold text-slate-300">Your Full Name *</label>
            <input type="text" id="donor-name" required placeholder="e.g. Priya Nair" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Blood Group *</label>
              <select id="donor-blood-group" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold">
                ${BLOOD_GROUPS.map(bg => `<option value="${bg}">${bg}</option>`).join('')}
              </select>
            </div>
            <div class="space-y-1">
              <label class="font-bold text-slate-300">City / Locality *</label>
              <input type="text" id="donor-area" required placeholder="e.g. DLF Phase 5, Gurugram" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="font-bold text-slate-300">Mobile Phone Number (For Emergency SMS/Call) *</label>
            <input type="tel" id="donor-phone" required placeholder="+91 98110 xxxxx" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono" />
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" onclick="window.closeModals()" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Register as Lifesaver</button>
          </div>
        </form>

      </div>
    </div>
  `;
}

// Hospital Requisition Creation Modal
function renderCreateHospitalRequisitionModal() {
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div class="relative w-full max-w-md bg-slate-900 border border-indigo-800 rounded-3xl shadow-2xl p-6 space-y-5">
        
        <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-lg font-bold text-white">New Hospital Emergency Requisition</h3>
            <p class="text-xs text-slate-400">Institutional patient blood hold requisition.</p>
          </div>
          <button onclick="window.closeModals()" class="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-create-req" class="space-y-4 text-xs">
          <div class="space-y-1">
            <label class="font-bold text-slate-300">Patient Name & UHID *</label>
            <div class="grid grid-cols-2 gap-2">
              <input type="text" id="req-patient-name" required placeholder="Patient Name" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
              <input type="text" id="req-patient-uhid" required placeholder="UHID-98214" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Doctor / Consultant *</label>
              <input type="text" id="req-doctor" required placeholder="Dr. S. K. Gupta" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            </div>
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Ward / Bed / OT *</label>
              <input type="text" id="req-bed" required placeholder="ICU Bed 8" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Blood Group</label>
              <select id="req-bg" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-bold">
                ${BLOOD_GROUPS.map(bg => `<option value="${bg}">${bg}</option>`).join('')}
              </select>
            </div>
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Component</label>
              <select id="req-comp" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-bold">
                ${BLOOD_COMPONENTS.map(c => `<option value="${c.id}">${c.short}</option>`).join('')}
              </select>
            </div>
            <div class="space-y-1">
              <label class="font-bold text-slate-300">Units</label>
              <input type="number" id="req-units" min="1" max="10" value="2" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-bold" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" onclick="window.closeModals()" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Issue Requisition</button>
          </div>
        </form>

      </div>
    </div>
  `;
}

// Printable Emergency Slip Modal
function renderPrintSlipModal(data) {
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div class="relative w-full max-w-xl bg-white text-slate-900 rounded-3xl shadow-2xl p-8 space-y-6 max-h-[95vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b-2 border-red-600 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-2xl font-black text-red-600">RaktSetu</span>
              <span class="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded">EMERGENCY SLIP</span>
            </div>
            <p class="text-[11px] text-slate-500">Official Digital Requisition Voucher • Transfusion Services</p>
          </div>
          <div class="text-right">
            <span class="text-xs font-mono font-bold text-slate-800">${data.id || 'SOS-VOUCHER'}</span>
            <p class="text-[10px] text-slate-400">${new Date().toLocaleString()}</p>
          </div>
        </div>

        <!-- Slip Body Grid -->
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="space-y-1">
            <span class="text-slate-500 block">Patient Name:</span>
            <strong class="text-base text-slate-900 block">${data.patientName}</strong>
            <span class="text-slate-500 block">Age: ${data.patientAge || 'Adult'} years</span>
          </div>
          <div class="space-y-1 text-right">
            <span class="text-slate-500 block">Requisition Requirement:</span>
            <strong class="text-xl font-mono text-red-600 block">${data.unitsRequired || data.units || 2} Units ${data.bloodGroup}</strong>
            <span class="text-slate-700 font-semibold block">${BLOOD_COMPONENTS.find(c => c.id === data.component)?.name || 'PRBC'}</span>
          </div>
        </div>

        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div class="flex justify-between">
            <span class="text-slate-500">Hospital / Facility:</span>
            <strong class="text-slate-800">${data.hospitalName}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Ward & Bed / OT:</span>
            <strong class="text-slate-800">${data.hospitalBed || data.bedNumber || 'ICU Desk'}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Attendant / Contact:</span>
            <strong class="text-slate-800">${data.patientAttendant || data.doctorName || 'Transfusion Desk'} (${data.contactPhone || '+91 98110 xxxxx'})</strong>
          </div>
        </div>

        <!-- Crossmatch Signoff -->
        <div class="border-t border-slate-200 pt-6 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
          <div>
            <div class="h-10 border-b border-slate-400"></div>
            <p class="mt-1">Medical Officer / Transfusion Incharge</p>
          </div>
          <div>
            <div class="h-10 border-b border-slate-400"></div>
            <p class="mt-1">Blood Bank Receiving Signature & Seal</p>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 no-print">
          <button onclick="window.closeModals()" class="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs">Close</button>
          <button onclick="window.print()" class="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5">
            <i data-lucide="printer" class="w-4 h-4"></i>
            <span>Print Requisition Slip</span>
          </button>
        </div>

      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// ATTACH EVENT HANDLERS & GLOBAL HELPERS
// ----------------------------------------------------------------------------
function attachEventHandlers() {
  // Role Selector
  const roleSel = document.getElementById('role-selector');
  if (roleSel) {
    roleSel.addEventListener('change', (e) => {
      store.update(s => { s.activeRole = e.target.value; });
    });
  }

  // City Selector
  const citySel = document.getElementById('city-selector');
  if (citySel) {
    citySel.addEventListener('change', (e) => {
      const cityObj = CITIES.find(c => c.id === e.target.value);
      if (cityObj) {
        store.update(s => {
          s.selectedCity = cityObj.id;
          s.userCoords = { lat: cityObj.lat, lng: cityObj.lng, name: cityObj.name };
        });
        showToast('Location Switched', `Active discovery area updated to ${cityObj.name}`, 'info');
      }
    });
  }

  // GPS Auto-detect Button
  const btnGps = document.getElementById('btn-detect-gps');
  if (btnGps) {
    btnGps.addEventListener('click', () => {
      if (navigator.geolocation) {
        showToast('Locating...', 'Fetching high-accuracy GPS coordinates...', 'info');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            store.update(s => {
              s.userCoords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                name: 'Current Live GPS Location'
              };
            });
            showToast('GPS Acquired', `Location calibrated to ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, 'success');
          },
          (err) => {
            showToast('GPS Notice', 'Using Gurugram / Delhi NCR coordinates as default.', 'warning');
          }
        );
      }
    });
  }

  // Toggle Sound
  const btnSound = document.getElementById('btn-toggle-sound');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      store.update(s => { s.soundEnabled = !s.soundEnabled; });
    });
  }

  // Toggle Language
  const btnLang = document.getElementById('btn-toggle-lang');
  if (btnLang) {
    btnLang.addEventListener('click', () => {
      store.update(s => { s.language = s.language === 'en' ? 'hi' : 'en'; });
    });
  }

  // NLP Natural-Language Search
  const nlpInput = document.getElementById('nlp-search-input');
  const btnNlp = document.getElementById('btn-nlp-search');
  if (btnNlp && nlpInput) {
    const handleNlp = () => {
      const text = nlpInput.value.trim();
      if (!text) return;
      const parsed = parseNaturalLanguageEmergency(text);
      if (parsed) {
        store.update(s => {
          if (parsed.bloodGroup) s.searchParams.bloodGroup = parsed.bloodGroup;
          if (parsed.component) s.searchParams.component = parsed.component;
          if (parsed.quantity) s.searchParams.quantity = parsed.quantity;
          if (parsed.urgency) s.searchParams.urgency = parsed.urgency;
          if (parsed.location) {
            const matchedCity = CITIES.find(c => c.id === parsed.location);
            if (matchedCity) {
              s.selectedCity = matchedCity.id;
              s.userCoords = { lat: matchedCity.lat, lng: matchedCity.lng, name: matchedCity.name };
            }
          }
          s.searchParams.searchQuery = '';
        });
        playEmergencyChime('match');
        showToast('AI Parameter Match', `Identified: ${parsed.bloodGroup || searchParams.bloodGroup} ${parsed.component || searchParams.component}`, 'success');
      }
    };
    btnNlp.addEventListener('click', handleNlp);
    nlpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleNlp();
    });
  }

  // NLP Samples Buttons
  document.querySelectorAll('.nlp-sample-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.query;
      if (nlpInput) nlpInput.value = q;
      if (btnNlp) btnNlp.click();
    });
  });

  // 1-Tap Blood Group Buttons
  document.querySelectorAll('.btn-select-bg').forEach(btn => {
    btn.addEventListener('click', () => {
      const bg = btn.dataset.bg;
      store.update(s => { s.searchParams.bloodGroup = bg; });
    });
  });

  // Component Selector
  const compSel = document.getElementById('component-selector');
  if (compSel) {
    compSel.addEventListener('change', (e) => {
      store.update(s => { s.searchParams.component = e.target.value; });
    });
  }

  // Quantity +/-
  const btnMinus = document.getElementById('btn-qty-minus');
  const btnPlus = document.getElementById('btn-qty-plus');
  if (btnMinus) {
    btnMinus.addEventListener('click', () => {
      store.update(s => {
        if (s.searchParams.quantity > 1) s.searchParams.quantity -= 1;
      });
    });
  }
  if (btnPlus) {
    btnPlus.addEventListener('click', () => {
      store.update(s => {
        if (s.searchParams.quantity < 10) s.searchParams.quantity += 1;
      });
    });
  }

  // Urgency Selector
  const urgSel = document.getElementById('urgency-selector');
  if (urgSel) {
    urgSel.addEventListener('change', (e) => {
      store.update(s => { s.searchParams.urgency = e.target.value; });
    });
  }

  // Radius Buttons
  document.querySelectorAll('.btn-radius').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = parseInt(btn.dataset.radius, 10);
      store.update(s => { s.searchParams.radiusKm = r; });
    });
  });

  // Checkboxes (Verified, 24x7)
  const chkVer = document.getElementById('chk-verified-only');
  if (chkVer) {
    chkVer.addEventListener('change', (e) => {
      store.update(s => { s.searchParams.verifiedOnly = e.target.checked; });
    });
  }
  const chk24 = document.getElementById('chk-24x7-only');
  if (chk24) {
    chk24.addEventListener('change', (e) => {
      store.update(s => { s.searchParams.is24x7Only = e.target.checked; });
    });
  }

  // Sort Selector
  const sortSel = document.getElementById('sort-selector');
  if (sortSel) {
    sortSel.addEventListener('change', (e) => {
      store.update(s => { s.searchParams.sortBy = e.target.value; });
    });
  }

  // Compatibility Grid Focus Buttons
  document.querySelectorAll('.btn-compat-bg').forEach(btn => {
    btn.addEventListener('click', () => {
      const bg = btn.dataset.compatBg;
      store.update(s => { s.searchParams.bloodGroup = bg; });
    });
  });

  // AI Chat Chips
  document.querySelectorAll('.ai-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt;
      sendAiMessage(prompt);
    });
  });

  // AI Chat Send
  const aiChatInput = document.getElementById('ai-chat-input');
  const btnSendAi = document.getElementById('btn-send-ai-chat');
  if (btnSendAi && aiChatInput) {
    const handleSend = () => {
      const text = aiChatInput.value.trim();
      if (!text) return;
      aiChatInput.value = '';
      sendAiMessage(text);
    };
    btnSendAi.addEventListener('click', handleSend);
    aiChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  // Create SOS Form Submission
  const formSos = document.getElementById('form-create-sos');
  if (formSos) {
    formSos.addEventListener('submit', (e) => {
      e.preventDefault();
      const patientName = document.getElementById('sos-patient-name').value.trim();
      const patientAge = parseInt(document.getElementById('sos-patient-age').value, 10);
      const bloodGroup = document.getElementById('sos-blood-group').value;
      const component = document.getElementById('sos-component').value;
      const unitsRequired = parseInt(document.getElementById('sos-units').value, 10);
      const hospitalName = document.getElementById('sos-hospital').value.trim();
      const patientAttendant = document.getElementById('sos-attendant').value.trim();
      const contactPhone = document.getElementById('sos-phone').value.trim();
      const reason = document.getElementById('sos-reason').value.trim() || 'Emergency surgical/medical blood requirement';

      const newSos = {
        id: `SOS-NCR-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName,
        patientAge,
        bloodGroup,
        component,
        unitsRequired,
        urgency: 'critical',
        hospitalName,
        hospitalBed: 'Emergency Ward',
        hospitalCity: store.state.selectedCity,
        patientAttendant,
        contactPhone,
        reason,
        createdAt: new Date().toISOString(),
        status: 'broadcasted',
        matchedCentres: ['bc-medanta', 'bc-rotary-ggn'],
        donorsAlertedCount: 16,
        unitsPledgedCount: 0,
        statusHistory: [
          { step: 'broadcasted', title: 'Emergency SOS Broadcast Active', time: new Date().toISOString(), note: 'Live broadcast distributed across regional network & 16 on-call donors' }
        ]
      };

      store.update(s => {
        s.sosRequests.unshift(newSos);
        s.sosModalOpen = false;
        s.activeTab = 'sos_network';
      });

      playEmergencyChime('sos');
      if (window.confetti) {
        window.confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }
      showToast('SOS Broadcasted!', `Emergency ticket ${newSos.id} is now live across the hospital network.`, 'emergency');
    });
  }

  // Register Hero Donor Form
  const formDonor = document.getElementById('form-register-donor');
  if (formDonor) {
    formDonor.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('donor-name').value.trim();
      const bloodGroup = document.getElementById('donor-blood-group').value;
      const area = document.getElementById('donor-area').value.trim();
      const phone = document.getElementById('donor-phone').value.trim();

      const newDonor = {
        id: `dn-${Math.floor(100 + Math.random() * 900)}`,
        name,
        bloodGroup,
        city: store.state.selectedCity,
        area,
        distanceKm: 2.5,
        donationsCount: 1,
        lastDonationDaysAgo: 100,
        eligibleNow: true,
        canTravelMin: 30,
        phone,
        badge: 'New Lifesaver Hero'
      };

      store.update(s => {
        s.donors.unshift(newDonor);
        s.donorModalOpen = false;
        s.activeTab = 'donors';
      });

      if (window.confetti) {
        window.confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
      }
      showToast('Thank You Lifesaver!', `${name}, you are now enrolled in the RaktSetu Hero Donor network!`, 'success');
    });
  }

  // Create Hospital Requisition Form
  const formReq = document.getElementById('form-create-req');
  if (formReq) {
    formReq.addEventListener('submit', (e) => {
      e.preventDefault();
      const patientName = document.getElementById('req-patient-name').value.trim();
      const patientUHID = document.getElementById('req-patient-uhid').value.trim();
      const doctorName = document.getElementById('req-doctor').value.trim();
      const bedNumber = document.getElementById('req-bed').value.trim();
      const bloodGroup = document.getElementById('req-bg').value;
      const component = document.getElementById('req-comp').value;
      const units = parseInt(document.getElementById('req-units').value, 10);

      const newReq = {
        id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        hospitalName: 'Medanta The Medicity',
        hospitalId: 'hosp-medanta',
        doctorName,
        patientUHID,
        patientName,
        bedNumber,
        bloodGroup,
        component,
        units,
        urgency: 'urgent',
        crossMatchSampleSent: true,
        status: 'Requisition Dispatched (Pending Hold)',
        requestedAt: new Date().toISOString()
      };

      store.update(s => {
        s.hospitalRequisitions.unshift(newReq);
        s.requisitionModalOpen = false;
      });

      showToast('Requisition Created', `Requisition ${newReq.id} transmitted to Blood Bank Transfusion Desk.`, 'success');
    });
  }
}

// AI Message Flow
function sendAiMessage(query) {
  store.update(s => {
    s.aiChatHistory.push({ sender: 'user', text: query });
  });

  // Simulate Smart Response
  setTimeout(() => {
    let reply = '';
    const qLower = query.toLowerCase();

    if (qLower.includes('o-') || qLower.includes('o negative')) {
      reply = 'Patients with **O-negative** blood have no A, B, or Rh antigens on their red cells. Therefore, in a red cell transfusion (PRBC), **they can ONLY receive O-negative red blood cells**. If an O- patient receives O+, A-, B-, or AB blood, an immediate acute hemolytic transfusion reaction may occur. In rare mass-casualty protocols when O- is exhausted, senior transfusion consultants must authorize alternatives according to strict clinical criteria.';
    } else if (qLower.includes('bombay') || qLower.includes('hh')) {
      reply = 'The **Bombay Blood Group (hh phenotype)** is an extremely rare blood group (approx 1 in 10,000 in India). People with Bombay phenotype lack the H antigen required to produce A or B antigens. **A Bombay group patient can ONLY receive blood from another Bombay phenotype donor**. RaktSetu coordinates with the National Rare Blood Registry and AIIMS New Delhi to locate verified Bombay phenotype donor units.';
    } else if (qLower.includes('document') || qLower.includes('collect') || qLower.includes('bring')) {
      reply = 'To collect blood bags from a licensed blood centre in India, you must bring:\n1. **Original Doctor Blood Requisition Form** signed by the treating consultant.\n2. **Patient Blood Sample Vial** (EDTA/Plain vial labelled with patient UHID & name for cross-matching).\n3. **Patient ID Proof** and relative/attendant ID.\n4. **Temperature-controlled blood carrier / ice box** (for safe transportation back to the hospital).';
    } else if (qLower.includes('platelet') || qLower.includes('dengue') || qLower.includes('sdp')) {
      reply = '**Single Donor Platelets (SDP)** provide 3-4x the yield of random donor platelets (RDP) from a single donor using an apheresis machine. Platelets have a short shelf life of only **5 days** and must be kept on continuous agitators at 22°C. For dengue patients with counts below 20,000/mcL or active bleeding, SDP or pooled RDP can be issued upon STAT crossmatch.';
    } else {
      reply = `Thank you for your inquiry regarding "${query}". RaktSetu verifies stock availability every few minutes across participating NABH accredited centres. Always ensure a crossmatch compatibility test is completed by the receiving hospital before transfusion. If you have an active patient requirement, click **Need Blood Now** to initiate instant matching.`;
    }

    store.update(s => {
      s.aiChatHistory.push({ sender: 'ai', text: reply });
    });

    // Scroll chat thread to bottom
    setTimeout(() => {
      const thread = document.getElementById('ai-chat-thread');
      if (thread) thread.scrollTop = thread.scrollHeight;
    }, 50);

  }, 600);
}

// Global Window Helpers for inline HTML event triggers
window.setAppTab = (tab) => {
  store.update(s => { s.activeTab = tab; });
};

window.setSearchRadius = (radiusKm) => {
  store.update(s => { s.searchParams.radiusKm = radiusKm; });
};

window.openCentreModal = (centreId) => {
  const centre = store.state.bloodCentres.find(c => c.id === centreId);
  if (centre) {
    store.update(s => { s.selectedCentreModal = centre; });
  }
};

window.openSosModal = () => {
  store.update(s => { s.sosModalOpen = true; });
};

window.openDonorRegistration = () => {
  store.update(s => { s.donorModalOpen = true; });
};

window.openHospitalRequisitionModal = () => {
  store.update(s => { s.requisitionModalOpen = true; });
};

window.openRequisitionModal = (centreId) => {
  const centre = store.state.bloodCentres.find(c => c.id === centreId);
  if (centre) {
    showToast('Hold Requested', `Emergency reservation ticket sent to ${centre.name} transfusion desk.`, 'info');
  }
};

window.closeModals = () => {
  store.update(s => {
    s.selectedCentreModal = null;
    s.selectedSosModal = null;
    s.sosModalOpen = false;
    s.donorModalOpen = false;
    s.requisitionModalOpen = false;
    s.printSlipData = null;
  });
};

window.printRequisitionSlip = (id) => {
  const req = store.state.sosRequests.find(s => s.id === id) || store.state.hospitalRequisitions.find(r => r.id === id);
  if (req) {
    store.update(s => { s.printSlipData = req; });
  }
};

window.shareSosWhatsApp = (id) => {
  const req = store.state.sosRequests.find(s => s.id === id);
  if (!req) return;

  const text = `🚨 *EMERGENCY BLOOD REQUIREMENT (RaktSetu SOS)* 🚨\n\n` +
    `🩸 *Blood Group:* ${req.bloodGroup} (${req.unitsRequired} Units ${BLOOD_COMPONENTS.find(c => c.id === req.component)?.short})\n` +
    `👤 *Patient:* ${req.patientName} (${req.patientAge}y)\n` +
    `🏥 *Hospital:* ${req.hospitalName} (${req.hospitalBed})\n` +
    `📞 *Emergency Contact:* ${req.patientAttendant} - ${req.contactPhone}\n` +
    `⚠️ *Case:* ${req.reason}\n\n` +
    `🔗 *Live RaktSetu Tracking & Match:* https://raktsetu.org/sos/${req.id}\n\n` +
    `_Please share in your blood donor networks. Every minute matters!_`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    showToast('WhatsApp Card Copied!', 'Emergency WhatsApp alert text copied to clipboard. Ready to paste.', 'success');
  }
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

window.advanceSosStage = (id) => {
  const stages = ['broadcasted', 'matching', 'notified', 'coordinating', 'resolved'];
  store.update(s => {
    const req = s.sosRequests.find(r => r.id === id);
    if (req) {
      const idx = stages.indexOf(req.status);
      if (idx < stages.length - 1) {
        req.status = stages[idx + 1];
        const titles = {
          matching: 'Matched Nearby Verified Blood Banks',
          notified: '18 Verified Local Donors Alerted',
          coordinating: 'Transfusion Desk Crossmatching in Progress',
          resolved: 'Transfusion Completed & Case Resolved'
        };
        req.statusHistory.unshift({
          step: req.status,
          title: titles[req.status],
          time: new Date().toISOString(),
          note: `Stage progressed to ${req.status.toUpperCase()}`
        });

        if (req.status === 'resolved' && window.confetti) {
          window.confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 } });
        }
      }
    }
  });
  showToast('Stage Advanced', `SOS ticket updated to next coordination milestone.`, 'info');
};

window.refreshCentreTimestamp = (centreId) => {
  store.update(s => {
    const centre = s.bloodCentres.find(c => c.id === centreId);
    if (centre) {
      centre.lastStockUpdate = new Date().toISOString();
    }
  });
  playEmergencyChime('match');
  showToast('Live Timestamp Synced', 'Stock verification timestamp updated to Just Now.', 'success');
};

window.updateCentreStock = (centreId, bg, comp, delta) => {
  store.update(s => {
    const centre = s.bloodCentres.find(c => c.id === centreId);
    if (centre && centre.stock[bg]) {
      centre.stock[bg][comp] = Math.max(0, (centre.stock[bg][comp] || 0) + delta);
      centre.lastStockUpdate = new Date().toISOString();
    }
  });
};

window.triggerSimulatedStockUpdate = () => {
  store.update(s => {
    // Randomly modify stock count in Medanta or Rotary
    const c = s.bloodCentres[Math.floor(Math.random() * s.bloodCentres.length)];
    if (c) {
      c.stock['O-'].prbc = Math.floor(4 + Math.random() * 6);
      c.lastStockUpdate = new Date().toISOString();
    }
  });
  playEmergencyChime('match');
  showToast('Simulated Stock Sync', 'Real-time telemetry event received. Inventory & freshness timestamps updated.', 'info');
};

window.openMedicalDisclaimer = () => {
  alert('RaktSetu Medical Transfusion Guidelines:\n\n1. Blood & blood component discovery on RaktSetu is for emergency coordination.\n2. All crossmatching (major & minor) must be verified at the licensed transfusion medicine lab.\n3. Transportation of packed RBCs must be strictly maintained between 2°C to 6°C.\n4. Platelet units must never be refrigerated and must remain at 20°C - 24°C under gentle agitation.\n5. National Helpline: 104 / 112');
};

// Initial App Boot
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
