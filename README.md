# 🩸 RaktSetu (रक्तसेतु)
### *Find the Right Blood, Faster.*
> **Emergency-Focused Digital Blood Discovery & Coordination Platform**

---

## 🌟 Overview & Mission

During critical medical emergencies (such as trauma accidents, Dengue thrombocytopenia, open-heart surgeries, or oncology care), every minute wasted searching across scattered websites or calling blood banks one by one directly impacts patient survival. 

**RaktSetu** is built around one uncompromising philosophy: **When every minute matters, finding the right blood should be as simple as searching for it.**

RaktSetu bridges patients, relatives, hospitals, verified blood banks, and on-call hero donors into a unified, high-speed digital coordination grid.

---

## 🚀 Key Features

### 1. ⚡ Emergency Mode ("Need Blood Now" 1-Click Discovery)
- **1-Tap Blood Group Selector**: Instant selection for all 8 standard ABO/Rh groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) as well as rare phenotypes like **Bombay Blood Group (hh)** and **Rh-null**.
- **Component-Specific Filter**: Packed Red Blood Cells (PRBC), Whole Blood (WB), Single Donor Platelets (SDP), Random Donor Platelets (RDP), Fresh Frozen Plasma (FFP), and Cryoprecipitate.
- **Urgency Levels**: Immediate (`<1 hr`), Urgent (`1-4 hrs`), Planned (`24 hrs`).

### 2. 🧠 Smart Ranking & Multi-Factor Matching Engine
Prioritizes matching centres using a weighted multi-factor scoring formula:
$$\text{Score} = (W_{\text{dist}} \times \text{DistanceScore}) + (W_{\text{stock}} \times \text{StockScore}) + (W_{\text{fresh}} \times \text{FreshnessScore}) + (W_{\text{trust}} \times \text{TrustScore})$$
- Distance calculated via high-accuracy Haversine formula.
- Verification checks for NABH Accreditation, Government Licensing, and 24x7 Emergency Operational desks.

### 3. ⏱️ Real-Time Stock Freshness Indicator
- Dynamic relative timestamps on all listings:
  - 🟢 **Live Sync** (`<15 mins ago`)
  - 🟡 **Verified Recent** (`<60 mins ago`)
  - 🟠 **Verify via Call** (`>1 hr ago`)
- Live simulated stock updates demonstrating real-time inventory telemetry.

### 4. 🤖 RaktSetu AI Natural-Language Emergency Assistant
- **NLP Parameter Extraction**: Type queries in plain conversational language (e.g., *"Urgent 3 units of O-negative PRBC needed near Cyber Hub Gurugram"*) — the system automatically parses blood group, component, quantity, and location, prefilling parameters and executing instant search.
- **AI Emergency Consultation**: Real-time answers on transfusion compatibility, Bombay phenotype protocols, platelet apheresis criteria, and required documentation.

### 5. 🗺️ Interactive Geographic Discovery Map
- Built with Leaflet & CartoDB DarkMatter basemap.
- Radius filter circles (10 km, 25 km, 50 km).
- Color-coded pins: 🟢 High Stock, 🟡 Low Stock, 🔴 0 Units.
- One-tap **Call Blood Bank** and **GPS Navigation Directions**.

### 6. 🚨 Emergency SOS Broadcast Network & Live 5-Stage Tracker
When local inventory is exhausted:
1. Create instant emergency requisition tickets (e.g., `SOS-GGM-4901`).
2. Live 5-stage progress lifecycle:
   - `Broadcast Active` ➔ `Nearby Centres Matched` ➔ `On-Call Donors Alerted` ➔ `Units Reserved & Dispatched` ➔ `Transfused & Case Closed`
3. **1-Click WhatsApp Alert Card**: Formats and copies a structured emergency message with direct tracking links for fast sharing in volunteer groups.
4. **Printable Hospital Blood Requisition Slip**: Clean, printable medical slip with signature blocks for hospital transfusion officers.

### 7. 👥 Multi-Role Workspaces
- **Public / Patient Portal**: Emergency search, map, SOS broadcast, compatibility matrix, donor sign-up.
- **Blood Centre Manager Desk**: 1-click stock increment/decrement across all 10 blood groups and components, 1-click *"Sync Timestamp to NOW"*, emergency dispatch logs.
- **Hospital Emergency Desk**: Patient UHID tagging, Ward/Bed number tracking, doctor requisitions, cross-matching status.
- **Admin Verification Center**: Drug controller license verification, NABH accreditation audit, abuse monitoring, and city-wide stock health metrics.

### 8. 🩸 Interactive Blood & Plasma Compatibility Matrix
- Full clinical reference rules for Red Cell (PRBC) vs. Plasma (FFP) transfusions.
- Clear identification of Universal Red Cell Donor (`O-`), Universal Red Cell Recipient (`AB+`), and Universal Plasma Donor (`AB+`).

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5 Semantic Architecture.
- **Styling**: Tailwind CSS (Emergency Dark Palette), Vanilla CSS with custom glassmorphism, radar pulse animations.
- **Mapping**: Leaflet.js with CartoDB Dark Matter tiles.
- **Icons & UI**: Lucide Icons CDN, Canvas Confetti.
- **Audio Synthesis**: Web Audio API synthesized emergency match chimes and alert beeps.

---

## 📦 How to Run Locally

```bash
# Start a local static file server
python3 -m http.server 8080

# Open in your browser
http://localhost:8080
```

---

*RaktSetu is a digital discovery and coordination platform. Actual blood compatibility testing, cross-matching, reservation, and issuance remain under the strict authority of licensed transfusion medicine officers and accredited blood banks.*
