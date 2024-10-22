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
import styled from "styled-components";
import { vesselCheckImoAndHullUnique } from "../../api/api";

const { Title } = Typography;

interface ModalProps {
  vessel: Vessel;
  onClose: () => void;
  onUpdate: () => void;
}

const StyledFormItem = styled(Form.Item)`
  margin-bottom: 16px;

  .ant-form-item-label {
    white-space: normal;
    word-wrap: break-word;
    font-weight: 600;
  }

  .ant-input[readonly] {
    background-color: #f5f5f5;
    border: 1px solid #d9d9d9;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const DetailVesselModal = ({ vessel, onClose, onUpdate }: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(vessel);
  const [isImoUnique, setIsImoUnique] = useState(true);
  const [isHullUnique, setIsHullUnique] = useState(true);
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

  useEffect(() => {
    const checkUnique = async (
      type: string,
      value: string | number | null,
      originalValue: string | number | null
    ) => {
      if (originalValue !== value) {
        if (!value) {
          return true; // 값이 없으면 중복 아님
        }
        try {
          const response = await vesselCheckImoAndHullUnique(type, value);
          return response;
        } catch (error) {
          console.error(`Error checking ${type} unique:`, error);
          return true; // 오류 발생 시 기본적으로 유효한 값으로 처리
        }
      } else {
        return true; // 기존 값과 같으면 유효한 것으로 처리
      }
    };

    const checkImoAndHullUnique = async () => {
      const isImoValid = await checkUnique(
        "imo-number",
        formData.imoNumber,
        vessel.imoNumber
      );
      const isHullValid = await checkUnique(
        "hull-number",
        formData.hullNumber,
        vessel.hullNumber
      );
      setIsImoUnique(isImoValid);
      setIsHullUnique(isHullValid);
    };

    checkImoAndHullUnique();
  }, [
    formData.imoNumber,
    formData.hullNumber,
    vessel.imoNumber,
    vessel.hullNumber,
  ]);

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
        vesselName: formData.vesselName,
        vesselCompanyName: "default",
        imoNumber: formData.imoNumber,
        hullNumber: formData.hullNumber,
        shipYard: formData.shipYard,
        countryOfManufacture: formData.countryOfManufacture,
        originCustomerId: originCustomer?.id || null,
        newCustomerId: selectedCustomer?.id || null,
      });
      message.success("Successfully updated.");
    } catch (error) {
      message.error("An error occurred while updating.");
    }
  };

  // 데이터 삭제 DELETE API
  const deleteData = async () => {
    try {
      await axios.delete(`/api/vessels/${formData.id}`);
      message.success("Successfully deleted.");
    } catch (error) {
      message.error("An error occurred while deleting.");
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
      title: "Are you sure you want to delete?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        await deleteData();
        onUpdate();
        onClose();
      },
    });
  };

  const handleInputChange = (changedFields: any) => {
    setFormData((prevData) => ({
      ...prevData,
      ...changedFields, // 변경된 필드만 업데이트
    }));
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
        size="small"
      >
        <StyledFormItem
          label="Vessel Name"
          name="vesselName"
          rules={[{ required: true, message: "Please enter the vessel name!" }]}
        >
          <Input
            readOnly={!isEditing}
            onChange={
              (e) => handleInputChange({ vesselName: e.target.value }) // 이 부분에서 formData 업데이트
            }
          />
        </StyledFormItem>
        <StyledFormItem
          label="IMO No."
          name="imoNumber"
          hasFeedback={isEditing}
          rules={[{ required: true, message: "Enter IMO number!" }]}
          validateStatus={
            !isImoUnique
              ? "warning"
              : formData.imoNumber === null ||
                formData.imoNumber === undefined ||
                formData.imoNumber + "" === ""
              ? "error"
              : "success"
          }
          help={
            !isImoUnique
              ? "It's a duplicate Imo No."
              : formData.imoNumber === null ||
                formData.imoNumber === undefined ||
                formData.imoNumber + "" === ""
              ? "Enter IMO number!"
              : ""
          }
        >
          <Input
            type="number"
            readOnly={!isEditing}
            value={formData.imoNumber} // formData 값 반영
            onChange={(e) => handleInputChange({ imoNumber: e.target.value })}
            placeholder={isEditing ? "1234567" : ""}
          />
        </StyledFormItem>

        <StyledFormItem
          label="HULL No."
          name="hullNumber"
          hasFeedback={isEditing}
          rules={[{ required: true, message: "Enter Hull number!" }]}
          validateStatus={
            !isHullUnique
              ? "warning"
              : formData.hullNumber === null ||
                formData.hullNumber === undefined ||
                formData.hullNumber + "" === ""
              ? "error"
              : "success"
          }
          help={
            !isHullUnique
              ? "It's a duplicate Hull No."
              : formData.hullNumber === null ||
                formData.hullNumber === undefined ||
                formData.hullNumber + "" === ""
              ? "Enter Hull number!"
              : ""
          }
        >
          <Input
            readOnly={!isEditing}
            value={formData.hullNumber} // formData 값 반영
            onChange={(e) => handleInputChange({ hullNumber: e.target.value })}
            placeholder="V001"
          />
        </StyledFormItem>
        <StyledFormItem label="SHIPYARD" name="shipYard">
          <Input
            readOnly={!isEditing}
            onChange={
              (e) => handleInputChange({ shipYard: e.target.value }) // 이 부분에서 formData 업데이트
            }
          />
        </StyledFormItem>
        <StyledFormItem label="Nationality" name="countryOfManufacture">
          <Input
            readOnly={!isEditing}
            onChange={
              (e) => handleInputChange({ countryOfManufacture: e.target.value }) // 이 부분에서 formData 업데이트
            }
          />
        </StyledFormItem>
        <StyledFormItem
          label="Customer Name:"
          name="customerCompanyName"
          validateStatus={customerError ? "error" : ""}
          help={customerError}
          rules={[{ required: true, message: "Select a customer!" }]}
          hasFeedback={isEditing}
        >
          <AutoComplete
            onSearch={handleSearch}
            onSelect={handleSelectCustomer}
            value={formData.customer?.companyName}
            placeholder={formData.customer?.companyName}
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
        </StyledFormItem>
        <ButtonGroup>
          {isEditing ? (
            <>
              <Button
                type="primary"
                onClick={handleSubmit}
                disabled={
                  formData.vesselName === "" ||
                  !formData.customer ||
                  formData.imoNumber === null ||
                  formData.imoNumber === undefined ||
                  formData.imoNumber + "" === ""
                }
                size="middle"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(vessel);
                  form.setFieldsValue(vessel);
                }}
                size="middle"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              onClick={() => setIsEditing(true)}
              size="middle"
            >
              Edit
            </Button>
          )}
          <Button type="primary" danger onClick={handleDelete} size="middle">
            Delete
          </Button>{" "}
          <Button type="default" onClick={onClose} size="middle">
            Close
          </Button>
        </ButtonGroup>
      </Form>
    </Modal>
  );
};

export default DetailVesselModal;
