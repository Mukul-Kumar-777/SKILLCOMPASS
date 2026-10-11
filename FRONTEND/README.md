# SkillCompass — Claymorphism Dashboard

This version keeps the dashboard composition and visual language centered on the supplied Claymorphism reference.

## What was fixed in this iteration

1. **Skill Profile, Skill Network, and Quick Actions no longer collapse vertically.**
   The middle dashboard row is now a fixed-height flex item, so its three panels keep their full intended content area instead of shrinking when the bottom row is rendered.

2. **The dashboard now scrolls vertically.**
   The page uses normal document flow instead of clipping the entire dashboard to the viewport. The sidebar remains sticky on desktop while the main content can be scrolled.

3. **Navigation now scrolls to dashboard sections.**
   Overview, Skills, Analysis, Jobs, GitHub, and Skill Gaps navigation items use smooth scrolling to the relevant dashboard area where a section exists.

4. **Additional interaction was added to the skill network.**
   Network nodes respond to hover and click, with a small Claymorphism tooltip/toast interaction.

5. **Panel and quick-action hover states were strengthened** so the dashboard feels less static while preserving the Claymorphism visual language.

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```
