import axios from "../../api/axios";
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
  onUpdate: () => void;
}

const CreateModal = ({ category, onClose, onUpdate }: ModalProps) => {
  const todayDate = new Date().toLocaleDateString("en-CA");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contact: "",
    manager: "",
    email: "",
    language: "",
    address: "",
    date: todayDate,
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

  const checkCodeUnique = debounce(async () => {
    if (formData.code.trim() === "") {
      setIsCodeUnique(true);
      return;
    }
    setIsCheckingCode(true);
    try {
      const endpoint =
        category === "customer"
          ? `/api/customers/check-code/${formData.code}`
          : `/api/suppliers/check-code/${formData.code}`;

      const response = await axios.get(endpoint);
      setIsCodeUnique(!response.data); // 응답 T/F를 반전시킴
    } catch (error) {
      console.error("Error checking code unique:", error);
      setIsCodeUnique(true); // 오류가 발생하면 기본적으로 유효하다고 처리
    } finally {
      setIsCheckingCode(false);
    }
  }, 200);

  useEffect(() => {
    checkCodeUnique();
  }, [formData.code]);

  const postCreate = async () => {
    try {
      const endpoint =
        category === "customer" ? "/api/customers" : "/api/suppliers";
      const response = await axios.post(endpoint, {
        code: formData.code,
        companyName: formData.name,
        phoneNumber: formData.contact,
        representative: formData.manager,
        email: formData.email,
        address: formData.address,
        communicationLanguage: formData.language,
      });
      console.log("POST request successful:", response);
    } catch (error) {
      console.error("Error posting data:", error);
    }
  };

  const handlePostClick = async () => {
    if (!isCodeUnique) return; // 코드가 유효하지 않으면 제출하지 않음
    await postCreate();
    onUpdate();
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
          {category === "customer"
            ? "신규 매출처 등록"
            : category === "supplier"
            ? "신규 매입처 등록"
            : "등록"}
        </ModalTitle>
        <div>
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
            <Label htmlFor="name">상호명:</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="바스코리아"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="contact">연락처:</Label>
            <Input
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="051-123-4567"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="manager">담당자:</Label>
            <Input
              id="manager"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
              placeholder="김바스"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="email">이메일:</Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="info@bas-korea.com"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="address">주소:</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="부산광역시 해운대구"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="language">사용 언어:</Label>
            <Input
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder="KOR"
            />
          </FormGroup>
          <SubmitButton
            type="button" // 타입을 button으로 변경
            disabled={!isCodeUnique || isCheckingCode}
            onClick={handlePostClick} // 클릭 시 POST 요청 처리
          >
            등록
          </SubmitButton>
        </div>
      </ModalContent>
    </ModalBackdrop>
  );
};

export default CreateModal;
