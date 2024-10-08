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
import NotoSansRegular from "../../assets/font/NotoSansRegular.ttf";
import logoUrl from "../../assets/logo/baskorea_logo-removebg.png";
import {
  InvCharge,
  ItemDataType,
  SupplierInquiryDetailIF,
} from "../../types/types";

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
Font.register({
  family: "NotoSansRegular",
  src: NotoSansRegular,
});
Font.registerHyphenationCallback((word) => ["", word, ""]);

interface PDFDocumentProps {
  info: SupplierInquiryDetailIF;
  pdfHeader: string;
  viewMode: boolean;
  language: string;
  pdfFooter: string;
  finalTotals: {
    totalSalesAmountKRW: number;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountKRW: number;
    totalPurchaseAmountGlobal: number;
    totalProfit: number;
    totalProfitPercent: number;
  };
  dcInfo: { dcPercent: number; dcKrw: number; dcGlobal: number };
  invChargeList: InvCharge[] | null;
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
  footerMessage: {
    fontSize: 10,
    textAlign: "left",
    marginTop: 30,
    padding: "10px 0",
    borderTop: "1px dotted #000",
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
    fontSize: 8,
    textAlign: "left",
    wordBreak: "break-all",
  },
  tableTotalAmount: {
    marginLeft: "auto",
    width: 250,
    fontSize: 10,
    textAlign: "right",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "NotoSansRegular",
  },
  tableDCAmount: {
    marginLeft: "auto",
    width: 250,
    fontSize: 10,
    textAlign: "right",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "NotoSansRegular",
  },
  nonItemtypeCell: {
    marginLeft: 40,
    fontSize: 9,
    textDecoration: "underline",
    fontFamily: "NotoSerifKR",
  },
  pageNumber: {
    position: "absolute",
    fontSize: 10,
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "grey",
  },
  desctypeCell: {
    marginLeft: 125,
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
const renderTableRows = (items: ItemDataType[]) => {
  let itemIndex = 0;
  return items.map((item) => {
    const isItemType = item.itemType === "ITEM";
    const isDescType = item.itemType === "DESC";
    if (isItemType) {
      itemIndex += 1; // "ITEM" 타입일 때만 인덱스 증가
    }

    return (
      <View style={[styles.tableRow]} key={item.position} wrap={false}>
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
              <Text style={styles.tableCell}>
                {item.itemRemark !== ""
                  ? ""
                  : item.salesPriceGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
              </Text>
            </View>
            <View style={styles.tableMedCol}>
              <Text style={styles.tableCell}>
                {item.itemRemark !== ""
                  ? item.itemRemark
                  : item.salesAmountGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
              </Text>
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
  customerName: string,
  vesselName: string,
  docNumber: string,
  registerDate: string | dayjs.Dayjs,
  pdfHeader: string,
  language: string,
  refNumber: string
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
    <View>
      <Text style={styles.title}>
        {language === "KOR" ? "Q U O T A T I O N" : "Q U O T A T I O N"}
      </Text>
    </View>
    <View style={styles.inquiryInfoWrap}>
      <View style={styles.inquiryInfoColumn}>
        <Text style={styles.inquiryInfoText}>
          MESSERS: {customerName?.split("")}
        </Text>
        <Text style={[styles.inquiryInfoText]}>
          VESSEL NAME: {vesselName?.split("")}
        </Text>
        <Text style={[styles.inquiryInfoText, { marginBottom: 10 }]}>
          YOUR REF NO: {refNumber?.split("")}
        </Text>
      </View>
      <View style={[styles.inquiryInfoColumn, { alignItems: "flex-end" }]}>
        <Text style={styles.inquiryInfoText}>
          REF No: {docNumber?.split("")}
        </Text>
        <Text style={styles.inquiryInfoText}>
          {language === "KOR"
            ? "DATE: " +
              dayjs(registerDate).format("DD MMM, YYYY").toUpperCase()
            : "DATE: " +
              dayjs(registerDate).format("DD MMM, YYYY").toUpperCase()}
        </Text>
      </View>
    </View>
    <View>
      <Text style={styles.headerMessage}>{pdfHeader?.split("")}</Text>
    </View>
  </>
);

const OfferPDFDocument = ({
  info,
  pdfHeader,
  viewMode,
  language,
  pdfFooter,
  finalTotals,
  dcInfo,
  invChargeList,
}: PDFDocumentProps) => {
  const items = [...info.inquiryItemDetails].sort(
    (a, b) => a.position! - b.position!
  );
  const headerMessage = pdfHeader;
  const calculateTotalSalesAmount = (items: ItemDataType[]) => {
    return items.reduce((total, item) => total + item.salesAmountGlobal, 0);
  };
  const totalSalesAmountGlobal = calculateTotalSalesAmount(
    info.inquiryItemDetails
  );
  const dcAmountGlobal = totalSalesAmountGlobal * (dcInfo.dcPercent / 100);

  const pdfBody = (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader(
          logoUrl,
          info.customerName,
          info.vesselName,
          info.documentNumber || "",
          dayjs().format("YYYY-MM-DD"),
          headerMessage,
          language,
          info.refNumber
        )}
        <View
          style={{
            fontSize: 10,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            margin: "10px 0",
          }}
          fixed
          render={() => (
            <>
              <View>
                <Text
                  render={() => `OUR RED NO. : ${info.documentNumber}`}
                  style={{ textAlign: "right" }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text
                  render={() => {
                    switch (info.currencyType) {
                      case "USD":
                        return `UNIT USD $`;
                      case "EUR":
                        return `UNIT EUR €`;
                      case "INR":
                        return `UNIT INR ₹`;
                      case "JPY":
                        return `UNIT JPY ¥`;
                      default:
                        return ``;
                    }
                  }}
                  fixed
                  style={{ marginRight: 60, fontFamily: "NotoSansRegular" }}
                />
                <Text
                  render={({ pageNumber, totalPages }) =>
                    `PAGE: ${pageNumber} / ${totalPages}`
                  }
                  style={{ textAlign: "right" }}
                />
              </View>
            </>
          )}
        ></View>
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
              <Text style={styles.tableCell}>U/PRICE</Text>
            </View>
            <View style={styles.tableMedCol}>
              <Text style={styles.tableCell}>AMOUNT</Text>
            </View>
          </View>
          {renderTableRows(items)}
          <View
            style={[
              styles.tableTotalAmount,
              {
                marginTop: 20,
                borderTop: "1px solid #000",
                padding: "5px 0",
              },
            ]}
          >
            <Text wrap>T O T A L ({info.currencyType})</Text>
            <Text style={{ fontFamily: "NotoSansRegular" }} wrap>
              {(() => {
                switch (info.currencyType) {
                  case "USD":
                    return `$${totalSalesAmountGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}`;
                  case "EUR":
                    return `€${totalSalesAmountGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}`;
                  case "INR":
                    return `₹${totalSalesAmountGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}`;
                  case "JPY":
                    return `¥${totalSalesAmountGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}`;
                  default:
                    return `${totalSalesAmountGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}`;
                }
              })()}
            </Text>
          </View>
          {dcInfo.dcPercent && dcInfo.dcPercent !== 0 && (
            <View style={styles.tableDCAmount}>
              <Text wrap>DC AMT({dcInfo.dcPercent}%)</Text>
              <Text style={styles.tableTotalAmount} wrap>
                {(() => {
                  switch (info.currencyType) {
                    case "USD":
                      return `-$${dcAmountGlobal?.toFixed(2).toLocaleString()}`;
                    case "EUR":
                      return `-€${dcAmountGlobal?.toFixed(2).toLocaleString()}`;
                    case "INR":
                      return `-₹${dcAmountGlobal?.toFixed(2).toLocaleString()}`;
                    case "JPY":
                      return `-¥${dcAmountGlobal?.toFixed(2).toLocaleString()}`;
                    default:
                      return `-${dcAmountGlobal?.toFixed(2).toLocaleString()}`;
                  }
                })()}
              </Text>
            </View>
          )}
          {invChargeList && invChargeList.length > 0 && (
            <View>
              {invChargeList.map((charge) => (
                <View key={charge.invChargeId} style={styles.tableDCAmount}>
                  <Text wrap>{charge.customCharge?.split("")}</Text>
                  <Text style={styles.tableTotalAmount} wrap>
                    {(() => {
                      switch (info.currencyType) {
                        case "USD":
                          return `$${charge.chargePriceGlobal
                            ?.toFixed(2)
                            .toLocaleString()}`;
                        case "EUR":
                          return `€${charge.chargePriceGlobal
                            ?.toFixed(2)
                            .toLocaleString()}`;
                        case "INR":
                          return `₹${charge.chargePriceGlobal
                            ?.toFixed(2)
                            .toLocaleString()}`;
                        case "JPY":
                          return `¥${charge.chargePriceGlobal
                            ?.toFixed(2)
                            .toLocaleString()}`;
                        default:
                          return `${charge.chargePriceGlobal
                            ?.toFixed(2)
                            .toLocaleString()}`;
                      }
                    })()}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {(dcInfo.dcPercent ||
            (invChargeList && invChargeList.length > 0)) && (
            <View
              style={[
                styles.tableTotalAmount,
                {
                  marginTop: 20,
                  borderTop: "1px dotted #000",
                  borderBottom: "1px solid #000",
                  padding: "5px 0",
                },
              ]}
            >
              <Text wrap>G.TOTAL AMT</Text>
              <Text
                style={{
                  fontFamily: "NotoSansRegular",
                }}
                wrap
              >
                {(() => {
                  switch (info.currencyType) {
                    case "USD":
                      return `$${finalTotals.totalSalesAmountGlobal
                        ?.toFixed(2)
                        .toLocaleString()}`;
                    case "EUR":
                      return `€${finalTotals.totalSalesAmountGlobal
                        ?.toFixed(2)
                        .toLocaleString()}`;
                    case "INR":
                      return `₹${finalTotals.totalSalesAmountGlobal
                        ?.toFixed(2)
                        .toLocaleString()}`;
                    case "JPY":
                      return `¥${finalTotals.totalSalesAmountGlobal
                        ?.toFixed(2)
                        .toLocaleString()}`;
                    default:
                      return `${finalTotals.totalSalesAmountGlobal
                        ?.toFixed(2)
                        .toLocaleString()}`;
                  }
                })()}
              </Text>
            </View>
          )}
        </View>
        {pdfFooter && (
          <View>
            <Text style={styles.footerMessage}>{pdfFooter?.split("")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );

  if (viewMode) {
    return (
      <PDFViewer width="100%" height="600" style={{ margin: "20px 0" }}>
        {pdfBody}
      </PDFViewer>
    );
  }

  return pdfBody;
};

export default OfferPDFDocument;
