import {
  calculateLineItemGst,
  calculateQuoteGst,
  validateHsnCode,
  LineItemGstInput,
} from '../src/services/gst';

const sampleItem: LineItemGstInput = {
  description: 'Office Chair',
  quantity: 2,
  unitPricePaise: 500000, // ₹5000
  hsnCode: '94013000',
  gstRate: 18,
};

describe('calculateLineItemGst', () => {
  it('returns CGST+SGST split for same state', () => {
    const result = calculateLineItemGst(sampleItem, true);

    expect(result.gstType).toBe('CGST_SGST');
    expect(result.cgstRate).toBe(9);
    expect(result.sgstRate).toBe(9);
    expect(result.igstRate).toBe(0);
    // base = 500000 * 2 = 1000000 paise; GST = 18% = 180000 paise
    expect(result.gstAmountPaise).toBe(180000);
    expect(result.totalPaise).toBe(1180000);
  });

  it('returns IGST for different states', () => {
    const result = calculateLineItemGst(sampleItem, false);

    expect(result.gstType).toBe('IGST');
    expect(result.cgstRate).toBe(0);
    expect(result.sgstRate).toBe(0);
    expect(result.igstRate).toBe(18);
    expect(result.gstAmountPaise).toBe(180000);
    expect(result.totalPaise).toBe(1180000);
  });

  it('handles 0% GST rate', () => {
    const zeroGstItem: LineItemGstInput = { ...sampleItem, gstRate: 0 };
    const result = calculateLineItemGst(zeroGstItem, true);

    expect(result.gstAmountPaise).toBe(0);
    expect(result.totalPaise).toBe(1000000);
  });

  it('rounds gstAmountPaise correctly', () => {
    const oddItem: LineItemGstInput = {
      description: 'Test',
      quantity: 1,
      unitPricePaise: 100, // ₹1
      hsnCode: '9401',
      gstRate: 18,
    };
    // 100 * 18 / 100 = 18 exactly
    const result = calculateLineItemGst(oddItem, false);
    expect(result.gstAmountPaise).toBe(18);
  });
});

describe('calculateQuoteGst', () => {
  const items: LineItemGstInput[] = [
    {
      description: 'Item A',
      quantity: 1,
      unitPricePaise: 100000, // ₹1000
      hsnCode: '9401',
      gstRate: 18,
    },
    {
      description: 'Item B',
      quantity: 3,
      unitPricePaise: 50000, // ₹500
      hsnCode: '8471',
      gstRate: 12,
    },
  ];

  it('returns correct totals for same state (CGST_SGST)', () => {
    const result = calculateQuoteGst(items, 'Maharashtra', 'Maharashtra');

    // Item A base: 100000; GST: 18000
    // Item B base: 150000; GST: 18000
    expect(result.subTotalPaise).toBe(250000);
    expect(result.gstAmountPaise).toBe(36000);
    expect(result.totalPaise).toBe(286000);
    expect(result.gstType).toBe('CGST_SGST');
  });

  it('returns IGST for different states', () => {
    const result = calculateQuoteGst(items, 'Maharashtra', 'Karnataka');

    expect(result.subTotalPaise).toBe(250000);
    expect(result.gstAmountPaise).toBe(36000);
    expect(result.totalPaise).toBe(286000);
    expect(result.gstType).toBe('IGST');
  });

  it('is case-insensitive for state comparison', () => {
    const result = calculateQuoteGst(items, 'maharashtra', 'Maharashtra');
    expect(result.gstType).toBe('CGST_SGST');
  });

  it('handles single item', () => {
    const result = calculateQuoteGst([items[0]!], 'Delhi', 'Delhi');
    expect(result.subTotalPaise).toBe(100000);
    expect(result.gstAmountPaise).toBe(18000);
    expect(result.totalPaise).toBe(118000);
  });
});

describe('validateHsnCode', () => {
  it('accepts 4-digit HSN codes', () => {
    expect(validateHsnCode('9401')).toBe(true);
    expect(validateHsnCode('8471')).toBe(true);
  });

  it('accepts 6-digit HSN codes', () => {
    expect(validateHsnCode('940130')).toBe(true);
    expect(validateHsnCode('847141')).toBe(true);
  });

  it('accepts 8-digit HSN codes', () => {
    expect(validateHsnCode('94013000')).toBe(true);
    expect(validateHsnCode('84714190')).toBe(true);
  });

  it('rejects invalid HSN codes', () => {
    expect(validateHsnCode('123')).toBe(false);      // 3 digits
    expect(validateHsnCode('12345')).toBe(false);    // 5 digits
    expect(validateHsnCode('1234567')).toBe(false);  // 7 digits
    expect(validateHsnCode('123456789')).toBe(false); // 9 digits
    expect(validateHsnCode('abcd')).toBe(false);     // non-numeric
    expect(validateHsnCode('')).toBe(false);         // empty
  });
});
