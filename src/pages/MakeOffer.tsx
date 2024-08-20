import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button, message } from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import FormComponent from "../components/makeOffer/FormComponent";
import TableComponent from "../components/makeOffer/TableComponent";
import { editOffer } from "../api/api";
import { ItemDataType } from "../types/types";

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
  const { info } = state || {};

  const [dataSource, setDataSource] = useState(info?.inquiryItemDetails || []);

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
    setDataSource(updatedDataSource);
  };

  const handleSave = async () => {
    const formattedData = dataSource.map((item: ItemDataType) => ({
      itemDetailId: item.itemDetailId,
      itemRemark: item.itemRemark || "",
      qty: item.qty,
      unit: item.unit || "",
      itemId: item.itemId,
      salesPriceKRW: item.salesPriceKRW,
      salesPriceUSD: item.salesPriceUSD,
      salesAmountKRW: item.salesAmountKRW,
      salesAmountUSD: item.salesAmountUSD,
      margin: item.margin,
      purchasePriceKRW: item.purchasePriceKRW,
      purchasePriceUSD: item.purchasePriceUSD,
      purchaseAmountKRW: item.purchaseAmountKRW,
      purchaseAmountUSD: item.purchaseAmountUSD,
    }));
    try {
      await editOffer(
        info.supplierInquiryId,
        info.supplierInfo.supplierId,
        formattedData
      );
      message.success("성공적으로 저장 되었습니다!");
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
      />
      <TableComponent
        dataSource={dataSource}
        handleInputChange={handleInputChange}
        currency={info.currency}
      />
      <Button
        type="primary"
        htmlType="submit"
        style={{ float: "right", width: 100, marginTop: 20 }}
        onClick={handleSave}
      >
        저장
      </Button>
    </FormContainer>
  );
};

export default MakeOffer;
