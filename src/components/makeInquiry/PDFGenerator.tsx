import React, { Dispatch, SetStateAction, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import PDFDocument from "./PDFDocument";
import dayjs from "dayjs";
import { InquiryItem, MailData, VesselList } from "../../types/types";

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
}

const PDFGenerator = ({
  selectedSupplierTag,
  formValues,
  items,
  vesselInfo,
  pdfHeader,
  setMailDataList,
}: PDFGeneratorProps) => {
  const generateAndSendPDFs = async () => {
    const mailDataList: MailData[] = [];

    for (const supplierTag of selectedSupplierTag) {
      const doc = (
        <PDFDocument
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
        subject: `BASKOREA REQUEST FOR QUOTATION (${formValues.refNumber}) - ${supplierTag.name}`,
        content: `Thanks for your cooperation \n\n<VESSEL INFO>\nVESSEL: ${vesselInfo?.vesselName}\nIMO: ${vesselInfo?.imoNumber}`,
        ccRecipient: "info@bas-korea.com",
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
  }, [selectedSupplierTag, formValues, items, vesselInfo, pdfHeader]);

  return null;
};

export default PDFGenerator;
