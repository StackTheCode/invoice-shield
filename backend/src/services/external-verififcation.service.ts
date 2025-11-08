import axios from 'axios'

interface VATVerfication {
    isValid: boolean;
    companyName?: string;
    address?: string;
    countryCode?: string;
    error?: string;

}

interface CompanySearchResult {
    found: boolean;
    name?: string;
    registrationNumber?: string;
    address?: string;
}

export class ExternalVerificationService {
    async verifyEUVAT(vatNumber: string): Promise<VATVerfication> {
        try {
            const cleanVAT = vatNumber.replace(/\s/g, '').toUpperCase();
            const countryCode = cleanVAT.substring(0, 2)
            const vatNum = cleanVAT.substring(2);

            const response = await axios.get(
                `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${vatNum}`,
                { timeout: 5000 }
            );
            if (response.data.valid) {
                return {
                    isValid: true,
                    companyName: response.data.name,
                    address: response.data.address,
                    countryCode: response.data.countryCode,

                }

            } else {
                return {
                    isValid: false,
                    error: "VAT number not found in EU database"
                }
            }
        } catch (error) {
            console.error('VAT verification error:', error);
            return {
                isValid: false,
                error: 'Failed to verify VAT number (API unavailable)',
            };
        }
    }

    async searchCompanyByName(companyName: string, country?: string): Promise<CompanySearchResult> {
        try {
            const params: any = {
                q: companyName,
                per_page: 1
            }
            if (country) {
                params.jurisdiction_code = country.toLowerCase();
            }

            const response = await axios.get(
                "https://api.opencorporates.com/v0.4/companies/search",
                { params, timeout: 5000 }

            )

            if (response.data.results?.companies?.length > 0) {
                const company = response.data.results.companies[0].company;
                return {
                    found: true,
                    name: company.name,
                    registrationNumber: company.company_number,
                    address: company.registered_address_in_full
                }
            }
            return { found: false }
        } catch (error) {
            console.error('Company search error:', error);
            return {
                found: false,
            };
        }
    }

    validateIBANChecksum(iban: string): boolean {
        const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
        const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4);

        const numerical = rearranged.replace(/[A-Z]/g, (char) =>
            (char.charCodeAt(0) - 55).toString()
        )

        let remainder = numerical;
        while (remainder.length > 2) {
            const block = remainder.slice(0, 9)
            remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(block.length);

        }
        return parseInt(remainder, 10) % 97 === 1;

    }

    isWellKnownCompany(name:string):{isKnown:boolean; matchedName?:string}{
        const wellKnownCompanies = [
      // Tech giants
      'microsoft', 'apple', 'google', 'amazon', 'meta', 'facebook',
      'netflix', 'adobe', 'oracle', 'salesforce', 'ibm', 'intel',
      'cisco', 'nvidia', 'amd', 'dell', 'hp', 'lenovo',
      
      // Cloud providers
      'aws', 'amazon web services', 'azure', 'google cloud',
      
      // Payment processors
      'stripe', 'paypal', 'square', 'visa', 'mastercard',
      
      // Software/SaaS
      'slack', 'zoom', 'dropbox', 'atlassian', 'jira', 'github',
      'gitlab', 'docker', 'mongodb', 'redis', 'cloudflare',
      
      // Enterprise
      'sap', 'accenture', 'deloitte', 'pwc', 'kpmg', 'ey',
    ];
    const lowerName = name.toLowerCase();

    for (const known of wellKnownCompanies){
        if(lowerName.includes(known)){
            return {isKnown:true,matchedName:known}
        }
    }
        return { isKnown: false };

    }
}