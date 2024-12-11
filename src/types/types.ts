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
  // code: string;
  vesselName: string;
  vesselCompanyName: string;
  imoNumber: number;
  hullNumber: string;
  shipYard: string;
  countryOfManufacture?: string;
}

export interface Supplier {
  supplierId: number;
  id: number;
  code: string;
  companyName: string;
  korCompanyName?: string;
  phoneNumber: string;
  representative: string;
  email: string;
  address: string;
  country: string;
  communicationLanguage: string;
  modifiedAt: string;
  headerMessage: string;
  supplierRemark?: string;
}

export interface Vessel {
  id: number;
  // code: string;
  vesselName: string;
  vesselCompanyName: string;
  imoNumber: number;
  hullNumber: string;
  shipYard: string;
  countryOfManufacture?: string;
  customers: {
    id: number;
    newCustomerId: string;
    code: string;
    companyName: string;
    newCustomerName: string;
  }[];
}

export interface InquiryItem {
  itemDetailId?: number | null;
  itemId?: number | null;
  position: number;
  itemType: "ITEM" | "MAKER" | "TYPE" | "DESC" | "DASH";
  itemCode: string;
  itemName: string;
  itemRemark: string;
  qty: number;
  unit: string;
  suppliers?: InquiryListSupplier[];
  tableNo: number;
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
    korCompanyName?: string;
    phoneNumber: string;
    representative: string;
    email: string;
    communicationLanguage: string;
    supplierRemark?: string;
  }[];
}

