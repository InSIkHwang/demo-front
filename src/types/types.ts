import { Dayjs } from "dayjs";

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
  supplierId: number;
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
  itemDetailId?: number;
  itemId?: number | null;
  position: number;
  itemType: "ITEM" | "MAKER" | "TYPE" | "DESC";
  itemCode: string;
  itemName: string;
  itemRemark: string;
  qty: number;
  unit: string;
  suppliers?: InquiryListSupplier[];
  [key: string]: any;
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
  inquiryItemDetails: InquiryItem[];
}

export interface emailSendData {
  supplierId: number;
  toRecipient: string;
  subject: string;
  content: string;
  ccRecipient?: string | null;
  bccRecipient?: string | null;
  supplierName: string;
}

export interface offerEmailSendData {
  toRecipient: string;
  subject: string;
  content: string;
  ccRecipient: string;
  bccRecipient: string;
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
  inquiryItemDetails: ItemDataType[];
  supplierInfo: {
    inquiryItemDetailId: number | null;
    supplierId: number;
    code: string;
    companyName: string;
    representative: string;
    email: string;
  };
}

export interface FormValuesType {
  supplierInquiryId: number;
  supplierName: string;
  documentNumber: string;
  registerDate: Dayjs;
  shippingDate: Dayjs;
  currencyType: string;
  currency: number;
  customerName: string;
  vesselName: string;
  refNumber: string;
  docRemark: string;
  documentStatus: string;
  veeselHullNo: string;
}

export interface ItemDataType {
  position?: number;
  itemCode: string;
  itemType: string;
  itemName: string;
  itemId: number | null;
  qty: number;
  unit: string;
  itemRemark: string;
  salesPriceKRW: number;
  salesPriceGlobal: number;
  salesAmountKRW: number;
  salesAmountGlobal: number;
  margin: number;
  purchasePriceKRW: number;
  purchasePriceGlobal: number;
  purchaseAmountKRW: number;
  purchaseAmountGlobal: number;
  itemDetailId: number | null;
}

export interface ItemCodeCellProps {
  text: string;
  index: number;
  handleItemCodeChange: (index: number, value: string) => void;
  updateItemId: (index: number, itemId: number | null) => void;
  itemCodeOptions: { value: string; itemId: number }[];
}

export interface ItemNameCellProps {
  text: string;
  index: number;
  handleInputChange: (
    index: number,
    key: keyof ItemDataType,
    value: string
  ) => void;
  updateItemId: (index: number, itemId: number | null) => void;
}
