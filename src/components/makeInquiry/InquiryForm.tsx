import React, { useState } from "react";
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
import CreateCompanyModal from "../company/CreateCompanyModal";
import CreateVesselModal from "../vessel/CreateVesselModal";
const { Option } = Select;

const InquiryItemForm = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

const FormRow = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

interface FormValues {
  docNumber: string;
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
  customerUnreg: boolean;
  vesselUnreg: boolean;
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
  customerUnreg,
  vesselUnreg,
}) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] =
    useState<boolean>(false);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState<boolean>(false);

  const openCustomerModal = () => setIsCustomerModalOpen(true);
  const closeCustomerModal = () => setIsCustomerModalOpen(false);
  const openVesselModal = () => setIsVesselModalOpen(true);
  const closeVesselModal = () => setIsVesselModalOpen(false);

  const customerValue = formValues.customer.trim();
  const vesselValue = formValues.vesselName.trim();
  let customerValidationStatus:
    | "success"
    | "error"
    | "warning"
    | "validating"
    | undefined;
  let customerhelpMessage: string | undefined;

  if (customerUnreg) {
    if (customerValue === "") {
      customerValidationStatus = "error";
      customerhelpMessage = "Please enter a customer";
    } else {
      customerValidationStatus = "error";
      customerhelpMessage = "신규 등록되지 않은 매출처입니다.";
    }
  }

  let vesselValidationStatus:
    | "success"
    | "error"
    | "warning"
    | "validating"
    | undefined;
  let vesselhelpMessage: string | undefined;

  if (vesselUnreg) {
    if (vesselValue === "") {
      vesselValidationStatus = "error";
      vesselhelpMessage = "Please enter a vessel";
    } else {
      vesselValidationStatus = "error";
      vesselhelpMessage = "신규 등록되지 않은 선박입니다.";
    }
  }

  return (
    <>
      <Form layout="vertical" initialValues={formValues}>
        <FormRow>
          <InquiryItemForm
            label="문서번호"
            name="docNumber"
            style={{ maxWidth: 200 }}
          >
            <Input
              value={formValues.docNumber}
              readOnly
              style={{ cursor: "default" }}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="작성일자"
            name="registerDate"
            rules={[{ required: true, message: "Please select register date" }]}
            style={{ maxWidth: 150 }}
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
            style={{ maxWidth: 150 }}
          >
            <DatePicker
              value={formValues.shippingDate}
              onChange={(date) => handleFormChange("shippingDate", date!)}
            />
          </InquiryItemForm>
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
        </FormRow>
        <FormRow>
          <InquiryItemForm
            label="매출처"
            name="customer"
            validateStatus={customerValidationStatus}
            help={customerhelpMessage}
            rules={[{ required: true, message: "Please enter customer" }]}
          >
            <Button
              type="primary"
              style={{ position: "absolute", top: "-35px", right: "0" }}
              onClick={openCustomerModal}
            >
              신규 등록
            </Button>
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
            validateStatus={vesselValidationStatus}
            help={vesselhelpMessage}
            rules={[{ required: true, message: "Please enter vessel name" }]}
          >
            <Button
              type="primary"
              style={{ position: "absolute", top: "-35px", right: "0" }}
              onClick={openVesselModal}
            >
              신규 등록
            </Button>
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
            style={{ flex: "20%" }}
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
          <InquiryItemForm label="비고" name="remark" style={{ flex: "50%" }}>
            <Input
              value={formValues.remark}
              onChange={(e) => handleFormChange("remark", e.target.value)}
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
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
        </FormRow>
        <Button type="primary" onClick={addItem} style={{ margin: "20px 0" }}>
          품목 추가
        </Button>
      </Form>{" "}
      {isCustomerModalOpen && (
        <CreateCompanyModal
          category={"customer"}
          onClose={closeCustomerModal}
          onUpdate={closeCustomerModal}
        />
      )}
      {isVesselModalOpen && (
        <CreateVesselModal
          onClose={closeVesselModal}
          onUpdate={closeVesselModal}
        />
      )}
    </>
  );
};

export default InquiryForm;
