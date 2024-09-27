import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import {
  Modal,
  Button,
  Form,
  Input,
  Typography,
  message,
  AutoComplete,
} from "antd";
import { Vessel } from "../../types/types";

const { Title } = Typography;

interface ModalProps {
  vessel: Vessel;
  onClose: () => void;
  onUpdate: () => void;
}

const DetailVesselModal = ({ vessel, onClose, onUpdate }: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(vessel);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [originCustomer, setOriginCustomer] = useState<{
    companyName: string;
    id: number;
  } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    companyName: string;
    id: number;
  } | null>(null);

  const [form] = Form.useForm();

  useEffect(() => {
    setFormData(vessel);
    if (vessel.customer) {
      setOriginCustomer({
        companyName: vessel.customer.companyName,
        id: vessel.customer.id,
      });
    } else {
      setOriginCustomer(null); // customer가 없을 때 null로 설정
    }
  }, [vessel]);

  useEffect(() => {
    form.setFieldsValue({
      ...formData,
      customerCompanyName: formData.customer?.companyName || "",
    });
  }, [formData, form]);

  // Fetch customer suggestions
  const fetchCustomerSuggestions = async (customerName: string) => {
    if (!(customerName + "").trim()) {
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
      customer: {
        ...formData.customer,
        companyName: selected.companyName, // customer 안에 companyName을 설정
        id: selected.id,
      },
    });
    setSelectedCustomer({
      companyName: selected.companyName,
      id: selected.id,
    });
    setCustomerSuggestions([]);
    setCustomerError(null); // Clear any previous error when a customer is selected
  };

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
        originCustomerId: originCustomer?.id || null,
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
      title={<Title level={3}>Vessel Info</Title>}
      width={700}
    >
      <Form
        form={form}
        initialValues={formData}
        layout="horizontal"
        labelCol={{ span: 7 }}
      >
        <Form.Item
          label="code"
          name="code"
          rules={[{ required: true, message: "코드를 입력하세요!" }]}
        >
          <Input readOnly={!isEditing} />
        </Form.Item>
        <Form.Item
          label="Vessel Name"
          name="vesselName"
          rules={[{ required: true, message: "선명을 입력하세요!" }]}
        >
          <Input readOnly={!isEditing} />
        </Form.Item>
        <Form.Item label="Vessel Company Name" name="vesselCompanyName">
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
          label="Customer Name:"
          name="customerCompanyName"
          validateStatus={customerError ? "error" : ""}
          help={customerError}
          rules={[{ required: true, message: "Select a customer!" }]}
        >
          <AutoComplete
            onSearch={handleSearch}
            onSelect={handleSelectCustomer}
            value={formData.customer?.companyName}
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
            disabled={!isEditing}
          >
            <Input />
          </AutoComplete>
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
