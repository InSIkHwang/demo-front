import React, { useState, useEffect, useMemo } from "react";
import axios from "../../api/axios";
import {
  Modal,
  Button,
  Form,
  Input,
  Typography,
  message,
  AutoComplete,
  Tag,
} from "antd";
import { Vessel } from "../../types/types";
import styled from "styled-components";
import {
  deleteVesselCustomer,
  vesselCheckImoAndHullUnique,
} from "../../api/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";

const { Title } = Typography;

interface ModalProps {
  vessel: Vessel;
  onClose: () => void;
  onUpdate: () => void;
}

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

const StyledTag = styled(Tag)`
  border-radius: 20px;
  padding: 4px 12px;
  margin: 4px;
  font-size: 13px;
  border: none;
  background: #edf2f7;
  color: #2d3748;
  transition: all 0.3s ease;

  &:hover {
    background: #e2e8f0;
    transform: translateY(-1px);
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
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    companyName: string;
    id: number;
  } | null>(null);
  const [searchCustomer, setSearchCustomer] = useState<string>("");
  const queryClient = useQueryClient();

  const [form] = Form.useForm();

  const originalImoNumber = vessel.imoNumber;

  // 코드 고유성 검사 효과
  const useCheckVesselUnique = (type: string, value: any) => {
    const debouncedQueryFn = useMemo(
      () =>
        debounce(async () => {
          if (!value) return true;
          try {
            return await vesselCheckImoAndHullUnique(type, value);
          } catch (error) {
            console.error(`Error checking ${type} unique:`, error);
            return true;
          }
        }, 500),
      [type, value]
    );

    return useQuery({
      queryKey: ["vesselUnique", type, value],
      queryFn: debouncedQueryFn,
      enabled: !!value,
      staleTime: 30000,
    });
  };
  // IMO, HULL No. 고유성 검사
  const { data: isImoUnique = true } = useCheckVesselUnique(
    "imo-number",
    formData.imoNumber
  );
  const { data: isHullUnique = true } = useCheckVesselUnique(
    "hull-number",
    formData.hullNumber
  );

  // 매출처 검색 함수
  const debouncedFetchCustomerSuggestions = useMemo(
    () =>
      debounce(async (customerName: string) => {
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
          setCustomerSuggestions(response.data.customerDetailResponse);
        } catch (error) {
          console.error("Error fetching customer suggestions:", error);
        } finally {
          setIsCustomerLoading(false);
        }
      }, 500),
    []
  );

  // 매출처 검색 핸들러
  const handleSearch = (value: string) => {
    if (value !== selectedCustomer?.companyName) {
      setSelectedCustomer(null);
    }
    debouncedFetchCustomerSuggestions(value);
  };

  // 매출처 선택 핸들러
  const handleSelectCustomer = (value: string, option: any) => {
    const selected = option as any;
    if (!value) {
      setSelectedCustomer(null);
      return;
    }

    // 이미 추가된 매출처인지 확인
    const isDuplicate = vessel.customers?.some(
      (customer: any) => customer.id === selected.id
    );

    if (isDuplicate) {
      message.warning("Already added customer.");
      setSelectedCustomer(null);
    } else {
      setSelectedCustomer({
        companyName: selected.companyName,
        id: selected.id,
      });
    }
    setCustomerSuggestions([]);
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
        // originCustomerId: originCustomer?.id || null,
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

  // 고객사 삭제 뮤테이션
  const deleteCustomerMutation = useMutation({
    mutationFn: ({
      vesselId,
      customerId,
    }: {
      vesselId: number;
      customerId: number;
    }) => deleteVesselCustomer(vesselId, customerId),
    onSuccess: (_, variables) => {
      message.success("Successfully deleted.");
      queryClient.invalidateQueries({ queryKey: ["companyDetail", vessel.id] });

      setFormData((prev) => ({
        ...prev,
        customers: prev.customers.filter(
          (customer) => customer.id !== variables.customerId
        ),
      }));
      onUpdate();
    },
    onError: (error) => {
      console.error("Error deleting customer:", error);
      message.error("An error occurred while deleting.");
    },
  });

  // 고객사 삭제 확인 모달
  const showDeleteConfirm = (customerId: number, customerName: string) => {
    Modal.confirm({
      title: "Delete Customer",
      content: `Are you sure you want to delete ${customerName}?`,
      okText: "Delete",
      cancelText: "Cancel",
      okType: "danger",
      onOk: () => {
        deleteCustomerMutation.mutate({
          vesselId: formData.id,
          customerId: customerId,
        });
      },
    });
  };

  // 입력 핸들러
  const handleInputChange = (changedFields: any) => {
    setFormData((prevData) => ({
      ...prevData,
      ...changedFields, // 변경된 필드만 업데이트
    }));
  };

  const customerCompanyName = form.getFieldsValue().customerCompanyName;

  return (
    <StyledModal
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
              : !isImoUnique && originalImoNumber !== Number(formData.imoNumber)
              ? "error"
              : !formData.imoNumber ||
                (formData.imoNumber + "").toString().length !== 7
              ? "error"
              : "success"
          }
          help={
            formData.vesselName?.trim().toUpperCase() === "UNKNOWN"
              ? ""
              : !isImoUnique && originalImoNumber !== Number(formData.imoNumber)
              ? "It's a duplicate Imo No."
              : !formData.imoNumber
              ? "Enter IMO number!"
              : (formData.imoNumber + "").toString().length !== 7
              ? "IMO number must be 7 characters."
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
            readOnly={!isEditing}
            value={formData.hullNumber} // formData 값 반영
            onChange={(e) => handleInputChange({ hullNumber: e.target.value })}
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
          label="Customer name to add:"
          name="customerCompanyName"
          validateStatus={
            isEditing &&
            customerCompanyName &&
            selectedCustomer?.companyName !== customerCompanyName
              ? "error"
              : "success"
          }
          help={
            isEditing &&
            customerCompanyName &&
            selectedCustomer?.companyName !== customerCompanyName
              ? "Please select the correct customer from autocomplete."
              : ""
          }
        >
          <AutoComplete
            onSearch={handleSearch}
            onSelect={handleSelectCustomer}
            value={searchCustomer}
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
        <StyledFormItem
          label="Registered Customers:"
          name="registeredCustomers"
        >
          {formData.customers.map(
            (customer) =>
              customer.companyName && (
                <StyledTag
                  key={customer.id}
                  closable={isEditing}
                  onClose={(e) => {
                    e.preventDefault();
                    showDeleteConfirm(customer.id, customer.companyName);
                  }}
                >
                  {customer.companyName}
                </StyledTag>
              )
          )}
        </StyledFormItem>

        <ButtonGroup>
          {isEditing ? (
            <>
              <Button
                type="primary"
                onClick={handleSubmit}
                disabled={
                  formData.vesselName?.trim().toUpperCase() === "UNKNOWN"
                    ? customerCompanyName &&
                      selectedCustomer?.companyName !== customerCompanyName
                    : !formData.vesselName ||
                      !formData.hullNumber ||
                      !formData.imoNumber ||
                      (!isImoUnique &&
                        originalImoNumber !== Number(formData.imoNumber)) ||
                      (formData.imoNumber + "").toString().length !== 7 ||
                      (customerCompanyName &&
                        selectedCustomer?.companyName !== customerCompanyName)
                }
                size="middle"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(vessel);
                  form.setFieldsValue({
                    ...vessel, // vessel의 모든 필드 업데이트
                    customerCompanyName: "", // customerCompanyName을 빈 문자열로 설정
                  });
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
          </Button>
          <Button type="default" onClick={onClose} size="middle">
            Close
          </Button>
        </ButtonGroup>
      </Form>
    </StyledModal>
  );
};

export default DetailVesselModal;
