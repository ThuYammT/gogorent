"use client";
import Link from "next/link";
import {
  Heart,
  MapPin,
  Star,
} from "lucide-react";

type DeviceCardProps = {
  id: number;
  name: string;
  category: string;
  price: number;
  location: string;
  rating: number;
  emoji: string;
};

export default function DeviceCard({
  id,
  name,
  category,
  price,
  location,
  rating,
  emoji,
}: DeviceCardProps) {
  return (
    <Link
      href={`/devices/${id}`}
      className="group overflow-hidden rounded-[28px] border border-yellow-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100">
        <span className="text-8xl transition duration-300 group-hover:scale-110">
          {emoji}
        </span>

        <button
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          onClick={(event) => event.preventDefault()}
        >
          <Heart className="h-5 w-5" />
        </button>

        <div className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-green-600 shadow-sm">
          ● Available
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
              {category}
            </p>

            <h3 className="mt-1 text-lg font-black text-zinc-900">
              {name}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-sm font-bold">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {rating}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-1 text-sm text-zinc-400">
          <MapPin className="h-4 w-4" />
          {location}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-xl font-black text-zinc-900">
              ฿{price}
            </span>
            <span className="text-sm text-zinc-400">
              {" "}
              / day
            </span>
          </div>

          <span className="rounded-full bg-yellow-100 px-4 py-2 text-xs font-bold text-yellow-800">
            View item →
          </span>
        </div>
      </div>
    </Link>
  );
}