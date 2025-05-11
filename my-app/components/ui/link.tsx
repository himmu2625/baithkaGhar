import * as React from "react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

interface LinkProps extends React.ComponentPropsWithoutRef<typeof NextLink> {
  className?: string;
  children: React.ReactNode;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <NextLink
        className={cn(
          "text-darkGreen hover:text-mediumGreen hover:underline focus:outline-none focus:ring-2 focus:ring-mediumGreen focus:ring-offset-2",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </NextLink>
    );
  }
);

Link.displayName = "Link";
