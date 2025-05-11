import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Password Reset | Baithaka GHAR",
  description:
    "Reset your admin password for the Baithaka GHAR management system",
};

export default function AdminForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
