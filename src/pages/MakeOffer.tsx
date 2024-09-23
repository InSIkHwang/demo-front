import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
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
import debounce from "lodash/debounce";
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
  const idList = {
    offerId: state?.info.supplierInquiryId || [],
    supplierId: state?.info.supplierInfo?.supplierId,
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
  const isReadOnly = window.location.pathname === "/makeoffer/mergedoffer";
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
  const [totals, setTotals] = useState({
    totalSalesAmountKRW: 0,
    totalSalesAmountGlobal: 0,
    totalPurchaseAmountKRW: 0,
    totalPurchaseAmountGlobal: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
  });
  const [finalTotals, setFinalTotals] = useState({
    totalSalesAmountKRW: 0,
    totalSalesAmountGlobal: 0,
    totalPurchaseAmountKRW: 0,
    totalPurchaseAmountGlobal: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
  });
  const [dcInfo, setDcInfo] = useState({
    dcPercent: 0,
    dcKrw: 0,
    dcGlobal: 0,
  });
  const [invChargeList, setInvChargeList] = useState<InvCharge[] | null>([]);

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
    if (idList) {
      try {
        const response = isReadOnly
          ? await editMurgedOffer(idList.offerId) // 배열로 전달
          : await fetchOfferDetail(idList.offerId, idList.supplierId);

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

        if (response.inquiryItemDetails) {
          const totalSalesAmountKRW = response.inquiryItemDetails.reduce(
            (acc: number, record: { salesPriceKRW: number; qty: number }) =>
              acc + calculateTotalAmount(record.salesPriceKRW, record.qty),
            0
          );
          const totalSalesAmountGlobal = response.inquiryItemDetails.reduce(
            (acc: number, record: { salesPriceGlobal: number; qty: number }) =>
              acc + calculateTotalAmount(record.salesPriceGlobal, record.qty),
            0
          );
          const totalPurchaseAmountKRW = response.inquiryItemDetails.reduce(
            (acc: number, record: { purchasePriceKRW: number; qty: number }) =>
              acc + calculateTotalAmount(record.purchasePriceKRW, record.qty),
            0
          );
          const totalPurchaseAmountGlobal = response.inquiryItemDetails.reduce(
            (
              acc: number,
              record: { purchasePriceGlobal: number; qty: number }
            ) =>
              acc +
              calculateTotalAmount(record.purchasePriceGlobal, record.qty),
            0
          );
          const totalProfit = totalSalesAmountKRW - totalPurchaseAmountKRW;
          const totalProfitPercent = Number(
            ((totalProfit / totalPurchaseAmountKRW) * 100).toFixed(2)
          );

          setTotals({
            totalSalesAmountKRW,
            totalSalesAmountGlobal,
            totalPurchaseAmountKRW,
            totalPurchaseAmountGlobal,
            totalProfit,
            totalProfitPercent,
          });

          setDcInfo({
            dcPercent: response.discount || 0,
            dcKrw:
              Number(
                (totalSalesAmountKRW * (response.discount / 100)).toFixed(2)
              ) || 0,
            dcGlobal:
              Number(
                (totalSalesAmountGlobal * (response.discount / 100)).toFixed(2)
              ) || 0,
          });
          setInvChargeList(response.invChargeList || []);
        }
      } catch (error) {
        message.error("데이터를 가져오는 중 오류가 발생했습니다.");
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

    // Check if the key is 'salesPriceGlobal'
    if (key === "purchasePriceGlobal") {
      // Update salesPriceKRW based on the new value and currency
      const updatedKRWPrice = convertCurrency(value, currency, "KRW");
      updatedItem = { ...updatedItem, purchasePriceKRW: updatedKRWPrice };
    }

    // Check if the key is 'salesPriceKRW'
    if (key === "purchasePriceKRW") {
      // Update salesPriceGlobal based on the new value and currency
      const updatedGlobalPrice = convertCurrency(value, currency, "USD");
      updatedItem = {
        ...updatedItem,
        purchasePriceGlobal: updatedGlobalPrice,
      };
    }

    // Update the data source immediately
    updatedDataSource[index] = updatedItem;
    if (JSON.stringify(dataSource) !== JSON.stringify(updatedDataSource)) {
      setDataSource(updatedDataSource);
    }

    // Call the debounced calculations if needed
    if (key === "purchasePriceKRW" || key === "purchasePriceGlobal") {
      handleCalculations(index, updatedItem);
    }
  };

  const handleFormChange = debounce(
    <K extends keyof typeof formValues>(
      key: K,
      value: (typeof formValues)[K]
    ) => {
      if (!isReadOnly) {
        setFormValues((prev) => ({ ...prev, [key]: value }));
      }
    },
    500
  );

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
    const salesPriceKRW = roundToTwoDecimalPlaces(
      purchasePriceKRW * (1 + marginValue / 100)
    );
    const salesAmountKRW = calculateTotalAmount(salesPriceKRW, qty);

    // 매출단가와 매출총액 업데이트
    updatedDataSource[index] = {
      ...currentItem,
      salesPriceKRW,
      salesAmountKRW,
      margin: marginValue,
    };

    setDataSource(updatedDataSource);
  };

  const handleSave = async () => {
    if (dataSource.length === 0) {
      message.error("아이템을 추가해주세요");
      return;
    }

    const formattedData = dataSource.map((item: ItemDataType) => ({
      position: item.position,
      itemDetailId: item.itemDetailId,
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
          title: "중복된 품목이 있습니다.",
          content: "저장하시겠습니까?",
          okText: "확인",
          cancelText: "취소",
          onOk: async () => {
            // 확인 버튼을 눌렀을 때 저장 로직 실행
            await saveData(formattedData);
          },
        });
      } else {
        // 중복이 없을 경우 바로 저장
        await saveData(formattedData);
      }
    } catch (error) {
      message.error("데이터 저장 중 오류가 발생했습니다.");
    }
  };

  // 저장 로직을 함수로 분리
  const saveData = async (formattedData: any) => {
    try {
      const formData = {
        registerDate: formValues.registerDate.format("YYYY-MM-DD"),
        shippingDate: formValues.shippingDate.format("YYYY-MM-DD"),
        currencyType: formValues.currencyType,
        currency: formValues.currency,
        vesselId: info.vesselId,
        veeselHullNo: formValues.veeselHullNo,
        docRemark: formValues.docRemark,
      };

      await editOffer(
        info.supplierInquiryId,
        info.supplierInfo.supplierId,
        formData,
        formattedData,
        dcInfo.dcPercent,
        invChargeList
      );

      message.success("성공적으로 저장 되었습니다!");

      // 저장 후 최신 데이터로 업데이트
      const response = await fetchOfferDetail(
        info.supplierInquiryId,
        info.supplierInfo.supplierId
      );
      setInfo(response);
      setDataSource(response.inquiryItemDetails || []);
      setPdfCustomerTag({
        id: response.customerId,
        name: response.customerName,
      });
    } catch (error) {
      console.error("Error saving data:", error);
      message.error("데이터 저장 중 오류가 발생했습니다.");
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

  if (isLoading) {
    return <LoadingSpinner />; // 로딩 중 화면
  }

  return (
    <FormContainer>
      <Title>견적 제안 - Offers</Title>
      {formValues && (
        <FormComponent
          formValues={formValues}
          readOnly={isReadOnly}
          handleFormChange={handleFormChange}
        />
      )}
      <ChargeInputPopover
        totals={totals}
        finalTotals={finalTotals}
        setFinalTotals={setFinalTotals}
        currency={formValues.currency}
        dcInfo={dcInfo}
        setDcInfo={setDcInfo}
        invChargeList={invChargeList}
        setInvChargeList={setInvChargeList}
      />
      {!isReadOnly && (
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
          setFinalTotals={setFinalTotals}
          totals={totals}
          setTotals={setTotals}
        />
      )}
      {isReadOnly && (
        <MergedTableComponent
          dataSource={dataSource}
          setDataSource={setDataSource}
          currency={formValues.currency}
          currencyType={formValues.currencyType}
          finalTotals={finalTotals}
        />
      )}

      {!isReadOnly && (
        <Button
          type="primary"
          htmlType="submit"
          style={{ float: "right", width: 100, marginTop: 20 }}
          onClick={handleSave}
        >
          저장
        </Button>
      )}
      {isReadOnly && (
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
            {showPDFPreview ? "미리보기 닫기" : "PDF 미리보기"}
          </Button>
          <Button
            type="primary"
            onClick={showMailSenderModal}
            style={{ margin: "20px 0 0 15px", float: "right" }}
          >
            Send Email
          </Button>
        </div>
      )}
      <Modal
        title="Send Mail"
        open={isMailSenderVisible}
        onOk={handleMailSenderOk}
        onCancel={handleMailSenderCancel}
        footer={null}
        width={800}
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
          idList={idList}
        />
      </Modal>
      {isReadOnly && pdfCustomerTag && isMailSenderVisible && (
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
