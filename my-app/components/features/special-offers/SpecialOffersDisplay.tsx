"use client"

import { useEffect, useState } from 'react';
import { SpecialOfferCard, SpecialOfferCardProps } from './SpecialOfferCard';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react'; // Added missing import
import { Button } from '@/components/ui/button'; // Added missing import

export function SpecialOffersDisplay() {
  const [offers, setOffers] = useState<SpecialOfferCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/special-offers');
        const data = await response.json();
        if (data.success) {
          setOffers(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch special offers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
        const scrollAmount = direction === 'left' ? -300 : 300;
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };


  if (loading) {
    return (
        <div className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
                    <div className="flex space-x-4">
                        <div className="h-80 w-80 bg-gray-300 rounded-xl"></div>
                        <div className="h-80 w-80 bg-gray-300 rounded-xl"></div>
                        <div className="h-80 w-80 bg-gray-300 rounded-xl"></div>
                    </div>
                </div>
            </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return null; // Don't render the section if there are no offers
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Special Offers</h2>
                <p className="text-lg text-gray-500 mt-1">Don't miss out on our exclusive deals!</p>
            </div>
            <div className="hidden md:flex space-x-2">
                <Button variant="outline" size="icon" onClick={() => scroll('left')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => scroll('right')}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <motion.div
          ref={scrollContainerRef}
          className="flex space-x-6 overflow-x-auto pb-4 -mb-4 scrollbar-hide"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {offers.map((offer) => (
            <div key={offer.title} className="flex-shrink-0">
                <SpecialOfferCard {...offer} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
} 