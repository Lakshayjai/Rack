import { redirect } from "next/navigation";

/** Root entry — send everyone to the wardrobe (the dashboard guard handles auth). */
export default function Home() {
  redirect("/wardrobe");
}