//InquiryList
export interface InquiryListSupplier {
  inquiryItemDetailId?: number;
  supplierId: number;
  code: string;
  companyName: string;
  korCompanyName?: string;
  representative: string;
  email: string;
  communicationLanguage?: string;
  supplierRemark?: string;
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
  remark: string;
  docManager: string;
  representative: string;
  documentStatus: string;
  documentType: string;
  pdfUrl: string | null;
  inquiryType: string;
  inquiryItemDetails: InquiryItem[];
  color: string | "#FFFFFF";
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
  color: string | "#FFFFFF";
  documentId: number;
  documentNumber: string;
  registerDate: string;
  shippingDate: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  docRemark: string;
  docManager: string;
  documentStatus: string;
  documentType: string;
  customerInquiryId?: number;
  supplierPreview: {
    supplierInquiryId: number;
    supplierCode: string;
    supplierName: string;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountGlobal: number;
    status: string;
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
  discount: number;
  invChargeList: invCharge[] | [];
}

export interface invCharge {
  invChargeId: number | null;
  customCharge: string;
  chargePriceKRW: number;
  chargePriceGlobal: number;
}

export interface FormValuesType {
  documentId: number;
  documentNumber: string;
  registerDate: Dayjs;
  shippingDate: Dayjs;
  refNumber: string;
  currencyType: string;
  currency: number;
  docRemark: string;
  docManager: string;
  documentStatus: string;
  customerId: number;
  companyName: string;
  vesselId: number;
  vesselName: string;
  vesselHullNo: string;
  imoNo?: number;
  discount?: number;
  invChargeList?: invCharge[];
  color?: string;
}

export interface ItemDataType {
  position?: number;
  indexNo?: string;
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

export interface Quotation {
  quotationId: number;
  documentNumber: string;
  registerDate: string;
  shippingDate: string;
  companyName: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  vesselName: string;
  docRemark: string;
  docManager: string;
  representative: string | null;
  documentStatus: string;
}

export interface QuotationDetail {
  invChargeList?: {
    invChargeId: number;
    customCharge: string;
    chargePriceKRW: number;
    chargePriceGlobal: number;
  }[];
  quotationDocumentDetail: {
    quotationId: number;
    docNumber: string;
    registerDate: string;
    shippingDate: string;
    vesselName: string;
    vesselHullNo: string;
    imoNo: string | null;
    companyName: string;
    representative: string | null;
    currency: number;
    currencyType: "USD" | "EUR" | "INR" | "JPY" | string; // Expand as needed
    documentStatus: string;
    pdfUrl: string | null;
    refNumber: string;
    docRemark: string;
    docManager: string;
    supplierName: string[];
    discount?: number;
  };
  quotationItemDetailResponseList: Array<{
    itemDetailId: number;
    itemId: number;
    itemType: "ITEM" | "MAKER" | "DESC" | string; // Expand as needed
    itemCode: string;
    itemName: string;
    itemRemark: string;
    qty: number;
    position: number;
    unit: string;
    salesPriceKRW: number;
    salesPriceGlobal: number;
    salesAmountKRW: number;
    salesAmountGlobal: number;
    margin: number;
    purchasePriceKRW: number;
    purchasePriceGlobal: number;
    purchaseAmountKRW: number;
    purchaseAmountGlobal: number;
    supplierId?: number;
    supplierName?: string;
  }>;
}

export interface Order {
  companyName: string;
  currency: number;
  currencyType: string;
  customerId?: number; // optional
  discount?: number | null;
  docManager: string;
  docRemark: string;
  documentId: number;
  documentNumber: string;
  documentStatus: string;
  imoNo?: number; // optional
  invChargeList?: InvCharge[]; // optional
  orderId?: number;
  quotationId?: number;
  refNumber: string;
  registerDate: string;
  shippingDate: string;
  vesselHullNo?: string;
  vesselId?: number;
  vesselName: string;
}

export interface orderAllResponses {
  orderList: Order[];
  totalCount: number;
}
export interface OrderItemDetail {
  ordersItemId: number | null;
  itemType: "ITEM" | "MAKER" | "TYPE" | "DESC" | "DASH" | string;
  itemCode: string;
  itemName: string;
  itemRemark: string;
  qty: number;
  position: number;
  unit: string;
  indexNo: string | null;
  salesPriceKRW: number;
  salesPriceGlobal: number;
  salesAmountKRW: number;
  salesAmountGlobal: number;
  margin: number;
  purchasePriceKRW: number;
  purchasePriceGlobal: number;
  purchaseAmountKRW: number;
  purchaseAmountGlobal: number;
}

export interface OrderSupplier {
  code: string;
  communicationLanguage: string;
  companyName: string;
  email: string;
  korCompanyName: string;
  supplierId: number;
  supplierInquiryId?: number | null;
  supplierRemark: string;
  representative?: string | null;
}

export interface orderRemark {
  orderRemarkId: number | null;
  orderRemark: string;
}

export interface orderHeaderResponse {
  orderCustomerHeader: {
    orderHeaderId: number | null;
    portOfShipment: string;
    deliveryTime: string;
    termsOfPayment: string;
    incoterms: string;
    receiverType: string;
  };
  orderSupplierHeader: {
    orderHeaderId: number | null;
    receiverType: string;
  };
  orderCustomerRemark: orderRemark[];
  orderSupplierRemark: orderRemark[];
}

export interface OrderResponse {
  documentInfo: Order;
  invChargeList: InvCharge[];
  itemDetailList: OrderItemDetail[];
  suppliers: OrderSupplier[];
  supplierInfoList: OrderSupplier[];
  orderHeaderResponse: orderHeaderResponse;
}

export interface OrderRequest {
  orderId: number;
  supplierId: number;
  documentEditInfo: Order;
  invChargeList: InvCharge[];
  itemDetailList: OrderItemDetail[];
}

export interface InvCharge {
  invChargeId: number | null; // invChargeId는 number 또는 null일 수 있습니다.
  customCharge: string;
  chargePriceKRW: number;
  chargePriceGlobal: number;
}

export interface TrashItem {
  docNumber: string;
  registerDate: string;
  shippingDate: string;
  currencyType: string;
  currencyValue: number;
  documentStatus: string;
  docManagerName: string;
  categoryType: string[];
}

export interface InquirySearchMakerSupplier {
  id: number;
  code: string;
  companyName: string;
  korCompanyName: string;
  communicationLanguage: string;
  supplierRemark: string;
  representative: string;
  email: string;
  count?: number;
}

export interface InquirySearchMakerInquiryItem {
  inquiryItemType: string;
  itemName: string;
  itemRemark: string;
  supplierList: InquirySearchMakerSupplier[];
}

export interface InquirySearchMakerInquirySearchResult {
  bestSupplierList: InquirySearchMakerSupplier[];
  searchList: InquirySearchMakerInquiryItem[];
}

export interface InquiryResponse {
  documentInfo: DocumentInfo;
  table: InquiryTable[];
}

export interface DocumentInfo {
  customerInquiryId: number;
  vesselId: number;
  documentId: number;
  customerId: number;
  documentNumber: string;
  registerDate: Dayjs;
  shippingDate: Dayjs;
  companyName: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  vesselName: string;
  vesselHullNo: string;
  shipYard: string;
  countryOfManufacture: string;
  remark: string;
  docManager: string;
  representative: string;
  documentStatus: string;
  inquiryType: string;
  imoNo?: number;
  color?: string;
}

export interface InquiryTable {
  itemDetails: InquiryItem[];
  supplierList: InquiryListSupplier[];
}

export interface OfferResponse {
  documentInfo: FormValuesType;
  response: {
    inquiryId: number;
    supplierInfo: SupplierInfo;
    itemDetail: ItemDetailType[];
    pdfUrl: string | null;
    supplierInquiryName: string;
    quotationHeader: HeaderFormData;
    quotationRemark: {
      quotationRemarkId: number | null;
      quotationRemark: string;
    }[];
  }[];
}

export interface SupplierInfo {
  supplierId: number;
  supplierName: string;
  supplierCode: string;
}

export interface ItemDetailType {
  itemDetailId: number | null;
  itemId: number | null;
  itemType: "MAKER" | "ITEM" | "DESC" | "TYPE" | "DASH";
  itemCode: string;
  itemName: string;
  itemRemark: string;
  qty: number;
  position: number;
  unit: string;
  indexNo: string | null;
  salesPriceKRW: number;
  salesPriceGlobal: number;
  salesAmountKRW: number;
  salesAmountGlobal: number;
  margin: number;
  purchasePriceKRW: number;
  purchasePriceGlobal: number;
  purchaseAmountKRW: number;
  purchaseAmountGlobal: number;
}

export interface OfferSearchParams {
  registerStartDate?: string;
  registerEndDate?: string;
  query?: string;
  documentNumber?: string;
  refNumber?: string;
  customerName?: string;
  supplierName?: string;
  page: number;
  pageSize: number;
  writer: "MY" | "ALL";
  itemName?: string;
  itemCode?: string;
  vesselName?: string;
  documentStatus?: string;
}

export interface ComplexInquirySupplier {
  inquiryItemDetailId?: number | null;
  supplierId: number;
  code: string;
  companyName: string;
  korCompanyName?: string | null;
  representative?: string | null;
  email?: string;
  communicationLanguage?: string;
  supplierRemark?: string | null;
}

export interface ComplexInquiryConfirmSupplier {
  supplierId: number;
  code?: string;
  companyName?: string;
  korCompanyName?: string;
}

export interface ComplexInquiryItemDetail {
  itemDetailId?: number;
  itemId?: number;
  itemType: "MAKER" | "ITEM" | "DESC" | "TYPE" | "DASH";
  itemCode: string;
  itemName: string;
  itemRemark: string;
  qty: number;
  unit?: string;
  position: number;
  indexNo: string | null;
  salesPriceKRW: number;
  salesPriceGlobal: number;
  salesAmountKRW: number;
  salesAmountGlobal: number;
  margin: number;
  purchasePriceKRW: number;
  purchasePriceGlobal: number;
  purchaseAmountKRW: number;
  purchaseAmountGlobal: number;
  suppliers: ComplexInquirySupplier[];
  confirmSupplier: ComplexInquiryConfirmSupplier | null;
}

export interface ComplexInquiry {
  documentInfo: DocumentInfo;
  discount?: number;
  invChargeList?: InvCharge[];
  inquiryItemDetails: ComplexInquiryItemDetail[];
  quotationHeader: HeaderFormData;
  quotationRemark: {
    quotationRemarkId: number | null;
    quotationRemark: string;
  }[];
}

export interface HeaderFormData {
  quotationHeaderId: number | null;
  portOfShipment: string | "";
  deliveryTime: string | "";
  termsOfPayment: string | "";
  incoterms: string | "";
  offerValidity: string | "";
  partCondition: string | "";
}

export interface OrderAckHeaderFormData {
  orderHeaderId: number | null;
  portOfShipment: string | "";
  deliveryTime: string | "";
  termsOfPayment: string | "";
  incoterms: string | "";
  receiverType: string | "";
}
