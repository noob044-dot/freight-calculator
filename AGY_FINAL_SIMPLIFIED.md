━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE $1M CALCULATOR REDESIGN - SIMPLIFIED DESIGN
Background: Pure black #000000, Satoshi Variable, Calculator-first
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT STATE (repo has this):
- Satoshi Variable via Fontshare CDN in globals.css
- Pure black #000000 background
- Three.js HeroScene (torus knot + 3000 particles)
- Three.js AuthScene (3 toruses + 500 shape particles)  
- Three.js CalculatorScene (grid floor)
- Framer Motion spring variants (280/24, 450/30)
- MagneticButton, AnimatedInput, AnimatedTabSwitch components
- Login page with AuthScene left, animated tab switch right
- Calculate page with 3-zone layout, CalculatorScene center

WHAT'S MISSING (wire these up in pages):

1. LANDING PAGE (/)
   - REMOVE: India map, heavy Three.js hero
   - ADD: Small subtle globe in top-left corner (SVG, not Three.js)
   - REMOVE: Embedded calculator preview
   - KEEP: Hero headline, feature cards, comparison table, pricing
   - FONT: Satoshi Variable (already in globals.css)
   - COUNTERS: Animate 19,277 pincodes / 97% / 4 modes / ₹2L on scroll (useInView)

2. LOGIN PAGE (/login) - already has AuthScene, tab switch, password strength
   - Ensure MagneticButton submit uses useMagnetic hook
   - Ensure AnimatedInput has particle burst on focus

3. CALCULATE PAGE (/calculate) - THE MAIN PRODUCT
   - Left (35%): Sticky input panel - pincode autocomplete, weight slider, commodity search, advanced toggles
   - Center (40%): Results display - cost breakdown, toll breakdown, benchmark bars
   - Right (25%): Live benchmark comparison - Blue Dart, SpiceXpress, IndiGo rates
   - NO India map, NO Three.js in center, NO Mapbox
   - Keyboard: Cmd+Enter calculate, 1-4 modes, Cmd+Shift+C clear

4. DASHBOARD (/dashboard) - protected
   - CalculatorWidget for quick quotes
   - Collapsible sidebar (spring 300ms)
   - Role switcher pill (Admin/Forwarder/Viewer)
   - Kanban pipeline (@dnd-kit + Framer Motion layout)
   - SSE bidding board (already have /api/bids/stream)

5. ANALYTICS (/dashboard/analytics) - protected
   - Heatmap: India SVG with curved arcs
   - Waterfall: Bars grow from baseline
   - Predictive: Regression line draws, CI band fills
   - Uncle's view: 4-sheet Excel export

ALL: Framer Motion springs (import from variants.ts), organic radii, glassmorphism, pure black, dark mode only.

START WITH: Wire HeroScene into landing page, animate trust bar counters, add small globe top-left.