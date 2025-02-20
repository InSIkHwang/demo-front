import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Button,
  Checkbox,
  Divider,
  FloatButton,
  Input,
  message,
  Modal,
  Select,
  Tabs,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  SaveOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  RollbackOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import dayjs from "dayjs";
import FormComponent from "../components/makeOffer/FormComponent";
import TableComponent from "../components/makeOffer/TableComponent";
import {
  changeOfferStatus,
  checkOfferPdfDocNumber,
  deleteSupplierInquiry,
  editOffer,
  fetchOfferDetail,
  saveOfferHeader,
} from "../api/api";
import {
  FormValuesType,
  HeaderFormData,
  ItemDetailType,
  offerEmailSendData,
  OfferResponse,
  SupplierInfo,
} from "../types/types";
import OfferHeaderEditModal from "../components/makeOffer/OfferHeaderEditModal";
import OfferPDFDocument from "../components/makeOffer/OfferPDFDocument";
import LoadingSpinner from "../components/LoadingSpinner";
import OfferPDFGenerator from "../components/makeOffer/OfferPDFGenerator";
import OfferMailSender from "../components/makeOffer/OfferSendMail";
import { InvCharge } from "./../types/types";
import TotalCardsComponent from "../components/makeOffer/TotalCardsComponent";
import { pdf } from "@react-pdf/renderer";

const FormContainer = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  padding-bottom: 80px;
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

const INITIAL_HEADER_VALUES: HeaderFormData = {
  quotationHeaderId: null,
  portOfShipment: "BUSAN, KOREA",
  deliveryTime: "WORKING DAYS AFTER ORDER",
  termsOfPayment: "",
  incoterms: "EX WORKS",
  offerValidity: "30 DAYS",
  partCondition: "",
  packing: "UNPACKED",
};

