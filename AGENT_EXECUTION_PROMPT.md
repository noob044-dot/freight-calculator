━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE $1M CALCULATOR REDESIGN - EXECUTION PROMPT
Background: Pure black #000000, Satoshi Variable, Calculator-first
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REPO STATE (already committed):
- globals.css: Satoshi Variable via Fontshare CDN, --color-bg:#000000, --font-sans:'Satoshi', glassmorphism tokens, organic radii
- src/lib/animations/variants.ts: springStandard(280/24), springMagnetic(450/30), stagger, pageTransition, counterVariants
- src/components/three/HeroScene.tsx: Torus knot + 3000 particles (for landing hero)
- src/components/three/AuthScene.tsx: 3 toruses + 500 shape particles (for login)
- src/components/three/CalculatorScene.tsx: Grid floor (for calculate center)
- src/hooks/useMagnetic.ts: Magnetic cursor hover effect
- src/hooks/useParticleBurst.ts: Particle burst on focus
- src/components/ui/AnimatedInput.tsx: Input with particle burst + magnetic label
- src/components/ui/MagneticButton.tsx: Button with magnetic hover + ripple
- src/components/ui/AnimatedTabSwitch.tsx: Framer Motion tab with layoutId animation
- src/components/ui/PasswordStrengthMeter.tsx: 5 animated segments
- All components export from their respective files

──────────────────────────────────────────────────────────────────
TASK: WIRE EVERYTHING INTO PAGES - NO NEW COMPONENTS NEEDED
──────────────────────────────────────────────────────────────────

════════════════════════════════════════════════════════════════
1. LANDING PAGE — src/app/page.tsx
════════════════════════════════════════════════════════════════
REPLACE ENTIRE FILE with:
- Import HeroScene from '@/components/three/HeroScene'
- Import { springStandard, counterVariants } from '@/lib/animations/variants'
- Import { useInView } from 'framer-motion'
- Import { Globe } from 'lucide-react' (small SVG top-left)

STRUCTURE:
```tsx
export default function Home() {
  // Trust bar counters - animate on scroll
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* SMALL GLOBE TOP-LEFT - NOT Three.js */}
      <div className="fixed top-6 left-6 z-50 opacity-60">
        <Globe className="w-10 h-10 text-cyan-400 animate-pulse-slow" />
      </div>
      
      {/* HERO WITH HeroScene BACKGROUND */}
      <section className="relative min-h-[90vh] flex items-center justify-center">
        <HeroScene className="absolute inset-0 -z-10" />
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Animate headline with pageTransition */}
          <motion.h1 variants={pageTransition} className="text-5xl sm:text-7xl lg:text-8xl font-light tracking-tight">
            Freight <br />
            <span className="font-medium bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Intelligence
            </span>
          </motion.h1>
          {/* ... rest of hero */}
        </div>
      </section>

      {/* TRUST BAR - ANIMATED COUNTERS */}
      <section ref={ref} className="relative py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 19277, suffix: '+', label: 'Pincodes Enriched' },
            { value: 97, suffix: '%', label: 'Toll Accuracy' },
            { value: 4, suffix: '', label: 'Multi-Modal Hub' },
            { value: 2, suffix: 'L+', label: 'Monthly Savings' }
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={counterVariants.container}>
              <motion.span 
                variants={counterVariants.item} 
                className="text-3xl sm:text-4xl font-bold font-mono text-white"
              >
                {isInView ? stat.value : 0}{stat.suffix}
              </motion.span>
              <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES, COMPARISON, PRICING, FAQ - keep existing but use variants.ts springs */}
      {/* REMOVE any India map, REMOVE embedded calculator preview */}
    </div>
  )
}
```

════════════════════════════════════════════════════════════════
2. LOGIN PAGE — src/app/(auth)/login/page.tsx
════════════════════════════════════════════════════════════════
REPLACE ENTIRE FILE with:
- Import AuthScene from '@/components/three/AuthScene'
- Import MagneticButton from '@/components/ui/MagneticButton'
- Import AnimatedInput from '@/components/ui/AnimatedInput'
- Import AnimatedTabSwitch from '@/components/ui/AnimatedTabSwitch'
- Import PasswordStrengthMeter from '@/components/ui/PasswordStrengthMeter'
- Import { springStandard, springMagnetic } from '@/lib/animations/variants'
- Import { useMagnetic } from '@/hooks/useMagnetic'
- Import { useParticleBurst } from '@/hooks/useParticleBurst'

STRUCTURE:
```tsx
export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [password, setPassword] = useState('')
  const { magneticProps } = useMagnetic({ strength: 0.3 })
  const { burstProps } = useParticleBurst()

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* LEFT: AuthScene BRAND THEATER */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-1/2 -z-10">
        <AuthScene />
      </div>
      
      {/* RIGHT: FORM PANEL */}
      <div className="relative lg:ml-1/2 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* ANIMATED TAB SWITCH */}
          <AnimatedTabSwitch
            tabs={['Sign In', 'Register']}
            activeIndex={isRegister ? 1 : 0}
            onChange={setIsRegister}
            variant={springStandard}
          />
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <AnimatedInput
              label="Email"
              type="email"
              placeholder="admin@freightquote.in"
              autoComplete="email"
              {...burstProps}
            />
            <AnimatedInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              {...burstProps}
            />
            
            {isRegister && (
              <PasswordStrengthMeter password={password} />
            )}
            
            <MagneticButton 
              type="submit" 
              className="w-full py-4"
              {...magneticProps}
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </MagneticButton>
          </form>
        </div>
      </div>
    </div>
  )
}
```

