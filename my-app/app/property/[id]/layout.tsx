import { Metadata } from 'next';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Await params in Next.js 15
  const { id } = await params;

  return {
    title: `Property Details | Baithaka GHAR`,
    description: "Find your perfect vacation home with Baithaka GHAR",
    icons: {
      icon: '/Logo-header.png',
    },
  };
}

export default function PropertyLayout({ children }: Props) {
  return <>{children}</>;
} 