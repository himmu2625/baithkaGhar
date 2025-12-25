export const metadata = {
  title: 'Reset Password - Baithaka Ghar OS',
  description: 'Create a new password for your owner portal account',
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No authentication check, no sidebar, no header
  // Just render the reset password page as-is
  return <>{children}</>;
}
