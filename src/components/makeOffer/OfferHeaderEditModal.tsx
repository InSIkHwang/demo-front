import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Input,
  Checkbox,
  Form,
  Select,
  Divider,
  AutoComplete,
} from "antd";
import styled from "styled-components";
import { HeaderFormData } from "../../types/types";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .ant-modal-header {
    border-bottom: 1px solid #e8e8e8;
  }

  .ant-modal-footer {
    border-top: 1px solid #e8e8e8;
    padding: 10px 0;
  }
`;

const FormRow = styled.div`
  display: flex;
  gap: 5px;
`;

const StyledFormItem = styled(Form.Item)`
  flex: 2;
  .ant-form-item-label {
    width: 180px;
  }
`;

interface HeaderEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (header: HeaderFormData, footer: string[]) => void;
}

const PART_CONDITION_OPTIONS = [
  "GENUINE",
  "OEM",
  "PRODUCT",
  "PRODUCT(RELIABLE)",
  "EQUIVALENT",
];

const TERMS_OF_PAYMENT_OPTIONS = [
  "T/T IN ADVANCE",
  "T/T BASE WITHIN ONE MONTH AFTER DELIVERY",
];

const OfferHeaderEditModal = ({
  open,
  onClose,
  onSave,
}: HeaderEditModalProps) => {
  const [headerChk, setHeaderChk] = useState<boolean>(false);
  const [footerChk, setFooterChk] = useState<boolean>(false);
  const [form] = Form.useForm<HeaderFormData>();
  const [footerText, setFooterText] = useState<string[]>([""]);
  const [shipmentTitle, setShipmentTitle] = useState<
    "PORT OF SHIPMENT" | "EX-WORK"
  >("PORT OF SHIPMENT");

  const defaultHeaderValues = {
    portOfShipment: shipmentTitle === "PORT OF SHIPMENT" ? "BUSAN, KOREA" : "",
    exWork: shipmentTitle === "EX-WORK" ? "JAPAN" : "",
    deliveryTime: "DAYS AFTER ORDER",
    termsOfPayment: "",
    offerValidity: "DAYS",
    partCondition: "",
  };

  const handleAddFooterLine = () => {
    setFooterText([...footerText, ""]);
  };

  const handleRemoveFooterLine = (index: number) => {
    setFooterText(footerText.filter((_, i) => i !== index));
  };

  const handleFooterChange = (index: number, value: string) => {
    const newFooterText = [...footerText];
    newFooterText[index] = value;
    setFooterText(newFooterText);
  };

  useEffect(() => {
    if (!footerChk) {
      setFooterText([]);
    } else {
      setFooterText([""]);
    }
  }, [footerChk]);

  const handleSave = () => {
    const headerData = headerChk
      ? form.getFieldsValue()
      : {
          portOfShipment: "",
          exWork: "",
          deliveryTime: "",
          termsOfPayment: "",
          offerValidity: "",
          partCondition: "",
        };
    onSave(headerData, footerText);
    onClose();
  };

  return (
    <StyledModal
      title="Header / Remark"
      width={1000}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          취소
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          저장
        </Button>,
      ]}
    >
      <Checkbox
        style={{ fontSize: 20, marginBottom: 25 }}
        checked={headerChk}
        onChange={(e) => {
          setHeaderChk(e.target.checked);
          if (!e.target.checked) {
            form.resetFields();
          } else {
            form.setFieldsValue(defaultHeaderValues);
          }
        }}
      >
        Header
      </Checkbox>
      <Form form={form} disabled={!headerChk}>
        <FormRow>
          <div style={{ display: "flex", gap: "5px", flex: 2 }}>
            <Select
              value={shipmentTitle}
              onChange={(value: "PORT OF SHIPMENT" | "EX-WORK") => {
                setShipmentTitle(value);
                if (value === "PORT OF SHIPMENT") {
                  form.setFieldsValue({
                    portOfShipment: "BUSAN, KOREA",
                    exWork: "",
                  });
                } else {
                  form.setFieldsValue({
                    portOfShipment: "",
                    exWork: "JAPAN",
                  });
                }
              }}
              style={{ width: 180 }}
            >
              <Select.Option value="PORT OF SHIPMENT">
                PORT OF SHIPMENT
              </Select.Option>
              <Select.Option value="EX-WORK">EX-WORK</Select.Option>
            </Select>
            <StyledFormItem
              name={
                shipmentTitle === "PORT OF SHIPMENT"
                  ? "portOfShipment"
                  : "exWork"
              }
              style={{ flex: 1 }}
            >
              <Input.TextArea
                placeholder={
                  shipmentTitle === "PORT OF SHIPMENT"
                    ? "BUSAN, KOREA"
                    : "JAPAN"
                }
              />
            </StyledFormItem>
          </div>
          <StyledFormItem name="deliveryTime" label="DELIVERY TIME">
            <Input.TextArea placeholder="DAYS AFTER ORDER" />
          </StyledFormItem>
        </FormRow>
        <FormRow>
          <StyledFormItem name="offerValidity" label="OFFER VALIDITY">
            <Input.TextArea placeholder="DAYS" />
          </StyledFormItem>
          <StyledFormItem name="partCondition" label="PART CONDITION">
            <AutoComplete
              value={form.getFieldValue("partCondition")}
              onChange={(value) =>
                form.setFieldsValue({ partCondition: value })
              }
              style={{ width: "100%" }}
              options={PART_CONDITION_OPTIONS.map((option) => ({
                value: option,
                label: option,
              }))}
              placeholder="OEM"
              filterOption={(inputValue, option) => {
                const optionValue =
                  option?.value.toString().toLowerCase() || "";
                const input = inputValue.toLowerCase();
                return optionValue.startsWith(input);
              }}
            >
              <Input.TextArea />
            </AutoComplete>
          </StyledFormItem>
        </FormRow>
        <FormRow>
          <StyledFormItem name="termsOfPayment" label="TERMS OF PAYMENT">
            <AutoComplete
              value={form.getFieldValue("termsOfPayment")}
              onChange={(value) =>
                form.setFieldsValue({ termsOfPayment: value })
              }
              style={{ width: "100%" }}
              options={TERMS_OF_PAYMENT_OPTIONS.map((option) => ({
                value: option,
                label: option,
              }))}
              placeholder="T/T BASE WITHIN ONE MONTH AFTER DELIVERY"
              filterOption={(inputValue, option) => {
                const optionValue =
                  option?.value.toString().toLowerCase() || "";
                const input = inputValue.toLowerCase();
                return optionValue.startsWith(input);
              }}
            >
              <Input.TextArea />
            </AutoComplete>
          </StyledFormItem>
        </FormRow>
      </Form>
      <Divider variant="dashed" />
      <Checkbox
        style={{ fontSize: 20, marginBottom: 25 }}
        checked={footerChk}
        onChange={(e) => setFooterChk(e.target.checked)}
      >
        Remark
      </Checkbox>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {footerText.map((text, index) => (
          <div
            key={index}
            style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
          >
            <div style={{ minWidth: "30px", marginTop: "8px" }}>
              {index + 1}.
            </div>
            <Input.TextArea
              value={text}
              onChange={(e) => handleFooterChange(index, e.target.value)}
              autoSize={{ minRows: 1 }}
              disabled={!footerChk}
              style={{ flex: 1 }}
            />
            <Button
              type="text"
              danger
              onClick={() => handleRemoveFooterLine(index)}
              disabled={!footerChk || footerText.length === 1}
              icon={<DeleteOutlined />}
            />
          </div>
        ))}
        <Button
          type="dashed"
          onClick={handleAddFooterLine}
          disabled={!footerChk}
          icon={<PlusOutlined />}
          style={{ width: "200px", marginTop: "10px" }}
        >
          Add Remark
        </Button>
      </div>
    </StyledModal>
  );
};

export default OfferHeaderEditModal;
