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
  Svg,
  Path,
} from "@react-pdf/renderer";
import { Style } from "@react-pdf/types";
import dayjs from "dayjs";
import malgunGothic from "../../assets/font/malgun.ttf";
import malgunGothicBold from "../../assets/font/malgunbd.ttf";
import NotoSerifKRExtraBold from "../../assets/font/NotoSerifKR-ExtraBold.ttf";
import NotoSerifKR from "../../assets/font/NotoSerifKR-Medium.ttf";
import NotoSansExtraBold from "../../assets/font/NotoSansExtraBold.ttf";
import NotoSansBold from "../../assets/font/NotoSansBold.ttf";
import logoUrl from "../../assets/logo/withoutTextLogo.png";
import simpleLogoUrl from "../../assets/logo/simpleLogo.png";
import ORIGINAL from "../../assets/img/ORIGINAL.png";
import COPY from "../../assets/img/COPY.png";
import {
  FormValuesType,
  InvCharge,
  OrderItemDetail,
  OrderAckHeaderFormData,
  InvoiceDocument,
  InvoiceRemarkDetail,
  InvoiceHeaderDetail,
} from "../../types/types";

// 한글 글꼴 등록
Font.register({
  family: "malgunGothic",
  src: malgunGothic,
});
Font.register({
  family: "malgunGothicBold",
  src: malgunGothicBold,
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
  family: "NotoSansExtraBold",
  src: NotoSansExtraBold,
});
Font.register({
  family: "NotoSansBold",
  src: NotoSansBold,
});
Font.registerHyphenationCallback((word) => ["", word, ""]);

interface InvoicePDFDocumentProps {
  info: InvoiceDocument;
  items: OrderItemDetail[];
  pdfHeader: InvoiceHeaderDetail;
  viewMode: boolean;
  language: string;
  pdfFooter: InvoiceRemarkDetail[];
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
  invoiceNumber: string;
  pdfType: string;
  originalChecked: boolean;
  itemType: string;
}

const COLORS = {
  primary: "#142952",
  secondary: "#172952",
  gray: "#666666",
  darkGray: "#323232",
  lightGray: "#828282",
  background: "#dbdbdb",
  highlight: "#d1ebf9",
} as const;

// 테이블 컬럼 기본 스타일
const baseTableCol = {
  padding: "5px 0",
  alignItems: "flex-start" as const,
  border: "none",
};

const baseDashTableCol = {
  ...baseTableCol,
  backgroundColor: COLORS.background,
  height: "100%",
};

// 컬럼 크기 설정
const columnSizes = {
  big: { flex: 2.95, flexGrow: 1, minWidth: 150 },
  med: { flex: 1, paddingRight: 5 },
  price: { flex: 0.55, maxWidth: 100, alignItems: "center" as const },
  small: { flex: 0.2, alignItems: "center" as const },
  delivery: { flex: 0.35, alignItems: "center" as const },
  desc: { flex: 3, border: "none", padding: "0 0 5px 0" },
};

// 스타일 생성 함수
const createColumnStyle = (
  size: keyof typeof columnSizes,
  isDash: boolean = false
) => ({
  ...(isDash ? baseDashTableCol : baseTableCol),
  ...columnSizes[size],
});

