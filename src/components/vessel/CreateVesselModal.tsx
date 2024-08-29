import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import styled from "styled-components";
import {
  AutoComplete,
  Input,
  Button,
  Form,
  Modal,
  Typography,
  Row,
  Col,
} from "antd";
import "antd/dist/reset.css"; // Make sure to include Ant Design styles

const { Title, Text } = Typography;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 8px;
  }
  .ant-modal-header {
    border-bottom: none;
    text-align: center;
  }
  .ant-modal-title {
    font-size: 20px;
    font-weight: 700;
  }
  .ant-modal-close {
    top: 20px;
    right: 20px;
  }
  .ant-modal-footer {
    display: flex;
    justify-content: flex-end;
    border-top: none;
  }
`;

const StyledForm = styled(Form)`
  max-width: 100%;
`;

const FormGroup = styled(Form.Item)`
  margin-bottom: 15px;
`;

const ErrorMessage = styled(Text)`
  color: red;
  font-size: 12px;
  display: block;
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

const CreateVesselModal = ({ onClose, onUpdate }: ModalProps) => {
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
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    companyName: string;
    id: number;
  } | null>(null);

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
    try {
      const response = await axios.get(
        `/api/vessels/check-code/${formData.code}`
      );
      setIsCodeUnique(!response.data); // 응답을 반전시켜서 코드 유무 판단
    } catch (error) {
      console.error("Error checking code unique:", error);
      setIsCodeUnique(true); // 오류 발생 시 기본적으로 유효한 코드로 처리
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
        `/api/customers/check-name?query=${customerName}`
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
    const selected = option as any;
    setFormData({
      ...formData,
      customerName: selected.companyName,
      customerId: selected.id,
    });
    setSelectedCustomer({
      companyName: selected.companyName,
      id: selected.id,
    });
    setCustomerSuggestions([]);
    setCustomerError(null); // Clear any previous error when a customer is selected
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

    if (formData.customerId === undefined) {
      setCustomerError("매출처를 선택하세요.");
      return;
    }

    if (selectedCustomer && selectedCustomer.id !== formData.customerId) {
      setCustomerError("유효하지 않은 매출처.");
      return;
    }

    await postCreate();
    onUpdate();
    onClose();
  };

  return (
    <StyledModal
      open={true}
      onCancel={onClose}
      footer={null}
      title="신규 선박 등록"
    >
      <StyledForm
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={formData}
      >
        <FormGroup>
          <Form.Item
            label="코드:"
            name="code"
            validateStatus={
              formData.code === ""
                ? "error"
                : !isCodeUnique
                ? "error"
                : "success"
            }
            help={
              formData.code === ""
                ? "코드를 입력하세요!"
                : !isCodeUnique
                ? "유효하지 않은 코드입니다."
                : ""
            }
            rules={[{ required: true, message: "코드를 입력하세요!" }]}
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
          <Form.Item label="선박회사:" name="vesselCompanyName">
            <Input
              name="vesselCompanyName"
              value={formData.vesselCompanyName}
              onChange={handleChange}
              placeholder="BAS KOREA"
            />
          </Form.Item>
        </FormGroup>

        <FormGroup>
          <Form.Item label="IMO NO.:" name="imoNumber">
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
          <Form.Item label="HULL No.:" name="hullNumber">
            <Input
              name="hullNumber"
              value={formData.hullNumber}
              onChange={handleChange}
              placeholder="V001"
            />
          </Form.Item>
        </FormGroup>

        <FormGroup>
          <Form.Item label="SHIPYARD:" name="shipYard">
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
            label="매출처명:"
            name="customerName"
            validateStatus={customerError ? "error" : ""}
            help={customerError}
            rules={[{ required: true, message: "매출처를 선택하세요!" }]}
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
          <Row justify="end">
            <Col>
              <SubmitButton
                type="primary"
                htmlType="submit"
                disabled={
                  formData.customerId === undefined ||
                  !isCodeUnique ||
                  selectedCustomer?.companyName !== formData.customerName
                }
              >
                등록
              </SubmitButton>
            </Col>
          </Row>
        </FormGroup>
      </StyledForm>
    </StyledModal>
  );
};

export default CreateVesselModal;
