━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIMPLIFIED $1M CALCULATOR - FOCUS ON FUNCTION, MINIMAL DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGN PHILOSOPHY: Calculator-first, minimal design. No heavy maps, no heavy Three.js scenes.
- Small globe in top-left corner (optional, subtle)
- Pure black #000000, Satoshi Variable font
- Calculator is the hero - everything else supports it
- Calculator ONLY after login (middleware handles this)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGES TO IMPLEMENT (4 pages total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. LANDING (/) - Marketing only, NO calculator
   - Hero: Simple headline, subtext, CTA to /login
   - Features: 4 cards (Tolls, Pincodes, Modes, Benchmarks)
   - Pricing: 3 tiers
   - Small subtle globe in top-left (SVG, not Three.js)
   - Pure black, Satoshi Variable, glassmorphism cards

2. LOGIN (/login) - Split screen
   - Left: Brand + subtle animated particles (optional, lightweight)
   - Right: Glass panel, animated Sign In/Signup tabs, password strength, magnetic CTA

3. CALCULATE (/calculate) - THE MAIN PRODUCT (protected)
   - 3-zone: Left sticky input | Center results | Right benchmarks
   - NO Mapbox, NO India map, NO Three.js globe
   - Just clean form + instant results + benchmark comparison
   - Keyboard: Cmd+Enter calculate, 1-4 modes, Cmd+Shift+C clear

4. DASHBOARD (/dashboard) - Post-login hub
   - CalculatorWidget (quick access)
   - Leads pipeline (Kanban)
   - Analytics summary

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK (MINIMAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Satoshi Variable (Fontshare CDN)
- Pure black #000000
- Framer Motion for all animations (springs)
- Glassmorphism cards (rgba(255,255,255,0.02) fill, 0.04 border, blur(40px))
- Organic asymmetric radii (24px 48px 16px 32px)
- Framer Motion springs: standard {280, 24}, magnetic {450, 30}
- NO Three.js, NO Mapbox, NO heavy dependencies
- Pure black #000000, dark mode only

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHARED ANIMATED COMPONENTS (components/ui/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MagneticButton - cursor follow, ripple, loading→success morph
2. AnimatedInput - label lift, border glow, particle burst on focus
3. AnimatedSelect - dropdown stagger, search highlight
4. PasswordStrength - 5 animated segments
5. AnimatedTabSwitch - morphing indicator
5. GlassBlob - organic asymmetric cards
6. StatBlob - animated counters
7. Toast, Modal, Tooltip, Divider, Skeleton

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTHENTICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Middleware protects /calculate, /dashboard, /dashboard/analytics
- /login, /api/quote, /api/pincodes public
- Basic Auth: admin / admin123 (or admin@freightquote.in / Freight@2026)
- Cookie-based session

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENTATION ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Satoshi font + motion variants + globals.css
2. Shared UI components (MagneticButton, AnimatedInput, etc.)
3. Landing page (/) - marketing only
3. Login page (/login) - split screen
4. Calculate page (/calculate) - THE PRODUCT
4. Dashboard (/dashboard) - post-login hub
5. Dashboard analytics (optional)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 60fps on 2018 MacBook Air
✅ Lighthouse >92, Accessibility 100
✅ Zero console errors, TS strict, zero any
✅ prefers-reduced-motion respected
✅ Keyboard navigable, ARIA complete
✅ Dark mode ONLY
✅ Calculator ONLY after login
✅ No Three.js, No Mapbox, No heavy deps
