import axios from "../api/axios";
import { Customer, Inquiry, Item, Supplier } from "../types/types";

export const fetchDocData = async () => {
  const response = await axios.post<{
    docNumber: string;
    registerDate: string;
    shippingDate: string;
    currencyType: string;
    currencyValue: number;
  }>("/api/customer-inquiries/create/doc-number");

  return response.data;
};

export const fetchInquiryList = async () => {
  const response = await axios.get<{
    totalCount: number;
    customerInquiryList: Inquiry[];
  }>("/api/customer-inquiries");

  return response.data;
};

export const fetchCompanyNames = async (customerName: string) => {
  const response = await axios.get<{
    isExist: boolean;
    customerDetailResponse: Customer[];
  }>(`/api/customers/check-name?customerName=${customerName}`);

  return response.data;
};

export const searchSupplier = async (companyName: string) => {
  const response = await axios.get<{
    totalCount: number;
    suppliers: Supplier[];
  }>(`/api/suppliers/search?companyName=${companyName}`);

  return response.data;
};

export const fetchInquiryDetail = async (inquiryId: number) => {
  const response = await axios.get(`/api/customer-inquiries/${inquiryId}`);

  return response.data;
};

export const fetchItemData = async (itemCode: string) => {
  const response = await axios.get<{ items: Item | Item[] }>(
    `/api/items/search/itemCode?itemCode=${itemCode}`
  );

  return response.data;
};

export const submitInquiry = async (
  docNumber: string | null,
  inquiryId: number | null,
  data: any,
  isEditMode: boolean
) => {
  if (isEditMode) {
    // 수정 모드일 때 PUT 요청 사용
    await axios.put(`/api/customer-inquiries/${inquiryId}`, data);
  } else {
    // 생성 모드일 때 POST 요청 사용
    await axios.post(`/api/customer-inquiries?docNumber=${docNumber}`, data);
  }
};

export const editInquiry = async (inquiryId: number, data: any) => {
  await axios.put(`/api/customer-inquiries/${inquiryId}`, data);
};
