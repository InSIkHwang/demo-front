import React from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  AutoComplete,
  Tag,
} from "antd";
import styled from "styled-components";
import moment from "moment";
const { Option } = Select;

const InquiryItemForm = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

const FormRow = styled.div`
  display: flex;
`;

interface FormValues {
  registerDate: any;
  shippingDate: any;
  customer: string;
  vesselName: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  remark: string;
  supplierName: string;
}

interface InquiryFormProps {
  formValues: FormValues;
  autoCompleteOptions: { value: string }[];
  vesselNameList: string[];
  supplierOptions: { value: string; id: number }[];
  selectedSuppliers: { id: number; name: string }[];
  handleFormChange: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void;
  handleInputChange: (
    index: number,
    field: string,
    value: string | number
  ) => void;
  handleItemCodeChange: (index: number, value: string) => void;
  handleSupplierSearch: (value: string) => void;
  handleSupplierSelect: (
    value: string,
    option: { value: string; id: number }
  ) => void;
  handleTagClose: (id: number) => void;
  addItem: () => void;
}

const InquiryForm: React.FC<InquiryFormProps> = ({
  formValues,
  autoCompleteOptions,
  vesselNameList,
  supplierOptions,
  selectedSuppliers,
  handleFormChange,
  handleInputChange,
  handleItemCodeChange,
  handleSupplierSearch,
  handleSupplierSelect,
  handleTagClose,
  addItem,
}) => {
  return (
    <Form layout="vertical" initialValues={formValues}>
      <FormRow>
        <InquiryItemForm
          label="작성일자"
          name="registerDate"
          rules={[{ required: true, message: "Please select register date" }]}
        >
          <DatePicker
            value={formValues.registerDate}
            onChange={(date) => handleFormChange("registerDate", date!)}
          />
        </InquiryItemForm>
        <InquiryItemForm
          label="선적일자"
          name="shippingDate"
          rules={[{ required: true, message: "Please select shipping date" }]}
        >
          <DatePicker
            value={formValues.shippingDate}
            onChange={(date) => handleFormChange("shippingDate", date!)}
          />
        </InquiryItemForm>
        <InquiryItemForm
          label="매출처"
          name="customer"
          rules={[{ required: true, message: "Please enter customer" }]}
        >
          <AutoComplete
            value={formValues.customer}
            onChange={(value) => handleFormChange("customer", value)}
            options={autoCompleteOptions}
            style={{ width: "100%" }}
            filterOption={(inputValue, option) =>
              option!.value.toLowerCase().includes(inputValue.toLowerCase())
            }
          >
            <Input />
          </AutoComplete>
        </InquiryItemForm>
        <InquiryItemForm
          label="선박명"
          name="vesselName"
          rules={[{ required: true, message: "Please enter vessel name" }]}
        >
          <AutoComplete
            value={formValues.vesselName}
            onChange={(value) => handleFormChange("vesselName", value)}
            options={vesselNameList.map((name) => ({ value: name }))}
            style={{ width: "100%" }}
            filterOption={(inputValue, option) =>
              option!.value.toLowerCase().includes(inputValue.toLowerCase())
            }
          >
            <Input />
          </AutoComplete>
        </InquiryItemForm>
        <InquiryItemForm
          style={{ flex: "40%" }}
          label="Ref No."
          name="refNumber"
          rules={[{ required: true, message: "Please enter ref number" }]}
        >
          <Input
            value={formValues.refNumber}
            onChange={(e) => handleFormChange("refNumber", e.target.value)}
          />
        </InquiryItemForm>
      </FormRow>
      <FormRow>
        <InquiryItemForm
          label="화폐"
          name="currencyType"
          rules={[{ required: true, message: "Please select currency type" }]}
        >
          <Select
            value={formValues.currencyType}
            onChange={(value) => handleFormChange("currencyType", value)}
          >
            {["USD", "EUR", "INR"].map((currency) => (
              <Option key={currency} value={currency}>
                {currency}
              </Option>
            ))}
          </Select>
        </InquiryItemForm>
        <InquiryItemForm
          label="환율"
          name="currency"
          rules={[
            {
              required: true,
              message: "Please enter currency exchange rate",
            },
          ]}
        >
          <Input
            type="number"
            value={formValues.currency}
            onChange={(e) =>
              handleFormChange("currency", parseFloat(e.target.value))
            }
          />
        </InquiryItemForm>
        <InquiryItemForm label="비고" name="remark" style={{ flex: "50%" }}>
          <Input
            value={formValues.remark}
            onChange={(e) => handleFormChange("remark", e.target.value)}
          />
        </InquiryItemForm>
      </FormRow>
      <FormRow>
        <InquiryItemForm label="의뢰처" name="supplierName">
          <AutoComplete
            value={formValues.supplierName}
            onChange={(value) => handleFormChange("supplierName", value)}
            onSearch={handleSupplierSearch}
            onSelect={handleSupplierSelect}
            options={supplierOptions}
            style={{ width: "50%" }}
            filterOption={(inputValue, option) =>
              option!.value.toLowerCase().includes(inputValue.toLowerCase())
            }
          >
            <Input />
          </AutoComplete>
          <div style={{ marginTop: 10 }}>
            {selectedSuppliers.map((supplier) => (
              <Tag
                key={supplier.id}
                closable
                onClose={() => handleTagClose(supplier.id)}
              >
                {supplier.name}
              </Tag>
            ))}
          </div>
        </InquiryItemForm>
      </FormRow>
      <Button type="primary" onClick={addItem} style={{ margin: "20px 0" }}>
        품목 추가
      </Button>
    </Form>
  );
};

export default InquiryForm;
