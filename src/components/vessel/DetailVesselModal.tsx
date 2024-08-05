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
  overflow-y: auto;
  max-height: 600px;
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

interface Vessel {
  id: number;
  code: string;
  vesselName: string;
  vesselCompanyName: string;
  imoNumber: number;
  hullNumber: string;
  shipYard: string;
  customer: {
    id: number;
    newCustomerId: string;
    code: string;
    companyName: string;
    newCustomerName: string;
  };
}

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
      console.log(formData);
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
