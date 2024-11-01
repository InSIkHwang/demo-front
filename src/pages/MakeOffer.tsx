import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, message, Modal, Select } from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import FormComponent from "../components/makeOffer/FormComponent";
import TableComponent from "../components/makeOffer/TableComponent";
import { editMurgedOffer, editOffer, fetchOfferDetail } from "../api/api";
import {
  FormValuesType,
  ItemDataType,
  offerEmailSendData,
} from "../types/types";
import MergedTableComponent from "../components/makeOffer/MergedTableComponent";
import OfferHeaderEditModal from "../components/makeOffer/OfferHeaderEditModal";
import OfferPDFDocument from "../components/makeOffer/OfferPDFDocument";
import LoadingSpinner from "../components/LoadingSpinner";
import OfferPDFGenerator from "../components/makeOffer/OfferPDFGenerator";
import OfferMailSender from "../components/makeOffer/OfferSendMail";
import { InvCharge } from "./../types/types";
import ChargeInputPopover from "../components/makeOffer/ChargeInputPopover";

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
  const [dataSource, setDataSource] = useState<ItemDataType[]>([]);
  const [formValues, setFormValues] = useState<FormValuesType>({
    supplierInquiryId: 0,
    supplierName: "",
    documentNumber: "",
    registerDate: dayjs(),
    shippingDate: dayjs(),
    currencyType: "",
    currency: 0,
    customerName: "",
    vesselName: "",
    refNumber: "",
    docRemark: "",
    documentStatus: "",
    veeselHullNo: "",
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
  const [isPdfAutoUploadChecked, setIsPdfAutoUploadChecked] = useState(true);
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

  // formValues의 currency가 변경될 때 updateGlobalPrices 호출
  useEffect(() => {
    if (formValues?.currency) {
      updateGlobalPrices();
    }
  }, [formValues?.currency]);

  // 데이터 로드 및 상태 업데이트 함수
  const loadOfferDetail = async () => {
    setIsLoading(true);
    if (loadDocumentId) {
      try {
        const response = await fetchOfferDetail(loadDocumentId.documentId);

        console.log(response);

        // 공통 작업 처리
        setInfo(response);
        setDataSource(response.inquiryItemDetails || []);
        setFormValues({
          supplierInquiryId: response.supplierInquiryId,
          supplierName: response.supplierName,
          documentNumber: response.documentNumber,
          registerDate: dayjs(response.registerDate),
          shippingDate: dayjs(response.shippingDate),
          currencyType: response.currencyType,
          currency: response.currency,
          customerName: response.customerName,
          vesselName: response.vesselName,
          refNumber: response.refNumber,
          docRemark: response.docRemark,
          documentStatus: response.documentStatus,
          veeselHullNo: response.veeselHullNo,
        });
        setPdfCustomerTag({
          id: response.customerId,
          name: response.customerName,
        });
        setCusVesIdList({
          customerId: response.customerId,
          vesselId: response.vesselId,
        });

        if (response.inquiryItemDetails) {
          setDcInfo({
            dcPercent: response.discount || 0,
            dcKrw: 0,
            dcGlobal: 0,
          });
          setInvChargeList(response.invChargeList || []);
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
  // 환율을 적용하여 KRW와 USD를 상호 변환하는 함수
  const convertCurrency = (
    value: number,
    currency: number,
    toCurrency: "KRW" | "USD" | "EUR" | "INR"
  ) => {
    if (toCurrency === "KRW") {
      return roundToTwoDecimalPlaces(value * currency);
    }
    return roundToTwoDecimalPlaces(value / currency);
  };

  const handleCalculations = (index: number, updatedItem: ItemDataType) => {
    const updatedSalesAmountKRW = calculateTotalAmount(
      updatedItem.salesPriceKRW,
      updatedItem.qty
    );
    const updatedSalesAmountGlobal = calculateTotalAmount(
      updatedItem.salesPriceGlobal,
      updatedItem.qty
    );
    const updatedPurchaseAmountKRW = calculateTotalAmount(
      updatedItem.purchasePriceKRW,
      updatedItem.qty
    );
    const updatedPurchaseAmountGlobal = calculateTotalAmount(
      updatedItem.purchasePriceGlobal,
      updatedItem.qty
    );

    const updatedDataSource = [...dataSource];
    updatedDataSource[index] = {
      ...updatedItem,
      salesAmountKRW: updatedSalesAmountKRW,
      salesAmountGlobal: updatedSalesAmountGlobal,
      purchaseAmountKRW: updatedPurchaseAmountKRW,
      purchaseAmountGlobal: updatedPurchaseAmountGlobal,
    };

    // Update state if there are changes
    if (JSON.stringify(dataSource) !== JSON.stringify(updatedDataSource)) {
      setDataSource(updatedDataSource);
    }
  };

  // Handle input change
  const handleInputChange = useCallback(
    (index: number, key: keyof ItemDataType, value: any) => {
      const updatedDataSource = [...dataSource];
      const currentItem = updatedDataSource[index];
      let updatedItem = { ...currentItem, [key]: value };
      // Update the data source immediately
      updatedDataSource[index] = updatedItem;
      if (JSON.stringify(dataSource) !== JSON.stringify(updatedDataSource)) {
        setDataSource(updatedDataSource);
      }
    },
    [dataSource]
  );

  const handlePriceInputChange = (
    index: number,
    key: keyof ItemDataType,
    value: any,
    currency: number
  ) => {
    const updatedDataSource = [...dataSource];
    const currentItem = updatedDataSource[index];
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
      updatedItem = {
        ...updatedItem,
        purchasePriceGlobal: updatedGlobalPrice,
      };
      handleMarginChange(index, currentItem.margin || 0);
    }

    if (key === "salesPriceGlobal") {
      const updatedKRWPrice = Math.round(
        convertCurrency(value, currency, "KRW")
      );
      updatedItem = { ...updatedItem, salesPriceKRW: updatedKRWPrice };

      // 마진 계산 추가 (소수점 둘째 자리까지)
      const margin = parseFloat(
        (
          ((value - (currentItem.purchasePriceGlobal || 1)) /
            (currentItem.purchasePriceGlobal || 1)) *
          100
        ).toFixed(2)
      );
      updatedItem = { ...updatedItem, margin };
    }

    if (key === "salesPriceKRW") {
      const updatedGlobalPrice = convertCurrency(value, currency, "USD");
      updatedItem = { ...updatedItem, salesPriceGlobal: updatedGlobalPrice };

      // 마진 계산 추가 (소수점 둘째 자리까지)
      const margin = parseFloat(
        (
          ((value - (currentItem.purchasePriceKRW || 1)) /
            (currentItem.purchasePriceKRW || 1)) *
          100
        ).toFixed(2)
      );
      updatedItem = { ...updatedItem, margin };
    }

    // Update the data source immediately
    updatedDataSource[index] = updatedItem;
    if (JSON.stringify(dataSource) !== JSON.stringify(updatedDataSource)) {
      setDataSource(updatedDataSource);
      handleCalculations(index, updatedItem);
    }
  };

  const handleFormChange = <K extends keyof typeof formValues>(
    key: K,
    value: (typeof formValues)[K]
  ) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  // 소수점 둘째자리까지 반올림하는 함수
  const roundToTwoDecimalPlaces = (value: number) => {
    return Math.round(value * 100) / 100;
  };

  const updateGlobalPrices = () => {
    dataSource.forEach((record: any, index: number) => {
      if (record.itemType === "ITEM") {
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

        handleInputChange(index, "salesPriceGlobal", updatedSalesPriceGlobal);
        handleInputChange(
          index,
          "purchasePriceGlobal",
          updatedPurchasePriceGlobal
        );
      }
    });
  };

  const handleMarginChange = (index: number, marginValue: number) => {
    const updatedDataSource = [...dataSource];
    const currentItem = updatedDataSource[index];

    // 매입단가
    const purchasePriceKRW = currentItem.purchasePriceKRW || 0;

    const qty = currentItem.qty || 0;

    // 매출단가 계산 (매입단가 * (1 + 마진/100))
    const salesPriceKRW = Math.round(
      purchasePriceKRW * (1 + marginValue / 100)
    );
    const salesAmountKRW = calculateTotalAmount(salesPriceKRW, qty);

    // Global 가격 계산 (환율 적용)
    const exchangeRate = formValues.currency; // currency에 해당하는 환율 값을 사용
    const salesPriceGlobal = roundToTwoDecimalPlaces(
      salesPriceKRW / exchangeRate
    );
    const salesAmountGlobal = calculateTotalAmount(salesPriceGlobal, qty);

    // 매출단가와 매출총액 업데이트
    updatedDataSource[index] = {
      ...currentItem,
      salesPriceKRW,
      salesAmountKRW,
      salesPriceGlobal,
      salesAmountGlobal,
      margin: marginValue,
    };

    setDataSource(updatedDataSource);
  };

  const handleSave = async () => {
    if (dataSource.length === 0) {
      message.error("Please add an item");
      return;
    }

    const formattedData = dataSource.map((item: ItemDataType) => ({
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
    if (cusVesIdList.customerId && cusVesIdList.vesselId) {
      try {
        const formData = {
          registerDate: formValues.registerDate.format("YYYY-MM-DD"),
          shippingDate: formValues.shippingDate.format("YYYY-MM-DD"),
          currencyType: formValues.currencyType,
          refNumber: formValues.refNumber,
          currency: formValues.currency,
          vesselId: cusVesIdList.vesselId,
          veeselHullNo: formValues.veeselHullNo,
          docRemark: formValues.docRemark,
          customerId: cusVesIdList.customerId,
        };

        await editOffer(
          info.supplierInquiryId,
          info.supplierInfo.supplierId,
          formData,
          formattedData,
          dcInfo.dcPercent,
          invChargeList
        );

        message.success("Saved successfully!");

        // 저장 후 최신 데이터로 업데이트
        const response = await fetchOfferDetail(loadDocumentId.documentId);
        setInfo(response);
        setDataSource(response.inquiryItemDetails || []);
        setPdfCustomerTag({
          id: response.customerId,
          name: response.customerName,
        });
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
  // 공통 함수: reduce를 사용한 합계 계산
  const calculateTotal = (
    data: Array<any>,
    key: string,
    qtyKey: string = "qty"
  ) => {
    return data.reduce((acc: number, record: any) => {
      const price = record[key] || 0; // chargePriceKRW
      // data가 invChargeList인 경우에만 qty를 1로 설정
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

  const applyDcAndCharge = () => {
    const updatedDataSource = dataSource.map((currentItem) => {
      const { purchasePriceKRW = 0, qty = 0, margin = 0 } = currentItem;

      const salesPriceKRW = Math.round(purchasePriceKRW * (1 + margin / 100));
      const salesAmountKRW = calculateTotalAmount(salesPriceKRW, qty);

      const exchangeRate = formValues.currency;
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

    setDataSource(updatedDataSource);

    // 공통 계산
    const totalSalesAmountKRW = calculateTotal(
      updatedDataSource,
      "salesPriceKRW"
    );
    const totalSalesAmountGlobal = calculateTotal(
      updatedDataSource,
      "salesPriceGlobal"
    );
    const totalPurchaseAmountKRW = calculateTotal(
      updatedDataSource,
      "purchasePriceKRW"
    );
    const totalPurchaseAmountGlobal = calculateTotal(
      updatedDataSource,
      "purchasePriceGlobal"
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

    const updatedTotalProfit =
      updatedTotalSalesAmountKRW - totalPurchaseAmountKRW;
    const updatedTotalProfitPercent = Number(
      ((updatedTotalProfit / totalPurchaseAmountKRW) * 100).toFixed(2)
    );

    // 최종 가격 설정
    setFinalTotals({
      ...finalTotals,
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

  /**********************************************************************/

  if (isLoading) {
    return <LoadingSpinner />; // 로딩 중 화면
  }

  return (
    <FormContainer>
      <Title>견적 제안 - Offers</Title>
      {formValues && (
        <FormComponent
          formValues={formValues}
          handleFormChange={handleFormChange}
          setCusVesIdList={setCusVesIdList}
          cusVesIdList={cusVesIdList}
          offerId={loadDocumentId.documentId}
        />
      )}
      <ChargeInputPopover
        currency={formValues.currency}
        dcInfo={dcInfo}
        setDcInfo={setDcInfo}
        invChargeList={invChargeList}
        setInvChargeList={setInvChargeList}
        applyDcAndCharge={applyDcAndCharge}
        finalTotals={finalTotals}
      />
      <TableComponent
        dataSource={dataSource}
        setDataSource={setDataSource}
        handleInputChange={handleInputChange}
        currency={formValues.currency}
        setIsDuplicate={setIsDuplicate}
        roundToTwoDecimalPlaces={roundToTwoDecimalPlaces}
        calculateTotalAmount={calculateTotalAmount}
        handleMarginChange={handleMarginChange}
        handlePriceInputChange={handlePriceInputChange}
        finalTotals={finalTotals}
        applyDcAndCharge={applyDcAndCharge}
        offerId={loadDocumentId.documentId}
      />{" "}
      <Button
        type="primary"
        onClick={showMailSenderModal}
        style={{ float: "right", marginTop: 20 }}
        disabled={!formValues.refNumber}
      >
        Send Email
      </Button>{" "}
      <Button
        type="primary"
        htmlType="submit"
        style={{ float: "right", width: 100, margin: "20px 15px 0 0 " }}
        onClick={handleSave}
        disabled={!formValues.refNumber}
      >
        Save
      </Button>{" "}
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
          inquiryFormValues={info}
          handleSubmit={handleSave}
          setFileData={setFileData}
          isPdfAutoUploadChecked={isPdfAutoUploadChecked}
          setIsPdfAutoUploadChecked={setIsPdfAutoUploadChecked}
          pdfFileData={pdfFileData}
          mailData={mailData}
          pdfHeader={pdfHeader}
          loadDocumentId={loadDocumentId}
        />
      </Modal>
      {pdfCustomerTag && isMailSenderVisible && (
        <OfferPDFGenerator
          info={info}
          items={info.inquiryItemDetails}
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
      {showPDFPreview && (
        <OfferPDFDocument
          info={info}
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
