export const TAB_SESSION_HEADER = "x-gogorent-tab";

// This is a routing identifier, not an authentication token.
export function tabSessionCookie(tabId: string | null): string | null {
  return tabId && /^[a-f0-9]{32}$/.test(tabId)
    ? `gogorent_session_${tabId}`
    : null;
}
