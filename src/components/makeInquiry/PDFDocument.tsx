import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  PDFViewer,
  Image,
} from "@react-pdf/renderer";
import dayjs from "dayjs";
import malgunGothic from "../../assets/font/malgun.ttf";
import logoUrl from "../../assets/logo/baskorea_logo-removebg.png";
import { styled } from "styled-components";

// 한글 글꼴 등록
Font.register({
  family: "malgunGothic",
  src: malgunGothic,
});

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

interface InquiryItem {
  no: number;
  itemType: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  itemRemark: string;
}

interface PDFDocumentProps {
  formValues: FormValues;
  items: InquiryItem[];
  selectedSupplierName: string;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderBottom: "1px solid #000000",
  },
  logo: {
    width: 50,
    height: 75,
    marginRight: 10,
  },
  headerInfo: {
    fontSize: 12,
    textAlign: "center",
  },
  inquiryInfoWrap: {
    flexDirection: "row",
    marginBottom: 20,
  },
  inquiryInfoColumn: {
    flex: 1,
    flexDirection: "column",
  },
  inquiryInfoText: {
    fontSize: 12,
    marginBottom: 5,
  },
  page: {
    padding: 20,
    fontFamily: "malgunGothic",
  },
  section: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: 700,
  },
  table: {
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  tableCol: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
    textAlign: "center",
  },
});

const PDFDocument = ({
  formValues,
  items,
  selectedSupplierName,
}: PDFDocumentProps) => {
  // Determine MAKER and TYPE from items
  const maker = items.find((item) => item.itemType === "MAKER");
  const type = items.find((item) => item.itemType === "TYPE");

  // Filter items that are either DESC or ITEM
  const filteredItems = items.filter(
    (item) => item.itemType === "DESC" || item.itemType === "ITEM"
  );

  return (
    <PDFViewer width="100%" height="600" style={{ margin: "20px 0" }}>
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Image src={logoUrl} style={styles.logo} />
            <View>
              <Text style={styles.headerInfo}>BAS KOREA CO.</Text>
              <Text style={styles.headerInfo}>
                43-4, Gyeongjeoncheon-ro 248beon-gil, Gangseo-gu, Busan Korea
                46719
              </Text>
              <Text style={styles.headerInfo}>
                Tel: +82-51-797-7078 Fax: +82-51-793-0635
              </Text>
              <Text style={styles.headerInfo}>Email: info@bas-korea.com</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.title}>견 적 의 뢰 서</Text>
          </View>
          <View style={styles.inquiryInfoWrap}>
            <View style={styles.inquiryInfoColumn}>
              <Text style={styles.inquiryInfoText}>
                MESSRS: {selectedSupplierName}
              </Text>
              <Text style={styles.inquiryInfoText}>
                VESSEL: {formValues.vesselName}
              </Text>
            </View>
            <View
              style={[styles.inquiryInfoColumn, { alignItems: "flex-end" }]}
            >
              <Text style={styles.inquiryInfoText}>
                OUR REF No: {formValues.refNumber}
              </Text>
              <Text style={styles.inquiryInfoText}>
                DATE: {dayjs(formValues.registerDate).format("YYYY-MM-DD")}
              </Text>
            </View>
          </View>
          <View style={styles.table}>
            {maker && (
              <View style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={[styles.tableCell, { textAlign: "left" }]}>
                    MAKER: {maker.itemName}
                  </Text>
                </View>
              </View>
            )}
            {type && (
              <View style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={[styles.tableCell, { textAlign: "left" }]}>
                    TYPE: {type.itemName}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>NO.</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>CODE</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>DESCRIPTION</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Q'TY</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>UNIT</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>비고</Text>
              </View>
            </View>
            {filteredItems.map((item) => (
              <View style={styles.tableRow} key={item.no}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.no}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.itemCode}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.itemName}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.qty}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.unit}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.itemRemark}</Text>
                </View>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
};

export default PDFDocument;
