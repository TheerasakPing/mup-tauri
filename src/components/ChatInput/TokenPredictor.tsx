/**
 * Token Usage Predictor Component
 * Estimates token consumption and cost before sending messages
 */

import React, { useState, useEffect, useRef } from "react";
import type { ChatAttachment } from "../ChatAttachments";
import type { ReviewNoteDataForDisplay } from "@/common/types/message";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/common/lib/utils";

export interface TokenPrediction {
  /** Estimated input tokens */
  inputTokens: number;
  /** Estimated output tokens (based on historical data) */
  outputTokens: number;
  /** Estimated total tokens */
  totalTokens: number;
  /** Estimated cost in USD */
  estimatedCost: number;
  /** Confidence level (0-1) */
  confidence: number;
}

export interface TokenPredictorProps {
  /** Draft message text */
  text: string;
  /** Attached files/images */
  attachments: ChatAttachment[];
  /** Attached reviews */
  reviews?: ReviewNoteDataForDisplay[];
  /** Current model */
  model: string;
  /** Whether prediction is loading */
  loading?: boolean;
  /** Warning threshold as percentage of context limit */
  warningThreshold?: number;
}

/**
 * Simple client-side token estimation
 * Uses rough heuristic: ~4 characters per token
 * For accurate counting, use tokenizerService (main process only)
 */
function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens from attachments
 * Images: ~1000-2000 tokens each (rough estimate)
 * Other files: ~4 chars per token
 */
function estimateTokensFromAttachments(attachments: ChatAttachment[]): number {
  let total = 0;

  for (const attachment of attachments) {
    if (attachment.mediaType?.startsWith("image/")) {
      // Images typically use 1000-2000 tokens
      total += 1500;
    } else if (attachment.url) {
      // Text files - estimate from URL length (rough approximation)
      // For data URLs: base64 is ~33% larger, then 4 chars per token
      total += Math.ceil((attachment.url.length * 0.75) / 4);
    }
  }

  return total;
}

/**
 * Get model cost per token (in USD)
 * These are rough estimates - actual prices vary by provider
 */
function getModelCost(model: string): { input: number; output: number } {
  const normalizedModel = model.toLowerCase();

  // Claude models
  if (normalizedModel.includes("opus")) {
    return { input: 0.000015, output: 0.000075 }; // $15/$75 per million
  }
  if (normalizedModel.includes("sonnet")) {
    return { input: 0.000003, output: 0.000015 }; // $3/$15 per million
  }
  if (normalizedModel.includes("haiku")) {
    return { input: 0.00000025, output: 0.00000125 }; // $0.25/$1.25 per million
  }

  // GPT models
  if (normalizedModel.includes("gpt-4o")) {
    return { input: 0.0000025, output: 0.00001 }; // $2.50/$10 per million
  }
  if (normalizedModel.includes("gpt-4")) {
    return { input: 0.00001, output: 0.00003 }; // $10/$30 per million
  }
  if (normalizedModel.includes("gpt-3.5")) {
    return { input: 0.0000005, output: 0.0000015 }; // $0.50/$1.50 per million
  }

  // Gemini models
  if (normalizedModel.includes("gemini-2.0-flash")) {
    return { input: 0, output: 0 }; // Free tier
  }
  if (normalizedModel.includes("gemini-pro")) {
    return { input: 0.00000125, output: 0.00000375 }; // $1.25/$3.75 per million
  }

  // DeepSeek
  if (normalizedModel.includes("deepseek")) {
    return { input: 0.0000014, output: 0.0000028 }; // $0.14/$0.28 per million
  }

  // Default fallback
  return { input: 0.000003, output: 0.000015 };
}

export const TokenPredictor: React.FC<TokenPredictorProps> = ({
  text,
  attachments,
  reviews = [],
  model,
  loading = false,
  warningThreshold = 0.8,
}) => {
  const [prediction, setPrediction] = useState<TokenPrediction | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce predictions (500ms)
    debounceRef.current = setTimeout(() => {
      // Estimate input tokens
      const textTokens = estimateTokensFromText(text);
      const attachmentTokens = estimateTokensFromAttachments(attachments);
      const reviewTokens = reviews.reduce((sum, review) => {
        return sum + estimateTokensFromText(JSON.stringify(review));
      }, 0);

      const inputTokens = textTokens + attachmentTokens + reviewTokens;

      // Estimate output tokens based on input size
      // Heuristic: output is typically 0.5-2x input size
      // Use 1.2x as conservative estimate
      const outputTokens = Math.ceil(inputTokens * 1.2);

      const totalTokens = inputTokens + outputTokens;

      // Calculate cost
      const costs = getModelCost(model);
      const estimatedCost = inputTokens * costs.input + outputTokens * costs.output;

      // Confidence is lower for very short or very long inputs
      const confidence = inputTokens < 50 ? 0.5 : inputTokens > 10000 ? 0.6 : 0.8;

      setPrediction({
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost,
        confidence,
      });
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [text, attachments, reviews, model]);

  // Don't show predictor for empty inputs
  if (!text.trim() && attachments.length === 0 && reviews.length === 0) {
    return null;
  }

  if (!prediction || loading) {
    return <div className="text-xs text-muted-foreground px-3 py-1">Calculating tokens...</div>;
  }

  // Determine if we should show a warning
  // Assume 200K context limit for modern models
  const contextLimit = 200000;
  const isHighUsage = prediction.totalTokens > contextLimit * warningThreshold;
  const isVeryHighUsage = prediction.totalTokens > contextLimit * 0.95;

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCost = (cost: number): string => {
    if (cost < 0.01) {
      return `$${(cost * 1000).toFixed(2)}¢`;
    }
    return `$${cost.toFixed(3)}`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-xs border-t",
        isVeryHighUsage && "bg-destructive/10 border-destructive/30",
        isHighUsage && !isVeryHighUsage && "bg-warning/10 border-warning/30"
      )}
    >
      <div className="flex items-center gap-1.5">
        {isHighUsage && (
          <AlertTriangle
            className={cn("h-3.5 w-3.5", isVeryHighUsage ? "text-destructive" : "text-warning")}
          />
        )}
        <span className="text-muted-foreground">
          Est. {formatNumber(prediction.totalTokens)} tokens
        </span>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            <span className="text-muted-foreground">(~{formatCost(prediction.estimatedCost)})</span>
            <Info className="h-3 w-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span>Input:</span>
              <span className="font-mono">{formatNumber(prediction.inputTokens)} tokens</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Output (est.):</span>
              <span className="font-mono">{formatNumber(prediction.outputTokens)} tokens</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t">
              <span>Total:</span>
              <span className="font-mono font-semibold">
                {formatNumber(prediction.totalTokens)} tokens
              </span>
            </div>
            {prediction.estimatedCost > 0 && (
              <div className="flex justify-between gap-4">
                <span>Cost:</span>
                <span className="font-mono">{formatCost(prediction.estimatedCost)}</span>
              </div>
            )}
            {isHighUsage && (
              <div className="pt-2 border-t text-warning">
                ⚠️ High token usage - consider splitting message
              </div>
            )}
            <div className="pt-1 text-muted-foreground">
              Confidence: {Math.round(prediction.confidence * 100)}%
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
