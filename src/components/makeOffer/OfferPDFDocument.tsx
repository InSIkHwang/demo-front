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
  FormValuesType,
  HeaderFormData,
  InvCharge,
  ItemDetailType,
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
  info: FormValuesType;
  items: ItemDetailType[];
  pdfHeader: HeaderFormData;
  viewMode: boolean;
  language: string;
  pdfFooter: {
    quotationRemarkId: number | null;
    quotationRemark: string;
  }[];
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

const baseTableCol = {
  borderRightWidth: 0.5,
  borderColor: "#000",
  padding: 5,
  alignItems: "flex-start" as const,
};

const baseDashTableCol = {
  borderRightWidth: 0.5,
  borderColor: "#000",
  padding: 5,
  alignItems: "flex-start" as const,
  backgroundColor: "#dbdbdb",
};

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
    fontSize: 9,
    textAlign: "left",
    padding: "2px 0",
    display: "flex",
    flexDirection: "row",
  },
  headerValue: {
    fontSize: 9,
    textAlign: "left",
    width: "100%",
  },
  headerLabel: {
    width: 150, // 라벨의 고정 너비
    textAlign: "left",
  },
  dottedLine: {
    borderBottom: "1px dotted #000",
    margin: "15px 0",
  },
  footerTitle: {
    fontSize: 9,
    textAlign: "left",
    padding: "10px 0",
  },
  footerMessage: {
    fontSize: 9,
    textAlign: "left",
    padding: "2px 0",
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
    fontSize: 9,
    marginBottom: 5,
    display: "flex",
    flexDirection: "row",
  },
  inquiryInfoLabel: {
    width: 70,
    textAlign: "left",
  },
  inquiryInfoValue: {
    textAlign: "left",
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
    ...baseTableCol,
    flex: 3,
  },
  tableMedCol: {
    ...baseTableCol,
    flex: 1.5,
  },
  tableSmallCol: {
    ...baseTableCol,
    flex: 0.5,
  },
  tableDashBigCol: {
    ...baseDashTableCol,
    flex: 3,
  },
  tableDashMedCol: {
    ...baseDashTableCol,
    flex: 1.5,
  },
  tableDashSmallCol: {
    ...baseDashTableCol,
    flex: 0.5,
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
    marginLeft: 40,
    fontSize: 8,
    color: "#34495e",
  },
});

