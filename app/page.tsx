import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleCheck, Clock3, Layers3, Leaf, MapPin, Package, QrCode, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Reveal from "@/components/home/Reveal";
import { prisma } from "@/lib/prisma";
import "./home.css";

const listingQuery = {
  where: { status: "AVAILABLE" as const },
  include: { category: true, images: { orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }], take: 1 } },
  orderBy: [{ avgRating: "desc" as const }, { createdAt: "desc" as const }],
};

async function HeroListing() {
  const device = await prisma.device.findFirst(listingQuery);
  return <div className="home-showcase">
    <div className="home-orbit" aria-hidden="true" />
    <span className="home-showcase-caption">GOOD THINGS. JUST FOR A WHILE.</span>
    <Link href={device ? `/devices/${device.id}` : "/devices"} className="home-hero-card group">
      <div className="home-hero-image">
        {device?.images[0]?.url ? <Image src={device.images[0].url} alt={device.name} fill sizes="(max-width: 767px) 85vw, 420px" preload className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="home-product-placeholder" aria-hidden="true">{device?.emoji || <Package size={110} strokeWidth={1} />}</div>}
        <span className="home-availability"><span />{device ? "Available to rent" : "Your next possibility"}</span>
        <span className="home-image-index">01 / DISCOVER</span>
      </div>
      <div className="home-hero-card-body">
        <div className="flex items-center justify-between gap-3 text-xs text-stone-500"><span>{device?.category.name ?? "Less owning. More living."}</span>{device && <span className="flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-500" />{device.avgRating > 0 ? device.avgRating.toFixed(1) : "New listing"}</span>}</div>
        <h2>{device?.name ?? "Make room for something new."}</h2>
        <div className="mt-5 flex items-end justify-between gap-3"><div>{device ? <><strong className="text-2xl tracking-tight">฿{Number(device.pricePerDay).toLocaleString()}</strong><span className="text-sm text-stone-500"> / day</span></> : <span className="text-sm text-stone-500">Explore the marketplace</span>}</div><span className="home-circle-arrow"><ArrowUpRight size={20} /></span></div>
      </div>
    </Link>
    <div className="home-floating-note"><span className="home-note-icon"><QrCode size={21} /></span><div><strong>A smoother handover</strong><span>Scan. Confirm. You’re all set.</span></div><CircleCheck size={17} className="text-emerald-700" /></div>
    <span className="home-showcase-bottom"><span className="home-small-star">✳</span> Big plans don’t need big purchases.</span>
  </div>;
}

async function Categories() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, take: 10 });
  if (!categories.length) return <Link href="/devices" className="home-category">Explore all items <ArrowUpRight size={16} /></Link>;
  return <>{categories.map(category => <Link key={category.id} href={`/devices?q=${encodeURIComponent(category.name)}`} className="home-category"><span aria-hidden="true">{category.emoji || <Layers3 size={18} />}</span>{category.name}<ArrowUpRight size={15} /></Link>)}</>;
}

async function FeaturedListings() {
  const devices = await prisma.device.findMany({ ...listingQuery, take: 4 });
  if (!devices.length) return <div className="home-empty"><Package size={32} strokeWidth={1.2} /><h3>A little space for what’s next.</h3><p>New owner listings will appear here once approved.</p><Link href="/register/owner" className="home-text-link">Be the first to list an item <ArrowRight size={16} /></Link></div>;
  return <div className="home-listings">{devices.map((device, index) => <Reveal key={device.id} delay={index * 65}><Link href={`/devices/${device.id}`} className="home-listing group">
    <div className="home-listing-image">{device.images[0]?.url ? <Image src={device.images[0].url} alt={device.name} fill sizes="(max-width: 479px) 90vw, (max-width: 1023px) 45vw, 280px" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <span className="text-7xl" aria-hidden="true">{device.emoji || "📦"}</span>}<span className="home-listing-tag">{device.category.name}</span><span className="home-listing-arrow"><ArrowUpRight size={19} /></span></div>
    <div className="flex items-start justify-between gap-3 pt-4"><h3>{device.name}</h3><span className="flex shrink-0 items-center gap-1 text-xs text-stone-600"><Star size={13} className="fill-amber-400 text-amber-500" />{device.avgRating > 0 ? device.avgRating.toFixed(1) : "New"}</span></div>
    <p className="mt-2 flex items-center gap-1 text-xs text-stone-500"><MapPin size={12} />{device.location || "Arrange with owner"}</p><p className="mt-4 text-sm"><strong className="text-lg font-semibold">฿{Number(device.pricePerDay).toLocaleString()}</strong><span className="text-stone-500"> / day</span></p>
  </Link></Reveal>)}</div>;
}

