import React, { useState } from "react";
import styled from "styled-components";
import Form from "./Form";

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
  width: 800px;
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

const DetailItemContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const DetailItem = styled.div`
  padding: 10px 0;
  margin: 5px;
  border-top: 1px solid #ccc;
  display: flex;
  flex: 1 1 calc(50% - 20px);
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
  code: string;
  shipname: string;
  company: string;
  callsign: string;
  imonumber: string;
  hullnumber: string;
  shipyard: string;
  shiptype: string;
  remark: string;
  enginetype1: string;
  enginetype2: string;
}

interface ModalProps {
  category: string;
  company: Company;
  onClose: () => void;
}

const DetailModal = ({ category, company, onClose }: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(company);

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
    shipname: !isEditing,
    company: !isEditing,
    callsign: !isEditing,
    imonumber: !isEditing,
    hullnumber: !isEditing,
    shipyard: !isEditing,
    shiptype: !isEditing,
    remark: !isEditing,
    enginetype1: !isEditing,
    enginetype2: !isEditing,
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
            <DetailItemContainer>
              <DetailItem>
                <PropName>코드</PropName>
                <PropValue>{formData.code}</PropValue>
              </DetailItem>
              <DetailItem>
                <PropName>선명</PropName>
                <PropValue>{formData.shipname}</PropValue>
              </DetailItem>
              <DetailItem>
                <PropName>선박회사</PropName>
                <PropValue>{formData.company}</PropValue>
              </DetailItem>
              <DetailItem>
                <PropName>호출부호</PropName>
                <PropValue>{formData.callsign}</PropValue>
              </DetailItem>
              <DetailItem>
                <PropName>IMO No.</PropName>
                <PropValue>{formData.imonumber}</PropValue>
              </DetailItem>
              <DetailItem>
                <PropName>HULL No.</PropName>
                <PropValue>{formData.hullnumber}</PropValue>
              </DetailItem>
              <DetailItem>
                <PropName>SHIPYARD</PropName>
                <PropValue>{formData.shipyard}</PropValue>
              </DetailItem>
              <DetailItem>
                <PropName>선박구분</PropName>
                <PropValue>{formData.shiptype}</PropValue>
              </DetailItem>
              <DetailItem>
                <PropName>비고</PropName>
                <PropValue>{formData.remark}</PropValue>
              </DetailItem>
              <DetailItem>
                <PropName>엔진타입1</PropName>
                <PropValue>{formData.enginetype1}</PropValue>
              </DetailItem>
              <DetailItem>
                <PropName>엔진타입2</PropName>
                <PropValue>{formData.enginetype2}</PropValue>
              </DetailItem>
            </DetailItemContainer>
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

export default DetailModal;
