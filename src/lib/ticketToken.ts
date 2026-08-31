export function buildTicketVerificationPath(token: string) {
  return `/ticket/verify/${encodeURIComponent(token)}`;
}

export function extractTicketToken(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed, "https://funder-dz.com");
    const marker = "/ticket/verify/";
    const index = url.pathname.indexOf(marker);
    if (index >= 0)
      return decodeURIComponent(
        url.pathname.slice(index + marker.length),
      ).trim();
  } catch {}
  return trimmed;
}
