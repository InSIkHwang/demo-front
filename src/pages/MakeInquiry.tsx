import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Button, message, Modal, Select } from "antd";
import dayjs from "dayjs";
import {
  fetchDocData,
  fetchCompanyNames,
  fetchItemData,
  submitInquiry,
  fetchInquiryDetail,
} from "../api/api";
import InquiryForm from "../components/makeInquiry/InquiryForm";
import MakeInquiryTable from "../components/makeInquiry/MakeInquiryTable";
import PDFDocument from "../components/makeInquiry/PDFDocument";
import {
  Inquiry,
  InquiryItem,
  InquiryListItem,
  VesselList,
} from "../types/types";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import HeaderEditModal from "../components/makeInquiry/HeaderEditModal";
import MailSenderComponent from "../components/makeInquiry/MailSenderComponent";

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

// Constants
const INITIAL_FORM_VALUES = {
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
};

const createNewItem = (no: number): InquiryItem => ({
  no,
  itemType: "ITEM",
  itemCode: "",
  itemName: "",
  qty: 0,
  unit: "",
  itemRemark: "",
});

const getSupplierMap = (
  itemDetails: InquiryListItem[]
): { id: number; name: string; code: string }[] => {
  const supplierMap = new Map<
    number,
    { id: number; name: string; code: string }
  >();
  itemDetails.forEach((item) =>
    item.suppliers.forEach((supplier) =>
      supplierMap.set(supplier.supplierId, {
        id: supplier.supplierId,
        name: supplier.companyName,
        code: supplier.code,
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
  const [vesselList, setVesselList] = useState<VesselList[]>([]);
  const [companyNameList, setCompanyNameList] = useState<
    { companyName: string; code: string }[]
  >([]);
  const [vesselNameList, setVesselNameList] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [selectedVessel, setSelectedVessel] = useState<VesselList | null>(null);

  const [autoCompleteOptions, setAutoCompleteOptions] = useState<
    { value: string }[]
  >([]);
  const [itemCodeOptions, setItemCodeOptions] = useState<{ value: string }[]>(
    []
  );
  const [itemNameMap, setItemNameMap] = useState<{ [key: string]: string }>({});
  const [itemIdMap, setItemIdMap] = useState<{ [key: string]: number }>({});
  const [supplierOptions, setSupplierOptions] = useState<
    { value: string; id: number; itemId: number; code: string }[]
  >([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<
    { id: number; name: string; code: string }[]
  >([]);
  const [selectedSupplierTag, setSelectedSupplierTag] = useState<
    { id: number; name: string; code: string }[]
  >([]);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfSupplierTag, setPdfSupplierTag] = useState<
    { id: number; name: string }[]
  >([]);
  const [headerEditModalVisible, setHeaderEditModalVisible] =
    useState<boolean>(false);
  const [pdfHeader, setPdfHeader] = useState<string>("");
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
  const [isMailSenderVisible, setIsMailSenderVisible] = useState(false);

  // Load document data
  const loadDocData = useCallback(async () => {
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
  }, []);

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
            itemType: item.itemType,
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemRemark: item.itemRemark,
            qty: item.qty,
            unit: item.unit,
          }))
        );

        const suppliers = getSupplierMap(inquiryItemDetails);
        setSelectedSupplierTag(suppliers);
        setSelectedSuppliers(suppliers);
      }
    } else {
      setIsEditMode(false);
      setFormValues(INITIAL_FORM_VALUES);
    }
  }, [customerInquiryId, inquiryDetail]);

  useEffect(() => {
    if (!customerInquiryId) {
      loadDocData();
    } else {
      setDocDataLoading(false);
    }
  }, [customerInquiryId, loadDocData]);

  useEffect(() => {
    const searchCompanyName = async (customerName: string) => {
      try {
        const { isExist, customerDetailResponse } = await fetchCompanyNames(
          customerName
        );
        if (isExist) {
          // Map the response to include both companyName and code
          setCompanyNameList(
            customerDetailResponse.map((c) => ({
              companyName: c.companyName,
              code: c.code,
            }))
          );

          const selectedCustomer = customerDetailResponse.find(
            (c) => c.companyName === customerName || c.code === customerName
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

    if (formValues.customer.trim() !== "") {
      searchCompanyName(formValues.customer);
    } else {
      setCompanyNameList([]);
      setSelectedCustomerId(null);
      setVesselNameList([]);
      setVesselList([]);
    }
  }, [formValues.customer]);

  useEffect(() => {
    const selectedVessel = vesselList.find(
      (v) => v.vesselName === formValues.vesselName
    );
    setSelectedVessel(selectedVessel ?? null);
  }, [formValues.vesselName, vesselList]);

  useEffect(() => {
    const searchTerm = formValues.customer.toLowerCase();

    const filteredOptions = companyNameList
      .filter(
        (item) =>
          item.companyName.toLowerCase().includes(searchTerm) ||
          item.code.toLowerCase().includes(searchTerm)
      )
      .map((item) => ({ value: item.companyName }));

    setAutoCompleteOptions(filteredOptions);
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
      .map((supplier) => ({
        id: supplier.id,
        name: supplier.value,
        code: supplier.code,
      }));

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
      setFormValues((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = async () => {
    try {
      const selectedVessel = vesselList.find(
        (v) => v.vesselName === formValues.vesselName
      );
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

      if (isEditMode) {
        requestData.documentNumber = formValues.docNumber;
      }

      // Submit the inquiry and get the response
      const response = await submitInquiry(
        formValues.docNumber,
        Number(customerInquiryId),
        requestData,
        isEditMode
      );

      message.success("성공적으로 저장 되었습니다!");

      if (isEditMode) {
        const newInquiryDetail = await fetchInquiryDetail(
          Number(customerInquiryId)
        );

        navigate(`/makeinquiry/${response}`, {
          state: { inquiry: newInquiryDetail },
        });
      } else {
        const newInquiryDetail = await fetchInquiryDetail(Number(response));

        navigate(`/makeinquiry/${response}`, {
          state: { inquiry: newInquiryDetail },
        });
      }
    } catch (error) {
      console.error("견적서 저장 중 오류 발생:", error);
      message.error("다시 시도해 주세요");
    }
  };

  const handleItemCodeChange = (index: number, value: string) => {
    handleInputChange(index, "itemCode", value);

    if (value.trim() === "") {
      return;
    }

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
            code: supplier.code,
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
    option: { value: string; id: number; code: string }
  ) => {
    setSelectedSuppliers((prev) => {
      const existingSuppliers = new Map(prev.map((s) => [s.id, s]));
      existingSuppliers.set(option.id, {
        id: option.id,
        name: value,
        code: option.code,
      });
      return Array.from(existingSuppliers.values());
    });
    handleFormChange("supplierName", "");
  };

  const handleTagClose = (id: number) => {
    setSelectedSuppliers((prev) =>
      prev.filter((supplier) => supplier.id !== id)
    );
  };

  const handleOpenHeaderModal = () => {
    setHeaderEditModalVisible(true);
  };

  const handleCloseHeaderModal = () => {
    setHeaderEditModalVisible(false);
  };

  const handleHeaderSave = (text: string) => {
    setPdfHeader(text);
  };

  const showMailSenderModal = () => {
    setIsMailSenderVisible(true);
  };

  const handleMailSenderOk = () => {
    setIsMailSenderVisible(false);
  };

  const handleMailSenderCancel = () => {
    setIsMailSenderVisible(false);
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
        vesselUnreg={!selectedVessel?.id}
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
        style={{ margin: "20px 0 0 15px", float: "right" }}
      >
        저장하기
      </Button>
      <Button
        type="primary"
        onClick={showMailSenderModal}
        style={{ margin: "20px 0 0 15px", float: "right" }}
      >
        메일 발송
      </Button>
      <Modal
        title="Send Mail"
        visible={isMailSenderVisible}
        onOk={handleMailSenderOk}
        onCancel={handleMailSenderCancel}
        footer={null}
      >
        <MailSenderComponent />
      </Modal>
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
        <Button onClick={handleOpenHeaderModal} style={{ marginLeft: 20 }}>
          머릿글 수정
        </Button>
        <HeaderEditModal
          visible={headerEditModalVisible}
          onClose={handleCloseHeaderModal}
          onSave={handleHeaderSave}
          pdfSupplierTag={pdfSupplierTag}
        />
      </div>
      {showPDFPreview && (
        <PDFDocument
          formValues={formValues}
          items={items}
          selectedSupplierName={
            pdfSupplierTag.length > 0 ? pdfSupplierTag[0].name : ""
          }
          vesselInfo={selectedVessel}
          pdfHeader={pdfHeader}
        />
      )}
    </FormContainer>
  );
};

export default MakeInquiry;
