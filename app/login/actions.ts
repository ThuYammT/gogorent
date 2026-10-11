"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = {
  error?: string;
};

function dashboardPathForRole(role: "RENTER" | "OWNER" | "ADMIN") {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "OWNER":
      return "/owner/dashboard";
    case "RENTER":
    default:
      return "/renter/dashboard";
  }
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return { error: firstIssue ?? "Invalid input" };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    return { error: "Invalid email or password" };
  }

  if (user.status === "SUSPENDED") {
    return { error: "Your account has been suspended. Contact support." };
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    return { error: "Invalid email or password" };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    "gogorent_session",
    JSON.stringify({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );

  redirect(dashboardPathForRole(user.role));
}
