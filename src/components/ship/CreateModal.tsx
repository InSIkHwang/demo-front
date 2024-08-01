import axios from "../../api/axios";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { AutoComplete, Input, Button, Form } from "antd";
import "antd/dist/reset.css"; // Make sure to include Ant Design styles

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

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 12px;
  margin-top: 5px;
`;

const SubmitButton = styled(Button)`
  display: block;
  margin-left: auto;
`;

interface ModalProps {
  onClose: () => void;
  onUpdate: () => void;
}

const CreateModal = ({ onClose, onUpdate }: ModalProps) => {
  const [formData, setFormData] = useState({
    code: "",
    vesselName: "",
    vesselCompanyName: "",
    imoNumber: undefined,
    hullNumber: "",
    shipYard: "",
    customerName: "",
    customerId: undefined,
  });

  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);

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

  // 중복 코드 체크 로직
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

  // Fetch customer suggestions
  const fetchCustomerSuggestions = async (customerName: string) => {
    if (!customerName.trim()) {
      setCustomerSuggestions([]);
      return;
    }
    setIsCustomerLoading(true);
    try {
      const response = await axios.get(
        `/api/customers/check-name?customerName=${customerName}`
      );
      setCustomerSuggestions(response.data.customerDetailResponse);
    } catch (error) {
      console.error("Error fetching customer suggestions:", error);
    } finally {
      setIsCustomerLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    fetchCustomerSuggestions(value);
  };

  const handleSelectCustomer = (value: string, option: any) => {
    const selectedCustomer = option as any;
    setFormData({
      ...formData,
      customerName: selectedCustomer.companyName,
      customerId: selectedCustomer.id,
    });
    setCustomerSuggestions([]);
  };

  const postCreate = async () => {
    try {
      await axios.post(`/api/vessels`, {
        code: formData.code,
        vesselName: formData.vesselName,
        vesselCompanyName: formData.vesselCompanyName,
        imoNumber: Number(formData.imoNumber),
        hullNumber: formData.hullNumber,
        shipYard: formData.shipYard,
        customerId: formData.customerId,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!isCodeUnique) return;
    await postCreate();
    onUpdate();
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
        <ModalTitle>신규 선박 등록</ModalTitle>
        <Form onFinish={handleSubmit}>
          <FormGroup>
            <Form.Item
              label="코드:"
              name="code"
              rules={[{ required: true, message: "코드를 입력하세요!" }]}
              help={!isCodeUnique ? "이미 등록된 코드입니다." : ""}
            >
              <Input
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="BAS"
              />
            </Form.Item>
          </FormGroup>
          <FormGroup>
            <Form.Item
              label="선명:"
              name="vesselName"
              rules={[{ required: true, message: "선명을 입력하세요!" }]}
            >
              <Input
                name="vesselName"
                value={formData.vesselName}
                onChange={handleChange}
                placeholder="BAS VESSEL1"
              />
            </Form.Item>
          </FormGroup>
          <FormGroup>
            <Form.Item
              label="선박회사:"
              name="vesselCompanyName"
              rules={[{ required: true, message: "선박회사를 입력하세요!" }]}
            >
              <Input
                name="vesselCompanyName"
                value={formData.vesselCompanyName}
                onChange={handleChange}
                placeholder="BAS KOREA"
              />
            </Form.Item>
          </FormGroup>
          <FormGroup>
            <Form.Item
              label="IMO NO.:"
              name="imoNumber"
              rules={[{ required: true, message: "IMO NO.을 입력하세요!" }]}
            >
              <Input
                name="imoNumber"
                value={formData.imoNumber}
                onChange={handleChange}
                placeholder="1234567"
                type="number"
              />
            </Form.Item>
          </FormGroup>
          <FormGroup>
            <Form.Item
              label="HULL No.:"
              name="hullNumber"
              rules={[{ required: true, message: "HULL No.을 입력하세요!" }]}
            >
              <Input
                name="hullNumber"
                value={formData.hullNumber}
                onChange={handleChange}
                placeholder="V001"
              />
            </Form.Item>
          </FormGroup>
          <FormGroup>
            <Form.Item
              label="SHIPYARD:"
              name="shipYard"
              rules={[{ required: true, message: "SHIPYARD를 입력하세요!" }]}
            >
              <Input
                name="shipYard"
                value={formData.shipYard}
                onChange={handleChange}
                placeholder="B123"
              />
            </Form.Item>
          </FormGroup>
          <FormGroup>
            <Form.Item
              label="고객명:"
              name="customerName"
              rules={[{ required: true, message: "고객명을 입력하세요!" }]}
            >
              <AutoComplete
                onSearch={handleSearch}
                onSelect={handleSelectCustomer}
                value={formData.customerName}
                placeholder="Customer Name"
                options={customerSuggestions.map((customer) => ({
                  value: customer.companyName,
                  label: customer.companyName,
                  companyName: customer.companyName,
                  id: customer.id,
                }))}
                filterOption={(inputValue, option) =>
                  (option?.value as string)
                    .toUpperCase()
                    .includes(inputValue.toUpperCase())
                }
              >
                <Input />
              </AutoComplete>
            </Form.Item>
          </FormGroup>
          <FormGroup>
            <SubmitButton
              type="primary"
              htmlType="submit"
              disabled={!isCodeUnique || isCheckingCode}
            >
              등록
            </SubmitButton>
          </FormGroup>
        </Form>
      </ModalContent>
    </ModalBackdrop>
  );
};

export default CreateModal;
