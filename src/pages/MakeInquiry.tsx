import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Button, message } from "antd";
import axios from "../api/axios";
import MakeInquiryTable from "../components/makeInquiry/MakeInquiryTable";
import InquiryForm from "./InquiryForm";
import dayjs from "dayjs";

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

const createNewItem = (no: number) => ({
  no,
  itemType: "ITEM",
  itemCode: "",
  itemName: "",
  qty: 0,
  unit: "",
  itemRemark: "",
});

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

const MakeInquiry = () => {
  const [items, setItems] = useState<InquiryItem[]>([createNewItem(1)]);
  const [itemCount, setItemCount] = useState(2);
  const [supplierCount, setSupplierCount] = useState(0);
  const [vesselList, setVesselList] = useState<
    { id: number; vesselName: string }[]
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

  const [formValues, setFormValues] = useState({
    registerDate: dayjs(),
    shippingDate: dayjs(),
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
    setItems([...items, createNewItem(itemCount)]);
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
    setFormValues((prev) => ({ ...prev, [key]: value }));
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
      resetForm();
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      message.error("Failed to submit inquiry. Please try again.");
    }
  };

  const resetForm = () => {
    setFormValues({
      registerDate: dayjs(),
      shippingDate: dayjs(),
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
    setItems([createNewItem(1)]);
    setItemCount(2);
  };

  const searchCompanyName = async (customerName: string) => {
    try {
      const response = await axios.get<{
        isExist: boolean;
        customerDetailResponse: Customer[];
      }>(`/api/customers/check-name?customerName=${customerName}`);
      const { isExist, customerDetailResponse } = response.data;

      if (isExist) {
        setCompanyNameList(
          customerDetailResponse.map((customer) => customer.companyName)
        );
        const selectedCustomer = customerDetailResponse.find(
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

      const newItemIdMap = items.reduce((acc, item) => {
        acc[item.itemCode] = item.itemId;
        return acc;
      }, {} as { [key: string]: number });

      setItemNameMap(newItemNameMap);
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
      setSupplierOptions(
        response.data.suppliers.map((supplier) => ({
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
    setSelectedSuppliers((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      if (!existingIds.has(supplier.id)) {
        return [...prev, supplier];
      }
      return prev;
    });
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
      <InquiryForm
        formValues={formValues}
        autoCompleteOptions={autoCompleteOptions}
        vesselNameList={vesselNameList}
        supplierOptions={supplierOptions}
        selectedSuppliers={selectedSuppliers}
        handleFormChange={handleFormChange}
        handleInputChange={handleInputChange}
        handleItemCodeChange={handleItemCodeChange}
        handleSupplierSearch={handleSupplierSearch}
        handleSupplierSelect={handleSupplierSelect}
        handleTagClose={handleTagClose}
        addItem={addItem}
      />
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
    </FormContainer>
  );
};

export default MakeInquiry;
