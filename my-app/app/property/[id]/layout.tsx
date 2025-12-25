import { Metadata } from 'next';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Await params in Next.js 15
  const { id } = await params;

  return {
    title: `Property Details | Baithaka Ghar`,
    description: "Find your perfect vacation home with Baithaka Ghar",
  };
}

export default function PropertyLayout({ children }: Props) {
  return <>{children}</>;
} 