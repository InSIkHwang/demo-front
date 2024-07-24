import React, { useState } from "react";
import styled from "styled-components";
import CustomerForm from "./CustomerForm";

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

const DetailItem = styled.div`
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
`;

const BtnWrap = styled.div`
  display: flex;
  margin-top: 25px;
  justify-content: space-around;
`;

const UpdateButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  background-color: #1976d2;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  display: block;
  transition: background-color 0.3s;

  &:hover {
    background-color: #1560ac;
  }
`;

const DeleteButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  background-color: #d62626;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  display: block;
  transition: background-color 0.3s;

  &:hover {
    background-color: #bb2121;
  }
`;

interface Customer {
  code: string;
  name: string;
  contact: string;
  manager: string;
  email: string;
  address: string;
  date: string;
}

interface ModalProps {
  customer: Customer;
  onClose: () => void;
}

const CustomerDetailModal = ({ customer, onClose }: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(customer);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updated Data:", formData);
    onClose();
  };

  const readOnlyFields = {
    code: true, // Code field is read-only
    name: !isEditing,
    contact: !isEditing,
    manager: !isEditing,
    email: !isEditing,
    address: !isEditing,
    date: !isEditing,
  };

  return (
    <ModalBackdrop onClick={handleBackdropClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalTitle>매출처 상세 정보</ModalTitle>
        {isEditing ? (
          <CustomerForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            readOnlyFields={readOnlyFields}
            isEditing={isEditing}
          />
        ) : (
          <>
            <DetailItem>
              <span>코드:</span>
              <span>{formData.code}</span>
            </DetailItem>
            <DetailItem>
              <span>상호명:</span>
              <span>{formData.name}</span>
            </DetailItem>
            <DetailItem>
              <span>연락처:</span>
              <span>{formData.contact}</span>
            </DetailItem>
            <DetailItem>
              <span>담당자:</span>
              <span>{formData.manager}</span>
            </DetailItem>
            <DetailItem>
              <span>이메일:</span>
              <span>{formData.email}</span>
            </DetailItem>
            <DetailItem>
              <span>주소:</span>
              <span>{formData.address}</span>
            </DetailItem>
            <DetailItem>
              <span>등록일:</span>
              <span>{formData.date}</span>
            </DetailItem>
            <BtnWrap>
              <UpdateButton type="button" onClick={() => setIsEditing(true)}>
                수정
              </UpdateButton>
              <DeleteButton type="button">삭제</DeleteButton>
            </BtnWrap>
          </>
        )}
      </ModalContent>
    </ModalBackdrop>
  );
};

export default CustomerDetailModal;
