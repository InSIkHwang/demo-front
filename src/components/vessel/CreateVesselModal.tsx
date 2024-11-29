import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import styled from "styled-components";
import { AutoComplete, Input, Button, Form, Modal, notification } from "antd";
import { vesselCheckImoAndHullUnique } from "../../api/api";

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 20px;
    padding: 30px;
    background: linear-gradient(to bottom right, #ffffff, #f8f9fa);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  }

  .ant-modal-header {
    border-bottom: none;
    text-align: center;
    margin-bottom: 24px;
  }

  .ant-modal-title {
    font-size: 24px;
    font-weight: 700;
    color: #333;
  }

  .ant-modal-close {
    top: 24px;
    right: 24px;
    transition: transform 0.2s ease;

    &:hover {
      transform: rotate(90deg);
    }
  }
`;

const StyledFormItem = styled(Form.Item)`
  margin-bottom: 20px;

  .ant-form-item-label {
    white-space: normal;
    word-wrap: break-word;
    font-weight: 600;
    color: #2d3748;
  }

  .ant-input {
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    padding: 2px 6px;
    transition: all 0.3s ease;

    &:hover,
    &:focus {
      border-color: #4299e1;
      box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
    }
  }

  .ant-input[readonly] {
    background-color: #f7fafc;
    border: 1px solid #edf2f7;
  }
`;

const StyledForm = styled(Form)`
  max-width: 100%;
`;

interface ModalProps {
  onClose: () => void;
  onUpdate: () => void;
}

const CreateVesselModal = ({ onClose, onUpdate }: ModalProps) => {
  const [formData, setFormData] = useState({
    vesselName: "",
    vesselCompanyName: "",
    imoNumber: undefined,
    hullNumber: "",
    shipYard: "",
    countryOfManufacture: "",
    customerName: "",
    customerId: undefined,
  });

  const [isImoUnique, setIsImoUnique] = useState(true);
  const [isHullUnique, setIsHullUnique] = useState(true);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(
    "Please select a customer"
  );
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

  // 중복 코드 체크 로직
  useEffect(() => {
    const checkUnique = async (type: string, value: any) => {
      if (!value) {
        return true;
      }
      try {
        const response = await vesselCheckImoAndHullUnique(type, value);
        return response;
      } catch (error) {
        console.error(`Error checking ${type} unique:`, error);
        return true; // 오류 발생 시 기본적으로 유효한 코드로 처리
      }
    };

    const checkImoAndHullUnique = async () => {
      // 7자리 이상일 때만 imoNumber 검사
      const isImoValid =
        formData.imoNumber && (formData.imoNumber + "").toString().length >= 7
          ? await checkUnique("imo-number", formData.imoNumber)
          : true;

      const isHullValid = await checkUnique("hull-number", formData.hullNumber);

      setIsImoUnique(isImoValid);
      setIsHullUnique(isHullValid);
    };

    checkImoAndHullUnique();
  }, [formData.imoNumber, formData.hullNumber]);

  // Fetch customer suggestions
  const fetchCustomerSuggestions = async (customerName: string) => {
    if (!(customerName + "").trim()) {
      setCustomerSuggestions([]);
      setSelectedCustomer(null);
      return;
    }
    setIsCustomerLoading(true);
    try {
      const response = await axios.get(
        `/api/customers/check-name?query=${customerName}`
      );
      const searchCustomer = response.data.customerDetailResponse;

      setCustomerSuggestions(searchCustomer);
    } catch (error) {
      console.error("Error fetching customer suggestions:", error);
    } finally {
      setIsCustomerLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    if (value !== selectedCustomer?.companyName) {
      setSelectedCustomer(null);
    }
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
        vesselName: formData.vesselName,
        vesselCompanyName: "default",
        imoNumber: Number(formData.imoNumber),
        hullNumber: formData.hullNumber,
        shipYard: formData.shipYard,
        countryOfManufacture: formData.countryOfManufacture,
        customerId: formData.customerId,
      });
      notification.success({
        message: "Registration complete",
        description: "You have registered successfully.",
      });
    } catch (error) {
      console.error("Error posting data:", error);
      notification.error({
        message: "Registration failed",
        description: "An error occurred while registering.",
      });
    }
  };

  const handleSubmit = async (values: any) => {
    // if (!isImoUnique) return;

    if (!formData.customerId) {
      setCustomerError("Please select a customer");
      return;
    }

    if (selectedCustomer && selectedCustomer.id !== formData.customerId) {
      setCustomerError("Invalid customer");
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
      title="New vessel registration"
      width={700}
    >
      <StyledForm
        layout="horizontal"
        onFinish={handleSubmit}
        initialValues={formData}
        labelCol={{ span: 8 }}
        size="small"
      >
        <StyledFormItem
          label="Vessel Name:"
          name="vesselName"
          rules={[{ required: true, message: "Enter vessel name!" }]}
          hasFeedback
        >
          <Input
            name="vesselName"
            value={formData.vesselName}
            onChange={handleChange}
            placeholder="BAS VESSEL1"
          />
        </StyledFormItem>
        <StyledFormItem
          label="IMO NO.:"
          name="imoNumber"
          hasFeedback
          rules={[
            {
              required:
                formData.vesselName?.trim().toUpperCase() === "UNKNOWN"
                  ? false
                  : true,
              message: "Enter IMO number!",
            },
            { len: 7, message: "IMO number must be 7 characters." },
          ]}
          validateStatus={
            formData.vesselName?.trim().toUpperCase() === "UNKNOWN"
              ? "success"
              : !isImoUnique
              ? "error"
              : !formData.imoNumber ||
                (formData.imoNumber + "").toString().length !== 7
              ? "error"
              : "success"
          }
          help={
            formData.vesselName?.trim().toUpperCase() === "UNKNOWN"
              ? ""
              : !isImoUnique
              ? "It's a duplicate Imo No."
              : !formData.imoNumber
              ? "Enter IMO number!"
              : (formData.imoNumber + "").toString().length !== 7
              ? "IMO number must be 7 characters."
              : ""
          }
        >
          <Input
            name="imoNumber"
            value={formData.imoNumber}
            onChange={handleChange}
            placeholder="1234567"
            type="number"
          />
        </StyledFormItem>

        <StyledFormItem
          label="HULL No.:"
          name="hullNumber"
          hasFeedback
          rules={[
            {
              required:
                formData.vesselName?.trim().toUpperCase() === "UNKNOWN"
                  ? false
                  : true,
              message: "Enter Hull number!",
            },
          ]}
          validateStatus={
            formData.vesselName?.trim().toUpperCase() === "UNKNOWN"
              ? "success"
              : !isHullUnique
              ? "warning"
              : !formData.hullNumber
              ? "error"
              : "success"
          }
          help={
            formData.vesselName?.trim().toUpperCase() === "UNKNOWN"
              ? ""
              : !isHullUnique
              ? "It's a duplicate Hull No."
              : !formData.hullNumber
              ? "Enter Hull number!"
              : ""
          }
        >
          <Input
            name="hullNumber"
            value={formData.hullNumber}
            onChange={handleChange}
            placeholder="V001"
          />
        </StyledFormItem>

        <StyledFormItem label="SHIPYARD:" name="shipYard">
          <Input
            name="shipYard"
            value={formData.shipYard}
            onChange={handleChange}
            placeholder="B123"
          />
        </StyledFormItem>
        <StyledFormItem label="Nationality:" name="countryOfManufacture">
          <Input
            name="countryOfManufacture"
            value={formData.countryOfManufacture}
            onChange={handleChange}
            placeholder="KR, JP..."
          />
        </StyledFormItem>

        <StyledFormItem
          label="Customer Name:"
          name="customerName"
          validateStatus={
            !selectedCustomer ? "error" : customerError ? "error" : ""
          }
          help={customerError}
          rules={[{ required: true, message: "Select a customer!" }]}
          hasFeedback
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
        </StyledFormItem>
        <Button
          type="primary"
          htmlType="submit"
          disabled={
            formData.vesselName?.trim().toUpperCase() !== "UNKNOWN"
              ? !formData.vesselName ||
                !formData.imoNumber ||
                !formData.hullNumber ||
                !selectedCustomer ||
                !isImoUnique ||
                (formData.imoNumber + "").toString().length !== 7
              : !formData.vesselName || !selectedCustomer
          }
          block
          size="middle"
        >
          Submit
        </Button>
      </StyledForm>
    </StyledModal>
  );
};

export default CreateVesselModal;
