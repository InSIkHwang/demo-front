import axios from "../../api/axios";
import React, { Dispatch, SetStateAction, useState } from "react";
import styled from "styled-components";
import { AutoComplete, Input } from "antd";
import "antd/dist/reset.css";
import { Vessel } from "../../types/types";

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  background-color: ${(props) => props.theme.blue};
  color: white;
  border-radius: 4px;
  cursor: pointer;
  display: block;
  margin-left: auto;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${(props) => props.theme.darkBlue};
  }
`;

interface FormProps {
  formData: Vessel;
  setFormData: Dispatch<SetStateAction<Vessel>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  setSelectedCustomer: Dispatch<
    SetStateAction<{ companyName: string; id: number } | null>
  >;
  readOnlyFields: { [key: string]: boolean };
  isEditing: boolean;
  selectedCustomer: { companyName: string; id: number } | null;
}

const Form = ({
  formData,
  setFormData,
  onChange,
  onSubmit,
  readOnlyFields,
  isEditing,
  setSelectedCustomer,
  selectedCustomer,
}: FormProps) => {
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Fetch customer suggestions
  const fetchCustomerSuggestions = async (customerName: string) => {
    if (!customerName.trim()) {
      setCustomerSuggestions([]);
      return;
    }
    setIsCustomerLoading(true);
    try {
      const response = await axios.get(
        `/api/customers/check-name?customerName=${customerName}`
      );
      setCustomerSuggestions(response.data.customerDetailResponse);
    } catch (error) {
      console.error("Error fetching customer suggestions:", error);
      setCustomerError("Error fetching customer suggestions.");
    } finally {
      setIsCustomerLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    fetchCustomerSuggestions(value);
  };

  const handleSelectCustomer = (value: string, option: any) => {
    const selected = option as any;

    setSelectedCustomer({
      companyName: selected.companyName,
      id: selected.id,
    });

    setFormData((prevFormData) => ({
      ...prevFormData,
      customer: {
        ...prevFormData.customer,
        newCustomerName: selected.companyName,
        newCustomerId: selected.id,
      },
    }));
    setCustomerSuggestions([]);
    setCustomerError(null); // Clear any previous error when a customer is selected
  };

  const options = customerSuggestions.map((customer) => ({
    value: customer.companyName,
    label: customer.companyName,
    companyName: customer.companyName,
    id: customer.id,
  }));

  // Handle input change directly
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      customer: {
        ...prevFormData.customer,
        newCustomerName: value,
      },
    }));
    handleSearch(value);
  };

  return (
    <form onSubmit={onSubmit}>
      <FormGroup>
        <Label htmlFor="code">코드:</Label>
        <Input
          id="code"
          name="code"
          value={formData.code}
          onChange={onChange}
          readOnly={readOnlyFields.code}
        />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="vesselName">선명:</Label>
        <Input
          id="vesselName"
          name="vesselName"
          value={formData.vesselName}
          onChange={onChange}
        />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="vesselCompanyName">선박회사:</Label>
        <Input
          id="vesselCompanyName"
          name="vesselCompanyName"
          value={formData.vesselCompanyName}
          onChange={onChange}
        />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="imoNumber">IMO No.:</Label>
        <Input
          id="imoNumber"
          name="imoNumber"
          value={formData.imoNumber}
          onChange={onChange}
        />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="hullNumber">HULL No.:</Label>
        <Input
          id="hullNumber"
          name="hullNumber"
          value={formData.hullNumber}
          onChange={onChange}
        />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="shipYard">SHIPYARD:</Label>
        <Input
          id="shipYard"
          name="shipYard"
          value={formData.shipYard}
          onChange={onChange}
        />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="customerName">저장된 매출처명:</Label>
        <Input
          id="customerName"
          name="customerName"
          value={formData.customer?.companyName || ""}
          onChange={onChange}
          readOnly={readOnlyFields.customerCompanyName}
        />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="newCustomerName">변경할 매출처명:</Label>
        <AutoComplete
          id="newCustomerName"
          value={formData.customer?.newCustomerName || ""}
          onSearch={handleSearch}
          onSelect={handleSelectCustomer}
          placeholder="변경할 매출처명"
          options={options}
          filterOption={(inputValue, option) =>
            (option?.value as string)
              .toUpperCase()
              .includes(inputValue.toUpperCase())
          }
        >
          <Input onChange={handleInputChange} />
        </AutoComplete>
        {customerError && <div style={{ color: "red" }}>{customerError}</div>}
      </FormGroup>
      <h1>선택된 매출처: {selectedCustomer?.companyName}</h1>
      <SubmitButton type="submit">{isEditing ? "수정" : "등록"}</SubmitButton>
    </form>
  );
};

export default Form;
