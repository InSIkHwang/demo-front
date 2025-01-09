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
  onSave: (
    header: HeaderFormData,
    footer: { quotationRemarkId: number | null; quotationRemark: string }[]
  ) => void;
  pdfHeader: HeaderFormData;
  pdfFooter: {
    quotationRemarkId: number | null;
    quotationRemark: string;
  }[];
}

const PORT_OF_SHIPMENT_OPTIONS = [
  "BUSAN, KOREA",
  "GREECE",
  "CHINA",
  "JAPAN",
  "EUROPE",
  "SINGAPORE",
];

const PART_CONDITION_OPTIONS = [
  "GENUINE",
  "OEM",
  "KOREAN PRODUCT",
  "KOREAN PRODUCT(RELIABLE)",
  "CHINA PRODUCT",
  "CHINA PRODUCT(RELIABLE)",
  "EQUIVALENT",
];

const DELIVERY_TIME_OPTIONS = [
  "WORKING DAYS AFTER ORDER",
  "WORKING DAYS AFTER ORDER IN STOCK (Subject to prior sale)",
  "WORKING DAYS AFTER PAYMENT",
  "WORKING DAYS AFTER PAYMENT IN STOCK",
];

const TERMS_OF_PAYMENT_OPTIONS = [
  "T/T IN ADVANCE",
  "T/T BASE WITHIN ONE MONTH AFTER DELIVERY",
];

const INCOTERMS_OPTIONS = [
  { code: "EXW", name: "EX WORKS" },
  { code: "FOB", name: "FREE ON BOARD" },
  { code: "CIF", name: "COST, INSURANCE AND FREIGHT" },
  { code: "CFR", name: "COST AND FREIGHT" },
  { code: "DAP", name: "DELIVERED AT PLACE" },
  { code: "DDP", name: "DELIVERED DUTY PAID" },
  { code: "FCA", name: "FREE CARRIER" },
  { code: "FAS", name: "FREE ALONGSIDE SHIP" },
  { code: "CPT", name: "CARRIAGE PAID TO" },
  { code: "CIP", name: "CARRIAGE AND INSURANCE PAID TO" },
  { code: "DPU", name: "DELIVERED PLACE UNLOADED" },
];

const PACKING_OPTIONS = ["UNPACKED", "PACKED"];

