import React from "react";
import { Modal, Button } from "antd";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import PDFDocument from "./PDFDocument";
import dayjs from "dayjs";
import { InquiryItem, VesselList } from "../../types/types";

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
  selectedSupplierTag: { id: number; name: string; code: string }[];
  formValues: FormValues;
  items: InquiryItem[];
  vesselInfo: VesselList | null;
  pdfHeader: string;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
});

const PDFGenerator = ({
  isVisible,
  onClose,
  selectedSupplierTag,
  formValues,
  items,
  vesselInfo,
  pdfHeader,
}: PDFGeneratorProps) => {
  return (
    <>
      {selectedSupplierTag.map((supplierTag, index) => (
        <PDFDownloadLink
          key={index}
          document={
            <PDFDocument
              formValues={formValues}
              items={items}
              supplierName={supplierTag.name} // 공급자 이름을 넘김
              vesselInfo={vesselInfo}
              pdfHeader={pdfHeader}
              viewMode={false}
            />
          }
          fileName={`document_${supplierTag.name}.pdf`}
        >
          {({ loading }) =>
            loading
              ? "Generating PDF..."
              : `Download PDF for ${supplierTag.name}`
          }
        </PDFDownloadLink>
      ))}
    </>
  );
};

export default PDFGenerator;
