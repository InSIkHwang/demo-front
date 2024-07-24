import React, { useState } from "react";
import styled from "styled-components";

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  position: relative;
`;

const ModalTitle = styled.div`
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  padding: 15px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: transparent;
  font-size: 32px;
  cursor: pointer;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
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

interface ModalProps {
  onClose: () => void;
}

const CustomerCreateModal = ({ onClose }: ModalProps) => {
  const todayDate = new Date().toISOString().split("T")[0]; //

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contact: "",
    manager: "",
    email: "",
    address: "",
    date: todayDate,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  //API 연동 후 처리 가능 현재는 콘솔 출력만 함.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalBackdrop onClick={handleBackdropClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalTitle>신규 매출처 등록</ModalTitle>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="code">코드</Label>
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="name">상호명</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="contact">연락처</Label>
            <Input
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="manager">담당자</Label>
            <Input
              id="manager"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="date">등록일</Label>
            <Input
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </FormGroup>
          <SubmitButton type="submit">등록</SubmitButton>
        </form>
      </ModalContent>
    </ModalBackdrop>
  );
};

export default CustomerCreateModal;
