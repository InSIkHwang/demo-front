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
  InquiryListSupplier,
  emailSendData,
  VesselList,
  Item,
} from "../types/types";
import { useNavigate, useParams } from "react-router-dom";
import HeaderEditModal from "../components/makeInquiry/HeaderEditModal";
import MailSenderModal from "../components/makeInquiry/MailSenderModal";
import PDFGenerator from "../components/makeInquiry/PDFGenerator";
import LoadingSpinner from "../components/LoadingSpinner";

// Styles
const FormContainer = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  padding-bottom: 80px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 80vw;
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

const createNewItem = (position: number): InquiryItem => ({
  position,
  itemType: "ITEM",
  itemCode: "",
  itemName: "",
  qty: 0,
  unit: "",
  itemRemark: "",
});

const getSupplierMap = (
  itemDetails: InquiryItem[]
): { id: number; name: string; code: string; email: string }[] => {
  const supplierMap = new Map<
    number,
    { id: number; name: string; code: string; email: string }
  >();
  itemDetails.forEach((item) =>
    item.suppliers?.forEach((supplier: InquiryListSupplier) =>
      supplierMap.set(supplier.supplierId, {
        id: supplier.supplierId,
        name: supplier.companyName,
        code: supplier.code,
        email: supplier.email,
      })
    )
  );
  return Array.from(supplierMap.values());
};

