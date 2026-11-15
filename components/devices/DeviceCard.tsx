import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";

type DeviceCardProps = {
  id: string;
  name: string;
  category: string;
  price: number;
  location: string;
  rating: number;
  emoji?: string;
  imageUrl?: string | null;
};

export default function DeviceCard({
  id,
  name,
  category,
  price,
  location,
  rating,
  emoji = "📦",
  imageUrl,
}: DeviceCardProps) {
  return (
    <Link
      href={`/devices/${id}`}
      className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-56 w-full overflow-hidden bg-zinc-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl">
            {emoji}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-600">
            {category}
          </span>

          <span className="flex items-center gap-1 text-sm font-semibold text-zinc-600">
            <Star className="h-4 w-4 fill-current text-amber-400" />
            {rating > 0 ? rating.toFixed(1) : "New"}
          </span>
        </div>

        <h3 className="mt-4 text-lg font-black text-zinc-950">
          {name}
        </h3>

        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>

        <div className="mt-5">
          <p className="text-xl font-black text-zinc-950">
            ฿{price.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-zinc-400">
              / day
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}