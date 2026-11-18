"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const TabSessionContext = createContext({ ready: false, error: "" });
export const useTabSession = () => useContext(TabSessionContext);

export default function TabSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState({ ready: false, error: "" });
  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      if (!("serviceWorker" in navigator) || !window.isSecureContext) {
        throw new Error("Independent tab logins need HTTPS and a browser with service workers, such as Chrome or Edge.");
      }
      const alreadyControlled = !!navigator.serviceWorker.controller;
      await navigator.serviceWorker.register("/tab-sessions.js", { scope: "/", updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>(resolve => {
          navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
          if (navigator.serviceWorker.controller) resolve();
        });
      }
      await new Promise<void>((resolve, reject) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => { channel.port1.close(); reject(new Error("Tab login could not start. Please reload this page.")); }, 10000);
        channel.port1.onmessage = event => {
          window.clearTimeout(timeout);
          channel.port1.close();
          if (/^[a-f0-9]{32}$/.test(event.data?.context ?? "")) resolve();
          else reject(new Error("Tab login could not start. Please reload this page."));
        };
        navigator.serviceWorker.controller!.postMessage({ type: "GOGORENT_TAB_CONTEXT" }, [channel.port2]);
      });
      if (cancelled) return;
      // The first uncontrolled document was rendered without a tab context.
      // Reload once under worker control so SSR, actions, and links agree.
      if (!alreadyControlled) { window.location.reload(); return; }
      // A cold worker can miss the first navigation. Resolve the session
      // through a controlled request before exposing the sign-in form.
      const response = await fetch("/api/session", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not verify this tab. Please reload the page.");
      const { role } = await response.json();
      if (cancelled) return;
      if (role && ["RENTER", "OWNER", "ADMIN"].includes(role)) {
        if (window.location.pathname === "/login") {
          router.replace(`/${role.toLowerCase()}/dashboard`);
        } else {
          router.refresh();
        }
      }
      setState({ ready: true, error: "" });
    }
    initialize().catch(error => {
      if (!cancelled) setState({ ready: false, error: error instanceof Error ? error.message : "Could not start independent tab logins." });
    });
    return () => { cancelled = true; };
  }, [router]);

  return <TabSessionContext.Provider value={state}>
    {state.error && <div role="alert" className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">{state.error} <button type="button" onClick={() => window.location.reload()} className="font-semibold underline">Retry</button></div>}
    {children}
  </TabSessionContext.Provider>;
}
