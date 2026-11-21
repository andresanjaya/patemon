import { BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProvenanceBadgeProps {
  status: string;
  sourceId?: string | null;
  sourceUrl?: string | null;
  className?: string;
}

export function ProvenanceBadge({
  status,
  className = "",
}: ProvenanceBadgeProps) {
  const isVerified = status === "Tervalidasi Literatur Adat";
  const isConditional =
    status.toLowerCase().includes("validasi") ||
    status.toLowerCase().includes("perlu");

  if (isVerified) {
    return (
      <Badge
        variant="outline"
        className={`gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400 ${className}`}
      >
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        <span>Literatur Adat</span>
      </Badge>
    );
  }

  if (isConditional) {
    return (
      <Badge
        variant="outline"
        className={`gap-1 border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-600 dark:text-amber-400 ${className}`}
      >
        <AlertCircle className="h-3 w-3 shrink-0" />
        <span>Perlu Rembug Keluarga</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`text-muted-foreground gap-1 text-[11px] ${className}`}
    >
      <BookOpen className="h-3 w-3 shrink-0" />
      <span>{status}</span>
    </Badge>
  );
}
