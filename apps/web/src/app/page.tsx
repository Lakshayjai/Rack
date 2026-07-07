import { redirect } from "next/navigation";

/** Root entry — land everyone on the outfit maker (the dashboard guard handles auth). */
export default function Home() {
  redirect("/outfits/new");
}
