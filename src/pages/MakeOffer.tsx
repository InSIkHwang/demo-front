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

    // 값이 변경된 항목이 "salesPriceKRW", "salesPriceUSD", "purchasePriceKRW", "purchasePriceUSD"일 경우 계산하여 업데이트
    if (
      key === "salesPriceKRW" ||
      key === "salesPriceUSD" ||
      key === "purchasePriceKRW" ||
      key === "purchasePriceUSD"
    ) {
      const record = updatedDataSource[index];
      const updatedSalesAmountKRW = calculateTotalAmount(
        record.salesPriceKRW,
        record.qty
      );
      const updatedSalesAmountUSD = calculateTotalAmount(
        record.salesPriceUSD,
        record.qty
      );
      const updatedPurchaseAmountKRW = calculateTotalAmount(
        record.purchasePriceKRW,
        record.qty
      );
      const updatedPurchaseAmountUSD = calculateTotalAmount(
        record.purchasePriceUSD,
        record.qty
      );

      updatedDataSource[index] = {
        ...record,
        salesAmountKRW: updatedSalesAmountKRW,
        salesAmountUSD: updatedSalesAmountUSD,
        purchaseAmountKRW: updatedPurchaseAmountKRW,
        purchaseAmountUSD: updatedPurchaseAmountUSD,
      };
    }

    setDataSource(updatedDataSource);
  };

  const handleSave = async () => {
    const formattedData = dataSource.map((item: ItemDataType) => ({
      itemDetailId: item.itemDetailId,
      itemRemark: item.itemRemark || "",
      itemType: item.itemType,
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
      />
      <TableComponent
        dataSource={dataSource}
        setDataSource={setDataSource}
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