function ListingsSkeleton() { return <div className="home-listings" aria-label="Loading available items">{[0,1,2,3].map(item => <div key={item} className="home-skeleton h-80 rounded-2xl" />)}</div>; }

const steps = [
  { number: "01", icon: Search, title: "Find your next thing.", text: "Browse the marketplace. Find the right item and choose the dates that work for you." },
  { number: "02", icon: CircleCheck, title: "Get the go-ahead.", text: "Send a rental request. Once the owner approves, confirm your payment and deposit." },
  { number: "03", icon: QrCode, title: "Pick up. Make it happen.", text: "Meet the owner, inspect your item, and confirm collection with a secure QR handover." },
];
const questions = [
  { question: "Do I need an account to browse?", answer: "You can explore all available listings without an account. When you find something you like, create a renter account to choose dates and request a booking." },
  { question: "How do collection and returns work?", answer: "Arrange a meeting with the owner. Inspect the item before accepting it, then use the booking’s QR handover to confirm collection. When your rental ends, follow the return steps in your booking." },
  { question: "What if something is wrong with the item?", answer: "Report a collection issue from your booking before confirming receipt. The owner can propose a repair, a replacement, or cancellation for you to review." },
  { question: "Can I list my own items?", answer: "Yes. Create an owner account, choose a category, add photos and details, and set your daily price and deposit. An administrator reviews your listing before it appears in the marketplace." },
];

