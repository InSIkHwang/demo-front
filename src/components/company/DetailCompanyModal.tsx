import React, { useEffect, useState } from "react";
import { Modal, Button, Divider, message, Form as AntForm, Input } from "antd";
import axios from "../../api/axios";
import styled from "styled-components";

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

const StyledFormItem = styled(AntForm.Item)`
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
  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  useEffect(() => {
    checkCodeUnique();
  }, [formData.code]);

  const handleChange = (changedValues: any) => {
    setFormData({
      ...formData,
      ...changedValues,
    });
  };

  const checkCodeUnique = async () => {
    if (company.code !== formData.code) {
      if ((formData.code + "").trim() === "") {
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
        message.error("Error checking code unique");
        setIsCodeUnique(true); // 오류가 발생하면 기본적으로 유효하다고 처리
      } finally {
        setIsCheckingCode(false);
      }
    } else if (company.code === formData.code) {
      setIsCodeUnique(true);
      setIsCheckingCode(false);
    }
  };

  const editData = async () => {
    try {
      const endpoint =
        category === "customer"
          ? `/api/customers/${formData.id}`
          : `/api/suppliers/${formData.id}`;
      await axios.put(endpoint, formData);
      message.success("Successfully updated.");
    } catch (error) {
      message.error("An error occurred while updating.");
    }
  };

  const deleteData = async () => {
    try {
      const endpoint =
        category === "customer"
          ? `/api/customers/${formData.id}`
          : `/api/suppliers/${formData.id}`;
      await axios.delete(endpoint);
      message.success("Successfully deleted.");
    } catch (error) {
      message.error("An error occurred while deleting.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    await editData();
    setLoading(false);
    onUpdate();
    onClose();
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: "Are you sure you want to delete?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
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
      title={category === "customer" ? "Customer Details" : "Supplier Details"}
      width={700}
    >
      <AntForm
        form={form}
        layout="horizontal"
        labelCol={{ span: 7 }}
        initialValues={formData}
        onValuesChange={handleChange}
        size="small"
      >
        <StyledFormItem
          label="Code"
          name="code"
          rules={[{ required: true, message: "Please enter the code!" }]}
          hasFeedback={isEditing}
          validateStatus={
            formData.code === "" ? "error" : !isCodeUnique ? "error" : "success"
          }
          help={
            formData.code === ""
              ? "Enter code!"
              : !isCodeUnique
              ? "Invalid code."
              : ""
          }
        >
          <Input readOnly={!isEditing} />
        </StyledFormItem>
        <StyledFormItem
          label="Company Name"
          name="companyName"
          rules={[
            { required: true, message: "Please enter the company name!" },
          ]}
        >
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem label="Phone Number" name="phoneNumber">
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem label="Representative" name="representative">
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem label="Email" name="email">
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem label="Address" name="address">
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem
          label="Communication Language"
          name="communicationLanguage"
        >
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem label="Modified At" name="modifiedAt">
          <Input readOnly />
        </StyledFormItem>

        <StyledFormItem label="Header Message" name="headerMessage">
          <Input.TextArea readOnly={!isEditing} />
        </StyledFormItem>

        <Divider />
        <ButtonGroup>
          {isEditing ? (
            <>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={
                  !isCodeUnique ||
                  formData.code === "" ||
                  formData.companyName === ""
                }
                size="middle"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(company);
                  form.setFieldsValue(company);
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
          <Button danger onClick={handleDelete} loading={loading} size="middle">
            Delete
          </Button>
          <Button onClick={onClose} size="middle">
            Close
          </Button>
        </ButtonGroup>
      </AntForm>
    </StyledModal>
  );
};

export default DetailCompanyModal;
