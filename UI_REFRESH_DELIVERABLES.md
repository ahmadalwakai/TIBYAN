# UI/UX Refresh: Card System Deliverables

## Summary
Unified premium card system inspired by top Islamic education platforms (SeekersGuidance, Zad Academy, Bayyinah). Simplified animation approach using CSS transitions for better maintainability and Chakra UI v3 compatibility.

---

## Files Created

### Card System (`src/components/ui/cards/`)
| File | Purpose |
|------|---------|
| [BaseCard.tsx](src/components/ui/cards/BaseCard.tsx) | Foundation component with 4 variants: `default`, `elevated`, `outlined`, `glass`. CSS-based hover lift and glow effects. |
| [FeatureCard.tsx](src/components/ui/cards/FeatureCard.tsx) | Feature showcase with icon, gradient backgrounds, staggered fade-in animation. |
| [CourseCard.tsx](src/components/ui/cards/CourseCard.tsx) | Course listing card with icon, instructor, price badge, duration, CTA button. |
| [index.ts](src/components/ui/cards/index.ts) | Barrel export for clean imports. |

### Homepage Sections (`src/components/home/`)
| File | Purpose |
|------|---------|
| [HeroSection.tsx](src/components/home/HeroSection.tsx) | Video hero with animated badge, gradient text, CTA buttons, floating orbs. |
| [FeaturesSection.tsx](src/components/home/FeaturesSection.tsx) | 6-feature grid using new FeatureCard component. |
| [ProgramsSection.tsx](src/components/home/ProgramsSection.tsx) | Educational programs showcase with CourseCard. |
| [TestimonialsSection.tsx](src/components/home/TestimonialsSection.tsx) | Story-driven social proof with avatar, stars, quote styling. |
| [CTASection.tsx](src/components/home/CTASection.tsx) | Final conversion section with glowing button effects. |
| [index.ts](src/components/home/index.ts) | Barrel export for modular imports. |

---

## Files Modified

| File | Changes |
|------|---------|
| [src/app/courses/page.tsx](src/app/courses/page.tsx#L16) | Replaced `NeonCard` with `CourseCard` and `BaseCard`. |

---

## Files Deleted

| File | Reason |
|------|--------|
| `src/components/ui/NeonCard.tsx` | Replaced by `cards/CourseCard.tsx`. No remaining imports. |
| `src/components/ui/FeatureCard.tsx` | Replaced by `cards/FeatureCard.tsx`. No remaining imports. |

---

## Files Preserved

| File | Reason |
|------|--------|
| `src/components/ui/PremiumCard.tsx` | Still used in `TeacherSidebar.tsx`, `SocialFeed.tsx`, 3 other files. |
| `src/components/ui/StatCard.tsx` | Widely used in admin/teacher/student portals (10+ usages). |

---

## Component API Reference

### BaseCard
```tsx
import { BaseCard } from "@/components/ui/cards";

<BaseCard
  variant="elevated"     // "default" | "elevated" | "outlined" | "glass"
  hoverLift={true}       // Enable Y-axis lift on hover
  hoverGlow={true}       // Enable soft glow on hover
  glowColor="#c8a24a"    // Custom glow color
>
  {children}
</BaseCard>
```

### CourseCard
```tsx
import { CourseCard } from "@/components/ui/cards";

<CourseCard
  title="Qur'an Memorization"
  description="Master tajweed with certified scholars"
  icon={<BookIcon />}
  instructor="Dr. Ahmad"
  price="$199"
  duration="12 weeks"
  href="/courses/quran"
/>
```

### FeatureCard
```tsx
import { FeatureCard } from "@/components/ui/cards";

<FeatureCard
  title="Live Sessions"
  description="Interactive classes with scholars"
  icon={<VideoIcon />}
  index={0}  // For staggered animation delay
/>
```

---

## Design Tokens Used
- `cardBg` - Card background (light/dark mode aware)
- `cardBorder` - Default border color
- `cardHoverBorder` - Hover state border
- `accent` - Gold accent (#c8a24a)
- `primary` - Navy blue (#0b1f3b)

---

## Migration Guide

### Replace NeonCard → CourseCard
```diff
- import NeonCard from "@/components/ui/NeonCard";
+ import { CourseCard } from "@/components/ui/cards";

- <NeonCard title="..." ... />
+ <CourseCard title="..." ... />
```

### Use Modular Homepage Sections
```tsx
import {
  HeroSection,
  FeaturesSection,
  ProgramsSection,
  TestimonialsSection,
  CTASection,
} from "@/components/home";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <ProgramsSection />
      <TestimonialsSection />
      <CTASection />
    </main>
  );
}
```

---

## Build Status
✅ TypeScript: No errors  
✅ Next.js Build: Successful  
✅ Static pages: 99/99 generated

---

## Next Steps (Optional)
1. Refactor `src/app/page.tsx` (2293 lines) to use modular sections
2. Replace `PremiumCard` usages with appropriate `BaseCard` variants
3. Add RTL-specific hover animations for Arabic locale
