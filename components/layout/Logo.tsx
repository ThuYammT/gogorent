import Link from "next/link";
import { Handshake } from "lucide-react";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-200">
        <Handshake className="h-6 w-6 text-white" />
      </div>

      <div>
        <p className="text-xl font-black tracking-tight text-zinc-900">
          GoGo<span className="text-orange-500">Rent</span>
        </p>

        <p className="-mt-1 text-[10px] font-medium text-zinc-400">
          rent. use. return.
        </p>
      </div>
    </Link>
  );
}