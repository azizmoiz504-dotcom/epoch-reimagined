# Epoch — Crafting Excellence (redesign prototype)

A reimagined website for **Epoch Aerosols Industries LLC**, a family-owned aerosol, cosmetics & toiletries manufacturer in Umm Al Quwain, UAE.

## Concept — *Atmosphere*
Epoch makes mists, sprays and scents, so the site behaves like one. The hero is a live particle spray that assembles the Epoch mark (sprig, wordmark and bar), parts around the cursor, bursts on click, and disperses into mist as you scroll.

## What's inside
- **Loader**: the sprig grows and the wordmark rises, then the curtain lifts.
- **Hero**: canvas particle system sampled from the logo, with spray-in intro, cursor repulsion, click-to-spray and scroll dispersal.
- **About**: a manifesto that inks in word by word, a parallax factory image, animated stats and the brand partners (AFS Elegant, Simba, Maya, Ego).
- **Our Story**: a pinned horizontal timeline from Rajasthan → Dubai in 1963 to Umm Al Quwain today.
- **The Collection**: six stacked, colour-themed product worlds. Each opens a drawer with *every* product and its full details from the original site.
- **Capabilities**: a bento grid with animated R&D flask, can sizes (75–400 ml), certification seal and scent wheel.
- **Client Journey**: the 5-step process, with a droplet travelling a path that draws as you scroll.
- **Scent Lab** (new): compose a product (format, scent family, base, size, brand name). The vessel morphs and sprays, and the brief goes to WhatsApp or email in one tap.
- **FAQ, Careers (with CV upload), Contact (map, phone, email, WhatsApp), Privacy Policy, footer**: everything from the original site.

## Tech
Static HTML/CSS/JS, no build step. GSAP + ScrollTrigger + Lenis are vendored in `assets/vendor`. It respects `prefers-reduced-motion`, works on mobile, and the forms open the visitor's email app, so no backend is needed.

Run locally: `npx http-server .` and open http://localhost:8080
