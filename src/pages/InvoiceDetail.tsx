import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Input,
  message,
  Modal,
  Select,
} from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import { fetchInvoiceDetail } from "../api/api";
import {
  InvCharge,
  InvoiceDetailIF,
  InvoiceDocument,
  InvoiceHeaderFormData,
  OrderItemDetail,
  InvoiceRemarkDetail,
  Supplier,
} from "../types/types";
import LoadingSpinner from "../components/LoadingSpinner";
import TotalCardsComponent from "../components/makeOffer/TotalCardsComponent";
import { pdf } from "@react-pdf/renderer";
import TableComponent from "../components/InvoiceDetail/TableComponent";
import InvoicePDFDocument from "../components/InvoiceDetail/InvoicePDFDocument";
import InvoiceHeaderEditModal from "../components/InvoiceDetail/InvoiceHeaderEditModal";
import CreditNotePopover from "../components/InvoiceDetail/CreditNotePopover";
import FormComponent from "../components/InvoiceDetail/FormComponent";

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

const INITIAL_HEADER_VALUES: InvoiceHeaderFormData = {
  invoiceHeaderId: null,
  messrs: "",
  date: dayjs().format("DD MMM, YYYY").toUpperCase(),
  paymentTerms: "DAYS",
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
  const [invChargeList, setInvChargeList] = useState<InvCharge[] | null>([]);
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
  const [pdfType, setPdfType] = useState<string>("INVOICEORIGINAL");
  const [pdfInvoiceHeader, setPdfInvoiceHeader] =
    useState<InvoiceHeaderFormData>(INITIAL_HEADER_VALUES);
  const [pdfInvoiceFooter, setPdfInvoiceFooter] = useState<
    InvoiceRemarkDetail[]
  >([]);
  const [creditNoteAmount, setCreditNoteAmount] = useState<OrderItemDetail>();

  const loadOrderDetail = async () => {
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
      setPdfInvoiceHeader({
        ...INITIAL_HEADER_VALUES,
        messrs: data.documentInfo.companyName,
      });
      setPdfInvoiceFooter(data.salesRemarkDetailResponse || []);
    } catch (error) {
      console.error("Order detail error:", error);
      message.error("Failed to load order detail.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetail();
  }, [invoiceId]);

  const handleKeyboardSave = useCallback(
    async (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();

        if (!formValues?.refNumber || formValues?.refNumber.trim() === "") {
          message.error("Reference number is required");
          return;
        }

        await handleSave();
      }
    },
    [formValues, items, finalTotals]
  );

  // 컴포넌트가 마운트될 때 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardSave);
    return () => document.removeEventListener("keydown", handleKeyboardSave);
  }, [handleKeyboardSave]);

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
    return Math.round(value * 100) / 100;
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

  const calculateTotalAmount = useCallback(
    (price: number, qty: number) => roundToTwoDecimalPlaces(price * qty),
    []
  );

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

  // 공 함수: reduce를 사용한 합계 계산
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
    discountPercent ? amount * (1 - discountPercent / 100) : amount;

  // 공통 함수: 환율 적용
  const convertToGlobal = (amount: number, exchangeRate: number) =>
    roundToTwoDecimalPlaces(amount / exchangeRate);

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
      (sum, item) => sum + (item.salesPriceKRW || 0) * (item.qty || 0),
      0
    );
    const totalSalesAmountGlobal = updatedItems.reduce(
      (sum, item) => sum + (item.salesPriceGlobal || 0) * (item.qty || 0),
      0
    );
    const totalPurchaseAmountKRW = updatedItems.reduce(
      (sum, item) => sum + (item.purchasePriceKRW || 0) * (item.qty || 0),
      0
    );
    const totalPurchaseAmountGlobal = updatedItems.reduce(
      (sum, item) => sum + (item.purchasePriceGlobal || 0) * (item.qty || 0),
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
      totalPurchaseAmountKRW,
      totalPurchaseAmountGlobal,
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
    if (
      !formValues ||
      !supplier ||
      !invChargeList ||
      !items ||
      !supplier.supplierId
    ) {
      message.error("Please fill in all fields.");
      return;
    }

    // const request: InvoiceRequest = {
    //   invoiceId: Number(invoiceId),
    //   supplierId: supplier?.supplierId || 0,
    //   documentEditInfo: formValues,
    //   invChargeList: invChargeList,
    //   itemDetailList: items,
    // };

    try {
      // await editOrder(Number(invoiceId), request);
      message.success("Order saved successfully");

      loadOrderDetail();
    } catch (error) {
      console.error("Error saving order:", error);
      message.error("Failed to save order. Please try again.");
    }
  };

  const handlePdfTypeChange = (value: string) => {
    setPdfType(value);
  };

  const handlePDFDownload = async () => {
    if (!formValues || !supplier || !items || !supplier.supplierId) {
      message.error("Please fill in all fields.");
      return;
    }

    try {
      let doc;
      if (pdfType === "INVOICEORIGINAL") {
        doc = (
          <InvoicePDFDocument
            invoiceNumber={invoiceNumber}
            pdfType={pdfType}
            info={formValues}
            items={items}
            pdfHeader={pdfInvoiceHeader}
            viewMode={false}
            language={language}
            pdfFooter={pdfInvoiceFooter}
            finalTotals={finalTotals}
            dcInfo={dcInfo}
            invChargeList={invChargeList}
          />
        );
      }

      const pdfBlob = await pdf(doc).toBlob();
      let defaultFileName = "";

      if (pdfType === "INVOICEORIGINAL") {
        defaultFileName = `${formValues.invoiceNumber}_INVOICE_ORIGINAL.pdf`;
      } else if (pdfType === "INVOICECOPY") {
        defaultFileName = `${formValues.invoiceNumber}_INVOICE_COPY.pdf`;
      } else if (pdfType === "CREDITNOTE") {
        defaultFileName = `CREDIT_NOTE_${formValues.invoiceNumber}.pdf`;
      }

      let modalInstance: any;
      let localSendMailState = true; // 모달 내부에서 사용할 로컬 상태

      modalInstance = Modal.confirm({
        title: "Quotation PDF File",
        width: 500,
        content: (
          <div style={{ marginBottom: 20 }}>
            <span>File name: </span>
            <Input
              defaultValue={defaultFileName}
              id="fileNameInput"
              onPressEnter={() => {
                modalInstance.destroy();
              }}
            />
            <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
              Send mail or not
            </Divider>
            <Checkbox
              defaultChecked={true}
              onChange={(e) => {
                localSendMailState = e.target.checked;
              }}
            >
              I will send customer an e-mail immediately
            </Checkbox>
          </div>
        ),
        onOk: async () => {
          const inputElement = document.getElementById(
            "fileNameInput"
          ) as HTMLInputElement;
          const fileName = inputElement.value || defaultFileName;

          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName.endsWith(".pdf")
            ? fileName
            : `${fileName}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },
        okText: "Download",
        cancelText: "Cancel",
      });
    } catch (error) {
      console.error("PDF Download Error:", error);
      message.error("PDF Download Error");
    }
  };

  const commonSaveHeader = async (
    header: InvoiceHeaderFormData,
    footer: InvoiceRemarkDetail[]
  ) => {
    // const response = await saveInvoiceHeader(Number(invoiceId), header, footer);

    console.log("header", header);

    setPdfInvoiceHeader(header);
    setPdfInvoiceFooter(footer);
  };

  const handleCreditNoteApply = (krwAmount: number, globalAmount: number) => {
    setCreditNoteAmount({
      ordersItemId: null,
      itemType: "ITEM",
      itemCode: "",
      itemName: "CREDIT NOTE",
      itemRemark: "",
      qty: 1,
      position: 1,
      unit: "EA",
      indexNo: null,
      salesPriceKRW: krwAmount,
      salesPriceGlobal: globalAmount,
      salesAmountKRW: krwAmount,
      salesAmountGlobal: globalAmount,
      margin: 0,
      purchasePriceKRW: 0,
      purchasePriceGlobal: 0,
      purchaseAmountKRW: 0,
      purchaseAmountGlobal: 0,
      deliveryDate: 0,
    });
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
          // pdfUrl={pdfUrl}
          // supplierName={supplier.supplierName}
          // documentNumber={orderData.documentInfo.documentNumber}
        />
      )}
      <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
        Total price
      </Divider>
      <TotalCardsComponent
        finalTotals={finalTotals}
        applyDcAndCharge={applyDcAndCharge}
        mode={"multiple"}
        currency={formValues?.currency || 1050}
        dcInfo={dcInfo}
        setDcInfo={setDcInfo}
        invChargeList={invChargeList}
        setInvChargeList={setInvChargeList}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button type="default" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button type="primary" onClick={handleSave}>
          Save
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
        <span style={{ marginLeft: 20 }}>DOCUMENT TYPE: </span>
        <Select
          style={{ width: 280, marginLeft: 10 }}
          value={pdfType}
          onChange={handlePdfTypeChange}
        >
          <Select.Option value="INVOICEORIGINAL">
            INVOICE ORIGINAL
          </Select.Option>
          <Select.Option value="INVOICECOPY">INVOICE COPY</Select.Option>
          <Select.Option value="CREDITNOTE">CREDIT NOTE</Select.Option>
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
          onClick={handlePDFDownload}
          type="default"
        >
          PDF Download
        </Button>
        <CreditNotePopover
          currency={formValues?.currency || 1050}
          onApply={handleCreditNoteApply}
        />
      </div>
      {pdfType === "INVOICEORIGINAL" &&
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
            finalTotals={finalTotals}
            dcInfo={dcInfo}
            invChargeList={invChargeList}
          />
        )}
      {pdfType === "INVOICECOPY" && showPDFPreview && formValues && (
        <InvoicePDFDocument
          invoiceNumber={invoiceNumber}
          pdfType={pdfType}
          info={formValues}
          items={items}
          pdfHeader={pdfInvoiceHeader}
          viewMode={true}
          language={language}
          pdfFooter={pdfInvoiceFooter}
          finalTotals={finalTotals}
          dcInfo={dcInfo}
          invChargeList={invChargeList}
        />
      )}
      {pdfType === "CREDITNOTE" &&
        showPDFPreview &&
        formValues &&
        (creditNoteAmount ? (
          <InvoicePDFDocument
            invoiceNumber={invoiceNumber}
            pdfType={pdfType}
            info={formValues}
            items={[creditNoteAmount]}
            pdfHeader={pdfInvoiceHeader}
            viewMode={true}
            language={language}
            pdfFooter={pdfInvoiceFooter}
            finalTotals={finalTotals}
            dcInfo={dcInfo}
            invChargeList={invChargeList}
          />
        ) : (
          <Alert
            message="Credit Note Error"
            description="Credit Note amount is not set. Please click the Credit Note button to enter the amount."
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