════════════════════════════════════════════════════════════════
3. CALCULATE PAGE — src/app/calculate/page.tsx
════════════════════════════════════════════════════════════════
REPLACE ENTIRE FILE with:
- Import CalculatorScene from '@/components/three/CalculatorScene'
- Import AnimatedInput from '@/components/ui/AnimatedInput'
- Import MagneticButton from '@/components/ui/MagneticButton'
- Import ModeSelector from '@/components/ModeSelector'
- Import { springStandard, springMagnetic } from '@/lib/animations/variants'
- Import { useMagnetic } from '@/hooks/useMagnetic'
- Import { useParticleBurst } from '@/hooks/useParticleBurst'
- Import pincode autocomplete from '/api/pincodes'

3-ZONE LAYOUT (CSS Grid):
```tsx
<div className="grid lg:grid-cols-[35%_40%_25%] gap-6 min-h-screen p-6">
  {/* LEFT: STICKY INPUT PANEL */}
  <aside className="lg:sticky lg:top-6 space-y-6">
    <ModeSelector /> {/* existing tabs: Road | Air | Sea | Rail */}
    
    <AnimatedInput 
      label="Origin Pincode"
      placeholder="400001"
      // pincode autocomplete from /api/pincodes
      {...burstProps}
    />
    <AnimatedInput 
      label="Destination Pincode"
      placeholder="110001"
      {...burstProps}
    />
    
    {/* Weight slider with live value */}
    <div>
      <label className="text-xs uppercase tracking-wider text-slate-400 mb-2 block">Weight (kg)</label>
      <input type="range" min="100" max="30000" step="100" className="w-full accent-cyan-400" />
    </div>
    
    {/* Commodity searchable select */}
    <AnimatedInput 
      label="Commodity"
      placeholder="Search 125+ categories..."
      // map COMMODITY_FACTORS from road-engine
      {...burstProps}
    />
    
    {/* Advanced toggles: dimensions, vehicle type, incoterms */}
    <details className="border-t border-white/5 pt-4">
      <summary className="text-xs uppercase tracking-wider text-slate-400 cursor-pointer">
        Advanced Options
      </summary>
      {/* dimensions, vehicle, incoterms inputs */}
    </details>
    
    <MagneticButton 
      onClick={calculate} 
      className="w-full py-4 text-lg"
      {...magneticProps}
    >
      Calculate Rate
    </MagneticButton>
  </aside>

  {/* CENTER: RESULTS DISPLAY */}
  <main className="space-y-6">
    {/* Cost breakdown card - glassmorphism, organic radii */}
    {/* Toll breakdown - expandable list */}
    {/* Benchmark comparison bars */}
  </main>

  {/* RIGHT: LIVE BENCHMARKS */}
  <aside className="space-y-4">
    {/* Blue Dart, SpiceXpress, IndiGo, Rail, Ocean cards */}
    {/* Real-time updating rates */}
  </aside>
</div>

KEYBOARD SHORTCUTS (useEffect):
- Cmd/Ctrl + Enter → calculate
- Keys 1,2,3,4 → switch modes
- Cmd/Ctrl + Shift + C → clear form
```

════════════════════════════════════════════════════════════════
4. DASHBOARD — src/app/dashboard/page.tsx
════════════════════════════════════════════════════════════════
- CalculatorWidget component (quick quote inline)
- Collapsible sidebar with Framer Motion layout animation (300ms spring)
- Role switcher pill: Admin | Forwarder | Viewer
- Kanban pipeline using @dnd-kit + Framer Motion layoutId
- SSE connection to /api/bids/stream for live bidding

════════════════════════════════════════════════════════════════
5. ANALYTICS — src/app/dashboard/analytics/page.tsx
════════════════════════════════════════════════════════════════
- Tab 1: Heatmap - India SVG with curved arcs (d3-scale + Framer Motion path draw)
- Tab 2: Waterfall - Bars grow from baseline (useInView + animate height)
- Tab 3: Predictive - Regression line draws, CI band fills (custom least-squares)
- Tab 4: Uncle's View - 4-sheet Excel export via SheetJS (xlsx)

──────────────────────────────────────────────────────────────────
NON-NEGOTIABLE STANDARDS (enforce everywhere)
──────────────────────────────────────────────────────────────────
✅ Pure black #000000 background
✅ Satoshi Variable font (already in globals.css --font-sans)
✅ Framer Motion springs ONLY from variants.ts:
   - springStandard: { type: 'spring', stiffness: 280, damping: 24 }
   - springMagnetic: { type: 'spring', stiffness: 450, damping: 30 }
✅ Organic radii: rounded-organic-1 (16px), -2 (24px), -3 (32px)
✅ Glassmorphism: bg-white/[0.02] backdrop-blur-3xl border-white/5
✅ Zero rectangular cards - all organic radii
✅ Dark mode only
✅ prefers-reduced-motion respected
✅ 60fps - no heavy Three.js in calculate center, no Mapbox
✅ Keyboard shortcuts on calculate page
✅ Calculator ONLY after login (landing is marketing-only)

──────────────────────────────────────────────────────────────────
EXECUTION ORDER
──────────────────────────────────────────────────────────────────
1. Landing page - wire HeroScene, animate counters, add globe SVG
2. Login page - wire AuthScene, MagneticButton, AnimatedInput, tabs, password strength
3. Calculate page - 3-zone layout, keyboard shortcuts, NO map
4. Dashboard - CalculatorWidget, sidebar, Kanban, SSE
5. Analytics - 4 tabs with animations

VERIFY: npm run build && npx tsc --noEmit && npm run lint
ALL MUST PASS before declaring done.