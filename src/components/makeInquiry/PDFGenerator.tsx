import React, { Dispatch, SetStateAction, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import PDFDocument from "./PDFDocument";
import { emailSendData, InquiryItem, VesselList } from "../../types/types";
import dayjs from "dayjs";
import { message } from "antd";
import { fetchCompanyDetail } from "../../api/api";

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
    korName: string;
    code: string;
    email: string;
    communicationLanguage: string;
  }[];
  formValues: FormValues;
  setMailDataList: Dispatch<SetStateAction<emailSendData[]>>;
  vesselInfo: VesselList | null;
  pdfHeader: string;
}

const generateMailData = async (
  selectedSupplierTag: PDFGeneratorProps["selectedSupplierTag"],
  formValues: FormValues,
  vesselInfo: VesselList | null,
  setMailDataList: Dispatch<SetStateAction<emailSendData[]>>
) => {
  const mailDataList: emailSendData[] = [];

  // 매입처별 메일 데이터 생성
  for (const supplierTag of selectedSupplierTag) {
    const supplierDetail = await fetchCompanyDetail(supplierTag.id, "supplier");

    const mailData: emailSendData = {
      supplierId: supplierTag.id,
      toRecipient: supplierDetail.email,
      subject:
        supplierTag.communicationLanguage === "ENG"
          ? `BASKOREA REQUEST FOR QUOTATION  ${formValues.docNumber}  ${formValues.vesselName}`
          : `BASKOREA 견적의뢰서  ${formValues.docNumber}  ${formValues.vesselName}`,
      content:
        supplierTag.communicationLanguage === "ENG"
          ? `Dear Sir or Madam\nGood day,\nThanks for your cooperation.\nPlease give us your best price and delivery time.\nYour kind reply will be much appreciated.\n\nThanks & Best Regards\n\n\n${
              vesselInfo?.vesselName?.trim().toUpperCase() !== "UNKNOWN"
                ? `<VESSEL INFO>\nVessel name: ${vesselInfo?.vesselName}${
                    vesselInfo?.imoNumber
                      ? `\nIMO No: ${vesselInfo?.imoNumber}`
                      : ""
                  }${
                    vesselInfo?.hullNumber
                      ? `\nHull No: ${vesselInfo?.hullNumber}`
                      : ""
                  }${
                    vesselInfo?.shipYard
                      ? `\nShipyard: ${vesselInfo?.shipYard}`
                      : ""
                  }${
                    vesselInfo?.countryOfManufacture
                      ? `\nNationality: ${vesselInfo?.countryOfManufacture}`
                      : ""
                  }`
                : ""
            }\n\n\nD.Y.KIM\nBAS KOREA CO.\n17, APEC-ro, Haeundae-gu, Busan,\nRepublic of Korea / 48060\nTel. 070-7600-5067\nFax. +82-51-793-0635\nE-mail. info@bas-korea.com\n\n`
          : `수신: ${
              supplierTag.korName
            } 영업부 담당자님\n발신: 바스코리아 D.Y.KIM 드림\n\n업무에 노고가 많으십니다.\n상기 건 견적의뢰 부탁드립니다.\n제품 확인을 위한 추가 자료가 있다면 함께 전달 부탁 드립니다.\n항상 도움 주셔서 감사합니다.\n감사합니다.\n\nThanks & Best Regards\n\n\n${
              vesselInfo?.vesselName?.trim().toUpperCase() !== "UNKNOWN"
                ? `<VESSEL INFO>\nVessel name: ${vesselInfo?.vesselName}${
                    vesselInfo?.imoNumber
                      ? `\nIMO No: ${vesselInfo?.imoNumber}`
                      : ""
                  }${
                    vesselInfo?.hullNumber
                      ? `\nHull No: ${vesselInfo?.hullNumber}`
                      : ""
                  }${
                    vesselInfo?.shipYard
                      ? `\nShipyard: ${vesselInfo?.shipYard}`
                      : ""
                  }${
                    vesselInfo?.countryOfManufacture
                      ? `\nNationality: ${vesselInfo?.countryOfManufacture}`
                      : ""
                  }`
                : ""
            }\n\n\nD.Y.KIM\nBAS KOREA CO.\n부산 해운대구 APEC로 17 3106호 / 48060\nTel. 070-7600-5067\nFax. 051-793-0635\nMobile. 010-3321-2688\nE-mail. info@bas-korea.com\n\n`,
      ccRecipient: "",
      supplierName:
        supplierTag.communicationLanguage === "ENG"
          ? supplierTag.name
          : supplierTag.korName,
    };
    // 메일 데이터 리스트에 추가
    mailDataList.push(mailData);
  }
  // 메일 데이터 리스트 업데이트
  setMailDataList(mailDataList);
};

// PDF 파일 생성 함수
export const generatePDFs = async (
  selectedSupplierTag: PDFGeneratorProps["selectedSupplierTag"],
  formValues: FormValues,
  getItemsForSupplier: (supplierId: number) => InquiryItem[],
  vesselInfo: VesselList | null,
  pdfHeader: string
): Promise<File[]> => {
  const updatedFiles: File[] = [];
  // 단일 공급처만 처리하도록 수정
  const supplierTag = selectedSupplierTag[0];

  if (!supplierTag) {
    message.error("No supplier selected.");
    return [];
  }

  // 매입처별 아이템 데이터 가져오기
  const supplierItems = getItemsForSupplier(supplierTag.id);

  // 아이템 데이터 존재 여부 확인
  if (supplierItems.length < 1) {
    message.error(`No items selected for supplier: ${supplierTag.name}`);
    return [];
  }

  try {
    // PDF 문서 생성
    const doc = (
      <PDFDocument
        formValues={formValues}
        items={supplierItems}
        supplier={supplierTag}
        vesselInfo={vesselInfo}
        pdfHeader={pdfHeader}
        viewMode={false}
      />
    );

    // PDF 문서를 Blob으로 변환
    const pdfBlob = await pdf(doc).toBlob();
    // 파일 이름 생성
    const fileName =
      supplierTag.communicationLanguage === "ENG"
        ? `${supplierTag.name} REQUEST FOR QUOTATION ${formValues.docNumber}.pdf`
        : `${supplierTag.korName} 견적의뢰서 ${formValues.docNumber}.pdf`;

    // 파일 생성
    const newFile = new File([pdfBlob], fileName, {
      type: "application/pdf",
    });

    // 파일 리스트에 추가
    updatedFiles.push(newFile);
    return updatedFiles;
  } catch (error) {
    console.error(
      `PDF generation failed for supplier ${supplierTag.name}:`,
      error
    );
    message.error(`Failed to generate PDF for ${supplierTag.name}`);
    return [];
  }
};

const PDFGenerator = ({
  selectedSupplierTag,
  formValues,
  vesselInfo,
  setMailDataList,
}: PDFGeneratorProps) => {
  // 메일 데이터 생성 로직을 useEffect에서 실행
  useEffect(() => {
    generateMailData(
      selectedSupplierTag,
      formValues,
      vesselInfo,
      setMailDataList
    );
  }, [selectedSupplierTag, formValues, vesselInfo, setMailDataList]);

  return null;
};

export default PDFGenerator;
