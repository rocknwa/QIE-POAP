"use client";

import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("./Dashboard"), {
  ssr: false, // Disable SSR for this component
});

export default function Page() {
  return <Dashboard />;
}
