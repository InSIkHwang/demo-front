import React, { Dispatch, SetStateAction, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import OfferPDFDocument from "./OfferPDFDocument";
import {
  emailSendData,
  InquiryItem,
  SupplierInquiryDetailIF,
} from "../../types/types";
import dayjs from "dayjs";

interface PDFGeneratorProps {
  isVisible: boolean;
  onClose: () => void;
  selectedSupplierTag: {
    id: number;
    name: string;
    code: string;
    email: string;
  }[];
  info: SupplierInquiryDetailIF;
  items: InquiryItem[];
  pdfHeader: string;
  setMailDataList: Dispatch<SetStateAction<emailSendData[]>>;
  language: string;
  pdfFileData: File[];
  setPdfFileData: Dispatch<SetStateAction<File[]>>;
}

const OfferPDFGenerator = ({
  selectedSupplierTag,
  info,
  items,
  pdfHeader,
  setMailDataList,
  language,
  pdfFileData,
  setPdfFileData,
}: PDFGeneratorProps) => {
  const generateAndSendPDFs = async () => {
    const mailDataList: emailSendData[] = [];
    const updatedFiles: File[] = [];

    for (const supplierTag of selectedSupplierTag) {
      const doc = (
        <OfferPDFDocument
          language={language}
          info={info}
          supplierName={supplierTag.name}
          pdfHeader={pdfHeader}
          viewMode={false}
        />
      );

      const pdfBlob = await pdf(doc).toBlob();
      const fileName =
        language === "ENG"
          ? `${supplierTag.name} REQUEST FOR QUOTATION ${info.refNumber}.pdf`
          : `${supplierTag.name} 견적의뢰서 ${info.refNumber}.pdf`;
      const newFile = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });

      // 최종 파일 리스트에 저장
      updatedFiles.push(newFile);

      // 메일 데이터 생성
      const mailData: emailSendData = {
        supplierId: supplierTag.id,
        toRecipient: supplierTag.email,
        subject:
          language === "ENG"
            ? `BASKOREA REQUEST FOR QUOTATION  ${info.documentNumber}  ${info.vesselName}`
            : `BASKOREA 견적의뢰  ${info.documentNumber}  ${info.vesselName}`,
        content: "",
        // language === "ENG"
        //   ? `<URGENT>\nGood day,\nThanks for your cooperation\nPlease give us your best price and delivery time.\nYour kind reply will be much appreciated \n\n<VESSEL INFO>\nVESSEL: ${
        //       info?.vesselName
        //     }\nIMO No: ${info?.veeselImoNo || ""}\nHull No: ${
        //       info?.veeselHullNo || ""
        //     }\nShip Yard: ${info?.veeselShipYard || ""}
        //     `
        //   : `수신: ${
        //       supplierTag.name
        //     } 영업부 담당자님\n발신: 바스코리아 드림\n\n업무에 노고가 많으십니다.\n상기 건 견적의뢰 부탁드립니다.\n제품 확인을 위한 추가 자료가 있다면 함께 전달 부탁 드립니다.\n항상 도움 주셔서 감사합니다.\n\n<VESSEL INFO>\nVESSEL: ${
        //       info?.vesselName
        //     }\nIMO No: ${info?.veeselImoNo || ""}\nHull No: ${
        //       info?.veeselHullNo || ""
        //     }\nShip Yard: ${info?.veeselShipYard || ""}`,
        ccRecipient: "",
        supplierName: supplierTag.name,
      };

      mailDataList.push(mailData);
    }

    // 모든 루프가 끝난 후 최종 파일 리스트를 상태에 저장
    setPdfFileData(updatedFiles);

    // 최종 메일 데이터 리스트 상태에 저장
    setMailDataList(mailDataList);
  };

  useEffect(() => {
    generateAndSendPDFs();
  }, [selectedSupplierTag, info, items, pdfHeader, language]);

  return null;
};

export default OfferPDFGenerator;
