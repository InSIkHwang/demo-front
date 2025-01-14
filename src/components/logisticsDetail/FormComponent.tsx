import { AutoComplete, Form, Input } from "antd";
import styled from "styled-components";
import { Logistics } from "../../types/types";
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
  formValues: Logistics;
  setFormValues: (values: Logistics) => void;
}

const PACKING_OPTIONS = [
  { value: " X  X CM  KG  CARTON" },
  { value: " X  X CM  KG  WOODEN" },
];

const FORWARDER_OPTIONS = [
  { value: "풀로그" },
  { value: "DHL" },
  { value: "KIMEX" },
  { value: "마린트랜스" },
  { value: "MNC" },
  { value: "DTS" },
];

const LOC_OPTIONS = [
  { value: "BAS" },
  { value: "해성" },
  { value: "해양" },
  { value: "KMS" },
];

const FormComponent = ({ formValues, setFormValues }: InquiryFormProps) => {
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
        <FormRow>
          <InquiryItemForm
            label="Packing Details"
            name="packingDetails"
            style={{ flex: 1 }}
          >
            <AutoComplete
              value={formValues.packingDetails}
              options={PACKING_OPTIONS}
              onChange={(value) =>
                setFormValues({ ...formValues, packingDetails: value })
              }
              placeholder="Enter packing details"
              style={{ width: "100%" }}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="Forwarder"
            name="forwarder"
            style={{ flex: 0.5 }}
          >
            <AutoComplete
              value={formValues.forwarder}
              options={FORWARDER_OPTIONS}
              onChange={(value) =>
                setFormValues({ ...formValues, forwarder: value })
              }
              placeholder="Enter forwarder"
              style={{ width: "100%" }}
            />
          </InquiryItemForm>
          <InquiryItemForm label="LOC" name="loc" style={{ flex: 0.5 }}>
            <AutoComplete
              value={formValues.loc}
              options={LOC_OPTIONS}
              onChange={(value) => setFormValues({ ...formValues, loc: value })}
              placeholder="Enter LOC"
              style={{ width: "100%" }}
            />
          </InquiryItemForm>
        </FormRow>
      </Form>
    </>
  );
};

export default FormComponent;
