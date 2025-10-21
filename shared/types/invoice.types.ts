export interface Invoice {
  id: string;
  companyId: string;
  vendorName?: string;
  vendorVat?: string;
  vendorIban?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  currency?: string;
  riskScore?: number;
  status: 'pending' | 'safe' | 'suspicious' | 'fraudulent';
  createdAt: string;
}

export interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}