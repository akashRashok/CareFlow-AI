import { Badge } from "@/components/ui";

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone =
    ["ready", "good", "approved", "success", "low"].includes(normalized)
      ? "good"
      : ["needs_review", "reviewed", "pending", "medium"].includes(normalized)
        ? "warn"
        : ["not_ready", "rejected", "failed", "high", "poor"].includes(normalized)
          ? "bad"
          : "neutral";
  return <Badge tone={tone}>{value.replace(/_/g, " ")}</Badge>;
}

