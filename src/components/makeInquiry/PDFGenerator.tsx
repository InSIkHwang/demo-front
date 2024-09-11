import React, { Dispatch, SetStateAction, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import PDFDocument from "./PDFDocument";
import { emailSendData, InquiryItem, VesselList } from "../../types/types";
import dayjs from "dayjs";

interface FormValues {
  docNumber: string;
  registerDate: string | dayjs.Dayjs;
  shippingDate: string | dayjs.Dayjs;
  customer: string;
  vesselName: string;
  refNumber: string;
  currencyType: string;
  remark: string;
}

interface PDFGeneratorProps {
  selectedSupplierTag: {
    id: number;
    name: string;
    code: string;
    email: string;
  }[];
  formValues: FormValues;
  setMailDataList: Dispatch<SetStateAction<emailSendData[]>>;
  items: InquiryItem[];
  vesselInfo: VesselList | null;
  pdfHeader: string;
  language: string;
  setPdfFileData: Dispatch<SetStateAction<File[]>>;
}

const generateMailData = (
  selectedSupplierTag: PDFGeneratorProps["selectedSupplierTag"],
  formValues: FormValues,
  vesselInfo: VesselList | null,
  language: string,
  setMailDataList: Dispatch<SetStateAction<emailSendData[]>>
) => {
  const mailDataList: emailSendData[] = [];

  for (const supplierTag of selectedSupplierTag) {
    const mailData: emailSendData = {
      supplierId: supplierTag.id,
      toRecipient: supplierTag.email,
      subject:
        language === "ENG"
          ? `BASKOREA REQUEST FOR QUOTATION  ${formValues.docNumber}  ${formValues.vesselName}`
          : `BASKOREA 견적의뢰  ${formValues.docNumber}  ${formValues.vesselName}`,
      content:
        language === "ENG"
          ? `<URGENT>\nGood day,\nThanks for your cooperation\nPlease give us your best price and delivery time.\nYour kind reply will be much appreciated \n\n<VESSEL INFO>\nVESSEL: ${
              vesselInfo?.vesselName
            }\nIMO No: ${vesselInfo?.imoNumber || ""}\nHull No: ${
              vesselInfo?.hullNumber || ""
            }\nShip Yard: ${vesselInfo?.shipYard || ""}`
          : `수신: ${
              supplierTag.name
            } 영업부 담당자님\n발신: 바스코리아 드림\n\n업무에 노고가 많으십니다.\n상기 건 견적의뢰 부탁드립니다.\n제품 확인을 위한 추가 자료가 있다면 함께 전달 부탁 드립니다.\n항상 도움 주셔서 감사합니다.\n\n<VESSEL INFO>\nVESSEL: ${
              vesselInfo?.vesselName
            }\nIMO No: ${vesselInfo?.imoNumber || ""}\nHull No: ${
              vesselInfo?.hullNumber || ""
            }\nShip Yard: ${vesselInfo?.shipYard || ""}`,
      ccRecipient: "",
      supplierName: supplierTag.name,
    };

    mailDataList.push(mailData);
  }

  setMailDataList(mailDataList);
};

export const generatePDFs = async (
  selectedSupplierTag: PDFGeneratorProps["selectedSupplierTag"],
  formValues: FormValues,
  items: InquiryItem[],
  vesselInfo: VesselList | null,
  pdfHeader: string,
  language: string,
  setPdfFileData: Dispatch<SetStateAction<File[]>>,
  selectedSupplierIndex: number // 추가된 파라미터
): Promise<File[]> => {
  const updatedFiles: File[] = [];

  // 특정 인덱스의 supplierTag만 사용
  const supplierTag = selectedSupplierTag[selectedSupplierIndex];

  if (supplierTag) {
    const doc = (
      <PDFDocument
        language={language}
        formValues={formValues}
        items={items}
        supplierName={supplierTag.name}
        vesselInfo={vesselInfo}
        pdfHeader={pdfHeader}
        viewMode={false}
      />
    );
    const pdfBlob = await pdf(doc).toBlob();

    const fileName =
      language === "ENG"
        ? `${supplierTag.name} REQUEST FOR QUOTATION ${formValues.refNumber}.pdf`
        : `${supplierTag.name} 견적의뢰서 ${formValues.refNumber}.pdf`;
    const newFile = new File([pdfBlob], fileName, {
      type: "application/pdf",
    });

    updatedFiles.push(newFile);
  }
  setPdfFileData(updatedFiles);
  return updatedFiles;
};

const PDFGenerator = ({
  selectedSupplierTag,
  formValues,
  vesselInfo,
  setMailDataList,
  language,
}: PDFGeneratorProps) => {
  // 메일 데이터 생성 로직을 useEffect에서 실행
  useEffect(() => {
    generateMailData(
      selectedSupplierTag,
      formValues,
      vesselInfo,
      language,
      setMailDataList
    );
  }, [selectedSupplierTag, formValues, vesselInfo, language, setMailDataList]);

  return null;
};

export default PDFGenerator;