// 스타일 정의
const styles = StyleSheet.create({
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  contentWrapper: {
    flex: 0.9,
    position: "relative",
  },
  logoTitle: {
    fontSize: 30,
    fontFamily: "malgunGothicBold",
    color: "#142952",
  },
  titleContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerInfo: {
    width: 180,
    fontSize: 9,
    textAlign: "left",
    marginLeft: 8,
  },
  headerAmountInfoWrap: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    padding: 5,
    color: "#fff",
    width: "95%", // 부모 요소의 절반 너비만 사용
    alignSelf: "center", // 왼쪽 정렬
    overflow: "hidden", // 추가
    height: 30, // 높이 고정
  },
  headerAmountInfo: {
    width: "100%",
    fontSize: 12,
    fontFamily: "malgunGothicBold",
  },
  headerMessage: {
    fontSize: 10,
    textAlign: "left",
    padding: "10px 0",
  },
  inquiryInfoWrap: {
    flexDirection: "row",
    marginBottom: 20,
  },
  inquiryInfoColumn: {
    flex: 1,
    flexDirection: "column",
  },
  inquiryTotalColumn: {
    flexDirection: "column",
  },
  inquiryPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "7px 0",
    lineHeight: 1.2,
  },
  inquiryPriceLabel: {
    fontSize: 10,
  },
  inquiryPriceValue: {
    fontSize: 11,
    fontFamily: "NotoSansBold",
  },
  inquiryInfoBox: {
    borderLeft: "8px solid #172952",
    marginBottom: 15,
    paddingLeft: 10,
  },
  inquiryInfoText: {
    fontSize: 9,
    marginBottom: 5,
    display: "flex",
    flexDirection: "row",
  },
  inquiryInfoTitle: {
    width: 200,
    textAlign: "left",
    fontSize: 10,
    marginBottom: 3,
    fontFamily: "malgunGothicBold",
  },
  inquiryInfoValueBold: {
    fontFamily: "malgunGothicBold",
    color: "#142952",
  },
  inquiryInfoLabel: {
    width: 70,
    textAlign: "left",
  },
  inquiryInfoValue: {
    width: 190,
    textAlign: "left",
    paddingLeft: 5,
  },
  headerInfoWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  page: {
    padding: 20,
    fontFamily: "malgunGothic",
  },
  section: {
    marginBottom: 10,
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

  title: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "NotoSerifKR",
  },
  table: {
    flexDirection: "column",
    borderColor: "#142952",
    marginBottom: 20, // 테이블 하단 여백 추가
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    alignItems: "center",
    borderColor: "#142952",
  },
  // 테이블 컬럼 스타일
  tableDescCol: createColumnStyle("desc"),
  tableBigCol: createColumnStyle("big"),
  tableMedCol: createColumnStyle("med"),
  tablePriceCol: createColumnStyle("price"),
  tableSmallCol: createColumnStyle("small"),
  tableDeliveryCol: createColumnStyle("delivery"),

  // 대시 테이블 컬럼 스타일
  tableDashBigCol: createColumnStyle("big", true),
  tableDashMedCol: createColumnStyle("med", true),
  tableDashPriceCol: createColumnStyle("price", true),
  tableDashSmallCol: createColumnStyle("small", true),
  tableDashDeliveryCol: createColumnStyle("delivery", true),
  tableHeaderCell: {
    fontSize: 9,
    textAlign: "left",
    margin: "1px 0",
    fontFamily: "malgunGothicBold",
  },
  tableCell: {
    fontSize: 9,
    textAlign: "left",
    margin: "1px 0",
    lineHeight: 1.8,
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
    marginLeft: 25,
    fontSize: 9,
    fontFamily: "malgunGothicBold",
    lineHeight: 1.8,
    backgroundColor: "#d1ebf9", // 노란색 배경 예시
    padding: 2,
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
    marginLeft: 3,
    fontSize: 9,
    color: "#142952",
    lineHeight: 1.8,
  },

  footer: {
    flex: 0.05,
    height: 40,
    position: "absolute",
    bottom: 15,
    left: 20,
    right: 20,
    fontSize: 8,
    color: "#666",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  footerText: {
    color: "#323232",
    fontSize: 9,
    textAlign: "right",
    marginBottom: 2,
  },
  footerInfoWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  footerCompanyName: {
    fontSize: 16,
    color: "#828282",
    fontFamily: "malgunGothicBold",
  },
  footerCertification: {
    fontSize: 9,
    color: "#323232",
  },
  footerCertificationLabel: {
    fontSize: 9,
    color: "#323232",
    fontFamily: "malgunGothicBold",
  },
  stampWrapper: {
    position: "relative",
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

const DiagonalLine = ({
  language,
  pdfType,
}: {
  language: string;
  pdfType: string;
}) =>
  pdfType === "PROFORMAINVOICE" ? (
    <Svg width={200} height={8}>
      <Path d="M4 0 L200 0 L200 8 L0 8 Z" fill="#142952" />
    </Svg>
  ) : (
    <Svg width={350} height={8}>
      <Path d="M4 0 L350 0 L350 8 L0 8 Z" fill="#142952" />
    </Svg>
  );

const DescriptionIcon = () => (
  <Svg width={12} height={12} style={{ marginLeft: 25, bottom: 5 }}>
    <Path
      d="M2 2 L2 8 L8 8 M6 6 L8 8 L6 10"
      stroke="#142952"
      strokeWidth="1.5"
      fill="none"
    />
  </Svg>
);

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
const renderTableRows = (items: OrderItemDetail[], language: string) => {
  let itemIndex = 0;
  return items.map((item) => {
    const isItemType = item.itemType === "ITEM";
    const isDashType = item.itemType === "DASH";
    const isDescType = item.itemType === "DESC";
    const isLastRow = item.position === items.length;
    if (isItemType) {
      itemIndex += 1; // "ITEM" 타입일 때만 인덱스 증가
    }

    return (
      <View
        style={[
          styles.tableRow,
          isDescType
            ? ({ border: "none", borderTopWidth: 0 } as Style)
            : ({} as Style),
          isLastRow ? ({ borderBottomWidth: 0.5 } as Style) : ({} as Style),
        ]}
        key={item.position}
        wrap={false}
      >
        {isItemType ? (
          <View style={[styles.tableSmallCol, { flex: 0.28 }]}>
            <Text style={styles.tableCell}>
              {getDisplayNo(item.itemType, itemIndex - 1, item.indexNo + "")}
            </Text>
          </View>
        ) : isDashType ? (
          <View style={[styles.tableDashSmallCol, { flex: 0.28 }]}>
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
              <Text style={styles.tableCell}>{item.itemName}</Text>
            </View>
            <View style={[styles.tableSmallCol, { alignItems: "flex-end" }]}>
              <Text style={styles.tableCell}>{item.qty}</Text>
            </View>
            <View style={[styles.tableSmallCol, { flex: 0.28 }]}>
              <Text style={styles.tableCell}>{item.unit}</Text>
            </View>
            <View style={[styles.tablePriceCol]}>
              <Text style={styles.tableCell}>
                {item.itemRemark
                  ? " "
                  : language === "KOR"
                  ? item.salesPriceKRW?.toLocaleString("ko-KR")
                  : item.salesPriceGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
              </Text>
            </View>
            <View style={[styles.tablePriceCol]}>
              <Text style={styles.tableCell}>
                {item.itemRemark
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
              <Text style={styles.tableCell}>
                {item.itemCode === "" ? " " : item.itemCode?.split("")}
              </Text>
            </View>
            <View style={styles.tableDashBigCol}>
              <Text style={styles.tableCell}>
                {item.itemName === "" ? " " : item.itemName?.split("")}
              </Text>
            </View>
            <View
              style={[styles.tableDashSmallCol, { alignItems: "flex-end" }]}
            >
              <Text style={styles.tableCell}>{item.qty}</Text>
            </View>
            <View style={[styles.tableDashSmallCol, { flex: 0.28 }]}>
              <Text style={styles.tableCell}>{item.unit || " "}</Text>
            </View>
            <View style={[styles.tableDashPriceCol]}>
              <Text style={styles.tableCell}>
                {item.itemRemark
                  ? " "
                  : language === "KOR"
                  ? item.salesPriceKRW?.toLocaleString("ko-KR")
                  : item.salesPriceGlobal?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
              </Text>
            </View>
            <View style={[styles.tableDashPriceCol, { alignItems: "center" }]}>
              <Text style={styles.tableCell}>
                {item.itemRemark
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
          <>
            {isDescType ? (
              <View style={[styles.tableDescCol]}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <DescriptionIcon />
                  <Text style={styles.desctypeCell}>
                    {item?.itemName?.split("")}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.tableBigCol]}>
                <Text style={styles.nonItemtypeCell}>
                  {item?.itemName?.split("")}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  });
};

// 헤더를 렌더링하는 함수
const renderHeader = (
  logoUrl: string,
  vesselName: string,
  pdfHeader: InvoiceHeaderDetail,
  language: string,
  refNumber: string,
  imoNo: string,
  invoiceNumber: string,
  pdfType: string,
  originalChecked: boolean,
  itemType: string
) => (
  <>
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.logoTitle}>
          {pdfType === "INVOICE"
            ? "INVOICE"
            : pdfType === "PROFORMAINVOICE"
            ? "PROFORMA INVOICE"
            : "CREDIT NOTE"}
        </Text>
        <DiagonalLine language={language} pdfType={pdfType} />
      </View>
      <View style={styles.titleContainer}>
        <Text></Text>
        <View>
          <Image
            src={logoUrl}
            style={{
              position: "absolute",
              width: 230,
              height: 230,
              opacity: 0.1,
              right: -25,
              top: -50,
              objectFit: "contain",
              alignSelf: "center",
              zIndex: -1,
            }}
          />
          <Text style={styles.logoTitle}>BAS KOREA</Text>
        </View>
      </View>
    </View>
    <View style={styles.inquiryInfoWrap}>
      <View style={styles.inquiryInfoColumn}>
        <View style={[styles.inquiryInfoBox, { paddingBottom: 10 }]}>
          <View style={styles.inquiryInfoText}>
            <Text style={styles.inquiryInfoTitle}>MESSRS</Text>
          </View>
          <View style={styles.inquiryInfoText}>
            <Text style={{ lineHeight: 1.5 }}>{pdfHeader?.messrs || ""}</Text>
          </View>
        </View>
        <View style={styles.inquiryInfoBox}>
          <View style={styles.inquiryInfoText}>
            <Text style={styles.inquiryInfoTitle}>VESSEL</Text>
          </View>
          <View style={styles.inquiryInfoText}>
            <Text style={styles.inquiryInfoLabel}>Name</Text>
            <Text style={{ lineHeight: 1.2 }}>{vesselName || ""}</Text>
          </View>
          <View style={styles.inquiryInfoText}>
            <Text style={styles.inquiryInfoLabel}>IMO No.</Text>
            <Text style={{ lineHeight: 1.2 }}>{imoNo || ""}</Text>
          </View>
        </View>
        <View style={styles.inquiryInfoBox}>
          <View style={styles.inquiryInfoText}>
            <Text style={styles.inquiryInfoTitle}>INVOICE</Text>
          </View>
          <View style={styles.inquiryInfoText}>
            <Text style={styles.inquiryInfoLabel}>Invoice No.</Text>
            <Text style={styles.inquiryInfoValue}>
              <Text style={styles.inquiryInfoValue}>
                {itemType !== "DEFAULT"
                  ? `${invoiceNumber}-${itemType.charAt(0)}`
                  : invoiceNumber}
              </Text>
            </Text>
          </View>
          <View style={styles.inquiryInfoText}>
            <Text style={styles.inquiryInfoLabel}>Your Ref No.</Text>
            <Text style={styles.inquiryInfoValue}>{refNumber?.split("")}</Text>
          </View>
          <View style={styles.inquiryInfoText}>
            <Text style={styles.inquiryInfoLabel}>Date</Text>
            <Text style={styles.inquiryInfoValue}>
              {pdfHeader?.invoiceDate
                ? dayjs(pdfHeader?.invoiceDate)
                    .format("DD MMM, YYYY")
                    .toUpperCase()
                : ""}
            </Text>
          </View>
          <View style={styles.inquiryInfoText}>
            <Text style={styles.inquiryInfoLabel}>Payment Term</Text>
            <Text style={styles.inquiryInfoValue}>
              {pdfHeader?.termsOfPayment?.split("")}
            </Text>
          </View>
          <View style={styles.inquiryInfoText}>
            <Text style={styles.inquiryInfoLabel}>Due Date</Text>
            <Text style={styles.inquiryInfoValue}>
              {pdfHeader?.dueDate
                ? dayjs(pdfHeader?.dueDate).format("DD MMM, YYYY").toUpperCase()
                : ""}
            </Text>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.inquiryInfoColumn,
          { alignItems: "flex-end", flex: 0.6 },
        ]}
      >
        <View style={styles.headerInfoWrap}>
          <Svg
            width="6"
            height="10"
            viewBox="0 0 19 31"
            style={{ marginHorizontal: 1.5 }}
          >
            <Path
              d="M9.65864 0.897949C4.61424 0.897949 0.526855 4.9689 0.526855 10.0115C0.526855 18.7305 9.65864 30.1014 9.65864 30.1014C9.65864 30.1014 18.7904 18.7287 18.7904 10.0115C18.7904 4.97073 14.703 0.897949 9.65864 0.897949ZM9.65864 15.054C8.35081 15.054 7.09655 14.5345 6.17178 13.6097C5.24701 12.685 4.72748 11.4307 4.72748 10.1229C4.72748 8.81505 5.24701 7.56079 6.17178 6.63602C7.09655 5.71125 8.35081 5.19171 9.65864 5.19171C10.9665 5.19171 12.2207 5.71125 13.1455 6.63602C14.0703 7.56079 14.5898 8.81505 14.5898 10.1229C14.5898 11.4307 14.0703 12.685 13.1455 13.6097C12.2207 14.5345 10.9665 15.054 9.65864 15.054Z"
              fill="#323232"
            />
          </Svg>
          <Text style={styles.headerInfo}>
            43-4, Gyeongjeoncheon-ro 248beon-gil,
            <br />
            Gangseo-gu, Busan Korea / 46719
          </Text>
        </View>
        <View style={styles.headerInfoWrap}>
          <Svg width="8" height="9" viewBox="0 0 24 25" fill="none">
            <Path
              d="M20.9989 0.616699H2.60151C1.93615 0.616699 1.29804 0.884976 0.827564 1.36251C0.357086 1.84005 0.0927734 2.48773 0.0927734 3.16306L0.0927734 21.8364C0.0927734 22.5117 0.357086 23.1594 0.827564 23.6369C1.29804 24.1145 1.93615 24.3828 2.60151 24.3828H20.9989C21.6642 24.3828 22.3023 24.1145 22.7728 23.6369C23.2433 23.1594 23.5076 22.5117 23.5076 21.8364V3.16306C23.5076 2.48773 23.2433 1.84005 22.7728 1.36251C22.3023 0.884976 21.6642 0.616699 20.9989 0.616699ZM20.1422 16.9224L19.3583 20.3706C19.3184 20.546 19.2213 20.7024 19.0826 20.8144C18.9439 20.9265 18.7719 20.9875 18.5947 20.9876C10.2322 20.9876 3.43775 14.1066 3.43775 5.60333C3.44397 5.42511 3.50638 5.25363 3.61581 5.11411C3.72523 4.97459 3.87588 4.8744 4.04559 4.82828L7.44284 4.03254C7.50079 4.0201 7.55975 4.01317 7.61897 4.01185C7.77057 4.01962 7.91737 4.06843 8.04411 4.15323C8.17085 4.23803 8.27291 4.35571 8.33971 4.49407L9.90767 8.20751C9.94607 8.30764 9.96745 8.41365 9.97091 8.52104C9.95814 8.7566 9.85495 8.9777 9.68345 9.13694L7.70312 10.7815C8.90303 13.3628 10.9499 15.4403 13.4931 16.6583L15.1133 14.6482C15.2702 14.4742 15.488 14.3694 15.7201 14.3565C15.8259 14.3599 15.9303 14.3816 16.029 14.4206L19.6875 16.0121C19.8239 16.0798 19.9399 16.1834 20.0235 16.3121C20.107 16.4407 20.1551 16.5898 20.1626 16.7437C20.1616 16.8038 20.1548 16.8637 20.1422 16.9224Z"
              fill="#323232"
            />
          </Svg>
          <Text style={styles.headerInfo}>Tel +82-51-797-7078</Text>
        </View>
        <View style={styles.headerInfoWrap}>
          <Svg width="9" height="7" viewBox="0 0 27 22" fill="none">
            <Path
              d="M22.9501 6.47059H21.6001V0H8.1001V18.7647V20.7059H27.0001V10.3529C27.0001 8.20471 25.1911 6.47059 22.9501 6.47059ZM10.8001 2.58824H18.9001V6.47059H10.8001V2.58824ZM16.2001 16.8235H10.8001V10.3529H16.2001V16.8235ZM18.9001 16.8235C18.1576 16.8235 17.5501 16.2412 17.5501 15.5294C17.5501 14.8176 18.1576 14.2353 18.9001 14.2353C19.6426 14.2353 20.2501 14.8176 20.2501 15.5294C20.2501 16.2412 19.6426 16.8235 18.9001 16.8235ZM18.9001 12.9412C18.1576 12.9412 17.5501 12.3588 17.5501 11.6471C17.5501 10.9353 18.1576 10.3529 18.9001 10.3529C19.6426 10.3529 20.2501 10.9353 20.2501 11.6471C20.2501 12.3588 19.6426 12.9412 18.9001 12.9412ZM22.9501 16.8235C22.2076 16.8235 21.6001 16.2412 21.6001 15.5294C21.6001 14.8176 22.2076 14.2353 22.9501 14.2353C23.6926 14.2353 24.3001 14.8176 24.3001 15.5294C24.3001 16.2412 23.6926 16.8235 22.9501 16.8235ZM22.9501 12.9412C22.2076 12.9412 21.6001 12.3588 21.6001 11.6471C21.6001 10.9353 22.2076 10.3529 22.9501 10.3529C23.6926 10.3529 24.3001 10.9353 24.3001 11.6471C24.3001 12.3588 23.6926 12.9412 22.9501 12.9412Z"
              fill="#323232"
            />
            <Path
              d="M3.375 5.17651C1.512 5.17651 0 6.62593 0 8.41181V18.7647C0 20.5506 1.512 22 3.375 22C5.238 22 6.75 20.5506 6.75 18.7647V8.41181C6.75 6.62593 5.238 5.17651 3.375 5.17651Z"
              fill="#323232"
            />
          </Svg>
          <Text style={styles.headerInfo}>Fax +82-51-793-0635</Text>
        </View>
        <View style={styles.headerInfoWrap}>
          <Svg width="9" height="7" viewBox="0 0 27 23" fill="none">
            <Path
              d="M2.65368 8.84679V19.4615H23.8831V8.84679L13.2684 12.8273L2.65368 8.84679ZM2.65368 3.53942V6.1931L13.2684 10.1736L23.8831 6.1931V3.53942H2.65368ZM2.65368 0.885742H23.8831C24.5869 0.885742 25.2619 1.16533 25.7596 1.66299C26.2572 2.16065 26.5368 2.83562 26.5368 3.53942V19.4615C26.5368 20.1653 26.2572 20.8403 25.7596 21.3379C25.2619 21.8356 24.5869 22.1152 23.8831 22.1152H2.65368C1.94988 22.1152 1.27491 21.8356 0.777245 21.3379C0.279583 20.8403 0 20.1653 0 19.4615V3.53942C0 2.83562 0.279583 2.16065 0.777245 1.66299C1.27491 1.16533 1.94988 0.885742 2.65368 0.885742Z"
              fill="#323232"
            />
          </Svg>
          <Text style={styles.headerInfo}>info@bas-korea.com</Text>
        </View>
        <View style={styles.stampWrapper}>
          <Image
            src={originalChecked ? ORIGINAL : COPY}
            style={{
              width: 210,
              height: 70,
              objectFit: "contain",
            }}
          />
        </View>
      </View>
    </View>
  </>
);

const Footer = () => (
  <View style={styles.footer} fixed>
    <View style={[styles.footerInfoWrap, { textAlign: "left" }]}>
      <View style={{ flexDirection: "row" }}>
        <Image
          src={simpleLogoUrl}
          style={{
            width: 30,
            height: 30,
            objectFit: "contain",
          }}
        />
      </View>
      <View>
        <Text style={styles.footerCompanyName}>BAS KOREA</Text>
        <View style={{ flexDirection: "row" }}>
          <Text style={[styles.footerCertificationLabel, { marginRight: 5 }]}>
            SHIPSERV
          </Text>
          <Text style={styles.footerCertification}>TN-238398</Text>
          <Text style={[styles.footerCertificationLabel, { marginLeft: 8 }]}>
            ISO 9001
          </Text>
          <Text style={styles.footerCertification}>:2015</Text>
          <Text style={[styles.footerCertificationLabel, { marginLeft: 8 }]}>
            ISO 14001
          </Text>
          <Text style={styles.footerCertification}>:2015</Text>
        </View>
      </View>
    </View>
    <View style={[styles.footerInfoWrap]}></View>
  </View>
);

const InvoicePDFDocument = ({
  info,
  items,
  pdfHeader,
  viewMode,
  language,
  pdfFooter,
  finalTotals,
  dcInfo,
  invChargeList,
  invoiceNumber,
  pdfType,
  originalChecked,
  itemType,
}: InvoicePDFDocumentProps) => {
  const headerMessage = pdfHeader;
  const calculateTotalSalesAmount = (items: OrderItemDetail[]) => {
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
        <View style={styles.contentWrapper}>
          {renderHeader(
            logoUrl,
            info.vesselName,
            headerMessage,
            language,
            info.refNumber,
            info.imoNo + "",
            invoiceNumber || "",
            pdfType,
            originalChecked,
            itemType
          )}
          <View style={styles.table}>
            <View
              style={[
                styles.tableRow,
                {
                  borderTop: "none",
                  borderBottom: "2px solid #142952",
                  color: "#142952",
                },
              ]}
              fixed
            >
              <View style={[styles.tableSmallCol, { flex: 0.28 }]}>
                <Text style={styles.tableHeaderCell}>No.</Text>
              </View>
              <View style={styles.tableMedCol}>
                <Text style={styles.tableHeaderCell}>Part No.</Text>
              </View>
              <View style={styles.tableBigCol}>
                <Text style={styles.tableHeaderCell}>Description</Text>
              </View>
              <View
                style={[styles.tableSmallCol, { alignItems: "flex-start" }]}
              >
                <Text style={styles.tableHeaderCell}>Qty</Text>
              </View>
              <View style={[styles.tableSmallCol]}>
                <Text style={styles.tableHeaderCell}>Unit</Text>
              </View>
              <View style={[styles.tablePriceCol]}>
                <Text style={styles.tableHeaderCell}>U/Price</Text>
              </View>
              <View style={[styles.tablePriceCol]}>
                <Text style={styles.tableHeaderCell}>Amount</Text>
              </View>
            </View>
            {renderTableRows(items, language)}
            <View wrap={false}>
              <View
                style={[
                  styles.inquiryInfoWrap,
                  { marginTop: 20, flexDirection: "column" },
                ]}
              >
                {pdfType !== "CREDITNOTE" && (
                  <View
                    style={[
                      styles.inquiryTotalColumn,
                      {
                        alignItems: "flex-end",
                        width: "50%",
                        alignSelf: "flex-end",
                      },
                    ]}
                  >
                    {(dcInfo.dcPercent ||
                      (invChargeList && invChargeList.length > 0)) && (
                      <View
                        style={[
                          styles.inquiryPriceRow,
                          { borderBottom: "1px dotted #000" },
                        ]}
                      >
                        <Text style={styles.inquiryPriceLabel}>SUB TOTAL</Text>
                        <Text style={styles.inquiryPriceValue}>
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
                    )}
                    {dcInfo.dcPercent && dcInfo.dcPercent !== 0 && (
                      <View style={styles.inquiryPriceRow}>
                        <Text style={styles.inquiryPriceLabel}>
                          DISCOUNT {dcInfo.dcPercent}%
                        </Text>
                        <Text style={styles.inquiryPriceValue}>
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
                    {invChargeList &&
                      invChargeList.length > 0 &&
                      invChargeList.map((charge) => (
                        <View style={styles.inquiryPriceRow}>
                          <>
                            <Text style={styles.inquiryPriceLabel}>
                              {charge.customCharge}
                            </Text>
                            <Text style={styles.inquiryPriceValue}>
                              {language === "KOR"
                                ? Number(charge.chargePriceKRW)?.toLocaleString(
                                    "ko-KR",
                                    {
                                      style: "currency",
                                      currency: "KRW",
                                    }
                                  )
                                : Number(
                                    charge.chargePriceGlobal
                                  )?.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: info.currencyType,
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                            </Text>
                          </>
                        </View>
                      ))}

                    <View
                      style={[
                        styles.inquiryPriceRow,
                        { borderTop: "1px dotted #000" },
                      ]}
                    >
                      <Text style={styles.inquiryPriceLabel}>
                        TOTAL AMOUNT(
                        {language === "KOR" ? "KRW" : info.currencyType})
                      </Text>
                      <Text style={styles.inquiryPriceValue}>
                        {language === "KOR"
                          ? finalTotals.totalSalesAmountKRW?.toLocaleString(
                              "ko-KR",
                              {
                                style: "currency",
                                currency: "KRW",
                              }
                            )
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
                  </View>
                )}
                {pdfType === "CREDITNOTE" && (
                  <View
                    style={[
                      styles.inquiryTotalColumn,
                      {
                        alignItems: "flex-end",
                        width: "50%",
                        alignSelf: "flex-end",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.inquiryPriceRow,
                        { borderTop: "1px dotted #000" },
                      ]}
                    >
                      <Text style={styles.inquiryPriceLabel}>
                        TOTAL AMOUNT(
                        {language === "KOR" ? "KRW" : info.currencyType})
                      </Text>
                      <Text style={styles.inquiryPriceValue}>
                        {language === "KOR"
                          ? items[0]?.salesAmountKRW?.toLocaleString("ko-KR", {
                              style: "currency",
                              currency: "KRW",
                            })
                          : items[0]?.salesAmountGlobal?.toLocaleString(
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
                  </View>
                )}
                <View style={[styles.inquiryTotalColumn]}>
                  {pdfFooter.length > 0 && (
                    <View style={[styles.inquiryInfoBox]} wrap>
                      <View style={styles.inquiryInfoText}>
                        <Text style={styles.inquiryInfoTitle}>REMARK</Text>
                      </View>
                      <View
                        style={[
                          styles.inquiryInfoText,
                          {
                            flexDirection: "column",
                          },
                        ]}
                      >
                        {pdfFooter.map((footer, index) => {
                          const formattedText = footer.salesRemark
                            .split("\n")
                            .map((line) => line.trim())
                            .join("\n");
                          return (
                            <View
                              key={index}
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                marginBottom: 5,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 9,
                                  lineHeight: 1.5,
                                }}
                              >
                                {`${index + 1}. `}
                                {formattedText}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
        <Footer />
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

export default InvoicePDFDocument;
