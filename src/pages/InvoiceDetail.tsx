import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Alert, Button, Divider, message, Modal, Select } from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import {
  fetchInvoiceDetail,
  saveInvoiceHeader,
  updateInvoice,
} from "../api/api";
import {
  InvoiceCharge,
  InvoiceDetailIF,
  InvoiceDocument,
  InvoiceHeaderDetail,
  OrderItemDetail,
  InvoiceRemarkDetail,
  Supplier,
} from "../types/types";
import LoadingSpinner from "../components/LoadingSpinner";
import { pdf } from "@react-pdf/renderer";
import TableComponent from "../components/InvoiceDetail/TableComponent";
import InvoicePDFDocument from "../components/InvoiceDetail/InvoicePDFDocument";
import InvoiceHeaderEditModal from "../components/InvoiceDetail/InvoiceHeaderEditModal";
import FormComponent from "../components/InvoiceDetail/FormComponent";
import { PDFDownloadItem } from "../components/InvoiceDetail/PDFDownloadTable";
import PDFDownloadTable from "../components/InvoiceDetail/PDFDownloadTable";
import InvoiceTotalCardsComponent from "../components/InvoiceDetail/InvoiceTotalCardsComponent";

const Container = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 95vw;
  margin: 0 auto;
  margin-bottom: 200px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
