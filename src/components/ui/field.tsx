"use client";

import { Text, Stack } from "@chakra-ui/react";
import { ReactNode } from "react";

interface FieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  children: ReactNode;
  inputId?: string;
}

export function Field({ label, required, helperText, children, inputId }: FieldProps) {
  return (
    <Stack gap={2}>
      <label htmlFor={inputId}>
        <Text fontWeight="600" color="gray.700">
          {label}
          {required && <Text as="span" color="red.500" ml={1}>*</Text>}
        </Text>
      </label>
      {children}
      {helperText && (
        <Text fontSize="sm" color="gray.500" id={`${inputId}-helper`}>
          {helperText}
        </Text>
      )}
    </Stack>
  );
}
