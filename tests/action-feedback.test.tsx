import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { redirect } from "next/navigation";
import {
  ActionAlert,
  copyText,
  runAction,
  type FeedbackVariant,
} from "../src/components/ui/action-feedback";

let notices: { variant: FeedbackVariant; message: string }[];
beforeEach(() => {
  notices = [];
  const target = new EventTarget();
  target.addEventListener("patemon:action-feedback", (event) => {
    notices.push((event as CustomEvent).detail);
  });
  vi.stubGlobal("window", target);
});
afterEach(() => vi.unstubAllGlobals());

describe("action outcomes", () => {
  it("waits for server confirmation before announcing success", async () => {
    let complete!: (result: { success: boolean }) => void;
    const operation = new Promise<{ success: boolean }>((resolve) => {
      complete = resolve;
    });
    const pending = runAction(() => operation, "Data tersimpan.");
    expect(notices).toEqual([]);
    complete({ success: true });
    expect((await pending).success).toBe(true);
    expect(notices).toEqual([
      { variant: "success", message: "Data tersimpan." },
    ]);
  });

  it("reports a rejected write without any success message or UI-update signal", async () => {
    const result = await runAction(
      async () => ({ success: false, error: "Akses sudah dicabut." }),
      "Berhasil dihapus."
    );
    expect(result.success).toBe(false);
    expect(notices).toEqual([
      { variant: "destructive", message: "Akses sudah dicabut." },
    ]);
  });

  it("sends form failures to the inline owner without a duplicate global alert", async () => {
    const onError = vi.fn();
    await runAction(
      async () => ({ success: false, message: "Nama wajib diisi." }),
      "Tersimpan.",
      onError
    );
    expect(onError).toHaveBeenCalledWith("Nama wajib diisi.");
    expect(notices).toEqual([]);
    const state = await runAction(
      async () => {
        throw Error("private backend detail");
      },
      false,
      "inline"
    );
    expect(state.success).toBe(false);
    expect(notices).toEqual([]);
  });

  it("keeps transport failures uncertain and does not expose raw backend details", async () => {
    const result = await runAction(async () => {
      throw Error("sensitive database value");
    }, "Tersimpan.");
    expect(result.success).toBe(false);
    expect(notices).toHaveLength(1);
    expect(notices[0].variant).toBe("destructive");
    expect(notices[0].message).toContain("belum dapat dipastikan");
    expect(notices[0].message).not.toContain("sensitive");
  });

  it("leaves Next.js redirects for the router instead of reporting a failed write", async () => {
    await expect(
      runAction(async () => redirect("/workspaces"), false)
    ).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });
    expect(notices).toEqual([]);
  });

  it("distinguishes conflicts, empty imports and partial imports", async () => {
    await runAction(
      async () => ({
        success: false,
        conflict: true,
        error: "Data telah diubah anggota lain.",
      }),
      "Tersimpan."
    );
    await runAction(
      async () => ({ success: true, count: 0 }),
      "Data ditambahkan."
    );
    await runAction(
      async () => ({
        success: true,
        failedCount: 2,
        message: "3 tersimpan, 2 perlu diperiksa.",
      }),
      "Semua ditambahkan."
    );
    expect(notices.map((item) => item.variant)).toEqual([
      "warning",
      "info",
      "warning",
    ]);
    expect(notices[2].message).toContain("2 perlu diperiksa");
  });

  it("reports pending payment requests as information without implying paid access", async () => {
    await runAction(async () => ({ success: true }), {
      variant: "info",
      message: "Menunggu verifikasi admin.",
    });
    expect(notices).toEqual([
      { variant: "info", message: "Menunggu verifikasi admin." },
    ]);
  });
});

describe("clipboard outcomes", () => {
  it("only confirms a copy accepted by the browser", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await copyText("invitation", "Tautan disalin.")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("invitation");
    expect(notices[0].variant).toBe("info");
    writeText.mockRejectedValueOnce(new Error("Permission denied"));
    expect(await copyText("invitation")).toBe(false);
    expect(notices[1].variant).toBe("destructive");
  });

  it("handles unavailable clipboard APIs without throwing", async () => {
    vi.stubGlobal("navigator", {});
    expect(await copyText("invitation")).toBe(false);
    expect(notices[0].variant).toBe("destructive");
  });
});

describe("accessible shadcn alerts", () => {
  it.each(["success", "info", "warning", "destructive"] as const)(
    "uses an appropriate live role for %s and escapes message content",
    (variant) => {
      const html = renderToStaticMarkup(
        <ActionAlert
          variant={variant}
          message="<script>unsafe</script>"
          onClose={() => {}}
        />
      );
      expect(html).toContain(
        variant === "success" || variant === "info"
          ? 'role="status"'
          : 'role="alert"'
      );
      expect(html).toContain('aria-atomic="true"');
      expect(html).toContain('aria-label="Tutup"');
      expect(html).toContain('type="button"');
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    }
  );
});
