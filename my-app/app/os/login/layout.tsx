export const metadata = {
  title: 'Login - Baithaka Ghar OS',
  description: 'Property owner login portal',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No authentication check, no sidebar, no header
  // Just render the login page as-is
  return <>{children}</>;
}
