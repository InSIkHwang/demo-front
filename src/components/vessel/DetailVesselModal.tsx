import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import {
  Modal,
  Button,
  Form,
  Input,
  Typography,
  Row,
  Col,
  message,
} from "antd";
import { Vessel } from "../../types/types";

const { Title, Text } = Typography;

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
  const [form] = Form.useForm();

  useEffect(() => {
    setFormData(vessel);
  }, [vessel]);

  useEffect(() => {
    form.setFieldsValue({
      ...formData,
      customerCompanyName: formData.customer?.companyName || "없음",
    });
  }, [formData, form]);

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
        newCustomerId: selectedCustomer?.id || null,
      });
      message.success("수정이 완료되었습니다.");
    } catch (error) {
      message.error("수정 중 오류가 발생했습니다.");
    }
  };

  // 데이터 삭제 DELETE API
  const deleteData = async () => {
    try {
      await axios.delete(`/api/vessels/${formData.id}`);
      message.success("삭제가 완료되었습니다.");
    } catch (error) {
      message.error("삭제 중 오류가 발생했습니다.");
    }
  };

  // 수정 SUBMIT 비동기 처리, PUT 처리 후 FETCH
  const handleSubmit = async () => {
    await editData();
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
        await deleteData();
        onUpdate();
        onClose();
      },
    });
  };

  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null}
      title={<Title level={3}>선박 상세 정보</Title>}
      width={700}
    >
      <Form
        form={form}
        initialValues={formData}
        layout="horizontal"
        labelCol={{ span: 4 }}
      >
        <Form.Item
          label="코드"
          name="code"
          rules={[{ required: true, message: "코드를 입력하세요!" }]}
        >
          <Input readOnly={!isEditing} />
        </Form.Item>
        <Form.Item
          label="선명"
          name="vesselName"
          rules={[{ required: true, message: "선명을 입력하세요!" }]}
        >
          <Input readOnly={!isEditing} />
        </Form.Item>
        <Form.Item label="선박회사" name="vesselCompanyName">
          <Input readOnly={!isEditing} />
        </Form.Item>
        <Form.Item label="IMO No." name="imoNumber">
          <Input type="number" readOnly={!isEditing} />
        </Form.Item>
        <Form.Item label="HULL No." name="hullNumber">
          <Input readOnly={!isEditing} />
        </Form.Item>
        <Form.Item label="SHIPYARD" name="shipYard">
          <Input readOnly={!isEditing} />
        </Form.Item>
        <Form.Item
          label="매출처"
          name="customerCompanyName"
          rules={[{ required: true, message: "매출처를 선택하세요!" }]}
        >
          <Input readOnly />
        </Form.Item>
        <div style={{ textAlign: "right" }}>
          {isEditing ? (
            <>
              <Button
                type="primary"
                onClick={handleSubmit}
                style={{ marginRight: "8px" }}
              >
                저장
              </Button>
              <Button onClick={() => setIsEditing(false)}>취소</Button>
            </>
          ) : (
            <>
              <Button
                type="primary"
                onClick={() => setIsEditing(true)}
                style={{ marginRight: "8px" }}
              >
                수정
              </Button>
              <Button type="primary" danger onClick={handleDelete}>
                삭제
              </Button>{" "}
              <Button type="default" onClick={onClose}>
                닫기
              </Button>
            </>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default DetailVesselModal;
