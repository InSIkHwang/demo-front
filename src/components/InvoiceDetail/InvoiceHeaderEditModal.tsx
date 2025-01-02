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
import { InvoiceHeaderFormData, orderRemark } from "../../types/types";
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
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const StyledFormItem = styled(Form.Item)`
  flex: 2;
  .ant-form-item-label {
    width: 120px;
  }
`;

interface HeaderEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (header: InvoiceHeaderFormData, footer: orderRemark[]) => void;
  pdfHeader: InvoiceHeaderFormData;
  pdfFooter: orderRemark[];
  setPdfInvoiceHeader: (value: InvoiceHeaderFormData) => void;
  setPdfInvoiceFooter: (value: orderRemark[]) => void;
}

const REMARK_OPTIONS = [
  {
    label: "BUSAN BANK",
    value:
      "PLEASE KINDLY REFER TO THE FOLLOWING BANK'S DETAILS\n((ADDRESS)) 1084-3,GUPO2 DONG, BUKGU, BUSAN, KOREA\nBANK'S NAME: BUSAN BANK, (GUNAM BR.)\nACCOUT NO.: 154-2003-1445-07       SWIFT CODE: PUSBKR2P\nBENEFICIARY: BAS KOREA CO.",
  },
  {
    label: "KOOKMIN BANK",
    value:
      "PLEASE KINDLY REFER TO THE FOLLOWING BANK'S DETAILS\n((ADDRESS)) 25, CENTUM DONG-RO, HAEUNDAE-GU, BUSAN, 48059, KOREA.\nBANK'S NAME: KOOKMIN BANK\nACCOUNT NO.: 564768-11-018693       SWIFT CODE: CZNBKRSEXXX\nBENEFICIARY: BAS KOREA CO.,LTD",
  },
];

const InvoiceHeaderEditModal = ({
  open,
  onClose,
  onSave,
  pdfHeader,
  pdfFooter,
  setPdfInvoiceHeader,
  setPdfInvoiceFooter,
}: HeaderEditModalProps) => {
  const [headerChk, setHeaderChk] = useState<boolean>(true);
  const [footerChk, setFooterChk] = useState<boolean>(true);
  const [form] = Form.useForm<InvoiceHeaderFormData>();
  const [footerText, setFooterText] = useState<orderRemark[]>(
    Array.isArray(pdfFooter) && pdfFooter.length > 0
      ? pdfFooter.map((item) => item || [])
      : []
  );

  const INITIAL_HEADER_VALUES = {
    invoiceHeaderId: null,
    messrs: "",
    date: "",
    paymentTerms: "",
  };

  const handleAddFooterLine = () => {
    setFooterText([...footerText, { orderRemarkId: null, orderRemark: "" }]);
  };

  const handleRemoveFooterLine = (index: number) => {
    setFooterText(footerText.filter((_, i) => i !== index));
  };

  const handleFooterChange = (index: number, value: string) => {
    const newFooterText = [...footerText];
    newFooterText[index] = {
      orderRemarkId: footerText[index].orderRemarkId || null,
      orderRemark: value,
    };
    setFooterText(newFooterText);
  };

  useEffect(() => {
    if (!footerChk) {
      setFooterText([]);
    } else {
      setFooterText(pdfFooter);
    }
  }, [footerChk, pdfFooter]);

  useEffect(() => {
    form.setFieldsValue(pdfHeader);
  }, [form, pdfHeader]);

  const handleSave = () => {
    const headerData = headerChk
      ? {
          ...form.getFieldsValue(),
          invoiceHeaderId: pdfHeader.invoiceHeaderId || null,
          messrs: form.getFieldValue("messrs"),
          date: form.getFieldValue("date"),
          paymentTerms: form.getFieldValue("paymentTerms"),
        }
      : {
          invoiceHeaderId: pdfHeader.invoiceHeaderId || null,
          messrs: "",
          date: "",
          paymentTerms: "",
        };
    setPdfInvoiceHeader(headerData);
    setPdfInvoiceFooter(footerText);
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
        <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
          <FormRow>
            <div style={{ display: "flex", gap: "5px", flex: 2 }}>
              <StyledFormItem name="messrs" label="MESSRS">
                <Input.TextArea rows={8} />
              </StyledFormItem>
            </div>
          </FormRow>
          <FormRow>
            <StyledFormItem name="date" label="DATE">
              <AutoComplete
                value={form.getFieldValue("date")}
                onChange={(value) => form.setFieldsValue({ date: value })}
                style={{ width: "100%" }}
                placeholder={dayjs().format("DD MMM, YYYY").toUpperCase()}
              >
                <Input.TextArea />
              </AutoComplete>
            </StyledFormItem>
            <StyledFormItem name="paymentTerms" label="PAYMENT TERMS">
              <AutoComplete
                value={form.getFieldValue("paymentTerms")}
                onChange={(value) =>
                  form.setFieldsValue({ paymentTerms: value })
                }
                style={{ width: "100%" }}
                placeholder="DAYS"
                options={[{ value: "DAYS", label: "DAYS" }]}
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
        </div>
      </Form>
      <Divider variant="dashed" />
      <Checkbox
        style={{ fontSize: 20, marginBottom: 25 }}
        checked={footerChk}
        onChange={(e) => setFooterChk(e.target.checked)}
      >
        Remark
      </Checkbox>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {footerText.map((text, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              minHeight: "200px",
            }}
          >
            <div style={{ minWidth: "30px", marginTop: "8px" }}>
              {index + 1}.
            </div>
            <AutoComplete
              value={text.orderRemark}
              onChange={(value) => handleFooterChange(index, value)}
              options={REMARK_OPTIONS}
              style={{ flex: 1 }}
              dropdownStyle={{
                position: "fixed",
                top: "75%",
              }}
            >
              <Input.TextArea rows={8} disabled={!footerChk} />
            </AutoComplete>
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

export default InvoiceHeaderEditModal;
