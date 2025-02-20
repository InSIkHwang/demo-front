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

export interface VesselResponse {
  totalCount: number;
  vessels: Vessel[];
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

export interface CompanyPayload {
  code: string;
  companyName: string;
  korCompanyName?: string;
  phoneNumber: string;
  representative: string;
  email: string;
  address: string;
  communicationLanguage: string;
  makerCategoryList?: { category: string; makers: string[] }[]; // supplier일 때만 전송
  supplierRemark?: string; // supplier일 때만 전송
  margin?: number;
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
  vesselName: string;
  supplierPreview: {
    currencyType: string;
    documentId: number;
    supplierInquiryId: number;
    supplierCode: string;
    supplierName: string;
    totalPurchaseAmountGlobal: number;
    totalPurchaseAmountKrw: number;
    totalSalesAmountGlobal: number;
    totalSalesAmountKrw: number;
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
  invChargeList?: InvCharge[];
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

export interface LogisticsDate {
  deliveryDate: string;
  expectedReceivingDate: string;
  receivingDate: string;
  shippingDate: string;
}

export interface Logistics {
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
  logisticsId?: number;
  quotationId?: number;
  refNumber: string;
  registerDate: string;
  shippingDate: string;
  vesselHullNo?: string;
  vesselId?: number;
  vesselName: string;
  forwarder?: string;
  loc?: string;
  packingDetails?: string;
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
  deliveryDate: number;
  supplier?: OrderSupplier;
}

export interface LogisticsItemDetail {
  logisticsItemId: number | null;
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
  deliveryDate: number;
  supplier?: OrderSupplier;
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
    packing: string;
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

export interface LogisticsResponse {
  documentInfo: Logistics;
  logisticsDate: LogisticsDate;
  invChargeList: InvCharge[];
  itemDetailList: LogisticsItemDetail[];
  suppliers: OrderSupplier[];
  supplierInfoList: OrderSupplier[];
  ciPlResponse: CIPLHeaderFormData;
}

export interface OrderRequest {
  orderId: number;
  supplierId: number;
  documentEditInfo: Order;
  invChargeList: InvCharge[];
  itemDetailList: OrderItemDetail[];
}

export interface LogisticsRequest {
  logisticsId: number;
  supplierId: number;
  documentEditInfo: Logistics;
  invChargeList: InvCharge[];
  itemDetailList: LogisticsItemDetail[];
  logisticsDate: LogisticsDate;
}

export interface InvCharge {
  invChargeId: number | null; // invChargeId는 number 또는 null일 수 있습니다.
  customCharge: string;
  chargePriceKRW: number;
  chargePriceGlobal: number;
}

export interface InvoiceCharge {
  invChargeId: number | null; // invChargeId는 number 또는 null일 수 있습니다.
  customCharge: string;
  chargePriceKRW: number;
  chargePriceGlobal: number;
  isChecked: boolean;
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
    inquiryStatus: string;
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
  deliveryDate: number;
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
  [key: string]: string | number | undefined;
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
  deliveryDate: number;
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
  packing: string | "";
}

export interface OrderAckHeaderFormData {
  orderHeaderId: number | null;
  portOfShipment: string | "";
  deliveryTime: string | "";
  termsOfPayment: string | "";
  incoterms: string | "";
  receiverType: string | "";
  packing: string | "";
}

export interface CIPLHeaderFormData {
  ciPlId: number | null;
  shipper: string;
  forAccountAndRiskOfMessers: string;
  notifyParty: string;
  portOfLoading: string;
  finalDestination: string;
  vesselAndVoyage: string;
  sailingOnOr: string;
  noAndDateOfInvoice: string;
  noAndDateOfPo: string;
  lcIssuingBank: string;
  remark: string;
}

export interface InvoiceListIF {
  salesId: number;
  orderId: number;
  documentId: number;
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
  documentStatus: string;
  customerId: number;
  vesselId: number;
  vesselHullNo: string;
  imoNo: number;
  discount: number;
}

export interface InvoiceDocument {
  documentId: number;
  documentNumber: string; // 추가 필요
  salesId: number; // 추가 필요
  invoiceNumber: string;
  registerDate: string;
  refNumber: string;
  companyName: string;
  vesselName: string;
  currencyType: string;
  currency: number;
  docRemark: string;
  docManager: string;
  documentStatus: string;
  customerId: number;
  vesselId: number;
  discount: number | null;
  imoNumber: number; // 추가 필요
}

export interface InvoiceHeaderDetail {
  invoiceDate: string;
  messrs: string;
  termsOfPayment: string;
  dueDate: string;
}

export interface InvoiceRemarkDetail {
  salesRemarkId: number | null;
  salesRemark: string;
}

export interface InvoiceDetailIF {
  documentInfo: InvoiceDocument;
  invChargeList: InvoiceCharge[];
  suppliers: Supplier[];
  itemDetailList: OrderItemDetail[];
  salesHeaderResponse: {
    salesHeader: InvoiceHeaderDetail;
    salesRemark: InvoiceRemarkDetail[];
  };
}

export interface MakerSupplierList {
  maker: string;
  category: string;
  supplierList: {
    id: number;
    code: string;
    name: string;
    korName: string;
    email: string;
  }[];
}
