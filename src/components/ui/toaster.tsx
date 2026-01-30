"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Box, Text, Flex, Portal } from "@chakra-ui/react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToasterContextType {
  success: (options: { title: string; description?: string }) => void;
  error: (options: { title: string; description?: string }) => void;
  info: (options: { title: string; description?: string }) => void;
  warning: (options: { title: string; description?: string }) => void;
  create: (options: { title: string; description?: string; type?: ToastType }) => void;
}

const ToasterContext = createContext<ToasterContextType | null>(null);

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, description?: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const success = useCallback((opts: { title: string; description?: string }) => {
    addToast(opts.title, opts.description, "success");
  }, [addToast]);

  const error = useCallback((opts: { title: string; description?: string }) => {
    addToast(opts.title, opts.description, "error");
  }, [addToast]);

  const info = useCallback((opts: { title: string; description?: string }) => {
    addToast(opts.title, opts.description, "info");
  }, [addToast]);

  const warning = useCallback((opts: { title: string; description?: string }) => {
    addToast(opts.title, opts.description, "warning");
  }, [addToast]);

  const create = useCallback((opts: { title: string; description?: string; type?: ToastType }) => {
    addToast(opts.title, opts.description, opts.type || "info");
  }, [addToast]);

  const getColors = (type: ToastType) => {
    switch (type) {
      case "success": return { bg: "green.500", border: "green.600" };
      case "error": return { bg: "red.500", border: "red.600" };
      case "warning": return { bg: "yellow.500", border: "yellow.600" };
      default: return { bg: "blue.500", border: "blue.600" };
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success": return "✓";
      case "error": return "✕";
      case "warning": return "⚠";
      default: return "ℹ";
    }
  };

  return (
    <ToasterContext.Provider value={{ success, error, info, warning, create }}>
      {children}
      <Portal>
        <Flex
          position="fixed"
          top={4}
          left="50%"
          transform="translateX(-50%)"
          direction="column"
          gap={2}
          zIndex={9999}
          maxW="400px"
          w="full"
          px={4}
        >
          {toasts.map((toast) => {
            const colors = getColors(toast.type);
            return (
              <Box
                key={toast.id}
                bg={colors.bg}
                color="white"
                px={4}
                py={3}
                borderRadius="lg"
                boxShadow="lg"
                display="flex"
                alignItems="flex-start"
                gap={3}
                css={{
                  animation: "toastSlideIn 0.3s ease",
                  "@keyframes toastSlideIn": {
                    from: { opacity: 0, transform: "translateY(-10px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <Text fontSize="lg">{getIcon(toast.type)}</Text>
                <Box>
                  <Text fontWeight="bold">{toast.title}</Text>
                  {toast.description && (
                    <Text fontSize="sm" opacity={0.9}>{toast.description}</Text>
                  )}
                </Box>
              </Box>
            );
          })}
        </Flex>
      </Portal>
    </ToasterContext.Provider>
  );
}

// Hook for components
export function useToaster(): ToasterContextType {
  const context = useContext(ToasterContext);
  if (!context) {
    // Return no-op functions if used outside provider
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
      create: () => {},
    };
  }
  return context;
}

// Singleton toaster for use outside React components
let toasterInstance: ToasterContextType | null = null;

export function setToasterInstance(instance: ToasterContextType) {
  toasterInstance = instance;
}

export const toaster: ToasterContextType = {
  success: (opts) => toasterInstance?.success(opts),
  error: (opts) => toasterInstance?.error(opts),
  info: (opts) => toasterInstance?.info(opts),
  warning: (opts) => toasterInstance?.warning(opts),
  create: (opts) => toasterInstance?.create(opts),
};
