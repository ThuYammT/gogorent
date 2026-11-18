import { Suspense } from "react";
import CategoryForm from "@/components/admin/CategoryForm";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

async function CategoriesContent() {
  await requireAdmin();
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { devices: true } } } });
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8 md:px-10">
      <header>
        <p className="text-sm font-medium text-zinc-500">Administration</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">Categories</h1>
        <p className="mt-2 text-sm text-zinc-500">Create categories owners can choose when listing items for rent. Changes are available immediately.</p>
      </header>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Create category</h2>
        <CategoryForm />
      </section>
      <section aria-label="Existing categories" className="space-y-4">
        <h2 className="text-lg font-semibold">Existing categories ({categories.length})</h2>
        {categories.length === 0 && <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">Create your first category so owners can start listing items.</p>}
        {categories.map(category => (
          <article key={category.id} className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold">{category.emoji} {category.name}</h3>
            <p className="mb-4 mt-1 text-sm text-zinc-500">{category._count.devices} listing{category._count.devices === 1 ? "" : "s"}</p>
            <CategoryForm category={category} />
          </article>
        ))}
      </section>
    </div>
  );
}

export default function CategoriesPage() {
  return <Suspense fallback={<p className="p-8 text-sm text-zinc-500">Loading categories...</p>}><CategoriesContent /></Suspense>;
}
