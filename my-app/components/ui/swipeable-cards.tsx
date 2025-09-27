"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SwipeableCard {
  id: string;
  title: string;
  content: React.ReactNode;
  image?: string;
  badge?: string;
  className?: string;
}

interface SwipeableCardsProps {
  cards: SwipeableCard[];
  className?: string;
  autoPlay?: boolean;
  autoPlayDelay?: number;
  showNavigation?: boolean;
  showPagination?: boolean;
  cardWidth?: string;
  gap?: string;
}

export function SwipeableCards({
  cards,
  className = '',
  autoPlay = false,
  autoPlayDelay = 5000,
  showNavigation = true,
  showPagination = true,
  cardWidth = '300px',
  gap = '1rem',
}: SwipeableCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const dragX = useTransform(x, (value) => value);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const goToCard = (index: number) => {
    setCurrentIndex(index);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      prevCard();
    } else if (info.offset.x < -threshold) {
      nextCard();
    }
    x.set(0);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isDragging) return;

    const interval = setInterval(nextCard, autoPlayDelay);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayDelay, isDragging]);

  // Touch/Mouse events for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) nextCard();
    if (isRightSwipe) prevCard();
  };

  return (
    <div className={cn("relative w-full max-w-7xl mx-auto", className)}>
      {/* Navigation Buttons */}
      {showNavigation && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={prevCard}
            className="absolute left-2 top-1/2 z-10 transform -translate-y-1/2 rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextCard}
            className="absolute right-2 top-1/2 z-10 transform -translate-y-1/2 rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Cards Container */}
      <div 
        className="overflow-hidden rounded-2xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <motion.div
          ref={containerRef}
          className="flex"
          style={{ gap }}
          animate={{ x: `calc(-${currentIndex * 100}% - ${currentIndex} * ${gap})` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className="flex-shrink-0"
              style={{ width: cardWidth }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className={cn(
                "h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm",
                card.className
              )}>
                {card.image && (
                  <div className="relative h-48 overflow-hidden rounded-t-xl">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {card.badge && (
                      <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {card.badge}
                      </div>
                    )}
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {card.content}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Pagination Dots */}
      {showPagination && (
        <div className="flex justify-center space-x-2 mt-6">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => goToCard(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "bg-blue-500 w-8"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1 mt-4">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

// Mobile-optimized card grid
export function MobileCardGrid({
  cards,
  className = '',
  columns = { sm: 1, md: 2, lg: 3 },
}: {
  cards: SwipeableCard[];
  className?: string;
  columns?: { sm: number; md: number; lg: number };
}) {
  return (
    <div className={cn(
      "grid gap-6",
      `grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg}`,
      className
    )}>
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <Card className={cn(
            "h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm",
            card.className
          )}>
            {card.image && (
              <div className="relative h-48 overflow-hidden rounded-t-xl">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
                {card.badge && (
                  <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {card.badge}
                  </div>
                )}
              </div>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {card.content}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Carousel with thumbnails
export function ThumbnailCarousel({
  cards,
  className = '',
}: {
  cards: SwipeableCard[];
  className?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            {cards[selectedIndex]?.image && (
              <div className="relative h-64 md:h-80 overflow-hidden rounded-t-xl">
                <Image
                  src={cards[selectedIndex].image}
                  alt={cards[selectedIndex].title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                {cards[selectedIndex]?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cards[selectedIndex]?.content}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Thumbnails */}
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300",
              selectedIndex === index
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {card.image ? (
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs font-medium text-center">
                  {card.title.slice(0, 2)}
                </span>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}