const MakeOffer = () => {
  const { state } = useLocation();
  const { documentId: urlDocumentId } = useParams();
  const [searchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const loadDocumentId = {
    documentId: state?.info.documentId || Number(urlDocumentId) || [],
  };
  const [dataSource, setDataSource] = useState<OfferResponse | null>(null);
  const [currentInquiryId, setCurrentInquiryId] = useState<number | null>(null);
  const [currentSupplierInfo, setCurrentSupplierInfo] =
    useState<SupplierInfo | null>(null);
  const [currentDetailItems, setCurrentDetailItems] = useState<
    ItemDetailType[]
  >([]);
  const [currentSupplierInquiryName, setCurrentSupplierInquiryName] =
    useState("");
  const [newDocumentInfo, setNewDocumentInfo] = useState<FormValuesType | null>(
    null
  );
  const [formValues, setFormValues] = useState<FormValuesType>({
    documentId: 0,
    documentNumber: "",
    registerDate: dayjs(),
    shippingDate: dayjs(),
    refNumber: "",
    currencyType: "",
    currency: 0,
    docRemark: "",
    docManager: "",
    documentStatus: "",
    customerId: 0,
    companyName: "",
    vesselId: 0,
    vesselName: "",
    vesselHullNo: "",
    imoNo: 0,
    discount: 0,
    color: "#fff",
  });
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [language, setLanguage] = useState<string>("ENG");
  const [headerEditModalVisible, setHeaderEditModalVisible] =
    useState<boolean>(false);
  const [pdfHeader, setPdfHeader] = useState<HeaderFormData>(
    INITIAL_HEADER_VALUES
  );
  const [pdfFooter, setPdfFooter] = useState<
    { quotationRemarkId: number | null; quotationRemark: string }[]
  >([]);
  const [pdfCustomerTag, setPdfCustomerTag] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMailSenderVisible, setIsMailSenderVisible] = useState(false);
  const [mailData, setMailData] = useState<offerEmailSendData | null>(null);
  const [pdfFileData, setPdfFileData] = useState<File | null>(null);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<
    Array<{ supplierId: number; inquiryId: number }>
  >([]);
  const [combinedItemDetails, setCombinedItemDetails] = useState<
    ItemDetailType[]
  >([]);
  const [tableTotals, setTableTotals] = useState({
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
  const [dcInfo, setDcInfo] = useState({
    dcPercent: 0,
    dcKrw: 0,
    dcGlobal: 0,
  });
  const [invChargeList, setInvChargeList] = useState<InvCharge[] | null>([]);
  const [cusVesIdList, setCusVesIdList] = useState<{
    customerId: number | null;
    vesselId: number | null;
  }>({ customerId: null, vesselId: null });
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<string>("");
  const prevCombinedItemDetails = useRef<typeof combinedItemDetails>([]);
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

  useEffect(() => {
    loadOfferDetail();
  }, []);

  // 단축키 저장 핸들러
  const handleKeyboardSave = useCallback(
    async (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        event.stopPropagation();

        if (!formValues.refNumber || formValues.refNumber.trim() === "") {
          message.error("Reference number is required");
          return;
        }

        await handleSave(false, activeKey);
      }
    },
    [
      formValues,
      currentDetailItems,
      activeKey,
      finalTotals,
      invChargeList,
      dcInfo,
    ]
  );

  // 단축키 저장 이벤트 핸들러 등록
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
        return Math.round(value * currency);
      }
      return roundToTwoDecimalPlaces(value / currency);
    },
    [roundToTwoDecimalPlaces]
  );

  // 입력 핸들러
  const handleInputChange = useCallback(
    (index: number, key: keyof ItemDetailType, value: any) => {
      setCurrentDetailItems((prevItems: ItemDetailType[]) => {
        if (!prevItems?.[index]) return prevItems;
        if (prevItems[index][key] === value) return prevItems;

        const newItems = [...prevItems];
        // 타입, 리마크 변경 시 가격 초기화
        const shouldResetPrices =
          (key === "itemType" && value !== "ITEM" && value !== "DASH") ||
          (key === "itemRemark" && value);

        newItems[index] = {
          ...newItems[index],
          [key]: value,
          ...(["itemName", "itemCode"].includes(key) && newItems[index].itemId
            ? { itemId: null }
            : {}),
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

  // 총 금액 계산 함수
  const calculateTotalAmount = useCallback(
    (price: number, qty: number, type: string) => {
      if (type === "KRW") {
        return Math.round(price * qty);
      }
      return roundToTwoDecimalPlaces(price * qty);
    },
    []
  );

  //환율 변경 시 모든 아이템의 글로벌 가격을 업데이트하는 함수
  //KRW 가격을 기준으로 현재 설정된 환율에 따라 글로벌 가격을 재계산
  const updateGlobalPrices = useCallback(() => {
    setCurrentDetailItems((prevItems) => {
      if (!prevItems || !currentSupplierInfo) return prevItems;

      const updatedItems = prevItems.map((record) => {
        if (!record || record.itemType !== "ITEM") return record;

        // 기존 KRW 가격 기준으로 새로운 Global 가격 계산
        const updatedSalesPriceGlobal = convertCurrency(
          record.salesPriceKRW,
          formValues.currency,
          "USD"
        );
        const updatedPurchasePriceGlobal = convertCurrency(
          record.purchasePriceKRW,
          formValues.currency,
          "USD"
        );

        // 금액 계산은 한 번만 수행
        const salesAmountKRW = calculateTotalAmount(
          record.salesPriceKRW,
          record.qty,
          "KRW"
        );
        const salesAmountGlobal = calculateTotalAmount(
          updatedSalesPriceGlobal,
          record.qty,
          "USD"
        );
        const purchaseAmountKRW = calculateTotalAmount(
          record.purchasePriceKRW,
          record.qty,
          "KRW"
        );
        const purchaseAmountGlobal = calculateTotalAmount(
          updatedPurchasePriceGlobal,
          record.qty,
          "USD"
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
  }, [
    currentSupplierInfo,
    formValues.currency,
    convertCurrency,
    calculateTotalAmount,
  ]);

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

  // 데이터 로드 및 상태 업데이트 함수
  const loadOfferDetail = async () => {
    setIsLoading(true);
    if (loadDocumentId) {
      try {
        const response: OfferResponse = await fetchOfferDetail(
          loadDocumentId.documentId
        );

        setDataSource({
          documentInfo: response.documentInfo,
          response: response.response,
        });

        setPdfCustomerTag({
          id: response.documentInfo.customerId,
          name: response.documentInfo.companyName,
        });

        // 현재 선택된 공급업체 찾기
        const currentSupplier = response.response.find(
          (supplier: { inquiryId: number }) =>
            supplier.inquiryId === currentInquiryId
        );

        if (currentSupplier) {
          setNewDocumentInfo({
            ...response.documentInfo,
            documentNumber:
              currentSupplier.supplierInquiryName ||
              response.documentInfo.documentNumber,
          });
          // 현재 선택된 공급업체의 데이터로 설정

          setCurrentDetailItems(currentSupplier.itemDetail);
          setCurrentSupplierInfo(currentSupplier.supplierInfo);
          setCurrentInquiryId(currentSupplier.inquiryId);

          setCurrentSupplierInquiryName(currentSupplier.supplierInquiryName);
          setPdfHeader(
            currentSupplier.quotationHeader || INITIAL_HEADER_VALUES
          );
          setPdfFooter(
            Array.isArray(currentSupplier.quotationRemark) &&
              currentSupplier.quotationRemark.length === 1 &&
              currentSupplier.quotationRemark[0] === null
              ? []
              : currentSupplier.quotationRemark || []
          );

          handleSupplierSelect([
            {
              supplierId: currentSupplier.supplierInfo.supplierId,
              inquiryId: currentSupplier.inquiryId,
            },
          ]);
        } else {
          // 현재 선택된 공급업체가 없는 경우 (초기 로드)
          setNewDocumentInfo({
            ...response.documentInfo,
            documentNumber:
              response.response[0].supplierInquiryName ||
              response.documentInfo.documentNumber,
          });
          setCurrentDetailItems(response.response[0].itemDetail);
          setCurrentSupplierInfo(response.response[0].supplierInfo);
          setCurrentInquiryId(response.response[0].inquiryId);
          setCurrentSupplierInquiryName(
            response.response[0].supplierInquiryName
          );
          setPdfHeader(
            response.response[0].quotationHeader || INITIAL_HEADER_VALUES
          );
          setPdfFooter(
            Array.isArray(response.response[0].quotationRemark) &&
              response.response[0].quotationRemark.length === 1 &&
              response.response[0].quotationRemark[0] === null
              ? []
              : response.response[0].quotationRemark || []
          );

          handleSupplierSelect([
            {
              supplierId: response.response[0].supplierInfo.supplierId,
              inquiryId: response.response[0].inquiryId,
            },
          ]);
          // 초기 로드시에만 activeKey 설정
          if (!activeKey) {
            setActiveKey(response.response[0].inquiryId.toString());
          }
        }

        setFormValues({
          documentId: response.documentInfo.documentId,
          documentNumber: response.documentInfo.documentNumber,
          registerDate: dayjs(response.documentInfo.registerDate),
          shippingDate: dayjs(response.documentInfo.shippingDate),
          currencyType: response.documentInfo.currencyType,
          currency: response.documentInfo.currency,
          companyName: response.documentInfo.companyName,
          vesselName: response.documentInfo.vesselName,
          refNumber: response.documentInfo.refNumber,
          docRemark: response.documentInfo.docRemark,
          docManager: response.documentInfo.docManager,
          documentStatus: response.documentInfo.documentStatus,
          customerId: response.documentInfo.customerId,
          vesselId: response.documentInfo.vesselId,
          vesselHullNo: response.documentInfo.vesselHullNo,
          imoNo: response.documentInfo.imoNo || 0,
          discount: response.documentInfo.discount || 0,
          color: response.documentInfo.color || "#fff",
        });

        setCusVesIdList({
          customerId: response.documentInfo.customerId,
          vesselId: response.documentInfo.vesselId,
        });
        setDcInfo({
          dcPercent: response.documentInfo.discount || 0,
          dcKrw: 0,
          dcGlobal: 0,
        });
        setInvChargeList(response.documentInfo.invChargeList || []);
      } catch (error) {
        message.error("An error occurred while importing data.");
      }
    }
    setIsLoading(false);
  };

  // 가격 입력 핸들러
  const handlePriceInputChange = (
    index: number,
    key: keyof ItemDetailType,
    value: any,
    currency: number
  ) => {
    // 현재 선택된 아이템의 가격을 업데이트하는 함수
    setCurrentDetailItems((prevItems) => {
      const currentItem = prevItems[index];
      if (!currentItem) return prevItems;

      let updatedItem = { ...currentItem, [key]: value };
      const margin = currentItem.margin || 0;

      // 구매가격 변경 시 로직
      if (key === "purchasePriceGlobal") {
        const updatedKRWPrice = Math.round(
          convertCurrency(value, currency, "KRW")
        );
        const updatedSalesGlobal = value * (1 + margin / 100);
        const updatedSalesKRW = Math.round(
          updatedKRWPrice * (1 + margin / 100)
        );

        updatedItem = {
          ...updatedItem,
          purchasePriceKRW: updatedKRWPrice,
          salesPriceGlobal: roundToTwoDecimalPlaces(updatedSalesGlobal),
          salesPriceKRW: updatedSalesKRW,
        };
      }

      if (key === "purchasePriceKRW") {
        const updatedGlobalPrice = convertCurrency(value, currency, "USD");
        const updatedSalesKRW = Math.round(value * (1 + margin / 100));
        const updatedSalesGlobal = updatedGlobalPrice * (1 + margin / 100);

        updatedItem = {
          ...updatedItem,
          purchasePriceGlobal: updatedGlobalPrice,
          salesPriceKRW: updatedSalesKRW,
          salesPriceGlobal: roundToTwoDecimalPlaces(updatedSalesGlobal),
        };
      }

      // 판매가격 변경 시 로직
      if (key === "salesPriceGlobal") {
        const updatedKRWPrice = Math.round(
          convertCurrency(value, currency, "KRW")
        );
        const newMargin = parseFloat(
          (
            ((value - currentItem.purchasePriceGlobal) /
              currentItem.purchasePriceGlobal) *
            100
          ).toFixed(2)
        );

        updatedItem = {
          ...updatedItem,
          salesPriceKRW: updatedKRWPrice,
          margin: newMargin,
        };
      }

      if (key === "salesPriceKRW") {
        const updatedGlobalPrice = convertCurrency(value, currency, "USD");
        const newMargin = parseFloat(
          (
            ((value - currentItem.purchasePriceKRW) /
              currentItem.purchasePriceKRW) *
            100
          ).toFixed(2)
        );

        updatedItem = {
          ...updatedItem,
          salesPriceGlobal: updatedGlobalPrice,
          margin: newMargin,
        };
      }

      // 수량 기반 금액 계산
      const qty = updatedItem.qty || 0;
      const amounts = {
        salesAmountKRW: calculateTotalAmount(
          updatedItem.salesPriceKRW,
          qty,
          "KRW"
        ),
        salesAmountGlobal: calculateTotalAmount(
          updatedItem.salesPriceGlobal,
          qty,
          "USD"
        ),
        purchaseAmountKRW: calculateTotalAmount(
          updatedItem.purchasePriceKRW,
          qty,
          "KRW"
        ),
        purchaseAmountGlobal: calculateTotalAmount(
          updatedItem.purchasePriceGlobal,
          qty,
          "USD"
        ),
      };

      // 최종 업데이트된 아이템 반환
      const finalUpdatedItem = {
        ...updatedItem,
        ...amounts,
      };

      const updatedItems = [...prevItems];
      updatedItems[index] = finalUpdatedItem;
      return updatedItems;
    });
  };

  // 폼 변경 핸들러
  const handleFormChange = <K extends keyof typeof formValues>(
    key: K,
    value: (typeof formValues)[K]
  ) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setNewDocumentInfo((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  // 마진 변경 핸들러
  const handleMarginChange = (index: number, marginValue: number) => {
    const updatedItems = [...currentDetailItems];
    const currentItem = updatedItems[index];

    // 현재 아이템의 매입 가격과 수량을 가져옴
    const purchasePriceKRW = currentItem.purchasePriceKRW || 0;
    const qty = currentItem.qty || 0;

    // 마진 변경 시 판매가격 계산
    const salesPriceKRW = Math.round(
      purchasePriceKRW * (1 + marginValue / 100)
    );
    console.log(salesPriceKRW);

    const salesAmountKRW = calculateTotalAmount(salesPriceKRW, qty, "KRW");

    const exchangeRate = formValues.currency;
    const salesPriceGlobal = roundToTwoDecimalPlaces(
      salesPriceKRW / exchangeRate
    );
    const salesAmountGlobal = calculateTotalAmount(
      salesPriceGlobal,
      qty,
      "USD"
    );

    updatedItems[index] = {
      ...currentItem,
      salesPriceKRW,
      salesAmountKRW,
      salesPriceGlobal,
      salesAmountGlobal,
      margin: marginValue,
    };

    setCurrentDetailItems(updatedItems);
  };

  // 저장 핸들러
  const handleSave = async (tabChange: boolean, activeKeyParam: string) => {
    if (!currentDetailItems || currentDetailItems.length === 0) {
      message.error("Please add an item");
      return;
    }

    // 저장 전에 할인 및 수수료 적용
    applyDcAndCharge("single");

    // 현재 아이템 데이터를 포맷팅하여 저장
    const formattedData = currentDetailItems.map((item: ItemDetailType) => ({
      position: item.position,
      itemDetailId: item.itemDetailId,
      indexNo: item.indexNo || "",
      itemName: item.itemName,
      itemCode: item.itemCode,
      itemRemark: item.itemRemark || "",
      itemType: item.itemType,
      qty: item.qty,
      unit: item.unit || "",
      itemId: item.itemId,
      salesPriceKRW: item.salesPriceKRW || 0,
      salesPriceGlobal: item.salesPriceGlobal || 0,
      salesAmountKRW: item.salesAmountKRW || 0,
      salesAmountGlobal: item.salesAmountGlobal || 0,
      margin: item.margin || 0,
      purchasePriceKRW: item.purchasePriceKRW || 0,
      purchasePriceGlobal: item.purchasePriceGlobal || 0,
      purchaseAmountKRW: item.purchaseAmountKRW || 0,
      purchaseAmountGlobal: item.purchaseAmountGlobal || 0,
      deliveryDate: item.deliveryDate || 0,
    }));

    try {
      await saveData(formattedData);
      await loadOfferDetail();

      if (tabChange) {
        // 탭 변경 시에만 새로운 탭으로 이동
        handleTabChangeWithoutSave(activeKeyParam);
      } else {
        // 일반 저장 시에는 현재 탭 유지
        setActiveKey(activeKeyParam);
      }
    } catch (error) {
      message.error("An error occurred while saving data.");
    }
  };

  // 저장 로직을 함수로 분리
  const saveData = async (formattedData: any) => {
    if (
      cusVesIdList.customerId &&
      cusVesIdList.vesselId &&
      currentSupplierInfo &&
      currentInquiryId
    ) {
      try {
        const formData = {
          registerDate: formValues.registerDate.format("YYYY-MM-DD"),
          shippingDate: formValues.shippingDate.format("YYYY-MM-DD"),
          currencyType: formValues.currencyType,
          refNumber: formValues.refNumber,
          currency: formValues.currency,
          vesselId: cusVesIdList.vesselId,
          veeselHullNo: formValues.vesselHullNo,
          docRemark: formValues.docRemark,
          customerId: cusVesIdList.customerId,
          color: formValues.color || "#fff",
        };

        await editOffer(
          currentInquiryId,
          currentSupplierInfo.supplierId,
          formData,
          formattedData,
          dcInfo.dcPercent,
          invChargeList
        );

        message.success("Saved successfully!");

        // 저장 후 최신 데이터로 업데이트
        const response = await fetchOfferDetail(loadDocumentId.documentId);

        // 현재 선택 공급업체 찾기
        const currentSupplier = response.response.find(
          (supplier: { inquiryId: number }) =>
            supplier.inquiryId === currentInquiryId
        );

        if (currentSupplier) {
          setDataSource({
            documentInfo: response.documentInfo,
            response: response.response,
          });
          setNewDocumentInfo({
            ...response.documentInfo,
            documentNumber:
              response.response[0].supplierInquiryName ||
              response.documentInfo.documentNumber,
          });
          // 현재 선택된 공급업체의 데이터로 설정
          setCurrentDetailItems(currentSupplier.itemDetail);
          setCurrentSupplierInfo(currentSupplier.supplierInfo);
          setCurrentInquiryId(currentSupplier.inquiryId);
          setPdfCustomerTag({
            id: response.documentInfo.customerId,
            name: response.documentInfo.companyName,
          });
          setCurrentSupplierInquiryName(currentSupplier.supplierInquiryName);
        }
      } catch (error) {
        console.error("Error saving data:", error);
        message.error("An error occurred while saving data.");
      }
    } else {
      message.error("Please check customer and vessel");
    }
  };

  // PDF 미리보기 핸들러
  const handlePDFPreview = () => {
    applyDcAndCharge("multiple");
    setShowPDFPreview((prevState) => !prevState);
  };

  // 언어 변경 핸들러
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  // 헤더 모달 열기 핸들러
  const handleOpenHeaderModal = () => {
    setHeaderEditModalVisible(true);
  };

  // 헤더 모달 닫기 핸들러
  const handleCloseHeaderModal = () => {
    setHeaderEditModalVisible(false);
  };

  // 헤더 저장 핸들러
  const handleHeaderSave = async (
    header: HeaderFormData,
    footer: { quotationRemarkId: number | null; quotationRemark: string }[]
  ) => {
    const selectedSupplier = dataSource?.response.find(
      (supplier) => supplier.inquiryId.toString() === activeKey
    );

    if (dataSource && selectedSupplier) {
      //해당 공급업체의 데이터를 수정
      const updatedResponse = dataSource.response.map((supplier) =>
        supplier.inquiryId === selectedSupplier.inquiryId
          ? {
              ...supplier,
              quotationHeader: header,
              quotationRemark: footer,
            }
          : supplier
      );
      setDataSource({ ...dataSource, response: updatedResponse });
    }

    setPdfHeader(header);
    setPdfFooter(footer);

    try {
      const request = {
        quotationHeader: header,
        quotationRemark: footer,
      };
      const response = await saveOfferHeader(Number(activeKey), request);
      setPdfHeader(response.quotationHeader);
      setPdfFooter(response.quotationRemark);
    } catch (error) {
      message.error("An error occurred while saving header.");
      console.log(error);
    }
  };

  // 메일 발송 모달 열기 핸들러
  const showMailSenderModal = () => {
    setIsMailSenderVisible(true);
  };

  // 메일 발송 모달 확인 핸들러
  const handleMailSenderOk = () => {
    setIsMailSenderVisible(false);
  };

  // 메일 발송 모달 취소 핸들러
  const handleMailSenderCancel = () => {
    setIsMailSenderVisible(false);
  };
  /*******************************최종가격 적용*******************************/
  // 공통 함수: reduce를 사용한 합계 계산
  const calculateTotal = (
    data: Array<any>,
    key: string,
    qtyKey: string = "qty"
  ) => {
    return data.reduce((acc: number, record: any) => {
      const type = key === "chargePriceKRW" ? "KRW" : "USD";
      const price = record[key] || 0; // chargePriceKRW
      // data가 invChargeList인 경우에만 qty를 1로 정
      const qty =
        data === invChargeList ? record[qtyKey] || 1 : record[qtyKey] || 0;
      return acc + calculateTotalAmount(price, qty, type);
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

  // 공통 함수: 할인 및 수수료 적용
  const applyDcAndCharge = (mode: string) => {
    if (mode === "single" && !currentDetailItems) return;
    if (mode === "multiple" && combinedItemDetails.length === 0) {
      return;
    }

    const updatedItems =
      mode === "single"
        ? currentDetailItems
        : combinedItemDetails.map((currentItem) => {
            const { purchasePriceKRW = 0, qty = 0, margin = 0 } = currentItem;

            const salesPriceKRW = Math.round(
              purchasePriceKRW * (1 + margin / 100)
            );
            const salesAmountKRW = calculateTotalAmount(
              salesPriceKRW,
              qty,
              "KRW"
            );

            const exchangeRate = formValues.currency;
            const salesPriceGlobal = convertToGlobal(
              salesPriceKRW,
              exchangeRate
            );
            const salesAmountGlobal = calculateTotalAmount(
              salesPriceGlobal,
              qty,
              "USD"
            );

            return {
              ...currentItem,
              salesPriceKRW,
              salesAmountKRW,
              salesPriceGlobal,
              salesAmountGlobal,
            };
          });

    mode === "single"
      ? setCurrentDetailItems(updatedItems)
      : setCombinedItemDetails(updatedItems);

    // 공통 계산
    const totalSalesAmountKRW = updatedItems.reduce(
      (sum, item) =>
        sum + (Math.round(item.salesPriceKRW) || 0) * (item.qty || 0),
      0
    );
    const totalSalesAmountGlobal = updatedItems.reduce(
      (sum, item) =>
        sum +
        (roundToTwoDecimalPlaces(item.salesPriceGlobal) || 0) * (item.qty || 0),
      0
    );
    const totalPurchaseAmountKRW = updatedItems.reduce(
      (sum, item) =>
        sum + (Math.round(item.purchasePriceKRW) || 0) * (item.qty || 0),
      0
    );
    const totalPurchaseAmountGlobal = updatedItems.reduce(
      (sum, item) =>
        sum +
        (roundToTwoDecimalPlaces(item.purchasePriceGlobal) || 0) *
          (item.qty || 0),
      0
    );

    // 할인 적용된 총액 계산
    const newTotalSalesAmountKRW = Math.round(
      applyDiscount(totalSalesAmountKRW, dcInfo.dcPercent)
    );
    const newTotalSalesAmountGlobal = applyDiscount(
      totalSalesAmountGlobal,
      dcInfo.dcPercent
    );

    // charge 계산
    const chargePriceKRWTotal = Math.round(
      calculateTotal(invChargeList || [], "chargePriceKRW")
    );
    const chargePriceGlobalTotal = calculateTotal(
      invChargeList || [],
      "chargePriceGlobal"
    );

    // 할인 및 수수료 적용된 총액 계산
    const updatedTotalSalesAmountKRW =
      newTotalSalesAmountKRW + chargePriceKRWTotal;
    const updatedTotalSalesAmountGlobal =
      newTotalSalesAmountGlobal + chargePriceGlobalTotal;

    const chargeCurrency = () => {
      switch (formValues.currencyType) {
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

    mode === "multiple"
      ? setFinalTotals({
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
        })
      : setTableTotals({
          totalSalesAmountKRW: totalSalesAmountKRW,
          totalSalesAmountGlobal: totalSalesAmountGlobal,
          totalPurchaseAmountKRW,
          totalPurchaseAmountGlobal,
          totalSalesAmountUnDcKRW: totalSalesAmountKRW,
          totalSalesAmountUnDcGlobal: totalSalesAmountGlobal,
          totalPurchaseAmountUnDcKRW: totalPurchaseAmountKRW,
          totalPurchaseAmountUnDcGlobal: totalPurchaseAmountGlobal,
          totalProfit: totalProfit,
          totalProfitPercent: totalProfitPercent,
        });
  };

  // combinedItemDetails 변경 시 실행되는 useEffect 수정
  useEffect(() => {
    if (combinedItemDetails.length > 0) {
      const hasChanged =
        JSON.stringify(combinedItemDetails) !==
        JSON.stringify(prevCombinedItemDetails.current);

      if (hasChanged && !isUpdatingGlobalPrices) {
        // 글로벌 가격 업데이트 중이 아닐 때만 실행
        prevCombinedItemDetails.current = combinedItemDetails;
        applyDcAndCharge("multiple");
      }
    }
  }, [combinedItemDetails, activeKey]);

  // 환율 변경 시 실행되는 useEffect
  useEffect(() => {
    if (combinedItemDetails.length > 0) {
      const timer = setTimeout(() => {
        applyDcAndCharge("multiple");
      }, 300); // 300ms 후에 실행
      return () => clearTimeout(timer); // cleanup 함수
    }
  }, [formValues.currency]);

  /**********************************************************************/

  // 아이템 데이터 비교 함수
  const compareItemDetails = (
    currentItems: ItemDetailType[],
    savedItems: ItemDetailType[]
  ): boolean => {
    if (currentItems.length !== savedItems.length) return false;

    // 모든 아이템을 순회하며 비교
    return currentItems.every((currentItem, index) => {
      const savedItem = savedItems[index];
      return (
        currentItem.itemCode === savedItem.itemCode &&
        currentItem.itemName === savedItem.itemName &&
        currentItem.itemType === savedItem.itemType &&
        currentItem.qty === savedItem.qty &&
        currentItem.unit === savedItem.unit &&
        currentItem.salesPriceKRW === savedItem.salesPriceKRW &&
        currentItem.purchasePriceKRW === savedItem.purchasePriceKRW &&
        currentItem.margin === savedItem.margin &&
        currentItem.deliveryDate === savedItem.deliveryDate
      );
    });
  };

  // 저장 확인 모달을 보여주는 함수
  const showSaveConfirmModal = async (newActiveKey: string): Promise<void> => {
    Modal.confirm({
      title: "Unsaved Changes",
      content: "Do you want to save the current changes?",
      okText: "Save",
      cancelText: "Cancel",
      onOk: async () => {
        await handleSave(true, newActiveKey);
      },
      onCancel: () => {
        // 저장하지 않고 탭 변경
        handleTabChangeWithoutSave(newActiveKey);
      },
    });
  };

  // 저장하지 않고 탭 변경하는 함수
  const handleTabChangeWithoutSave = (newActiveKey: string) => {
    const selectedSupplier = dataSource?.response.find(
      (supplier) => supplier.inquiryId.toString() === newActiveKey
    );

    if (selectedSupplier) {
      setActiveKey(newActiveKey);
      setCurrentDetailItems(selectedSupplier.itemDetail);
      setCurrentSupplierInfo(selectedSupplier.supplierInfo);
      setCurrentInquiryId(selectedSupplier.inquiryId);
      setCurrentSupplierInquiryName(selectedSupplier.supplierInquiryName);
      setTableTotals({
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

      setPdfHeader(selectedSupplier.quotationHeader || INITIAL_HEADER_VALUES);
      setPdfFooter(
        Array.isArray(selectedSupplier.quotationRemark) &&
          selectedSupplier.quotationRemark.length === 1 &&
          selectedSupplier.quotationRemark[0] === null
          ? []
          : selectedSupplier.quotationRemark || []
      );
      handleSupplierSelect([
        {
          supplierId: selectedSupplier.supplierInfo.supplierId,
          inquiryId: selectedSupplier.inquiryId,
        },
      ]);
      setShowPDFPreview(false);
    }
  };

  // 탭 변경 핸들러 수정
  const handleTabChange = async (newActiveKey: string) => {
    if (!dataSource?.response) return;

    // 현재 탭과 새로운 탭이 같으면 아무 작업도 하지 않음
    if (activeKey === newActiveKey) return;

    const currentSupplierData = dataSource.response.find(
      (supplier) => supplier.inquiryId.toString() === activeKey
    );

    if (currentSupplierData && currentDetailItems) {
      const isDataEqual = compareItemDetails(
        currentDetailItems,
        currentSupplierData.itemDetail
      );

      if (!isDataEqual) {
        await showSaveConfirmModal(newActiveKey);
      } else {
        // 변경사항이 없으면 바로 탭 변경
        handleTabChangeWithoutSave(newActiveKey);
      }
    } else {
      handleTabChangeWithoutSave(newActiveKey);
    }
  };

  // Select 컴포넌트의 onChange 핸들러 수정
  const handleSupplierSelect = async (
    values: Array<{ supplierId: number; inquiryId: number }>
  ) => {
    const selectedSupplierInquiryName = dataSource?.response.find(
      (supplier) => supplier.inquiryId === values[0].inquiryId
    )?.supplierInquiryName;

    setNewDocumentInfo((prev) =>
      prev
        ? {
            ...prev,
            documentNumber: selectedSupplierInquiryName || prev.documentNumber,
          }
        : null
    );

    setSelectedSupplierIds(values);

    // 모든 아이템을 순회하며 비교
    if (dataSource?.response) {
      const selectedItems = dataSource.response
        .filter((resp) =>
          values.some(
            (v) =>
              v.supplierId === resp.supplierInfo.supplierId &&
              v.inquiryId === resp.inquiryId
          )
        )
        .reduce<any[]>((acc, curr) => [...acc, ...curr.itemDetail], []);

      const seenMakerTypes = new Set<string>();
      const filteredItems = selectedItems.filter((item) => {
        if (item.itemType === "MAKER" || item.itemType === "TYPE") {
          const normalizedItemName = item.itemName.replace(/\s+/g, "");
          const key = `${item.itemType}-${normalizedItemName}`;
          if (seenMakerTypes.has(key)) {
            return false;
          }
          seenMakerTypes.add(key);
        }
        return true;
      });

      setCombinedItemDetails(filteredItems);
    }
  };

  // useMemo를 컴포넌트 레벨로 이동
  const memoizedItems = useMemo(() => {
    if (!dataSource?.response || selectedSupplierIds.length === 0) return [];

    return dataSource.response
      .filter((resp) =>
        selectedSupplierIds.some(
          (v) =>
            v.supplierId === resp.supplierInfo.supplierId &&
            v.inquiryId === resp.inquiryId
        )
      )
      .reduce<any[]>((acc, curr) => {
        // 현재 선택된 탭의 공급업체인 경우 currentDetailItems 사용
        if (curr.inquiryId === currentInquiryId) {
          return [...acc, ...currentDetailItems];
        }
        // 다른 공급업체의 경우 원래 itemDetail 사용
        return [...acc, ...curr.itemDetail];
      }, []);
  }, [
    dataSource?.response,
    selectedSupplierIds,
    currentInquiryId,
    currentDetailItems,
  ]);

  // useEffect에서는 memoizedItems를 사용
  useEffect(() => {
    if (!dataSource?.response || selectedSupplierIds.length === 0) return;
    setCombinedItemDetails(memoizedItems);
  }, [memoizedItems, dataSource?.response, selectedSupplierIds]);

  // 매입처 탭 렌더링 함수
  const renderSupplierTabs = () => {
    if (!dataSource?.response || !currentDetailItems || !currentSupplierInfo)
      return null;

    // 매입처 탭 추가 핸들러
    const handleAddSupplierTab = (mode: string) => {
      if (!dataSource?.documentInfo?.documentNumber) {
        message.error("Document number is missing.");
        return;
      }

      navigate(
        `/addsupplierininquiry/${dataSource.documentInfo.documentNumber}`,
        {
          state: {
            mode: mode,
            currentSupplierId: currentSupplierInfo.supplierId,
            inquiryId: currentInquiryId,
            documentInfo: dataSource.documentInfo,
            itemDetails:
              currentDetailItems || dataSource.response[0].itemDetail, // 현재 선택된 공급업체의 아이템 데이터
            sendSupplier: dataSource.response.map(
              (item) => item.supplierInfo.supplierId
            ),
          },
        }
      );
    };

    // 매입처 탭 삭제 핸들러
    const handleDeleteSupplier = async (
      inquiryId: number,
      supplierName: string
    ) => {
      Modal.confirm({
        title: "Delete Supplier on Offer",
        content: `Are you sure you want to delete ${supplierName} on this offer?`,
        okText: "Delete",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await deleteSupplierInquiry(inquiryId);
            message.success("Supplier deleted successfully.");
            // 목록 갱신
            loadOfferDetail();
          } catch (error) {
            console.error("Error deleting supplier inquiry:", error);
            message.error("Failed to delete supplier. Please try again.");
          }
        },
      });
    };

    // N/A 처리 함수
    const handleNAClick = (supplierInquiryId: number) => {
      Modal.confirm({
        title: "Handle N/A",
        content: "Are you sure you want to handle N/A?",
        okText: "Ok",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await changeOfferStatus(supplierInquiryId, "NA");
            message.success("N/A handled successfully.");
            loadOfferDetail();
          } catch (error) {
            console.error("Error handling N/A:", error);
            message.error("Failed to handle N/A. Please try again.");
          }
        },
      });
    };

    // 매입처 탭 렌더링
    const items = dataSource.response.map((supplier) => {
      return {
        key: supplier.inquiryId.toString(),
        label: (
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {supplier.supplierInfo.supplierName}
            {supplier.inquiryStatus === "NA" ? (
              <span
                style={{
                  color: "red",
                  fontSize: 10,
                }}
              >
                {" "}
                (N/A)
              </span>
            ) : (
              <span style={{ color: "#525252", fontSize: 10 }}>
                {" "}
                ({supplier.inquiryStatus})
              </span>
            )}

            <DeleteOutlined
              style={{ color: "#ff4d4f" }}
              onClick={(e) => {
                e.stopPropagation(); // 탭 클릭 이벤트 전파 방지
                handleDeleteSupplier(
                  supplier.inquiryId,
                  supplier.supplierInfo.supplierName
                );
              }}
            />
          </span>
        ),
        children: (
          <>
            <TableComponent
              itemDetails={currentDetailItems}
              setItemDetails={setCurrentDetailItems}
              handleInputChange={handleInputChange}
              currency={formValues.currency}
              roundToTwoDecimalPlaces={roundToTwoDecimalPlaces}
              calculateTotalAmount={calculateTotalAmount}
              handleMarginChange={handleMarginChange}
              handlePriceInputChange={handlePriceInputChange}
              offerId={supplier.inquiryId}
              documentNumber={dataSource.documentInfo.documentNumber}
              supplierName={supplier.supplierInfo.supplierName}
              pdfUrl={supplier.pdfUrl}
              tableTotals={tableTotals}
              applyDcAndCharge={applyDcAndCharge}
              dcInfo={dcInfo}
              setDcInfo={setDcInfo}
              invChargeList={invChargeList}
              setInvChargeList={setInvChargeList}
              supplierInquiryName={currentSupplierInquiryName}
              setSupplierInquiryName={setCurrentSupplierInquiryName}
              setNewDocumentInfo={setNewDocumentInfo}
              setDataSource={setDataSource}
              handleNAClick={handleNAClick}
            />
            <Button
              type="primary"
              htmlType="submit"
              style={{ float: "right", width: 100, marginBottom: 20 }}
              onClick={() => handleSave(false, activeKey)}
              disabled={
                !formValues.refNumber || formValues.refNumber.trim() === ""
              }
            >
              Save
            </Button>
            <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
              Integrated data
            </Divider>
          </>
        ),
      };
    });

    return (
      <Tabs
        items={items}
        type="card"
        activeKey={activeKey}
        onChange={handleTabChange}
        tabBarExtraContent={{
          right: (
            <>
              <Tooltip
                title={
                  "Modify and resend items to the already sent supplier (where of the selected tab)"
                }
              >
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddSupplierTab("resend")}
                  style={{ marginLeft: 8 }}
                >
                  Resend Email
                </Button>
              </Tooltip>{" "}
              <Tooltip title={"Send additional mail to new supplier"}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddSupplierTab("add")}
                  style={{ marginLeft: 8 }}
                >
                  Add Supplier on Inquiry
                </Button>
              </Tooltip>
            </>
          ),
        }}
      />
    );
  };

  // PDF 다운로드 핸들러
  const clickPdfDownload = async () => {
    applyDcAndCharge("multiple");

    try {
      const checkDuplicate = await checkOfferPdfDocNumber(
        currentInquiryId!,
        currentSupplierInquiryName,
        loadDocumentId.documentId
      );
      if (checkDuplicate) {
        Modal.error({
          title: "This document number is already used.",
          content: "Please change document number.",
        });
        return;
      } else {
        await handlePDFDownload();
        await handleSave(false, activeKey);
      }
    } catch (error) {
      console.error("Update PDF Document Number Error:", error);
      message.error("Update PDF Document Number Error");
    }
  };

  // PDF 다운로드 핸들러
  const handlePDFDownload = async () => {
    try {
      const doc = (
        <OfferPDFDocument
          info={newDocumentInfo!}
          items={combinedItemDetails}
          pdfHeader={pdfHeader}
          pdfFooter={pdfFooter}
          viewMode={false}
          language={language}
          finalTotals={finalTotals}
          dcInfo={dcInfo}
          invChargeList={invChargeList}
        />
      );

      const pdfBlob = await pdf(doc).toBlob();
      const defaultFileName = `${formValues.refNumber}(QTN).pdf`;

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
          if (localSendMailState && currentInquiryId) {
            try {
              await changeOfferStatus(currentInquiryId, "QUOTATION_SENT");
            } catch (error) {
              message.error(
                "Failed to update offer status. Please try again later."
              );
              return;
            }
          } else if (localSendMailState && !currentInquiryId) {
            message.error("Please select supplier.");
            return;
          }

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

          loadOfferDetail();
        },
        okText: "Download",
        cancelText: "Cancel",
      });
    } catch (error) {
      console.error("PDF Download Error:", error);
      message.error("PDF Download Error");
    }
  };

  if (isLoading) {
    return <LoadingSpinner />; // 로딩 중 화면
  }

  return (
    <FormContainer>
      <Title>견적서 작성(MAKE OFFER)</Title>
      {formValues && (
        <FormComponent
          formValues={formValues}
          handleFormChange={handleFormChange}
          setCusVesIdList={setCusVesIdList}
          cusVesIdList={cusVesIdList}
          offerId={loadDocumentId.documentId}
        />
      )}
      <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
        Supplier's item data
      </Divider>
      {dataSource?.response && renderSupplierTabs()}
      <Tooltip
        title={
          selectedSupplierIds.length === 0
            ? "Please select supplier to send email"
            : "Please Save before sending email"
        }
        placement="topLeft"
      >
        <Button
          type="primary"
          onClick={showMailSenderModal}
          style={{ float: "right", marginTop: 20 }}
          disabled={
            !formValues.refNumber ||
            formValues.refNumber.trim() === "" ||
            selectedSupplierIds.length === 0
          }
        >
          Send Email
        </Button>
      </Tooltip>
      <Button
        type="default"
        onClick={() =>
          navigate({
            pathname: "/supplierInquirylist",
            search: searchParamsString,
          })
        }
        style={{ margin: "20px 15px 0 0 ", float: "right" }}
      >
        Back
      </Button>
      <div style={{ marginTop: 20 }}>
        <Button style={{ marginLeft: 10 }} onClick={handleOpenHeaderModal}>
          Edit Header / Remark
        </Button>
        <span style={{ marginLeft: 20 }}>LANGUAGE: </span>
        <Select
          style={{ width: 100, marginLeft: 10 }}
          value={language}
          onChange={handleLanguageChange}
        >
          <Select.Option value="KOR">KOR</Select.Option>
          <Select.Option value="ENG">ENG</Select.Option>
        </Select>
        <OfferHeaderEditModal
          pdfHeader={pdfHeader}
          pdfFooter={pdfFooter}
          open={headerEditModalVisible}
          onClose={handleCloseHeaderModal}
          onSave={handleHeaderSave}
        />
        <Button
          style={{ marginLeft: 10 }}
          onClick={handlePDFPreview}
          type="default"
        >
          {showPDFPreview ? "Close Preview" : "PDF Preview"}
        </Button>
        <Button
          style={{ marginLeft: 10 }}
          onClick={clickPdfDownload}
          type="default"
          disabled={selectedSupplierIds.length === 0}
        >
          PDF Download
        </Button>
      </div>
      <Modal
        title="Send Mail"
        open={isMailSenderVisible}
        onOk={handleMailSenderOk}
        onCancel={handleMailSenderCancel}
        footer={null}
        width={1200}
      >
        {newDocumentInfo ? (
          <OfferMailSender
            inquiryFormValues={newDocumentInfo}
            handleSubmit={() => handleSave(false, activeKey)}
            pdfFileData={pdfFileData}
            mailData={mailData}
            pdfHeader={pdfHeader}
            selectedSupplierIds={selectedSupplierIds.map(
              (item) => item.inquiryId
            )}
          />
        ) : (
          <span>Something went wrong.</span>
        )}
      </Modal>
      <div style={{ marginTop: 50 }}>
        <TotalCardsComponent
          finalTotals={finalTotals}
          applyDcAndCharge={applyDcAndCharge}
          mode={"multiple"}
          currency={formValues.currency}
          dcInfo={dcInfo}
          setDcInfo={setDcInfo}
          invChargeList={invChargeList}
          setInvChargeList={setInvChargeList}
        />
      </div>
      {pdfCustomerTag && isMailSenderVisible && newDocumentInfo && (
        <OfferPDFGenerator
          info={newDocumentInfo}
          items={combinedItemDetails}
          pdfHeader={pdfHeader}
          pdfFooter={pdfFooter}
          language={language}
          setMailData={setMailData}
          setPdfFileData={setPdfFileData}
          customerTag={pdfCustomerTag}
          finalTotals={finalTotals}
          dcInfo={dcInfo}
          invChargeList={invChargeList}
        />
      )}
      {showPDFPreview && newDocumentInfo && (
        <OfferPDFDocument
          info={newDocumentInfo}
          items={combinedItemDetails}
          pdfHeader={pdfHeader}
          pdfFooter={pdfFooter}
          viewMode={true}
          language={language}
          finalTotals={finalTotals}
          dcInfo={dcInfo}
          invChargeList={invChargeList}
        />
      )}
      <FloatButton.Group
        shape="square"
        placement="bottom"
        trigger="hover"
        style={{ insetInlineEnd: 0, bottom: "50%" }}
      >
        <FloatButton
          type="primary"
          tooltip="Save"
          icon={<SaveOutlined />}
          onClick={() => handleSave(false, activeKey)}
          style={{
            opacity:
              !formValues.refNumber || formValues.refNumber.trim() === ""
                ? 0.5
                : 1,
            pointerEvents:
              !formValues.refNumber || formValues.refNumber.trim() === ""
                ? "none"
                : "auto",
          }}
        />
        <FloatButton
          tooltip="PDF Preview"
          icon={<FilePdfOutlined />}
          onClick={() => {
            window.scrollTo(0, document.body.scrollHeight);
            setShowPDFPreview(true);
          }}
        />
        <FloatButton
          tooltip="PDF Download"
          icon={<DownloadOutlined />}
          onClick={clickPdfDownload}
          style={{
            opacity: selectedSupplierIds.length === 0 ? 0.5 : 1,
            pointerEvents: selectedSupplierIds.length === 0 ? "none" : "auto",
          }}
        />
        <FloatButton.BackTop visibilityHeight={0} />
        <FloatButton
          tooltip="Back"
          icon={<RollbackOutlined />}
          onClick={() =>
            navigate({
              pathname: "/supplierInquirylist",
              search: searchParamsString,
            })
          }
        />
      </FloatButton.Group>
    </FormContainer>
  );
};

export default MakeOffer;
