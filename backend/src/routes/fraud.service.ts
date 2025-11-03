import { db, vendors, invoices } from '../db';
import { eq, and } from 'drizzle-orm';
import { ValidationService } from './validation.service';

interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
}

interface FraudAnalysisResult {
  riskScore: number;
  status: 'safe' | 'suspicious' | 'fraudulent';
  indicators: FraudIndicator[];
}

export class FraudDetectionService {
  private validationService: ValidationService;

  constructor() {
    this.validationService = new ValidationService();
  }

  /**
   * Main fraud analysis method
   */
  async analyzeInvoice(invoiceId: string): Promise<FraudAnalysisResult> {
    const indicators: FraudIndicator[] = [];
    let riskScore = 0;

    
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    console.log(' Running fraud checks...');

    // Run all fraud checks
    const checks = await Promise.all([
      this.checkVendorWhitelist(invoice),
      this.checkIBANValidity(invoice),
      this.checkVATValidity(invoice),
      this.checkEmailValidity(invoice),
      this.checkDuplicateInvoice(invoice),
      this.checkAmountAnomaly(invoice),
    ]);

    // Flatten all indicators
    checks.forEach(checkIndicators => {
      indicators.push(...checkIndicators);
    });

    // Calculate risk score based on severity
    const severityWeights = {
      low: 10,
      medium: 20,
      high: 35,
      critical: 50,
    };

    riskScore = indicators.reduce((score, indicator) => {
      return score + severityWeights[indicator.severity];
    }, 0);

    // Cap at 100
    riskScore = Math.min(riskScore, 100);

    // Determine status
    let status: 'safe' | 'suspicious' | 'fraudulent';
    if (riskScore >= 70) {
      status = 'fraudulent';
    } else if (riskScore >= 30) {
      status = 'suspicious';
    } else {
      status = 'safe';
    }

    console.log(` Analysis complete: ${status.toUpperCase()} (Risk: ${riskScore})`);

    return { riskScore, status, indicators };
  }

  /**
   * Check if vendor is in whitelist
   */
  private async checkVendorWhitelist(invoice: any): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!invoice.vendorVat) {
      indicators.push({
        type: 'missing_vat',
        severity: 'medium',
        message: 'VAT number not found in invoice',
      });
      return indicators;
    }

    // Look for vendor in whitelist by VAT
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.companyId, invoice.companyId),
          eq(vendors.vatNumber, invoice.vendorVat)
        )
      );

    if (!vendor) {
      indicators.push({
        type: 'unknown_vendor',
        severity: 'high',
        message: 'Vendor not in trusted whitelist',
        details: { vendorVat: invoice.vendorVat },
      });
      return indicators;
    }

    // Vendor found - check if IBAN matches
    if (vendor.iban && invoice.vendorIban) {
      const cleanVendorIBAN = vendor.iban.replace(/\s/g, '').toUpperCase();
      const cleanInvoiceIBAN = invoice.vendorIban.replace(/\s/g, '').toUpperCase();

      if (cleanVendorIBAN !== cleanInvoiceIBAN) {
        indicators.push({
          type: 'iban_mismatch',
          severity: 'critical',
          message: 'IBAN does not match trusted vendor',
          details: {
            expected: vendor.iban,
            received: invoice.vendorIban,
          },
        });
      }
    }

    // Check if email matches
    if (vendor.email && invoice.vendorEmail) {
      if (vendor.email.toLowerCase() !== invoice.vendorEmail.toLowerCase()) {
        indicators.push({
          type: 'email_mismatch',
          severity: 'high',
          message: 'Email does not match trusted vendor',
          details: {
            expected: vendor.email,
            received: invoice.vendorEmail,
          },
        });
      }
    }

    return indicators;
  }

  /**
   * Validate IBAN format
   */
  private async checkIBANValidity(invoice: any): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!invoice.vendorIban) {
      indicators.push({
        type: 'missing_iban',
        severity: 'medium',
        message: 'IBAN not found in invoice',
      });
      return indicators;
    }

    const validation = this.validationService.validateIBAN(invoice.vendorIban);

    if (!validation.isValid) {
      indicators.push({
        type: 'invalid_iban',
        severity: 'high',
        message: validation.message || 'Invalid IBAN format',
        details: { iban: invoice.vendorIban },
      });
    }

    return indicators;
  }

  /**
   * Validate VAT number format
   */
  private async checkVATValidity(invoice: any): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!invoice.vendorVat) {
      return indicators; // Already flagged in whitelist check
    }

    const validation = this.validationService.validateVAT(invoice.vendorVat);

    if (!validation.isValid) {
      indicators.push({
        type: 'invalid_vat',
        severity: 'medium',
        message: validation.message || 'Invalid VAT number format',
        details: { vat: invoice.vendorVat },
      });
    }

    return indicators;
  }

  /**
   * Validate email format
   */
  private async checkEmailValidity(invoice: any): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!invoice.vendorEmail) {
      return indicators;
    }

    const validation = this.validationService.validateEmail(invoice.vendorEmail);

    if (!validation.isValid) {
      indicators.push({
        type: 'invalid_email',
        severity: 'low',
        message: validation.message || 'Invalid email format',
      });
    }

    return indicators;
  }

  /**
   * Check for duplicate invoice numbers
   */
  private async checkDuplicateInvoice(invoice: any): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!invoice.invoiceNumber) {
      return indicators;
    }

    // Look for other invoices with same number
    const duplicates = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, invoice.companyId),
          eq(invoices.invoiceNumber, invoice.invoiceNumber)
        )
      );

    // Exclude current invoice
    const otherDuplicates = duplicates.filter(inv => inv.id !== invoice.id);

    if (otherDuplicates.length > 0) {
      indicators.push({
        type: 'duplicate_invoice',
        severity: 'critical',
        message: 'Invoice number already exists',
        details: {
          duplicateCount: otherDuplicates.length,
          invoiceNumber: invoice.invoiceNumber,
        },
      });
    }

    return indicators;
  }

  /**
   * Check if amount is unusually high
   */
  private async checkAmountAnomaly(invoice: any): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!invoice.totalAmount) {
      return indicators;
    }

    const amount = parseFloat(invoice.totalAmount);

    // Get historical average for this vendor
    const historicalInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, invoice.companyId),
          eq(invoices.vendorVat, invoice.vendorVat)
        )
      );

    const validAmounts = historicalInvoices
      .filter(inv => inv.totalAmount && inv.id !== invoice.id)
      .map(inv => parseFloat(inv.totalAmount!));

    const average = validAmounts.length > 0
      ? validAmounts.reduce((a, b) => a + b, 0) / validAmounts.length
      : undefined;

    const isSuspicious = this.validationService.isAmountSuspicious(amount, average);

    if (isSuspicious) {
      indicators.push({
        type: 'amount_anomaly',
        severity: 'medium',
        message: 'Amount is unusually high',
        details: {
          amount,
          average,
          currency: invoice.currency,
        },
      });
    }

    return indicators;
  }
}