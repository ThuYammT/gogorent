"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteSession } from "@/lib/session";

export async function logoutAction() {
  await deleteSession();

  revalidatePath("/owner", "layout");

  redirect("/login");
}