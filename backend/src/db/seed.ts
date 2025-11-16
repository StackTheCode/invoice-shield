import { db, vendors, companies } from './index';
import { eq } from 'drizzle-orm';

const WELL_KNOWN_VENDORS = [
  // Tech Giants - Ireland
  { name: 'Microsoft Ireland Operations Limited', vatNumber: 'IE9692928L', iban: 'IE29AIBK93115212345678', email: 'invoices@microsoft.ie', country: 'IE' },
  { name: 'Google Ireland Limited', vatNumber: 'IE6388047V', iban: 'IE12BOFI90001712345678', email: 'emea-ar@google.com', country: 'IE' },
  { name: 'Apple Operations International', vatNumber: 'IE9700053D', iban: 'IE64IRCE92050112345678', email: 'invoices@apple.ie', country: 'IE' },
  { name: 'Meta Platforms Ireland Limited', vatNumber: 'IE4847981L', iban: 'IE89AIBK93115212345678', email: 'invoices@fb.com', country: 'IE' },
  { name: 'LinkedIn Ireland Unlimited Company', vatNumber: 'IE8224613J', iban: 'IE42BOFI90001712345678', email: 'billing@linkedin.com', country: 'IE' },
  
  // Netherlands
  { name: 'Booking.com B.V.', vatNumber: 'NL805734958B01', iban: 'NL91ABNA0417164300', email: 'invoices@booking.com', country: 'NL' },
  { name: 'Adyen N.V.', vatNumber: 'NL815622695B01', iban: 'NL20INGB0001234567', email: 'billing@adyen.com', country: 'NL' },
  { name: 'Spotify Netherlands B.V.', vatNumber: 'NL852472125B01', iban: 'NL86INGB0002445588', email: 'invoices@spotify.com', country: 'NL' },
  { name: 'TomTom International B.V.', vatNumber: 'NL003031051B01', iban: 'NL13ABNA0589462131', email: 'billing@tomtom.com', country: 'NL' },
  
  // Germany
  { name: 'SAP SE', vatNumber: 'DE812661238', iban: 'DE89370400440532013000', email: 'invoices@sap.com', country: 'DE' },
  { name: 'Siemens AG', vatNumber: 'DE129273398', iban: 'DE75512108001245126199', email: 'billing@siemens.com', country: 'DE' },
  { name: 'Deutsche Telekom AG', vatNumber: 'DE129276775', iban: 'DE02120300000000202051', email: 'invoices@telekom.de', country: 'DE' },
  { name: 'Zalando SE', vatNumber: 'DE260543043', iban: 'DE89370400440532013000', email: 'billing@zalando.de', country: 'DE' },
  { name: 'BMW AG', vatNumber: 'DE129273398', iban: 'DE44500700100175897600', email: 'invoices@bmw.de', country: 'DE' },
  
  // Luxembourg
  { name: 'Amazon EU S.à r.l.', vatNumber: 'LU26375245', iban: 'LU280019400644750000', email: 'invoices@amazon.lu', country: 'LU' },
  { name: 'PayPal Europe S.à r.l. et Cie, S.C.A.', vatNumber: 'LU21416127', iban: 'LU120010001234567891', email: 'billing@paypal.com', country: 'LU' },
  { name: 'Skype Communications S.à r.l.', vatNumber: 'LU20260743', iban: 'LU950020001234567891', email: 'invoices@skype.com', country: 'LU' },
  
  // France
  { name: 'Airbus SE', vatNumber: 'FR27383474814', iban: 'FR1420041010050500013M02606', email: 'invoices@airbus.com', country: 'FR' },
  { name: 'BNP Paribas SA', vatNumber: 'FR76662042449', iban: 'FR7630004000031234567890143', email: 'billing@bnpparibas.com', country: 'FR' },
  { name: 'Schneider Electric SE', vatNumber: 'FR49954503141', iban: 'FR1420041010050500013M02606', email: 'invoices@se.com', country: 'FR' },
  { name: 'TotalEnergies SE', vatNumber: 'FR92542065479', iban: 'FR7610278060990000012345678', email: 'invoices@totalenergies.com', country: 'FR' },
  
  // Sweden
  { name: 'Spotify AB', vatNumber: 'SE556703748501', iban: 'SE4550000000058398257466', email: 'invoices@spotify.com', country: 'SE' },
  { name: 'Telefonaktiebolaget LM Ericsson', vatNumber: 'SE556016077401', iban: 'SE3550000000054910000003', email: 'billing@ericsson.com', country: 'SE' },
  { name: 'Klarna Bank AB', vatNumber: 'SE556737046501', iban: 'SE7280000810340009783242', email: 'invoices@klarna.com', country: 'SE' },
  { name: 'Volvo Group', vatNumber: 'SE556012916201', iban: 'SE1550000000054838257466', email: 'invoices@volvo.com', country: 'SE' },
  
  // Belgium
  { name: 'Proximus SA', vatNumber: 'BE0202239951', iban: 'BE68539007547034', email: 'invoices@proximus.be', country: 'BE' },
  { name: 'Anheuser-Busch InBev SA/NV', vatNumber: 'BE0417497106', iban: 'BE71096123456769', email: 'billing@ab-inbev.com', country: 'BE' },
  
  // Spain
  { name: 'Telefónica S.A.', vatNumber: 'ESA82018474', iban: 'ES9121000418450200051332', email: 'invoices@telefonica.com', country: 'ES' },
  { name: 'Banco Santander S.A.', vatNumber: 'ESA39000013', iban: 'ES7921000813610123456789', email: 'billing@santander.com', country: 'ES' },
  { name: 'Inditex S.A.', vatNumber: 'ESA15000126', iban: 'ES1000492352082414205416', email: 'invoices@inditex.com', country: 'ES' },
  
  // Italy
  { name: 'Ferrari S.p.A.', vatNumber: 'IT00159560366', iban: 'IT60X0542811101000000123456', email: 'invoices@ferrari.com', country: 'IT' },
  { name: 'UniCredit S.p.A.', vatNumber: 'IT00348170101', iban: 'IT28W8000000292100645211151', email: 'billing@unicredit.it', country: 'IT' },
  { name: 'Enel S.p.A.', vatNumber: 'IT00811720580', iban: 'IT40S0542811101000000000123', email: 'invoices@enel.com', country: 'IT' },
  
  // UK (for completeness)
  { name: 'Microsoft Limited', vatNumber: 'GB927480736', iban: 'GB29NWBK60161331926819', email: 'invoices@microsoft.com', country: 'GB' },
  { name: 'Google UK Limited', vatNumber: 'GB855291836', iban: 'GB82WEST12345698765432', email: 'billing@google.co.uk', country: 'GB' },
  { name: 'Amazon UK Services Ltd.', vatNumber: 'GB727255821', iban: 'GB33BUKB20201555555555', email: 'invoices@amazon.co.uk', country: 'GB' },
];

