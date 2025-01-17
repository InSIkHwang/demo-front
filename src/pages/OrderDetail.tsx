import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  Divider,
  Input,
  message,
  Modal,
  Select,
  DatePicker,
} from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import {
  confirmOrder,
  editOrder,
  fetchOrderDetail,
  saveOrderHeader,
  updateOrderStatus,
} from "../api/api";
import {
  InvCharge,
  Order,
  OrderAckHeaderFormData,
  OrderItemDetail,
  orderRemark,
  OrderRequest,
  OrderResponse,
  OrderSupplier,
} from "../types/types";
import LoadingSpinner from "../components/LoadingSpinner";
import FormComponent from "../components/orderDetail/FormComponent";
import TableComponent from "../components/orderDetail/TableComponent";
import TotalCardsComponent from "../components/makeOffer/TotalCardsComponent";
import PurchaseOrderPDFDocument from "../components/orderDetail/PurchaseOrder";
import POHeaderEditModal from "../components/orderDetail/POHeaderEditModal";
import OrderAckHeaderEditModal from "../components/orderDetail/OrderAckHeaderEditModal";
import OrderAckPDFDocument from "../components/orderDetail/OrderAckPDFDocument";
import ChangeSupplierModal from "../components/orderDetail/ChangeSupplierModal";
import { pdf } from "@react-pdf/renderer";
import {
  parseEnglishDate,
  parseKoreanDate,
} from "../components/orderList/DetailOrderModal";
import { parseDeliveryTime } from "../components/orderList/DetailOrderModal";
import PDFDownloadComponent from "../components/orderDetail/PDFDownloadComponent";

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
  orderHeaderId: null,
  portOfShipment: "BUSAN, KOREA",
  deliveryTime: dayjs().format("DD MMM YYYY").toUpperCase(),
  termsOfPayment: "",
  incoterms: "EX WORKS",
  receiverType: "CUSTOMER",
  packing: "UNPACKED",
};

