import { db, vendors, invoices } from '../db';
import { eq, and } from 'drizzle-orm';
import { ValidationService } from './validation.service';
import { ExternalVerificationService } from './external-verififcation.service';
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
  private externalVerification: ExternalVerificationService;

  constructor() {
    this.externalVerification = new ExternalVerificationService()
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
      this.checkWellKnownCompany(invoice),
      this.verifyVATWithEU(invoice),
      this.checkIBANCountryMatch(invoice)

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

    if (!invoice.vendorVat && !invoice.vendorName) {
      indicators.push({
        type: 'missing_vendor_info',
        severity: 'medium',
        message: 'Vendor information is incomplete',
      });
      return indicators;
    }

    // Try to find vendor by VAT number (most reliable)
    if (invoice.vendorVat) {
      const [vendorByVAT] = await db
        .select()
        .from(vendors)
        .where(
          and(
            eq(vendors.companyId, invoice.companyId),
            eq(vendors.vatNumber, invoice.vendorVat)
          )
        );

      if (vendorByVAT) {
        // Found by VAT - check IBAN and email
        return this.checkVendorDetails(invoice, vendorByVAT);
      }
    }

    // Try to find by name (fuzzy match)
    if (invoice.vendorName) {
      const allVendors = await db
        .select()
        .from(vendors)
        .where(eq(vendors.companyId, invoice.companyId));

      // Check for partial name match
      const invoiceNameLower = invoice.vendorName.toLowerCase();
      const matchedVendor = allVendors.find(v => {
        const vendorNameLower = v.name.toLowerCase();
        // Check if names overlap significantly
        return (
          invoiceNameLower.includes(vendorNameLower) ||
          vendorNameLower.includes(invoiceNameLower) ||
          this.calculateSimilarity(invoiceNameLower, vendorNameLower) > 0.7
        );
      });

      if (matchedVendor) {
        return this.checkVendorDetails(invoice, matchedVendor);
      }
    }

    // Not found in whitelist
    indicators.push({
      type: 'unknown_vendor',
      severity: 'high',
      message: 'Vendor not in trusted whitelist',
      details: {
        vendorName: invoice.vendorName,
        vendorVat: invoice.vendorVat
      },
    });

    return indicators;
  }


  private checkVendorDetails(invoice: any, vendor: any): FraudIndicator[] {
    const indicators: FraudIndicator[] = [];

    // Check IBAN match
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

    // Check email match
    if (vendor.email && invoice.vendorEmail) {
      const vendorEmailLower = vendor.email.toLowerCase();
      const invoiceEmailLower = invoice.vendorEmail.toLowerCase();

      if (vendorEmailLower !== invoiceEmailLower) {
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
   * Helper: Calculate string similarity (Levenshtein-like)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Helper: Levenshtein distance for string comparison
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
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
 * Check IBAN country matches VAT country
 */
  private async checkIBANCountryMatch(invoice: any): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!invoice.vendorIban || !invoice.vendorVat) {
      return indicators;
    }

    const ibanCountry = invoice.vendorIban.substring(0, 2);
    const vatCountry = invoice.vendorVat.substring(0, 2);

    // Allow some exceptions (e.g., IE companies often use UK IBANs)
    const allowedMismatches = [
      ['IE', 'GB'], // Irish companies with UK banks
      ['BE', 'NL'], // Belgian companies with Dutch banks
    ];

    const isAllowedMismatch = allowedMismatches.some(
      ([country1, country2]) =>
        (ibanCountry === country1 && vatCountry === country2) ||
        (ibanCountry === country2 && vatCountry === country1)
    );

    if (ibanCountry !== vatCountry && !isAllowedMismatch) {
      indicators.push({
        type: 'iban_country_mismatch',
        severity: 'medium',
        message: `IBAN country (${ibanCountry}) doesn't match VAT country (${vatCountry})`,
        details: {
          ibanCountry,
          vatCountry,
        },
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

  /**
 * Check if company is a well-known corporation
 */
  private async checkWellKnownCompany(invoice: any): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!invoice.vendorName) {
      return indicators;
    }

    const { isKnown, matchedName } = this.externalVerification.isWellKnownCompany(
      invoice.vendorName
    );

    if (isKnown) {
      // Check if they're in whitelist (by VAT or name)
      let vendorFound = false;

      if (invoice.vendorVat) {
        const [vendorByVAT] = await db
          .select()
          .from(vendors)
          .where(
            and(
              eq(vendors.companyId, invoice.companyId),
              eq(vendors.vatNumber, invoice.vendorVat)
            )
          );

        if (vendorByVAT) vendorFound = true;
      }

      if (!vendorFound) {
        // Check by name (fuzzy)
        const allVendors = await db
          .select()
          .from(vendors)
          .where(eq(vendors.companyId, invoice.companyId));

        const nameMatch = allVendors.find(v =>
          v.name.toLowerCase().includes(matchedName!) ||
          matchedName!.includes(v.name.toLowerCase())
        );

        if (nameMatch) vendorFound = true;
      }

      if (!vendorFound) {
        indicators.push({
          type: 'well_known_company_not_whitelisted',
          severity: 'medium',  // Changed from 'high' to 'medium'
          message: `Invoice claims to be from ${matchedName}, but they're not in your trusted vendors`,
          details: {
            claimedCompany: matchedName,
            suggestion: 'Add this vendor to whitelist if legitimate',
          },
        });
      }
    }

    return indicators;
  }



  async verifyVATWithEU(invoice: any): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];
    if (!invoice.vendorVat) {
      return indicators
    }

    const countryCode = invoice.vendorVat.substring(0, 2)
    const euCountries = [
      'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
      'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
      'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
    ]

    if (!euCountries.includes(countryCode)) {
      return indicators; // Not EU, skip
    }


    try {
      const result = await this.externalVerification.verifyEUVAT(invoice.vendorVat);

      if (!result.isValid) {

        indicators.push({
          type: 'vat_not_registered',
          severity: 'critical',
          message: 'VAT number not registered in EU VIES database',
          details: {
            vatNumber: invoice.vendorVat,
            error: result.error,
          },
        },
        )

      } else if (result.companyName) {
        const invoiceName = invoice.vendorName?.toLowerCase() || '';
        const officialName = result.companyName.toLowerCase();

        if (!invoiceName.includes(officialName.split(' ')[0])) {
          indicators.push({
            type: "company_name_mismatch",
            severity: 'high',
            message: "Company doesn't have VAT registration",
            details: {
              invoiceName: invoice.vendorName,
              registeredName: result.companyName,
            }
          })
        }


      }

    } catch (error) {
      console.warn('VAT verification failed:', error);

    }

    return indicators
  }


}