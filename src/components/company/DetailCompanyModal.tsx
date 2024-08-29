import React, { useState } from "react";
import {
  Modal,
  Button,
  Typography,
  Divider,
  message,
  Row,
  Col,
  Form as AntForm,
  Input,
} from "antd";
import axios from "../../api/axios";
import styled from "styled-components";

const { Title, Text } = Typography;

interface Company {
  id: number;
  code: string;
  companyName: string;
  phoneNumber: string;
  representative: string;
  email: string;
  address: string;
  communicationLanguage: string;
  modifiedAt: string;
  headerMessage: string;
}

interface ModalProps {
  category: string;
  company: Company;
  onClose: () => void;
  onUpdate: () => void;
}

// 스타일 정의
const InfoLabel = styled(Text)`
  font-weight: 600;
  color: #555;
`;

const InfoValue = styled(Text)`
  color: #333;
`;

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

const DetailCompanyModal = ({
  category,
  company,
  onClose,
  onUpdate,
}: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(company);
  const [loading, setLoading] = useState(false);
  const [form] = AntForm.useForm();

  // 수정폼 데이터 입력 처리
  const handleChange = (changedValues: any) => {
    setFormData({
      ...formData,
      ...changedValues,
    });
  };

  // 데이터 수정 PUT API
  const editData = async () => {
    try {
      const endpoint =
        category === "customer"
          ? `/api/customers/${formData.id}`
          : `/api/suppliers/${formData.id}`;
      await axios.put(endpoint, formData);
      message.success("수정이 완료되었습니다.");
    } catch (error) {
      message.error("수정 중 오류가 발생했습니다.");
    }
  };

  // 데이터 삭제 DELETE API
  const deleteData = async () => {
    try {
      const endpoint =
        category === "customer"
          ? `/api/customers/${formData.id}`
          : `/api/suppliers/${formData.id}`;
      await axios.delete(endpoint);
      message.success("삭제가 완료되었습니다.");
    } catch (error) {
      message.error("삭제 중 오류가 발생했습니다.");
    }
  };

  // 수정 SUBMIT 비동기 처리, PUT 처리 후 FETCH
  const handleSubmit = async (values: any) => {
    setLoading(true);
    await editData();
    setLoading(false);
    onUpdate();
    onClose();
  };

  // 삭제 SUBMIT 비동기 처리, DELETE 처리 후 FETCH
  const handleDelete = async () => {
    Modal.confirm({
      title: "정말 삭제하시겠습니까?",
      okText: "삭제",
      okType: "danger",
      cancelText: "취소",
      onOk: async () => {
        setLoading(true);
        await deleteData();
        setLoading(false);
        onUpdate();
        onClose();
      },
    });
  };

  return (
    <StyledModal
      open={true}
      onCancel={onClose}
      footer={null}
      title={category === "customer" ? "매출처 상세 정보" : "매입처 상세 정보"}
    >
      {isEditing ? (
        <AntForm
          form={form}
          layout="vertical"
          initialValues={formData}
          onValuesChange={handleChange}
        >
          <Row gutter={16}>
            <Col span={12}>
              <AntForm.Item label="코드" name="code">
                <Input readOnly={!isEditing} />
              </AntForm.Item>
            </Col>
            <Col span={12}>
              <AntForm.Item label="상호명" name="companyName">
                <Input readOnly={!isEditing} />
              </AntForm.Item>
            </Col>
            <Col span={12}>
              <AntForm.Item label="연락처" name="phoneNumber">
                <Input readOnly={!isEditing} />
              </AntForm.Item>
            </Col>
            <Col span={12}>
              <AntForm.Item label="담당자" name="representative">
                <Input readOnly={!isEditing} />
              </AntForm.Item>
            </Col>
            <Col span={12}>
              <AntForm.Item label="이메일" name="email">
                <Input readOnly={!isEditing} />
              </AntForm.Item>
            </Col>
            <Col span={12}>
              <AntForm.Item label="주소" name="address">
                <Input readOnly={!isEditing} />
              </AntForm.Item>
            </Col>
            <Col span={12}>
              <AntForm.Item label="사용 언어" name="communicationLanguage">
                <Input readOnly={!isEditing} />
              </AntForm.Item>
            </Col>
            <Col span={12}>
              <AntForm.Item label="수정된 날짜" name="modifiedAt">
                <Input readOnly />
              </AntForm.Item>
            </Col>
            <Col span={12}>
              <AntForm.Item label="머릿글" name="headerMessage">
                <Input readOnly={!isEditing} />
              </AntForm.Item>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: "right" }}>
            <Button
              type="primary"
              style={{ marginRight: 10 }}
              onClick={handleSubmit}
            >
              수정
            </Button>
            <Button
              type="primary"
              danger
              onClick={handleDelete}
              loading={loading}
            >
              삭제
            </Button>
            <Button type="default" onClick={onClose} style={{ marginLeft: 10 }}>
              닫기
            </Button>
          </div>
        </AntForm>
      ) : (
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <InfoLabel>코드:</InfoLabel>
          </Col>
          <Col span={16}>
            <InfoValue>{formData.code}</InfoValue>
          </Col>

          <Col span={8}>
            <InfoLabel>상호명:</InfoLabel>
          </Col>
          <Col span={16}>
            <InfoValue>{formData.companyName}</InfoValue>
          </Col>

          <Col span={8}>
            <InfoLabel>연락처:</InfoLabel>
          </Col>
          <Col span={16}>
            <InfoValue>{formData.phoneNumber}</InfoValue>
          </Col>

          <Col span={8}>
            <InfoLabel>담당자:</InfoLabel>
          </Col>
          <Col span={16}>
            <InfoValue>{formData.representative}</InfoValue>
          </Col>

          <Col span={8}>
            <InfoLabel>이메일:</InfoLabel>
          </Col>
          <Col span={16}>
            <InfoValue>{formData.email}</InfoValue>
          </Col>

          <Col span={8}>
            <InfoLabel>주소:</InfoLabel>
          </Col>
          <Col span={16}>
            <InfoValue>{formData.address}</InfoValue>
          </Col>

          <Col span={8}>
            <InfoLabel>사용 언어:</InfoLabel>
          </Col>
          <Col span={16}>
            <InfoValue>{formData.communicationLanguage}</InfoValue>
          </Col>

          <Col span={8}>
            <InfoLabel>수정된 날짜:</InfoLabel>
          </Col>
          <Col span={16}>
            <InfoValue>{formData.modifiedAt}</InfoValue>
          </Col>

          <Col span={8}>
            <InfoLabel>머릿글:</InfoLabel>
          </Col>
          <Col span={16}>
            <InfoValue>{formData.headerMessage}</InfoValue>
          </Col>
        </Row>
      )}

      <Divider />
      <div style={{ textAlign: "right" }}>
        {!isEditing && (
          <Button
            type="primary"
            style={{ marginRight: 10 }}
            onClick={() => setIsEditing(true)}
          >
            수정
          </Button>
        )}
      </div>
    </StyledModal>
  );
};

export default DetailCompanyModal;
