import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Checkbox, Divider, Input, message, Modal, Select } from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import {
  confirmLogistics,
  editLogistics,
  fetchLogisticsDetail,
  saveCIPLHeader,
} from "../api/api";
import {
  CIPLHeaderFormData,
  InvCharge,
  LogisticsRequest,
  OrderSupplier,
  LogisticsResponse,
  Logistics,
  LogisticsItemDetail,
  LogisticsDate,
} from "../types/types";
import LoadingSpinner from "../components/LoadingSpinner";
import FormComponent from "../components/logisticsDetail/FormComponent";
import TableComponent from "../components/logisticsDetail/TableComponent";
import TotalCardsComponent from "../components/makeOffer/TotalCardsComponent";
import { pdf } from "@react-pdf/renderer";
import CIPLDocument from "../components/logisticsDetail/CIPL";
import CIPLHeaderEditModal from "../components/logisticsDetail/CIPLHeaderEditModal";
import LogisticsDateComponent from "../components/logisticsDetail/LogisticsDateComponent";

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

const INITIAL_PL_VALUES: CIPLHeaderFormData = {
  ciPlId: null,
  shipper:
    "BAS KOREA CO.\n43-4, Gyeongjeoncheol-ro 24beon-gil,\nGangseo-gu, Busan, Korea / 46719\nTel: +82-51-977-7070, Fax: +82-51-793-0635",
  forAccountAndRiskOfMessers: "MASTER OF \nSHIP'S SPARES IN TRANSIT",
  notifyParty: "",
  portOfLoading: "BUSAN, KOREA",
  finalDestination: "",
  vesselAndVoyage: "",
  sailingOnOr: "",
  noAndDateOfInvoice: "",
  noAndDateOfPo: "",
  lcIssuingBank: "",
  remark:
    "SHIPS SPARES IN TRANSIT\nPACKING DETAILS\n\nHS CODE: 8409.99-9000\nCOUNTRY OF ORIGIN: KOREA",
};

