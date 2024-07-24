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

interface CustomerFormProps {
  formData: {
    code: string;
    name: string;
    contact: string;
    manager: string;
    email: string;
    address: string;
    date: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  readOnlyFields: { [key: string]: boolean };
  isEditing: boolean;
}

const CustomerForm = ({
  formData,
  onChange,
  onSubmit,
  readOnlyFields,
  isEditing, // Use the new prop
}: CustomerFormProps) => (
  <form onSubmit={onSubmit}>
    <FormGroup>
      <Label htmlFor="code">코드</Label>
      <Input
        id="code"
        name="code"
        value={formData.code}
        onChange={onChange}
        readOnly={readOnlyFields.code}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="name">상호명</Label>
      <Input id="name" name="name" value={formData.name} onChange={onChange} />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="contact">연락처</Label>
      <Input
        id="contact"
        name="contact"
        value={formData.contact}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="manager">담당자</Label>
      <Input
        id="manager"
        name="manager"
        value={formData.manager}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="email">이메일</Label>
      <Input
        id="email"
        name="email"
        value={formData.email}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="address">주소</Label>
      <Input
        id="address"
        name="address"
        value={formData.address}
        onChange={onChange}
      />
    </FormGroup>
    <FormGroup>
      <Label htmlFor="date">등록일</Label>
      <Input id="date" name="date" value={formData.date} onChange={onChange} />
    </FormGroup>
    <SubmitButton type="submit">{isEditing ? "수정" : "등록"}</SubmitButton>
  </form>
);

export default CustomerForm;
