import Link from "next/link";

import {
  MapPin,
  Star,
} from "lucide-react";

type DeviceCardProps = {
  id: string;
  name: string;
  category: string;
  price: number;
  location: string;
  rating: number;
  emoji: string;
  imageUrl?: string | null;
};

export default function DeviceCard({
  id,
  name,
  category,
  price,
  location,
  rating,
  emoji,
  imageUrl,
}: DeviceCardProps) {
  return (
    <Link
      href={`/devices/${id}`}
      className="group overflow-hidden rounded-[28px] border border-yellow-100 bg-white transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50"
    >
      {/* IMAGE */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[90px]">
              {emoji}
            </span>
          </div>
        )}

        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-sm backdrop-blur">
          {category}
        </span>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        <h3 className="truncate text-lg font-black text-zinc-900">
          {name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-zinc-400">
          <MapPin className="h-4 w-4" />

          <span className="truncate">
            {location}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-xl font-black text-zinc-900">
              ฿{price.toLocaleString()}
            </span>

            <span className="ml-1 text-sm text-zinc-400">
              / day
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

            <span className="font-bold text-zinc-700">
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}