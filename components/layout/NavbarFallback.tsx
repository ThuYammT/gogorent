export default function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-yellow-100 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-100" />

        <div className="hidden items-center gap-8 md:flex">
          <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-14 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="h-10 w-32 animate-pulse rounded-full bg-zinc-100" />
          <div className="h-10 w-24 animate-pulse rounded-full bg-zinc-200" />
        </div>

        <div className="h-10 w-10 animate-pulse rounded-lg bg-zinc-100 md:hidden" />
      </div>
    </header>
  );
}