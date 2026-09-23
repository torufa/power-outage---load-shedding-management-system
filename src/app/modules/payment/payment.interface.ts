export interface ICreatePaymentSession {
  amount: number;
  purpose: 'BILL_PAYMENT' | 'PRIORITY_RECONNECTION' | 'MAINTENANCE_FEE';
  invoiceOrTicketNumber?: string;
  currency?: string;
}

export interface IVerifyPayment {
  sessionId: string;
}
