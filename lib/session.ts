import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hashSessionToken, newSessionToken } from "@/lib/session-token";
import { TAB_SESSION_HEADER, tabSessionCookie } from "@/lib/tab-session";

export type GoGoRentSession = {
  userId: string;
  role: "RENTER" | "OWNER" | "ADMIN";
  name: string;
  email: string;
};

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

async function currentSessionCookie() {
  return tabSessionCookie((await headers()).get(TAB_SESSION_HEADER));
}

export async function createSession(userId: string) {
  const sessionCookie = await currentSessionCookie();
  if (!sessionCookie) throw new Error("This tab is still starting. Reload the login page and try again.");
  const token = newSessionToken();
  const tokenHash = hashSessionToken(token);
  if (!tokenHash) {
    throw new Error("Could not generate a session token.");
  }
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  const cookieStore = await cookies();
  const previousToken = cookieStore.get(sessionCookie)?.value;
  const previousHash = previousToken ? hashSessionToken(previousToken) : null;
  if (previousHash) await prisma.session.deleteMany({ where: { tokenHash: previousHash } });
  await prisma.session.create({
    data: { tokenHash, userId, expiresAt },
  });

  cookieStore.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const sessionCookie = await currentSessionCookie();
  if (!sessionCookie) return;
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  const tokenHash = token ? hashSessionToken(token) : null;

  if (tokenHash) {
    await prisma.session.deleteMany({ where: { tokenHash } });
  }

  cookieStore.delete(sessionCookie);
}

export async function getSession(): Promise<GoGoRentSession | null> {
  const sessionCookie = await currentSessionCookie();
  if (!sessionCookie) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  const tokenHash = token ? hashSessionToken(token) : null;
  if (!tokenHash) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") {
    return null;
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
  };
}

/*
 * Use this inside owner pages and server actions.
 *
 * It does not only trust the cookie.
 * It also checks the user against the database.
 */
export async function requireOwner() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const owner = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!owner) {
    redirect("/login");
  }

  if (
    owner.role !== "OWNER" ||
    owner.status !== "ACTIVE"
  ) {
    redirect("/");
  }

  return owner;
}

export async function requireRenter() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const renter = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!renter) {
    redirect("/login");
  }

  if (
    renter.role !== "RENTER" ||
    renter.status !== "ACTIVE"
  ) {
    redirect("/");
  }

  return renter;
}
