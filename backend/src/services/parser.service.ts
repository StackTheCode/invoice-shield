// parser.service
interface ParsedInvoiceData {
  vendorName?: string;
  vatNumber?: string;
  iban?: string;
  email?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  currency?: string;
  invoiceDate?: Date;
  dueDate?: Date;
}

export class ParserService {

  parse(text: string): ParsedInvoiceData {
    return {
      vendorName: this.extractVendorName(text),
      vatNumber: this.extractVAT(text),
      iban: this.extractIBAN(text),
      email: this.extractEmail(text),
      invoiceNumber: this.extractInvoiceNumber(text),
      totalAmount: this.extractAmount(text),
      currency: this.extractCurrency(text),
      invoiceDate: this.extractInvoiceDate(text),
      dueDate: this.extractDueDate(text)

    }
  }


  private extractVendorName(text: string): string | undefined {

    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const vendorLine = lines.find(line => line.length > 3 && line.length < 100);
    return vendorLine?.trim();

  }
  /**
   * Extract VAT number (EU format)
   */
  private extractVAT(text: string): string | undefined {
    const patterns = [
      // VAT with label (VAT, VAT No, VAT Number, VAT ID, etc.)
      /(?:VAT|BTW|TVA|Tax|VAT\s*No|VAT\s*Number|VAT\s*ID)\.?[:\s#]*([A-Z]{2}[0-9A-Z]{8,12})/i,
      // Just "VAT" followed by number(your issue)
      /\bVAT\s*[:.] ?\s*([A-Z]{2}[0-9A-Z]{8,12})/i,

      // UK VAT format (GB followed by 9 or 12 digits)
      /\b(GB[0-9]{9}(?:[0-9]{3})?)\b/i,

      // VAT with spaces (IE 8256796U)
      /(?:VAT|BTW|TVA)[:\s]+([A-Z]{2}\s?[0-9]{7,10}\s?[A-Z]?)/i,


      // Generic EU VAT format
      /\b([A-Z]{2}[0-9A-Z][0-9A-Z\s\-\.]{5,12})\b/,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {

        let vat = match[1].replace(/\s/g, '').toUpperCase();
        if (this.isValidVATFormat(vat)) {
          return vat;
        }

      }
    }
    return undefined;
  }



  private isValidVATFormat(vat: string): boolean {

    // UK VAT: GB followed by 9 or 12 digits
    if (/^GB[0-9]{9}(?:[0-9]{3})?$/.test(vat)) {
      return true;
    }

    // EU VAT: 2 letters + 8-12 alphanumeric
    if (/^[A-Z]{2}[0-9A-Z]{8,12}$/.test(vat)) {
      const countryCode = vat.substring(0, 2);

      const validCountries = [
        // EU
        'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
        'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
        'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
        // UK (post-Brexit but still uses VAT)
        'GB', 'XI', // XI is Northern Ireland
      ];
      return validCountries.includes(countryCode)
    }

    return false;
  }





  private extractIBAN(text: string): string | undefined {
    const pattern = /\b([A-Z]{2}[0-9]{2}[A-Z0-9]{1,30})\b/g;
    const matches = text.match(pattern);
    if (matches) {
      return matches.sort((a, b) => b.length - a.length)[0].replace(/\s/g, '');

    }
    return undefined
  }

  private extractEmail(text: string): string | undefined {
    const pattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(pattern);
    return match ? match[0] : undefined;
  }

  private extractInvoiceNumber(text: string): string | undefined {
    const patterns = [
      /(?:Invoice|Facture|Rechnung|Bill)\s*(?:No|Number|#|Nr)[:\s]*([A-Z0-9\-\/]+)/i,
      /(?:INV|FAC|REC)[:\-\s]*([0-9]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  private extractAmount(text: string): number | undefined {
    const patterns = [
      /(?:Total|Amount|Sum|Grand\s*Total)[:\s]*[€$£]?\s*([0-9,.]+)/i,
      /[€$£]\s*([0-9,.]+)/g,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const numStr = match[1].replace(/,/g, '');
        const amount = parseFloat(numStr);
        if (!isNaN(amount)) {
          return amount;
        }
      }
    }
    return undefined;
  }

  private extractCurrency(text: string): string {
    if (text.includes('€') || /EUR/i.test(text)) return 'EUR'
    if (text.includes('$') || /USD/i.test(text)) return 'USD'
    if (text.includes('£') || /GBP/i.test(text)) return 'GBP';
    return 'EUR' //Default

  }

  private extractInvoiceDate(text: string): Date | undefined {
    const patterns = [
      /(?:Invoice\s*Date|Date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const date = new Date(match[1])
        if (!isNaN(date.getTime())) {
          return date
        }

      }
    }
    return undefined
  }

  private extractDueDate(text: string): Date | undefined {
    const pattern = /(?:Due\s*Date|Payment\s*Due)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;
    const match = text.match(pattern)

    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) {
        return date;
      }
      return undefined;
    }
  }












}