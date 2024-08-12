import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import Form from "./Form";
import axios from "../../api/axios";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

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
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #ffffff;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
  color: #333;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  border: none;
  background: transparent;
  font-size: 28px;
  color: #333;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #e74c3c;
  }
`;

const DetailItem = styled.div`
  padding: 15px 0;
  display: flex;
  border-bottom: 1px solid #eee;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
`;

const PropName = styled.span`
  font-weight: 600;
  width: 150px;
  color: #555;
`;

const PropValue = styled.span`
  color: #333;
  flex: 1;
  word-break: break-word;
`;

const BtnWrap = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const UpdateButton = styled.button`
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  background-color: #1677ff;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  margin-right: 10px;
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #1976d2;
    transform: scale(1.05);
  }
`;

const DeleteButton = styled.button`
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  background-color: #e74c3c;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #c0392b;
    transform: scale(1.05);
  }
`;

interface Company {
  id: number;
  code: string;
  companyName: string;
  phoneNumber: string;
  representative: string;
  email: string;
  address: string;
  communicationLanguage: string;
  modifiedAt: string;
}

interface ModalProps {
  category: string;
  company: Company;
  onClose: () => void;
  onUpdate: () => void;
}

const DetailCompanyModal = ({
  category,
  company,
  onClose,
  onUpdate,
}: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(company);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 수정폼 데이터 입력 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 데이터 수정 PUT API
  const editData = async () => {
    try {
      const endpoint =
        category === "customer"
          ? `/api/customers/${formData.id}`
          : `/api/suppliers/${formData.id}`;
      await axios.put(endpoint, formData);
    } catch (error) {
      console.log(error);
    }
  };

  // 데이터 삭제 DELETE API
  const deleteData = async () => {
    try {
      const endpoint =
        category === "customer"
          ? `/api/customers/${formData.id}`
          : `/api/suppliers/${formData.id}`;
      await axios.delete(endpoint);
    } catch (error) {
      console.log(error);
    }
  };

  // 수정 SUBMIT 비동기 처리, PUT 처리 후 FETCH
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await editData();
    onUpdate();
    onClose();
  };

  // 삭제 SUBMIT 비동기 처리, DELETE 처리 후 FETCH
  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await deleteData();
      onUpdate();
      onClose();
    }
  };

  const readOnlyFields = {
    code: true, // read-only
    companyName: !isEditing,
    phoneNumber: !isEditing,
    representative: !isEditing,
    email: !isEditing,
    address: !isEditing,
    communicationLanguage: !isEditing,
  };

  return (
    <ModalBackdrop onClick={handleBackdropClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalTitle>
          {category === "customer" ? "매출처 상세 정보" : "매입처 상세 정보"}
        </ModalTitle>
        {isEditing ? (
          <Form
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            readOnlyFields={readOnlyFields}
            isEditing={isEditing}
          />
        ) : (
          <>
            <DetailItem>
              <PropName>코드</PropName>
              <PropValue>{formData.code}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>상호명</PropName>
              <PropValue>{formData.companyName}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>연락처</PropName>
              <PropValue>{formData.phoneNumber}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>담당자</PropName>
              <PropValue>{formData.representative}</PropValue>
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
              <PropName>사용 언어</PropName>
              <PropValue>{formData.communicationLanguage}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>수정된 날짜</PropName>
              <PropValue>{formData.modifiedAt}</PropValue>
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

export default DetailCompanyModal;