const OfferHeaderEditModal = ({
  open,
  onClose,
  onSave,
  pdfHeader,
  pdfFooter,
}: HeaderEditModalProps) => {
  const [headerChk, setHeaderChk] = useState<boolean>(true);
  const [footerChk, setFooterChk] = useState<boolean>(pdfFooter.length > 0);
  const [form] = Form.useForm<HeaderFormData>();
  const [footerText, setFooterText] = useState<
    { quotationRemarkId: number | null; quotationRemark: string }[]
  >(
    Array.isArray(pdfFooter) && pdfFooter.length > 0
      ? pdfFooter.map((item) => item || [])
      : []
  );

  const INITIAL_HEADER_VALUES = {
    quotationHeaderId: null,
    portOfShipment: "BUSAN, KOREA",
    deliveryTime: "WORKING DAYS AFTER ORDER",
    termsOfPayment: "",
    incoterms: "EX WORKS",
    offerValidity: "30 DAYS",
    partCondition: "",
    packing: "UNPACKED",
  };

  // 푸터 추가 핸들러
  const handleAddFooterLine = () => {
    setFooterText([
      ...footerText,
      { quotationRemarkId: null, quotationRemark: "" },
    ]);
  };

  // 푸터 삭제 핸들러
  const handleRemoveFooterLine = (index: number) => {
    setFooterText(footerText.filter((_, i) => i !== index));
  };

  // 푸터 변경 핸들러
  const handleFooterChange = (index: number, value: string) => {
    const newFooterText = [...footerText];
    newFooterText[index] = {
      quotationRemarkId: footerText[index].quotationRemarkId || null,
      quotationRemark: value,
    };
    setFooterText(newFooterText);
  };

  // 푸터 체크 상태 업데이트
  useEffect(() => {
    if (pdfFooter.length > 0) {
      setFooterChk(true);
    } else {
      setFooterChk(false);
    }
  }, [pdfFooter]);

  // 푸터 체크 해제 시 초기화
  useEffect(() => {
    if (!footerChk) {
      setFooterText([]);
    } else {
      setFooterText(pdfFooter);
    }
  }, [footerChk, pdfFooter]);

  // 헤더 초기값 설정
  useEffect(() => {
    form.setFieldsValue(pdfHeader);
  }, [form, pdfHeader]);

  // 저장 핸들러
  const handleSave = () => {
    const headerData = headerChk
      ? {
          quotationHeaderId: pdfHeader.quotationHeaderId || null,
          portOfShipment: form.getFieldValue("portOfShipment"),
          deliveryTime: form.getFieldValue("deliveryTime"),
          termsOfPayment: form.getFieldValue("termsOfPayment"),
          incoterms: form.getFieldValue("incoterms"),
          offerValidity: form.getFieldValue("offerValidity"),
          partCondition: form.getFieldValue("partCondition"),
          packing: form.getFieldValue("packing"),
        }
      : {
          quotationHeaderId: pdfHeader.quotationHeaderId || null,
          portOfShipment: "",
          deliveryTime: "",
          termsOfPayment: "",
          incoterms: "",
          offerValidity: "",
          partCondition: "",
          packing: "",
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
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save
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
            //pdfHeader의 데이터가 모두 빈 배열일 경우 초기값으로 설정
            if (Object.values(pdfHeader).every((value) => value === "")) {
              form.setFieldsValue(INITIAL_HEADER_VALUES);
            } else {
              form.setFieldsValue(pdfHeader);
            }
          }
        }}
      >
        Header
      </Checkbox>
      <Form form={form} disabled={!headerChk} initialValues={pdfHeader}>
        <FormRow>
          <div style={{ display: "flex", gap: "5px", flex: 2 }}>
            <StyledFormItem name="portOfShipment" label="PORT OF SHIPMENT">
              <AutoComplete
                value={form.getFieldValue("portOfShipment")}
                onChange={(value) =>
                  form.setFieldsValue({ portOfShipment: value })
                }
                style={{ width: "100%" }}
                options={PORT_OF_SHIPMENT_OPTIONS.map((option) => ({
                  value: option,
                  label: option,
                }))}
                placeholder="BUSAN, KOREA"
              >
                <Input.TextArea />
              </AutoComplete>
            </StyledFormItem>
          </div>
          <StyledFormItem name="deliveryTime" label="DELIVERY TIME">
            <AutoComplete
              value={form.getFieldValue("deliveryTime")}
              onChange={(value) => form.setFieldsValue({ deliveryTime: value })}
              style={{ width: "100%" }}
              options={DELIVERY_TIME_OPTIONS.map((option) => ({
                value: option,
                label: option,
              }))}
              placeholder="WORKING DAYS AFTER ORDER"
            >
              <Input.TextArea />
            </AutoComplete>
          </StyledFormItem>
        </FormRow>
        <FormRow>
          <StyledFormItem name="offerValidity" label="OFFER VALIDITY">
            <Input.TextArea
              placeholder="DAYS"
              value={form.getFieldValue("offerValidity")}
              onChange={(e) =>
                form.setFieldsValue({ offerValidity: e.target.value })
              }
            />
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
          <StyledFormItem name="packing" label="PACKING">
            <AutoComplete
              value={form.getFieldValue("packing")}
              onChange={(value) => form.setFieldsValue({ packing: value })}
              style={{ width: "100%" }}
              options={PACKING_OPTIONS.map((option) => ({
                value: option,
                label: option,
              }))}
              placeholder="UNPACKED"
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
          <StyledFormItem name="incoterms" label="DELIVERY TERMS">
            <Select
              value={form.getFieldValue("incoterms")}
              onChange={(value) => form.setFieldsValue({ incoterms: value })}
              style={{ width: "100%" }}
              options={INCOTERMS_OPTIONS.map((option) => ({
                value: option.name,
                label: `[${option.code}] ${option.name}`,
              }))}
              placeholder="Select Incoterms"
              showSearch
              filterOption={(input, option) => {
                const optionValue = option?.label?.toLowerCase() || "";
                return optionValue.includes(input.toLowerCase());
              }}
            />
          </StyledFormItem>
        </FormRow>
        <FormRow>
          {" "}
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
              value={text.quotationRemark}
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
