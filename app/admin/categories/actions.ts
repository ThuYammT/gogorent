"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type CategoryFormState = { error?: string; success?: string };

const schema = z.object({
  name: z.string().trim().min(1, "Enter a category name.").max(80, "Use at most 80 characters for the name."),
  emoji: z.string().trim().max(16, "Use a short icon or emoji (at most 16 characters)."),
});

export async function saveCategory(
  id: string | null,
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({ name: formData.get("name"), emoji: formData.get("emoji") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, emoji } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Serialize category writes so concurrent case variants cannot bypass this check.
      await tx.$executeRaw`LOCK TABLE "Category" IN SHARE ROW EXCLUSIVE MODE`;
      if (id && !(await tx.category.findUnique({ where: { id } }))) {
        throw new Error("CATEGORY_NOT_FOUND");
      }
      const duplicate = await tx.category.findFirst({
        where: { name: { equals: name, mode: "insensitive" }, ...(id ? { id: { not: id } } : {}) },
      });
      if (duplicate) throw new Error("CATEGORY_DUPLICATE");
      const category = id
        ? await tx.category.update({ where: { id }, data: { name, emoji: emoji || null } })
        : await tx.category.create({ data: { name, emoji: emoji || null } });
      await tx.auditLog.create({ data: {
        userId: admin.id,
        action: id ? "UPDATE_CATEGORY" : "CREATE_CATEGORY",
        entity: "Category",
        entityId: category.id,
        details: JSON.stringify({ name, emoji: emoji || null }),
      } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_DUPLICATE") return { error: "A category with this name already exists." };
    if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") return { error: "This category no longer exists. Refresh the page." };
    return { error: "Unable to save the category. Please try again." };
  }

  for (const path of ["/admin/categories", "/admin/dashboard", "/admin/audit-logs", "/owner/devices", "/devices", "/"]) {
    revalidatePath(path);
  }
  revalidatePath("/owner/devices/[id]/edit", "page");
  revalidatePath("/owner/devices/new");
  return { success: id ? "Category updated." : "Category created. Owners can now select it when listing an item." };
}
