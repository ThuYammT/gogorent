import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("gogorent_session");

  if (!sessionCookie) {
    redirect("/login");
  }

  let session: unknown;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    redirect("/login");
  }

  if (
    typeof session !== "object" ||
    session === null ||
    !("userId" in session) ||
    typeof session.userId !== "string"
  ) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, status: true },
  });

  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    redirect("/login");
  }
}
