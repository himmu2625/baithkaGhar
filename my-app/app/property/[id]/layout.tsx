import { Metadata } from 'next';

type Props = {
  children: React.ReactNode;
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // In Next.js App Router, params is already resolved by the time it reaches this function
  // We don't need to await it directly, but we should use proper async/await patterns
  const propertyId = params?.id || '';
  
  return {
    title: `Property Details | Baithaka GHAR`,
    description: "Find your perfect vacation home with Baithaka GHAR",
    icons: {
      icon: '/Logo.png',
    },
  };
}

export default function PropertyLayout({ children }: Props) {
  return <>{children}</>;
} 