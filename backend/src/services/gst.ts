export interface GstResult {
  gstType: 'IGST' | 'CGST_SGST';
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  gstAmountPaise: number;
  totalPaise: number;
}

export interface LineItemGstInput {
  description: string;
  quantity: number;
  unitPricePaise: number;
  hsnCode: string;
  gstRate: number;
}

export function calculateLineItemGst(
  item: LineItemGstInput,
  isSameState: boolean
): GstResult {
  const basePaise = item.unitPricePaise * item.quantity;
  const gstAmountPaise = Math.round((basePaise * item.gstRate) / 100);
  const totalPaise = basePaise + gstAmountPaise;

  if (isSameState) {
    const halfRate = item.gstRate / 2;
    return {
      gstType: 'CGST_SGST',
      cgstRate: halfRate,
      sgstRate: halfRate,
      igstRate: 0,
      gstAmountPaise,
      totalPaise,
    };
  }

  return {
    gstType: 'IGST',
    cgstRate: 0,
    sgstRate: 0,
    igstRate: item.gstRate,
    gstAmountPaise,
    totalPaise,
  };
}

export function calculateQuoteGst(
  items: LineItemGstInput[],
  sellerState: string,
  customerState: string
): {
  subTotalPaise: number;
  gstAmountPaise: number;
  totalPaise: number;
  gstType: 'IGST' | 'CGST_SGST';
} {
  const isSameState =
    sellerState.trim().toLowerCase() === customerState.trim().toLowerCase();

  let subTotalPaise = 0;
  let gstAmountPaise = 0;

  for (const item of items) {
    const basePaise = item.unitPricePaise * item.quantity;
    const itemGst = Math.round((basePaise * item.gstRate) / 100);
    subTotalPaise += basePaise;
    gstAmountPaise += itemGst;
  }

  return {
    subTotalPaise,
    gstAmountPaise,
    totalPaise: subTotalPaise + gstAmountPaise,
    gstType: isSameState ? 'CGST_SGST' : 'IGST',
  };
}

export function validateHsnCode(hsn: string): boolean {
  return /^\d{4}(\d{2}(\d{2})?)?$/.test(hsn);
}
