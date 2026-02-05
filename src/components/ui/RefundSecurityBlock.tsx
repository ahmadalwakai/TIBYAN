"use client";

import { Box, Heading, Stack, Text, Flex } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function RefundSecurityBlock() {
  const tRefund = useTranslations("ui.refund");
  const tSecurity = useTranslations("ui.security");

  return (
    <Box
      borderRadius="2xl"
      bg="#050505"
      border="1px solid"
      borderColor="rgba(0, 255, 42, 0.3)"
      p={{ base: 6, md: 8 }}
      boxShadow="0 0 30px rgba(0, 255, 42, 0.1)"
    >
      <Stack gap={6}>
        {/* Refund Policy Section */}
        <Box>
          <Flex align="center" gap={3} mb={4}>
            <Box
              w="50px"
              h="50px"
              borderRadius="lg"
              bg="#0A0A0A"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="2xl">💰</Text>
            </Box>
            <Heading size="lg" color="white">
              {tRefund("title")}
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Text fontSize="md" color="gray.300" lineHeight="1.8">
              {tRefund("description")}
            </Text>
            <Box
              borderRadius="lg"
              bg="rgba(0, 255, 42, 0.05)"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              p={4}
            >
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="700" color="#00FF2A">
                  ✓ {tRefund("conditions")}
                </Text>
                <Text fontSize="sm" color="gray.300">
                  • {tRefund("condition1")}<br />
                  • {tRefund("condition2")}<br />
                  • {tRefund("condition3")}
                </Text>
              </Stack>
            </Box>
            <Text fontSize="sm" color="gray.400">
              {tRefund("seeMore")}{" "}
              <Link href="/refund-policy" style={{ color: "#00FF2A", fontWeight: 600 }}>
                {tRefund("fullPolicy")}
              </Link>
            </Text>
          </Stack>
        </Box>

        {/* Security & Payment Section */}
        <Box pt={4} borderTop="1px solid" borderColor="rgba(0, 255, 42, 0.2)">
          <Flex align="center" gap={3} mb={4}>
            <Box
              w="50px"
              h="50px"
              borderRadius="lg"
              bg="#0A0A0A"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="2xl">🔒</Text>
            </Box>
            <Heading size="lg" color="white">
              {tSecurity("title")}
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Text fontSize="md" color="gray.300" lineHeight="1.8">
              {tSecurity("description")}
            </Text>
            <Box
              borderRadius="lg"
              bg="rgba(0, 255, 42, 0.05)"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              p={4}
            >
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="700" color="#00FF2A">
                  🔐 {tSecurity("paymentMethods")}
                </Text>
                <Text fontSize="sm" color="gray.300">
                  • {tSecurity("method1")}<br />
                  • {tSecurity("method2")}<br />
                  • {tSecurity("method3")}<br />
                  • {tSecurity("inquiries")}{" "}
                  <Link href="mailto:support@ti-by-an.com" style={{ color: "#00FF2A", fontWeight: 600 }}>
                    support@ti-by-an.com
                  </Link>
                </Text>
              </Stack>
            </Box>
            <Text fontSize="xs" color="gray.500" mt={2}>
              {tSecurity("disclaimer")}
            </Text>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
