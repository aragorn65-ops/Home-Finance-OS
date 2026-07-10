export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface PaymentBreakdown {
  category: string;
  amount: number;
}

export interface Settlement {
  id: string;
  fromMember: string;
  toMember: string;
  amount: number;
  date: string;
  notes?: string;
  receiptUrl?: string;
  paymentBreakdown: PaymentBreakdown[];
}