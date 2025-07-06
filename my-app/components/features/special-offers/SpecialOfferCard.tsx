"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

export interface SpecialOfferCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  label?: string;
  tag?: string;
  validUntil: Date | string;
  imageUrl: string;
  isLivePreview?: boolean;
}

export function SpecialOfferCard({
  title,
  subtitle,
  label,
  tag,
  validUntil,
  imageUrl,
  isLivePreview = false,
}: SpecialOfferCardProps) {
  
  const daysRemaining = differenceInDays(new Date(validUntil), new Date());
  const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 5;
  const hasExpired = daysRemaining < 0;

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { scale: 1.03, transition: { duration: 0.2 } },
  };

  const cardMarkup = (
    <Card className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg border group">
      <CardHeader className="p-0 relative">
        <div className="aspect-video overflow-hidden">
          <Image
            src={imageUrl || "https://placehold.co/600x400?text=Offer+Image"}
            alt={title || "Special Offer"}
            width={600}
            height={400}
            className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            {label && <Badge className="text-sm py-1 px-3 bg-red-600 text-white border-red-600">{label}</Badge>}
            {tag && <Badge className="text-sm py-1 px-3" variant="secondary">{tag}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="p-4 bg-white">
        <CardTitle className="text-xl font-bold text-gray-800 line-clamp-1">{title || "Offer Title"}</CardTitle>
        {subtitle && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{subtitle}</p>}
      </CardContent>
      <CardFooter className="p-4 bg-gray-50/50 flex justify-between items-center">
        <div>
          {!hasExpired ? (
            <>
              <p className="text-xs text-gray-500">Valid Until</p>
              <p className="font-semibold text-gray-700">{format(new Date(validUntil), 'dd MMM yyyy')}</p>
            </>
          ) : (
             <p className="font-semibold text-red-500">Offer Expired</p>
          )}
          {isExpiringSoon && !hasExpired && <p className="text-xs text-orange-500 font-medium animate-pulse">Expiring Soon!</p>}
        </div>
        {!hasExpired && (
            <Button size="sm" className="bg-darkGreen hover:bg-darkGreen/90">View Deal</Button>
        )}
      </CardFooter>
    </Card>
  );

  if (isLivePreview) {
    return cardMarkup;
  }

  return (
    <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
    >
        {cardMarkup}
    </motion.div>
  )
} 