import { Metadata } from 'next';
import HeroSection from '@/components/partner/HeroSection';
import WhyJoinSection from '@/components/partner/WhyJoinSection';
import ApplicationForm from '@/components/partner/ApplicationForm';
import FAQSection from '@/components/partner/FAQSection';
import InfluencerShowcase from '@/components/partner/InfluencerShowcase';
import CTASection from '@/components/partner/CTASection';

export const metadata: Metadata = {
  title: 'Partner with Baithaka Ghar - Travel Influencer Program',
  description: 'Join our travel influencer program and earn money while promoting unique stays. Get trackable earnings, free accommodations, and transparent monthly payouts.',
  keywords: ['travel influencer', 'partnership program', 'affiliate marketing', 'travel collaboration', 'influencer earnings'],
  openGraph: {
    title: 'Partner with Baithaka Ghar - Travel Influencer Program',
    description: 'Earn money, grow your reach, and help others discover unique stays through our influencer partnership program.',
    type: 'website',
    images: [
      {
        url: '/images/influencer-program-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Baithaka Ghar Influencer Partnership Program'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Partner with Baithaka Ghar - Travel Influencer Program',
    description: 'Join our travel influencer program and start earning with transparent commission structure.',
  }
};

export default function PartnerWithUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Why Join Us Section */}
      <section id="benefits" className="py-16 lg:py-24">
        <WhyJoinSection />
      </section>
      
      {/* Influencer Showcase */}
      <section id="showcase" className="py-16 lg:py-24 bg-slate-50">
        <InfluencerShowcase />
      </section>
      
      {/* Application Form */}
      <section id="apply" className="py-16 lg:py-24">
        <ApplicationForm />
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="py-16 lg:py-24 bg-slate-50">
        <FAQSection />
      </section>
      
      {/* Final CTA */}
      <CTASection />
    </div>
  );
} 