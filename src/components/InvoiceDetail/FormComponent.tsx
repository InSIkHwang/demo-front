import { Form, Input } from "antd";
import styled from "styled-components";
import { InvoiceDocument, Order } from "../../types/types";
import { useEffect } from "react";

const InquiryItemForm = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

const FormRow = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

interface InquiryFormProps {
  formValues: InvoiceDocument;
}

const FormComponent = ({ formValues }: InquiryFormProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(formValues);
  }, [formValues, form]);

  return (
    <>
      <Form layout="vertical" form={form}>
        <FormRow>
          <InquiryItemForm
            label="문서번호(Document No.)"
            name="documentNumber"
            style={{ flex: 2 }}
          >
            <Input disabled />
          </InquiryItemForm>
          <InquiryItemForm style={{ flex: 2 }} label="Ref No." name="refNumber">
            <Input value={formValues.refNumber} disabled />
          </InquiryItemForm>
          <InquiryItemForm
            style={{ flex: 1 }}
            label="담당자(Doc Manager)"
            name="docManager"
          >
            <Input value={formValues.docManager} disabled />
          </InquiryItemForm>
          <InquiryItemForm
            label="작성일자(Register Date)"
            name="registerDate"
            style={{ flex: 1 }}
          >
            <Input value={formValues.registerDate} disabled />
          </InquiryItemForm>
          <InquiryItemForm
            label="화폐(Currency)"
            name="currencyType"
            style={{ flex: 1 }}
          >
            <Input value={formValues.currencyType} disabled />
          </InquiryItemForm>
          <InquiryItemForm
            label="환율(Exchange Rate)"
            name="currency"
            style={{ flex: 1 }}
          >
            <Input
              type="number"
              value={formValues.currency || 0} // currency의 초기값이 없는 경우 빈 문자열
              disabled
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <InquiryItemForm
            label="매출처(Customer)"
            name="companyName"
            style={{ flex: 2 }}
          >
            <Input value={formValues.companyName} disabled />
          </InquiryItemForm>
          <InquiryItemForm
            label="선명(Vessel Name)"
            name="vesselName"
            style={{ flex: 1 }}
          >
            <Input value={formValues.vesselName} disabled />
          </InquiryItemForm>
          <InquiryItemForm label="IMO No." name="imoNo" style={{ flex: 0.5 }}>
            <Input value={formValues.imoNo} disabled />
          </InquiryItemForm>
          <InquiryItemForm
            label="비고(Remark)"
            name="docRemark"
            style={{ flex: 2 }}
          >
            <Input value={formValues.docRemark} disabled />
          </InquiryItemForm>
        </FormRow>
      </Form>
    </>
  );
};

export default FormComponent;
