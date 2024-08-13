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
  background-color: ${(props) => props.theme.blue};
  color: white;
  border-radius: 4px;
  cursor: pointer;
  display: block;
  margin-left: auto;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${(props) => props.theme.darkBlue};
  }
`;

interface FormProps {
  formData: {
    id: number;
    code: string;
    companyName: string;
    phoneNumber: string;
    representative: string;
    email: string;
    address: string;
    communicationLanguage: string;
    modifiedAt: string;
    headerMessage: string;
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
      <Label htmlFor="companyName">상호명:</Label>
      <Input
        id="companyName"
        name="companyName"
        value={formData.companyName}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="phoneNumber">연락처:</Label>
      <Input
        id="phoneNumber"
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="representative">담당자:</Label>
      <Input
        id="representative"
        name="representative"
        value={formData.representative}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="email">이메일:</Label>
      <Input
        id="email"
        name="email"
        value={formData.email}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="address">주소:</Label>
      <Input
        id="address"
        name="address"
        value={formData.address}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="communicationLanguage">사용 언어:</Label>
      <Input
        id="communicationLanguage"
        name="communicationLanguage"
        value={formData.communicationLanguage}
        onChange={onChange}
      />
    </FormGroup>{" "}
    <FormGroup>
      <Label htmlFor="headerMessage">머릿글</Label>
      <Input
        id="headerMessage"
        name="headerMessage"
        value={formData.headerMessage}
        onChange={onChange}
        placeholder="귀사의 무궁한 발전을 기원합니다."
      />
    </FormGroup>
    <SubmitButton type="submit">{isEditing ? "수정" : "등록"}</SubmitButton>
  </form>
);

export default Form;
