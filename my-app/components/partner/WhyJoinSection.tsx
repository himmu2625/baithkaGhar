'use client';

import { TrendingUp, Home, Award, Globe, Lock, Briefcase, Camera, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Trackable Earnings',
    description: 'Monitor your performance with real-time analytics. Track clicks, conversions, and earnings through our comprehensive dashboard.',
    color: 'from-darkGreen to-teal-600'
  },
  {
    icon: Home,
    title: 'Free Stays at Curated Properties',
    description: 'Experience our unique properties first-hand with complimentary stays for content creation and authentic reviews.',
    color: 'from-darkGreen to-teal-600'
  },
  {
    icon: Award,
    title: 'Official Brand Partner Badge',
    description: 'Showcase your partnership with exclusive badges and certificates to enhance your credibility and brand value.',
    color: 'from-darkGreen to-teal-600'
  },
  {
    icon: Globe,
    title: 'Featured on Social Media',
    description: 'Get featured on our official social media channels and website, expanding your reach to our growing audience.',
    color: 'from-darkGreen to-teal-600'
  },
  {
    icon: Lock,
    title: 'Transparent Monthly Payouts',
    description: 'Receive guaranteed monthly payments with complete transparency. No hidden fees, no delays, just honest earnings.',
    color: 'from-darkGreen to-teal-600'
  },
  {
    icon: Briefcase,
    title: 'Barter & Paid Collaborations',
    description: 'Choose from multiple collaboration types - affiliate commissions, paid partnerships, or barter arrangements.',
    color: 'from-darkGreen to-teal-600'
  },
  {
    icon: Camera,
    title: 'Content Creation Support',
    description: 'Access to professional photography, content guidelines, and creative briefs to enhance your content quality.',
    color: 'from-darkGreen to-teal-600'
  },
  {
    icon: UserCheck,
    title: 'Dedicated Account Manager',
    description: 'Get personalized support from our partnership team to maximize your earnings and resolve any queries quickly.',
    color: 'from-darkGreen to-teal-600'
  }
];

const WhyJoinSection = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
          Why Join Our{' '}
          <span className="text-darkGreen">
            Partnership Program?
          </span>
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          We believe in empowering creators with the best tools, support, and opportunities 
          to build a sustainable income while promoting authentic travel experiences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {benefits.map((benefit, index) => {
          const IconComponent = benefit.icon;
          return (
            <Card
              key={index}
              className="group p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm"
            >
              <div className="space-y-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${benefit.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-darkGreen transition-colors">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>

              {/* Hover effect border */}
              <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${benefit.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            </Card>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-16">
        <div className="bg-gradient-to-r from-gray-50 to-teal-50 rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Earning?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of creators who are already earning through our platform. 
            No upfront costs, no hidden fees - just pure earning potential.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Average approval time: 24-48 hours
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-darkGreen rounded-full"></div>
              No minimum follower requirement
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              Multiple earning opportunities
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyJoinSection; 