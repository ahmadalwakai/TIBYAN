import { Tooltip as ChakraTooltip } from "@chakra-ui/react";
import * as React from "react";

export interface TooltipProps {
  content: React.ReactNode;
  positioning?: {
    placement?: "top" | "bottom" | "left" | "right";
  };
  children: React.ReactElement;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, positioning, children }, ref) => {
    return (
      <ChakraTooltip.Root positioning={positioning}>
        <ChakraTooltip.Trigger asChild>
          {children}
        </ChakraTooltip.Trigger>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content
            ref={ref}
            bg="gray.800"
            color="white"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            fontSize="xs"
          >
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </ChakraTooltip.Root>
    );
  }
);

Tooltip.displayName = "Tooltip";
