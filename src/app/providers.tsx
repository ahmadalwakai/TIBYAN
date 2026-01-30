"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { ToasterProvider } from "@/components/ui/toaster";
import type { ReactNode } from "react";
import system from "@/lib/theme";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <ToasterProvider>{children}</ToasterProvider>
      </ColorModeProvider>
    </ChakraProvider>
  );
}
