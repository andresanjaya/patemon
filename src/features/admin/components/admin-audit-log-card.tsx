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
      case "admin_activate_manual":
        return (
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            Aktivasi Pembayaran Manual
          </span>
        );
      case "revoke_grant":
        return (
          <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
            Pencabutan Lisensi
          </span>
        );
      case "freeze_wedding":
        return (
          <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
            Pembekuan Workspace
          </span>
        );
      case "delete_wedding":
        return (
          <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
            Penghapusan Workspace
          </span>
        );
      case "unfreeze_wedding":
        return (
          <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
            Buka Pembekuan
          </span>
        );
      case "reconcile_order":
        return (
          <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            Rekonsiliasi Order
          </span>
        );
      default:
        return (
          <span className="rounded-md border border-[#e9e9ed] bg-[#f4f4f7] px-2 py-0.5 text-[11px] font-semibold text-[#65656f]">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="workspace-card p-5">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-[hsl(32_90%_36%)]" />
        <h3 className="text-sm font-semibold text-[#18181b]">{title}</h3>
      </div>
      <p className="mt-1 text-xs text-[#65656f]">{description}</p>

      {logs.length === 0 ? (
        <div className="mt-4 rounded-[6px] border border-dashed border-[#e9e9ed] p-8 text-center text-xs text-[#8c8c99]">
          Belum ada catatan intervensi admin untuk entitas ini.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-[#f1f1f4] overflow-hidden rounded-[6px] border border-[#e9e9ed]">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 text-xs transition-colors hover:bg-[#fafafc]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getActionBadge(log.action)}
                  <span className="font-mono text-[11px] font-medium text-[#18181b]">
                    {log.adminEmail}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] text-[#8c8c99]">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(log.createdAt).toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="mt-2 text-[#18181b]">
                <p className="font-medium">
                  Alasan:{" "}
                  <span className="font-normal text-[#65656f] italic">
                    {log.reason}
                  </span>
                </p>
                {log.referenceNote && (
                  <p className="mt-0.5 text-[11px] text-[#65656f]">
                    Referensi:{" "}
                    <span className="font-mono font-medium text-amber-800">
                      {log.referenceNote}
                    </span>
                  </p>
                )}
              </div>

              {log.correlationId && (
                <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-[#8c8c99]">
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
