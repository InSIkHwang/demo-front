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
import {
  CIPLHeaderFormData,
  HeaderFormData,
  OrderAckHeaderFormData,
  orderRemark,
} from "../../types/types";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

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
  flex-direction: column;
  flex: 1;
`;

const StyledFormItem = styled(Form.Item)`
  flex: 1;
`;

interface HeaderEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (header: CIPLHeaderFormData) => void;
  pdfCIPLHeader: CIPLHeaderFormData;
  setPdfCIPLHeader: (value: CIPLHeaderFormData) => void;
  loadedCIPLHeader: CIPLHeaderFormData;
}

const CIPLHeaderEditModal = ({
  open,
  onClose,
  onSave,
  pdfCIPLHeader,
  setPdfCIPLHeader,
  loadedCIPLHeader,
}: HeaderEditModalProps) => {
  const [form] = Form.useForm<CIPLHeaderFormData>();

  useEffect(() => {
    form.setFieldsValue(pdfCIPLHeader);
  }, [form, pdfCIPLHeader]);

  const handleSave = () => {
    setPdfCIPLHeader({
      ...form.getFieldsValue(),
      ciPlId: loadedCIPLHeader.ciPlId,
    });
    onSave({
      ...form.getFieldsValue(),
      ciPlId: loadedCIPLHeader.ciPlId,
    });
    onClose();
  };

  const handleReset = () => {
    form.resetFields();
    setPdfCIPLHeader(loadedCIPLHeader);
  };

  return (
    <StyledModal
      title="Header"
      width={1000}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="reset" onClick={handleReset}>
          Reset
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save
        </Button>,
      ]}
    >
      <Form form={form} initialValues={pdfCIPLHeader} layout="vertical">
        <div style={{ display: "flex", flexDirection: "row" }}>
          <FormRow>
            <StyledFormItem
              style={{ flex: 2 }}
              name="shipper"
              label="①Shipper/Exporter"
            >
              <Input.TextArea autoSize={{ minRows: 5 }} />
            </StyledFormItem>
            <StyledFormItem
              style={{ flex: 2.5 }}
              name="forAccountAndRiskOfMessers"
              label="②For Account & risk of Messers."
            >
              <Input.TextArea autoSize={{ minRows: 5 }} />
            </StyledFormItem>
            <StyledFormItem
              style={{ flex: 2.5 }}
              name="notifyParty"
              label="③Notify party"
            >
              <Input.TextArea autoSize={{ minRows: 5 }} />
            </StyledFormItem>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <StyledFormItem name="portOfLoading" label="④Port of loading">
                <Input.TextArea autoSize={{ minRows: 1 }} />
              </StyledFormItem>
              <StyledFormItem
                name="finalDestination"
                label="⑤Final destination"
              >
                <Input.TextArea autoSize={{ minRows: 1 }} />
              </StyledFormItem>
            </div>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <StyledFormItem name="vesselAndVoyage" label="⑥Vessel & Voyage">
                <Input.TextArea autoSize={{ minRows: 1 }} />
              </StyledFormItem>
              <StyledFormItem name="sailingOnOr" label="⑦Sailing on or">
                <Input.TextArea autoSize={{ minRows: 1 }} />
              </StyledFormItem>
            </div>
          </FormRow>
          <FormRow>
            <StyledFormItem
              name="noAndDateOfInvoice"
              label="⑧No & date of invoice"
            >
              <Input.TextArea autoSize={{ minRows: 1 }} />
            </StyledFormItem>
            <StyledFormItem name="noAndDateOfPo" label="⑨No.& date of L/C">
              <AutoComplete
                value={form.getFieldValue("noAndDateOfPo")}
                onChange={(value) =>
                  form.setFieldsValue({ noAndDateOfPo: value })
                }
                style={{ width: "100%" }}
                options={[{ value: loadedCIPLHeader.noAndDateOfPo }]}
              >
                <Input.TextArea autoSize={{ minRows: 1 }} />
              </AutoComplete>
            </StyledFormItem>
            <StyledFormItem name="lcIssuingBank" label="⑩L/C issuing bank">
              <Input.TextArea />
            </StyledFormItem>
            <StyledFormItem style={{ flex: 6 }} name="remark" label="⑪Remarks">
              <Input.TextArea autoSize={{ minRows: 10 }} />
            </StyledFormItem>
          </FormRow>
        </div>
      </Form>
    </StyledModal>
  );
};

export default CIPLHeaderEditModal;
