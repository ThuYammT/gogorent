/* Route each browser tab to its own HttpOnly session cookie. No responses or
 * authentication tokens are cached or stored by this worker. */
const DATABASE = "gogorent-tab-contexts-v1";
const contexts = new Map();
let database;

function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("clients", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}

async function readContext(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction("clients").objectStore("clients").get(id);
    request.onsuccess = () => resolve(request.result?.context ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function storeContext(id, context) {
  if (!id) return;
  contexts.set(id, Promise.resolve(context));
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("clients", "readwrite");
    tx.objectStore("clients").put({ id, context, updatedAt: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function newContext() {
  return crypto.randomUUID().replaceAll("-", "");
}

async function contextFor(id) {
  if (!id) return newContext();
  if (!contexts.has(id)) contexts.set(id, (async () => {
    const existing = await readContext(id);
    if (existing) return existing;
    const context = newContext();
    await storeContext(id, context);
    return context;
  })());
  return contexts.get(id);
}

self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("message", event => {
  if (event.data?.type !== "GOGORENT_TAB_CONTEXT" || !event.source?.id || !event.ports[0]) return;
  event.waitUntil(contextFor(event.source.id).then(context => {
    event.ports[0].postMessage({ context });
  }).catch(() => event.ports[0].postMessage({ error: "Could not initialize this tab." })));
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/_next/") && !url.searchParams.has("_rsc") || url.pathname === "/tab-sessions.js" || /\.(?:svg|png|jpg|jpeg|webp|ico|woff2?|css|js)$/.test(url.pathname)) return;

  event.respondWith((async () => {
    const navigation = event.request.mode === "navigate";
    // A new tab has no replaced client. Reloads and full navigations inherit
    // only the document they replace, never the opener or another tab's URL.
    const source = navigation ? event.replacesClientId || event.clientId : event.clientId;
    const context = await contextFor(source);
    if (navigation && event.resultingClientId) await storeContext(event.resultingClientId, context);
    const headers = new Headers(event.request.headers);
    headers.set("x-gogorent-tab", context);
    return fetch(new Request(event.request, { headers, cache: "no-store" }));
  })());
});
