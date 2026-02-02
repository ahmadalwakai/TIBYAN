/**
 * AI Agent Tests - Errors Module
 * Test file for error handling
 */

import { describe, it, expect } from "vitest";
import {
  AgentError,
  AgentErrorCode,
  isAgentError,
  wrapError,
  createInvalidInputError,
  createUnauthorizedError,
  createPermissionDeniedError,
  createRateLimitedError,
  createSafetyBlockedError,
  createLLMTimeoutError,
  createLLMUnavailableError,
  createToolNotFoundError,
  createToolExecutionError,
  createInternalError,
} from "../errors";

describe("AgentError", () => {
  it("should create error with correct properties", () => {
    const error = new AgentError(AgentErrorCode.INVALID_INPUT, {
      message: "Test message",
      details: { field: "email" },
    });

    expect(error.code).toBe(AgentErrorCode.INVALID_INPUT);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Test message");
    expect(error.details).toEqual({ field: "email" });
    expect(error.isRetryable).toBe(false);
  });

  it("should return correct Arabic message", () => {
    const error = new AgentError(AgentErrorCode.RATE_LIMITED);
    expect(error.getUserMessage("ar")).toContain("عدد الطلبات");
  });

  it("should return correct English message", () => {
    const error = new AgentError(AgentErrorCode.RATE_LIMITED);
    expect(error.getUserMessage("en")).toContain("Too many requests");
  });

  it("should convert to API response format", () => {
    const error = new AgentError(AgentErrorCode.UNAUTHORIZED);
    const response = error.toResponse("ar");

    expect(response.ok).toBe(false);
    expect(response.errorCode).toBe(AgentErrorCode.UNAUTHORIZED);
    expect(response.error).toBeTruthy();
  });

  it("should identify retryable errors correctly", () => {
    const retryableError = new AgentError(AgentErrorCode.LLM_TIMEOUT);
    const nonRetryableError = new AgentError(AgentErrorCode.PERMISSION_DENIED);

    expect(retryableError.isRetryable).toBe(true);
    expect(nonRetryableError.isRetryable).toBe(false);
  });
});

describe("isAgentError", () => {
  it("should return true for AgentError instances", () => {
    const error = new AgentError(AgentErrorCode.INTERNAL_ERROR);
    expect(isAgentError(error)).toBe(true);
  });

  it("should return false for regular errors", () => {
    const error = new Error("Regular error");
    expect(isAgentError(error)).toBe(false);
  });

  it("should return false for non-errors", () => {
    expect(isAgentError("string")).toBe(false);
    expect(isAgentError(null)).toBe(false);
    expect(isAgentError(undefined)).toBe(false);
  });
});

describe("wrapError", () => {
  it("should return same error if already AgentError", () => {
    const original = new AgentError(AgentErrorCode.INVALID_INPUT);
    const wrapped = wrapError(original);

    expect(wrapped).toBe(original);
  });

  it("should wrap AbortError as timeout", () => {
    const abortError = new Error("Request was aborted");
    abortError.name = "AbortError";

    const wrapped = wrapError(abortError);
    expect(wrapped.code).toBe(AgentErrorCode.LLM_TIMEOUT);
  });

  it("should wrap fetch errors as unavailable", () => {
    const fetchError = new TypeError("fetch failed");

    const wrapped = wrapError(fetchError);
    expect(wrapped.code).toBe(AgentErrorCode.LLM_UNAVAILABLE);
  });

  it("should wrap unknown errors as internal", () => {
    const wrapped = wrapError("unknown error");
    expect(wrapped.code).toBe(AgentErrorCode.INTERNAL_ERROR);
  });
});

describe("Error Factory Functions", () => {
  it("createInvalidInputError", () => {
    const error = createInvalidInputError({ field: "name" });
    expect(error.code).toBe(AgentErrorCode.INVALID_INPUT);
    expect(error.statusCode).toBe(400);
  });

  it("createUnauthorizedError", () => {
    const error = createUnauthorizedError();
    expect(error.code).toBe(AgentErrorCode.UNAUTHORIZED);
    expect(error.statusCode).toBe(401);
  });

  it("createPermissionDeniedError", () => {
    const error = createPermissionDeniedError(["role:ADMIN"]);
    expect(error.code).toBe(AgentErrorCode.PERMISSION_DENIED);
    expect(error.statusCode).toBe(403);
    expect(error.details?.missingPermissions).toEqual(["role:ADMIN"]);
  });

  it("createRateLimitedError", () => {
    const error = createRateLimitedError(60000);
    expect(error.code).toBe(AgentErrorCode.RATE_LIMITED);
    expect(error.statusCode).toBe(429);
    expect(error.details?.retryAfterMs).toBe(60000);
  });

  it("createSafetyBlockedError", () => {
    const error = createSafetyBlockedError(["prompt_injection"]);
    expect(error.code).toBe(AgentErrorCode.SAFETY_BLOCKED);
    expect(error.statusCode).toBe(403);
  });

  it("createLLMTimeoutError", () => {
    const error = createLLMTimeoutError();
    expect(error.code).toBe(AgentErrorCode.LLM_TIMEOUT);
    expect(error.statusCode).toBe(504);
    expect(error.isRetryable).toBe(true);
  });

  it("createLLMUnavailableError", () => {
    const error = createLLMUnavailableError();
    expect(error.code).toBe(AgentErrorCode.LLM_UNAVAILABLE);
    expect(error.statusCode).toBe(502);
  });

  it("createToolNotFoundError", () => {
    const error = createToolNotFoundError("unknown_tool");
    expect(error.code).toBe(AgentErrorCode.TOOL_NOT_FOUND);
    expect(error.statusCode).toBe(404);
    expect(error.details?.toolName).toBe("unknown_tool");
  });

  it("createToolExecutionError", () => {
    const cause = new Error("Original error");
    const error = createToolExecutionError("my_tool", cause);
    expect(error.code).toBe(AgentErrorCode.TOOL_EXECUTION_FAILED);
    expect(error.details?.toolName).toBe("my_tool");
  });

  it("createInternalError", () => {
    const error = createInternalError();
    expect(error.code).toBe(AgentErrorCode.INTERNAL_ERROR);
    expect(error.statusCode).toBe(500);
  });
});

describe("Status Code Mapping", () => {
  const statusCodeTests: Array<[string, number]> = [
    [AgentErrorCode.INVALID_INPUT, 400],
    [AgentErrorCode.UNAUTHORIZED, 401],
    [AgentErrorCode.PERMISSION_DENIED, 403],
    [AgentErrorCode.TOOL_NOT_FOUND, 404],
    [AgentErrorCode.RATE_LIMITED, 429],
    [AgentErrorCode.INTERNAL_ERROR, 500],
    [AgentErrorCode.LLM_UNAVAILABLE, 502],
    [AgentErrorCode.LLM_TIMEOUT, 504],
  ];

  it.each(statusCodeTests)(
    "should return %i for %s",
    (code, expectedStatus) => {
      const error = new AgentError(code as typeof AgentErrorCode[keyof typeof AgentErrorCode]);
      expect(error.statusCode).toBe(expectedStatus);
    }
  );
});
