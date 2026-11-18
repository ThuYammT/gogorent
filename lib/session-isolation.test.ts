import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, beforeEach, test } from "node:test";
import { tabSessionCookie } from "./tab-session";
import { hashSessionToken } from "./session-token";

const load = createRequire(__filename);
const headerPath = load.resolve("next/headers");
const prismaPath = load.resolve("./prisma");
const sessionPath = load.resolve("./session");
load(headerPath); load(prismaPath);
const originals = { headers: load.cache[headerPath]!.exports, prisma: load.cache[prismaPath]!.exports };
let tab: string | null = null;
const tabA = "a".repeat(32);
const tabB = "b".repeat(32);
const jar = new Map<string, string>();
const records = new Map<string, { userId: string; expiresAt: Date }>();
load.cache[headerPath]!.exports = {
  headers: async () => new Headers(tab ? { "x-gogorent-tab": tab } : {}),
  cookies: async () => ({
    get: (name: string) => jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name: string, token: string, options: { httpOnly: boolean; sameSite: string }) => {
      assert.equal(options.httpOnly, true);
      assert.equal(options.sameSite, "lax");
      jar.set(name, token);
    },
    delete: (name: string) => jar.delete(name),
  }),
};
load.cache[prismaPath]!.exports = { prisma: { session: {
  create: async ({ data }: { data: { tokenHash: string; userId: string; expiresAt: Date } }) => { records.set(data.tokenHash, data); },
  findUnique: async ({ where }: { where: { tokenHash: string } }) => {
    const record = records.get(where.tokenHash);
    return record ? { ...record, user: { id: record.userId, role: "RENTER", status: "ACTIVE", name: "Test", email: "test@example.com" } } : null;
  },
  deleteMany: async ({ where }: { where: { tokenHash: string } }) => { records.delete(where.tokenHash); },
} } };
const { createSession, getSession, deleteSession } = load("./session") as typeof import("./session");
beforeEach(() => { tab = null; jar.clear(); records.clear(); });
after(() => {
  load.cache[headerPath]!.exports = originals.headers;
  load.cache[prismaPath]!.exports = originals.prisma;
  delete load.cache[sessionPath];
});

test("two tabs can authenticate different users with the same role independently", async () => {
  tab = tabA; await createSession("renter-a");
  tab = tabB; assert.equal(await getSession(), null); await createSession("renter-b");
  assert.equal((await getSession())?.userId, "renter-b");
  tab = tabA; assert.equal((await getSession())?.userId, "renter-a");
  assert.equal(records.size, 2);
});

test("logging out one tab does not revoke another tab's session", async () => {
  tab = tabA; await createSession("renter-a");
  tab = tabB; await createSession("renter-b");
  tab = tabA; await deleteSession(); assert.equal(await getSession(), null);
  tab = tabB; assert.equal((await getSession())?.userId, "renter-b");
  assert.equal(records.size, 1);
});

test("a fresh tab and requests without valid tab context never inherit shared cookies", async () => {
  tab = tabA; await createSession("renter-a");
  jar.set("gogorent_session", jar.get(tabSessionCookie(tabA)!)!);
  for (const context of [null, "", "../invalid", "a".repeat(31), "c".repeat(32)]) {
    tab = context; assert.equal(await getSession(), null);
  }
  tab = null; await assert.rejects(createSession("other"), /tab is still starting/);
  await deleteSession(); assert.equal(records.size, 1);
});

test("switching accounts in one tab revokes only its previous token", async () => {
  tab = tabA; await createSession("first");
  const oldHash = hashSessionToken(jar.get(tabSessionCookie(tabA)!)!);
  tab = tabB; await createSession("independent");
  tab = tabA; await createSession("replacement");
  assert.equal(records.has(oldHash!), false);
  assert.equal((await getSession())?.userId, "replacement");
  tab = tabB; assert.equal((await getSession())?.userId, "independent");
});
