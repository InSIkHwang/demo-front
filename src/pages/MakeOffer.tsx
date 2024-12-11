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
  Input,
  message,
  Modal,
  Select,
  Tabs,
  Tooltip,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styled from "styled-components";
import dayjs from "dayjs";
import FormComponent from "../components/makeOffer/FormComponent";
import TableComponent from "../components/makeOffer/TableComponent";
import {
  changeOfferStatus,
  checkOfferPdfDocNumber,
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
  deliveryTime: "DAYS AFTER ORDER",
  termsOfPayment: "",
  incoterms: "EX WORKS",
  offerValidity: "30 DAYS",
  partCondition: "",
};

const MakeOffer = () => {
  const { state } = useLocation();
  const { documentId: urlDocumentId } = useParams();
  const [searchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  console.log(searchParamsString);

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

  useEffect(() => {
    loadOfferDetail();
  }, []);

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

  const handleInputChange = useCallback(
    (index: number, key: keyof ItemDetailType, value: any) => {
      setCurrentDetailItems((prevItems: ItemDetailType[]) => {
        if (!prevItems?.[index]) return prevItems;
        if (prevItems[index][key] === value) return prevItems;

        const newItems = [...prevItems];
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

  const updateGlobalPrices = useCallback(() => {
    setCurrentDetailItems((prevItems) => {
      if (!prevItems || !currentSupplierInfo) return prevItems; // null/undefined 체크

      return prevItems.map((record) => {
        if (!record || record.itemType !== "ITEM") return record; // record가 없거나 ITEM이 아닌 경우 처

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

        return {
          ...record,
          salesPriceGlobal: updatedSalesPriceGlobal,
          purchasePriceGlobal: updatedPurchasePriceGlobal,
        };
      });
    });
  }, [currentSupplierInfo, formValues.currency, convertCurrency]);

  // formValues의 currency가 변경될 때 updateGlobalPrices 호출
  useEffect(() => {
    if (formValues?.currency) {
      updateGlobalPrices();
    }
  }, [formValues?.currency, updateGlobalPrices]);

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

  const calculateTotalAmount = useCallback(
    (price: number, qty: number) => roundToTwoDecimalPlaces(price * qty),
    []
  );

  const handlePriceInputChange = (
    index: number,
    key: keyof ItemDetailType,
    value: any,
    currency: number
  ) => {
    const updatedItems = [...currentDetailItems];
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
    setCurrentDetailItems(updatedItems);
  };

  const handleFormChange = <K extends keyof typeof formValues>(
    key: K,
    value: (typeof formValues)[K]
  ) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setNewDocumentInfo((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleMarginChange = (index: number, marginValue: number) => {
    const updatedItems = [...currentDetailItems];
    const currentItem = updatedItems[index];

    const purchasePriceKRW = currentItem.purchasePriceKRW || 0;
    const qty = currentItem.qty || 0;

    const salesPriceKRW = Math.round(
      purchasePriceKRW * (1 + marginValue / 100)
    );
    const salesAmountKRW = calculateTotalAmount(salesPriceKRW, qty);

    const exchangeRate = formValues.currency;
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

    setCurrentDetailItems(updatedItems);
  };

  const handleSave = async (tabChange: boolean, activeKeyParam: string) => {
    if (!currentDetailItems || currentDetailItems.length === 0) {
      message.error("Please add an item");
      return;
    }

    applyDcAndCharge("single");

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
      salesPriceKRW: item.salesPriceKRW,
      salesPriceGlobal: item.salesPriceGlobal,
      salesAmountKRW: item.salesAmountKRW,
      salesAmountGlobal: item.salesAmountGlobal,
      margin: item.margin,
      purchasePriceKRW: item.purchasePriceKRW,
      purchasePriceGlobal: item.purchasePriceGlobal,
      purchaseAmountKRW: item.purchaseAmountKRW,
      purchaseAmountGlobal: item.purchaseAmountGlobal,
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

  const handlePDFPreview = () => {
    applyDcAndCharge("multiple");
    setShowPDFPreview((prevState) => !prevState);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const handleOpenHeaderModal = () => {
    setHeaderEditModalVisible(true);
  };

  const handleCloseHeaderModal = () => {
    setHeaderEditModalVisible(false);
  };

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
      await saveOfferHeader(Number(activeKey), request);
    } catch (error) {
      message.error("An error occurred while saving header.");
      console.log(error);
    }
  };

  const showMailSenderModal = () => {
    setIsMailSenderVisible(true);
  };

  const handleMailSenderOk = () => {
    setIsMailSenderVisible(false);
  };

  const handleMailSenderCancel = () => {
    setIsMailSenderVisible(false);
  };
  /*******************************최종가격 적용*******************************/
  // 공 함수: reduce를 사용한 합계 계산
  const calculateTotal = (
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
    if (mode === "single" && !currentDetailItems) return;
    if (mode === "multiple" && combinedItemDetails.length === 0) {
      message.warning("Please select a supplier first");
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
            const salesAmountKRW = calculateTotalAmount(salesPriceKRW, qty);

            const exchangeRate = formValues.currency;
            const salesPriceGlobal = convertToGlobal(
              salesPriceKRW,
              exchangeRate
            );
            const salesAmountGlobal = calculateTotalAmount(
              salesPriceGlobal,
              qty
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
    const chargePriceKRWTotal = calculateTotal(
      invChargeList || [],
      "chargePriceKRW"
    );
    const chargePriceGlobalTotal = calculateTotal(
      invChargeList || [],
      "chargePriceGlobal"
    );

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
          totalPurchaseAmountKRW,
          totalPurchaseAmountGlobal,
          totalSalesAmountUnDcKRW: Math.round(totalSalesAmountKRW),
          totalSalesAmountUnDcGlobal: totalSalesAmountGlobal,
          totalPurchaseAmountUnDcKRW: Math.round(totalPurchaseAmountKRW),
          totalPurchaseAmountUnDcGlobal: totalPurchaseAmountGlobal,
          totalProfit: Math.round(updatedTotalProfit),
          totalProfitPercent: updatedTotalProfitPercent,
        })
      : setTableTotals({
          totalSalesAmountKRW: Math.round(totalSalesAmountKRW),
          totalSalesAmountGlobal: totalSalesAmountGlobal,
          totalPurchaseAmountKRW,
          totalPurchaseAmountGlobal,
          totalSalesAmountUnDcKRW: Math.round(totalSalesAmountKRW),
          totalSalesAmountUnDcGlobal: totalSalesAmountGlobal,
          totalPurchaseAmountUnDcKRW: Math.round(totalPurchaseAmountKRW),
          totalPurchaseAmountUnDcGlobal: totalPurchaseAmountGlobal,
          totalProfit: Math.round(totalProfit),
          totalProfitPercent: totalProfitPercent,
        });
  };

  useEffect(() => {
    if (combinedItemDetails.length > 0 && !showPDFPreview) {
      // 이전 상태와 현재 상태를 비교하여 실제 변경이 있을 때만 실행
      const hasChanged =
        JSON.stringify(combinedItemDetails) !==
        JSON.stringify(prevCombinedItemDetails.current);

      if (hasChanged) {
        prevCombinedItemDetails.current = combinedItemDetails;
        applyDcAndCharge("multiple");
      }
    }
  }, [combinedItemDetails, activeKey, showPDFPreview]);

  /**********************************************************************/

  // 아이템 데이터 비교 함수
  const compareItemDetails = (
    currentItems: ItemDetailType[],
    savedItems: ItemDetailType[]
  ): boolean => {
    if (currentItems.length !== savedItems.length) return false;

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
        currentItem.margin === savedItem.margin
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

  const renderSupplierTabs = () => {
    if (!dataSource?.response || !currentDetailItems || !currentSupplierInfo)
      return null;

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

    const items = dataSource.response.map((supplier) => ({
      key: supplier.inquiryId.toString(),
      label: supplier.supplierInfo.supplierName,
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
    }));

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
    </FormContainer>
  );
};

export default MakeOffer;
