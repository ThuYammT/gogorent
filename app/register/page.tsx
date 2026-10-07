import Link from "next/link";
import {
  ArrowRight,
  Package,
  ShoppingBag,
} from "lucide-react";

import Logo from "@/components/layout/Logo";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#fffdf7] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Logo />

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-orange-600">
            JOIN GOGORENT ✨
          </span>

          <h1 className="mt-6 text-4xl font-black md:text-5xl">
            How do you want to
            <span className="text-orange-500">
              {" "}GoGo?
            </span>
          </h1>

          <p className="mt-4 text-zinc-500">
            You can always update your profile later.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <button className="group rounded-[30px] border-2 border-zinc-100 bg-white p-8 text-left transition hover:border-orange-400 hover:shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 transition group-hover:bg-orange-500 group-hover:text-white">
                <ShoppingBag />
              </div>

              <h2 className="mt-8 text-2xl font-black">
                I want to rent
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Find affordable laptops, cameras,
                gaming gear and more.
              </p>

              <p className="mt-7 flex items-center gap-2 font-bold text-orange-500">
                Continue as Renter
                <ArrowRight className="h-4 w-4" />
              </p>
            </button>

            <button className="group rounded-[30px] border-2 border-zinc-100 bg-white p-8 text-left transition hover:border-orange-400 hover:shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 transition group-hover:bg-orange-500 group-hover:text-white">
                <Package />
              </div>

              <h2 className="mt-8 text-2xl font-black">
                I want to earn
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                List unused devices and make money
                while others use them.
              </p>

              <p className="mt-7 flex items-center gap-2 font-bold text-orange-500">
                Continue as Owner
                <ArrowRight className="h-4 w-4" />
              </p>
            </button>
          </div>

          <p className="mt-8 text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-orange-500"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}