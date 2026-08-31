"use client";

export type TicketExportResult = "downloaded" | "shared" | "opened";

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) {
        try {
          await image.decode();
        } catch {}
        return;
      }
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
      });
    }),
  );
}

async function waitForFonts() {
  if ("fonts" in document) {
    await document.fonts.ready;
  }
}

// يحوّل أي QR Canvas قديم داخل التذكرة إلى PNG image قبل html2canvas،
// لأن Safari قد يسقط canvas المتداخل عند التقاط عنصر DOM آخر.
function materializeCanvases(root: HTMLElement) {
  const cleanups: Array<() => void> = [];
  root.querySelectorAll("canvas").forEach((canvas) => {
    try {
      const image = document.createElement("img");
      image.src = canvas.toDataURL("image/png", 1);
      image.width = canvas.width;
      image.height = canvas.height;
      image.alt = "Funder QR";
      image.style.width = `${canvas.clientWidth || canvas.width}px`;
      image.style.height = `${canvas.clientHeight || canvas.height}px`;
      image.style.display = "block";
      canvas.style.display = "none";
      canvas.insertAdjacentElement("afterend", image);
      cleanups.push(() => {
        image.remove();
        canvas.style.display = "";
      });
    } catch {
      // QR component الجديد يستخدم PNG أصلاً؛ هذا fallback للمسار القديم فقط.
    }
  });
  return () => cleanups.reverse().forEach((cleanup) => cleanup());
}

export async function exportTicketToPng(
  element: HTMLElement,
  fileName: string,
): Promise<TicketExportResult> {
  // افتح تبويب iOS فور النقر حتى لا يمنعه Safari بعد العمليات غير المتزامنة.
  const previewWindow =
    isIOSDevice() && !navigator.share ? window.open("", "_blank") : null;
  const cleanupCanvases = materializeCanvases(element);

  try {
    await waitForFonts();
    await waitForImages(element);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(element, {
      backgroundColor: "#111827",
      scale: Math.min(4, Math.max(3, window.devicePixelRatio || 1)),
      useCORS: true,
      allowTaint: false,
      imageTimeout: 15_000,
      logging: false,
    });

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value ? resolve(value) : reject(new Error("PNG generation failed")),
        "image/png",
        1,
      ),
    );
    const file = new File([blob], fileName, { type: "image/png" });

    if (
      isIOSDevice() &&
      navigator.share &&
      (!navigator.canShare || navigator.canShare({ files: [file] }))
    ) {
      await navigator.share({ files: [file], title: "Funder Ticket" });
      previewWindow?.close();
      return "shared";
    }

    const objectUrl = URL.createObjectURL(blob);
    if (isIOSDevice()) {
      if (previewWindow) previewWindow.location.href = objectUrl;
      else window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return "opened";
    }

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5_000);
    return "downloaded";
  } catch (error) {
    previewWindow?.close();
    throw error;
  } finally {
    cleanupCanvases();
  }
}
