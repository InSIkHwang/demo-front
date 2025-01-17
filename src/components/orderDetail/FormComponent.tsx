import { Form, Input, InputNumber, Select } from "antd";
import styled from "styled-components";
import { Order } from "../../types/types";
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
  formValues: Order;
  setFormValues: (values: Order) => void;
}

const FormComponent = ({ formValues, setFormValues }: InquiryFormProps) => {
  const [form] = Form.useForm();
  const { Option } = Select;

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
            <Input
              value={formValues.refNumber}
              onChange={(e) =>
                setFormValues({ ...formValues, refNumber: e.target.value })
              }
            />
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
            <Select
              value={formValues.currencyType}
              onChange={(value) => {
                let currency = 0;
                if (value === "USD") {
                  currency = 1050;
                } else if (value === "EUR") {
                  currency = 1150;
                } else if (value === "INR") {
                  currency = 14;
                }

                // 한 번의 setFormValues 호출로 두 값을 모두 업데이트
                setFormValues({
                  ...formValues,
                  currencyType: value,
                  currency: currency,
                });

                form.setFieldsValue({ currency: currency });
              }}
            >
              {["USD", "EUR", "INR"].map((currencyType) => (
                <Option key={currencyType} value={currencyType}>
                  {currencyType}
                </Option>
              ))}
            </Select>
          </InquiryItemForm>
          <InquiryItemForm
            label="환율(Exchange Rate)"
            name="currency"
            style={{ flex: 1 }}
          >
            <InputNumber
              type="number"
              value={formValues.currency || 0} // currency의 초기값이 없는 경우 빈 문자열
              onChange={(value) =>
                setFormValues({ ...formValues, currency: value || 0 })
              }
              min={0}
              style={{ width: "100%" }}
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
            label="Hull No."
            name="vesselHullNo"
            style={{ flex: 0.5 }}
          >
            <Input value={formValues.vesselHullNo} disabled />
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
