import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import OfferPDFDocument from "./OfferPDFDocument";
import {
  InquiryItem,
  offerEmailSendData,
  SupplierInquiryDetailIF,
} from "../../types/types";
import { fetchCustomerDetail } from "../../api/api";

interface PDFGeneratorProps {
  info: SupplierInquiryDetailIF;
  items: InquiryItem[];
  pdfHeader: string;
  pdfFooter: string;
  setMailData: Dispatch<SetStateAction<offerEmailSendData | null>>;
  language: string;
  setPdfFileData: Dispatch<SetStateAction<File | null>>;
  customerTag: {
    id: number;
    name: string;
  };
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
}: PDFGeneratorProps) => {
  const [customerInfo, setCustomerInfo] = useState<{
    name: string | null;
    email: string | null;
    id: number | null;
  }>({ name: null, id: null, email: null });

  const fetchCustomerInfo = async () => {
    const response = await fetchCustomerDetail(customerTag.id);
    const mappedResponse = {
      name: response.companyName,
      email: response.email,
      id: response.id,
    };
    setCustomerInfo(mappedResponse);
  };
  const generateAndSendPDFs = async () => {
    // Ensure customerInfo is correctly populated
    if (
      customerInfo.name === null ||
      customerInfo.email === null ||
      customerInfo.id === null
    ) {
      console.error("Customer info is incomplete.");
      return;
    }

    const doc = (
      <OfferPDFDocument
        language={language}
        info={info}
        pdfHeader={pdfHeader}
        pdfFooter={pdfFooter}
        viewMode={false}
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

    // 메일 데이터 생성
    const mailData: offerEmailSendData = {
      toRecipient: customerInfo.email || "", // Use empty string if email is null
      subject:
        language === "ENG"
          ? `BASKOREA QUOTATION  ${info.documentNumber}  ${info.vesselName}`
          : `BASKOREA QUOTATION  ${info.documentNumber}  ${info.vesselName}`,
      content: "Content Sample",
      ccRecipient: "",
      bccRecipient: "",
    };

    // 최종 파일 및 메일 데이터 상태 업데이트
    setPdfFileData(newFile);
    setMailData(mailData);
  };

  useEffect(() => {
    fetchCustomerInfo();
  }, [customerTag.id]);

  useEffect(() => {
    if (customerInfo.id !== null) {
      generateAndSendPDFs();
    }
  }, [customerInfo]);

  return null;
};

export default OfferPDFGenerator;
