import type { LucideIcon } from "lucide-react";
import {
  AirVent,
  Armchair,
  BadgeCheck,
  Bluetooth,
  CableCar,
  Cable,
  Car,
  Camera,
  CarFront,
  CircleGauge,
  Compass,
  Crown,
  Droplets,
  Fuel,
  Heater,
  KeyRound,
  Luggage,
  MapPinned,
  Navigation,
  PlugZap,
  Radar,
  Radio,
  ShieldCheck,
  SmartphoneCharging,
  Speaker,
  TentTree,
  TimerReset,
  Trash2,
  CheckCircle2,
  Music2,
  Snowflake,
  Sparkles,
  Usb,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";

export const FEATURE_ICON_CHOICES = [
  { value: "check-circle-2", label: "Default check", icon: CheckCircle2 },
  { value: "car-front", label: "Car", icon: CarFront },
  { value: "car", label: "Vehicle", icon: Car },
  { value: "air-vent", label: "Air vent", icon: AirVent },
  { value: "heater", label: "Heater", icon: Heater },
  { value: "wind", label: "Air flow", icon: Wind },
  { value: "snowflake", label: "Snowflake", icon: Snowflake },
  { value: "camera", label: "Camera", icon: Camera },
  { value: "radar", label: "Radar", icon: Radar },
  { value: "navigation", label: "Navigation", icon: Navigation },
  { value: "map-pinned", label: "Map pin", icon: MapPinned },
  { value: "compass", label: "Compass", icon: Compass },
  { value: "bluetooth", label: "Bluetooth", icon: Bluetooth },
  { value: "music-2", label: "Audio", icon: Music2 },
  { value: "radio", label: "Radio", icon: Radio },
  { value: "speaker", label: "Speaker", icon: Speaker },
  { value: "smartphone-charging", label: "Phone charging", icon: SmartphoneCharging },
  { value: "usb", label: "USB", icon: Usb },
  { value: "cable", label: "Cable", icon: Cable },
  { value: "plug-zap", label: "Power plug", icon: PlugZap },
  { value: "wifi", label: "Wi-Fi", icon: Wifi },
  { value: "fuel", label: "Fuel", icon: Fuel },
  { value: "circle-gauge", label: "Performance", icon: CircleGauge },
  { value: "armchair", label: "Comfort seat", icon: Armchair },
  { value: "luggage", label: "Luggage", icon: Luggage },
  { value: "key-round", label: "Keyless", icon: KeyRound },
  { value: "shield-check", label: "Safety", icon: ShieldCheck },
  { value: "badge-check", label: "Verified", icon: BadgeCheck },
  { value: "droplets", label: "Water ready", icon: Droplets },
  { value: "waves", label: "Beach", icon: Waves },
  { value: "tent-tree", label: "Outdoor", icon: TentTree },
  { value: "timer-reset", label: "Quick access", icon: TimerReset },
  { value: "crown", label: "Premium", icon: Crown },
  { value: "cable-car", label: "Transport", icon: CableCar },
  { value: "trash-2", label: "Cleanup", icon: Trash2 },
  { value: "sparkles", label: "Sparkles", icon: Sparkles },
] as const;

export type FeatureIconName = (typeof FEATURE_ICON_CHOICES)[number]["value"];

const FEATURE_ICON_MAP = new Map<FeatureIconName, LucideIcon>(
  FEATURE_ICON_CHOICES.map((choice) => [choice.value, choice.icon])
);

export function normalizeFeatureIconName(value?: string | null): FeatureIconName | null {
  if (!value) return null;
  return FEATURE_ICON_MAP.has(value as FeatureIconName) ? (value as FeatureIconName) : null;
}

export function getFeatureIconComponent(value?: string | null): LucideIcon {
  const normalized = normalizeFeatureIconName(value);
  return normalized ? FEATURE_ICON_MAP.get(normalized)! : CheckCircle2;
}
