import { redirect } from "next/navigation";

// App landing page – redirect to Missions
export default function Page() {
  redirect("/missions");
}
