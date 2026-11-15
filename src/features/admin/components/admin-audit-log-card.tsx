import { Shield, Clock, FileText } from "lucide-react";
import type { AdminAuditLog } from "../types";

interface AdminAuditLogCardProps {
  logs: AdminAuditLog[];
  title?: string;
  description?: string;
}

export function AdminAuditLogCard({
  logs,
  title = "Jejak Audit Operasional Admin (Audit Trail)",
  description = "Seluruh intervensi manual dicatat permanen demi kepatuhan hukum dan transparansi.",
}: AdminAuditLogCardProps) {
  const getActionBadge = (action: string) => {
    switch (action) {
      case "grant_override":
        return (
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
            Pemberian Override
          </span>
        );
      case "revoke_grant":
        return (
          <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
            Pencabutan Lisensi
          </span>
        );
      case "freeze_wedding":
        return (
          <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
            Pembekuan Workspace
          </span>
        );
      case "unfreeze_wedding":
        return (
          <span className="rounded bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
            Buka Pembekuan
          </span>
        );
      case "reconcile_order":
        return (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
            Rekonsiliasi Order
          </span>
        );
      default:
        return (
          <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-amber-600" />
        <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      </div>
      <p className="mt-1 text-xs text-stone-600">{description}</p>

      {logs.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-stone-300 p-8 text-center text-xs text-stone-500">
          Belum ada catatan intervensi admin untuk entitas ini.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 text-xs transition-colors hover:bg-stone-50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getActionBadge(log.action)}
                  <span className="font-mono text-[11px] font-medium text-stone-600">
                    {log.adminEmail}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] text-stone-500">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(log.createdAt).toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="mt-2 text-stone-800">
                <p className="font-medium">
                  Alasan:{" "}
                  <span className="font-normal italic">{log.reason}</span>
                </p>
                {log.referenceNote && (
                  <p className="mt-0.5 text-[11px] text-stone-600">
                    Referensi:{" "}
                    <span className="font-mono font-medium text-amber-800">
                      {log.referenceNote}
                    </span>
                  </p>
                )}
              </div>

              {log.correlationId && (
                <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-stone-400">
                  <FileText className="h-2.5 w-2.5" />
                  <span>Correlation ID: {log.correlationId}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
