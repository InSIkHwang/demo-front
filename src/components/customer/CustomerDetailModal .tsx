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
  padding: 10px 0;
  border-top: 1px solid #ccc;
  display: flex;
`;

const PropName = styled.span`
  font-weight: 700;
  text-align: center;
  width: 70px;
  border-right: 1px solid #ccc;
`;

const PropValue = styled.span`
  padding-left: 10px;
`;

const BtnWrap = styled.div`
  display: flex;
  margin-top: 30px;
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

  const handleDelete = () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      console.log("Deleted Data:", formData);
      onClose();
    }
  };

  const readOnlyFields = {
    code: true, //read-only
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
            <DetailItem style={{ borderTop: "none" }}>
              <PropName>코드</PropName>
              <PropValue>{formData.code}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>상호명</PropName>
              <PropValue>{formData.name}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>연락처</PropName>
              <PropValue>{formData.contact}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>담당자</PropName>
              <PropValue>{formData.manager}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>이메일</PropName>
              <PropValue>{formData.email}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>주소</PropName>
              <PropValue>{formData.address}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>등록일</PropName>
              <PropValue>{formData.date}</PropValue>
            </DetailItem>
            <BtnWrap>
              <UpdateButton type="button" onClick={() => setIsEditing(true)}>
                수정
              </UpdateButton>
              <DeleteButton type="button" onClick={handleDelete}>
                삭제
              </DeleteButton>
            </BtnWrap>
          </>
        )}
      </ModalContent>
    </ModalBackdrop>
  );
};

export default CustomerDetailModal;
