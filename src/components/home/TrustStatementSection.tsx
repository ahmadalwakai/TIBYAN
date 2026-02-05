"use client";

import { Box, Text } from "@chakra-ui/react";
import { useLocale } from "next-intl";
import { trustStatement } from "@/config/academyActivity";

/**
 * TrustStatementSection
 * 
 * ONE real statement about what parents actually get.
 * Not testimonials. Not reviews. Just a fact.
 */
export default function TrustStatementSection() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  return (
    <Box
      as="section"
      bg="whiteAlpha.50"
      borderRadius="2xl"
      border="1px solid"
      borderColor="whiteAlpha.200"
      p={{ base: 6, md: 8 }}
      textAlign="center"
    >
      <Text 
        color="gray.300" 
        fontSize={{ base: "md", md: "lg" }}
        fontStyle="italic"
        lineHeight="1.9"
      >
        "{isArabic ? trustStatement.ar : trustStatement.en}"
      </Text>
    </Box>
  );
}
