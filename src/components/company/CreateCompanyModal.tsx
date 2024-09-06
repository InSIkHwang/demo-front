import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, notification } from "antd";
import axios from "../../api/axios";
import styled from "styled-components";

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    padding: 20px;
  }

  .ant-modal-header {
    border-bottom: none;
    text-align: center;
  }

  .ant-modal-title {
    font-size: 24px;
    font-weight: 700;
    color: #333;
  }

  .ant-modal-close {
    top: 20px;
    right: 20px;
  }

  .ant-divider-horizontal {
    margin: 12px 0;
  }

  .ant-modal-footer {
    display: flex;
    justify-content: flex-end;
    border-top: none;
    padding-top: 20px;
  }
`;

const StyledForm = styled(Form)`
  max-width: 100%;
`;

const FormGroup = styled(Form.Item)`
  margin-bottom: 15px;
`;

interface ModalProps {
  category: string;
  onClose: () => void;
  onUpdate: () => void;
}

const CreateCompanyModal = ({ category, onClose, onUpdate }: ModalProps) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contact: "",
    manager: "",
    email: "",
    address: "",
    language: "",
    headerMessage: "",
  });

  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  const postCreate = async (values: any) => {
    try {
      setLoading(true);
      const endpoint =
        category === "customer" ? "/api/customers" : "/api/suppliers";
      await axios.post(endpoint, {
        code: values.code,
        companyName: values.name,
        phoneNumber: values.contact,
        representative: values.manager,
        email: values.email,
        address: values.address,
        communicationLanguage: values.language,
      });
      notification.success({
        message: "Registration complete",
        description: "You have registered successfully.",
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error posting data:", error);
      notification.error({
        message: "Registration failed",
        description: "An error occurred while registering.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!isCodeUnique) return; // 코드가 유효하지 않으면 제출하지 않음
    await postCreate(values);
  };

  return (
    <StyledModal
      open={true}
      onCancel={onClose}
      footer={null}
      title={
        category === "customer"
          ? "New customer registration"
          : category === "supplier"
          ? "New Supplier registration"
          : "등록"
      }
    >
      <StyledForm layout="horizontal" onFinish={handleSubmit}>
        <FormGroup>
          <Form.Item
            label="code:"
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
                ? "Enter code!"
                : !isCodeUnique
                ? "Invalid code."
                : ""
            }
            rules={[{ required: true, message: "Enter code!" }]}
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
            label="name:"
            name="name"
            rules={[{ required: true, message: "Please enter name!" }]}
          >
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="바스코리아"
            />
          </Form.Item>
        </FormGroup>

        <FormGroup>
          <Form.Item label="contact:" name="contact">
            <Input
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="051-123-4567"
            />
          </Form.Item>
        </FormGroup>

        <FormGroup>
          <Form.Item label="manager:" name="manager">
            <Input
              name="manager"
              value={formData.manager}
              onChange={handleChange}
              placeholder="김바스"
            />
          </Form.Item>
        </FormGroup>

        <FormGroup>
          <Form.Item label="email:" name="email">
            <Input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="info@bas-korea.com"
            />
          </Form.Item>
        </FormGroup>

        <FormGroup>
          <Form.Item label="address:" name="address">
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="부산광역시 해운대구"
            />
          </Form.Item>
        </FormGroup>

        <FormGroup>
          <Form.Item label="language:" name="language">
            <Input
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder="KOR"
            />
          </Form.Item>
        </FormGroup>

        <FormGroup>
          <Form.Item label="Header Message:" name="headerMessage">
            <Input.TextArea
              name="headerMessage"
              value={formData.headerMessage}
              onChange={handleChange}
              placeholder="We wish your company continued success."
            />
          </Form.Item>
        </FormGroup>

        <FormGroup>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!isCodeUnique}
            block
          >
            Submit
          </Button>
        </FormGroup>
      </StyledForm>
    </StyledModal>
  );
};

export default CreateCompanyModal;
