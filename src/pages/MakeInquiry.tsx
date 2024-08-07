import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Button, message, Select } from "antd";
import dayjs from "dayjs";
import {
  fetchDocData,
  fetchCompanyNames,
  fetchItemData,
  submitInquiry,
} from "../api/api";
import InquiryForm from "../components/makeInquiry/InquiryForm";
import MakeInquiryTable from "../components/makeInquiry/MakeInquiryTable";
import PDFDocument from "../components/makeInquiry/PDFDocument";
import { Customer, InquiryItem, Item } from "../types/types";

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

// Define interfaces and constants
const createNewItem = (no: number): InquiryItem => ({
  no,
  itemType: "ITEM",
  itemCode: "",
  itemName: "",
  qty: 0,
  unit: "",
  itemRemark: "",
});

const MakeInquiry = () => {
  const [docDataloading, setDocDataLoading] = useState(true);
  const [items, setItems] = useState<InquiryItem[]>([createNewItem(1)]);
  const [itemCount, setItemCount] = useState(2);
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
    { value: string; id: number; itemId: number }[]
  >([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedSupplierTag, setSelectedSupplierTag] = useState<
    { id: number; name: string }[]
  >([]);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfSupplierTag, setPdfSupplierTag] = useState<
    { id: number; name: string }[]
  >([]);

  const [formValues, setFormValues] = useState({
    docNumber: "",
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

  const togglePDFPreview = () => {
    setShowPDFPreview((prev) => !prev);
  };

  // Load document data
  useEffect(() => {
    const loadDocData = async () => {
      try {
        const {
          docNumber,
          registerDate,
          shippingDate,
          currencyType,
          currencyValue,
        } = await fetchDocData();
        setFormValues((prev) => ({
          ...prev,
          docNumber,
          registerDate: dayjs(registerDate),
          shippingDate: dayjs(shippingDate),
          currencyType,
          currency: currencyValue,
        }));
      } catch (error) {
        console.error("Error loading document data:", error);
      } finally {
        setDocDataLoading(false);
      }
    };
    loadDocData();
  }, []);

  // Update auto-complete options when customer changes
  useEffect(() => {
    if (formValues.customer) {
      const searchCompanyName = async (customerName: string) => {
        try {
          const { isExist, customerDetailResponse } = await fetchCompanyNames(
            customerName
          );
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
      searchCompanyName(formValues.customer);
    }
  }, [formValues.customer]);

  // Update vessel ID based on vessel name
  useEffect(() => {
    const selectedVessel = vesselList.find(
      (vessel) => vessel.vesselName === formValues.vesselName
    );
    setSelectedVesselId(selectedVessel ? selectedVessel.id : null);
  }, [formValues.vesselName, vesselList]);

  // Update auto-complete options
  useEffect(() => {
    setAutoCompleteOptions(
      companyNameList
        .filter((name) =>
          name.toLowerCase().includes(formValues.customer.toLowerCase())
        )
        .map((name) => ({ value: name }))
    );
  }, [companyNameList, formValues.customer]);

  // Update selected suppliers based on item selections
  useEffect(() => {
    const selectedSupplierIds = new Set<number>(
      selectedSuppliers.map((supplier) => supplier.id)
    );

    items.forEach((item) => {
      const supplierIds = supplierOptions
        .filter((option) => itemIdMap[item.itemCode] === option.itemId)
        .map((option) => option.id);

      supplierIds.forEach((id) => selectedSupplierIds.add(id));
    });

    const newSelectedSuppliers = supplierOptions
      .filter((option) => selectedSupplierIds.has(option.id))
      .map((supplier) => ({ id: supplier.id, name: supplier.value }));

    const uniqueSuppliers = Array.from(
      new Map(
        newSelectedSuppliers.map((supplier) => [supplier.id, supplier])
      ).values()
    );

    setSelectedSuppliers((prev) => {
      const prevSupplierIds = new Set(prev.map((supplier) => supplier.id));
      const updatedSuppliers = uniqueSuppliers.filter(
        (supplier) => !prevSupplierIds.has(supplier.id)
      );
      return [...prev, ...updatedSuppliers];
    });
  }, [itemIdMap, items, supplierOptions]);

  // Handler functions
  const addItem = () => {
    const nextNo =
      items.length > 0 ? Math.max(...items.map((item) => item.no)) + 1 : 1;
    setItems([...items, createNewItem(nextNo)]);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      no: idx + 1,
    }));
    setItems(updatedItems);
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
          itemId: item.itemId || null,
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemRemark: item.itemRemark,
          qty: item.qty,
          unit: item.unit,
          itemType: item.itemType,
          supplierIdList: selectedSupplierTag.map((supplier) => supplier.id),
        })),
      };
      await submitInquiry(formValues.docNumber, requestData);
      message.success("Inquiry submitted successfully!");
      resetForm();
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      message.error("Failed to submit inquiry. Please try again.");
    }
  };

  const resetForm = () => {
    setFormValues({
      docNumber: "",
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

  const handleItemCodeChange = (index: number, value: string) => {
    handleInputChange(index, "itemCode", value);
    const searchItemCode = async () => {
      try {
        const { items } = await fetchItemData(value);
        const itemArray = Array.isArray(items) ? items : [items];

        const newItemNameMap = itemArray.reduce<{ [key: string]: string }>(
          (acc, item) => {
            acc[item.itemCode] = item.itemName;
            return acc;
          },
          {}
        );

        const newItemIdMap = itemArray.reduce<{ [key: string]: number }>(
          (acc, item) => {
            acc[item.itemCode] = item.itemId;
            return acc;
          },
          {}
        );

        const newSupplierOptions = itemArray.flatMap((item) =>
          item.supplierList.map((supplier) => ({
            value: supplier.companyName,
            id: supplier.id,
            itemId: supplier.itemId,
          }))
        );

        setItemCodeOptions(itemArray.map((item) => ({ value: item.itemCode })));
        setItemNameMap(newItemNameMap);
        setItemIdMap(newItemIdMap);

        setSupplierOptions((prevOptions) => [
          ...prevOptions,
          ...newSupplierOptions.filter(
            (newSupplier) =>
              !prevOptions.some(
                (existingSupplier) => existingSupplier.id === newSupplier.id
              )
          ),
        ]);

        if (newItemNameMap[value]) {
          handleInputChange(index, "itemName", newItemNameMap[value]);
        }

        if (newItemIdMap[value]) {
          setItems((prevItems) => {
            const updatedItems = [...prevItems];
            updatedItems[index] = {
              ...updatedItems[index],
              itemId: newItemIdMap[value],
            };
            return updatedItems;
          });
        }
      } catch (error) {
        console.error("Error fetching item codes and suppliers:", error);
      }
    };
    searchItemCode();
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

  if (docDataloading) {
    return <div>Loading...</div>;
  }

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
        setSelectedSupplierTag={setSelectedSupplierTag}
        setSelectedSuppliers={setSelectedSuppliers}
      />
      <MakeInquiryTable
        items={items}
        handleInputChange={handleInputChange}
        handleItemCodeChange={handleItemCodeChange}
        itemCodeOptions={itemCodeOptions}
        handleDelete={handleDelete}
      />
      <Button
        type="primary"
        onClick={handleSubmit}
        style={{ marginTop: "20px", float: "right" }}
      >
        저장하기
      </Button>
      <Button
        onClick={togglePDFPreview}
        style={{ marginTop: "20px", float: "left" }}
      >
        {showPDFPreview ? "PDF 미리보기 닫기" : "PDF 미리보기"}
      </Button>
      <div
        style={{
          display: "flex",
          marginTop: 20,
          alignItems: "center",
          paddingLeft: 20,
        }}
      >
        <span>의뢰처: </span>
        <Select
          style={{ width: 200, float: "left", marginLeft: 10 }}
          onChange={(value) => {
            const selected = selectedSupplierTag.find(
              (tag) => tag.name === value
            );
            if (selected) {
              setPdfSupplierTag([selected]);
            }
          }}
        >
          {selectedSupplierTag.map((tag) => (
            <Select.Option key={tag.id} value={tag.name}>
              {tag.name}
            </Select.Option>
          ))}
        </Select>
      </div>
      {showPDFPreview && (
        <PDFDocument
          formValues={formValues}
          items={items}
          selectedSupplierName={
            pdfSupplierTag.length > 0 ? pdfSupplierTag[0].name : ""
          }
        />
      )}
    </FormContainer>
  );
};

export default MakeInquiry;
