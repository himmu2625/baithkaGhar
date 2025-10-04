"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CityPage() {
  const params = useParams();
  const router = useRouter();
  const cityName = (params?.city as string) || "";

  useEffect(() => {
    // Redirect to search page with city as location parameter
    if (cityName) {
      router.replace(`/search?location=${encodeURIComponent(cityName)}`);
    }
  }, [cityName, router]);

  // Show loading state while redirecting
  return (
    <div className="container mx-auto px-4 py-24 md:py-32 min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 text-mediumGreen animate-spin mb-4" />
      <h3 className="text-xl font-semibold text-mediumGreen">
        Redirecting to {cityName}...
      </h3>
    </div>
  );
}
