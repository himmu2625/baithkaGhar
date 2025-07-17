"use client";

import { useState } from "react";
import { Phone, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface PhonePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const phoneNumbers = [
  {
    label: "Customer Support",
    number: "+91 9356547176",
    description: "24/7 Customer Support"
  },
  {
    label: "Booking Hotline",
    number: "+91 9936712614",
    description: "Quick Booking Assistance"
  },
  {
    label: "Emergency Support",
    number: "+91 9356547176",
    description: "Emergency & Urgent Issues"
  },
  {
    label: "WhatsApp Support",
    number: "+91 9356547176",
    description: "Chat with us on WhatsApp"
  }
];

export default function PhonePopup({ isOpen, onClose }: PhonePopupProps) {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const handleCopy = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2000);
    } catch (err) {
      console.error("Failed to copy number:", err);
    }
  };

  const handleWhatsApp = (number: string) => {
    const message = "Hello! I need assistance with booking.";
    const whatsappUrl = `https://wa.me/${number.replace(/\s/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white dark:bg-darkGreen rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-lightGreen/20">
                              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-lightGreen" />
                <h3 className="text-lg font-semibold text-darkGreen dark:text-lightYellow">
                  Book Now
                </h3>
              </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-lightYellow/70 dark:hover:text-lightYellow"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                              <p className="text-sm text-gray-600 dark:text-lightYellow/80 mb-4">
                Get instant assistance for your booking. Choose your preferred contact method:
              </p>
                
                {phoneNumbers.map((phone, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-darkGreen/50 dark:to-darkGreen/30 rounded-xl p-4 border border-gray-200 dark:border-lightGreen/20 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-darkGreen dark:text-lightYellow text-sm">
                            {phone.label}
                          </h4>
                          {phone.label.includes("WhatsApp") && (
                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-lightYellow/60">
                          {phone.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <span className="text-sm font-mono text-darkGreen dark:text-lightYellow bg-white dark:bg-darkGreen/20 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-lightGreen/20">
                          {phone.number}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Call Button */}
                        <Button
                          size="sm"
                          onClick={() => handleCall(phone.number)}
                          className="bg-lightGreen hover:bg-lightGreen/80 text-darkGreen text-xs h-8 px-3 font-medium shadow-sm"
                        >
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          Call Now
                        </Button>
                        
                        {/* Copy Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(phone.number)}
                          className="border-gray-300 dark:border-lightGreen/30 text-gray-700 dark:text-lightYellow text-xs h-8 px-3 font-medium shadow-sm"
                        >
                          {copiedNumber === phone.number ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        
                        {/* WhatsApp Button (only for WhatsApp number) */}
                        {phone.label.includes("WhatsApp") && (
                          <Button
                            size="sm"
                            onClick={() => handleWhatsApp(phone.number)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs h-8 px-3 font-medium shadow-sm"
                          >
                            <svg className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            WhatsApp
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-lightGreen/20 bg-gray-50 dark:bg-darkGreen/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Online Now
                  </p>
                </div>
                <p className="text-xs text-gray-600 dark:text-lightYellow/60 text-center">
                  Available 24/7 for instant booking assistance
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 