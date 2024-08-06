import axios from "../api/axios";
import { Customer, Item } from "../types/types";

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

export const fetchCompanyNames = async (customerName: string) => {
  const response = await axios.get<{
    isExist: boolean;
    customerDetailResponse: Customer[];
  }>(`/api/customers/check-name?customerName=${customerName}`);

  return response.data;
};

export const fetchItemData = async (itemCode: string) => {
  const response = await axios.get<{ items: Item | Item[] }>(
    `/api/items/search/itemCode?itemCode=${itemCode}`
  );

  return response.data;
};

export const submitInquiry = async (docNumber: string, data: any) => {
  await axios.post(`/api/customer-inquiries?docNumber=${docNumber}`, data);
};
