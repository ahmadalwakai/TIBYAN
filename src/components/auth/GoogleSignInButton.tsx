"use client";

import { Box, Button, Text, Spinner } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { toaster } from "@/components/ui/toaster";

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  /** Text variant for the button */
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  /** Default redirect path if no `next` param */
  defaultRedirect?: string;
  /** Callback after successful login */
  onSuccess?: (redirectUrl: string) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

// Google logo SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
      fill="#4285F4"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
      fill="#34A853"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z"
      fill="#FBBC05"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
      fill="#EA4335"
    />
  </svg>
);

/**
 * Google Sign-In Button Component
 * Uses Google Identity Services (GSI) to render a native Google button.
 * Falls back to a custom styled button if GSI fails to load.
 */
export default function GoogleSignInButton({
  text = "signin_with",
  defaultRedirect = "/member",
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [gsiAvailable, setGsiAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Dev debug: warn if client ID is missing
  useEffect(() => {
    if (!clientId && process.env.NODE_ENV === "development") {
      console.warn(
        "[GoogleSignIn] NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing. Google Sign-In will not work."
      );
    }
  }, [clientId]);

  // Get redirect URL from query params or use default
  const getRedirectUrl = useCallback(() => {
    const next = searchParams.get("next") || searchParams.get("redirect");
    if (next && next.startsWith("/")) {
      const allowedPrefixes = ["/member", "/student", "/teacher", "/admin", "/courses", "/"];
      const isAllowed = allowedPrefixes.some(
        (prefix) => next === prefix || next.startsWith(prefix + "/")
      );
      return isAllowed ? next : defaultRedirect;
    }
    return defaultRedirect;
  }, [searchParams, defaultRedirect]);

  // Handle credential response from Google
  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setIsAuthenticating(true);

      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();

        if (!data.ok) {
          const errorMessage = data.error || "فشل تسجيل الدخول بـ Google";
          toaster.error({
            title: "خطأ",
            description: errorMessage,
          });
          onError?.(errorMessage);
          return;
        }

        // Success - redirect
        const redirectUrl = getRedirectUrl();
        onSuccess?.(redirectUrl);
        window.location.href = redirectUrl;
      } catch (err) {
        const errorMessage = "حدث خطأ في الاتصال";
        toaster.error({
          title: "خطأ",
          description: errorMessage,
        });
        onError?.(errorMessage);
        if (process.env.NODE_ENV === "development") {
          console.error("[GoogleSignIn] POST /api/auth/google error:", err);
        }
      } finally {
        setIsAuthenticating(false);
      }
    },
    [getRedirectUrl, onSuccess, onError]
  );

  // Initialize GSI
  useEffect(() => {
    if (initializedRef.current || !clientId) {
      setIsLoading(false);
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[GoogleSignIn] window.google not available, using fallback button");
        }
        setGsiAvailable(false);
        setIsLoading(false);
        return;
      }

      // Wait a tick for ref to be attached
      requestAnimationFrame(() => {
        if (!buttonRef.current) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[GoogleSignIn] buttonRef not ready");
          }
          setGsiAvailable(false);
          setIsLoading(false);
          return;
        }

        try {
          window.google!.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          window.google!.accounts.id.renderButton(buttonRef.current, {
            theme: "filled_black",
            size: "large",
            text,
            shape: "rectangular",
            logo_alignment: "center",
            width: 300,
            locale: "ar",
          });

          initializedRef.current = true;
          setGsiAvailable(true);
          setIsLoading(false);
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.error("[GoogleSignIn] Initialization error:", err);
          }
          setGsiAvailable(false);
          setIsLoading(false);
        }
      });
    };

    // Check if already loaded
    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    // Check for existing script
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          initializeGoogle();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!initializedRef.current) {
          setIsLoading(false);
        }
      }, 3000);
      return;
    }

    // Load script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          initializeGoogle();
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!initializedRef.current) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[GoogleSignIn] GSI script loaded but google object not available");
          }
          setIsLoading(false);
        }
      }, 3000);
    };

    script.onerror = () => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[GoogleSignIn] Failed to load GSI script, using fallback");
      }
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, [clientId, handleCredentialResponse, text]);

  // Fallback: trigger GSI prompt manually
  const handleFallbackClick = () => {
    if (!clientId) {
      toaster.error({
        title: "خطأ",
        description: "تسجيل الدخول بـ Google غير متاح حالياً",
      });
      return;
    }

    // Try to initialize GSI on-demand if not already done
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        // Trigger the One Tap prompt
        window.google.accounts.id.prompt();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("[GoogleSignIn] Failed to trigger prompt:", err);
        }
        toaster.error({
          title: "خطأ",
          description: "فشل فتح نافذة تسجيل الدخول بـ Google",
        });
      }
    } else {
      toaster.error({
        title: "خطأ", 
        description: "خدمة Google غير متوفرة. جرب تعطيل مانع الإعلانات.",
      });
    }
  };

  // Get button text based on variant
  const getButtonText = () => {
    switch (text) {
      case "signup_with":
        return "التسجيل بواسطة Google";
      case "continue_with":
        return "المتابعة بواسطة Google";
      case "signin":
        return "Google";
      case "signin_with":
      default:
        return "تسجيل الدخول بواسطة Google";
    }
  };

  // No client ID - don't render anything
  if (!clientId) {
    return null;
  }

  return (
    <Box w="full" display="flex" flexDirection="column" justifyContent="center" alignItems="center" minH="44px">
      {(isLoading || isAuthenticating) && (
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          py={3}
          px={4}
          bg="rgba(255, 255, 255, 0.05)"
          borderRadius="md"
        >
          <Spinner size="sm" color="gray.400" />
          <Text color="gray.400" fontSize="sm">
            {isAuthenticating ? "جاري تسجيل الدخول..." : "جاري التحميل..."}
          </Text>
        </Box>
      )}

      {/* GSI Native Button Container - always in DOM for ref, but hidden when not ready */}
      <Box
        ref={buttonRef}
        position={gsiAvailable && !isLoading && !isAuthenticating ? "relative" : "absolute"}
        visibility={gsiAvailable && !isLoading && !isAuthenticating ? "visible" : "hidden"}
        pointerEvents={gsiAvailable && !isLoading && !isAuthenticating ? "auto" : "none"}
        h={gsiAvailable && !isLoading && !isAuthenticating ? "auto" : "0"}
        overflow="hidden"
        css={{
          "& > div": {
            width: "100% !important",
            maxWidth: "300px",
            margin: "0 auto",
          },
        }}
      />

      {/* Fallback Custom Button - shown when GSI is not available */}
      {!isLoading && !isAuthenticating && !gsiAvailable && (
        <Button
          onClick={handleFallbackClick}
          size="lg"
          w="full"
          maxW="300px"
          bg="white"
          color="gray.700"
          border="1px solid"
          borderColor="gray.300"
          borderRadius="md"
          fontWeight="500"
          fontSize="14px"
          _hover={{
            bg: "gray.50",
            borderColor: "gray.400",
          }}
          _active={{
            bg: "gray.100",
          }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={3}
        >
          <GoogleIcon />
          <Text>{getButtonText()}</Text>
        </Button>
      )}
    </Box>
  );
}
