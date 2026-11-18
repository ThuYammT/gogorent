"use client";

import { useActionState } from "react";
import { saveCategory } from "@/app/admin/categories/actions";

export default function CategoryForm({ category }: {
  category?: { id: string; name: string; emoji: string | null };
}) {
  const [state, action, pending] = useActionState(saveCategory.bind(null, category?.id ?? null), {});
  const prefix = category?.id ?? "new";
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <div>
          <label htmlFor={`${prefix}-name`} className="text-sm font-medium text-zinc-700">Category name</label>
          <input id={`${prefix}-name`} name="name" required maxLength={80} defaultValue={category?.name ?? ""} placeholder="e.g. Camping equipment" className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm" />
        </div>
        <div>
          <label htmlFor={`${prefix}-emoji`} className="text-sm font-medium text-zinc-700">Icon (optional)</label>
          <input id={`${prefix}-emoji`} name="emoji" maxLength={16} defaultValue={category?.emoji ?? ""} placeholder="e.g. ⛺" className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm" />
        </div>
      </div>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-emerald-700">{state.success}</p>}
      <button disabled={pending} type="submit" className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50">
        {pending ? "Saving..." : category ? "Save changes" : "Create category"}
      </button>
    </form>
  );
}
