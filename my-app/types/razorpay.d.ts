declare module 'razorpay' {
  export interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  export interface OrderOptions {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
    payment_capture?: boolean;
  }

  export interface Order {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
  }

  export interface Payment {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: string;
    order_id: string;
    invoice_id: string;
    international: boolean;
    method: string;
    amount_refunded: number;
    refund_status: string;
    captured: boolean;
    description: string;
    card_id: string;
    bank: string;
    wallet: string;
    vpa: string;
    email: string;
    contact: string;
    notes: Record<string, string>;
    fee: number;
    tax: number;
    error_code: string;
    error_description: string;
    created_at: number;
  }

  export interface Refund {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    payment_id: string;
    notes: Record<string, string>;
    receipt: string;
    acquirer_data: Record<string, string>;
    created_at: number;
    batch_id: string;
    status: string;
    speed_processed: string;
    speed_requested: string;
  }

  export interface OrdersAPI {
    create(options: OrderOptions): Promise<Order>;
    fetch(orderId: string): Promise<Order>;
    all(options?: Record<string, any>): Promise<Order[]>;
  }

  export interface PaymentsAPI {
    fetch(paymentId: string): Promise<Payment>;
    all(options?: Record<string, any>): Promise<Payment[]>;
    capture(paymentId: string, amount: number): Promise<Payment>;
    refund(paymentId: string, options?: { amount?: number; notes?: Record<string, string> }): Promise<Refund>;
  }

  export interface RefundsAPI {
    fetch(refundId: string): Promise<Refund>;
    all(options?: Record<string, any>): Promise<Refund[]>;
  }

  export default class Razorpay {
    constructor(options: RazorpayOptions);
    orders: OrdersAPI;
    payments: PaymentsAPI;
    refunds: RefundsAPI;
  }
}

// Fix for the client-side utils
declare module 'razorpay/dist/utils/razorpayUtils' {
  export function loadScript(src: string): Promise<boolean>;
} 