import { ReactNode } from "react";

export default function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {children}
      </div>
    </div>
  );
} 