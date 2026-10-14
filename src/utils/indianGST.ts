export interface IndianState {
  code: string;
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
];

export const GST_RATES = [0, 5, 12, 18, 28];

export function getStateByCode(code: string): IndianState | undefined {
  return INDIAN_STATES.find(s => s.code === code);
}

export function getStateByName(name: string): IndianState | undefined {
  if (!name) return undefined;
  return INDIAN_STATES.find(s => s.name.toLowerCase() === name.toLowerCase());
}

/**
 * Validates 15-character Indian GSTIN
 * Format: 2 state digits + 10 PAN chars + 1 entity num + 'Z' + 1 check character
 */
export function validateGSTIN(gstin: string): { isValid: boolean; stateCode?: string; pan?: string; error?: string } {
  if (!gstin) return { isValid: false, error: 'GSTIN is required' };
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) {
    return { isValid: false, error: 'GSTIN must be exactly 15 characters' };
  }
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(clean)) {
    return { isValid: false, error: 'Invalid GSTIN format (e.g. 27AABCB1234F1Z8)' };
  }
  const stateCode = clean.substring(0, 2);
  const pan = clean.substring(2, 12);
  return { isValid: true, stateCode, pan };
}

/**
 * Validates 10-character PAN
 */
export function validatePAN(pan: string): boolean {
  if (!pan) return false;
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return regex.test(pan.trim().toUpperCase());
}

/**
 * Formats a number to Indian Rupee notation (e.g., ₹1,25,000.00)
 */
export function formatINR(val: number | null | undefined, includeSymbol: boolean = true): string {
  if (val === null || val === undefined || isNaN(val)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const parts = absVal.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian comma formatting: 3 digits, then 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const result = (isNegative ? '-' : '') + (formattedInteger || '0') + '.' + decimalPart;

  return includeSymbol ? `₹${result}` : result;
}

/**
 * Converts numbers into Indian currency in words (Lakhs, Crores)
 * e.g. 125400 -> Rupees One Lakh Twenty-Five Thousand Four Hundred Only
 */
export function numberToWordsINR(amount: number): string {
  if (amount === 0 || isNaN(amount)) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(num: number): string {
    if (num < 10) return singleDigits[num];
    if (num < 20) return twoDigits[num - 10];
    const unit = num % 10;
    return tens[Math.floor(num / 10)] + (unit ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(num: number): string {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
      if (rest > 0) res += ' ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let remaining = rupees;
  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  const hundredAndRest = remaining % 1000;

  let words = '';
  if (crore > 0) {
    words += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (hundredAndRest > 0) {
    words += convertThreeDigits(hundredAndRest) + ' ';
  }

  words = words.trim();
  let result = words ? `Rupees ${words}` : 'Rupees Zero';

  if (paise > 0) {
    result += ` and ${convertTwoDigits(paise)} Paise`;
  }
  result += ' Only';

  return result;
}

/**
 * Returns Indian Financial Year string (e.g., "2026-27") based on a date.
 * Financial Year starts on April 1 and ends on March 31.
 */
export function getFinancialYear(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 is January, 3 is April

  let startYear = year;
  if (month < 3) {
    startYear = year - 1;
  }
  const nextYearShort = (startYear + 1).toString().slice(-2);
  return `${startYear}-${nextYearShort}`;
}

/**
 * Calculates GST breakdown given taxable amount, GST rate, and interstate flag.
 */
export function calculateGST(
  taxableAmount: number,
  gstRate: number,
  isInterstate: boolean,
  cessRate: number = 0
) {
  const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  const totalGstAmount = round((taxableAmount * gstRate) / 100);

  if (isInterstate) {
    igstAmount = totalGstAmount;
  } else {
    // Intra-state is split equally
    cgstAmount = round(totalGstAmount / 2);
    sgstAmount = round(totalGstAmount - cgstAmount); // avoids 1 paisa rounding drift
  }

  const cessAmount = round((taxableAmount * cessRate) / 100);
  const totalAmount = round(taxableAmount + totalGstAmount + cessAmount);

  return {
    taxableAmount,
    gstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cessRate,
    cessAmount,
    totalGstAmount,
    totalAmount,
  };
}