// 번호를 결정하는 함수
const getDisplayNo = (itemType: string, itemIndex: number, indexNo: string) => {
  switch (itemType) {
    case "ITEM":
      return (itemIndex + 1).toString(); // 1-based index for ITEM type
    case "DASH":
      return indexNo;
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
const renderTableRows = (items: ItemDetailType[], language: string) => {
  let itemIndex = 0;
  return items.map((item) => {
    const isItemType = item.itemType === "ITEM";
    const isDashType = item.itemType === "DASH";
    const isDescType = item.itemType === "DESC";
    if (isItemType) {
      itemIndex += 1; // "ITEM" 타입일 때만 인덱스 증가
    }

    return (
      <View style={[styles.tableRow]} key={item.position} wrap={false}>
        {isItemType ? (
          <View
            style={[styles.tableSmallCol, { borderLeft: "0.5px solid #000" }]}
          >
            <Text style={styles.tableCell}>
              {getDisplayNo(item.itemType, itemIndex - 1, item.indexNo + "")}
            </Text>
          </View>
        ) : isDashType ? (
          <View
            style={[
              styles.tableDashSmallCol,
              { borderLeft: "0.5px solid #000" },
            ]}
          >
            <Text style={styles.tableCell}>
              {getDisplayNo(item.itemType, itemIndex - 1, item.indexNo + "")}
            </Text>
          </View>
        ) : null}
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
                  : language === "KOR"
                  ? item.salesPriceKRW?.toLocaleString("ko-KR")
                  : item.salesPriceGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
              </Text>
            </View>
            <View style={styles.tableMedCol}>
              <Text style={styles.tableCell}>
                {item.itemRemark !== ""
                  ? item.itemRemark
                  : language === "KOR"
                  ? item.salesAmountKRW?.toLocaleString("ko-KR")
                  : item.salesAmountGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
              </Text>
            </View>
          </>
        ) : isDashType ? (
          <>
            <View style={styles.tableDashMedCol}>
              <Text style={styles.tableCell}>{item.itemCode?.split("")}</Text>
            </View>
            <View style={styles.tableDashBigCol}>
              <Text style={styles.tableCell}>{item.itemName?.split("")}</Text>
            </View>
            <View style={styles.tableDashSmallCol}>
              <Text style={styles.tableCell}>{item.qty}</Text>
            </View>
            <View style={styles.tableDashSmallCol}>
              <Text style={styles.tableCell}>{item.unit}</Text>
            </View>
            <View style={styles.tableDashMedCol}>
              <Text style={styles.tableCell}>
                {item.itemRemark !== ""
                  ? ""
                  : language === "KOR"
                  ? item.salesPriceKRW?.toLocaleString("ko-KR")
                  : item.salesPriceGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
              </Text>
            </View>
            <View style={styles.tableDashMedCol}>
              <Text style={styles.tableCell}>
                {item.itemRemark !== ""
                  ? item.itemRemark
                  : language === "KOR"
                  ? item.salesAmountKRW?.toLocaleString("ko-KR")
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
                {item?.itemName?.split("")}
              </Text>
            ) : (
              <Text style={styles.nonItemtypeCell}>
                {item?.itemName?.split("")}
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
  pdfHeader: HeaderFormData,
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
        {language === "KOR" ? "견 적 서" : "Q U O T A T I O N"}
      </Text>
    </View>
    <View style={styles.inquiryInfoWrap}>
      <View style={styles.inquiryInfoColumn}>
        <View style={styles.inquiryInfoText}>
          <Text style={styles.inquiryInfoLabel}>MESSRS</Text>
          <Text style={styles.inquiryInfoValue}>
            : {customerName?.split("")}
          </Text>
        </View>
        <View style={styles.inquiryInfoText}>
          <Text style={styles.inquiryInfoLabel}>VESSEL NAME</Text>
          <Text style={styles.inquiryInfoValue}>: {vesselName?.split("")}</Text>
        </View>
        <View style={[styles.inquiryInfoText, { marginBottom: 10 }]}>
          <Text style={styles.inquiryInfoLabel}>YOUR REF No.</Text>
          <Text style={styles.inquiryInfoValue}>: {refNumber?.split("")}</Text>
        </View>
      </View>
      <View
        style={[
          styles.inquiryInfoColumn,
          { alignItems: "flex-end", textAlign: "right", flex: 0.5 },
        ]}
      >
        <View style={styles.inquiryInfoText}>
          <Text
            style={[styles.inquiryInfoLabel, { textAlign: "right", width: 50 }]}
          >
            REF No. {"   "}:
          </Text>
          <Text
            style={[styles.inquiryInfoValue, { textAlign: "right", width: 80 }]}
          >
            {docNumber?.split("")}
          </Text>
        </View>
        <View style={styles.inquiryInfoText}>
          <Text
            style={[styles.inquiryInfoLabel, { textAlign: "right", width: 50 }]}
          >
            DATE {"   "}:
          </Text>
          <Text
            style={[styles.inquiryInfoValue, { textAlign: "right", width: 80 }]}
          >
            {language === "KOR"
              ? dayjs(registerDate).format("YYYY-MM-DD")
              : dayjs(registerDate).format("DD MMM, YYYY").toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
    <View>
      {pdfHeader?.portOfShipment && (
        <View style={styles.headerMessage}>
          <Text style={styles.headerLabel}>PORT OF SHIPMENT</Text>
          <Text style={styles.headerValue}>: {pdfHeader.portOfShipment}</Text>
        </View>
      )}
      {pdfHeader?.incoterms && (
        <View style={styles.headerMessage}>
          <Text style={styles.headerLabel}>INCOTERMS</Text>
          <Text style={styles.headerValue}>: {pdfHeader.incoterms}</Text>
        </View>
      )}
      {pdfHeader?.deliveryTime && (
        <View style={styles.headerMessage}>
          <Text style={styles.headerLabel}>DELIVERY TIME</Text>
          <Text style={styles.headerValue}>: {pdfHeader.deliveryTime}</Text>
        </View>
      )}
      {pdfHeader?.termsOfPayment && (
        <View style={styles.headerMessage}>
          <Text style={styles.headerLabel}>TERMS OF PAYMENT</Text>
          <Text style={styles.headerValue}>: {pdfHeader.termsOfPayment}</Text>
        </View>
      )}
      {pdfHeader?.offerValidity && (
        <View style={styles.headerMessage}>
          <Text style={styles.headerLabel}>OFFER VALIDITY</Text>
          <Text style={styles.headerValue}>: {pdfHeader.offerValidity}</Text>
        </View>
      )}
      {pdfHeader?.partCondition && (
        <View style={styles.headerMessage}>
          <Text style={styles.headerLabel}>PART CONDITION</Text>
          <Text style={styles.headerValue}>: {pdfHeader.partCondition}</Text>
        </View>
      )}
      <View style={styles.dottedLine} />
    </View>
  </>
);

const OfferPDFDocument = ({
  info,
  items,
  pdfHeader,
  viewMode,
  language,
  pdfFooter,
  finalTotals,
  dcInfo,
  invChargeList,
}: PDFDocumentProps) => {
  const headerMessage = pdfHeader;
  const calculateTotalSalesAmount = (items: ItemDetailType[]) => {
    if (language === "KOR") {
      return items.reduce((total, item) => total + item.salesAmountKRW, 0);
    } else {
      return items.reduce((total, item) => total + item.salesAmountGlobal, 0);
    }
  };
  const totalSalesAmount = calculateTotalSalesAmount(items);
  const dcAmountGlobal = totalSalesAmount * (dcInfo.dcPercent / 100);

  const pdfBody = (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader(
          logoUrl,
          info.companyName,
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
          render={({ pageNumber }) => (
            <>
              <View>
                {pageNumber >= 2 && (
                  <Text
                    render={() => `OUR REF No. : ${info.documentNumber}`}
                    style={{ textAlign: "right" }}
                  />
                )}
              </View>
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text
                  render={() => {
                    if (language === "KOR") {
                      return `UNIT KRW ₩`;
                    } else {
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
              <Text style={styles.tableCell}>No.</Text>
            </View>
            <View style={styles.tableMedCol}>
              <Text style={styles.tableCell}>PART No.</Text>
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
          {renderTableRows(items, language)}
          <View
            wrap={false}
            style={[
              styles.tableTotalAmount,
              {
                marginTop: 20,
                borderTop: "1px solid #000",
                padding: "5px 0",
              },
            ]}
          >
            <Text wrap>
              T O T A L ({language === "KOR" ? "₩" : info.currencyType})
            </Text>
            <Text style={{ fontFamily: "NotoSansRegular" }} wrap>
              {language === "KOR"
                ? totalSalesAmount?.toLocaleString("ko-KR", {
                    style: "currency",
                    currency: "KRW",
                  })
                : totalSalesAmount?.toLocaleString("en-US", {
                    style: "currency",
                    currency: info.currencyType,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </Text>
          </View>
          {dcInfo.dcPercent && dcInfo.dcPercent !== 0 && (
            <View style={styles.tableDCAmount} wrap={false}>
              <Text wrap>DC AMT({dcInfo.dcPercent}%)</Text>
              <Text style={styles.tableTotalAmount} wrap>
                -
                {language === "KOR"
                  ? dcAmountGlobal?.toLocaleString("ko-KR", {
                      style: "currency",
                      currency: "KRW",
                    })
                  : dcAmountGlobal?.toLocaleString("en-US", {
                      style: "currency",
                      currency: info.currencyType,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </Text>
            </View>
          )}
          {invChargeList && invChargeList.length > 0 && (
            <View wrap={false}>
              {invChargeList.map((charge) => (
                <View key={charge.invChargeId} style={styles.tableDCAmount}>
                  <Text wrap>{charge.customCharge}</Text>
                  <Text style={styles.tableTotalAmount} wrap>
                    {language === "KOR"
                      ? Number(charge.chargePriceKRW)?.toLocaleString("ko-KR", {
                          style: "currency",
                          currency: "KRW",
                        })
                      : Number(charge.chargePriceGlobal)?.toLocaleString(
                          "en-US",
                          {
                            style: "currency",
                            currency: info.currencyType,
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {(dcInfo.dcPercent ||
            (invChargeList && invChargeList.length > 0)) && (
            <View
              wrap={false}
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
                {language === "KOR"
                  ? finalTotals.totalSalesAmountKRW?.toLocaleString("ko-KR", {
                      style: "currency",
                      currency: "KRW",
                    })
                  : finalTotals.totalSalesAmountGlobal?.toLocaleString(
                      "en-US",
                      {
                        style: "currency",
                        currency: info.currencyType,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
              </Text>
            </View>
          )}
        </View>
        {pdfFooter.length > 0 && (
          <View>
            <Text
              style={[
                styles.footerTitle,
                {
                  borderTop: "1px dotted #000",
                  fontWeight: "bold",
                  marginTop: 30,
                },
              ]}
            >
              ** REMARK
            </Text>
            {pdfFooter.map((footer, index) => (
              <Text
                key={index}
                style={[
                  styles.footerMessage,
                  {
                    borderTop: "none",
                  },
                ]}
              >
                {index + 1}. {footer.quotationRemark}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );

  if (viewMode) {
    return (
      <PDFViewer width="100%" height="800" style={{ margin: "20px 0" }}>
        {pdfBody}
      </PDFViewer>
    );
  }

  return pdfBody;
};

export default OfferPDFDocument;
