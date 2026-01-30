import { Box, Button } from "@chakra-ui/react";
import { FaWhatsapp } from "react-icons/fa";
import { WHATSAPP_URL } from "@/config/contact";

export default function WhatsAppFab() {
  return (
    <Box position="fixed" bottom="24px" right="24px" zIndex={1400}>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="التواصل عبر واتساب"
        style={{ textDecoration: "none" }}
      >
        <Button
          w={{ base: "56px", md: "52px" }}
          h={{ base: "56px", md: "52px" }}
          p={0}
          bg="#25D366"
          color="white"
          _hover={{ bg: "#1EBE5D" }}
          borderRadius="full"
          boxShadow="lg"
        >
          <FaWhatsapp size={24} />
        </Button>
      </a>
    </Box>
  );
}
