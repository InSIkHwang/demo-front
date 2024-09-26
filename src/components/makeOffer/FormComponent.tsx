import React from "react";
import { Form, Input, DatePicker, Select, InputNumber } from "antd";
import styled from "styled-components";
import { FormValuesType } from "../../types/types";

const { Option } = Select;

const Row = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

const FormItem = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

interface FormComponentProps {
  formValues: any;
  readOnly?: boolean; // readOnly prop 추가
  handleFormChange: <K extends keyof FormValuesType>(
    key: K,
    value: FormValuesType[K]
  ) => void;
}

const FormComponent = ({
  formValues,
  readOnly,
  handleFormChange,
}: FormComponentProps) => {
  return (
    <Form layout="vertical" initialValues={formValues}>
      <Row>
        <FormItem
          label="문서번호"
          name="documentNumber"
          rules={[{ required: true, message: "Please write Document No." }]}
          normalize={(value) => value.trim()} // 입력값을 트리밍하여 저장
          style={{ maxWidth: 200 }}
        >
          <Input
            value={formValues.docNumber}
            style={{ cursor: "default" }}
            onChange={(e) => {
              const newValue = e.target.value.trim();
              handleFormChange("documentNumber", newValue); // 그냥 newValue로 설정
            }}
            readOnly
          />
        </FormItem>
        <FormItem label="문서상태" name="documentStatus">
          <Input readOnly />
        </FormItem>
        <FormItem
          label="작성일자"
          name="registerDate"
          rules={[{ required: true, message: "등록 날짜를 입력하세요!" }]}
          style={{ maxWidth: 150 }}
        >
          <DatePicker
            value={formValues.registerDate}
            onChange={(date) => handleFormChange("registerDate", date!)}
            format="YYYY-MM-DD"
            disabled={readOnly}
          />
        </FormItem>
        <FormItem
          label="선적일자"
          name="shippingDate"
          rules={[{ required: true, message: "선적 날짜를 입력하세요!" }]}
          style={{ maxWidth: 150 }}
        >
          <DatePicker
            value={formValues.shippingDate}
            onChange={(date) => handleFormChange("shippingDate", date!)}
            format="YYYY-MM-DD"
            disabled={readOnly}
          />
        </FormItem>
        <FormItem
          label="화폐"
          name="currencyType"
          rules={[{ required: true, message: "화폐를 선택하세요!" }]}
        >
          <Select
            value={formValues.currencyType}
            onChange={(value) => handleFormChange("currencyType", value)}
            disabled={readOnly}
          >
            {["USD", "EUR", "INR"].map((currencyType) => (
              <Option key={currencyType} value={currencyType}>
                {currencyType}
              </Option>
            ))}
          </Select>
        </FormItem>
        <FormItem
          label="환율"
          name="currency"
          rules={[{ required: true, message: "환율을 입력하세요!" }]}
        >
          <InputNumber
            value={formValues.currency}
            onChange={(value) =>
              handleFormChange("currency", parseFloat(value))
            }
            min={0}
            style={{ width: "100%" }}
            disabled={readOnly}
          />
        </FormItem>
      </Row>

      <Row>
        <FormItem
          label="매출처"
          name="customerName"
          rules={[{ required: true, message: "매출처를 입력하세요!" }]}
        >
          <Input readOnly />
        </FormItem>
        <FormItem
          label="선박명"
          name="vesselName"
          rules={[{ required: true, message: "선박명을 입력하세요!" }]}
        >
          <Input readOnly />
        </FormItem>
        <FormItem label="HULL NO." name="veeselHullNo">
          <Input
            value={formValues.veeselHullNo}
            onChange={(e) => handleFormChange("veeselHullNo", e.target.value)}
            readOnly={readOnly}
          />
        </FormItem>
        <FormItem
          label="REF NO."
          name="refNumber"
          rules={[{ required: true, message: "REF NO.를 입력하세요!" }]}
          style={{ flex: "20%" }}
        >
          <Input readOnly />
        </FormItem>
      </Row>
      <Row>
        <FormItem
          label="의뢰처"
          name="supplierName"
          rules={[{ required: true, message: "의뢰처를 입력하세요!" }]}
          style={{ flex: 3 }}
        >
          <Input readOnly />
        </FormItem>
        <FormItem label="비고" name="docRemark" style={{ flex: 7 }}>
          <Input.TextArea
            value={formValues.docRemark}
            onChange={(e) => handleFormChange("docRemark", e.target.value)}
            rows={1}
            readOnly={readOnly}
          />
        </FormItem>
      </Row>
    </Form>
  );
};

export default FormComponent;
