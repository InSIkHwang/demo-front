import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Input,
  Checkbox,
  Form,
  Divider,
  AutoComplete,
  Select,
  Space,
  message,
} from "antd";
import styled from "styled-components";
import { InvoiceHeaderDetail, InvoiceRemarkDetail } from "../../types/types";
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
  onSave: (header: InvoiceHeaderDetail, footer: InvoiceRemarkDetail[]) => void;
  pdfHeader: InvoiceHeaderDetail;
  pdfFooter: InvoiceRemarkDetail[];
  setPdfInvoiceHeader: (value: InvoiceHeaderDetail) => void;
  setPdfInvoiceFooter: (value: InvoiceRemarkDetail[]) => void;
}

const BANK_OPTIONS = [
  {
    label: "KOOKMIN BANK",
    businessType: "Corporation",
    currency: ["USD", "CNY"],
    value:
      "PLEASE KINDLY REFER TO THE FOLLOWING BANK'S DETAILS\n((ADDRESS)) 25, CENTUM DONG-RO, HAEUNDAE-GU, BUSAN, 48059, KOREA.\nBANK'S NAME: KOOKMIN BANK\nACCOUNT NO.: 564768-11-018693       SWIFT CODE: CZNBKRSEXXX\nBENEFICIARY: BAS KOREA CO.,LTD",
  },
  {
    label: "KOOKMIN BANK",
    businessType: "Corporation",
    currency: ["AED"],
    value:
      "PLEASE KINDLY REFER TO THE FOLLOWING BANK'S DETAILS\n((ADDRESS)) 25, CENTUM DONG-RO, HAEUNDAE-GU, BUSAN, 48059, KOREA.\nBANK'S NAME: KOOKMIN BANK\nACCOUNT NO.: 564768-11-018693       SWIFT CODE: CZNBKRSEXXX\nBENEFICIARY: BAS KOREA CO.,LTD",
    intermediaryBank:
      "\n\n**intermediary bank details\nSWIFT CODE: ADCBAEAAXXX\nBank name : ABU DHABI COMMERCIAL BANK",
  },
  {
    label: "BUSAN BANK",
    businessType: "Corporation",
    currency: ["EUR"],
    value:
      "PLEASE KINDLY REFER TO THE FOLLOWING BANK'S DETAILS\n((ADDRESS)) 1084-3,GUPO2 DONG, BUKGU, BUSAN, KOREA.\nBANK'S NAME: BUSAN BANK, (GUNAM BR.)\nACCOUNT NO.: 154-2056-8804-07       SWIFT CODE: PUSBKR2P\nBENEFICIARY: BAS KOREA CO.,LTD",
    intermediaryBank:
      "\n\n**intermediary bank details\nSWIFT CODE : SCBLDEFXXXX\nBank name : STANDARD CHARTERED BANK AG",
  },
  {
    label: "KOOKMIN BANK",
    businessType: "Corporation",
    currency: ["KRW"],
    value:
      "PLEASE KINDLY REFER TO THE FOLLOWING BANK'S DETAILS\n((ADDRESS)) 25, CENTUM DONG-RO, HAEUNDAE-GU, BUSAN, 48059, KOREA.\nBANK'S NAME: KOOKMIN BANK\nACCOUNT NO.: 564701-01-588237       SWIFT CODE: CZNBKRSEXXX\nBENEFICIARY: BAS KOREA CO.,LTD",
  },
  {
    label: "BUSAN BANK",
    businessType: "Sole Proprietor",
    currency: ["USD"],
    value:
      "PLEASE KINDLY REFER TO THE FOLLOWING BANK'S DETAILS\n((ADDRESS)) 1084-3,GUPO2 DONG, BUKGU, BUSAN, KOREA\nBANK'S NAME: BUSAN BANK, (GUNAM BR.)\nACCOUT NO.: 154-2003-1445-07       SWIFT CODE: PUSBKR2P\nBENEFICIARY: BAS KOREA CO.",
  },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "30 DAYS", label: "30 DAYS" },
  { value: "60 DAYS", label: "60 DAYS" },
  { value: "90 DAYS", label: "90 DAYS" },
  { value: "IN ADVANCE", label: "IN ADVANCE" },
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
  const [form] = Form.useForm<InvoiceHeaderDetail>();
  const [footerText, setFooterText] = useState<InvoiceRemarkDetail[]>(
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
    setFooterText([...footerText, { salesRemarkId: null, salesRemark: "" }]);
  };

  const handleRemoveFooterLine = (index: number) => {
    setFooterText(footerText.filter((_, i) => i !== index));
  };

  const handleFooterChange = (index: number, value: string) => {
    const newFooterText = [...footerText];
    newFooterText[index] = {
      salesRemarkId: footerText[index].salesRemarkId || null,
      salesRemark: value,
    };
    setFooterText(newFooterText);
  };

  const calculateDueDate = () => {
    const date = form.getFieldValue("invoiceDate");
    const terms = form.getFieldValue("termsOfPayment");

    if (!date || !terms) return;

    try {
      // 날짜 형식 검증
      const datePattern = /^(\d{2}) ([A-Za-z]{3}), (\d{4})$/;
      if (!datePattern.test(date)) {
        message.error("Invalid date format. (Example: 01 JAN, 2024)");
        return;
      }

      // IN ADVANCE인 경우 DATE 그대로 사용
      if (terms === "IN ADVANCE") {
        form.setFieldsValue({ dueDate: date });
        return;
      }

      // PAYMENT TERMS 형식 검증 (숫자 + DAYS)
      const termsPattern = /^(\d+) DAYS$/;
      const termsMatch = terms.match(termsPattern);
      if (!termsMatch) {
        message.error("Invalid payment terms format. (Example: 30 DAYS)");
        return;
      }

      // 날짜 파싱 및 계산
      const [, day, month, year] = date.match(datePattern)!;
      const formattedDate = `${year}-${month}-${day}`;
      const parsedDate = dayjs(formattedDate);

      if (!parsedDate.isValid()) {
        message.error("Invalid date.");
        return;
      }

      const daysToAdd = parseInt(termsMatch[1]);
      const dueDate = parsedDate
        .add(daysToAdd, "day")
        .format("DD MMM, YYYY")
        .toUpperCase();

      form.setFieldsValue({ dueDate });
    } catch (error) {
      console.error("날짜 계산 오류:", error);
      message.error("Error occurred while calculating date.");
    }
  };

  const handleSave = () => {
    const headerData = headerChk
      ? {
          ...form.getFieldsValue(),
          messrs: form.getFieldValue("messrs"),
          invoiceDate: form.getFieldValue("invoiceDate"),
          termsOfPayment: form.getFieldValue("termsOfPayment"),
          dueDate: form.getFieldValue("dueDate"),
        }
      : {
          messrs: "",
          invoiceDate: "",
          termsOfPayment: "",
          dueDate: "",
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
        style={{ fontSize: 18, marginBottom: 25 }}
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
            <StyledFormItem name="invoiceDate" label="DATE">
              <AutoComplete
                value={form.getFieldValue("invoiceDate")}
                onChange={(value) =>
                  form.setFieldsValue({ invoiceDate: value })
                }
                onBlur={calculateDueDate}
                style={{ width: "100%" }}
                placeholder={dayjs().format("DD MMM, YYYY").toUpperCase()}
                options={[
                  {
                    value: dayjs().format("DD MMM, YYYY").toUpperCase(),
                    label: dayjs().format("DD MMM, YYYY").toUpperCase(),
                  },
                ]}
              >
                <Input />
              </AutoComplete>
            </StyledFormItem>
            <StyledFormItem name="termsOfPayment" label="PAYMENT TERMS">
              <AutoComplete
                value={form.getFieldValue("termsOfPayment")}
                onChange={(value) =>
                  form.setFieldsValue({ termsOfPayment: value })
                }
                onBlur={calculateDueDate}
                style={{ width: "100%" }}
                placeholder="DAYS"
                options={PAYMENT_TERMS_OPTIONS}
              >
                <Input />
              </AutoComplete>
            </StyledFormItem>
            <StyledFormItem name="dueDate" label="DUE DATE">
              <Input
                value={form.getFieldValue("dueDate")}
                onChange={(e) =>
                  form.setFieldsValue({ dueDate: e.target.value })
                }
              ></Input>
            </StyledFormItem>
          </FormRow>
        </div>
      </Form>
      <Divider variant="dashed" />
      <Checkbox
        style={{ fontSize: 18 }}
        checked={footerChk}
        onChange={(e) => setFooterChk(e.target.checked)}
      >
        Remark
      </Checkbox>
      <div
        style={{
          marginBottom: 25,
          display: "flex",
          flexDirection: "row",
          justifyContent: "right",
          width: "100%",
        }}
      >
        <div style={{ fontSize: 16, marginRight: 10 }}>Add Bank: </div>
        <Select
          placeholder="Select Bank"
          style={{ width: "40%" }}
          onChange={(value) => {
            const selectedBank = BANK_OPTIONS.find(
              (bank) =>
                bank.label === value.split(" - ")[0] &&
                bank.businessType === value.split(" - ")[1] &&
                bank.currency.includes(value.split(" - ")[2])
            );
            if (selectedBank) {
              const newRemark = {
                salesRemarkId: null,
                salesRemark:
                  selectedBank.value +
                  (selectedBank.intermediaryBank
                    ? selectedBank.intermediaryBank
                    : ""),
              };
              setFooterText([...footerText, newRemark]);
            }
          }}
        >
          {BANK_OPTIONS.map((bank, index) =>
            bank.currency.map((curr) => (
              <Select.Option
                key={`${bank.label}-${bank.businessType}-${curr}-${index}`}
                value={`${bank.label} - ${bank.businessType} - ${curr}`}
              >
                {`${bank.label} - ${bank.businessType} - ${curr}`}
              </Select.Option>
            ))
          )}
        </Select>
      </div>
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
            <Input.TextArea
              value={text.salesRemark}
              onChange={(e) => handleFooterChange(index, e.target.value)}
              rows={8}
              disabled={!footerChk}
            />
            <Button
              type="text"
              danger
              onClick={() => handleRemoveFooterLine(index)}
              disabled={!footerChk}
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
