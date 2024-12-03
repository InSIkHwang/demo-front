import { message } from "antd";
import axios from "../api/axios";
import { AxiosError } from "axios";

import {
  Customer,
  HeaderFormData,
  Inquiry,
  Item,
  ItemDataType,
  OfferSearchParams,
  orderAllResponses,
  Quotation,
  Supplier,
  SupplierInquiryListIF,
  TrashItem,
} from "../types/types";
import { setAccessToken, setRefreshToken } from "./auth";
import dayjs from "dayjs";

//----------------------------------------------------------------------------------
// Home
export const fetchHome = async () => {
  const response = await axios.get(`/api/home`);

  return response.data;
};

//----------------------------------------------------------------------------------
// UserLogin API
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

export const postUserSignUp = async (
  email: string,
  password: string,
  name: string,
  country: string
) => {
  const response = await axios.post("/api/member/signup", {
    email,
    password,
    name,
    country,
  });

  return response.data;
};

export const fetchCustomerDetail = async (customerId: number) => {
  const response = await axios.get(`/api/customers/${customerId}`);

  return response.data;
};

//----------------------------------------------------------------------------------
// 매출처, 의뢰처, 선박, 아이템 관련

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
export const searchSupplierUseMaker = async (
  maker: string,
  categoryType: string | null
) => {
  const response = await axios.get<{
    makerSupplierList: {
      category: string;
      maker: string;
      supplierList: Supplier[];
    }[];
  }>(
    `/api/items/search/maker?maker=${encodeURIComponent(
      maker
    )}&itemType=MAKER&categoryType=${encodeURIComponent(categoryType || "")}`
  );

  return response.data;
};

//Item 검색
export const fetchItemData = async (itemCode: string) => {
  const response = await axios.get<{ items: Item | Item[] }>(
    `/api/items/search/itemCode?itemCode=${itemCode}`
  );

  return response.data;
};

//Supplier 상세 정보 조회
export const fetchSupplierDetail = async (id: number, category: string) => {
  if (category === "supplier") {
    const response = await axios.get(`/api/suppliers/${id}`);
    return response.data;
  } else if (category === "customer") {
    const response = await axios.get(`/api/customers/${id}`);
    return response.data;
  }
};

//Supplier add Maker
export const AddMaker = async (
  supplierId: number,
  categoryType: string,
  maker: string
) => {
  await axios.post(
    `/api/suppliers/maker/${supplierId}?categoryType=${categoryType}&maker=${maker}`
  );
};

//Supplier delete Maker
export const DeleteMaker = async (
  supplierId: number,
  categoryType: string,
  maker: string
) => {
  await axios.delete(
    `/api/suppliers/maker/${supplierId}?categoryType=${categoryType}&maker=${maker}`
  );
};

//fetch Item Category
export const fetchCategory = async () => {
  const response = await axios.get("/api/suppliers/category-all");

  return response.data;
};

//fetch Vessel
export const fetchVessel = async (vesselId: number) => {
  const response = await axios.get(`/api/vessels/${vesselId}`);

  return response.data;
};

export const vesselCheckImoAndHullUnique = async (
  type: string,
  value: string | number | null
) => {
  const response = await axios.get(`/api/vessels/check/${type}/${value}`);

  return !response.data; //응답 반전
};

//----------------------------------------------------------------------------------
// INQUIRY 작성 관련

//MakeInquiry시 문서번호, 날짜 등 생성
export const fetchDocData = async () => {
  const response = await axios.post<{
    documentId: number;
    docNumber: string;
    registerDate: string;
    shippingDate: string;
    currencyType: string;
    currencyValue: number;
    docManagerName: string;
  }>("/api/customer-inquiries/create/doc-number");

  return response.data;
};

// 문서번호 중복 검사
export const chkDuplicateDocNum = async (
  docNumber: string,
  inquiryId: number | null
) => {
  const validInquiryId = isNaN(inquiryId as any) ? 0 : inquiryId;

  const response = await axios.get(
    `/api/document/number/duplicate-check?documentNumber=${docNumber}&inquiryId=${validInquiryId}`
  );

  return response.data;
};

// Ref number 중복 검사
export const chkDuplicateRefNum = async (
  refNumber: string,
  inquiryId: number | null
) => {
  const validInquiryId = isNaN(inquiryId as any) ? 0 : inquiryId;

  const response = await axios.get(
    `/api/document/ref-number/duplicate-check?documentRefNumber=${refNumber}&inquiryId=${validInquiryId}`
  );

  return response.data;
};

