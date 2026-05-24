const GENERIC_ACCOMMODATION_LABELS = new Set(["your accomodation", "your accommodation"]);

type ResolveLocationDisplayInput = {
  label?: string | null;
  fallbackName?: string | null;
  address?: string | null;
  fallbackAddress?: string | null;
};

export function resolveLocationDisplay({
  label,
  fallbackName,
  address,
  fallbackAddress,
}: ResolveLocationDisplayInput) {
  const primaryLabel = label || fallbackName || "-";
  const normalizedLabel = primaryLabel.trim().toLowerCase();
  const resolvedAddress = address || fallbackAddress || null;
  const usesGenericLabel = GENERIC_ACCOMMODATION_LABELS.has(normalizedLabel);

  if (usesGenericLabel && resolvedAddress) {
    return {
      primary: resolvedAddress,
      secondary: primaryLabel,
      mapQuery: resolvedAddress,
    };
  }

  return {
    primary: primaryLabel,
    secondary: resolvedAddress,
    mapQuery: resolvedAddress || primaryLabel,
  };
}
