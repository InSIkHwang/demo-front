import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import Form from "./Form";
import axios from "../../api/axios";
import { Vessel } from "../../types/types";

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

interface ModalProps {
  vessel: Vessel;
  onClose: () => void;
  onUpdate: () => void;
}

const DetailVesselModal = ({ vessel, onClose, onUpdate }: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(vessel);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    companyName: string;
    id: number;
  } | null>(null);

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

  // 데이터 수정 PUT API
  const editData = async () => {
    try {
      await axios.put(`/api/vessels/${formData.id}`, {
        code: formData.code,
        vesselName: formData.vesselName,
        vesselCompanyName: formData.vesselCompanyName,
        imoNumber: formData.imoNumber,
        hullNumber: formData.hullNumber,
        shipYard: formData.shipYard,
        originCustomerId: formData.customer.id,
        newCustomerId: selectedCustomer?.id,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // 데이터 삭제 DELETE API
  const deleteData = async () => {
    try {
      await axios.delete(`/api/vessels/${formData.id}`);
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
    vesselName: !isEditing,
    vesselCompanyName: !isEditing,
    imoNumber: !isEditing,
    hullNumber: !isEditing,
    shipYard: !isEditing,
    customerCompanyName: true,
  };

  return (
    <ModalBackdrop onClick={handleBackdropClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalTitle>선박 상세 정보</ModalTitle>
        {isEditing ? (
          <Form
            formData={formData}
            setFormData={setFormData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            setSelectedCustomer={setSelectedCustomer}
            selectedCustomer={selectedCustomer}
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
              <PropName>선명</PropName>
              <PropValue>{formData.vesselName}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>선박회사</PropName>
              <PropValue>{formData.vesselCompanyName}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>IMO No.</PropName>
              <PropValue>{formData.imoNumber}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>HULL No.</PropName>
              <PropValue>{formData.hullNumber}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>SHIPYARD</PropName>
              <PropValue>{formData.shipYard}</PropValue>
            </DetailItem>
            <DetailItem>
              <PropName>매출처</PropName>
              <PropValue>{formData.customer?.companyName || "없음"}</PropValue>
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

export default DetailVesselModal;
