import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (
    !user ||
    user.role !== "ADMIN" ||
    user.status !== "ACTIVE"
  ) {
    redirect("/login");
  }

  return user;
}