// validation service
export class ValidationService {

    /**
      * Validate IBAN format (basic check)
   * Real IBAN validation requires country-specific rules
     */
    validateIBAN(iban: string): { isValid: boolean; message?: string } {
        if (!iban) {
            return { isValid: false, message: "IBAN is missing" }
        }
        const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

        const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;

        if (!ibanRegex.test(cleanIBAN)) {
            return { isValid: false, message: 'Invalid IBAN format' };

        }
        if (cleanIBAN.length < 15 || cleanIBAN.length > 34) {
            return { isValid: false, message: 'IBAN length is incorrect.Should be in range of 15 and 34' };
        }
        return { isValid: true }
    }

    /**
  * Validate VAT number format (EU format)
  */
    validateVAT(vat: string): { isValid: boolean, message?: string } {
        if (!vat) {
            return { isValid: false, message: 'VAT number is missing' };
        }
        // Remove spaces and convert to uppercase
        const cleanVAT = vat.replace(/\s/g, '').toUpperCase();



        if (cleanVAT.startsWith('GB') || cleanVAT.startsWith('XI')) {
            const ukVatRegex = /^(GB|XI)[0-9]{9}(?:[0-9]{3})?$/;

            if (!ukVatRegex.test(cleanVAT)) {
                return { isValid: false, message: 'Invalid UK VAT format (should be GB + 9 or 12 digits)' };
            }
            return { isValid: true };
        }






        // EU VAT format: 2 letter country code + 8-12 alphanumeric
        const vatRegex = /^[A-Z]{2}[0-9A-Z]{8,12}$/;

        if (!vatRegex.test(cleanVAT)) {
            return { isValid: false, message: 'Invalid VAT number format' };
        }

        if (cleanVAT.length < 10 || cleanVAT.length > 14) {
            return { isValid: false, message: 'VAT number length is incorrect' };

        }

        const countryCode = cleanVAT.substring(0, 2);
        const validCountries = [
            'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
            'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV',
            'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'XI'
        ];
        if (!validCountries.includes(countryCode)) {
            return { isValid: false, message: `Unknown country code: ${countryCode}` };
        }

        return { isValid: true };
    }




    /**
   * Validate email format
   */
    validateEmail(email: string): { isValid: boolean, message?: string } {
        if (!email) {
            return { isValid: false, message: 'Email is missing' }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, message: 'Invalid email format' };

        }
        return { isValid: true }
    }
    /**
     * Check if amount is suspiciously high (simple anomaly detection)
     */
    isAmountSuspicious(amount: number, historicalAverage?: number): boolean {
        // If no history, flag amounts over €10,000 as suspicious
        if (!historicalAverage) {
            return amount > 10000;
        }

        // Flag if amount is 3x higher than average
        return amount > (historicalAverage * 3);
    }
}