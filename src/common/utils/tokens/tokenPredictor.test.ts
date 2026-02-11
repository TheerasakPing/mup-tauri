import { describe, it, expect } from "bun:test";
import { predictTokenUsage } from "@/common/utils/tokens/tokenPredictor";

describe("predictTokenUsage", () => {
  it("should predict token usage for simple message", () => {
    const result = predictTokenUsage({
      messageContent: "Hello, world!",
      attachedFiles: [],
      currentContext: 0,
      model: "claude-3.5-sonnet",
    });

    expect(result.estimatedInputTokens).toBeGreaterThan(0);
    expect(result.estimatedOutputTokens).toBe(500); // Default fallback
    expect(result.estimatedTotalTokens).toBeGreaterThan(0);
    expect(result.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.warningLevel).toBe("none");
    expect(result.suggestions).toHaveLength(0);
  });

  it("should use historical average for output tokens", () => {
    const result = predictTokenUsage({
      messageContent: "Test message",
      attachedFiles: [],
      currentContext: 0,
      model: "claude-3.5-sonnet",
      historicalAvgOutput: 1000,
    });

    expect(result.estimatedOutputTokens).toBe(1000);
  });

  it("should include attached files in token count", () => {
    const withoutFiles = predictTokenUsage({
      messageContent: "Test",
      attachedFiles: [],
      currentContext: 0,
      model: "claude-3.5-sonnet",
    });

    const withFiles = predictTokenUsage({
      messageContent: "Test",
      attachedFiles: ["file content here that is quite long"],
      currentContext: 0,
      model: "claude-3.5-sonnet",
    });

    expect(withFiles.estimatedInputTokens).toBeGreaterThan(withoutFiles.estimatedInputTokens);
  });

  it("should include current context in token count", () => {
    const withoutContext = predictTokenUsage({
      messageContent: "Test",
      attachedFiles: [],
      currentContext: 0,
      model: "claude-3.5-sonnet",
    });

    const withContext = predictTokenUsage({
      messageContent: "Test",
      attachedFiles: [],
      currentContext: 10000,
      model: "claude-3.5-sonnet",
    });

    expect(withContext.estimatedInputTokens).toBeGreaterThan(withoutContext.estimatedInputTokens);
  });

  it("should set high warning level for 50k-100k tokens", () => {
    const result = predictTokenUsage({
      messageContent: "x".repeat(200000), // ~50k tokens
      attachedFiles: [],
      currentContext: 0,
      model: "claude-3.5-sonnet",
    });

    expect(result.warningLevel).toBe("high");
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("should set critical warning level for >100k tokens", () => {
    const result = predictTokenUsage({
      messageContent: "x".repeat(400000), // ~100k tokens
      attachedFiles: [],
      currentContext: 0,
      model: "claude-3.5-sonnet",
    });

    expect(result.warningLevel).toBe("critical");
    expect(result.suggestions).toContain("Consider splitting into multiple smaller requests");
  });

  it("should estimate cost correctly", () => {
    const result = predictTokenUsage({
      messageContent: "Test message",
      attachedFiles: [],
      currentContext: 1000,
      model: "claude-3.5-sonnet",
      historicalAvgOutput: 500,
    });

    // Cost should be input tokens * input rate + output tokens * output rate
    expect(result.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.estimatedCostUsd).toBeLessThan(1); // Should be very small for this test
  });
});
