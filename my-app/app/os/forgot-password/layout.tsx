export const metadata = {
  title: 'Forgot Password - Baithaka Ghar OS',
  description: 'Reset your owner portal password',
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No authentication check, no sidebar, no header
  // Just render the forgot password page as-is
  return <>{children}</>;
}
