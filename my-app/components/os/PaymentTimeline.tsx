"use client";

import { CreditCard, Banknote, CheckCircle, Clock } from 'lucide-react';

interface PaymentEvent {
  type: 'online' | 'hotel';
  amount: number;
  status: string;
  date: string;
  method: string;
  collectedBy: string;
  notes?: string;
}

interface PaymentTimelineProps {
  paymentHistory: PaymentEvent[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export default function PaymentTimeline({ paymentHistory }: PaymentTimelineProps) {
  if (!paymentHistory || paymentHistory.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Payment History
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {paymentHistory.map((event, index) => {
            const isOnline = event.type === 'online';
            const isLast = index === paymentHistory.length - 1;

            return (
              <div key={index} className="relative">
                {/* Timeline Line */}
                {!isLast && (
                  <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isOnline
                        ? 'bg-indigo-100'
                        : event.status === 'collected'
                        ? 'bg-green-100'
                        : 'bg-orange-100'
                    }`}
                  >
                    {isOnline ? (
                      <CreditCard className={`w-5 h-5 text-indigo-600`} />
                    ) : event.status === 'collected' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Banknote className="w-5 h-5 text-orange-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {isOnline ? 'Online Payment' : 'Payment at Property'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDateTime(event.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(event.amount)}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                              event.status === 'completed' || event.status === 'collected'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {event.status === 'completed' || event.status === 'collected'
                              ? 'Completed'
                              : event.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Method:</span>
                          <span className="capitalize">{event.method}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Collected by:</span>
                          <span>{event.collectedBy}</span>
                        </div>
                        {event.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">Notes:</p>
                            <p className="text-sm text-gray-700 mt-1">{event.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
