import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  PDFViewer,
} from "@react-pdf/renderer";
import dayjs from "dayjs";
import malgunGothic from "../../assets/font/malgun.ttf";
import NotoSerifKRExtraBold from "../../assets/font/NotoSerifKR-ExtraBold.ttf";
import NotoSerifKR from "../../assets/font/NotoSerifKR-Medium.ttf";
import logoUrl from "../../assets/logo/baskorea_logo-removebg.png";
import { InquiryItem, VesselList } from "../../types/types";

// 한글 글꼴 등록
Font.register({
  family: "malgunGothic",
  src: malgunGothic,
});
Font.register({
  family: "NotoSerifKRExtraBold",
  src: NotoSerifKRExtraBold,
});
Font.register({
  family: "NotoSerifKR",
  src: NotoSerifKR,
});
Font.registerHyphenationCallback((word) => ["", word, ""]);

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
  vesselInfo: VesselList | null;
  pdfHeader: string;
  supplier: {
    id: number;
    name: string;
    korName: string;
    communicationLanguage: string;
  };
  viewMode: boolean;
}

// 스타일 정의
const styles = StyleSheet.create({
  header: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderBottom: "1px solid #000000",
  },
  logoWrap: {
    width: 400,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid #000",
  },
  logo: {
    width: 40,
    height: 60,
    marginRight: 10,
  },
  logoTitle: {
    fontSize: 24,
    fontFamily: "NotoSerifKRExtraBold",
  },
  headerInfo: {
    fontSize: 8,
    textAlign: "center",
  },
  headerMessage: {
    fontSize: 10,
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
    fontSize: 10,
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
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "NotoSerifKR",
  },
  table: {
    flexDirection: "column",
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#000",
  },
  tableBigCol: {
    flex: 3,
    borderRightWidth: 0.5,
    borderColor: "#000",
    padding: 5,
    alignItems: "flex-start",
  },
  tableMedCol: {
    flex: 1.5,
    borderRightWidth: 0.5,
    borderColor: "#000",
    padding: 5,
  },
  tableSmallCol: {
    flex: 0.5,
    borderRightWidth: 0.5,
    borderColor: "#000",
    padding: 5,
  },
  tableCell: {
    fontSize: 9,
    textAlign: "left",
  },
  nonItemtypeCell: {
    marginLeft: 40,
    fontSize: 9,
    textDecoration: "underline",
    fontFamily: "NotoSerifKR",
  },
  desctypeCell: {
    marginLeft: 155,
    fontSize: 9,
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

// 테이블 행을 렌더링하는 함수
const renderTableRows = (items: InquiryItem[]) => {
  let itemIndex = 0;
  return items.map((item) => {
    const isItemType = item.itemType === "ITEM";
    const isDescType = item.itemType === "DESC";
    if (isItemType) {
      itemIndex += 1; // "ITEM" 타입일 때만 인덱스 증가
    }

    return (
      <View style={styles.tableRow} key={item.position}>
        {isItemType && (
          <View
            style={[styles.tableSmallCol, { borderLeft: "0.5px solid #000" }]}
          >
            <Text style={styles.tableCell}>
              {getDisplayNo(item.itemType, itemIndex - 1)}
            </Text>
          </View>
        )}
        {isItemType ? (
          <>
            <View style={styles.tableMedCol}>
              <Text style={styles.tableCell}>{item.itemCode?.split("")}</Text>
            </View>
            <View style={styles.tableBigCol}>
              <Text style={styles.tableCell}>{item.itemName?.split("")}</Text>
            </View>
            <View style={styles.tableSmallCol}>
              <Text style={styles.tableCell}>{item.qty}</Text>
            </View>
            <View style={styles.tableSmallCol}>
              <Text style={styles.tableCell}>{item.unit}</Text>
            </View>
            <View style={styles.tableMedCol}>
              <Text style={styles.tableCell}>{item.itemRemark?.split("")}</Text>
            </View>
          </>
        ) : (
          <View
            style={[
              styles.tableBigCol,
              { flex: 1, borderLeft: "0.5px solid #000" },
            ]}
          >
            {isDescType ? (
              <Text style={styles.desctypeCell}>
                {item.itemName?.split("")}
              </Text>
            ) : (
              <Text style={styles.nonItemtypeCell}>
                {item.itemName?.split("")}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  });
};

// 헤더를 렌더링하는 함수
const renderHeader = (
  logoUrl: string,
  supplier: {
    id: number;
    name: string;
    korName: string;
    communicationLanguage: string;
  },
  vesselName: string,
  vesselInfo: VesselList | null,
  docNumber: string,
  registerDate: string | dayjs.Dayjs,
  pdfHeader: string
) => (
  <>
    <View style={styles.header}>
      <View style={styles.logoWrap}>
        <Image src={logoUrl} style={styles.logo} />
        <Text style={styles.logoTitle}>BAS KOREA CO.</Text>
      </View>
      <Text style={styles.headerInfo}>
        43-4, Gyeongjeoncheon-ro 248beon-gil, Gangseo-gu, Busan Korea / 46719
      </Text>
      <Text style={styles.headerInfo}>
        Tel: +82-51-797-7078 Fax: +82-51-793-0635
      </Text>
      <Text style={styles.headerInfo}>Email: info@bas-korea.com</Text>
    </View>
    <View style={styles.section}>
      <Text style={styles.title}>
        {supplier?.communicationLanguage === "KOR"
          ? "견 적 의 뢰 서"
          : "I N Q U I R Y"}
      </Text>
    </View>
    <View style={styles.inquiryInfoWrap}>
      <View style={styles.inquiryInfoColumn}>
        <Text style={styles.inquiryInfoText}>
          MESSRS:{" "}
          {supplier?.communicationLanguage === "KOR"
            ? supplier?.korName || ""
            : supplier?.name || ""}
        </Text>
        {vesselName.trim().toUpperCase() !== "UNKNOWN" && (
          <>
            <Text style={[styles.inquiryInfoText, { marginBottom: 10 }]}>
              VESSEL: {vesselName}
            </Text>
            {vesselInfo?.imoNumber && (
              <Text style={styles.inquiryInfoText}>
                IMO NO: {vesselInfo?.imoNumber}
              </Text>
            )}
            {vesselInfo?.hullNumber && (
              <Text style={styles.inquiryInfoText}>
                HULL NO: {vesselInfo?.hullNumber}
              </Text>
            )}
            {vesselInfo?.shipYard && (
              <Text style={styles.inquiryInfoText}>
                SHIPYARD: {vesselInfo?.shipYard}
              </Text>
            )}
            {vesselInfo?.countryOfManufacture && (
              <Text style={styles.inquiryInfoText}>
                NATIONALITY: {vesselInfo?.countryOfManufacture}
              </Text>
            )}
          </>
        )}
      </View>
      <View style={[styles.inquiryInfoColumn, { alignItems: "flex-end" }]}>
        <Text style={styles.inquiryInfoText}>
          OUR REF No: {docNumber?.split("")}
        </Text>
        <Text style={styles.inquiryInfoText}>
          {supplier?.communicationLanguage === "KOR"
            ? "DATE: " + dayjs(registerDate).format("YYYY-MM-DD") ||
              "DATE: " + dayjs().format("YYYY-MM-DD")
            : "DATE: " +
                dayjs(registerDate).format("DD MMM, YYYY").toUpperCase() ||
              "DATE: " + dayjs().format("DD MMM, YYYY").toUpperCase()}
        </Text>
      </View>
    </View>
    <View style={styles.section}>
      <Text style={styles.headerMessage}>{pdfHeader?.split("")}</Text>
    </View>
  </>
);

const PDFDocument = ({
  formValues,
  items,
  vesselInfo,
  pdfHeader,
  supplier,
  viewMode,
}: PDFDocumentProps) => {
  const sortedItems = [...items].sort((a, b) => a.position! - b.position!);
  const headerMessage = pdfHeader;
  if (viewMode) {
    console.log(supplier);

    return (
      <PDFViewer width="100%" height="600" style={{ margin: "20px 0" }}>
        <Document>
          <Page size="A4" style={styles.page}>
            {renderHeader(
              logoUrl,
              supplier,
              formValues.vesselName,
              vesselInfo,
              formValues.docNumber,
              dayjs().format("YYYY-MM-DD"),
              headerMessage
            )}
            <View style={styles.table}>
              <View
                style={[
                  styles.tableRow,
                  {
                    borderBottom: "1px solid #000",
                    borderTop: "1px solid #000",
                  },
                ]}
                fixed
              >
                <View
                  style={[
                    styles.tableSmallCol,
                    { borderLeft: "0.5px solid #000" },
                  ]}
                >
                  <Text style={styles.tableCell}>NO.</Text>
                </View>
                <View style={styles.tableMedCol}>
                  <Text style={styles.tableCell}>PART NO.</Text>
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
                  <Text style={styles.tableCell}>REMARK</Text>
                </View>
              </View>
              {renderTableRows(sortedItems)}
            </View>
          </Page>
        </Document>
      </PDFViewer>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader(
          logoUrl,
          supplier,
          formValues.vesselName,
          vesselInfo,
          formValues.docNumber,
          dayjs().format("YYYY-MM-DD"),
          headerMessage
        )}
        <View style={styles.table}>
          <View
            style={[
              styles.tableRow,
              {
                borderBottom: "1px solid #000",
                borderTop: "1px solid #000",
              },
            ]}
            fixed
          >
            <View
              style={[styles.tableSmallCol, { borderLeft: "0.5px solid #000" }]}
            >
              <Text style={styles.tableCell}>NO.</Text>
            </View>
            <View style={styles.tableMedCol}>
              <Text style={styles.tableCell}>PART NO.</Text>
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
              <Text style={styles.tableCell}>REMARK</Text>
            </View>
          </View>
          {renderTableRows(sortedItems)}
        </View>
      </Page>
    </Document>
  );
};

export default PDFDocument;
