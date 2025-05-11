"use client";

import dynamic from "next/dynamic";

// Dynamically import client-only components with ssr disabled
const ClientToaster = dynamic(() => import("@/components/ui/client-toaster"), {
  ssr: false,
  loading: () => null,
});

export default function ToasterWrapper() {
  return <ClientToaster />;
}
