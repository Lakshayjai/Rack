import { Shirt, Layers, Grid2x2, Settings, Sparkles, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Primary navigation, shared by the desktop sidebar and mobile bottom nav. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Make Outfit", href: "/outfits/new", icon: Sparkles },
  { label: "Wardrobe", href: "/wardrobe", icon: Shirt },
  { label: "Designer", href: "/designer", icon: Layers },
  { label: "Outfits", href: "/outfits", icon: Grid2x2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

/**
 * Active-state check where the most specific nav entry wins, so `/outfits/new`
 * highlights "Make Outfit" without also lighting up "Outfits".
 */
export function isNavActive(pathname: string, href: string): boolean {
  const matches = (h: string) => pathname === h || pathname.startsWith(`${h}/`);
  if (!matches(href)) return false;
  return !NAV_ITEMS.some((item) => item.href.length > href.length && matches(item.href));
}
