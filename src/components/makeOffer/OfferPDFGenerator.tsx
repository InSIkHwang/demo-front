import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { pdf } from "@react-pdf/renderer";
import OfferPDFDocument from "./OfferPDFDocument";
import {
  FormValuesType,
  InvCharge,
  ItemDetailType,
  offerEmailSendData,
  HeaderFormData,
} from "../../types/types";
import { fetchCompanyDetail } from "../../api/api";
import { message } from "antd";

interface PDFGeneratorProps {
  info: FormValuesType;
  items: ItemDetailType[];
  pdfHeader: HeaderFormData;
  pdfFooter: {
    quotationRemarkId: number | null;
    quotationRemark: string;
  }[];
  setMailData: Dispatch<SetStateAction<offerEmailSendData | null>>;
  language: string;
  setPdfFileData: Dispatch<SetStateAction<File | null>>;
  customerTag: {
    id: number;
    name: string;
  };
  finalTotals: {
    totalSalesAmountKRW: number;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountKRW: number;
    totalPurchaseAmountGlobal: number;
    totalProfit: number;
    totalProfitPercent: number;
  };
  dcInfo: { dcPercent: number; dcKrw: number; dcGlobal: number };
  invChargeList: InvCharge[] | null;
}

const OfferPDFGenerator = ({
  info,
  items,
  pdfHeader,
  pdfFooter,
  setMailData,
  language,
  setPdfFileData,
  customerTag,
  finalTotals,
  dcInfo,
  invChargeList,
}: PDFGeneratorProps) => {
  const [customerInfo, setCustomerInfo] = useState<{
    name: string | null;
    email: string | null;
    id: number | null;
  }>({ name: null, id: null, email: null });

  // 매출처 정보 가져오기
  const fetchCustomerInfo = useCallback(async () => {
    const response = await fetchCompanyDetail(customerTag.id, "customer");
    const mappedResponse = {
      name: response.companyName ?? "",
      email: response.email ?? "",
      id: response.id,
    };
    setCustomerInfo(mappedResponse);
  }, [customerTag.id]);

  // PDF 생성 및 메일 데이터 생성
  const generateAndSendPDFs = useCallback(async () => {
    // 매출처 정보가 완전하지 않은 경우 오류 메시지 표시
    if (customerInfo === null) {
      message.error("Customer info is incomplete.");
      return;
    }

    const doc = (
      <OfferPDFDocument
        language={language}
        info={info}
        items={items}
        pdfHeader={pdfHeader}
        pdfFooter={pdfFooter}
        viewMode={false}
        finalTotals={finalTotals}
        dcInfo={dcInfo}
        invChargeList={invChargeList}
      />
    );

    const pdfBlob = await pdf(doc).toBlob();
    const fileName =
      language === "ENG"
        ? `${customerInfo.name} QUOTATION ${info.refNumber}.pdf`
        : `${customerInfo.name} QUOTATION ${info.refNumber}.pdf`;
    const newFile = new File([pdfBlob], fileName, {
      type: "application/pdf",
    });

    // // 다운로드를 트리거하는 함수입니다.
    // const downloadFile = (file: any) => {
    //   const url = URL.createObjectURL(file);
    //   const a = document.createElement("a");
    //   a.href = url;
    //   a.download = file.name;
    //   document.body.appendChild(a);
    //   a.click();
    //   document.body.removeChild(a);
    //   URL.revokeObjectURL(url);
    // };

    // // 파일을 다운로드합니다.
    // downloadFile(newFile);

    // 메일 데이터 생성
    const mailData: offerEmailSendData = {
      toRecipient: customerInfo.email || "", // Use empty string if email is null
      subject:
        language === "ENG"
          ? `BASKOREA QUOTATION ${info.refNumber} // ${info.documentNumber} `
          : `BASKOREA QUOTATION ${info.refNumber} // ${info.documentNumber}  `,
      content: `Dear Sir.
Good day.
Thank you very much for new inquiry.
Please find the attached Quotation also update the link.
We look forward to hearing good news from you.
"Please note that we at BAS KOREA  never change our bank account details at short notice."
Thanks & Best Regards`,
      ccRecipient: "",
      bccRecipient: "",
    };

    // 최종 파일 및 메일 데이터 상태 업데이트
    setPdfFileData(newFile);

    setMailData(mailData);
  }, [
    customerInfo,
    language,
    info,
    items,
    pdfHeader,
    pdfFooter,
    finalTotals,
    dcInfo,
    invChargeList,
    setMailData,
    setPdfFileData,
  ]);

  // 매출처 정보 가져오기
  useEffect(() => {
    fetchCustomerInfo();
  }, [fetchCustomerInfo]);

  useEffect(() => {
    if (customerInfo.id !== null) {
      const timer = setTimeout(() => {
        generateAndSendPDFs();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [customerInfo.id, pdfHeader, info]);

  return null;
};

export default OfferPDFGenerator;
