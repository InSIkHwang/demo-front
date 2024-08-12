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
import {
  Inquiry,
  InquiryItem,
  InquiryListItem,
  InquiryListSupplier,
} from "../types/types";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Styles
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

// Utility functions
const createNewItem = (no: number): InquiryItem => ({
  no,
  itemType: "ITEM",
  itemCode: "",
  itemName: "",
  qty: 0,
  unit: "",
  itemRemark: "",
});

const getSupplierMap = (itemDetails: InquiryListItem[]) => {
  const supplierMap = new Map<number, { id: number; name: string }>();
  itemDetails.forEach((item) =>
    item.suppliers.forEach((supplier) =>
      supplierMap.set(supplier.supplierId, {
        id: supplier.supplierId,
        name: supplier.companyName,
      })
    )
  );
  return Array.from(supplierMap.values());
};

const MakeInquiry = () => {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { customerInquiryId } = useParams<{ customerInquiryId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const inquiryDetail = location.state?.inquiry as Inquiry;

  const [docDataloading, setDocDataLoading] = useState(true);
  const [items, setItems] = useState<InquiryItem[]>([]);
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

  useEffect(() => {
    if (customerInquiryId) {
      setIsEditMode(true);
      if (inquiryDetail) {
        const {
          documentNumber,
          registerDate,
          shippingDate,
          companyName,
          refNumber,
          currencyType,
          currency,
          vesselName,
          docRemark,
          inquiryItemDetails,
        } = inquiryDetail;

        setFormValues({
          docNumber: documentNumber,
          registerDate: dayjs(registerDate),
          shippingDate: dayjs(shippingDate),
          customer: companyName,
          vesselName,
          refNumber,
          currencyType,
          currency,
          remark: docRemark || "",
          supplierName: "",
        });

        setItems(
          inquiryItemDetails.map((item, index) => ({
            itemId: item.itemId,
            no: index + 1,
            itemType: item.inquiryItemType ?? "ITEM",
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemRemark: item.itemRemark,
            qty: item.qty,
            unit: item.unit,
          }))
        );

        setSelectedSupplierTag(getSupplierMap(inquiryItemDetails));
        setSelectedSuppliers(getSupplierMap(inquiryItemDetails));
      }
    } else {
      setIsEditMode(false);
      // 문서 번호 초기화 및 기본 설정
      setFormValues((prev) => ({
        ...prev,
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
      }));
    }
  }, [customerInquiryId, inquiryDetail]);

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

    if (!customerInquiryId) {
      loadDocData();
    } else {
      // `customerInquiryId`가 있는 경우에는 로딩 상태를 종료하도록 설정
      setDocDataLoading(false);
    }
  }, [customerInquiryId]);

  useEffect(() => {
    const searchCompanyName = async (customerName: string) => {
      try {
        const { isExist, customerDetailResponse } = await fetchCompanyNames(
          customerName
        );
        if (isExist) {
          setCompanyNameList(customerDetailResponse.map((c) => c.companyName));
          const selectedCustomer = customerDetailResponse.find(
            (c) => c.companyName === customerName
          );
          if (selectedCustomer) {
            setSelectedCustomerId(selectedCustomer.id);
            setVesselNameList(
              selectedCustomer.vesselList.map((v) => v.vesselName)
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

    if (formValues.customer) {
      searchCompanyName(formValues.customer);
    }
  }, [formValues.customer]);

  useEffect(() => {
    const selectedVessel = vesselList.find(
      (v) => v.vesselName === formValues.vesselName
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

  useEffect(() => {
    const selectedSupplierIds = new Set<number>(
      selectedSuppliers.map((s) => s.id)
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

    setSelectedSuppliers((prev) => [
      ...prev,
      ...Array.from(
        new Map(newSelectedSuppliers.map((s) => [s.id, s])).values()
      ),
    ]);
  }, [itemIdMap, items, supplierOptions]);

  const addItem = () => {
    const nextNo =
      items.length > 0 ? Math.max(...items.map((item) => item.no)) + 1 : 1;
    setItems([...items, createNewItem(nextNo)]);
  };

  const handleDelete = (index: number) => {
    const updatedItems = items
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, no: idx + 1 }));
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
    if (key !== "docNumber" || !isEditMode) {
      // 문서 번호는 수정 불가능, 수정 모드에서는 비활성화
      setFormValues((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = async () => {
    try {
      const selectedVessel = vesselList.find(
        (v) => v.vesselName === formValues.vesselName
      );

      // Map through items and find the corresponding itemDetailId
      const inquiryItemDetails = items.map((item) => {
        const matchingItemDetail = inquiryDetail?.inquiryItemDetails.find(
          (detail) => detail.itemId === item.itemId
        );

        return {
          itemDetailId: matchingItemDetail
            ? matchingItemDetail.itemDetailId
            : null,
          itemId: item.itemId || null,
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemRemark: item.itemRemark,
          qty: item.qty,
          unit: item.unit,
          itemType: item.itemType,
          supplierIdList: selectedSupplierTag.map((supplier) => supplier.id),
        };
      });

      const requestData = {
        documentNumber: formValues.docNumber,
        vesselId: selectedVessel ? selectedVessel.id : null,
        customerId: selectedCustomerId,
        refNumber: formValues.refNumber,
        registerDate: formValues.registerDate.format("YYYY-MM-DD"),
        shippingDate: formValues.shippingDate.format("YYYY-MM-DD"),
        remark: formValues.remark,
        currencyType: formValues.currencyType,
        currency: parseFloat(formValues.currency as any),
        inquiryItemDetails,
      };

      console.log(requestData);

      // Modify documentNumber for edit mode
      if (isEditMode) {
        requestData.documentNumber = formValues.docNumber;
      }

      await submitInquiry(
        formValues.docNumber,
        Number(customerInquiryId),
        requestData,
        isEditMode
      );
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
        onClick={() => setShowPDFPreview((prev) => !prev)}
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
