import { Metadata } from 'next';

type Props = {
  children: React.ReactNode;
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Fetch property data - simplified for now, can enhance later
  const propertyId = params.id;
  
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