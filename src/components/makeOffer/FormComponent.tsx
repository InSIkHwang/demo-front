import React from "react";
import { Form, Input, Button, DatePicker, Select, InputNumber } from "antd";
import dayjs from "dayjs";
import styled from "styled-components";

const Row = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

const FormItem = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

// FormComponent Props Type
interface FormComponentProps {
  initialValues: any;
  onFinish: (values: any) => void;
}

const FormComponent = ({ initialValues, onFinish }: FormComponentProps) => {
  return (
    <Form layout="vertical" initialValues={initialValues} onFinish={onFinish}>
      <Row>
        <FormItem
          label="문서번호"
          name="documentNumber"
          rules={[{ required: true, message: "문서번호를 입력하세요!" }]}
          style={{ maxWidth: 200 }}
        >
          <Input disabled />
        </FormItem>
        <FormItem
          label="작성일자"
          name="registerDate"
          rules={[{ required: true, message: "등록 날짜를 입력하세요!" }]}
          style={{ maxWidth: 150 }}
        >
          <DatePicker format="YYYY-MM-DD" />
        </FormItem>
        <FormItem
          label="선적일자"
          name="shippingDate"
          rules={[{ required: true, message: "선적 날짜를 입력하세요!" }]}
          style={{ maxWidth: 150 }}
        >
          <DatePicker format="YYYY-MM-DD" />
        </FormItem>
        <FormItem
          label="화폐"
          name="currencyType"
          rules={[{ required: true, message: "화폐를 선택하세요!" }]}
        >
          <Select>
            <Select.Option value="USD">USD</Select.Option>
            <Select.Option value="KRW">KRW</Select.Option>
            {/* 다른 화폐 옵션 추가 가능 */}
          </Select>
        </FormItem>
        <FormItem
          label="환율"
          name="currency"
          rules={[{ required: true, message: "환율을 입력하세요!" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </FormItem>
      </Row>

      <Row>
        <FormItem
          label="매출처"
          name="customerName"
          rules={[{ required: true, message: "매출처를 입력하세요!" }]}
        >
          <Input />
        </FormItem>
        <FormItem
          label="선박명"
          name="vesselName"
          rules={[{ required: true, message: "선박명을 입력하세요!" }]}
        >
          <Input />
        </FormItem>
        <FormItem
          label="REF NO."
          name="refNumber"
          rules={[{ required: true, message: "REF NO.를 입력하세요!" }]}
          style={{ flex: "20%" }}
        >
          <Input />
        </FormItem>
      </Row>
      <Row>
        <FormItem label="비고" name="docRemark">
          <Input.TextArea rows={1} />
        </FormItem>
      </Row>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          저장
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormComponent;
