import axios from "../api/axios";
import { Customer, Inquiry, Item, MailData, Supplier } from "../types/types";

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
  }>(`/api/customers/check-name?query=${customerName}`);

  return response.data;
};

export const searchSupplier = async (companyName: string) => {
  const response = await axios.get<{
    totalCount: number;
    suppliers: Supplier[];
  }>(`/api/suppliers/search?companyName=${companyName}`);

  return response.data;
};

export const fetchSupplierDetail = async (suppliersId: number) => {
  const response = await axios.get(`/api/suppliers/${suppliersId}`);

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
  try {
    let response;

    if (isEditMode) {
      // 수정 모드일 때 PUT 요청 사용
      response = await axios.put(`/api/customer-inquiries/${inquiryId}`, data);

      // 응답을 반환
      return inquiryId;
    } else {
      // 생성 모드일 때 POST 요청 사용
      response = await axios.post(
        `/api/customer-inquiries?docNumber=${docNumber}`,
        data
      );

      // 응답을 반환
      return response.data.inquiryId;
    }
  } catch (error) {
    // 에러를 처리하거나 다시 던짐
    console.error("Error in submitInquiry:", error);
    throw error;
  }
};

export const editInquiry = async (inquiryId: number, data: any) => {
  await axios.put(`/api/customer-inquiries/${inquiryId}`, data);
};

export const deleteInquiry = async (inquiryId: number) => {
  await axios.delete(`/api/customer-inquiries/${inquiryId}/trash`);
};

export const searchInquiryList = async (
  registerStartDate: string = "",
  registerEndDate: string = "",
  documentNumber: string = "",
  refNumber: string = "",
  customerName: string = ""
): Promise<{
  totalCount: number;
  customerInquiryList: Inquiry[];
}> => {
  // Query parameters를 객체로 정의
  const queryParams: { [key: string]: string } = {
    registerStartDate,
    registerEndDate,
    documentNumber,
    refNumber,
    customerName,
  };

  // 쿼리 문자열을 생성
  const queryString = new URLSearchParams(queryParams).toString();

  // GET 요청을 보냄
  const response = await axios.post<{
    totalCount: number;
    customerInquiryList: Inquiry[];
  }>(`/api/customer-inquiries/search?${queryString}`);

  return response.data;
};

export const sendInquiryMail = async (docNumber: string, mailData: MailData[]) => {
  const response = await axios.post(
    `/api/customer-inquiries/send-email?docNumber=${docNumber}`,
    mailData
  );

  return response.data;
};