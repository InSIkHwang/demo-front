import { Form, Input } from "antd";
import styled from "styled-components";
import { Logistics } from "../../types/types";

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

const FormComponent = ({ formValues, setFormValues }: InquiryFormProps) => {
  return (
    <>
      <Form layout="vertical" initialValues={formValues}>
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
            label="Forwarder"
            name="forwarder"
            style={{ flex: 0.5 }}
          >
            <Input
              value={formValues.forwarder}
              onChange={(e) =>
                setFormValues({ ...formValues, forwarder: e.target.value })
              }
            />
          </InquiryItemForm>
          <InquiryItemForm label="LOC" name="loc" style={{ flex: 0.5 }}>
            <Input
              value={formValues.loc}
              onChange={(e) =>
                setFormValues({ ...formValues, loc: e.target.value })
              }
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="Packing Details"
            name="packingDetails"
            style={{ flex: 1 }}
          >
            <Input
              value={formValues.packingDetails}
              onChange={(e) =>
                setFormValues({ ...formValues, packingDetails: e.target.value })
              }
            />
          </InquiryItemForm>
        </FormRow>
      </Form>
    </>
  );
};

export default FormComponent;
