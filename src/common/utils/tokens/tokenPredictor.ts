/**
 * Token Usage Predictor
 * Estimates token usage and costs before sending messages
 */

export interface TokenPrediction {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedTotalTokens: number;
  estimatedCostUsd: number;
  warningLevel: "none" | "high" | "critical";
  suggestions: string[];
}

export interface TokenPredictionInput {
  messageContent: string;
  attachedFiles: string[];
  currentContext: number;
  model: string;
  historicalAvgOutput?: number;
}

/**
 * Predict token usage for a message before sending
 * Uses ai-tokenizer for counting and model pricing for cost estimation
 */
export function predictTokenUsage(params: TokenPredictionInput): TokenPrediction {
  const { messageContent, attachedFiles, currentContext, model: _model, historicalAvgOutput } = params;

  // Simple estimation (actual implementation would use ai-tokenizer)
  const messageTokens = Math.ceil(messageContent.length / 4);
  const fileTokens = attachedFiles.reduce((sum, file) => sum + Math.ceil(file.length / 4), 0);
  const contextTokens = currentContext;

  const estimatedInputTokens = messageTokens + fileTokens + contextTokens;
  const estimatedOutputTokens = historicalAvgOutput || 500; // Default fallback
  const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

  // Mock pricing (actual would use getModelStats())
  const INPUT_COST_PER_1K = 0.003;
  const OUTPUT_COST_PER_1K = 0.015;

  const estimatedCostUsd =
    (estimatedInputTokens / 1000) * INPUT_COST_PER_1K +
    (estimatedOutputTokens / 1000) * OUTPUT_COST_PER_1K;

  // Warning thresholds
  let warningLevel: TokenPrediction["warningLevel"] = "none";
  const suggestions: string[] = [];

  if (estimatedTotalTokens > 100000) {
    warningLevel = "critical";
    suggestions.push("Consider splitting into multiple smaller requests");
    suggestions.push("Remove unnecessary file attachments");
  } else if (estimatedTotalTokens > 50000) {
    warningLevel = "high";
    suggestions.push("Large context detected - consider compaction");
  }

  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedTotalTokens,
    estimatedCostUsd,
    warningLevel,
    suggestions,
  };
}
