import { Shirt, Layers, Grid2x2, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Primary navigation, shared by the desktop sidebar and mobile bottom nav. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Wardrobe", href: "/wardrobe", icon: Shirt },
  { label: "Designer", href: "/designer", icon: Layers },
  { label: "Outfits", href: "/outfits", icon: Grid2x2 },
  { label: "Settings", href: "/settings", icon: Settings },
];
