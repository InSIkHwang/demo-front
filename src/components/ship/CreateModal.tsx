import axios from "axios";
import React, { useState, useEffect } from "react";
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
  z-index: 10;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  position: relative;
  overflow-y: scroll;
  height: 600px;
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

const ErrorMessage = styled.div`
  color: red;
  font-size: 12px;
  margin-top: 5px;
`;

const SubmitButton = styled.button<{ disabled: boolean }>`
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  background-color: #1976d2;
  color: white;
  border-radius: 4px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  display: block;
  margin-left: auto;
  transition: background-color 0.3s, opacity 0.3s;

  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? "#1976d2" : "#1560ac")};
  }
`;

interface ModalProps {
  category: string;
  onClose: () => void;
}

const CreateModal = ({ category, onClose }: ModalProps) => {
  const todayDate = new Date().toLocaleDateString("en-CA");

  const [formData, setFormData] = useState({
    code: "",
    shipname: "",
    company: "",
    callsign: "",
    imonumber: "",
    hullnumber: "",
    shipyard: "",
    shiptype: "",
    remark: "",
    enginetype1: "",
    enginetype2: "",
  });

  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const debounce = <T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ) => {
    let timer: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  //중복 코드 체크 로직
  const checkCodeUnique = debounce(async () => {
    if (formData.code.trim() === "") {
      setIsCodeUnique(true);
      return;
    }
    setIsCheckingCode(true);
    try {
      const response = await axios.get(
        `/api/vessels/check-code/${formData.code}`
      );

      setIsCodeUnique(!response.data); // 응답을 반전시켜서 코드 유무 판단
    } catch (error) {
      console.error("Error checking code unique:", error);
      setIsCodeUnique(true); // 오류 발생 시 기본적으로 유효한 코드로 처리
    } finally {
      setIsCheckingCode(false);
    }
  }, 200);

  useEffect(() => {
    checkCodeUnique();
  }, [formData.code]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeUnique) return; // 코드가 유효하지 않으면 제출하지 않음

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
        <ModalTitle>
          {category === "customer" ? "신규 매출처 등록" : "신규 매입처 등록"}
        </ModalTitle>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="code">코드:</Label>
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="BAS"
              required
            />
            {!isCodeUnique && (
              <ErrorMessage>이미 등록된 코드입니다.</ErrorMessage>
            )}
          </FormGroup>
          <FormGroup>
            <Label htmlFor="shipname">선명:</Label>
            <Input
              id="shipname"
              name="shipname"
              value={formData.shipname}
              onChange={handleChange}
              placeholder="BAS VESSEL1"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="company">선박회사:</Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="BAS KOREA"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="callsign">호출부호:</Label>
            <Input
              id="callsign"
              name="callsign"
              value={formData.callsign}
              onChange={handleChange}
              placeholder="VESSEL1"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="imonumber">IMO No.:</Label>
            <Input
              id="imonumber"
              name="imonumber"
              value={formData.imonumber}
              onChange={handleChange}
              placeholder="1234567"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="hullnumber">HULL No.:</Label>
            <Input
              id="hullnumber"
              name="hullnumber"
              value={formData.hullnumber}
              onChange={handleChange}
              placeholder="B123"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="shipyard">SHIPYARD:</Label>
            <Input
              id="shipyard"
              name="shipyard"
              value={formData.shipyard}
              onChange={handleChange}
              placeholder="BAS KOREA (BUSAN)"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="shiptype">선박구분:</Label>
            <Input
              id="shiptype"
              name="shiptype"
              value={formData.shiptype}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="remark">비고:</Label>
            <Input
              id="remark"
              name="remark"
              value={formData.remark}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="enginetype1">엔진타입1:</Label>
            <Input
              id="enginetype1"
              name="enginetype1"
              value={formData.enginetype1}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="enginetype2">엔진타입2:</Label>
            <Input
              id="enginetype2"
              name="enginetype2"
              value={formData.enginetype2}
              onChange={handleChange}
            />
          </FormGroup>
          <SubmitButton
            type="submit"
            disabled={!isCodeUnique || isCheckingCode}
          >
            등록
          </SubmitButton>
        </form>
      </ModalContent>
    </ModalBackdrop>
  );
};

export default CreateModal;