const ConfirmModalContent = ({
  isProforma,
  setIsProforma,
  confirmDates,
  setConfirmDates,
}: {
  isProforma: boolean;
  setIsProforma: (checked: boolean) => void;
  confirmDates: {
    expectedReceivingDate: string;
    deliveryDate: string;
  };
  setConfirmDates: (dates: {
    expectedReceivingDate: string;
    deliveryDate: string;
  }) => void;
}) => {
  return (
    <div style={{ marginTop: 16 }}>
      <Checkbox
        style={{
          marginBottom: 16,
          fontSize: 16,
          color: "#1890ff",
        }}
        checked={isProforma}
        onChange={(e) => setIsProforma(e.target.checked)}
      >
        Proforma Invoice
      </Checkbox>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          Expected Receiving Date.(예상 입고일)
        </div>
        <DatePicker
          style={{ width: "100%" }}
          format="YYYY-MM-DD"
          value={
            confirmDates.expectedReceivingDate
              ? dayjs(confirmDates.expectedReceivingDate)
              : null
          }
          onChange={(date) => {
            setConfirmDates({
              expectedReceivingDate: date ? date.format("YYYY-MM-DD") : "",
              deliveryDate: confirmDates.deliveryDate,
            });
          }}
          placeholder="Expected Receiving Date.(예상 입고일)"
          disabled={isProforma}
        />
      </div>
      <div>
        <div style={{ marginBottom: 8 }}>Delivery Date.(납기일)</div>
        <DatePicker
          style={{ width: "100%" }}
          format="YYYY-MM-DD"
          value={
            confirmDates.deliveryDate ? dayjs(confirmDates.deliveryDate) : null
          }
          onChange={(date) => {
            setConfirmDates({
              expectedReceivingDate: confirmDates.expectedReceivingDate,
              deliveryDate: date ? date.format("YYYY-MM-DD") : "",
            });
          }}
          placeholder="Delivery Date.(납기일)"
          disabled={isProforma}
        />
      </div>
    </div>
  );
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
  const [language, setLanguage] = useState<string>("KOR");
  const [headerEditModalVisible, setHeaderEditModalVisible] =
    useState<boolean>(false);
  const [pdfType, setPdfType] = useState<string>("PO");
  const [pdfPOHeader, setPdfPOHeader] = useState<{
    orderHeaderId: number | null;
    receiverType: string;
  }>({
    orderHeaderId: null,
    receiverType: "SUPPLIER",
  });
  const [pdfPOFooter, setPdfPOFooter] = useState<orderRemark>({
    orderRemarkId: null,
    orderRemark:
      "1. 귀사의 무궁한 발전을 기원합니다.\n2. 상기와 같이 발주하오니 업무에 참조하시기 바랍니다.\n3. 세금 계산서 - 법인\n4. 희망 납기일 - 월 일\n5. 예정 납기일 포함된 발주서 접수 회신 메일 부탁 드립니다. 감사합니다.",
  });
  const [pdfOrderAckHeader, setPdfOrderAckHeader] =
    useState<OrderAckHeaderFormData>(INITIAL_HEADER_VALUES);
  const [pdfOrderAckFooter, setPdfOrderAckFooter] = useState<orderRemark[]>([]);
  const [supplierInfoListModalVisible, setSupplierInfoListModalVisible] =
    useState<boolean>(false);
  const [confirmDates, setConfirmDates] = useState({
    expectedReceivingDate: "",
    deliveryDate: "",
  });
  const [isProforma, setIsProforma] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const prevItems = useRef<typeof items>([]);
  const [isUpdatingGlobalPrices, setIsUpdatingGlobalPrices] =
    useState<boolean>(false);

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

  // 언어 변경 시 PDF 헤더 및 푸터 업데이트
  useEffect(() => {
    if (language === "KOR") {
      setPdfPOHeader((prev) => ({
        orderHeaderId: prev.orderHeaderId,
        receiverType: "SUPPLIER",
      }));
      setPdfPOFooter((prev) => ({
        orderRemarkId: prev.orderRemarkId,
        orderRemark:
          "1. 귀사의 무궁한 발전을 기원합니다.\n2. 상기와 같이 발주하오니 업무에 참조하시기 바랍니다.\n3. 세금 계산서 - 법인\n4. 희망 납기일 - 월 일 \n5. 예정 납기일 포함된 발주서 접수 회신 메일 부탁 드립니다. 감사합니다.",
      }));
    } else {
      setPdfPOHeader((prev) => ({
        orderHeaderId: prev.orderHeaderId,
        receiverType: "SUPPLIER",
      }));
      setPdfPOFooter((prev) => ({
        orderRemarkId: prev.orderRemarkId,
        orderRemark: "EXPECTED DELIVERY DATE : ",
      }));
    }
  }, [language]);

  // 주문 상세 데이터 로드 함수
  const loadOrderDetail = async () => {
    try {
      const data: OrderResponse = await fetchOrderDetail(Number(orderId));

      const sortedItems = data.itemDetailList.sort(
        (a, b) => a.position - b.position
      );
      setOrderData(data);
      setFormValues(data.documentInfo);
      setItems(sortedItems);
      setSupplier(data.suppliers[0]);
      setInvChargeList(data.invChargeList);
      setDcInfo({
        dcPercent: data.documentInfo.discount || 0,
        dcKrw: 0,
        dcGlobal: 0,
      });
      setSupplierInfoList(data.supplierInfoList);
      setPdfOrderAckHeader(
        data.orderHeaderResponse?.orderCustomerHeader || INITIAL_HEADER_VALUES
      );
      setPdfOrderAckFooter(data.orderHeaderResponse?.orderCustomerRemark || []);
      setPdfPOHeader({
        orderHeaderId:
          data.orderHeaderResponse?.orderSupplierHeader?.orderHeaderId || null,
        receiverType: "SUPPLIER",
      });
      setPdfPOFooter(
        data.orderHeaderResponse?.orderSupplierRemark[0] || {
          orderRemarkId: null,
          orderRemark:
            "1. 귀사의 무궁한 발전을 기원합니다.\n2. 상기와 같이 발주하오니 업무에 참조하시기 바랍니다.\n3. 세금 계산서 - 법인\n4. 희망 납기일 - 월 일 \n5. 예정 납기일 포함된 발주서 접수 회신 메일 부탁 드립니다. 감사합니다.",
        }
      );
      // 날짜 초기값 설정
      let expectedDate = null;
      let deliveryDate = null;

      // orderSupplierRemark에서 예상 입고일 파싱
      if (data?.orderHeaderResponse?.orderSupplierRemark?.[0]?.orderRemark) {
        const remarks =
          data.orderHeaderResponse.orderSupplierRemark[0].orderRemark.split(
            "\n"
          );
        for (const remark of remarks) {
          const koreanDate = parseKoreanDate(remark);
          const englishDate = parseEnglishDate(remark);
          if (koreanDate || englishDate) {
            expectedDate = koreanDate || englishDate;
            break;
          }
        }
      }

      // orderCustomerHeader에서 납기일 파싱
      if (data?.orderHeaderResponse?.orderCustomerHeader?.deliveryTime) {
        deliveryDate = parseDeliveryTime(
          data.orderHeaderResponse.orderCustomerHeader.deliveryTime
        );
      }

      // 날짜 상태 업데이트
      setConfirmDates({
        expectedReceivingDate: expectedDate || "",
        deliveryDate: deliveryDate || "",
      });
    } catch (error) {
      console.error("Order detail error:", error);
      message.error("Failed to load order detail.");
    } finally {
      setIsLoading(false);
    }
  };

  // 주문 상세 데이터 로드 함수
  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  // 입력 값 변경 함수
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

  //환율 변경 시 모든 아이템의 글로벌 가격을 업데이트하는 함수
  //KRW 가격을 기준으로 현재 설정된 환율에 따라 글로벌 가격을 재계산
  const updateGlobalPrices = useCallback(() => {
    setItems((prevItems) => {
      if (!prevItems || !supplier) return prevItems;

      const updatedItems = prevItems.map((record) => {
        if (!record || record.itemType !== "ITEM") return record;

        // 기존 KRW 가격 기준으로 새로운 Global 가격 계산
        const updatedSalesPriceGlobal = convertCurrency(
          record.salesPriceKRW,
          formValues?.currency || 1050,
          "USD"
        );
        const updatedPurchasePriceGlobal = convertCurrency(
          record.purchasePriceKRW,
          formValues?.currency || 1050,
          "USD"
        );

        // 금액 계산은 한 번만 수행
        const salesAmountKRW = calculateTotalAmount(
          record.salesPriceKRW,
          record.qty
        );
        const salesAmountGlobal = calculateTotalAmount(
          updatedSalesPriceGlobal,
          record.qty
        );
        const purchaseAmountKRW = calculateTotalAmount(
          record.purchasePriceKRW,
          record.qty
        );
        const purchaseAmountGlobal = calculateTotalAmount(
          updatedPurchasePriceGlobal,
          record.qty
        );

        return {
          ...record,
          salesPriceGlobal: updatedSalesPriceGlobal,
          purchasePriceGlobal: updatedPurchasePriceGlobal,
          salesAmountKRW,
          salesAmountGlobal,
          purchaseAmountKRW,
          purchaseAmountGlobal,
        };
      });

      return updatedItems;
    });
  }, [supplier, formValues?.currency, convertCurrency, calculateTotalAmount]);

  // 환율 변경 시 실행되는 useEffect
  useEffect(() => {
    if (formValues?.currency) {
      const timer = setTimeout(async () => {
        setIsUpdatingGlobalPrices(true); // 업데이트 시작
        updateGlobalPrices(); // updateGlobalPrices가 완료될 때까지 대기
        applyDcAndCharge("multiple"); // 그 후에 DC와 Charge 적용
        setIsUpdatingGlobalPrices(false); // 업데이트 완료
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formValues?.currency]);

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

  // combinedItemDetails 변경 시 실행되는 useEffect 수정
  useEffect(() => {
    if (items.length > 0) {
      const hasChanged =
        JSON.stringify(items) !== JSON.stringify(prevItems.current);

      if (hasChanged && !isUpdatingGlobalPrices) {
        // 글로벌 가격 업데이트 중이 아닐 때만 실행
        prevItems.current = items;
        applyDcAndCharge("multiple");
      }
    }
  }, [items]);

  // 환율 변경 시 실행되는 useEffect
  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(() => {
        applyDcAndCharge("multiple");
      }, 300); // 300ms 후에 실행
      return () => clearTimeout(timer); // cleanup 함수
    }
  }, [formValues?.currency]);

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
      documentEditInfo: { ...formValues, discount: dcInfo.dcPercent },
      invChargeList: invChargeList,
      itemDetailList: items,
    };

    try {
      await editOrder(Number(orderId), request);
      message.success("Order saved successfully");

      loadOrderDetail();
    } catch (error) {
      console.error("Error saving order:", error);
      message.error("Failed to save order. Please try again.");
    }
  };

  const handleChangeSupplier = () => {
    setSupplierInfoListModalVisible(true);
  };

  const handleCloseSupplierInfoListModal = () => {
    setSupplierInfoListModalVisible(false);
  };

  const handlePdfTypeChange = (value: string) => {
    setPdfType(value);
    // OA 선택 시 영어로, PO 선택 시 한글로 자동 변경
    setLanguage(value === "PO" ? "KOR" : "ENG");
  };

  // PDF 다운로드 로직
  const downloadPDF = async (doc: JSX.Element, fileName: string) => {
    try {
      const pdfBlob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Download Error:", error);
      message.error("PDF Download Error");
    }
  };

  // 공통 함수: PDF 다운로드
  const handleMultiplePDFDownload = async (
    selectedTypes: {
      type: string;
      language: string;
      fileName: string;
      checked: boolean;
    }[],
    updateProgress: (downloaded: number) => void
  ) => {
    if (!formValues || !supplier || !items || !supplier.supplierId) {
      message.error("Please fill in all fields.");
      return;
    }

    let downloadedCount = 0;

    for (const { type, language, fileName, checked } of selectedTypes) {
      if (!checked) continue;
      let doc: JSX.Element | undefined;

      try {
        await updateOrderStatus(Number(orderId), type);
      } catch (error) {
        message.error("Error updating order status");
        console.error("Error updating order status:", error);

        return;
      }

      if (type === "PO") {
        doc = (
          <PurchaseOrderPDFDocument
            info={formValues}
            items={items}
            pdfHeader={pdfPOHeader}
            viewMode={false}
            language={language}
            pdfFooter={pdfPOFooter}
            finalTotals={finalTotals}
            supplier={supplier}
          />
        );
      } else if (type === "OA") {
        doc = (
          <OrderAckPDFDocument
            info={formValues}
            items={items}
            pdfHeader={pdfOrderAckHeader}
            viewMode={false}
            language={language}
            pdfFooter={pdfOrderAckFooter}
            finalTotals={finalTotals}
            dcInfo={dcInfo}
            invChargeList={invChargeList}
          />
        );
      } else {
        console.error(`Unsupported document type: ${type}`);
        message.error(`Unsupported document type: ${type}`);
        continue;
      }

      if (doc) {
        downloadedCount++;
        updateProgress(downloadedCount);
        await downloadPDF(doc, fileName);
      } else {
        message.error("Failed to generate PDF document.");
      }
    }
  };

  // 공통 함수: 헤더 저장
  const commonSaveHeader = async (
    header:
      | OrderAckHeaderFormData
      | {
          orderHeaderId: number | null;
          receiverType: string;
        },
    footer: orderRemark[]
  ) => {
    const response = await saveOrderHeader(Number(orderId), header, footer);
    if (header.receiverType === "PO") {
      setPdfPOHeader(response.orderSupplierHeader);
      setPdfPOFooter(response.orderSupplierRemark);
    } else if (header.receiverType === "OA") {
      setPdfOrderAckHeader(response.orderCustomerHeader);
      setPdfOrderAckFooter(response.orderCustomerRemark);
    }
  };

  // 주문 컨펌 함수
  const handleConfirmClick = () => {
    setConfirmModalVisible(true);
  };

  const handleModalConfirm = async () => {
    if (
      !isProforma &&
      (!confirmDates.expectedReceivingDate || !confirmDates.deliveryDate)
    ) {
      message.error("Please fill in all fields.(날짜를 모두 입력해주세요.)");
      return;
    }

    try {
      await confirmOrder(
        Number(orderId),
        isProforma ? "" : confirmDates.expectedReceivingDate,
        isProforma ? "" : confirmDates.deliveryDate,
        isProforma
      );
      message.success("Order confirmed successfully.");
      navigate("/orderlist");
    } catch (error) {
      console.error("Error occurred while confirming:", error);
      message.error("Failed to confirm. Please try again.");
    }
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
      {formValues && (
        <FormComponent formValues={formValues} setFormValues={setFormValues} />
      )}
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
        {supplier && formValues && (
          <PDFDownloadComponent
            onDownload={handleMultiplePDFDownload}
            supplier={supplier}
            formValues={formValues}
          />
        )}
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
          commonSaveHeader={commonSaveHeader}
        />
      )}
      {pdfType === "OA" && headerEditModalVisible && (
        <OrderAckHeaderEditModal
          open={headerEditModalVisible}
          onSave={commonSaveHeader}
          onClose={handleCloseHeaderModal}
          pdfHeader={pdfOrderAckHeader}
          pdfFooter={pdfOrderAckFooter}
          setPdfOrderAckHeader={setPdfOrderAckHeader}
          setPdfOrderAckFooter={setPdfOrderAckFooter}
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
      <Modal
        title="Confirm Order"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onOk={handleModalConfirm}
        width={500}
        okText="Confirm"
        cancelText="Cancel"
      >
        <ConfirmModalContent
          isProforma={isProforma}
          setIsProforma={setIsProforma}
          confirmDates={confirmDates}
          setConfirmDates={setConfirmDates}
        />
      </Modal>
    </Container>
  );
};

export default OrderDetail;
