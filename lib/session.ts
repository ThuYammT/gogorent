import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export type GoGoRentSession = {
  userId: string;
  role: "RENTER" | "OWNER" | "ADMIN";
  name: string;
  email: string;
};

export async function getSession(): Promise<GoGoRentSession | null> {
  const cookieStore = await cookies();

  const sessionCookie =
    cookieStore.get("gogorent_session");

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(
      sessionCookie.value,
    ) as GoGoRentSession;

    if (
      !session.userId ||
      !session.role ||
      !session.email
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
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