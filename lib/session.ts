import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hashSessionToken, newSessionToken } from "@/lib/session-token";

export type GoGoRentSession = {
  userId: string;
  role: "RENTER" | "OWNER" | "ADMIN";
  name: string;
  email: string;
};

const SESSION_COOKIE = "gogorent_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export async function createSession(userId: string) {
  const token = newSessionToken();
  const tokenHash = hashSessionToken(token);
  if (!tokenHash) {
    throw new Error("Could not generate a session token.");
  }
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await prisma.session.create({
    data: { tokenHash, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const tokenHash = token ? hashSessionToken(token) : null;

  if (tokenHash) {
    await prisma.session.deleteMany({ where: { tokenHash } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<GoGoRentSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
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