import React, { useState } from "react";
import styled from "styled-components";
import Form from "./Form";
import axios from "../../api/axios";

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
  z-index: 10;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 500px;
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
  width: 90px;
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

  //수정폼 데이터 입력 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  //데이터 수정 PUT API
  const editData = async () => {
    try {
      const endpoint =
        category === "customer"
          ? `/api/customers/${formData.id}`
          : `/api/suppliers/${formData.id}`;
      const response = await axios.put(endpoint, {
        code: formData.code,
        companyName: formData.companyName,
        phoneNumber: formData.phoneNumber,
        representative: formData.representative,
        email: formData.email,
        address: formData.address,
        communicationLanguage: formData.communicationLanguage,
      });
    } catch (error) {
      console.log(error);
    }
  };

  //데이터 삭제 DELETE API
  const deleteData = async () => {
    try {
      const endpoint =
        category === "customer"
          ? `/api/customers/${formData.id}`
          : `/api/suppliers/${formData.id}`;
      const response = await axios.delete(endpoint);
    } catch (error) {
      console.log(error);
    }
  };

  //수정 SUBMIT 비동기처리, PUT 처리 후 FETCH
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await editData();
    onUpdate();
    onClose();
  };

  //삭제 SUBMIT 비동기처리, DELETE 처리 후 FETCH
  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await deleteData();
      onUpdate();
      onClose();
    }
  };

  const readOnlyFields = {
    code: true, //read-only
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
            <DetailItem style={{ borderTop: "none" }}>
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
