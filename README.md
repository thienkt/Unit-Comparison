# Age of Empires IV - Unit Statistics Comparison Matrix ⚔️

A modern, fast, and responsive web application built with **React.js** and **Vite** that compares military unit statistics (Costs, Hitpoints, Armor, Attack, Attack Speed, DPS, Movement Speed, Range, and Bonus Modifiers) of the same military unit category across all **25 Civilizations** in **Age of Empires IV**, fetching live directly from the [AoE4 World Open Data GitHub Repository](https://github.com/aoe4world/data).

---

## 🌟 Key Features

1. **Unit Type Selector:**
   - Grid and tabbed selector covering major military archetypes:
     - **Archers** (Light Ranged Infantry)
     - **Spearmen** (Light Melee Infantry / Anti-Cavalry)
     - **Men-at-Arms** (Heavy Melee Infantry)
     - **Horsemen** (Light Melee Cavalry / Anti-Ranged)
     - **Knights & Lancers** (Heavy Melee Cavalry)
     - **Crossbowmen** (Light Ranged Infantry / Anti-Armor)
     - **Handcannoneers** (Gunpowder Ranged Infantry)
     - **Scouts** (Reconnaissance Cavalry)
     - **Springalds** (Long-Range Anti-Siege)
     - **Mangonels & AoE Siege** (Area Artillery)
     - **Bombards & Cannons** (Heavy Demolition Artillery)
     - **Battering Rams** (Armored Siege Vehicles)

2. **Accurate Civilization Unique Unit Mapping:**
   - Automatically maps standard units to each civilization's signature unique unit replacements:
     - *Archers*: Sengoku Daimyo & Japanese field **Yumi Ashigaru**, English fields **Longbowmen**, Order of the Dragon fields **Gilded Archers**, House of Lancaster fields **Yeomen**, Scots field **Highland Archers**, etc.
     - *Men-at-Arms*: Abbasid & Ayyubids field **Ghulam**, Byzantines & Macedonians field **Varangian Guard**, Chinese & Zhu Xi field **Palace Guard**, Japanese & Sengoku field **Samurai**, Jin Dynasty fields **Zhanma Swordsmen**, etc.
     - *Knights & Lancers*: French & Jeanne d'Arc field **Royal Knights**, Byzantines field **Cataphracts**, Mongols field **Keshiks**, Japanese field **Mounted Samurai**, Chinese & Abbasid field **Lancers**, etc.

3. **Matrix Comparison Table:**
   - **Rows**: Grouped into Unit Overview, Resource Costs (Food, Wood, Gold, Stone, Total, Train Time, Pop Cap), Survivability (Hitpoints, Melee Armor, Ranged Armor), Offensive Combat (Damage, Attack Speed, DPS, Range, Bonus Modifiers), Mobility & Vision (Speed, Line of Sight).
   - **Columns**: All active civilizations side-by-side with national crests, flags, and unit portraits.
   - **Freeze Columns**: Sticky first column (stat labels) and sticky top row (civilization headers) for seamless horizontal scrolling across all 25 civilizations.

4. **Stats Difference Highlighting:**
   - Automatically calculates the statistical **Median** for each numeric stat across all comparing civilizations.
   - **Green Badge & Glow**: Indicates superior attributes (e.g. Higher HP/Damage/DPS/Armor, or Lower Cost/Train Time) with delta badges (e.g., `+15%` or `-20 Res`).
   - **Red Badge & Glow**: Indicates inferior attributes with delta badges (e.g., `-15%` or `+20 Res`).
   - Toggle modes: *vs Median*, *Best/Worst in Class*, or *Off*.

5. **Age Era Filter (Dark I, Feudal II, Castle III, Imperial IV):**
   - Switch between game ages to compare early feudal clashes or castle/imperial upgrades side-by-side.

6. **Interactive Unit Detail Modal:**
   - Click on any civilization's unit card to open a tactical breakdown: gameplay description, weapon types, damage, attack timings (windup, attack, winddown, cooldown), armor values, and production buildings.

7. **Civilization Filter & Quick Presets:**
   - Search by civilization or unit name.
   - Filter by DLC expansion (*Base Game*, *The Sultans Ascend*, *Dynasties of the East*, *Knights of Cross and Rose*, *Raiders of the North*, *Yue Fei's Legacy*).

8. **Direct GitHub Fetching & Error Handling:**
   - Direct fetch from `https://raw.githubusercontent.com/aoe4world/data/main/` with fallback to `https://data.aoe4world.com/`.
   - Elegant animated shimmer skeleton loader while streaming datasets.

---

## 🚀 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` (version 9+)

### Step-by-Step Instructions

1. **Clone or open the repository:**
   ```bash
   cd aoe_iv_unit_compare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in your browser:**
   Navigate to:
   ```
   http://localhost:5173/
   ```

5. **Build for Production (Optional):**
   ```bash
   npm run build
   npm run preview
   ```

---

## 📁 Project Architecture

```
aoe_iv_unit_compare/
├── index.html                   # HTML entry point with Google Fonts (Cinzel, Outfit)
├── package.json                 # Project configuration and dependencies (React, Vite, Lucide)
├── vite.config.js               # Vite build configuration with React plugin
├── src/
│   ├── main.jsx                 # Application DOM entry point
│   ├── App.jsx                  # Main application state and data orchestration
│   ├── index.css                # Dark-mode gaming UI design system & sticky matrix table
│   ├── services/
│   │   └── api.js               # Direct GitHub Raw fetcher with CDN fallback & timeout control
│   ├── data/
│   │   ├── civs.js              # 25 AoE4 civilizations, heraldic colors, and expansions
│   │   └── archetypes.js        # Military unit categories & unique replacement mappings
│   ├── utils/
│   │   └── stats.js             # Variation extraction, DPS, median calculation & diff logic
│   └── components/
│       ├── Header.jsx           # App banner with AoE4 crest and live GitHub status pill
│       ├── CategorySelector.jsx # Unit type selector grid
│       ├── ControlsBar.jsx      # Age selector, civ filter trigger, search, and highlight modes
│       ├── ComparisonMatrix.jsx # The matrix table with frozen columns and difference badges
│       ├── SkeletonTable.jsx    # Shimmer skeleton loader for graceful network latency
│       ├── UnitDetailModal.jsx  # Detailed tactical modal with all weapon attack timings
│       └── CivFilterModal.jsx   # Modal for selecting individual civs and DLC expansions
└── README.md
```

---

## 🛡️ Data Source Attribution
Unit statistics, attributes, and icons are sourced from the official open-source repository [AoE4 World Data](https://github.com/aoe4world/data) maintained by the AoE4 World community.
