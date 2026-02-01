"use client";

import {
  Drawer,
  Box,
  Flex,
  Text,
} from "@chakra-ui/react";

interface PortalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  placement?: "left" | "right";
}

export default function PortalDrawer({
  isOpen,
  onClose,
  title,
  children,
  placement = "right",
}: PortalDrawerProps) {
  const drawerPlacement = placement === "right" ? "end" : "start";
  const safeAreaLeft = placement === "right" ? "0px" : "env(safe-area-inset-left)";
  const safeAreaRight = placement === "right" ? "env(safe-area-inset-right)" : "0px";
  return (
    <Drawer.Root
      open={isOpen}
      placement={drawerPlacement}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
    >
      <Drawer.Backdrop bg="blackAlpha.600" zIndex={1400} />
      <Drawer.Positioner zIndex={1401}>
        <Drawer.Content
          bg="background"
          maxH="100dvh"
          pt="env(safe-area-inset-top)"
          pb="env(safe-area-inset-bottom)"
          pl={safeAreaLeft}
          pr={safeAreaRight}
          zIndex={1402}
          boxShadow="xl"
        >
          <Drawer.Header px={4} py={3} borderBottom="1px solid" borderColor="border">
            <Flex align="center" justify="space-between">
              <Drawer.Title>
                <Text fontWeight="700">{title}</Text>
              </Drawer.Title>
              <Drawer.CloseTrigger
                aria-label="إغلاق القائمة"
                fontSize="lg"
                bg="transparent"
                _hover={{ bg: "surfaceHover" }}
                borderRadius="button"
                px={2}
              >
                ✕
              </Drawer.CloseTrigger>
            </Flex>
          </Drawer.Header>
          <Drawer.Body px={3} py={4}>
            <Box>{children}</Box>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
