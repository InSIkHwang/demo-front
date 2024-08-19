import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { message } from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import FormComponent from "../components/makeOffer/FormComponent";
import TableComponent from "../components/makeOffer/TableComponent";

// Styled Components
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

// MakeOffer Component
const MakeOffer = () => {
  const { state } = useLocation();
  const { info } = state || {};
  console.log(info);

  const [dataSource, setDataSource] = useState(info?.inquiryItemDetails || []);

  useEffect(() => {
    if (info?.inquiryItemDetails) {
      setDataSource(info.inquiryItemDetails);
    }
  }, [info]);

  const onFinish = (values: any) => {
    // Save updated data logic
    console.log("수정된 데이터:", values);
    message.success("데이터가 성공적으로 수정되었습니다!");
  };

  const handleInputChange = (index: number, key: keyof any, value: any) => {
    const newData = [...dataSource];
    newData[index][key] = value;
    setDataSource(newData);
  };

  return (
    <FormContainer>
      <Title>견적 제안 - Offers</Title>
      <FormComponent
        initialValues={{
          documentNumber: info.documentNumber,
          registerDate: info.registerDate ? dayjs(info.registerDate) : null,
          shippingDate: info.shippingDate ? dayjs(info.shippingDate) : null,
          currencyType: info.currencyType,
          currency: info.currency,
          customerName: info.customerName,
          vesselName: info.vesselName,
          refNumber: info.refNumber,
          docRemark: info.docRemark,
        }}
        onFinish={onFinish}
      />
      <TableComponent
        dataSource={dataSource}
        handleInputChange={handleInputChange}
      />
    </FormContainer>
  );
};

export default MakeOffer;
