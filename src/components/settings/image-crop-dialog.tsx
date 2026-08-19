import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ASPECTS = [
  { value: "free", label: "Free", ratio: undefined },
  { value: "1", label: "1:1", ratio: 1 },
  { value: "4-3", label: "4:3", ratio: 4 / 3 },
  { value: "16-9", label: "16:9", ratio: 16 / 9 },
  { value: "21-9", label: "21:9", ratio: 21 / 9 },
] as const;

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string | null;
  title?: string;
  defaultAspect?: string;
  mimeType?: string;
  onCropped: (blob: Blob) => Promise<void> | void;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the image for cropping."));
    image.src = src;
  });
}

async function cropToBlob(src: string, area: Area, rotation: number, mimeType: string) {
  const image = await loadImage(src);
  const radians = (rotation * Math.PI) / 180;
  const stage = document.createElement("canvas");
  const stageCtx = stage.getContext("2d")!;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  stage.width = image.width * cos + image.height * sin;
  stage.height = image.width * sin + image.height * cos;
  stageCtx.translate(stage.width / 2, stage.height / 2);
  stageCtx.rotate(radians);
  stageCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(area.width));
  out.height = Math.max(1, Math.round(area.height));
  const ctx = out.getContext("2d")!;
  ctx.drawImage(
    stage,
    Math.round(area.x),
    Math.round(area.y),
    out.width,
    out.height,
    0,
    0,
    out.width,
    out.height,
  );
  const type = mimeType === "image/jpeg" ? "image/jpeg" : "image/png";
  return await new Promise<Blob>((resolve, reject) =>
    out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not render the crop."))), type, 0.92),
  );
}

export function ImageCropDialog({
  open,
  onOpenChange,
  src,
  title = "Adjust image",
  defaultAspect = "free",
  mimeType = "image/png",
  onCropped,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(defaultAspect);
  const [area, setArea] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  function reset() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(defaultAspect);
  }

  async function apply() {
    if (!src || !area) return;
    setWorking(true);
    try {
      const blob = await cropToBlob(src, area, rotation, mimeType);
      await onCropped(blob);
      onOpenChange(false);
      reset();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Drag to reposition, pinch or use the slider to zoom, and pick a shape before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[320px] overflow-hidden rounded-lg bg-muted">
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={ASPECTS.find((a) => a.value === aspect)?.ratio}
              restrictPosition={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
            />
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Zoom</Label>
            <Slider min={0.5} max={4} step={0.01} value={[zoom]} onValueChange={([v]) => setZoom(v ?? 1)} />
          </div>
          <div className="space-y-1.5">
            <Label>Rotation</Label>
            <div className="flex items-center gap-2">
              <Slider
                min={0}
                max={360}
                step={1}
                value={[rotation]}
                onValueChange={([v]) => setRotation(v ?? 0)}
              />
              <Button type="button" size="icon" variant="ghost" aria-label="Rotate 90 degrees" onClick={() => setRotation((r) => (r + 90) % 360)}>
                <RotateCw className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Shape</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={aspect}
              onValueChange={(v) => v && setAspect(v)}
              className="justify-start"
            >
              {ASPECTS.map((a) => (
                <ToggleGroupItem key={a.value} value={a.value}>
                  {a.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={reset} disabled={working}>
            Reset
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={working}>
              Cancel
            </Button>
            <Button type="button" onClick={apply} disabled={working || !area}>
              {working ? <Loader2 className="animate-spin" /> : null} Save image
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