export default function Home() {
  return <div className="home">
    <a href="#home-main" className="home-skip">Skip to content</a><Navbar />
    <main id="home-main">
      <section className="home-hero"><div className="home-container home-hero-grid">
        <div className="home-intro">
          <div className="home-eyebrow home-entrance"><span className="home-status-dot" /> A LITTLE LESS OWNING. A LOT MORE DOING.</div>
          <h1 className="home-entrance" style={{ animationDelay: "80ms" }}>Great things.<br />For <span className="home-serif">your</span><br /><span className="home-highlight">next thing.<svg viewBox="0 0 470 20" preserveAspectRatio="none" aria-hidden="true"><path d="M4 13 Q 220 -1 464 10 M35 18 Q 270 3 425 15" /></svg></span></h1>
          <p className="home-hero-copy home-entrance" style={{ animationDelay: "160ms" }}>The gear for your next idea, adventure, or everyday need. Rent from owners. Make it happen. Bring it back.</p>
          <form action="/devices" className="home-search home-entrance" style={{ animationDelay: "240ms" }} role="search"><Search size={20} aria-hidden="true" /><label htmlFor="home-search" className="sr-only">Search rental items</label><input id="home-search" name="q" type="search" placeholder="What do you have in mind?" maxLength={150} /><button type="submit"><span className="hidden sm:inline">Find it</span><ArrowRight size={20} /><span className="sr-only sm:hidden">Search</span></button></form>
          <div className="home-hero-links home-entrance" style={{ animationDelay: "320ms" }}><Link href="/devices">Explore everything <ArrowUpRight size={15} /></Link><a href="#how-it-works">How it works <ArrowDown size={14} /></a></div>
          <div className="home-mini-trust"><span><Check size={14} /> Reviewed listings</span><span><Check size={14} /> Clear daily pricing</span><span><Check size={14} /> QR handovers</span></div>
        </div>
        <div className="home-entrance" style={{ animationDelay: "200ms" }}><Suspense fallback={<div className="home-skeleton home-hero-placeholder" />}><HeroListing /></Suspense></div>
      </div><div className="home-hero-foot home-container"><span>LESS COMMITMENT. MORE POSSIBILITY.</span><span className="flex items-center gap-2">Find your next possibility <ArrowDown size={14} /></span></div></section>
      <section className="home-category-section home-container" aria-labelledby="category-heading"><Reveal><div className="home-section-top"><div><p className="home-eyebrow">A PLACE TO START</p><h2 id="category-heading" className="home-small-heading">What’s on your agenda?</h2></div><Link href="/devices" className="home-text-link">Browse all <ArrowUpRight size={16} /></Link></div></Reveal><div className="home-categories"><Suspense fallback={<span className="text-sm text-stone-500">Finding your possibilities…</span>}><Categories /></Suspense></div></section>
      <section className="home-featured home-container" id="discover" aria-labelledby="featured-heading"><Reveal><div className="home-section-top"><div><p className="home-eyebrow"><span className="home-status-dot" /> CURRENTLY IN THE SPOTLIGHT</p><h2 id="featured-heading" className="home-heading">Ready when <span className="home-serif">you are.</span></h2><p className="home-section-copy">Good finds. Flexible plans. A little something for your next chapter.</p></div><Link href="/devices" className="home-outline-button">See all available items <ArrowUpRight size={17} /></Link></div></Reveal><Suspense fallback={<ListingsSkeleton />}><FeaturedListings /></Suspense></section>
      <section className="home-how" id="how-it-works" aria-labelledby="how-heading"><div className="home-container"><Reveal><div className="home-section-top"><div><p className="home-eyebrow">FROM “WHAT IF” TO “LET’S GO”</p><h2 id="how-heading" className="home-heading">A few steps.<br /><span className="home-serif">A whole lot of possibility.</span></h2></div><p className="home-section-copy max-w-xs">Less time figuring things out.<br />More time enjoying what you came for.</p></div></Reveal><div className="home-steps">{steps.map((step, index) => <Reveal key={step.number} delay={index * 90}><article className="home-step"><div className="home-step-top"><span className="home-step-icon"><step.icon size={24} strokeWidth={1.5} /></span><span>{step.number}</span></div><h3>{step.title}</h3><p>{step.text}</p></article></Reveal>)}</div></div></section>
      <section className="home-container home-values" aria-labelledby="values-heading"><Reveal><div className="home-values-intro"><span className="home-asterisk" aria-hidden="true">✳</span><p className="home-eyebrow">MORE EXPERIENCES. LESS STUFF.</p><h2 id="values-heading" className="home-heading">Own the moment.<br /><span className="home-serif">Skip the owning.</span></h2><p className="home-section-copy">A weekend shoot. A project worth starting. Something you just want to try. You don’t need to buy it to make it yours for a while.</p><Link href="/devices" className="home-dark-button">Find your next thing <ArrowUpRight size={18} /></Link></div></Reveal><div>{[
        { icon: Clock3, title: "For the time you need.", text: "Choose your dates and see the daily rate and deposit before requesting." },
        { icon: ShieldCheck, title: "A little more clarity.", text: "Reviewed listings, booking updates, and QR handovers keep everyone in the loop." },
        { icon: Leaf, title: "Give good things more use.", text: "Make the most of what’s already out there, one shared item at a time." },
      ].map((value,index) => <Reveal key={value.title} delay={index * 70}><article className="home-value"><value.icon size={23} strokeWidth={1.5} /><div><h3>{value.title}</h3><p>{value.text}</p></div></article></Reveal>)}</div></section>
      <section className="home-container home-owner-section"><Reveal><div className="home-owner"><div><p className="home-eyebrow"><Sparkles size={14} /> FOR THE THINGS BETWEEN ADVENTURES</p><h2 className="home-heading">Got something great<br /><span className="home-serif">gathering dust?</span></h2><p>Let it be part of someone else’s next big idea.<br />List your items and turn spare time into earning time.</p><Link href="/register/owner" className="home-dark-button">Become an owner <ArrowUpRight size={18} /></Link></div><div className="home-owner-art" aria-hidden="true"><div className="home-owner-ring" /><div className="home-owner-ticket"><Package size={42} strokeWidth={1.2} /><span>YOUR NEXT LISTING</span><strong>Good things<br />deserve a sequel.</strong><div className="home-ticket-line" /><span className="flex items-center justify-between">LIST IT. SHARE IT. REPEAT.<ArrowUpRight size={19} /></span></div><span className="home-owner-spark">✳</span></div></div></Reveal></section>
      <section className="home-container home-faq" aria-labelledby="faq-heading"><Reveal><div><p className="home-eyebrow">A LITTLE MORE TO KNOW</p><h2 id="faq-heading" className="home-heading">Good questions.<br /><span className="home-serif">Simple answers.</span></h2></div></Reveal><div>{questions.map(question => <details className="home-question" key={question.question}><summary>{question.question}<ChevronDown size={18} /></summary><p>{question.answer}</p></details>)}</div></section>
    </main>
    <footer className="home-footer"><div className="home-container"><div className="home-footer-top"><Link href="/" className="home-wordmark">GoGo<span>Rent</span></Link><p>Good things are better shared.</p><a href="#home-main" className="home-text-link">Back to top <ArrowUpRight size={16} /></a></div><div className="home-footer-bottom"><p>© 2026 GoGoRent. Make room for possibility.</p><nav aria-label="Footer"><Link href="/devices">Marketplace</Link><a href="#how-it-works">How it works</a><Link href="/register/owner">For owners</Link><Link href="/login">Log in</Link></nav></div></div></footer>
  </div>;
}
