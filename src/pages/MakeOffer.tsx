import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Button, message, Modal, Select } from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import FormComponent from "../components/makeOffer/FormComponent";
import TableComponent from "../components/makeOffer/TableComponent";
import { editOffer, fetchOfferDetail } from "../api/api";
import { FormValuesType, ItemDataType } from "../types/types";
import MergedTableComponent from "../components/makeOffer/MergedTableComponent";
import OfferHeaderEditModal from "../components/makeOffer/OfferHeaderEditModal";
import OfferPDFDocument from "../components/makeOffer/OfferPDFDocument";

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
  const [info, setInfo] = useState(state?.info || {});
  const [dataSource, setDataSource] = useState(info?.inquiryItemDetails || []);
  const [formValues, setFormValues] = useState<FormValuesType>({
    supplierInquiryId: info?.supplierInquiryId || "",
    supplierName: info?.supplierName || "",
    documentNumber: info?.documentNumber || "",
    registerDate: dayjs(info?.registerDate) || "",
    shippingDate: dayjs(info?.shippingDate) || "",
    currencyType: info?.currencyType || "",
    currency: info?.currency || 0,
    customerName: info?.customerName || "",
    vesselName: info?.vesselName || "",
    refNumber: info?.refNumber || "",
    docRemark: info?.docRemark || "",
    documentStatus: info?.documentStatus || "",
    veeselHullNo: info?.veeselHullNo || "",
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
  }>({ id: 99, name: "test" });

  console.log(formValues);

  const debounce = <T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ) => {
    let timer: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  useEffect(() => {
    const loadOfferDetail = async () => {
      if (info?.supplierInquiryId && info?.supplierInfo?.supplierId) {
        try {
          const response = await fetchOfferDetail(
            info.supplierInquiryId,
            info.supplierInfo.supplierId
          );
          setInfo(response);
          setDataSource(response.inquiryItemDetails || []);
        } catch (error) {
          message.error("데이터를 가져오는 중 오류가 발생했습니다.");
        }
      }
    };

    loadOfferDetail();
  }, [info.supplierInquiryId, info.supplierInfo?.supplierId]);

  useEffect(() => {
    if (info?.inquiryItemDetails) {
      setDataSource(info.inquiryItemDetails);
      setFormValues({
        supplierInquiryId: info.supplierInquiryId,
        supplierName: info.supplierName,
        documentNumber: info.documentNumber,
        registerDate: dayjs(info.registerDate),
        shippingDate: dayjs(info.shippingDate),
        currencyType: info.currencyType,
        currency: info.currency,
        customerName: info.customerName,
        vesselName: info.vesselName,
        refNumber: info.refNumber,
        docRemark: info.docRemark,
        documentStatus: info.documentStatus,
        veeselHullNo: info.veeselHullNo,
      });
    }
  }, [info]);

  const handleInputChange = (
    index: number,
    key: keyof ItemDataType,
    value: any
  ) => {
    const updatedDataSource = [...dataSource];
    updatedDataSource[index][key] = value;

    // 값이 변경된 항목이 "salesPriceKRW", "salesPriceGlobal", "purchasePriceKRW", "purchasePriceGlobal"일 경우 계산하여 업데이트
    if (
      key === "salesPriceKRW" ||
      key === "salesPriceGlobal" ||
      key === "purchasePriceKRW" ||
      key === "purchasePriceGlobal"
    ) {
      const record = updatedDataSource[index];
      const updatedSalesAmountKRW = calculateTotalAmount(
        record.salesPriceKRW,
        record.qty
      );
      const updatedSalesAmountGlobal = calculateTotalAmount(
        record.salesPriceGlobal,
        record.qty
      );
      const updatedPurchaseAmountKRW = calculateTotalAmount(
        record.purchasePriceKRW,
        record.qty
      );
      const updatedPurchaseAmountGlobal = calculateTotalAmount(
        record.purchasePriceGlobal,
        record.qty
      );

      updatedDataSource[index] = {
        ...record,
        salesAmountKRW: updatedSalesAmountKRW,
        salesAmountGlobal: updatedSalesAmountGlobal,
        purchaseAmountKRW: updatedPurchaseAmountKRW,
        purchaseAmountGlobal: updatedPurchaseAmountGlobal,
      };
    }

    setDataSource(updatedDataSource);
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

  const calculateTotalAmount = (price: number, qty: number) =>
    roundToTwoDecimalPlaces(price * qty);

  // 마진을 계산하는 함수
  const calculateMargin = (salesAmount: number, purchaseAmount: number) =>
    purchaseAmount === 0
      ? 0
      : roundToTwoDecimalPlaces(
          ((salesAmount - purchaseAmount) / purchaseAmount) * 100
        );

  // formValues의 currency가 변경될 때 updateGlobalPrices 호출
  useEffect(() => {
    if (formValues?.currency) {
      updateGlobalPrices();
    }
  }, [formValues.currency]);

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
    const formData = {
      registerDate: formValues.registerDate,
      shippingDate: formValues.shippingDate,
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
      formattedData
    );

    message.success("성공적으로 저장 되었습니다!");

    // 저장 후 최신 데이터로 업데이트
    const response = await fetchOfferDetail(
      info.supplierInquiryId,
      info.supplierInfo.supplierId
    );
    setInfo(response);
    setDataSource(response.inquiryItemDetails || []);
  };

  const handlePDFPreview = () => {
    setShowPDFPreview((prevState) => !prevState);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const handleOpenHeaderModal = () => {
    setPdfCustomerTag({
      id: info.supplierInfo?.customerId, //api 응답값 추가 필요
      name: info.supplierInfo?.customerName,
    });
    setHeaderEditModalVisible(true);
  };

  const handleCloseHeaderModal = () => {
    setHeaderEditModalVisible(false);
  };

  const handleHeaderSave = (header: string, footer: string) => {
    setPdfHeader(header);
    setPdfFooter(footer);
  };

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
      {!isReadOnly && (
        <TableComponent
          dataSource={dataSource}
          setDataSource={setDataSource}
          handleInputChange={handleInputChange}
          currency={formValues.currency}
          setIsDuplicate={setIsDuplicate}
          roundToTwoDecimalPlaces={roundToTwoDecimalPlaces}
          convertCurrency={convertCurrency}
          updateGlobalPrices={updateGlobalPrices}
          calculateTotalAmount={calculateTotalAmount}
          calculateMargin={calculateMargin}
        />
      )}
      {isReadOnly && (
        <MergedTableComponent
          dataSource={dataSource}
          setDataSource={setDataSource}
          currency={formValues.currency}
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
            pdfCompanyTag={pdfCustomerTag!}
          />
          <Button
            style={{ marginLeft: 10 }}
            onClick={handlePDFPreview}
            type="default"
          >
            {showPDFPreview ? "미리보기 닫기" : "PDF 미리보기"}
          </Button>
        </div>
      )}
      {showPDFPreview && (
        <OfferPDFDocument
          info={info}
          supplierName={pdfCustomerTag ? pdfCustomerTag.name : ""}
          pdfHeader={pdfHeader}
          pdfFooter={pdfFooter}
          viewMode={true}
          language={language}
        />
      )}
    </FormContainer>
  );
};

export default MakeOffer;
