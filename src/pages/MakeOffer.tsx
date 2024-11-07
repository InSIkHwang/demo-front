import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Divider, message, Modal, Select, Tabs, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styled from "styled-components";
import dayjs from "dayjs";
import FormComponent from "../components/makeOffer/FormComponent";
import TableComponent from "../components/makeOffer/TableComponent";
import { editOffer, fetchOfferDetail } from "../api/api";
import {
  FormValuesType,
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

const MakeOffer = () => {
  const { state } = useLocation();
  const loadDocumentId = {
    documentId: state?.info.documentId || [],
  };
  const [info, setInfo] = useState<any>(null);
  const [dataSource, setDataSource] = useState<OfferResponse | null>(null);
  const [currentInquiryId, setCurrentInquiryId] = useState<number | null>(null);
  const [currentSupplierInfo, setCurrentSupplierInfo] =
    useState<SupplierInfo | null>(null);
  const [currentDetailItems, setCurrentDetailItems] = useState<
    ItemDetailType[]
  >([]);
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
  });
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [language, setLanguage] = useState<string>("KOR");
  const [headerEditModalVisible, setHeaderEditModalVisible] =
    useState<boolean>(false);
  const [pdfHeader, setPdfHeader] = useState<string>("");
  const [pdfFooter, setPdfFooter] = useState<string>("");
  const [pdfCustomerTag, setPdfCustomerTag] = useState<{
    id: number;
    name: string;
  }>({ id: 0, name: "" });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMailSenderVisible, setIsMailSenderVisible] = useState(false);
  const [mailData, setMailData] = useState<offerEmailSendData | null>(null);
  const [pdfFileData, setPdfFileData] = useState<File | null>(null);
  const [fileData, setFileData] = useState<(File | null)[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
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
      setCurrentDetailItems((prevItems) => {
        if (!prevItems) return []; // prevItems가 undefined인 경우 처리

        const updatedItems = [...prevItems];
        const currentItem = updatedItems[index];

        if (!currentItem) return prevItems; // 해당 인덱스의 아이템이 없는 경우 처리

        if ((key === "itemName" || key === "itemCode") && currentItem.itemId) {
          updatedItems[index] = {
            ...currentItem,
            [key]: value,
            itemId: null,
          };
        } else {
          updatedItems[index] = {
            ...currentItem,
            [key]: value,
          };
        }

        return updatedItems;
      });
    },
    []
  );

  const updateGlobalPrices = useCallback(() => {
    setCurrentDetailItems((prevItems) => {
      if (!prevItems || !currentSupplierInfo) return prevItems; // null/undefined 체크

      return prevItems.map((record) => {
        if (!record || record.itemType !== "ITEM") return record; // record가 없거나 ITEM이 아닌 경우 처리

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

        setInfo(response);
        setDataSource({
          documentInfo: response.documentInfo,
          response: response.response,
        });

        setCurrentDetailItems(response.response[0].itemDetail);
        setCurrentSupplierInfo(response.response[0].supplierInfo);
        setCurrentInquiryId(response.response[0].inquiryId);

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
        });
        setPdfCustomerTag({
          id: response.documentInfo.customerId,
          name: response.documentInfo.companyName,
        });
        setCusVesIdList({
          customerId: response.documentInfo.customerId,
          vesselId: response.documentInfo.vesselId,
        });

        if (response.documentInfo.discount) {
          setDcInfo({
            dcPercent: response.documentInfo.discount || 0,
            dcKrw: 0,
            dcGlobal: 0,
          });
          setInvChargeList(response.documentInfo.invChargeList || []);
        }
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

  const handleSave = async () => {
    if (!currentDetailItems || currentDetailItems.length === 0) {
      message.error("Please add an item");
      return;
    }

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
      if (isDuplicate) {
        // 중복된 품목이 있을 경우 사용자에게 확인 메시지 표시
        Modal.confirm({
          title: "Duplicate items found.",
          content: "Do you want to save it?",
          okText: "OK",
          cancelText: "Cancel",
          onOk: async () => {
            // 확인 버튼을 눌렀을 때 저장 로직 실행
            await saveData(formattedData);
          },
        });
      } else {
        // 중복이 없을 경우 바로 저장
        await saveData(formattedData);
        loadOfferDetail();
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

        // 현재 선택된 공급업체 찾기
        const currentSupplier = response.response.find(
          (supplier: { inquiryId: number }) =>
            supplier.inquiryId === currentInquiryId
        );

        if (currentSupplier) {
          setInfo(response);
          setDataSource({
            documentInfo: response.documentInfo,
            response: response.response,
          });
          // 현재 선택된 공급업체의 데이터로 설정
          setCurrentDetailItems(currentSupplier.itemDetail);
          setCurrentSupplierInfo(currentSupplier.supplierInfo);
          setCurrentInquiryId(currentSupplier.inquiryId);
          setPdfCustomerTag({
            id: response.documentInfo.customerId,
            name: response.documentInfo.companyName,
          });
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

  const handleHeaderSave = (header: string, footer: string) => {
    setPdfHeader(header);
    setPdfFooter(footer);
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

    const totalProfit = totalSalesAmountKRW - totalPurchaseAmountKRW;
    const totalProfitPercent = Number(
      ((totalProfit / totalPurchaseAmountKRW) * 100).toFixed(2)
    );
    const updatedTotalProfit =
      updatedTotalSalesAmountKRW - totalPurchaseAmountKRW;
    const updatedTotalProfitPercent = Number(
      ((updatedTotalProfit / totalPurchaseAmountKRW) * 100).toFixed(2)
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

  /**********************************************************************/

  const handleTabChange = (activeKey: string) => {
    if (!dataSource?.response) return;

    const selectedSupplier = dataSource.response.find(
      (supplier) => supplier.inquiryId.toString() === activeKey
    );

    if (selectedSupplier) {
      setCurrentDetailItems(selectedSupplier.itemDetail);
      setCurrentSupplierInfo(selectedSupplier.supplierInfo);
      setCurrentInquiryId(selectedSupplier.inquiryId);
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
    }
  };

  const handleSupplierSelect = (values: number[]) => {
    setSelectedSupplierIds(values);

    if (dataSource?.response) {
      // 선택된 공급업체들의 아이템 상세 정보 결합
      const selectedItems = dataSource.response
        .filter((resp) => values.includes(resp.supplierInfo.supplierId))
        .reduce<any[]>((acc, curr) => [...acc, ...curr.itemDetail], []);

      // MAKER와 TYPE 아이템의 중복 제거
      const seenMakerTypes = new Set<string>();
      const filteredItems = selectedItems.filter((item) => {
        if (item.itemType === "MAKER" || item.itemType === "TYPE") {
          // 공백 제거 후 비교
          const normalizedItemName = item.itemName.replace(/\s+/g, "");
          const key = `${item.itemType}-${normalizedItemName}`;
          if (seenMakerTypes.has(key)) {
            return false; // 중복된 아이템 제거
          }
          seenMakerTypes.add(key);
        }
        return true;
      });

      setCombinedItemDetails(filteredItems);
    }
  };
  // 현재 선택된 공급업체의 최신 itemDetail 정보를 가져옴
  useEffect(() => {
    if (dataSource?.response && selectedSupplierIds.length > 0) {
      const updatedSelectedItems = dataSource.response
        .filter((resp) =>
          selectedSupplierIds.includes(resp.supplierInfo.supplierId)
        )
        .reduce<any[]>((acc, curr) => {
          // 현재 선택된 탭의 공급업체인 경우 currentDetailItems 사용
          if (curr.inquiryId === currentInquiryId) {
            return [...acc, ...currentDetailItems];
          }
          // 다른 공급업체의 경우 원래 itemDetail 사용
          return [...acc, ...curr.itemDetail];
        }, []);

      // MAKER와 TYPE 아이템의 중복 제거
      const seenMakerTypes = new Set<string>();
      const filteredItems = updatedSelectedItems.filter((item) => {
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
  }, [
    currentDetailItems,
    selectedSupplierIds,
    dataSource?.response,
    currentInquiryId,
  ]);

  const renderSupplierTabs = () => {
    if (!dataSource?.response || !currentDetailItems || !currentSupplierInfo)
      return null;

    const handleAddSupplierTab = () => {
      if (!dataSource?.documentInfo?.documentNumber) {
        message.error("Document number is missing.");
        return;
      }
      console.log(currentDetailItems);

      navigate(
        `/addsupplierininquiry/${dataSource.documentInfo.documentNumber}`,
        {
          state: {
            documentInfo: dataSource.documentInfo,
            itemDetails:
              currentDetailItems || dataSource.response[0].itemDetail, // 현재 선택된 공급업체의 아이템 데이터
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
            setIsDuplicate={setIsDuplicate}
            roundToTwoDecimalPlaces={roundToTwoDecimalPlaces}
            calculateTotalAmount={calculateTotalAmount}
            handleMarginChange={handleMarginChange}
            handlePriceInputChange={handlePriceInputChange}
            offerId={supplier.inquiryId}
            tableTotals={tableTotals}
            applyDcAndCharge={applyDcAndCharge}
            dcInfo={dcInfo}
            setDcInfo={setDcInfo}
            invChargeList={invChargeList}
            setInvChargeList={setInvChargeList}
          />
          <Button
            type="primary"
            htmlType="submit"
            style={{ float: "right", width: 100, marginBottom: 20 }}
            onClick={handleSave}
            disabled={!formValues.refNumber}
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
        onChange={handleTabChange}
        tabBarExtraContent={{
          right: (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddSupplierTab}
              style={{ marginLeft: 8 }}
            >
              Add Supplier on Inquiry
            </Button>
          ),
        }}
      />
    );
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
      <Tooltip title="Please Save before sending email" placement="topLeft">
        <Button
          type="primary"
          onClick={showMailSenderModal}
          style={{ float: "right", marginTop: 20 }}
          disabled={!formValues.refNumber}
        >
          Send Email
        </Button>
      </Tooltip>
      <Button
        type="default"
        onClick={() => navigate(-1)}
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
        <span style={{ marginLeft: 20 }}>SUPPLIER: </span>
        <Select
          mode="multiple"
          style={{ minWidth: 500, marginLeft: 10 }}
          onChange={handleSupplierSelect}
          value={selectedSupplierIds}
          placeholder="Please select supplier to send email"
        >
          {dataSource?.response.map((item) => (
            <Select.Option
              key={item.supplierInfo.supplierId}
              value={item.supplierInfo.supplierId}
            >
              {item.supplierInfo.supplierCode}
            </Select.Option>
          ))}
        </Select>
      </div>
      <Modal
        title="Send Mail"
        open={isMailSenderVisible}
        onOk={handleMailSenderOk}
        onCancel={handleMailSenderCancel}
        footer={null}
        width={1200}
      >
        <OfferMailSender
          inquiryFormValues={info.documentInfo}
          handleSubmit={handleSave}
          setFileData={setFileData}
          pdfFileData={pdfFileData}
          mailData={mailData}
          pdfHeader={pdfHeader}
          loadDocumentId={loadDocumentId}
        />
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
      {pdfCustomerTag && isMailSenderVisible && dataSource && (
        <OfferPDFGenerator
          info={dataSource.documentInfo}
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
      {showPDFPreview && dataSource && (
        <OfferPDFDocument
          info={formValues}
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