`;

const INITIAL_HEADER_VALUES: InvoiceHeaderDetail = {
  messrs: "",
  invoiceDate: dayjs().format("DD MMM YYYY").toUpperCase(),
  termsOfPayment: "DAYS",
  dueDate: "",
};

const InvoiceDetail = () => {
  const { invoiceId } = useParams();
  const [formValues, setFormValues] = useState<InvoiceDocument>();
  const [items, setItems] = useState<OrderItemDetail[]>([]);
  const [supplier, setSupplier] = useState<Supplier>();
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState<InvoiceDetailIF | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invChargeList, setInvChargeList] = useState<InvoiceCharge[] | null>(
    []
  );
  const [dcInfo, setDcInfo] = useState({
    dcPercent: 0,
    dcKrw: 0,
    dcGlobal: 0,
  });
  const [finalTotals, setFinalTotals] = useState({
    totalSalesAmountKRW: 0,
    totalSalesAmountGlobal: 0,
    totalPurchaseAmountKRW: 0,
    totalPurchaseAmountGlobal: 0,
    totalSalesAmountUnDcKRW: 0,
    totalSalesAmountUnDcGlobal: 0,
    totalPurchaseAmountUnDcKRW: 0,
    totalPurchaseAmountUnDcGlobal: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
  });
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [language, setLanguage] = useState<string>("ENG");
  const [headerEditModalVisible, setHeaderEditModalVisible] =
    useState<boolean>(false);
  const [pdfType, setPdfType] = useState<string>("INVOICE");
  const [itemType, setItemType] = useState<string>("DEFAULT");
  const [itemTypeOption, setItemTypeOption] = useState<string[]>(["DEFAULT"]);
  const [nonSelectedChargeList, setNonSelectedChargeList] = useState<
    InvoiceCharge[]
  >([]);
  const [pdfInvoiceHeader, setPdfInvoiceHeader] = useState<InvoiceHeaderDetail>(
    INITIAL_HEADER_VALUES
  );
  const [pdfInvoiceFooter, setPdfInvoiceFooter] = useState<
    InvoiceRemarkDetail[]
  >([]);
  const [isPDFTableVisible, setIsPDFTableVisible] = useState(false);

  // 단축키 핸들러
  const handleKeyboardSave = useCallback(
    async (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        event.stopPropagation();

        if (!invoiceNumber) {
          message.error("Invoice number is required");
          return;
        }

        await handleSave();
      }
    },
    [
      invoiceNumber,
      formValues,
      items,
      finalTotals,
      invChargeList,
      dcInfo,
      nonSelectedChargeList,
    ]
  );

  // 단축키 이벤트 리스너 등록
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopPropagation();
        handleKeyboardSave(e);
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [handleKeyboardSave]);

  // 초기 렌더링 시 데이터 로드
  const loadInvoiceDetail = async () => {
    try {
      const data: InvoiceDetailIF = await fetchInvoiceDetail(Number(invoiceId));

      const sortedItems = data.itemDetailList.sort(
        (a, b) => a.position - b.position
      );
      setInvoiceNumber(data.documentInfo.invoiceNumber);
      setInvoiceData(data);
      setFormValues(data.documentInfo);
      setItems(sortedItems);
      setSupplier(data.suppliers[0]);
      setInvChargeList(data.invChargeList);
      setDcInfo({
        dcPercent: data.documentInfo.discount || 0,
        dcKrw: 0,
        dcGlobal: 0,
      });
      setPdfInvoiceHeader(
        {
          ...data.salesHeaderResponse.salesHeader,
          messrs:
            data.salesHeaderResponse.salesHeader.messrs ||
            data.documentInfo.companyName,
        } || {
          ...INITIAL_HEADER_VALUES,
          messrs: data.documentInfo.companyName,
        }
      );
      setPdfInvoiceFooter(data.salesHeaderResponse.salesRemark || []);
      setItemTypeOption([
        "DEFAULT",
        ...data.invChargeList
          .filter((item) => item.isChecked)
          .map((item) => item.customCharge),
      ]);
      setNonSelectedChargeList(
        data.invChargeList.filter((item) => !item.isChecked)
      );
    } catch (error) {
      console.error("Order detail error:", error);
      message.error("Failed to load order detail.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoiceDetail();
  }, [invoiceId]);

  // 아이템 입력 변경 함수
  const handleInputChange = useCallback(
    (index: number, key: keyof OrderItemDetail, value: any) => {
      setItems((prevItems: OrderItemDetail[]) => {
        if (!prevItems?.[index]) return prevItems;
        if (prevItems[index][key] === value) return prevItems;

        const newItems = [...prevItems];
        const shouldResetPrices =
          (key === "itemType" && value !== "ITEM" && value !== "DASH") ||
          (key === "itemRemark" && value);

        newItems[index] = {
          ...newItems[index],
          [key]: value,
          ...(shouldResetPrices
            ? {
                purchasePriceKRW: 0,
                purchasePriceGlobal: 0,
                purchaseAmountKRW: 0,
                purchaseAmountGlobal: 0,
                salesPriceKRW: 0,
                salesPriceGlobal: 0,
                salesAmountKRW: 0,
                salesAmountGlobal: 0,
                margin: 0,
              }
            : {}),
        };

        return newItems;
      });
    },
    []
  );

  // 소수점 둘째자리까지 반올림하는 함수
  const roundToTwoDecimalPlaces = useCallback((value: number) => {
    return Number(parseFloat(value.toFixed(2)));
  }, []);

  // 환율을 적용하여 KRW와 USD를 상호 변환하는 함수
  const convertCurrency = useCallback(
    (
      value: number,
      currency: number,
      toCurrency: "KRW" | "USD" | "EUR" | "INR"
    ) => {
      if (toCurrency === "KRW") {
        return roundToTwoDecimalPlaces(value * currency);
      }
      return roundToTwoDecimalPlaces(value / currency);
    },
    [roundToTwoDecimalPlaces]
  );

  // 총액 계산 함수
  const calculateTotalAmount = useCallback(
    (price: number, qty: number) => roundToTwoDecimalPlaces(price * qty),
    []
  );

  // 마진 변경 함수
  const handleMarginChange = (index: number, marginValue: number) => {
    const updatedItems = [...items];
    const currentItem = updatedItems[index];

    const purchasePriceKRW = currentItem.purchasePriceKRW || 0;
    const qty = currentItem.qty || 0;

    const salesPriceKRW = Math.round(
      purchasePriceKRW * (1 + marginValue / 100)
    );
    const salesAmountKRW = calculateTotalAmount(salesPriceKRW, qty);

    const exchangeRate =
      formValues?.currency || invoiceData?.documentInfo.currency || 1050;
    const salesPriceGlobal = roundToTwoDecimalPlaces(
      salesPriceKRW / exchangeRate
    );
    const salesAmountGlobal = calculateTotalAmount(salesPriceGlobal, qty);

    updatedItems[index] = {
      ...currentItem,
      salesPriceKRW,
      salesAmountKRW,
      salesPriceGlobal,
      salesAmountGlobal,
      margin: marginValue,
    };

    setItems(updatedItems);
  };

  // 가격 입력 변경 함수
  const handlePriceInputChange = (
    index: number,
    key: keyof OrderItemDetail,
    value: any,
    currency: number
  ) => {
    const updatedItems = [...items];
    const currentItem = updatedItems[index];
    let updatedItem = { ...currentItem, [key]: value };

    if (key === "purchasePriceGlobal") {
      const updatedKRWPrice = Math.round(
        convertCurrency(value, currency, "KRW")
      );
      updatedItem = { ...updatedItem, purchasePriceKRW: updatedKRWPrice };
      handleMarginChange(index, currentItem.margin || 0);
    }

    if (key === "purchasePriceKRW") {
      const updatedGlobalPrice = convertCurrency(value, currency, "USD");
      updatedItem = { ...updatedItem, purchasePriceGlobal: updatedGlobalPrice };
      handleMarginChange(index, currentItem.margin || 0);
    }

    if (key === "salesPriceGlobal") {
      const updatedKRWPrice = Math.round(
        convertCurrency(value, currency, "KRW")
      );
      updatedItem = { ...updatedItem, salesPriceKRW: updatedKRWPrice };

      const margin = parseFloat(
        (
          ((value - currentItem.purchasePriceGlobal) /
            currentItem.purchasePriceGlobal) *
          100
        ).toFixed(2)
      );
      updatedItem = { ...updatedItem, margin };
    }

    if (key === "salesPriceKRW") {
      const updatedGlobalPrice = convertCurrency(value, currency, "USD");
      updatedItem = { ...updatedItem, salesPriceGlobal: updatedGlobalPrice };

      const margin = parseFloat(
        (
          ((value - currentItem.purchasePriceKRW) /
            currentItem.purchasePriceKRW) *
          100
        ).toFixed(2)
      );
      updatedItem = { ...updatedItem, margin };
    }

    // Calculate amounts
    const salesAmountKRW = calculateTotalAmount(
      updatedItem.salesPriceKRW,
      updatedItem.qty
    );
    const salesAmountGlobal = calculateTotalAmount(
      updatedItem.salesPriceGlobal,
      updatedItem.qty
    );
    const purchaseAmountKRW = calculateTotalAmount(
      updatedItem.purchasePriceKRW,
      updatedItem.qty
    );
    const purchaseAmountGlobal = calculateTotalAmount(
      updatedItem.purchasePriceGlobal,
      updatedItem.qty
    );

    updatedItem = {
      ...updatedItem,
      salesAmountKRW,
      salesAmountGlobal,
      purchaseAmountKRW,
      purchaseAmountGlobal,
    };

    updatedItems[index] = updatedItem;
    setItems(updatedItems);
  };

  // 공통 함수: reduce를 사용한 합계 계산
  const calculatePriceTotal = (
    data: Array<any>,
    key: string,
    qtyKey: string = "qty"
  ) => {
    return data.reduce((acc: number, record: any) => {
      const price = record[key] || 0; // chargePriceKRW
      // data가 invChargeList인 경우에만 qty를 1로 정
      const qty =
        data === invChargeList ? record[qtyKey] || 1 : record[qtyKey] || 0;
      return acc + calculateTotalAmount(price, qty);
    }, 0);
  };

  // 공통 함수: 할인 적용
  const applyDiscount = (amount: number, discountPercent: number | undefined) =>
    discountPercent
      ? roundToTwoDecimalPlaces(amount * (1 - discountPercent / 100))
      : amount;

  // 공통 함수: 환율 적용
  const convertToGlobal = (amount: number, exchangeRate: number) =>
    roundToTwoDecimalPlaces(amount / exchangeRate);

  // 공통 함수: 할인 및 차지 적용
  const applyDcAndCharge = (mode: string) => {
    if (items.length === 0) {
      message.warning("There");
      return;
    }

    const updatedItems = items.map((currentItem) => {
      const { purchasePriceKRW = 0, qty = 0, margin = 0 } = currentItem;

      const salesPriceKRW = Math.round(purchasePriceKRW * (1 + margin / 100));
      const salesAmountKRW = calculateTotalAmount(salesPriceKRW, qty);

      const exchangeRate = formValues?.currency || 1050;
      const salesPriceGlobal = convertToGlobal(salesPriceKRW, exchangeRate);
      const salesAmountGlobal = calculateTotalAmount(salesPriceGlobal, qty);

      return {
        ...currentItem,
        salesPriceKRW,
        salesAmountKRW,
        salesPriceGlobal,
        salesAmountGlobal,
      };
    });

    // 공통 계산
    const totalSalesAmountKRW = updatedItems.reduce(
      (sum, item) =>
        sum + Math.round(item.salesPriceKRW || 0) * (item.qty || 0),
      0
    );
    const totalSalesAmountGlobal = updatedItems.reduce(
      (sum, item) =>
        sum +
        roundToTwoDecimalPlaces(item.salesPriceGlobal || 0) * (item.qty || 0),
      0
    );
    const totalPurchaseAmountKRW = updatedItems.reduce(
      (sum, item) =>
        sum + Math.round(item.purchasePriceKRW || 0) * (item.qty || 0),
      0
    );
    const totalPurchaseAmountGlobal = updatedItems.reduce(
      (sum, item) =>
        sum +
        roundToTwoDecimalPlaces(item.purchasePriceGlobal || 0) *
          (item.qty || 0),
      0
    );

    // 할인 적용된 총액 계산
    const newTotalSalesAmountKRW = applyDiscount(
      totalSalesAmountKRW,
      dcInfo.dcPercent
    );
    const newTotalSalesAmountGlobal = applyDiscount(
      totalSalesAmountGlobal,
      dcInfo.dcPercent
    );

    // charge 계산
    const chargePriceKRWTotal = calculatePriceTotal(
      invChargeList || [],
      "chargePriceKRW"
    );
    const chargePriceGlobalTotal = calculatePriceTotal(
      invChargeList || [],
      "chargePriceGlobal"
    );

    const updatedTotalSalesAmountKRW =
      newTotalSalesAmountKRW + chargePriceKRWTotal;
    const updatedTotalSalesAmountGlobal =
      newTotalSalesAmountGlobal + chargePriceGlobalTotal;

    const chargeCurrency = () => {
      switch (formValues?.currencyType) {
        case "USD":
          return 1400;
        case "EUR":
          return 1500;
        case "INR":
          return 16;
        default:
          return 1400;
      }
    };

    const totalProfit =
      totalSalesAmountGlobal * chargeCurrency() - totalPurchaseAmountKRW;
    const totalProfitPercent = Number(
      (
        (totalProfit / (totalSalesAmountGlobal * chargeCurrency())) *
        100
      ).toFixed(2)
    );
    const updatedTotalProfit =
      updatedTotalSalesAmountGlobal * chargeCurrency() - totalPurchaseAmountKRW;
    const updatedTotalProfitPercent = Number(
      (
        (updatedTotalProfit /
          (updatedTotalSalesAmountGlobal * chargeCurrency())) *
        100
      ).toFixed(2)
    );
    setFinalTotals({
      totalSalesAmountKRW: Math.round(updatedTotalSalesAmountKRW),
      totalSalesAmountGlobal: updatedTotalSalesAmountGlobal,
      totalPurchaseAmountKRW: Math.round(totalPurchaseAmountKRW),
      totalPurchaseAmountGlobal: totalPurchaseAmountGlobal,
      totalSalesAmountUnDcKRW: Math.round(totalSalesAmountKRW),
      totalSalesAmountUnDcGlobal: totalSalesAmountGlobal,
      totalPurchaseAmountUnDcKRW: Math.round(totalPurchaseAmountKRW),
      totalPurchaseAmountUnDcGlobal: totalPurchaseAmountGlobal,
      totalProfit: Math.round(updatedTotalProfit),
      totalProfitPercent: updatedTotalProfitPercent,
    });
  };

  const handlePDFPreview = () => {
    applyDcAndCharge("multiple");
    setShowPDFPreview((prevState) => !prevState);
  };

  const handleOpenHeaderModal = () => {
    setHeaderEditModalVisible(true);
  };

  const handleCloseHeaderModal = () => {
    setHeaderEditModalVisible(false);
  };

  const handleSave = async () => {
    if (!invoiceNumber) {
      message.error("Please fill in Invoice Number");
      return;
    }

    try {
      const response = await updateInvoice(
        Number(invoiceId),
        invoiceNumber,
        dcInfo.dcPercent,
        invChargeList
      );

      setInvoiceNumber(response.invoiceNumber);
      setDcInfo({
        ...dcInfo,
        dcPercent: response.discount || 0,
      });
      setInvChargeList(response.invChargeList);

      setItemTypeOption([
        "DEFAULT",
        ...response.invChargeList
          .filter((item: InvoiceCharge) => item.isChecked)
          .map((item: InvoiceCharge) => item.customCharge),
      ]);
      setNonSelectedChargeList(
        response.invChargeList.filter((item: InvoiceCharge) => !item.isChecked)
      );

      message.success("Saved successfully");
    } catch (error) {
      console.error("Error saving invoice:", error);
      message.error("Failed to save invoice. Please try again.");
    }
  };

  // PDF 유형 변경 함수
  const handlePdfTypeChange = (value: string) => {
    setPdfType(value);

    if (value === "CREDITNOTE") {
      setItemType("CREDIT NOTE");
    }
  };

  // 다중 PDF 다운로드 함수
  const handleMultiplePDFDownload = useCallback(
    async (
      downloadItems: PDFDownloadItem[],
      updateProgress: (downloaded: number) => void
    ) => {
      if (!formValues || !supplier || !items || !supplier.supplierId) {
        message.error("Please fill in all fields.");
        return;
      }

      let downloadedCount = 0;

      try {
        for (const item of downloadItems) {
          let { pdfType, fileName, itemType = "DEFAULT" } = item;

          if (itemType === "CREDIT NOTE") {
            pdfType = "CREDIT NOTE";
          }
          const doc = (
            <InvoicePDFDocument
              invoiceNumber={invoiceNumber}
              pdfType={pdfType}
              info={formValues}
              items={
                itemType === "DEFAULT"
                  ? items
                  : [createChargeItem(itemType, invChargeList)]
              }
              pdfHeader={pdfInvoiceHeader}
              viewMode={false}
              language={language}
              pdfFooter={pdfInvoiceFooter}
              finalTotals={
                itemType === "DEFAULT"
                  ? createDefaultFinalTotals(
                      items,
                      nonSelectedChargeList,
                      formValues?.currency || 1050,
                      dcInfo
                    )
                  : createChargeFinalTotals(
                      itemType,
                      invChargeList,
                      formValues?.currency || 1050,
                      itemType
                    )
              }
              dcInfo={
                itemType === "DEFAULT"
                  ? dcInfo
                  : {
                      dcPercent: 0,
                      dcKrw: 0,
                      dcGlobal: 0,
                    }
              }
              invChargeList={
                itemType === "DEFAULT" ? nonSelectedChargeList : []
              }
              itemType={itemType}
            />
          );

          const pdfBlob = await pdf(doc).toBlob();
          await downloadFile(pdfBlob, `${fileName}.pdf`);
          downloadedCount++;
          updateProgress(downloadedCount);
        }

        message.success({
          content: "PDF Files Downloaded Successfully",
        });
      } catch (error) {
        console.error("PDF Download Error:", error);
        message.error({
          content: "PDF Download Error",
        });
      }
    },
    [
      formValues,
      supplier,
      items,
      invoiceNumber,
      language,
      dcInfo,
      invChargeList,
      finalTotals,
      pdfInvoiceHeader,
      pdfInvoiceFooter,
    ]
  );

  // PDF 다운로드 유틸리티 함수
  const downloadFile = async (blob: Blob, fileName: string): Promise<void> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      // 다운로드 완료를 위한 약간의 지연
      setTimeout(resolve, 500);
    });
  };

  // 헤더 저장 함수
  const commonSaveHeader = async (
    header: InvoiceHeaderDetail,
    footer: InvoiceRemarkDetail[]
  ) => {
    try {
      const response = await saveInvoiceHeader(
        Number(invoiceId),
        header,
        footer
      );

      setPdfInvoiceHeader(response.salesHeader);
      setPdfInvoiceFooter(response.salesRemark);

      message.success("Invoice Header saved successfully");
    } catch (error) {
      console.error("Error saving Invoice Header:", error);
      message.error("Failed to save Invoice Header. Please try again.");
    }
  };

  // 차지 아이템 생성 함수
  const createChargeItem = (
    chargeType: string,
    invChargeList: InvoiceCharge[] | null
  ): OrderItemDetail => {
    // 기본 고정 값
    const baseItem = {
      ordersItemId: null,
      itemType: "ITEM",
      itemCode: "",
      itemRemark: "",
      qty: 1,
      position: 1,
      unit: "EA",
      indexNo: null,
      margin: 0,
      purchasePriceKRW: 0,
      purchasePriceGlobal: 0,
      purchaseAmountKRW: 0,
      purchaseAmountGlobal: 0,
      deliveryDate: 0,
    };

    // invoiceChargeList에서 해당하는 charge 찾기
    const selectedCharge = invChargeList?.find(
      (charge) => charge.customCharge === chargeType
    );

    if (!selectedCharge) {
      throw new Error("Invalid charge type");
    }

    // 선택된 charge 정보로 아이템 생성
    return {
      ...baseItem,
      itemName: selectedCharge.customCharge.toUpperCase(),
      salesPriceKRW: selectedCharge.chargePriceKRW,
      salesPriceGlobal: selectedCharge.chargePriceGlobal,
      salesAmountKRW: selectedCharge.chargePriceKRW,
      salesAmountGlobal: selectedCharge.chargePriceGlobal,
    };
  };

  // 크레딧 노트 / 차지 문서 생성 시 넘기는 총액(finalTotals)을 계산하는 함수
  const createChargeFinalTotals = (
    chargeType: string,
    invChargeList: InvoiceCharge[] | null,
    currency: number,
    itemType: string
  ): {
    totalSalesAmountKRW: number;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountKRW: number;
    totalPurchaseAmountGlobal: number;
    totalSalesAmountUnDcKRW: number;
    totalSalesAmountUnDcGlobal: number;
    totalPurchaseAmountUnDcKRW: number;
    totalPurchaseAmountUnDcGlobal: number;
    totalProfit: number;
    totalProfitPercent: number;
  } => {
    // invoiceChargeList에서 해당하는 charge 찾기
    const selectedCharge = invChargeList?.find(
      (charge) => charge.customCharge === chargeType
    );

    if (!selectedCharge) {
      throw new Error("Invalid charge type");
    }

    const chargeCurrency = () => {
      switch (formValues?.currencyType) {
        case "USD":
          return 1400;
        case "EUR":
          return 1500;
        case "INR":
          return 16;
        default:
          return 1400;
      }
    };

    const salesAmountKRW = selectedCharge.chargePriceKRW;
    const salesAmountGlobal = selectedCharge.chargePriceGlobal;
    const purchaseAmountKRW = 0; // Charge 아이템은 구매가격이 0
    const purchaseAmountGlobal = 0;

    const totalProfit =
      salesAmountGlobal * chargeCurrency() - purchaseAmountKRW;
    const totalProfitPercent = Number(
      ((totalProfit / (salesAmountGlobal * chargeCurrency())) * 100).toFixed(2)
    );

    return {
      totalSalesAmountKRW: Math.round(salesAmountKRW),
      totalSalesAmountGlobal: salesAmountGlobal,
      totalPurchaseAmountKRW: purchaseAmountKRW,
      totalPurchaseAmountGlobal: purchaseAmountGlobal,
      totalSalesAmountUnDcKRW: Math.round(salesAmountKRW),
      totalSalesAmountUnDcGlobal: salesAmountGlobal,
      totalPurchaseAmountUnDcKRW: purchaseAmountKRW,
      totalPurchaseAmountUnDcGlobal: purchaseAmountGlobal,
      totalProfit: Math.round(totalProfit),
      totalProfitPercent: totalProfitPercent,
    };
  };

  const handlePDFButtonClick = () => {
    setIsPDFTableVisible(true);
  };

  const handlePDFTableClose = () => {
    setIsPDFTableVisible(false);
  };

  // 기본 총액 계산 함수 (nonSelectedChargeList 사용)
  const createDefaultFinalTotals = (
    items: OrderItemDetail[],
    nonSelectedChargeList: InvoiceCharge[],
    currency: number,
    dcInfo: { dcPercent: number; dcKrw: number; dcGlobal: number }
  ) => {
    // 기본 판매/구매 총액 계산
    const totalSalesAmountKRW = items.reduce(
      (sum, item) => sum + (item.salesPriceKRW || 0) * (item.qty || 0),
      0
    );
    const totalSalesAmountGlobal = items.reduce(
      (sum, item) => sum + (item.salesPriceGlobal || 0) * (item.qty || 0),
      0
    );
    const totalPurchaseAmountKRW = items.reduce(
      (sum, item) => sum + (item.purchasePriceKRW || 0) * (item.qty || 0),
      0
    );
    const totalPurchaseAmountGlobal = items.reduce(
      (sum, item) => sum + (item.purchasePriceGlobal || 0) * (item.qty || 0),
      0
    );

    // 할인 적용된 총액 계산
    const newTotalSalesAmountKRW = dcInfo.dcPercent
      ? totalSalesAmountKRW * (1 - dcInfo.dcPercent / 100)
      : totalSalesAmountKRW;
    const newTotalSalesAmountGlobal = dcInfo.dcPercent
      ? totalSalesAmountGlobal * (1 - dcInfo.dcPercent / 100)
      : totalSalesAmountGlobal;

    // charge 계산
    const chargePriceKRWTotal = nonSelectedChargeList.reduce(
      (sum, charge) => sum + (charge.chargePriceKRW || 0),
      0
    );
    const chargePriceGlobalTotal = nonSelectedChargeList.reduce(
      (sum, charge) => sum + (charge.chargePriceGlobal || 0),
      0
    );

    // 최종 총액 계산
    const updatedTotalSalesAmountKRW =
      newTotalSalesAmountKRW + chargePriceKRWTotal;
    const updatedTotalSalesAmountGlobal =
      newTotalSalesAmountGlobal + chargePriceGlobalTotal;

    // 환율에 따른 이익 계산
    const chargeCurrency = () => {
      switch (formValues?.currencyType) {
        case "USD":
          return 1400;
        case "EUR":
          return 1500;
        case "INR":
          return 16;
        default:
          return 1400;
      }
    };

    const updatedTotalProfit =
      updatedTotalSalesAmountGlobal * chargeCurrency() - totalPurchaseAmountKRW;
    const updatedTotalProfitPercent = Number(
      (
        (updatedTotalProfit /
          (updatedTotalSalesAmountGlobal * chargeCurrency())) *
        100
      ).toFixed(2)
    );

    return {
      totalSalesAmountKRW: Math.round(updatedTotalSalesAmountKRW),
      totalSalesAmountGlobal: updatedTotalSalesAmountGlobal,
      totalPurchaseAmountKRW,
      totalPurchaseAmountGlobal,
      totalSalesAmountUnDcKRW: Math.round(totalSalesAmountKRW),
      totalSalesAmountUnDcGlobal: totalSalesAmountGlobal,
      totalPurchaseAmountUnDcKRW: Math.round(totalPurchaseAmountKRW),
      totalPurchaseAmountUnDcGlobal: totalPurchaseAmountGlobal,
      totalProfit: Math.round(updatedTotalProfit),
      totalProfitPercent: updatedTotalProfitPercent,
    };
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!invoiceData) {
    return <div>Invoice not found.</div>;
  }

  return (
    <Container>
      <Title>Invoice Detail</Title>
      {formValues && <FormComponent formValues={formValues} />}
      <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
        Invoice Item List
      </Divider>

      {items && (
        <TableComponent
          itemDetails={items}
          setItemDetails={setItems}
          handleInputChange={handleInputChange}
          currency={invoiceData.documentInfo.currency}
          roundToTwoDecimalPlaces={roundToTwoDecimalPlaces}
          calculateTotalAmount={calculateTotalAmount}
          handleMarginChange={handleMarginChange}
          handlePriceInputChange={handlePriceInputChange}
          invoiceId={invoiceData.documentInfo.salesId || 0}
          invoiceNumber={invoiceNumber}
          setInvoiceNumber={setInvoiceNumber}
          handleSave={handleSave}
          // pdfUrl={pdfUrl}
          // supplierName={supplier.supplierName}
          // documentNumber={orderData.documentInfo.documentNumber}
        />
      )}
      <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
        Total price
      </Divider>
      <InvoiceTotalCardsComponent
        finalTotals={finalTotals}
        applyDcAndCharge={applyDcAndCharge}
        mode={"multiple"}
        currency={formValues?.currency || 1050}
        dcInfo={dcInfo}
        setDcInfo={setDcInfo}
        invChargeList={invChargeList}
        setInvChargeList={setInvChargeList}
        handleSave={handleSave}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button type="default" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
      <div style={{ marginTop: 20 }}>
        <Button style={{ marginLeft: 10 }} onClick={handleOpenHeaderModal}>
          Edit Header / Remark
        </Button>
        <span style={{ marginLeft: 20 }}>LANGUAGE: </span>
        <Select
          style={{ width: 100, marginLeft: 10 }}
          value={language}
          onChange={setLanguage}
        >
          <Select.Option value="KOR">KOR</Select.Option>
          <Select.Option value="ENG">ENG</Select.Option>
        </Select>
        <span style={{ marginLeft: 20 }}>INVOICE TYPE: </span>
        <Select
          style={{ width: 200, marginLeft: 10 }}
          value={pdfType}
          onChange={handlePdfTypeChange}
        >
          <Select.Option value="INVOICE">INVOICE</Select.Option>
          <Select.Option value="PROFORMAINVOICE">
            PROFORMA INVOICE
          </Select.Option>
          <Select.Option value="CREDITNOTE">CREDIT NOTE</Select.Option>
        </Select>
        <span style={{ marginLeft: 20 }}>ITEMS: </span>
        <Select
          style={{ width: 150, marginLeft: 10 }}
          value={itemType}
          onChange={setItemType}
        >
          {itemTypeOption.map((item) => (
            <Select.Option value={item}>{item}</Select.Option>
          ))}
        </Select>
        <Button
          style={{ marginLeft: 10 }}
          onClick={handlePDFPreview}
          type="default"
        >
          {showPDFPreview ? "Close Preview" : "PDF Preview"}
        </Button>
        <Button
          style={{ marginLeft: 10 }}
          onClick={handlePDFButtonClick}
          type="default"
        >
          PDF Download
        </Button>
        <Modal
          title="PDF Download Options"
          open={isPDFTableVisible}
          onCancel={handlePDFTableClose}
          footer={null}
          width={1000}
        >
          <PDFDownloadTable
            formValues={formValues}
            itemTypeOption={itemTypeOption}
            onDownload={handleMultiplePDFDownload}
          />
        </Modal>
      </div>
      {pdfType !== "CREDITNOTE" &&
        itemType === "DEFAULT" &&
        showPDFPreview &&
        formValues &&
        supplier && (
          <InvoicePDFDocument
            invoiceNumber={invoiceNumber}
            pdfType={pdfType}
            info={formValues}
            items={items}
            pdfHeader={pdfInvoiceHeader}
            viewMode={true}
            language={language}
            pdfFooter={pdfInvoiceFooter}
            finalTotals={createDefaultFinalTotals(
              items,
              nonSelectedChargeList,
              formValues?.currency || 1050,
              dcInfo
            )}
            dcInfo={dcInfo}
            invChargeList={nonSelectedChargeList}
            itemType={itemType}
          />
        )}
      {itemType !== "DEFAULT" &&
        showPDFPreview &&
        formValues &&
        (createChargeItem(itemType, invChargeList) ? (
          <InvoicePDFDocument
            invoiceNumber={invoiceNumber}
            pdfType={pdfType}
            info={formValues}
            items={[createChargeItem(itemType, invChargeList)]}
            pdfHeader={pdfInvoiceHeader}
            viewMode={true}
            language={language}
            pdfFooter={pdfInvoiceFooter}
            finalTotals={createChargeFinalTotals(
              itemType,
              invChargeList,
              formValues?.currency || 1050,
              itemType
            )}
            dcInfo={{
              dcPercent: 0,
              dcKrw: 0,
              dcGlobal: 0,
            }}
            invChargeList={[]}
            itemType={itemType}
          />
        ) : (
          <Alert
            message="Credit Note / Charge Error"
            description="Credit Note / Charge amount is not set. Please click the Credit Note / Charge button to enter the amount."
            type="warning"
            showIcon
            style={{ margin: "20px 0" }}
          />
        ))}
      {headerEditModalVisible && (
        <InvoiceHeaderEditModal
          open={headerEditModalVisible}
          onSave={commonSaveHeader}
          onClose={handleCloseHeaderModal}
          pdfHeader={pdfInvoiceHeader}
          pdfFooter={pdfInvoiceFooter}
          setPdfInvoiceHeader={setPdfInvoiceHeader}
          setPdfInvoiceFooter={setPdfInvoiceFooter}
        />
      )}
    </Container>
  );
};

export default InvoiceDetail;
