export interface Customer {
  id: number;
  code: string;
  companyName: string;
  phoneNumber: string;
  representative: string;
  email: string;
  address: string;
  country: string;
  communicationLanguage: string;
  modifiedAt: string;
  vesselList: VesselList[];
  headerMessage: string;
}

export interface VesselList {
  id: number;
  code: string;
  vesselName: string;
  vesselCompanyName: string;
  imoNumber: number;
  hullNumber: string;
  shipYard: string;
}

export interface Supplier {
  id: number;
  code: string;
  companyName: string;
  phoneNumber: string;
  representative: string;
  email: string;
  address: string;
  country: string;
  communicationLanguage: string;
  modifiedAt: string;
  headerMessage: string;
}

export interface Vessel {
  id: number;
  code: string;
  vesselName: string;
  vesselCompanyName: string;
  imoNumber: number;
  hullNumber: string;
  shipYard: string;
  customer: {
    id: number;
    newCustomerId: string;
    code: string;
    companyName: string;
    newCustomerName: string;
  };
}

export interface InquiryItem {
  itemId?: number;
  no: number;
  itemType: "ITEM" | "MAKER" | "TYPE" | "DESC";
  itemCode: string;
  itemName: string;
  itemRemark: string;
  qty: number;
  unit: string;
}

export interface Item {
  itemId: number;
  itemCode: string;
  itemName: string;
  supplierList: {
    id: number;
    code: string;
    itemId: number;
    companyName: string;
    phoneNumber: string;
    representative: string;
    email: string;
    communicationLanguage: string;
  }[];
}

//InquiryList
export interface InquiryListSupplier {
  inquiryItemDetailId: number;
  supplierId: number;
  code: string;
  companyName: string;
  representative: string;
  email: string;
}

export interface InquiryListItem {
  itemDetailId: number;
  itemId: number;
  itemType: "ITEM" | "MAKER" | "TYPE" | "DESC";
  itemCode: string;
  itemName: string;
  itemRemark: string;
  qty: number;
  unit: string;
  suppliers: InquiryListSupplier[];
}

export interface Inquiry {
  customerInquiryId: number;
  documentNumber: string;
  registerDate: string;
  shippingDate: string;
  companyName: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  vesselName: string;
  veeselHullNo: string;
  docRemark: string;
  docManager: string;
  representative: string;
  documentStatus: string;
  pdfUrl: string | null;
  inquiryType: string;
  inquiryItemDetails: InquiryListItem[];
}

export interface MailData {
  supplierId: number;
  toRecipient: string;
  subject: string;
  content: string;
  ccRecipient?: string | null;
  bccRecipient?: string | null;
  attachments: [
    {
      fileName: string;
      content: string;
      contentType: string;
    }
  ];
}

export interface SupplierInquiryListIF {
  supplierInquiryId: number;
  documentNumber: string;
  registerDate: string;
  shippingDate: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  docRemark: string;
  docManager: string;
  documentStatus: string;
  supplierInfoList: {
    supplierInquiryId: number;
    supplierId: number;
    code: string;
    companyName: string;
  }[];
}

export interface SupplierInquiryDetailIF {
  supplierInquiryId: number;
  documentNumber: string;
  registerDate: string;
  shippingDate: string;
  customerName: string;
  supplierName: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  vesselName: string;
  veeselHullNo: string;
  docRemark: string;
  docManager: string;
  representative: string;
  documentStatus: string;
  pdfUrl: string | null; // pdfUrl can be null or a string
  inquiryType: string;
  inquiryItemDetails: {
    itemDetailId: number;
    itemId: number;
    itemType: string;
    itemCode: string;
    itemName: string;
    itemRemark: string | null; // itemRemark can be null
    qty: number;
    unit: string;
    salesPriceKRW: number;
    salesPriceUSD: number;
    salesAmountKRW: number;
    salesAmountUSD: number;
    margin: number;
    purchasePriceKRW: number;
    purchasePriceUSD: number;
    purchaseAmountKRW: number;
    purchaseAmountUSD: number;
  }[];
  supplierInfo: {
    inquiryItemDetailId: number | null;
    supplierId: number;
    code: string;
    companyName: string;
    representative: string;
    email: string;
  };
}

export interface ItemDataType {
  itemCode: string;
  itemType: string;
  itemName: string;
  itemId: number;
  qty: number;
  unit: string;
  itemRemark: string;
  salesPriceKRW: number;
  salesPriceUSD: number;
  salesAmountKRW: number;
  salesAmountUSD: number;
  margin: number;
  purchasePriceKRW: number;
  purchasePriceUSD: number;
  purchaseAmountKRW: number;
  purchaseAmountUSD: number;
  itemDetailId: string;
}
