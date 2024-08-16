import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  AutoComplete,
  Tag,
  message,
} from "antd";
import styled from "styled-components";
import CreateCompanyModal from "../company/CreateCompanyModal";
import CreateVesselModal from "../vessel/CreateVesselModal";
import { searchSupplier } from "../../api/api";

const { Option } = Select;

const InquiryItemForm = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

const FormRow = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

interface FormValues {
  docNumber: string;
  registerDate: any;
  shippingDate: any;
  customer: string;
  vesselName: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  remark: string;
  supplierName: string;
}

interface InquiryFormProps {
  formValues: FormValues;
  autoCompleteOptions: { value: string }[];
  vesselNameList: string[];
  supplierOptions: { value: string; id: number; code: string; email: string }[];
  selectedSuppliers: {
    id: number;
    name: string;
    code: string;
    email: string;
  }[];
  handleFormChange: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void;
  addItem: () => void;
  customerUnreg: boolean;
  vesselUnreg: boolean;
  setSelectedSupplierTag: Dispatch<
    SetStateAction<{ id: number; name: string; code: string; email: string }[]>
  >;
  setSelectedSuppliers: Dispatch<
    SetStateAction<{ id: number; name: string; code: string; email: string }[]>
  >;
}

const InquiryForm = ({
  formValues,
  autoCompleteOptions,
  vesselNameList,
  selectedSuppliers,
  handleFormChange,
  addItem,
  customerUnreg,
  vesselUnreg,
  setSelectedSupplierTag,
  setSelectedSuppliers,
}: InquiryFormProps) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [tagColors, setTagColors] = useState<{ [id: number]: string }>({});
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierList, setSupplierList] = useState<
    { name: string; id: number; code: string; email: string }[]
  >([]);
  const [autoSearchSupCompleteOptions, setAutoSearchSupCompleteOptions] =
    useState<{ value: string }[]>([]);

  useEffect(() => {
    if (selectedSuppliers.length > 0) {
      const initialColors = selectedSuppliers.reduce((colors, supplier) => {
        colors[supplier.id] = "#007bff";
        return colors;
      }, {} as { [id: number]: string });

      setTagColors(initialColors);
    }
  }, [selectedSuppliers]);

  const validateCustomer = () => {
    if (customerUnreg) {
      return {
        status: formValues.customer.trim() === "" ? "error" : undefined,
        message:
          formValues.customer.trim() === ""
            ? "Please enter a customer"
            : "등록되지 않은 매출처입니다.",
      };
    }
    return { status: undefined, message: undefined };
  };

  const validateVessel = () => {
    if (vesselUnreg) {
      return {
        status: formValues.vesselName.trim() === "" ? "error" : undefined,
        message:
          formValues.vesselName.trim() === ""
            ? "Please enter a vessel"
            : "등록되지 않은 선박입니다.",
      };
    }
    return { status: undefined, message: undefined };
  };

  const removeDuplicates = (
    arr: { id: number; name: string; code: string }[]
  ) => {
    const uniqueIds = new Set<number>();
    return arr.filter((item) => {
      if (uniqueIds.has(item.id)) {
        return false;
      }
      uniqueIds.add(item.id);
      return true;
    });
  };

  const handleSearch = async (value: string) => {
    setSupplierSearch(value);
    if (value) {
      try {
        const data = await searchSupplier(value);
        const options = data.suppliers.map((supplier) => ({
          name: supplier.companyName,
          id: supplier.id,
          code: supplier.code,
          email: supplier.email,
        }));
        setSupplierList(options);
        setAutoSearchSupCompleteOptions(
          options
            .filter((supplier) =>
              supplier.name.toLowerCase().includes(value.toLowerCase())
            )
            .map((supplier) => ({ value: supplier.name }))
        );
      } catch (error) {
        message.error("검색 중 오류가 발생했습니다.");
      }
    } else {
      setSupplierList([]);
    }
  };

  const handleTagClick = (id: number) => {
    setSelectedSupplierTag((prevTags) => {
      const isAlreadySelected = prevTags.some((tag) => tag.id === id);
      const currentTags = [...prevTags];

      if (isAlreadySelected) {
        setTagColors((prevColors) => ({ ...prevColors, [id]: "#d9d9d9" }));
        return currentTags.filter((tag) => tag.id !== id);
      } else {
        const newTag = selectedSuppliers.find((supplier) => supplier.id === id);
        if (newTag) {
          if (currentTags.length >= 5) {
            message.error("최대 5개의 의뢰처만 등록 가능합니다.");
            return currentTags;
          }
          setTagColors((prevColors) => ({ ...prevColors, [id]: "#007bff" }));
          return [...currentTags, newTag];
        }
        return currentTags;
      }
    });
  };

  const uniqueSuppliers = removeDuplicates(selectedSuppliers);

  const handleAddSupplier = () => {
    const matchedSupplier = supplierList.find(
      (supplier) => supplier.name.toLowerCase() === supplierSearch.toLowerCase()
    );

    if (matchedSupplier) {
      setSelectedSuppliers((prevSuppliers) => {
        const supplierExists = prevSuppliers.some(
          (supplier) => supplier.id === matchedSupplier.id
        );

        if (supplierExists) {
          message.warning("이미 추가된 의뢰처입니다.");
          return prevSuppliers;
        }

        return [
          ...prevSuppliers,
          {
            id: matchedSupplier.id,
            name: matchedSupplier.name,
            code: matchedSupplier.code,
            email: matchedSupplier.email,
          },
        ];
      });

      setSupplierSearch("");
      setAutoSearchSupCompleteOptions([]);
    } else {
      message.warning(
        "검색된 의뢰처 목록에서 일치하는 항목을 찾을 수 없습니다."
      );
    }
  };

  return (
    <>
      <Form layout="vertical" initialValues={formValues}>
        <FormRow>
          <InquiryItemForm
            label="문서번호"
            name="docNumber"
            style={{ maxWidth: 200 }}
          >
            <Input
              value={formValues.docNumber}
              readOnly
              style={{ cursor: "default" }}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="작성일자"
            name="registerDate"
            rules={[{ required: true, message: "Please select register date" }]}
            style={{ maxWidth: 150 }}
          >
            <DatePicker
              value={formValues.registerDate}
              onChange={(date) => handleFormChange("registerDate", date!)}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="선적일자"
            name="shippingDate"
            rules={[{ required: true, message: "Please select shipping date" }]}
            style={{ maxWidth: 150 }}
          >
            <DatePicker
              value={formValues.shippingDate}
              onChange={(date) => handleFormChange("shippingDate", date!)}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="화폐"
            name="currencyType"
            rules={[{ required: true, message: "Please select currency type" }]}
          >
            <Select
              value={formValues.currencyType}
              onChange={(value) => handleFormChange("currencyType", value)}
            >
              {["USD", "EUR", "INR"].map((currency) => (
                <Option key={currency} value={currency}>
                  {currency}
                </Option>
              ))}
            </Select>
          </InquiryItemForm>
          <InquiryItemForm
            label="환율"
            name="currency"
            rules={[
              {
                required: true,
                message: "Please enter currency exchange rate",
              },
            ]}
          >
            <Input
              type="number"
              value={formValues.currency}
              onChange={(e) =>
                handleFormChange("currency", parseFloat(e.target.value))
              }
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <InquiryItemForm
            label="매출처"
            name="customer"
            validateStatus={
              validateCustomer().status as
                | ""
                | "error"
                | "success"
                | "warning"
                | "validating"
                | undefined
            }
            help={validateCustomer().message}
            rules={[{ required: true, message: "Please enter customer" }]}
          >
            <Button
              type="primary"
              style={{ position: "absolute", top: "-35px", right: "0" }}
              onClick={() => setIsCustomerModalOpen(true)}
            >
              신규 등록
            </Button>
            <AutoComplete
              value={formValues.customer}
              onChange={(value) => handleFormChange("customer", value)}
              options={autoCompleteOptions}
              style={{ width: "100%" }}
            >
              <Input />
            </AutoComplete>
          </InquiryItemForm>
          <InquiryItemForm
            label="선박명"
            name="vesselName"
            validateStatus={
              validateVessel().status as
                | ""
                | "error"
                | "success"
                | "warning"
                | "validating"
                | undefined
            }
            help={validateVessel().message}
            rules={[{ required: true, message: "Please enter vessel name" }]}
          >
            <Button
              type="primary"
              style={{ position: "absolute", top: "-35px", right: "0" }}
              onClick={() => setIsVesselModalOpen(true)}
            >
              신규 등록
            </Button>
            <AutoComplete
              value={formValues.vesselName}
              onChange={(value) => handleFormChange("vesselName", value)}
              options={vesselNameList.map((name) => ({ value: name }))}
              style={{ width: "100%" }}
              filterOption={(inputValue, option) =>
                option!.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            >
              <Input />
            </AutoComplete>
          </InquiryItemForm>
          <InquiryItemForm
            style={{ flex: "20%" }}
            label="Ref No."
            name="refNumber"
            rules={[{ required: true, message: "Please enter ref number" }]}
          >
            <Input
              value={formValues.refNumber}
              onChange={(e) => handleFormChange("refNumber", e.target.value)}
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <InquiryItemForm label="비고" name="remark" style={{ flex: "50%" }}>
            <Input
              value={formValues.remark}
              onChange={(e) => handleFormChange("remark", e.target.value)}
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center" }}>
            <InquiryItemForm label="의뢰처 검색" name="searchSupplier">
              <AutoComplete
                value={supplierSearch}
                onChange={(value) => handleSearch(value)}
                options={autoSearchSupCompleteOptions}
                style={{ width: "100%" }}
                filterOption={(inputValue, option) =>
                  option!.value.toLowerCase().includes(inputValue.toLowerCase())
                }
              >
                <Input />
              </AutoComplete>
            </InquiryItemForm>
            <Button
              onClick={handleAddSupplier}
              style={{ marginTop: 20, marginRight: 20 }}
            >
              추가
            </Button>
            <span style={{ marginTop: 20, marginRight: 10 }}>
              검색된 의뢰처 목록:{" "}
            </span>
            {uniqueSuppliers.map((supplier) => (
              <Tag
                key={supplier.id}
                style={{
                  borderColor: tagColors[supplier.id] || "default",
                  cursor: "pointer",
                  marginTop: 20,
                }}
                onClick={() => handleTagClick(supplier.id)}
                onClose={() => handleTagClick(supplier.id)}
              >
                {supplier.code}
              </Tag>
            ))}
          </div>
        </FormRow>
        <Button type="primary" onClick={addItem} style={{ margin: "20px 0" }}>
          품목 추가
        </Button>
      </Form>
      {isCustomerModalOpen && (
        <CreateCompanyModal
          category={"customer"}
          onClose={() => setIsCustomerModalOpen(false)}
          onUpdate={() => setIsCustomerModalOpen(false)}
        />
      )}
      {isVesselModalOpen && (
        <CreateVesselModal
          onClose={() => setIsVesselModalOpen(false)}
          onUpdate={() => setIsVesselModalOpen(false)}
        />
      )}
    </>
  );
};

export default InquiryForm;
