import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Button, message, Modal } from "antd";
import axios from "../api/axios";
import MakeInquiryTable from "../components/makeInquiry/MakeInquiryTable";
import InquiryForm from "../components/makeInquiry/InquiryForm";
import dayjs from "dayjs";

// Define styles
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

// Define interfaces
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

interface Item {
  itemId: number;
  itemCode: string;
  itemName: string;
  supplierList: {
    id: number;
    code: string;
    companyName: string;
    phoneNumber: string;
    representative: string;
    email: string;
    communicationLanguage: string;
  }[];
}

const MakeInquiry = () => {
  const [items, setItems] = useState<InquiryItem[]>([createNewItem(1)]);
  const [itemCount, setItemCount] = useState(2);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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

  // Effect to handle form customer changes
  useEffect(() => {
    if (formValues.customer) {
      searchCompanyName(formValues.customer);
    }
  }, [formValues.customer]);

  // Effect to update vessel id based on vessel name
  useEffect(() => {
    const selectedVessel = vesselList.find(
      (vessel) => vessel.vesselName === formValues.vesselName
    );
    setSelectedVesselId(selectedVessel ? selectedVessel.id : null);
  }, [formValues.vesselName, vesselList]);

  // Effect to update auto-complete options
  useEffect(() => {
    setAutoCompleteOptions(
      companyNameList
        .filter((name) =>
          name.toLowerCase().includes(formValues.customer.toLowerCase())
        )
        .map((name) => ({ value: name }))
    );
  }, [companyNameList, formValues.customer]);

  // Effect to handle item ID map change and update selected suppliers
  useEffect(() => {
    const newSelectedSuppliers = Object.entries(itemIdMap).reduce(
      (acc, [itemCode, itemId]) => {
        const item = items.find((item) => item.itemCode === itemCode);
        if (item) {
          return [
            ...acc,
            { id: itemId, name: item.itemName }, // Add relevant details here
          ];
        }
        return acc;
      },
      [] as { id: number; name: string }[]
    );

    setSelectedSuppliers(newSelectedSuppliers);
  }, [itemIdMap, items]);

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
      const response = await axios.get<{ items: Item | Item[] }>(
        `/api/item-supplier?itemCode=${itemCode}`
      );
      // Convert items to an array if it is not already
      const items = Array.isArray(response.data.items)
        ? response.data.items
        : [response.data.items];

      const newItemNameMap = items.reduce<{ [key: string]: string }>(
        (acc, item) => {
          acc[item.itemCode] = item.itemName;
          return acc;
        },
        {}
      );

      const newItemIdMap = items.reduce<{ [key: string]: number }>(
        (acc, item) => {
          acc[item.itemCode] = item.itemId;
          return acc;
        },
        {}
      );

      // Extract suppliers from items and update the supplier options
      const newSupplierOptions = items.flatMap((item) =>
        item.supplierList.map((supplier) => ({
          value: supplier.companyName,
          id: supplier.id,
        }))
      );

      setItemCodeOptions(items.map((item) => ({ value: item.itemCode })));
      setItemNameMap(newItemNameMap);
      setItemIdMap(newItemIdMap);
      setSupplierOptions(newSupplierOptions);

      if (newItemNameMap[itemCode]) {
        handleInputChange(index, "itemName", newItemNameMap[itemCode]);
      }
    } catch (error) {
      console.error("Error fetching item codes and suppliers:", error);
    }
  };

  const handleItemCodeChange = (index: number, value: string) => {
    handleInputChange(index, "itemCode", value);
    searchItemCode(value, index);
  };

  const handleSupplierSelect = (
    value: string,
    option: { value: string; id: number }
  ) => {
    setSelectedSuppliers((prev) => {
      const existingSuppliers = new Map(prev.map((s) => [s.id, s]));

      existingSuppliers.set(option.id, { id: option.id, name: value });

      return Array.from(existingSuppliers.values());
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
        handleSupplierSearch={() => {}}
        handleSupplierSelect={handleSupplierSelect}
        handleTagClose={handleTagClose}
        addItem={addItem}
        customerUnreg={!selectedCustomerId}
        vesselUnreg={!selectedVesselId}
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
