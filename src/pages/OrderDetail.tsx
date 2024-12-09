import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Divider, message, Select } from "antd";
import styled from "styled-components";
import dayjs, { Dayjs } from "dayjs";
import { editOrder, fetchOrderDetail } from "../api/api";
import {
  HeaderFormData,
  InvCharge,
  Order,
  OrderAckHeaderFormData,
  OrderItemDetail,
  OrderRequest,
  OrderResponse,
  OrderSupplier,
} from "../types/types";
// import TableComponent from "../components/order/TableComponent";
import LoadingSpinner from "../components/LoadingSpinner";
import FormComponent from "../components/orderDetail/FormComponent";
import TableComponent from "../components/orderDetail/TableComponent";
import TotalCardsComponent from "../components/makeOffer/TotalCardsComponent";
import PurchaseOrderPDFDocument from "../components/orderDetail/PurchaseOrder";
import POHeaderEditModal from "../components/orderDetail/POHeaderEditModal";
import OrderAckHeaderEditModal from "../components/orderDetail/OrderAckHeaderEditModal";
import OrderAckPDFDocument from "../components/orderDetail/OrderAckPDFDocument";
import ChangeSupplierModal from "../components/orderDetail/ChangeSupplierModal";

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

const INITIAL_HEADER_VALUES: OrderAckHeaderFormData = {
  quotationHeaderId: null,
  portOfShipment: "BUSAN, KOREA",
  deliveryTime: dayjs().format("DD MMM, YYYY").toUpperCase(),
  termsOfPayment: "",
  incoterms: "EX WORKS",
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const [formValues, setFormValues] = useState<Order>();
  const [items, setItems] = useState<OrderItemDetail[]>([]);
  const [supplier, setSupplier] = useState<OrderSupplier>();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invChargeList, setInvChargeList] = useState<InvCharge[] | null>([]);
  const [dcInfo, setDcInfo] = useState({
    dcPercent: 0,
    dcKrw: 0,
    dcGlobal: 0,
  });
  const [supplierInfoList, setSupplierInfoList] = useState<OrderSupplier[]>([]);
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
  const [pdfType, setPdfType] = useState<string>("PO");
  const [pdfPOHeader, setPdfPOHeader] = useState<string>(
    "1. 귀사의 무궁한 발전을 기원합니다.\n2. 하기와 같이 발주하오니 업무에 참조하시기 바랍니다."
  );
  const [pdfPOFooter, setPdfPOFooter] = useState<string>(
    "1. 세금 계산서 - 법인\n2. 희망 납기일 - \n3. 예정 납기일 포함된 발주서 접수 회신 메일 부탁 드립니다. 감사합니다."
  );
  const [pdfOrderAckHeader, setPdfOrderAckHeader] =
    useState<OrderAckHeaderFormData>(INITIAL_HEADER_VALUES);
  const [pdfOrderAckFooter, setPdfOrderAckFooter] = useState<
    { quotationRemarkId: number | null; quotationRemark: string }[]
  >([]);
  const [supplierInfoListModalVisible, setSupplierInfoListModalVisible] =
    useState<boolean>(false);

  useEffect(() => {
    if (language === "KOR") {
      setPdfPOHeader(
        "1. 귀사의 무궁한 발전을 기원합니다.\n2. 하기와 같이 발주하오니 업무에 참조하시기 바랍니다."
      );
      setPdfPOFooter(
        "1. 세금 계산서 - 법인\n2. 희망 납기일 - \n3. 예정 납기일 포함된 발주서 접수 회신 메일 부탁 드립니다. 감사합니다."
      );
    } else {
      setPdfPOHeader("EXPECTED DELIVERY DATE : ");
      setPdfPOFooter("");
    }
  }, [language]);

  console.log(supplierInfoList);

  useEffect(() => {
    const loadOrderDetail = async () => {
      try {
        const data: OrderResponse = await fetchOrderDetail(Number(orderId));
        setOrderData(data);
        setFormValues(data.documentInfo);
        setItems(data.itemDetailList);
        setSupplier(data.suppliers[0]);
        setInvChargeList(data.invChargeList);
        setDcInfo({
          dcPercent: data.documentInfo.discount || 0,
          dcKrw: 0,
          dcGlobal: 0,
        });
        setSupplierInfoList(data.supplierInfoList);
      } catch (error) {
        message.error("Failed to load order detail.");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderDetail();
  }, [orderId]);

  const handleOrderAckHeaderSave = async (
    header: OrderAckHeaderFormData,
    footer: { quotationRemarkId: number | null; quotationRemark: string }[]
  ) => {
    setPdfOrderAckHeader(header);
    setPdfOrderAckFooter(footer);
    setHeaderEditModalVisible(false);
  };

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
      formValues?.currency || orderData?.documentInfo.currency || 1050;
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

    const totalProfit = totalSalesAmountGlobal * 1350 - totalPurchaseAmountKRW;
    const totalProfitPercent = Number(
      ((totalProfit / (totalSalesAmountGlobal * 1350)) * 100).toFixed(2)
    );
    const updatedTotalProfit =
      updatedTotalSalesAmountGlobal * 1350 - totalPurchaseAmountKRW;
    const updatedTotalProfitPercent = Number(
      (
        (updatedTotalProfit / (updatedTotalSalesAmountGlobal * 1350)) *
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

    const request: OrderRequest = {
      orderId: Number(orderId),
      supplierId: supplier?.supplierId || 0,
      documentEditInfo: formValues,
      invChargeList: invChargeList,
      itemDetailList: items,
    };
    await editOrder(Number(orderId), request);
  };

  const handleChangeSupplier = () => {
    setSupplierInfoListModalVisible(true);
  };

  const handleCloseSupplierInfoListModal = () => {
    setSupplierInfoListModalVisible(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!orderData) {
    return <div>Order not found.</div>;
  }

  return (
    <Container>
      <Title>Order Detail</Title>
      {formValues && <FormComponent formValues={formValues} />}
      <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
        Order Item List
      </Divider>
      <Button
        type="primary"
        onClick={handleChangeSupplier}
        style={{ marginBottom: 10 }}
      >
        Change Supplier
      </Button>
      {items && supplier && (
        <TableComponent
          itemDetails={items}
          setItemDetails={setItems}
          handleInputChange={handleInputChange}
          currency={orderData.documentInfo.currency}
          roundToTwoDecimalPlaces={roundToTwoDecimalPlaces}
          calculateTotalAmount={calculateTotalAmount}
          handleMarginChange={handleMarginChange}
          handlePriceInputChange={handlePriceInputChange}
          orderId={orderData.documentInfo.orderId || 0}
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
          style={{ width: 230, marginLeft: 10 }}
          value={pdfType}
          onChange={setPdfType}
        >
          <Select.Option value="PO">PURCHASE ORDER</Select.Option>
          <Select.Option value="OA">ORDER ACKNOWLEDGEMENT</Select.Option>
        </Select>
        <Button
          style={{ marginLeft: 10 }}
          onClick={handlePDFPreview}
          type="default"
        >
          {showPDFPreview ? "Close Preview" : "PDF Preview"}
        </Button>
      </div>
      {pdfType === "PO" && showPDFPreview && formValues && supplier && (
        <PurchaseOrderPDFDocument
          info={formValues}
          items={items}
          pdfHeader={pdfPOHeader}
          viewMode={true}
          language={language}
          pdfFooter={pdfPOFooter}
          finalTotals={finalTotals}
          supplier={supplier}
        />
      )}
      {pdfType === "OA" && showPDFPreview && formValues && (
        <OrderAckPDFDocument
          info={formValues}
          items={items}
          pdfHeader={pdfOrderAckHeader}
          viewMode={true}
          language={language}
          pdfFooter={pdfOrderAckFooter}
          finalTotals={finalTotals}
          dcInfo={dcInfo}
          invChargeList={invChargeList}
        />
      )}
      {pdfType === "PO" && headerEditModalVisible && (
        <POHeaderEditModal
          visible={headerEditModalVisible}
          onClose={handleCloseHeaderModal}
          pdfPOHeader={pdfPOHeader}
          pdfPOFooter={pdfPOFooter}
          setPdfPOHeader={setPdfPOHeader}
          setPdfPOFooter={setPdfPOFooter}
          language={language}
          setLanguage={setLanguage}
        />
      )}
      {pdfType === "OA" && headerEditModalVisible && (
        <OrderAckHeaderEditModal
          open={headerEditModalVisible}
          onSave={handleOrderAckHeaderSave}
          onClose={handleCloseHeaderModal}
          pdfHeader={pdfOrderAckHeader}
          pdfFooter={pdfOrderAckFooter}
        />
      )}
      {supplierInfoListModalVisible && (
        <ChangeSupplierModal
          visible={supplierInfoListModalVisible}
          onClose={handleCloseSupplierInfoListModal}
          supplierInfoList={supplierInfoList}
          setItems={setItems}
        />
      )}
    </Container>
  );
};

export default OrderDetail;