const LogisticsDetail = () => {
  const { logisticsId } = useParams();
  const [formValues, setFormValues] = useState<Logistics>();
  const [items, setItems] = useState<LogisticsItemDetail[]>([]);
  const [supplier, setSupplier] = useState<OrderSupplier>();
  const navigate = useNavigate();
  const [logisticsData, setLogisticsData] = useState<LogisticsResponse | null>(
    null
  );
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
  const [pdfType, setPdfType] = useState<string>("CIPL");

  const [pdfCIPLHeader, setPdfCIPLHeader] =
    useState<CIPLHeaderFormData>(INITIAL_PL_VALUES);
  const [loadedCIPLHeader, setLoadedCIPLHeader] =
    useState<CIPLHeaderFormData>(INITIAL_PL_VALUES);
  const [withLogo, setWithLogo] = useState<boolean>(true);
  const [logisticsDate, setLogisticsDate] = useState<LogisticsDate>({
    deliveryDate: "",
    expectedReceivingDate: "",
    receivingDate: "",
    shippingDate: "",
  });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // 단축키 핸들러
  const handleKeyboardSave = useCallback(
    async (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        event.stopPropagation();

        if (!formValues?.refNumber || formValues?.refNumber.trim() === "") {
          message.error("Reference number is required");
          return;
        }

        await handleSave();
      }
    },
    [formValues, items, finalTotals, invChargeList, dcInfo]
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

  // 주문 상세 데이터 로드 함수
  const loadLogisticsDetail = async () => {
    try {
      const data: LogisticsResponse = await fetchLogisticsDetail(
        Number(logisticsId)
      );

      const sortedItems = data.itemDetailList.sort(
        (a, b) => a.position - b.position
      );
      setLogisticsData(data);
      setFormValues(data.documentInfo);
      setItems(sortedItems);
      setSupplier(data.suppliers[0]);
      setInvChargeList(data.invChargeList);
      setDcInfo({
        dcPercent: data.documentInfo.discount || 0,
        dcKrw: 0,
        dcGlobal: 0,
      });
      setLogisticsDate(
        data.logisticsDate || {
          deliveryDate: "",
          expectedReceivingDate: "",
          receivingDate: "",
          shippingDate: "",
        }
      );
      setLoadedCIPLHeader({
        ciPlId: data?.ciPlResponse?.ciPlId || null,
        shipper:
          "BAS KOREA CO.\n43-4, Gyeongjeoncheol-ro 24beon-gil,\nGangseo-gu, Busan, Korea / 46719\nTel: +82-51-977-7070, Fax: +82-51-793-0635",
        forAccountAndRiskOfMessers: `MASTER OF ${data.documentInfo.vesselName}\nSHIP'S SPARES IN TRANSIT`,
        notifyParty: "",
        portOfLoading: "BUSAN, KOREA",
        finalDestination: "",
        vesselAndVoyage: data.documentInfo.vesselName,
        sailingOnOr: "",
        noAndDateOfInvoice: `${data.documentInfo.refNumber}, ${dayjs().format(
          "DD MMM YYYY"
        )}`,
        noAndDateOfPo: data.documentInfo.documentNumber,
        lcIssuingBank: data.documentInfo.companyName,
        remark:
          "SHIPS SPARES IN TRANSIT\nPACKING DETAILS\n\nHS CODE: 8409.99-9000\nCOUNTRY OF ORIGIN: KOREA",
      });

      setPdfCIPLHeader(
        data.ciPlResponse || {
          ...INITIAL_PL_VALUES,
          forAccountAndRiskOfMessers: `MASTER OF ${data.documentInfo.vesselName}\nSHIP'S SPARES IN TRANSIT`,
          vesselAndVoyage: data.documentInfo.vesselName,
          noAndDateOfInvoice: `${data.documentInfo.refNumber}, ${dayjs().format(
            "DD MMM YYYY"
          )}`,
          noAndDateOfPo: data.documentInfo.documentNumber,
          lcIssuingBank: data.documentInfo.companyName,
        }
      );
    } catch (error) {
      console.error("Logistics detail error:", error);
      message.error("Failed to load logistics detail.");
    } finally {
      setIsLoading(false);
    }
  };

  // 주문 상세 데이터 로드 함수
  useEffect(() => {
    loadLogisticsDetail();
  }, [logisticsId]);

  // 입력 값 변경 함수
  const handleInputChange = useCallback(
    (index: number, key: keyof LogisticsItemDetail, value: any) => {
      setItems((prevItems: LogisticsItemDetail[]) => {
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
      formValues?.currency || logisticsData?.documentInfo.currency || 1050;
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
    key: keyof LogisticsItemDetail,
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
    discountPercent ? amount * (1 - discountPercent / 100) : amount;

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

    const request: LogisticsRequest = {
      logisticsId: Number(logisticsId),
      supplierId: supplier?.supplierId || 0,
      documentEditInfo: formValues,
      invChargeList: invChargeList,
      itemDetailList: items,
      logisticsDate: logisticsDate,
    };

    try {
      await editLogistics(Number(logisticsId), request);
      message.success("Logistics saved successfully");

      loadLogisticsDetail();
    } catch (error) {
      console.error("Error saving logistics:", error);
      message.error("Failed to save logistics. Please try again.");
    }
  };

  const handlePdfTypeChange = (value: string) => {
    setPdfType(value);
  };

  // 공통 함수: PDF 다운로드
  const handlePDFDownload = async () => {
    if (!formValues || !supplier || !items || !supplier.supplierId) {
      message.error("Please fill in all fields.");
      return;
    }

    try {
      let doc;
      if (pdfType === "CIPL" || pdfType === "PL") {
        doc = (
          <CIPLDocument
            mode={pdfType}
            info={formValues}
            items={items}
            pdfHeader={pdfCIPLHeader}
            viewMode={false}
            language={language}
            finalTotals={finalTotals}
            dcInfo={dcInfo}
            invChargeList={invChargeList}
            withLogo={withLogo}
          />
        );
      }

      const pdfBlob = await pdf(doc).toBlob();
      let defaultFileName = "";

      if (pdfType === "CIPL") {
        defaultFileName = `${formValues.refNumber}(COMMERCIAL INVOICE/PACKING LIST).pdf`;
      } else if (pdfType === "PL") {
        defaultFileName = `${formValues.refNumber}(PACKING LIST).pdf`;
      }

      let modalInstance: any;
      let localSendMailState = true; // 모달 내부에서 사용할 로컬 상태

      modalInstance = Modal.confirm({
        title: "Logistics PDF File",
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

  // CIPL 헤더 저장
  const SaveCIPLHeader = async (header: CIPLHeaderFormData) => {
    try {
      const response = await saveCIPLHeader(Number(logisticsId), header);
      setPdfCIPLHeader(response);
      message.success("Header saved successfully");
    } catch (error) {
      console.error("Error occurred while saving Header:", error);
      message.error("Failed to save Header. Please try again.");
    }
  };

  // 주문 컨펌 함수(ORDER -> LOGISTICS)
  const handleConfirmClick = async () => {
    try {
      await confirmLogistics(Number(logisticsId));
      message.success("Confirmed successfully.");
      navigate("/logisticsList");
    } catch (error) {
      console.error("Error occurred while confirming:", error);
      message.error("Failed to confirm. Please try again.");
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!logisticsData) {
    return <div>Logistics not found.</div>;
  }

  return (
    <Container>
      <Title>Logistics Detail</Title>
      {formValues && (
        <FormComponent formValues={formValues} setFormValues={setFormValues} />
      )}
      <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
        Logistics Date Information
      </Divider>
      <LogisticsDateComponent
        logisticsDate={logisticsDate}
        setLogisticsDate={setLogisticsDate}
      />
      <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
        Logistics Item List
      </Divider>
      {items && supplier && (
        <TableComponent
          itemDetails={items}
          setItemDetails={setItems}
          handleInputChange={handleInputChange}
          currency={logisticsData.documentInfo.currency}
          roundToTwoDecimalPlaces={roundToTwoDecimalPlaces}
          calculateTotalAmount={calculateTotalAmount}
          handleMarginChange={handleMarginChange}
          handlePriceInputChange={handlePriceInputChange}
          logisticsId={logisticsData.documentInfo.logisticsId || 0}
          supplier={supplier}
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
        <Button type="primary" onClick={handleConfirmClick}>
          Confirm
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
          <Select.Option value="CIPL">
            COMMERCIAL INVOICE / PACKING LIST
          </Select.Option>
          <Select.Option value="PL">PACKING LIST</Select.Option>
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
        {(pdfType === "CIPL" || pdfType === "PL") && (
          <Checkbox
            checked={withLogo}
            onChange={() => setWithLogo(!withLogo)}
            style={{ marginLeft: 10 }}
          >
            With Logo
          </Checkbox>
        )}
      </div>
      {(pdfType === "CIPL" || pdfType === "PL") &&
        showPDFPreview &&
        formValues && (
          <CIPLDocument
            mode={pdfType}
            info={formValues}
            items={items}
            pdfHeader={pdfCIPLHeader}
            viewMode={true}
            language={language}
            finalTotals={finalTotals}
            dcInfo={dcInfo}
            invChargeList={invChargeList}
            withLogo={withLogo}
          />
        )}
      {(pdfType === "CIPL" || pdfType === "PL") && headerEditModalVisible && (
        <CIPLHeaderEditModal
          open={headerEditModalVisible}
          onSave={SaveCIPLHeader}
          onClose={handleCloseHeaderModal}
          pdfCIPLHeader={pdfCIPLHeader}
          setPdfCIPLHeader={setPdfCIPLHeader}
          loadedCIPLHeader={loadedCIPLHeader}
        />
      )}
    </Container>
  );
};

export default LogisticsDetail;
