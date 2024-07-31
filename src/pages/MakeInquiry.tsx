import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  message,
  AutoComplete,
  Tag,
} from "antd";
import moment from "moment";
import axios from "../api/axios";
import MakeInquiryTable from "../components/makeInquiry/MakeInquiryTable";

const { Option } = Select;

const FormContainer = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  padding-bottom: 80px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 70vw;
  margin: 0 auto;
  margin-bottom: 200px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
`;

const InquiryItemForm = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

const FormRow = styled.div`
  display: flex;
`;

interface Customer {
  id: number;
  code: string;
  companyName: string;
  phoneNumber: string;
  representative: string;
  email: string;
  address: string;
  country: string;
  communicationLanguage: string;
  modifiedAt: string;
  vesselList: Array<{
    id: number;
    code: string;
    vesselName: string;
    vesselCompanyName: string;
    imoNumber: number;
    hullNumber: string;
    shipYard: string;
  }>;
}

interface InquiryItem {
  no: number;
  itemType: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  itemRemark: string;
}

const MAX_REQUESTERS = 5;

const createNewItem = (no: number, supplierCount: number): InquiryItem => ({
  no,
  itemType: "ITEM",
  itemCode: "",
  itemName: "",
  qty: 0,
  unit: "",
  itemRemark: "",
});

const MakeInquiry = () => {
  const [items, setItems] = useState<InquiryItem[]>([createNewItem(1, 3)]);
  const [itemCount, setItemCount] = useState(2);
  const [supplierCount, setSupplierCount] = useState(0);
  const [vesselList, setVesselList] = useState<
    Array<{ id: number; vesselName: string }>
  >([]);

  const [companyNameList, setCompanyNameList] = useState<string[]>([]);
  const [vesselNameList, setVesselNameList] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);

  const [autoCompleteOptions, setAutoCompleteOptions] = useState<
    { value: string }[]
  >([]);

  const [itemCodeOptions, setItemCodeOptions] = useState<{ value: string }[]>(
    []
  );
  const [itemNameMap, setItemNameMap] = useState<{ [key: string]: string }>({});
  const [itemIdMap, setItemIdMap] = useState<{ [key: string]: number }>({});
  const [supplierOptions, setSupplierOptions] = useState<
    { value: string; id: number }[]
  >([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<
    { id: number; name: string }[]
  >([]);

  const itemTypeMap: Record<string, string> = {
    "1": "MAKER",
    "2": "TYPE",
    "3": "DESC",
    "4": "ITEM",
  };

  const [formValues, setFormValues] = useState({
    registerDate: moment().startOf("day"),
    shippingDate: moment().startOf("day"),
    customer: "",
    vesselName: "",
    refNumber: "",
    currencyType: "USD",
    currency: 0,
    remark: "",
    supplierName: "",
  });

  useEffect(() => {
    if (formValues.customer) {
      searchCompanyName(formValues.customer);
    }
  }, [formValues.customer]);

  useEffect(() => {
    const selectedVessel = vesselList.find(
      (vessel) => vessel.vesselName === formValues.vesselName
    );

    setSelectedVesselId(selectedVessel ? selectedVessel.id : null);
  }, [formValues.vesselName, vesselList]);

  useEffect(() => {
    setAutoCompleteOptions(
      companyNameList
        .filter((name) =>
          name.toLowerCase().includes(formValues.customer.toLowerCase())
        )
        .map((name) => ({ value: name }))
    );
  }, [companyNameList, formValues.customer]);

  const addItem = () => {
    setItems([...items, createNewItem(itemCount, supplierCount)]);
    setItemCount(itemCount + 1);
  };

  const handleInputChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];

      newItems[index] = { ...newItems[index], [field]: value };

      return newItems;
    });
  };

  const handleFormChange = <K extends keyof typeof formValues>(
    key: K,
    value: (typeof formValues)[K]
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const selectedVessel = vesselList.find(
        (vessel) => vessel.vesselName === formValues.vesselName
      );

      const requestData = {
        vesselId: selectedVessel ? selectedVessel.id : null,
        customerId: selectedCustomerId,
        refNumber: formValues.refNumber,
        registerDate: formValues.registerDate.format("YYYY-MM-DD"),
        shippingDate: formValues.shippingDate.format("YYYY-MM-DD"),
        remark: formValues.remark,
        currencyType: formValues.currencyType,
        currency: parseFloat(formValues.currency as any),
        inquiryItemDetails: items.map((item) => ({
          itemId: itemIdMap[item.itemCode] || null,
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemRemark: item.itemRemark,
          qty: item.qty,
          unit: item.unit,
          itemType: item.itemType,
          supplierIdList: selectedSuppliers.map((supplier) => supplier.id),
        })),
      };

      await axios.post("/api/customer-inquiries", requestData);

      message.success("Inquiry submitted successfully!");
      setFormValues({
        registerDate: moment().startOf("day"),
        shippingDate: moment().startOf("day"),
        customer: "",
        vesselName: "",
        refNumber: "",
        currencyType: "USD",
        currency: 0,
        remark: "",
        supplierName: "",
      });
      setSelectedCustomerId(null);
      setSelectedVesselId(null);
      setItems([createNewItem(1, supplierCount)]);
      setItemCount(2);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      message.error("Failed to submit inquiry. Please try again.");
    }
  };

  const searchCompanyName = async (customerName: string) => {
    try {
      const response = await axios.get<{
        isExist: boolean;
        customerDetailResponse: Customer[];
      }>(`/api/customers/check-name?customerName=${customerName}`);

      if (response.data.isExist) {
        setCompanyNameList(
          response.data.customerDetailResponse.map(
            (customer) => customer.companyName
          )
        );

        const selectedCustomer = response.data.customerDetailResponse.find(
          (customer) => customer.companyName === customerName
        );

        if (selectedCustomer) {
          setSelectedCustomerId(selectedCustomer.id);
          setVesselNameList(
            selectedCustomer.vesselList.map((vessel) => vessel.vesselName)
          );
          setVesselList(selectedCustomer.vesselList);
        } else {
          setSelectedCustomerId(null);
          setVesselNameList([]);
          setVesselList([]);
        }
      } else {
        setCompanyNameList([]);
        setSelectedCustomerId(null);
        setVesselNameList([]);
        setVesselList([]);
      }
    } catch (error) {
      console.error("Error fetching company name:", error);
    }
  };

  const searchItemCode = async (itemCode: string, index: number) => {
    try {
      const response = await axios.get<{
        items: { itemId: number; itemCode: string; itemName: string }[];
      }>(`/api/items/search/itemCode?itemCode=${itemCode}`);

      const items = response.data.items;
      setItemCodeOptions(items.map((item) => ({ value: item.itemCode })));

      const newItemNameMap = items.reduce((acc, item) => {
        acc[item.itemCode] = item.itemName;
        return acc;
      }, {} as { [key: string]: string });

      setItemNameMap(newItemNameMap);

      const newItemIdMap = items.reduce((acc, item) => {
        acc[item.itemCode] = item.itemId;
        return acc;
      }, {} as { [key: string]: number });

      setItemIdMap(newItemIdMap);

      if (newItemNameMap[itemCode]) {
        handleInputChange(index, "itemName", newItemNameMap[itemCode]);
      }
    } catch (error) {
      console.error("Error fetching item codes:", error);
    }
  };

  const handleItemCodeChange = (index: number, value: string) => {
    handleInputChange(index, "itemCode", value);
    searchItemCode(value, index);
  };

  const handleSupplierSearch = async (value: string) => {
    try {
      const response = await axios.get<{
        suppliers: { id: number; companyName: string }[];
      }>(`/api/suppliers/search?companyName=${value}`);

      const suppliers = response.data.suppliers;

      setSupplierOptions(
        suppliers.map((supplier) => ({
          value: supplier.companyName,
          id: supplier.id,
        }))
      );
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleSupplierSelect = (
    value: string,
    option: { value: string; id: number }
  ) => {
    const supplier = { id: option.id, name: value };
    // 현재 선택된 공급업체의 ID를 Set으로 변환
    const currentIds = new Set(
      selectedSuppliers.map((supplier) => supplier.id)
    );

    // 새로운 공급업체 ID가 Set에 없으면 추가
    if (!currentIds.has(supplier.id)) {
      setSelectedSuppliers((prev) => [...prev, supplier]);
    }
    handleFormChange("supplierName", "");
  };

  const handleTagClose = (id: number) => {
    setSelectedSuppliers((prev) =>
      prev.filter((supplier) => supplier.id !== id)
    );
  };

  return (
    <FormContainer>
      <Title>견적요청서 작성</Title>
      <Form layout="vertical" initialValues={formValues}>
        <FormRow>
          <InquiryItemForm
            label="작성일자"
            name="registerDate"
            rules={[{ required: true, message: "Please select register date" }]}
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
          >
            <DatePicker
              value={formValues.shippingDate}
              onChange={(date) => handleFormChange("shippingDate", date!)}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="매출처"
            name="customer"
            rules={[{ required: true, message: "Please enter customer" }]}
          >
            <AutoComplete
              value={formValues.customer}
              onChange={(value) => handleFormChange("customer", value)}
              options={autoCompleteOptions}
              style={{ width: "100%" }}
              filterOption={(inputValue, option) =>
                option!.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            >
              <Input />
            </AutoComplete>
          </InquiryItemForm>
          <InquiryItemForm
            label="선박명"
            name="vesselName"
            rules={[{ required: true, message: "Please enter vessel name" }]}
          >
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
            style={{ flex: "40%" }}
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
          <InquiryItemForm label="비고" name="remark" style={{ flex: "50%" }}>
            <Input
              value={formValues.remark}
              onChange={(e) => handleFormChange("remark", e.target.value)}
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <InquiryItemForm label="의뢰처" name="supplierName">
            <AutoComplete
              value={formValues.supplierName}
              onChange={(value) => handleFormChange("supplierName", value)}
              onSearch={handleSupplierSearch}
              onSelect={handleSupplierSelect}
              options={supplierOptions}
              style={{ width: "50%" }}
              filterOption={(inputValue, option) =>
                option!.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            >
              <Input />
            </AutoComplete>
            <div style={{ marginTop: 10 }}>
              {selectedSuppliers.map((supplier) => (
                <Tag
                  key={supplier.id}
                  closable
                  onClose={() => handleTagClose(supplier.id)}
                >
                  {supplier.name}
                </Tag>
              ))}
            </div>
          </InquiryItemForm>
        </FormRow>
        <Button type="primary" onClick={addItem} style={{ margin: "20px 0" }}>
          품목 추가
        </Button>
        <MakeInquiryTable
          items={items}
          handleInputChange={handleInputChange}
          handleItemCodeChange={handleItemCodeChange}
          itemCodeOptions={itemCodeOptions}
        />
        <Button
          type="primary"
          onClick={handleSubmit}
          style={{ marginTop: "20px", float: "right" }}
        >
          저장하기
        </Button>
      </Form>
    </FormContainer>
  );
};

export default MakeInquiry;
