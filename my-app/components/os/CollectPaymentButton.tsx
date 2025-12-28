"use client";

import { useState } from 'react';
import PaymentCollectionModal from './PaymentCollectionModal';
import { Button } from '@/components/ui/button';
import { Banknote } from 'lucide-react';

interface CollectPaymentButtonProps {
  bookingId: string;
  amount: number;
  guestName: string;
  propertyTitle?: string;
  checkInDate?: string;
  totalAmount?: number;
}

export default function CollectPaymentButton({
  bookingId,
  amount,
  guestName,
  propertyTitle = 'Property',
  checkInDate = new Date().toISOString(),
  totalAmount
}: CollectPaymentButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="w-full"
        size="lg"
      >
        <Banknote className="w-5 h-5 mr-2" />
        Collect Payment
      </Button>

      <PaymentCollectionModal
        open={showModal}
        onOpenChange={setShowModal}
        booking={{
          _id: bookingId,
          guestName,
          propertyTitle,
          checkInDate,
          amountDue: amount,
          totalAmount: totalAmount || amount,
        }}
      />
    </>
  );
}
