import React, { useState } from "react";
import {
  Modal,
  Form as AntForm,
  Input,
  Button,
  Typography,
  notification,
} from "antd";
import axios from "../../api/axios";
import styled from "styled-components";

const { Text } = Typography;

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

interface ModalProps {
  category: string;
  onClose: () => void;
  onUpdate: () => void;
}

const CreateCompanyModal = ({ category, onClose, onUpdate }: ModalProps) => {
  const [form] = AntForm.useForm();
  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (changedValues: any) => {
    const { code } = changedValues;
    if (code !== undefined) {
      checkCodeUnique(code);
    }
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

  const checkCodeUnique = debounce(async (code: string) => {
    if (code.trim() === "") {
      setIsCodeUnique(true);
      return;
    }
    setIsCheckingCode(true);
    try {
      const endpoint =
        category === "customer"
          ? `/api/customers/check-code/${code}`
          : `/api/suppliers/check-code/${code}`;
      const response = await axios.get(endpoint);
      setIsCodeUnique(!response.data); // 응답 T/F를 반전시킴
    } catch (error) {
      console.error("Error checking code unique:", error);
      setIsCodeUnique(true); // 오류가 발생하면 기본적으로 유효하다고 처리
    } finally {
      setIsCheckingCode(false);
    }
  }, 200);

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
        message: "등록 완료",
        description: "성공적으로 등록되었습니다.",
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error posting data:", error);
      notification.error({
        message: "등록 실패",
        description: "등록하는 중 오류가 발생했습니다.",
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
      title={
        category === "customer"
          ? "신규 매출처 등록"
          : category === "supplier"
          ? "신규 매입처 등록"
          : "등록"
      }
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <AntForm
        form={form}
        layout="horizontal"
        labelCol={{ span: 4 }}
        onValuesChange={handleChange}
        onFinish={handleSubmit}
      >
        <AntForm.Item
          label="코드"
          name="code"
          rules={[{ required: true, message: "코드를 입력하세요!" }]}
        >
          <Input placeholder="BAS" />
          {!isCodeUnique && <Text type="danger">이미 등록된 코드입니다.</Text>}
        </AntForm.Item>

        <AntForm.Item
          label="상호명"
          name="name"
          rules={[{ required: true, message: "상호명을 입력하세요!" }]}
        >
          <Input placeholder="바스코리아" />
        </AntForm.Item>

        <AntForm.Item label="연락처" name="contact">
          <Input placeholder="051-123-4567" />
        </AntForm.Item>

        <AntForm.Item label="담당자" name="manager">
          <Input placeholder="김바스" />
        </AntForm.Item>

        <AntForm.Item label="이메일" name="email">
          <Input placeholder="info@bas-korea.com" />
        </AntForm.Item>

        <AntForm.Item label="주소" name="address">
          <Input placeholder="부산광역시 해운대구" />
        </AntForm.Item>

        <AntForm.Item label="사용 언어" name="language">
          <Input placeholder="KOR" />
        </AntForm.Item>

        <AntForm.Item label="머릿글" name="headerMessage">
          <Input.TextArea placeholder="귀사의 무궁한 발전을 기원합니다." />
        </AntForm.Item>

        <AntForm.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!isCodeUnique || isCheckingCode}
            block
          >
            등록
          </Button>
        </AntForm.Item>
      </AntForm>
    </StyledModal>
  );
};

export default CreateCompanyModal;
