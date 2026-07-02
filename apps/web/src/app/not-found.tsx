import Link from "next/link";
import { Compass } from "lucide-react";

/** 404 page. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-primary px-4 text-center">
      <Compass size={40} className="text-accent-gold" strokeWidth={1.5} />
      <h1 className="font-display text-3xl text-text-primary">Page not found</h1>
      <p className="text-sm text-text-secondary">This page doesn’t exist or has moved.</p>
      <Link href="/wardrobe" className="text-accent-gold hover:underline">
        Back to your wardrobe
      </Link>
    </div>
  );
}
