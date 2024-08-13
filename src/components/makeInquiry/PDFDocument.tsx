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
import { InquiryItem, VesselList } from "../../types/types";

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

interface PDFDocumentProps {
  formValues: FormValues;
  items: InquiryItem[];
  selectedSupplierName: string;
  vesselInfo: VesselList | null;
}

// 스타일 정의
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
  headerMessage: {
    fontSize: 12,
    textAlign: "left",
    padding: "10px 0",
    borderBottom: "1px dotted #000",
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
  tableBigCol: {
    flex: 3,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  tableMedCol: {
    flex: 1.5,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  tableSmallCol: {
    flex: 0.5,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
    textAlign: "center",
  },
});

// 번호를 결정하는 함수
const getDisplayNo = (itemType: string, itemIndex: number) => {
  if (itemType === "ITEM") {
    return (itemIndex + 1).toString(); // 1-based index for ITEM type
  }
  switch (itemType) {
    case "MAKER":
      return "MAKER";
    case "TYPE":
      return "TYPE";
    case "DESC":
      return "DESC";
    default:
      return "";
  }
};

const PDFDocument = ({
  formValues,
  items,
  selectedSupplierName,
  vesselInfo,
}: PDFDocumentProps) => {
  const headerMessage =
    "귀사의 무궁한 발전을 기원합니다.\n하기와 같이 견적서 외뢰하오니 빠른 회신 부탁드립니다.";
  let itemIndex = 0;

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
              <Text style={[styles.inquiryInfoText, { marginBottom: 10 }]}>
                VESSEL: {formValues.vesselName}
              </Text>
              <Text style={styles.inquiryInfoText}>
                IMO NO: {vesselInfo?.imoNumber}
              </Text>
              <Text style={styles.inquiryInfoText}>
                HULL NO: {vesselInfo?.hullNumber}
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
          <View style={styles.section}>
            <Text style={styles.headerMessage}>{headerMessage}</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableSmallCol}>
                <Text style={styles.tableCell}>NO.</Text>
              </View>
              <View style={styles.tableMedCol}>
                <Text style={styles.tableCell}>CODE</Text>
              </View>
              <View style={styles.tableBigCol}>
                <Text style={styles.tableCell}>DESCRIPTION</Text>
              </View>
              <View style={styles.tableSmallCol}>
                <Text style={styles.tableCell}>Q'TY</Text>
              </View>
              <View style={styles.tableSmallCol}>
                <Text style={styles.tableCell}>UNIT</Text>
              </View>
              <View style={styles.tableMedCol}>
                <Text style={styles.tableCell}>비고</Text>
              </View>
            </View>
            {items.map((item) => {
              const isItemType = item.itemType === "ITEM";
              if (isItemType) {
                itemIndex += 1; // "ITEM" 타입일 때만 인덱스 증가
              }

              return (
                <View style={styles.tableRow} key={item.no}>
                  <View style={styles.tableSmallCol}>
                    <Text style={styles.tableCell}>
                      {isItemType
                        ? getDisplayNo(item.itemType, itemIndex - 1)
                        : getDisplayNo(item.itemType, 0)}
                    </Text>
                  </View>
                  {isItemType && (
                    <>
                      <View style={styles.tableMedCol}>
                        <Text style={styles.tableCell}>{item.itemCode}</Text>
                      </View>
                      <View style={styles.tableBigCol}>
                        <Text style={styles.tableCell}>{item.itemName}</Text>
                      </View>
                      <View style={styles.tableSmallCol}>
                        <Text style={styles.tableCell}>{item.qty}</Text>
                      </View>
                      <View style={styles.tableSmallCol}>
                        <Text style={styles.tableCell}>{item.unit}</Text>
                      </View>
                      <View style={styles.tableMedCol}>
                        <Text style={styles.tableCell}>{item.itemRemark}</Text>
                      </View>
                    </>
                  )}
                  {!isItemType && (
                    <>
                      <View style={[styles.tableBigCol, { flex: 7.65 }]}>
                        <Text style={styles.tableCell}>{item.itemName}</Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
};

export default PDFDocument;
