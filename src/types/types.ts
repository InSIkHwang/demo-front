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
  vesselList: Array<{
    id: number;
    code: string;
    vesselName: string;
    vesselCompanyName: string;
    imoNumber: number;
    hullNumber: string;
    shipYard: string;
  }>;
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
  itemId: number;
  inquiryItemType?: "ITEM" | "MAKER" | "TYPE" | "DESC";
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
  docManger: string;
  representative: string;
  documentStatus: string;
  pdfUrl: string | null;
  inquiryType: string;
  inquiryItems: InquiryListItem[];
}
