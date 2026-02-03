"use client";

import { ClientOnly, IconButton, Skeleton } from "@chakra-ui/react";
import { ThemeProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useEffect, useState } from "react";

export function ColorModeProvider(props: ThemeProviderProps) {
  return (
    <ThemeProvider 
      attribute="class" 
      enableSystem={false}
      defaultTheme="dark"
      storageKey="theme"
      forcedTheme="dark"
      disableTransitionOnChange={true}
      {...props} 
    />
  );
}

export function useColorMode() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Needed for SSR hydration - legitimate setState in effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Force dark mode
    setTheme("dark");
  }, [setTheme]);
  
  const toggleColorMode = () => {
    // No-op - always dark mode
  };
  
  // Always return dark mode
  return {
    colorMode: "dark" as const,
    setColorMode: setTheme,
    toggleColorMode,
  };
}

export function useColorModeValue<T>(light: T, dark: T) {
  // Always return dark value
  return dark;
}

export function ColorModeIcon() {
  // Always show moon icon (dark mode)
  return "🌙";
}

interface ColorModeButtonProps {
  size?: "sm" | "md" | "lg";
}

export const ColorModeButton = ({ size = "sm" }: ColorModeButtonProps) => {
  // Hidden - no color mode toggle in cyber neon theme
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <IconButton
        variant="ghost"
        aria-label="Dark mode active"
        size={size}
        display="none"
      >
        <ColorModeIcon />
      </IconButton>
    </ClientOnly>
  );
};
