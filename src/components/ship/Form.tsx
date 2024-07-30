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
    vesselName: string;
    vesselCompanyName: string;
    imoNumber: number;
    hullNumber: string;
    shipYard: string;
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
      <Label htmlFor="vesselName">선명:</Label>
      <Input
        id="vesselName"
        name="vesselName"
        value={formData.vesselName}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="vesselCompanyName">선박회사:</Label>
      <Input
        id="vesselCompanyName"
        name="vesselCompanyName"
        value={formData.vesselCompanyName}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="imoNumber">IMO No.:</Label>
      <Input
        id="imoNumber"
        name="imoNumber"
        value={formData.imoNumber}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="hullNumber">HULL No.:</Label>
      <Input
        id="hullNumber"
        name="hullNumber"
        value={formData.hullNumber}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="shipYard">SHIPYARD:</Label>
      <Input
        id="shipYard"
        name="shipYard"
        value={formData.shipYard}
        onChange={onChange}
      />
    </FormGroup>
    <SubmitButton type="submit">{isEditing ? "수정" : "등록"}</SubmitButton>
  </form>
);

export default Form;
