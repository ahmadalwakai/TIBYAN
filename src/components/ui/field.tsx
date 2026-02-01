"use client";

import { Box, Text, Stack } from "@chakra-ui/react";
import { ReactNode } from "react";

interface FieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  children: ReactNode;
}

export function Field({ label, required, helperText, children }: FieldProps) {
  return (
    <Stack gap={2}>
      <Text fontWeight="600" color="gray.700">
        {label}
        {required && <Text as="span" color="red.500" ml={1}>*</Text>}
      </Text>
      {children}
      {helperText && (
        <Text fontSize="sm" color="gray.500">
          {helperText}
        </Text>
      )}
    </Stack>
  );
}
