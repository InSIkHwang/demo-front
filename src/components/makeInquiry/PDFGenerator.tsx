import React, { Dispatch, SetStateAction, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import PDFDocument from "./PDFDocument";
import { InquiryItem, MailData, VesselList } from "../../types/types";
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
  isVisible: boolean;
  onClose: () => void;
  selectedSupplierTag: {
    id: number;
    name: string;
    code: string;
    email: string;
  }[];
  formValues: FormValues;
  items: InquiryItem[];
  vesselInfo: VesselList | null;
  pdfHeader: string;
  setMailDataList: Dispatch<SetStateAction<MailData[]>>;
  language: string;
}

const PDFGenerator = ({
  selectedSupplierTag,
  formValues,
  items,
  vesselInfo,
  pdfHeader,
  setMailDataList,
  language,
}: PDFGeneratorProps) => {
  const generateAndSendPDFs = async () => {
    const mailDataList: MailData[] = [];

    for (const supplierTag of selectedSupplierTag) {
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
      const pdfBase64 = await convertBlobToBase64(pdfBlob);

      const mailData: MailData = {
        supplierId: supplierTag.id,
        toRecipient: supplierTag.email,
        subject:
          language === "ENG"
            ? `BASKOREA REQUEST FOR QUOTATION  ${formValues.docNumber}  ${formValues.vesselName}`
            : `BASKOREA 견적의뢰  ${formValues.docNumber}  ${formValues.vesselName}`,
        content:
          language === "ENG"
            ? `<URGENT>\nGood day,\nThanks for your cooperation\nPlease give us your best price and delivery time.\nYpur kind reply will be much appreciated \n\n<VESSEL INFO>\nVESSEL: ${
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
        attachments: [
          {
            fileName: `document${formValues.refNumber}_${supplierTag.name}.pdf`,
            content: pdfBase64,
            contentType: "application/pdf",
          },
        ],
      };
      mailDataList.push(mailData);
    }
    setMailDataList(mailDataList);
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    generateAndSendPDFs();
  }, [selectedSupplierTag, formValues, items, vesselInfo, pdfHeader, language]);

  return null;
};

export default PDFGenerator;
