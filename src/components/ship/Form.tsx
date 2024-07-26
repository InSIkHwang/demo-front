import React from "react";
import styled from "styled-components";

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
`;

const Input = styled.input<{ readOnly?: boolean }>`
  width: 100%;
  padding: 8px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  ${({ readOnly }) =>
    readOnly &&
    `
    background: #f9f9f9;
    cursor: not-allowed;
    pointer-events: none;
  `}
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  background-color: #1976d2;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  display: block;
  margin-left: auto;
  transition: background-color 0.3s;

  &:hover {
    background-color: #1560ac;
  }
`;

interface FormProps {
  formData: {
    code: string;
    shipname: string;
    company: string;
    callsign: string;
    imonumber: string;
    hullnumber: string;
    shipyard: string;
    shiptype: string;
    remark: string;
    enginetype1: string;
    enginetype2: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  readOnlyFields: { [key: string]: boolean };
  isEditing: boolean;
}

const Form = ({
  formData,
  onChange,
  onSubmit,
  readOnlyFields,
  isEditing, // Use the new prop
}: FormProps) => (
  <form onSubmit={onSubmit}>
    <FormGroup>
      <Label htmlFor="code">코드:</Label>
      <Input
        id="code"
        name="code"
        value={formData.code}
        onChange={onChange}
        readOnly={readOnlyFields.code}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="name">선명:</Label>
      <Input
        id="shipname"
        name="shipname"
        value={formData.shipname}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="company">선박회사:</Label>
      <Input
        id="company"
        name="company"
        value={formData.company}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="callsign">호출부호:</Label>
      <Input
        id="callsign"
        name="callsign"
        value={formData.callsign}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="imonumber">IMO No.:</Label>
      <Input
        id="imonumber"
        name="imonumber"
        value={formData.imonumber}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="hullnumber">HULL No.:</Label>
      <Input
        id="hullnumber"
        name="hullnumber"
        value={formData.hullnumber}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="shipyard">SHIPYARD:</Label>
      <Input
        id="shipyard"
        name="shipyard"
        value={formData.shipyard}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="shiptype">선박구분:</Label>
      <Input
        id="shiptype"
        name="shiptype"
        value={formData.shiptype}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="remark">비고:</Label>
      <Input
        id="remark"
        name="remark"
        value={formData.remark}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="enginetype1">엔진타입1:</Label>
      <Input
        id="enginetype1"
        name="enginetype1"
        value={formData.enginetype1}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="enginetype2">엔진타입2:</Label>
      <Input
        id="enginetype2"
        name="enginetype2"
        value={formData.enginetype2}
        onChange={onChange}
      />
    </FormGroup>
    <SubmitButton type="submit">{isEditing ? "수정" : "등록"}</SubmitButton>
  </form>
);

export default Form;
