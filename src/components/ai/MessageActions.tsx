"use client";

import { HStack, Icon, IconButton } from "@chakra-ui/react";
import { useState } from "react";
import {
  LuCopy,
  LuRefreshCw,
  LuShare2,
  LuThumbsDown,
  LuThumbsUp,
} from "react-icons/lu";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";

interface MessageActionsProps {
  messageId: string;
  content: string;
  language?: "ar" | "en";
  onRegenerate?: () => void;
}

export function MessageActions({
  messageId,
  content,
  language = "ar",
  onRegenerate,
}: MessageActionsProps) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`feedback_${messageId}`);
        return stored as "up" | "down" | null;
      } catch {
        // localStorage not available (SecurityError, etc.)
        return null;
      }
    }
    return null;
  });
  const isRTL = language === "ar";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toaster.create({
        title: isRTL ? "تم النسخ" : "Copied",
        type: "success",

      });
    } catch {
      toaster.create({
        title: isRTL ? "فشل النسخ" : "Copy failed",
        type: "error",
      });
    }
  };

  const handleFeedback = (type: "up" | "down") => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    
    if (typeof window !== "undefined") {
      try {
        if (newFeedback) {
          localStorage.setItem(`feedback_${messageId}`, newFeedback);
        } else {
          localStorage.removeItem(`feedback_${messageId}`);
        }
      } catch {
        // localStorage not available - ignore silently
      }
    }

    toaster.create({
      title: isRTL ? "شكراً على ملاحظاتك" : "Thanks for your feedback",
      type: "success",
    });
  };

  const handleShare = async () => {
    try {
      const text = `Tibyan AI Response:\n\n${content}`;
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        toaster.create({
          title: isRTL ? "تم النسخ للمشاركة" : "Copied to share",
          type: "success",
        });
      }
    } catch {
      // User cancelled or error
    }
  };

  return (
    <HStack gap={1} mt={2} dir={isRTL ? "rtl" : "ltr"}>
      <Tooltip content={isRTL ? "نسخ" : "Copy"} positioning={{ placement: "top" }}>
        <IconButton
          aria-label="Copy"
          size="xs"
          variant="ghost"
          _hover={{ bg: "whiteAlpha.100" }}
          _active={{ bg: "whiteAlpha.200" }}
          onClick={handleCopy}
        >
          <Icon boxSize={5} color="whiteAlpha.800" _groupHover={{ color: "whiteAlpha.900" }} asChild>
            <LuCopy />
          </Icon>
        </IconButton>
      </Tooltip>

      {onRegenerate && (
        <Tooltip content={isRTL ? "إعادة إنشاء" : "Regenerate"} positioning={{ placement: "top" }}>
          <IconButton
            aria-label="Regenerate"
            size="xs"
            variant="ghost"
            _hover={{ bg: "whiteAlpha.100" }}
            _active={{ bg: "whiteAlpha.200" }}
            onClick={onRegenerate}
          >
            <Icon boxSize={5} color="whiteAlpha.800" _groupHover={{ color: "whiteAlpha.900" }} asChild>
              <LuRefreshCw />
            </Icon>
          </IconButton>
        </Tooltip>
      )}

      <Tooltip content={isRTL ? "مشاركة" : "Share"} positioning={{ placement: "top" }}>
        <IconButton
          aria-label="Share"
          size="xs"
          variant="ghost"
          _hover={{ bg: "whiteAlpha.100" }}
          _active={{ bg: "whiteAlpha.200" }}
          onClick={handleShare}
        >
          <Icon boxSize={5} color="whiteAlpha.800" _groupHover={{ color: "whiteAlpha.900" }} asChild>
            <LuShare2 />
          </Icon>
        </IconButton>
      </Tooltip>

      <Tooltip content={isRTL ? "مفيد" : "Helpful"} positioning={{ placement: "top" }}>
        <IconButton
          aria-label="Thumbs up"
          size="xs"
          variant="ghost"
          _hover={{ bg: "whiteAlpha.100" }}
          _active={{ bg: "whiteAlpha.200" }}
          onClick={() => handleFeedback("up")}
        >
          <Icon
            boxSize={5}
            color={feedback === "up" ? "green.400" : "whiteAlpha.800"}
            _groupHover={{ color: feedback === "up" ? "green.300" : "whiteAlpha.900" }}
            asChild
          >
            <LuThumbsUp />
          </Icon>
        </IconButton>
      </Tooltip>

      <Tooltip content={isRTL ? "غير مفيد" : "Not helpful"} positioning={{ placement: "top" }}>
        <IconButton
          aria-label="Thumbs down"
          size="xs"
          variant="ghost"
          _hover={{ bg: "whiteAlpha.100" }}
          _active={{ bg: "whiteAlpha.200" }}
          onClick={() => handleFeedback("down")}
        >
          <Icon
            boxSize={5}
            color={feedback === "down" ? "red.400" : "whiteAlpha.800"}
            _groupHover={{ color: feedback === "down" ? "red.300" : "whiteAlpha.900" }}
            asChild
          >
            <LuThumbsDown />
          </Icon>
        </IconButton>
      </Tooltip>
    </HStack>
  );
}
