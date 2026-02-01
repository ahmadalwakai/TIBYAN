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
      defaultTheme="light"
      storageKey="theme"
      forcedTheme={undefined}
      disableTransitionOnChange={true}
      {...props} 
    />
  );
}

export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const toggleColorMode = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };
  
  // Return default "light" on server/before mount to prevent hydration mismatch
  return {
    colorMode: mounted ? resolvedTheme : "light",
    setColorMode: setTheme,
    toggleColorMode,
  };
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === "light" ? light : dark;
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode();
  return colorMode === "light" ? "🌙" : "☀️";
}

interface ColorModeButtonProps {
  size?: "sm" | "md" | "lg";
}

export const ColorModeButton = ({ size = "sm" }: ColorModeButtonProps) => {
  const { toggleColorMode } = useColorMode();
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <IconButton
        onClick={toggleColorMode}
        variant="ghost"
        aria-label="Toggle color mode"
        size={size}
      >
        <ColorModeIcon />
      </IconButton>
    </ClientOnly>
  );
};
