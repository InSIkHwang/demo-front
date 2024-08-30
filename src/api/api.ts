import { message } from "antd";
import axios from "../api/axios";
import { AxiosError } from "axios";

import {
  Customer,
  emailSendData,
  Inquiry,
  Item,
  ItemDataType,
  Supplier,
  SupplierInquiryListIF,
} from "../types/types";
import { setAccessToken, setRefreshToken } from "./auth";

export const postUserLogin = async (email: string, password: string) => {
  try {
    const response = await axios.post("/api/member/login", {
      email,
      password,
    });

    const { accessToken: newAccessToken, refreshToken } = response.data;

    // 새로운 액세스 토큰을 메모리 변수에 저장
    setAccessToken(newAccessToken);

    // 리프레시 토큰을 쿠키에 저장
    setRefreshToken(refreshToken);

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      message.error(error.response.data.message);
    } else if (error instanceof Error) {
      message.error(error.message);
    } else {
      message.error("An unexpected error occurred");
    }
    throw error;
  }
};

//MakeInquiry시 문서번호, 날짜 등 생성
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

//Inquiry 조회
export const fetchInquiryList = async () => {
  const response = await axios.get<{
    totalCount: number;
    customerInquiryList: Inquiry[];
  }>("/api/customer-inquiries");

  return response.data;
};

//Offer(Supplier Inquiry) 조회
export const fetchOfferList = async () => {
  const response = await axios.get<{
    totalCount: number;
    supplierInquiryList: SupplierInquiryListIF[];
  }>("/api/supplier-inquiries");

  return response.data;
};

//Offer(Supplier Inquiry) 상세조회
export const fetchOfferDetail = async (
  supplierInquiryId: number,
  supplierId: number
) => {
  const response = await axios.get(
    `/api/supplier-inquiries/${supplierInquiryId}?supplierId=${supplierId}`
  );

  return response.data;
};

//Customers 검색
export const fetchCompanyNames = async (customerName: string) => {
  const response = await axios.get<{
    isExist: boolean;
    customerDetailResponse: Customer[];
  }>(`/api/customers/check-name?query=${customerName}`);

  return response.data;
};
//Supplier 검색
export const searchSupplier = async (companyName: string) => {
  const response = await axios.get<{
    totalCount: number;
    suppliers: Supplier[];
  }>(`/api/suppliers/search?companyName=${companyName}`);

  return response.data;
};
//Maker이름으로 Supplier 검색
export const searchSupplierUseMaker = async (maker: string) => {
  const response = await axios.get<{
    makerSupplierList: {
      category: string;
      maker: string;
      supplierList: Supplier[];
    }[];
  }>(`/api/items/search/maker?maker=${maker}&itemType=MAKER`);

  return response.data;
};

//Supplier 상세 정보 조회
export const fetchSupplierDetail = async (suppliersId: number) => {
  const response = await axios.get(`/api/suppliers/${suppliersId}`);

  return response.data;
};

//Inquiry 상세 정보 조회
export const fetchInquiryDetail = async (inquiryId: number) => {
  const response = await axios.get(`/api/customer-inquiries/${inquiryId}`);

  return response.data;
};

//Item 검색
export const fetchItemData = async (itemCode: string) => {
  const response = await axios.get<{ items: Item | Item[] }>(
    `/api/items/search/itemCode?itemCode=${itemCode}`
  );

  return response.data;
};

//Inquiry 저장
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
//Inquiry 삭제
export const deleteInquiry = async (inquiryId: number) => {
  await axios.put(`/api/customer-inquiries/${inquiryId}/trash`);
};

//Inquiry 검색
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

export const sendInquiryMail = async (
  docNumber: string,
  files: File[], // `file`의 타입에 맞게 구체화할 수 있습니다 (예: File, Blob)
  emailSendData: {
    supplierId: number;
    toRecipient: string;
    subject: string;
    content: string;
    ccRecipient: string;
    bccRecipient: string;
    supplierName: string;
  }[]
) => {
  // FormData 객체 생성
  const formData = new FormData();

  // `file` 추가
  files.forEach((file) => {
    formData.append("file", file); // 동일한 이름으로 여러 파일 추가
  });

  // `emailSendData`를 JSON 문자열로 변환하여 추가
  formData.append("emailSendData", JSON.stringify(emailSendData));

  // POST 요청
  const response = await axios.post(
    `/api/customer-inquiries/send-email?docNumber=${docNumber}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

//Offer 수정
export const editOffer = async (
  supplierInquiryId: number,
  supplierId: number,
  itemCostEditList: ItemDataType[]
) => {
  // 서버로 보내는 데이터의 포맷을 맞추기 위해 수정
  const requestData = {
    supplierId,
    itemCostEditList,
  };

  await axios.put(`/api/supplier-inquiries/${supplierInquiryId}`, requestData);
};

export const editMurgedOffer = async (supplierInquiryIds: number[]) => {
  const response = await axios.post(`/api/supplier-inquiries/merged`, {
    supplierInquiryIds,
  });

  return response.data;
};