//Inquiry 저장
export const submitInquiry = async (
  inquiryId: number | null,
  documentId: number | null,
  data: any,
  isEditMode: boolean
) => {
  try {
    let response;

    if (isEditMode) {
      // 수정 모드일 때 PUT 요청 사용
      response = await axios.put(
        `/api/customer-inquiries/mixed/${inquiryId}`,
        data
      );

      // 응답을 반환
      return inquiryId;
    } else {
      // 생성 모드일 때 POST 요청 사용

      response = await axios.post(
        `/api/customer-inquiries/mixed/inquiry/${documentId}`,
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

//복합 Inquiry 저장
export const submitComplexInquiry = async (
  inquiryId: number | null,
  documentId: number | null,
  data: any,
  isEditMode: boolean
) => {
  try {
    let response;

    if (isEditMode) {
      // 수정 모드일 때 PUT 요청 사용
      response = await axios.put(`/api/complex/inquiry/${inquiryId}`, data);

      // 응답을 반환
      return inquiryId;
    } else {
      // 생성 모드일 때 POST 요청 사용
      response = await axios.post(`/api/complex/inquiry/${documentId}`, data);

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

//Inquiry 메일 전송
export const sendInquiryMail = async (
  mode: string,
  docNumber: string,
  inquiryId: number | null,
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

  // files.forEach((file) => {
  //   const url = URL.createObjectURL(file);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = file.name;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url); // 메모리 해제
  // });

  console.log(
    "Attached files:",
    files.map((file) => file.name)
  );

  // `file` 추가
  files.forEach((file) => {
    formData.append("file", file); // 동일한 이름으로 여러 파일 추가
  });

  // `emailSendData`를 JSON 문자열로 변환하여 추가
  formData.append("emailSendData", JSON.stringify(emailSendData));

  // POST 요청

  if (mode === "makeInquiry") {
    const response = await axios.post(
      `/api/customer-inquiries/send-email?docNumber=${docNumber}&inquiryId=${inquiryId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } else if (mode === "addSupplier") {
    const response = await axios.post(
      `/api/supplier-inquiries/add/suppliers/send-email?docNumber=${docNumber}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }
};

//엑셀 내보내기
export const handleExport = async (inquiryId: number) => {
  const response = await axios.post(
    `/api/customer-inquiries/make-excel/${inquiryId}`
  );

  return response.data;
};

//
export const searchInquiryWithMaker = async (makerName: string) => {
  const response = await axios.get(
    `/api/document/search?makerName=${makerName}`
  );

  return response.data;
};
//----------------------------------------------------------------------------------
// INQUIRY 조회 관련

export const fetchInquiryList = async (
  page: number,
  pageSize: number,
  viewMyInquiryOnly: boolean,
  viewOnlySentEmails: boolean
) => {
  const params: any = {
    page: page - 1, // 페이지는 0부터 시작
    pageSize: pageSize, // 페이지당 아이템 수
    writer: viewMyInquiryOnly ? "MY" : "ALL",
    selectDocumentStatusType: viewOnlySentEmails
      ? "SENT_CUSTOMER_INQUIRY"
      : "CUSTOMER_INQUIRY",
  };

  const response = await axios.get<{
    totalCount: number;
    customerInquiryList: Inquiry[];
  }>("/api/customer-inquiries", { params });

  return response.data;
};

//Inquiry 상세 정보 조회
export const fetchInquiryDetail = async (inquiryId: number) => {
  const response = await axios.get(
    `/api/customer-inquiries/mixed/${inquiryId}`
  );

  return response.data;
};

//복합 Inquiry 상세 정보 조회
export const fetchComplexInquiryDetail = async (inquiryId: number) => {
  const response = await axios.get(`/api/complex/inquiry/${inquiryId}`);

  return response.data;
};

// Inquiry Copy
export const copyInquiry = async (
  docNumber: string,
  newDocumentNumber: string
) => {
  const response = await axios.post(
    `/api/document/copy/${docNumber}?newDocumentNumber=${newDocumentNumber}`
  );

  return response.data;
};

//Inquiry 검색
export const searchInquiryList = async (
  registerStartDate: string = "",
  registerEndDate: string = "",
  documentNumber: string = "",
  refNumber: string = "",
  customerName: string = "",
  vesselName: string = "",
  query: string = "",
  page: number,
  pageSize: number,
  viewMyInquiryOnly: boolean,
  viewOnlySentEmails: boolean
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
    vesselName,
    query,
    page: (page - 1).toString(), // 페이지는 0부터 시작
    pageSize: pageSize.toString(), // 페이지당 아이템 수,
    writer: viewMyInquiryOnly ? "MY" : "ALL",
    selectDocumentStatusType: viewOnlySentEmails
      ? "SENT_CUSTOMER_INQUIRY"
      : "CUSTOMER_INQUIRY",
  };

  // 쿼리 문자열을 생성
  const queryString = Object.keys(queryParams)
    .filter((key) => queryParams[key] !== "") // 빈 문자열 필터링
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  // GET 요청을 보냄 (POST가 아닌 GET으로 보내야 할 경우)
  const response = await axios.post<{
    totalCount: number;
    customerInquiryList: Inquiry[];
  }>(`/api/customer-inquiries/search?${queryString}`);

  return response.data;
};

//----------------------------------------------------------------------------------
// OFFER 조회 관련

//OFFER(Supplier Inquiry) 조회
export const fetchOfferList = async (
  page: number,
  pageSize: number,
  viewMyInquiryOnly: boolean
) => {
  const response = await axios.get<{
    totalCount: number;
    supplierInquiryList: SupplierInquiryListIF[];
  }>("/api/supplier-inquiries", {
    params: {
      page: page - 1, // 페이지는 0부터 시작
      pageSize: pageSize, // 페이지당 아이템 수
      writer: viewMyInquiryOnly ? "MY" : "ALL",
    },
  });

  return response.data;
};

//OFFER(Supplier Inquiry) 상세조회
export const fetchOfferDetail = async (documentId: number) => {
  const response = await axios.get(`/api/supplier-inquiries/new/${documentId}`);

  return response.data;
};

//Offer 검색
export const searchOfferList = async ({
  registerStartDate = "",
  registerEndDate = "",
  query = "",
  documentNumber = "",
  refNumber = "",
  customerName = "",
  supplierName = "",
  page,
  pageSize,
  writer,
  itemName = "",
  itemCode = "",
}: OfferSearchParams): Promise<{
  totalCount: number;
  supplierInquiryList: SupplierInquiryListIF[];
}> => {
  const queryParams = {
    registerStartDate,
    registerEndDate,
    query,
    documentNumber,
    refNumber,
    customerName,
    supplierName,
    page: (page - 1).toString(),
    pageSize: pageSize.toString(),
    writer,
    itemName,
    itemCode,
  };

  const queryString = new URLSearchParams(
    Object.entries(queryParams)
      .filter(([_, value]) => value !== "")
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  ).toString();

  const response = await axios.post<{
    totalCount: number;
    supplierInquiryList: SupplierInquiryListIF[];
  }>(`/api/supplier-inquiries/search?${queryString}`);

  return response.data;
};

//매입처 추가
export const addSupplierFetchData = async (docNumber: string) => {
  const response = await axios.get(
    `/api/supplier-inquiries/add/suppliers?docNumber=${docNumber}`
  );

  return response.data;
};

//----------------------------------------------------------------------------------
// Offer 작성 관련

// Offer 수정
export const editOffer = async (
  supplierInquiryId: number,
  supplierId: number,
  documentEditInfo: {
    registerDate: string | dayjs.Dayjs;
    shippingDate: string | dayjs.Dayjs;
    currencyType: string;
    refNumber: string;
    currency: number;
    vesselId: number;
    customerId: number;
    veeselHullNo: string | null;
    docRemark: string;
    color: string;
  },
  itemCostEditList: ItemDataType[],
  discount: number,
  invChargeList:
    | {
        invChargeId: number | null;
        customCharge: string;
        chargePriceGlobal: number;
        chargePriceKRW: number;
      }[]
    | null
) => {
  // 서버로 보내는 데이터의 포맷을 맞추기 위해 수정
  const requestData = {
    supplierId,
    discount: discount,
    invChargeList: invChargeList,
    documentEditInfo,
    itemCostEditList,
  };

  await axios.put(`/api/supplier-inquiries/${supplierInquiryId}`, requestData);
};

// 복합 의뢰처 생성
export const editMurgedOffer = async (supplierInquiryIds: number[]) => {
  const response = await axios.post(`/api/supplier-inquiries/merged`, {
    supplierInquiryIds,
  });

  return response.data;
};

//Offer 헤더 저장
export const saveComplexOfferHeader = async (
  inquiryId: number,
  request: {
    quotationHeader: HeaderFormData;
    quotationRemark: {
      quotationRemarkId: number | null;
      quotationRemark: string;
    }[];
  }
) => {
  const response = await axios.put(
    `/api/complex/inquiry/quotation-headers/${inquiryId}`,
    request
  );

  return response.data;
};

//OFFER 상태 변경 (메일 전송 체크)
export const changeOfferStatus = async (supplierInquiryId: number) => {
  const response = await axios.put(
    `/api/supplier-inquiries/update-status/${supplierInquiryId}`
  );

  return response.data;
};

// Offer PDF 문서번호 체크
export const checkOfferPdfDocNumber = async (
  inquiryId: number,
  supplierInquiryName: string,
  documentId: number
) => {
  const response = await axios.put(
    `/api/supplier-inquiries/update-name/${inquiryId}?supplierInquiryName=${supplierInquiryName}&documentId=${documentId}`
  );

  return response.data;
};

// Offer 메일 전송
export const sendQuotationMail = async (
  files: File[], // `file`의 타입에 맞게 구체화된 파일 배열
  emailSendData: {
    emailSend: {
      toRecipient: string;
      subject: string;
      content: string;
      ccRecipient: string;
      bccRecipient: string;
    };
    quotationHeader: HeaderFormData;
    supplierInquiryIds: number[];
  }
) => {
  // FormData 객체 생성
  const formData = new FormData();

  // `file` 추가
  files.forEach((file) => {
    formData.append("file", file); // 동일한 이름으로 여러 파일 추가
  });

  // `emailSend` 데이터 추가
  formData.append("emailSendData", JSON.stringify(emailSendData));

  // files.forEach((file) => {
  //   const url = URL.createObjectURL(file);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = file.name;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url); // 메모리 해제
  // });

  // POST 요청
  const response = await axios.post(
    `/api/supplier-inquiries/send-email/merged-inquiry`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

//엑셀 내보내기
export const handleOfferExport = async (inquiryId: number) => {
  const response = await axios.post(
    `/api/supplier-inquiries/make-excel/${inquiryId}`
  );

  return response.data;
};

//Offer 헤더 저장
export const saveOfferHeader = async (
  inquiryId: number,
  request: {
    quotationHeader: HeaderFormData;
    quotationRemark: {
      quotationRemarkId: number | null;
      quotationRemark: string;
    }[];
  }
) => {
  const response = await axios.put(
    `/api/supplier-inquiries/quotation-headers/${inquiryId}`,
    request
  );

  return response.data;
};

//----------------------------------------------------------------------------------
// QUOTATION 조회 관련

//QUOTATION 조회
export const fetchQuotationList = async (page: number, pageSize: number) => {
  const response = await axios.get<{
    totalCount: number;
    quotationList: Quotation[];
  }>("/api/quotations", {
    params: {
      page: page - 1, // 페이지는 0부터 시작
      pageSize: pageSize, // 페이지당 아이템 수
    },
  });

  return response.data;
};

//QUOTATION 상세 정보 조회
export const fetchQuotationDetail = async (quotationId: number) => {
  const response = await axios.get(`/api/quotations/${quotationId}`);

  return response.data;
};

//QUOTATION 검색
export const searchQutationList = async (
  registerStartDate: string = "",
  registerEndDate: string = "",
  documentNumber: string = "",
  refNumber: string = "",
  customerName: string = "",
  page: number,
  pageSize: number
): Promise<{
  totalCount: number;
  quotationList: Quotation[];
}> => {
  // Query parameters를 객체로 정의
  const queryParams: { [key: string]: string } = {
    registerStartDate,
    registerEndDate,
    documentNumber,
    refNumber,
    customerName,
    page: (page - 1).toString(), // 페이지는 0부터 시작
    pageSize: pageSize.toString(), // 페이지당 아이템 수
  };

  // 쿼리 문자열을 생성
  const queryString = Object.keys(queryParams)
    .filter((key) => queryParams[key] !== "") // 빈 문자열 필터링
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  // GET 요청을 보냄 (POST가 아닌 GET으로 보내야 할 경우)
  const response = await axios.post<{
    totalCount: number;
    quotationList: Quotation[];
  }>(`/api/quotations/search?${queryString}`);

  return response.data;
};

//QUOTATION 삭제
export const deleteQutation = async (quotationId: number) => {
  await axios.put(`/api/quotations/${quotationId}/trash`);
};

//QUOTATION 확정
export const confirmQutation = async (supplierInquiryId: number) => {
  await axios.post(`/api/quotation/confirm/${supplierInquiryId}`);
};

//----------------------------------------------------------------------------------
// ORDER 조회 관련

//ORDER 조회
export const fetchOrderList = async (page: number, pageSize: number) => {
  const response = await axios.get<{
    totalCount: number;
    orderAllResponses: orderAllResponses[];
  }>("/api/orders", {
    params: {
      page: page - 1, // 페이지는 0부터 시작
      pageSize: pageSize, // 페이지당 아이템 수
    },
  });

  return response.data;
};

//ORDER 상세 정보 조회
export const fetchOrderDetail = async (orderId: number) => {
  const response = await axios.get(`/api/orders/${orderId}`);

  return response.data;
};

//----------------------------------------------------------------------------------
//휴지통

//TRASH 조회
export const fetchTrashList = async (page: number, pageSize: number) => {
  const response = await axios.get<{
    totalCount: number;
    trashList: TrashItem[];
  }>("/api/trash", {
    params: {
      page: page - 1, // 페이지는 0부터 시작
      pageSize: pageSize, // 페이지당 아이템 수
    },
  });

  return response.data;
};

// TRASH 복구 API
export const recoverTrash = async (docNumber: string) => {
  const response = await axios.put(`/api/trash/${docNumber}`);

  return response.data;
};
