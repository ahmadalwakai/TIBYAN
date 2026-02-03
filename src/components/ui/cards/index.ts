/**
 * Unified Card System
 * Single source of truth for all card components
 */

export { default as BaseCard } from "./BaseCard";
export type { BaseCardProps, CardVariant } from "./BaseCard";

export { default as FeatureCard } from "./FeatureCard";
export type { FeatureCardProps } from "./FeatureCard";

export { default as CourseCard } from "./CourseCard";
export type { CourseCardProps } from "./CourseCard";

// Re-export StatCard from parent (kept for backward compatibility)
// StatCard is used across admin/teacher/student portals
export { default as StatCard } from "../StatCard";
