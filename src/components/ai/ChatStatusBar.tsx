"use client";

import { Badge, Box, Flex, HStack, Icon, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuActivity, LuCircleAlert, LuCircleCheck, LuServer } from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";

interface ChatStatusBarProps {
  language?: "ar" | "en";
}

interface HealthStatus {
  online: boolean;
  provider: string;
  contextSize: number;
  latency?: number;
}

export function ChatStatusBar({ language = "ar" }: ChatStatusBarProps) {
  const [status, setStatus] = useState<HealthStatus>({
    online: false,
    provider: "local",
    contextSize: 4096,
  });
  const [checking, setChecking] = useState(false);
  const isRTL = language === "ar";

  useEffect(() => {
    const checkHealth = async () => {
      setChecking(true);
      try {
        const start = Date.now();
        const res = await fetch("/api/ai/agent", {
          method: "GET",
          signal: AbortSignal.timeout(3000),
        });
        const latency = Date.now() - start;
        
        if (res.ok) {
          const data = await res.json();
          setStatus({
            online: true,
            provider: data.data?.debug?.provider || "local",
            contextSize: 4096,
            latency,
          });
        } else {
          setStatus((prev) => ({ ...prev, online: false }));
        }
      } catch {
        setStatus((prev) => ({ ...prev, online: false }));
      } finally {
        setChecking(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      bg="gray.50"
      borderBottom="1px"
      borderColor="gray.200"
      px={4}
      py={2}
    >
      <Flex justify="space-between" align="center" dir={isRTL ? "rtl" : "ltr"}>
        <HStack gap={3} fontSize="sm">
          <Tooltip content={isRTL ? "حالة الاتصال" : "Connection status"} positioning={{ placement: "bottom" }}>
            <Badge
              colorPalette={status.online ? "green" : "red"}
              variant="subtle"
            >
              <Icon asChild>
                {checking ? (
                  <Spinner size="xs" />
                ) : status.online ? (
                  <LuCircleCheck />
                ) : (
                  <LuCircleAlert />
                )}
              </Icon>
              <Text ms={1}>
                {status.online
                  ? isRTL
                    ? "متصل"
                    : "Online"
                  : isRTL
                  ? "غير متصل"
                  : "Offline"}
              </Text>
            </Badge>
          </Tooltip>

          {status.online && (
            <>
              <Tooltip content={isRTL ? "المزود" : "Provider"} positioning={{ placement: "bottom" }}>
                <Badge colorPalette="blue" variant="outline">
                  <Icon asChild><LuServer /></Icon>
                  <Text ms={1}>{status.provider}</Text>
                </Badge>
              </Tooltip>

              <Tooltip content={isRTL ? "حجم السياق" : "Context size"} positioning={{ placement: "bottom" }}>
                <Badge colorPalette="gray" variant="outline">
                  <Text>{status.contextSize} tokens</Text>
                </Badge>
              </Tooltip>

              {status.latency !== undefined && (
                <Tooltip content={isRTL ? "زمن الاستجابة" : "Latency"} positioning={{ placement: "bottom" }}>
                  <Badge
                    colorPalette={status.latency < 100 ? "green" : status.latency < 500 ? "yellow" : "orange"}
                    variant="subtle"
                  >
                    <Icon asChild><LuActivity /></Icon>
                    <Text ms={1}>{status.latency}ms</Text>
                  </Badge>
                </Tooltip>
              )}
            </>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}
