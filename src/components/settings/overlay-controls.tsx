import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OVERLAY_TINTS, overlayStyles, type OverlayTint } from "@/lib/sign-in-content";

export interface OverlayValue {
  overlay_tint: OverlayTint;
  overlay_opacity: number;
  overlay_blur: number;
  background_brightness: number;
}

export function overlayPreviewStyles(value: OverlayValue) {
  return overlayStyles({
    overlayTint: value.overlay_tint,
    overlayOpacity: value.overlay_opacity,
    overlayBlur: value.overlay_blur,
    backgroundBrightness: value.background_brightness,
  });
}

export function OverlayControls({
  idPrefix,
  value,
  onChange,
  disabled,
}: {
  idPrefix: string;
  value: OverlayValue;
  onChange: (next: Partial<OverlayValue>) => void;
  disabled?: boolean | undefined;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border/70 p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">Background overlay</p>
        <p className="text-xs text-muted-foreground">
          Keeps the headline and highlights readable over any photo.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-tint`}>Tint</Label>
        <Select
          value={value.overlay_tint}
          disabled={disabled ?? false}
          onValueChange={(v) => onChange({ overlay_tint: v as OverlayTint })}
        >
          <SelectTrigger id={`${idPrefix}-tint`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OVERLAY_TINTS.map((tint) => (
              <SelectItem key={tint.value} value={tint.value}>
                {tint.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SliderRow
        id={`${idPrefix}-opacity`}
        label="Tint strength"
        suffix="%"
        min={0}
        max={100}
        step={5}
        disabled={(disabled ?? false) || value.overlay_tint === "none"}
        value={value.overlay_opacity}
        onChange={(v) => onChange({ overlay_opacity: v })}
      />
      <SliderRow
        id={`${idPrefix}-blur`}
        label="Blur"
        suffix="px"
        min={0}
        max={24}
        step={1}
        disabled={disabled ?? false}
        value={value.overlay_blur}
        onChange={(v) => onChange({ overlay_blur: v })}
      />
      <SliderRow
        id={`${idPrefix}-brightness`}
        label="Image brightness"
        suffix="%"
        min={20}
        max={150}
        step={5}
        disabled={disabled ?? false}
        value={value.background_brightness}
        onChange={(v) => onChange({ background_brightness: v })}
      />
    </div>
  );
}

function SliderRow({
  id,
  label,
  suffix,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  suffix: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        disabled={disabled ?? false}
        value={[value]}
        onValueChange={([next]) => onChange(next ?? value)}
      />
    </div>
  );
}