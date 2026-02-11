import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/browser/components/ui/dialog";
import { Button } from "@/browser/components/ui/button";
import { Input } from "@/browser/components/ui/input";
import { Label } from "@/browser/components/ui/label";
import { CustomModelMetadata } from "@/common/orpc/schemas/api";

interface EditModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: string;
  modelId: string;
  initialMetadata?: CustomModelMetadata;
  onSave: (modelId: string, metadata: CustomModelMetadata) => void;
}

export function EditModelDialog({
  open,
  onOpenChange,
  provider,
  modelId,
  initialMetadata,
  onSave,
}: EditModelDialogProps) {
  const [editedModelId, setEditedModelId] = useState(modelId);
  const [maxInputTokens, setMaxInputTokens] = useState<string>("");
  const [maxOutputTokens, setMaxOutputTokens] = useState<string>("");
  const [inputCost, setInputCost] = useState<string>("");
  const [outputCost, setOutputCost] = useState<string>("");
  const [cacheCreationCost, setCacheCreationCost] = useState<string>("");
  const [cacheReadCost, setCacheReadCost] = useState<string>("");

  useEffect(() => {
    if (open) {
      setEditedModelId(modelId);
      setMaxInputTokens(initialMetadata?.maxInputTokens?.toString() ?? "");
      setMaxOutputTokens(initialMetadata?.maxOutputTokens?.toString() ?? "");
      setInputCost(initialMetadata?.inputCostPerToken?.toString() ?? "");
      setOutputCost(initialMetadata?.outputCostPerToken?.toString() ?? "");
      setCacheCreationCost(initialMetadata?.cacheCreationInputTokenCost?.toString() ?? "");
      setCacheReadCost(initialMetadata?.cacheReadInputTokenCost?.toString() ?? "");
    }
  }, [open, modelId, initialMetadata]);

  const handleSave = () => {
    const metadata: CustomModelMetadata = {
      maxInputTokens: maxInputTokens ? parseInt(maxInputTokens, 10) : undefined,
      maxOutputTokens: maxOutputTokens ? parseInt(maxOutputTokens, 10) : undefined,
      inputCostPerToken: inputCost ? parseFloat(inputCost) : undefined,
      outputCostPerToken: outputCost ? parseFloat(outputCost) : undefined,
      cacheCreationInputTokenCost: cacheCreationCost ? parseFloat(cacheCreationCost) : undefined,
      cacheReadInputTokenCost: cacheReadCost ? parseFloat(cacheReadCost) : undefined,
    };

    onSave(editedModelId, metadata);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Model Configuration</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modelId" className="text-right">
              Model ID
            </Label>
            <Input
              id="modelId"
              value={editedModelId}
              onChange={(e) => setEditedModelId(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxInput" className="text-right">
              Max Input
            </Label>
            <Input
              id="maxInput"
              type="number"
              value={maxInputTokens}
              onChange={(e) => setMaxInputTokens(e.target.value)}
              placeholder="e.g. 128000"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxOutput" className="text-right">
              Max Output
            </Label>
            <Input
              id="maxOutput"
              type="number"
              value={maxOutputTokens}
              onChange={(e) => setMaxOutputTokens(e.target.value)}
              placeholder="e.g. 4096"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="inputCost" className="text-right">
              Input Cost
            </Label>
            <Input
              id="inputCost"
              type="number"
              step="0.0000001"
              value={inputCost}
              onChange={(e) => setInputCost(e.target.value)}
              placeholder="$/token"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="outputCost" className="text-right">
              Output Cost
            </Label>
            <Input
              id="outputCost"
              type="number"
              step="0.0000001"
              value={outputCost}
              onChange={(e) => setOutputCost(e.target.value)}
              placeholder="$/token"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cacheCreationCost" className="text-right">
              Cache Create
            </Label>
            <Input
              id="cacheCreationCost"
              type="number"
              step="0.0000001"
              value={cacheCreationCost}
              onChange={(e) => setCacheCreationCost(e.target.value)}
              placeholder="$/token"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cacheReadCost" className="text-right">
              Cache Read
            </Label>
            <Input
              id="cacheReadCost"
              type="number"
              step="0.0000001"
              value={cacheReadCost}
              onChange={(e) => setCacheReadCost(e.target.value)}
              placeholder="$/token"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
