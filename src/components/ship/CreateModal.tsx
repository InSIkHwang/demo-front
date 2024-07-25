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

const FormContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;

const FormGroup = styled.div`
  flex: 1 1 calc(50% - 20px);
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

  const [isCodeUnique, setIsCodeUnique] = useState(false);
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
      setIsCodeUnique(false);
      return;
    }
    setIsCheckingCode(true);
    try {
      // API request 예시
      const response = await fetch(`/api/check-code?code=${formData.code}`);
      const result = await response.json();
      setIsCodeUnique(result.code); // 응답 T/F
    } catch (error) {
      console.error("Error checking code unique:", error);
      setIsCodeUnique(false);
    } finally {
      setIsCheckingCode(false);
    }
  }, 200);

  useEffect(() => {
    checkCodeUnique();
  }, [formData.code]);

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
        <ModalTitle>
          {category === "customer" ? "신규 매출처 등록" : "신규 매입처 등록"}
        </ModalTitle>
        <form onSubmit={handleSubmit}>
          <FormContainer>
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
              <Label htmlFor="shipname">선명</Label>
              <Input
                id="shipname"
                name="shipname"
                value={formData.shipname}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="company">선박회사</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="callsign">호출부호</Label>
              <Input
                id="callsign"
                name="callsign"
                value={formData.callsign}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="imonumber">IMO No.</Label>
              <Input
                id="imonumber"
                name="imonumber"
                value={formData.imonumber}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="hullnumber">HULL No.</Label>
              <Input
                id="hullnumber"
                name="hullnumber"
                value={formData.hullnumber}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="shipyard">SHIPYARD</Label>
              <Input
                id="shipyard"
                name="shipyard"
                value={formData.shipyard}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="shiptype">선박구분</Label>
              <Input
                id="shiptype"
                name="shiptype"
                value={formData.shiptype}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="remark">비고</Label>
              <Input
                id="remark"
                name="remark"
                value={formData.remark}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="enginetype1">엔진타입1</Label>
              <Input
                id="enginetype1"
                name="enginetype1"
                value={formData.enginetype1}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="enginetype2">엔진타입2</Label>
              <Input
                id="enginetype2"
                name="enginetype2"
                value={formData.enginetype2}
                onChange={handleChange}
              />
            </FormGroup>
          </FormContainer>
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
