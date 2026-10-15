import Link from "next/link";

const adminSections = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/rentals", label: "Rentals" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/damage-reports", label: "Damage reports" },
  { href: "/admin/audit-logs", label: "Audit logs" },
];

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <p className="mt-2 text-gray-600">
        Manage users, listings, rentals, and platform activity.
      </p>

      <nav
        aria-label="Admin sections"
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {adminSections.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-gray-200 p-5 font-medium hover:bg-gray-50"
          >
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}