const MakeInquiry = () => {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { customerInquiryId } = useParams<{ customerInquiryId?: string }>();
  const navigate = useNavigate();
  const [inquiryDetail, setInquiryDetail] = useState<Inquiry>();
  const [docDataloading, setDocDataLoading] = useState(true);
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [vesselList, setVesselList] = useState<VesselList[]>([]);
  const [companyNameList, setCompanyNameList] = useState<
    { companyName: string; code: string }[]
  >([]);
  const [vesselNameList, setVesselNameList] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [selectedVessel, setSelectedVessel] = useState<VesselList | null>(null);

  const [autoCompleteOptions, setAutoCompleteOptions] = useState<
    { value: string }[]
  >([]);
  const [itemCodeOptions, setItemCodeOptions] = useState<
    {
      value: string;
      name: string;
      key: string;
      label: string;
    }[]
  >([]);
  const [itemNameMap, setItemNameMap] = useState<{ [key: string]: string }>({});
  const [itemIdMap, setItemIdMap] = useState<{ [key: string]: number }>({});
  const [supplierOptions, setSupplierOptions] = useState<
    { value: string; id: number; itemId: number; code: string; email: string }[]
  >([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<
    { id: number; name: string; code: string; email: string }[]
  >([]);
  const [selectedSupplierTag, setSelectedSupplierTag] = useState<
    { id: number; name: string; code: string; email: string }[]
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
  const [mailDataList, setMailDataList] = useState<emailSendData[]>([]);
  const [loadMailData, setLoadMailData] = useState<boolean>(false);
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("KOR");
  const [fileData, setFileData] = useState<File[]>([]);
  const [pdfFileData, setPdfFileData] = useState<File[]>([]);
  const [isSendMail, setIsSendMail] = useState<boolean>(false);
  const [isPdfAutoUploadChecked, setIsPdfAutoUploadChecked] = useState(true);

  useEffect(() => {
    if (customerInquiryId) {
      fetchDetail();
    }
  }, []);

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
    if (!customerInquiryId) {
      setIsEditMode(false);
      // 데이터 초기화
      setFormValues(INITIAL_FORM_VALUES);
      setItems([]);
      setSelectedSuppliers([]);
      setSelectedSupplierTag([]);
      setPdfSupplierTag([]);
      setVesselList([]);
      setVesselNameList([]);
      setAutoCompleteOptions([]);
      setItemCodeOptions([]);
      setItemNameMap({});
      setItemIdMap({});
      setSupplierOptions([]);
      setDocDataLoading(true); // 데이터 로딩 상태를 true로 설정

      loadDocData(); // 초기 데이터 로딩 호출
    } else {
      setDocDataLoading(false); // 데이터 로딩이 완료되면 false로 설정
    }
  }, [customerInquiryId, loadDocData]);

  const fetchDetail = async () => {
    try {
      const data = await fetchInquiryDetail(Number(customerInquiryId));
      setInquiryDetail(data);
    } catch (error) {
      console.error("An error occurred while retrieving details:", error);
    }
  };

  // 데이터 로딩 후 상태 업데이트
  useEffect(() => {
    if (docDataloading) {
      return;
    }

    if (customerInquiryId) {
      setIsEditMode(true);

      // Edit 모드에서의 로직
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
            itemDetailId: item.itemDetailId,
            itemId: item.itemId,
            position: item.position,
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
    }
  }, [docDataloading, customerInquiryId, inquiryDetail]);

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
              selectedCustomer.vesselList.map((v) => ({
                id: v.id,
                name: v.vesselName,
              }))
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

  const addItem = () => {
    const nextNo =
      items.length > 0
        ? Math.max(...items.map((item) => item.position)) + 1
        : 1;
    setItems([...items, createNewItem(nextNo)]);
  };

  const handleDelete = (index: number) => {
    const updatedItems = items
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, position: idx + 1 }));
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
      // 중복 검사 여부에 따라 적절한 처리를 수행합니다.

      if (isDuplicate) {
        // Modal.confirm을 사용하여 사용자에게 확인을 요청합니다.
        const result = await new Promise((resolve, reject) => {
          Modal.confirm({
            title: "There are duplicate items.",
            content: "Do you want to save?",
            okText: "Ok",
            cancelText: "Cancel",
            onOk: () => resolve(true), // 확인 버튼 클릭 시 true를 resolve
            onCancel: () => resolve(false), // 취소 버튼 클릭 시 false를 resolve
          });
        });

        if (result) {
          // 확인 버튼을 클릭한 경우 저장 작업을 수행합니다.
          await saveInquiry();
          return true; // 저장 성공
        } else {
          return false; // 저장 취소
        }
      } else {
        // 중복 검사가 필요 없는 경우 직접 저장 작업을 수행합니다.
        await saveInquiry();
        return true; // 저장 성공
      }
    } catch (error) {
      // 모든 오류는 이곳에서 처리합니다.
      console.error("An error occurred while saving inquiry:", error);
      message.error("Retry Please");
      return false; // 저장 실패
    }
  };

  // 저장 로직을 함수로 분리
  const saveInquiry = async () => {
    // 선택된 vessel 및 customer 확인
    const selectedVessel = vesselList.find(
      (v) => v.vesselName === formValues.vesselName
    );

    if (!selectedVessel) {
      message.error("Please register Vessel!");
      return;
    }

    if (!selectedCustomerId) {
      message.error("Please register Customer!");
      return;
    }

    const inquiryItemDetails = items.map((item) => {
      return {
        position: item.position,
        itemDetailId: item.itemDetailId,
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

    message.success("Saved successfully!");

    const newInquiryDetail = await fetchInquiryDetail(
      Number(isEditMode ? customerInquiryId : response)
    );

    navigate(`/makeinquiry/${response}`, {
      state: { inquiry: newInquiryDetail },
    });
  };

  const handleItemCodeChange = async (index: number, value: string) => {
    handleInputChange(index, "itemCode", value);

    if (value.trim() === "") {
      updateItemId(index, null);
      return;
    }

    try {
      const itemArray = await fetchAndProcessItemData(value);

      updateItemCodeOptions(itemArray);
      updateItemMaps(itemArray);
      await updateSupplierOptions(itemArray);

      const selectedItem = itemArray.find((item) => item.itemCode === value);
      if (selectedItem) {
        handleInputChange(index, "itemName", itemNameMap[selectedItem.itemId]);
        updateItemId(index, selectedItem.itemId);
      }
    } catch (error) {
      console.error("Error fetching item codes and suppliers:", error);
    }
  };

  const fetchAndProcessItemData = async (value: string) => {
    const { items } = await fetchItemData(value);
    return Array.isArray(items) ? items : [items];
  };

  const updateItemCodeOptions = (itemArray: Item[]) => {
    setItemCodeOptions(
      itemArray.map((item) => ({
        value: item.itemCode,
        name: item.itemName,
        key: item.itemId.toString(),
        label: `${item.itemCode}: ${item.itemName}`,
        itemId: item.itemId,
      }))
    );
  };

  const updateItemMaps = (itemArray: Item[]) => {
    const newItemNameMap = itemArray.reduce<{ [key: number]: string }>(
      (acc, item) => {
        acc[item.itemId] = item.itemName;
        return acc;
      },
      {}
    );

    const newItemIdMap = itemArray.reduce<{ [key: number]: number }>(
      (acc, item) => {
        acc[item.itemId] = item.itemId;
        return acc;
      },
      {}
    );

    setItemNameMap(newItemNameMap);
    setItemIdMap(newItemIdMap);
  };

  const updateSupplierOptions = (itemArray: Item[]) => {
    const newSupplierOptions = itemArray.flatMap((item) =>
      item.supplierList.map((supplier) => ({
        id: supplier.id,
        name: supplier.companyName,
        code: supplier.code,
        email: supplier.email,
      }))
    );

    setSelectedSuppliers((prevSuppliers) => [
      ...prevSuppliers.filter(
        (existingSupplier) =>
          !newSupplierOptions.some(
            (newSupplier) => existingSupplier.id === newSupplier.id
          )
      ),
      ...newSupplierOptions,
    ]);
  };

  // itemId 업데이트를 별도의 함수로 분리
  const updateItemId = (index: number, itemId: number | null) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        itemId,
      };
      return updatedItems;
    });
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

  const handlePDFPreview = () => {
    setShowPDFPreview((prevState) => !prevState);
  };

  if (docDataloading) {
    return <LoadingSpinner />;
  }
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  return (
    <FormContainer>
      <Title>견적요청서 작성(MAKE INQUIRY)</Title>
      {formValues.docNumber && (
        <InquiryForm
          formValues={formValues}
          autoCompleteOptions={autoCompleteOptions}
          vesselNameList={vesselNameList}
          supplierOptions={supplierOptions}
          selectedSuppliers={selectedSuppliers}
          handleFormChange={handleFormChange}
          customerUnreg={!selectedCustomerId}
          vesselUnreg={!selectedVessel?.id}
          setSelectedSupplierTag={setSelectedSupplierTag}
          setSelectedSuppliers={setSelectedSuppliers}
        />
      )}
      <MakeInquiryTable
        items={items}
        handleInputChange={handleInputChange}
        handleItemCodeChange={handleItemCodeChange}
        itemCodeOptions={itemCodeOptions}
        handleDelete={handleDelete}
        setIsDuplicate={setIsDuplicate}
        setItems={setItems}
        addItem={addItem}
        updateItemId={updateItemId}
        customerInquiryId={Number(customerInquiryId)}
      />
      <Button
        type="primary"
        onClick={handleSubmit}
        style={{ margin: "20px 0 0 15px", float: "right" }}
      >
        Save
      </Button>
      <Button
        type="primary"
        onClick={showMailSenderModal}
        style={{ margin: "20px 0 0 15px", float: "right" }}
      >
        Send Email
      </Button>
      <Button
        type="default"
        onClick={() => navigate("/customerInquirylist")}
        style={{ margin: "20px 0 0 15px", float: "right" }}
      >
        Back
      </Button>
      <Modal
        title="Send Mail"
        open={isMailSenderVisible}
        onOk={handleMailSenderOk}
        onCancel={handleMailSenderCancel}
        footer={null}
        width={800}
      >
        <MailSenderModal
          mailDataList={mailDataList}
          inquiryFormValues={formValues}
          handleSubmit={handleSubmit}
          selectedSupplierTag={selectedSupplierTag}
          setFileData={setFileData}
          setIsSendMail={setIsSendMail}
          isPdfAutoUploadChecked={isPdfAutoUploadChecked}
          setIsPdfAutoUploadChecked={setIsPdfAutoUploadChecked}
          items={items}
          vesselInfo={selectedVessel}
          pdfHeader={pdfHeader}
          language={language}
          setPdfFileData={setPdfFileData}
        />
      </Modal>
      <div
        style={{
          display: "flex",
          marginTop: 20,
          alignItems: "center",
          paddingLeft: 20,
        }}
      >
        <span>Supplier: </span>
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
          Edit Header Text
        </Button>
        <Button
          type="default"
          onClick={handlePDFPreview}
          style={{ marginLeft: "10px" }}
        >
          {showPDFPreview ? "Close Preview" : "PDF Preview"}
        </Button>
        <span style={{ marginLeft: 20 }}>LANGUAGE: </span>
        <Select
          style={{ width: 100, float: "left", marginLeft: 10 }}
          value={language}
          onChange={handleLanguageChange}
        >
          <Select.Option value="KOR">KOR</Select.Option>
          <Select.Option value="ENG">ENG</Select.Option>
        </Select>
        <HeaderEditModal
          open={headerEditModalVisible}
          onClose={handleCloseHeaderModal}
          onSave={handleHeaderSave}
          pdfCompanyTag={pdfSupplierTag}
        />
      </div>
      <PDFGenerator
        selectedSupplierTag={selectedSupplierTag}
        formValues={formValues}
        setMailDataList={setMailDataList}
        items={items}
        vesselInfo={selectedVessel}
        pdfHeader={pdfHeader}
        language={language}
        setPdfFileData={setPdfFileData}
      />
      {showPDFPreview && (
        <PDFDocument
          formValues={formValues}
          items={items}
          supplierName={pdfSupplierTag.length > 0 ? pdfSupplierTag[0].name : ""}
          vesselInfo={selectedVessel}
          pdfHeader={pdfHeader}
          viewMode={true}
          language={language}
        />
      )}
    </FormContainer>
  );
};

export default MakeInquiry;
