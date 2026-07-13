━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CALCULATE PAGE DESIGN SPEC - $1M PREMIUM
/src/app/calculate/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══════════════════════════════════════════════════════════════════
VISUAL REFERENCE - EXACT LOOK
═══════════════════════════════════════════════════════════════════
Think: Linear.app + Stripe Dashboard + Vercel Analytics
- Pure black #000000 background
- Satoshi Variable font (already in globals.css)
- Glassmorphism cards: bg-white/[0.02] backdrop-blur-3xl border-white/5
- Organic radii ONLY: rounded-organic-1 (16px), -2 (24px), -3 (32px)
- Accent gradient: from-cyan-400 via-blue-400 to-indigo-400
- 4px spacing scale
- Framer Motion springs from variants.ts ONLY

═══════════════════════════════════════════════════════════════════
3-ZONE LAYOUT (CSS Grid - Desktop ≥1024px)
═══════════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────────────────┐
│  LEFT (35%) - STICKY INPUT PANEL           │ CENTER (40%)       │ RIGHT (25%)     │
│  ┌─────────────────────────────────────┐  │  ┌───────────────┐  │ ┌────────────┐ │
│  │ Mode Tabs: Road | Air | Sea | Rail  │  │  │ COST BREAKDOWN│  │ │ BENCHMARKS │ │
│  ├─────────────────────────────────────┤  │  │ ┌───────────┐  │  │ │ Blue Dart  │ │
│  │ Origin: [400001 ▼]  (autocomplete)  │  │  │ │ Base:₹45K │  │  │ │ ₹48,200   │ │
│  │ Dest:   [110001 ▼]  (autocomplete)  │  │  │ │ Fuel:₹8.1K│  │  │ │ SpiceXpress│ │
│  ├─────────────────────────────────────┤  │  │ │ Toll:₹12.3K│  │  │ │ ₹51,000   │ │
│  │ Weight: ████████░░ 12,500 kg        │  │  │ │ Last:₹3.2K│  │  │ │ IndiGo     │ │
│  │ Commodity: [Steel Coils ▼] search   │  │  │ │ Ins:₹1.5K │  │  │ │ ₹55,500   │ │
│  ├─────────────────────────────────────┤  │  │ │ TOTAL:₹70.1K│  │  │ │ Rail       │ │
│  │ ▼ Advanced: dims, vehicle, incoterms│  │  │ └───────────┘  │  │ │ ₹38,000   │ │
│  ├─────────────────────────────────────┤  │  ┌───────────────┐  │ │ Ocean      │ │
│  │ [CALCULATE RATE]  MagneticButton    │  │  │ TOLL PLAZAS   │  │  │ │ ₹42,000   │ │
│  └─────────────────────────────────────┘  │  │ NH-48: 3 plazas│  │ └────────────┘ │
│                                           │  │ NH-1:  2 plazas│  │                │
│                                           │  │ Total: ₹12,340 │  │                │
│                                           │  └───────────────┘  │                │
└─────────────────────────────────────────────────────────────────┘

Mobile (<1024px): Single column stack - Inputs → Results → Benchmarks

═══════════════════════════════════════════════════════════════════
EXACT COMPONENT SPECS
═══════════════════════════════════════════════════════════════════

LEFT PANEL - Sticky Input Form:
- ModeSelector: Existing component, use springStandard for tab switch
- Pincode inputs: AnimatedInput with /api/pincodes autocomplete
  - Debounced 300ms, show city/state on hover
  - Recent pins at top (localStorage)
- Weight: Range slider (100-30000kg, step 100) + number input sync
  - Show live: "12,500 kg ≈ 12.5 MT"
- Commodity: AnimatedInput with searchable combobox
  - Source: COMMODITY_FACTORS from road-engine.ts (~125 items)
  - Group by category (Agricultural, Metals, Cement, etc.)
  - Fuzzy search
- Advanced: <details> with dimensions (L×W×H), vehicle type, incoterms
- Calculate: MagneticButton full-width, springMagnetic hover

CENTER PANEL - Results Display:
- Cost Breakdown Card (glassmorphism, rounded-organic-2):
  - Animated counter for each line item (springStandard)
  - Total prominent: text-3xl font-bold gradient text
  - Expandable toll plaza list (accordion, Framer Motion height)
- Benchmark Comparison Bars (horizontal bar chart):
  - Blue Dart, SpiceXpress, IndiGo, Rail, Ocean
  - Bars animate width on mount (springStandard, stagger 100ms)
  - Our rate highlighted with cyan glow

RIGHT PANEL - Live Benchmarks:
- 5 cards (glassmorphism, rounded-organic-1):
  - Carrier logo/name, rate, transit time, reliability badge
  - Subtle pulse animation on our recommended
  - "Book" button (MagneticButton, disabled for demo)

═══════════════════════════════════════════════════════════════════
ANIMATIONS (from variants.ts ONLY)
═══════════════════════════════════════════════════════════════════
import { springStandard, springMagnetic, stagger, counterVariants, pageTransition } from '@/lib/animations/variants'

- Page entry: pageTransition on main container
- Input focus: useParticleBurst + magnetic label lift
- Button hover: useMagnetic (strength 0.3) + springMagnetic scale
- Counter animate: counterVariants on results mount (useInView)
- Bar chart: stagger + springStandard width
- Tab switch: springStandard + layoutId on mode indicator
- Accordion: Framer Motion animate height (springStandard)

═══════════════════════════════════════════════════════════════════
KEYBOARD SHORTCUTS (useEffect)
═══════════════════════════════════════════════════════════════════
- Cmd/Ctrl + Enter → calculate
- Keys 1,2,3,4 → switch modes (Road/Air/Sea/Rail)
- Cmd/Ctrl + Shift + C → clear form
- Escape → close advanced panel
- Tab → standard focus (respect prefers-reduced-motion)

═══════════════════════════════════════════════════════════════════
DATA FLOW
═══════════════════════════════════════════════════════════════════
1. Form state in local useState / useReducer
2. On calculate: POST /api/quote?mode=all { origin, dest, weight, commodity, vehicle, dimensions, incoterms }
3. Response: QuoteResult with breakdown + benchmarks
4. Animate results in with Framer Motion
5. Cache last 5 queries in localStorage for quick re-run

═══════════════════════════════════════════════════════════════════
IMPORTS NEEDED
═══════════════════════════════════════════════════════════════════
import { springStandard, springMagnetic, stagger, counterVariants, pageTransition } from '@/lib/animations/variants'
import { useMagnetic } from '@/hooks/useMagnetic'
import { useParticleBurst } from '@/hooks/useParticleBurst'
import { AnimatedInput } from '@/components/ui/AnimatedInput'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { ModeSelector } from '@/components/ModeSelector'
import { COMMODITY_FACTORS } from '@/lib/road-engine'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Globe, Truck, Plane, Ship, Train, Calculator, ChevronDown } from 'lucide-react'

═══════════════════════════════════════════════════════════════════
REPLACE ENTIRE src/app/calculate/page.tsx WITH THIS SPEC
═══════════════════════════════════════════════════════════════════
NO MAP. NO THREE.JS IN CENTER. NO MAPBOX. CALCULATOR ONLY.