async function seedVendors() {
  try {
    console.log('Starting vendor seed...');

    
    const testCompanyId = '00000000-0000-0000-0000-000000000000';
    const [testCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, testCompanyId));

    if (!testCompany) {
      console.log('Creating test company...');
      await db.insert(companies).values({
        id: testCompanyId,
        name: 'Demo Company',
        email: 'demo@invoiceshield.com',
        apiKey: 'demo-api-key-12345',
        tier: 'premium',
        monthlyQuota: 1000,
      });
      console.log('Test company created');
    }

    // Check existing vendors
    const existingVendors = await db
      .select()
      .from(vendors)
      .where(eq(vendors.companyId, testCompanyId));

    console.log(`Found ${existingVendors.length} existing vendors`);

    // Add vendors
    let added = 0;
    let skipped = 0;

    for (const vendor of WELL_KNOWN_VENDORS) {
      
      const exists = existingVendors.some(
        v => v.vatNumber === vendor.vatNumber
      );

      if (exists) {
        skipped++;
        continue;
      }

      await db.insert(vendors).values({
        companyId: testCompanyId,
        name: vendor.name,
        vatNumber: vendor.vatNumber,
        iban: vendor.iban,
        email: vendor.email,
        isVerified: true,
        verificationDate: new Date(),
      });

      added++;
      console.log(`Added: ${vendor.name} (${vendor.country})`);
    }

    console.log('\n Seed complete!');
    console.log(`Added: ${added} vendors`);
    console.log(`Skipped: ${skipped} (already exist)`);
    console.log(`Total: ${added + skipped} vendors in database`);

    process.exit(0);
  } catch (error) {
    console.error(' Seed failed:', error);
    process.exit(1);
  }
}

seedVendors();