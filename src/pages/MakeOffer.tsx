import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button, message } from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import FormComponent from "../components/makeOffer/FormComponent";
import TableComponent, {
  calculateTotalAmount,
} from "../components/makeOffer/TableComponent";
import { editOffer, fetchOfferDetail } from "../api/api";
import { ItemDataType } from "../types/types";
import MergedTableComponent from "../components/makeOffer/MergedTableComponent";

const FormContainer = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  padding-bottom: 80px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 70vw;
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
  const isReadOnly = window.location.pathname === "/makeoffer/mergedoffer";
console.log(info);

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
const handleSave = async () => {
  if (dataSource.length === 0) {
    message.error("아이템을 추가해주세요");
    return;
  }

  const formattedData = dataSource.map((item: ItemDataType) => ({
    position: item.position,
    itemDetailId: item.itemDetailId,
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
    await editOffer(
      info.supplierInquiryId,
      info.supplierInfo.supplierId,
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
  } catch (error) {
    message.error("데이터 저장 중 오류가 발생했습니다.");
  }
};

  return (
    <FormContainer>
      <Title>견적 제안 - Offers</Title>
      <FormComponent
        initialValues={{
          supplierInquiryId: info.supplierInquiryId,
          supplierName: info.supplierName,
          documentNumber: info.documentNumber,
          registerDate: info.registerDate ? dayjs(info.registerDate) : null,
          shippingDate: info.shippingDate ? dayjs(info.shippingDate) : null,
          currencyType: info.currencyType,
          currency: info.currency,
          customerName: info.customerName,
          vesselName: info.vesselName,
          refNumber: info.refNumber,
          docRemark: info.docRemark,
          documentStatus: info.documentStatus,
          veeselHullNo: info.veeselHullNo,
        }}
        readOnly={isReadOnly}
      />
      {!isReadOnly && (
        <TableComponent
          dataSource={dataSource}
          setDataSource={setDataSource}
          handleInputChange={handleInputChange}
          currency={info.currency}
        />
      )}
      {isReadOnly && (
        <MergedTableComponent
          dataSource={dataSource}
          setDataSource={setDataSource}
          currency={info.currency}
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
          <Button type="default">PDF 미리보기</Button>
          <Button style={{ marginLeft: 10 }}>머릿글 수정</Button>
        </div>
      )}
    </FormContainer>
  );
};

export default MakeOffer;
