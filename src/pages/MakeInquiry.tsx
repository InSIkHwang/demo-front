import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Button, FloatButton, message, Modal, Select } from "antd";
import { FileSearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchDocData,
  fetchCompanyNames,
  fetchItemData,
  submitInquiry,
  fetchInquiryDetail,
  searchInquiryWithMaker,
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
  InquirySearchMakerInquirySearchResult,
} from "../types/types";
import { useNavigate, useParams } from "react-router-dom";
import HeaderEditModal from "../components/makeInquiry/HeaderEditModal";
import MailSenderModal from "../components/makeInquiry/MailSenderModal";
import PDFGenerator from "../components/makeInquiry/PDFGenerator";
import LoadingSpinner from "../components/LoadingSpinner";
import InquirySearchModal from "../components/makeInquiry/InquirySearchModal";

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

const BtnGroup = styled(FloatButton.Group)`
  bottom: 10vh;
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

const INITIAL_TABLE_VALUES: InquiryItem[] = [
  {
    itemCode: "",
    itemType: "MAKER",
    unit: "",
    itemName: "[MAKER]",
    qty: 0,
    itemRemark: "",
    position: 1,
  },
  {
    itemCode: "",
    itemType: "TYPE",
    unit: "",
    itemName: "[TYPE]",
    qty: 0,
    itemRemark: "",
    position: 2,
  },
  {
    itemCode: "",
    itemType: "ITEM",
    unit: "",
    itemName: "",
    qty: 0,
    itemRemark: "",
    position: 3,
  },
];

const getSupplierMap = (
  itemDetails: InquiryItem[]
): {
  id: number;
  name: string;
  korName: string;
  code: string;
  email: string;
}[] => {
  const supplierMap = new Map<
    number,
    { id: number; name: string; korName: string; code: string; email: string }
  >();
  itemDetails.forEach((item) =>
    item.suppliers?.forEach((supplier: InquiryListSupplier) =>
      supplierMap.set(supplier.supplierId, {
        id: supplier.supplierId,
        name: supplier.companyName,
        korName: supplier.korCompanyName || supplier.companyName,
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
    { id: number; name: string; imoNumber: number }[]
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
      itemId: number;
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
    { id: number; name: string; korName: string; code: string; email: string }[]
  >([]);
  const [selectedSupplierTag, setSelectedSupplierTag] = useState<
    { id: number; name: string; korName: string; code: string; email: string }[]
  >([]);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfSupplierTag, setPdfSupplierTag] = useState<
    { id: number; name: string; korName: string }[]
  >([]);
  const [pdfHeader, setPdfHeader] = useState<string>("");
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
  const [mailDataList, setMailDataList] = useState<emailSendData[]>([]);
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("KOR");
  const [fileData, setFileData] = useState<File[]>([]);
  const [pdfFileData, setPdfFileData] = useState<File[]>([]);
  const [isSendMail, setIsSendMail] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 변수 추가
  const [isDocNumDuplicate, setIsDocNumDuplicate] = useState<boolean>(false);
  const [inquiryId, setInquiryId] = useState<number | null>(null);
  const [inquirySearchMakerName, setInquirySearchMakerName] = useState("");
  const [inquirySearchMakerNameResult, setInquirySearchMakerNameResult] =
    useState<InquirySearchMakerInquirySearchResult | null>(null);

  const [tagColors, setTagColors] = useState<{ [id: number]: string }>({});
  const [isFromInquirySearchModal, setIsFromInquirySearchModal] =
    useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [headerEditModalVisible, setHeaderEditModalVisible] =
    useState<boolean>(false);
  const [isMailSenderVisible, setIsMailSenderVisible] = useState(false);
  const [isInquirySearchModalVisible, setIsInquirySearchModalVisible] =
    useState(false);

  const setModalVisibility = (
    modalType: "header" | "mail" | "inquirySearch",
    isVisible: boolean
  ) => {
    if (modalType === "header") {
      setHeaderEditModalVisible(isVisible);
    } else if (modalType === "mail") {
      setIsMailSenderVisible(isVisible);
    } else if (modalType === "inquirySearch") {
      setIsInquirySearchModalVisible(isVisible);
      if (!isVisible) {
        setInquirySearchMakerName("");
        setInquirySearchMakerNameResult(null);
      }
    }
  };

  // Edit Header Modal 열기/닫기
  const handleOpenHeaderModal = () => setModalVisibility("header", true);
  const handleCloseHeaderModal = () => setModalVisibility("header", false);

  // Mail Sender Modal 열기/닫기
  const showMailSenderModal = () => setModalVisibility("mail", true);
  const handleMailSenderOk = () => setModalVisibility("mail", false);
  const handleMailSenderCancel = () => setModalVisibility("mail", false);

  // Inquiry Search Modal 열기/닫기
  const openInquirySearchMakerModal = () =>
    setModalVisibility("inquirySearch", true);
  const closeInquirySearchMakerModal = () =>
    setModalVisibility("inquirySearch", false);

  useEffect(() => {
    if (customerInquiryId) {
      fetchDetail();
    } else {
      setFormValues(INITIAL_FORM_VALUES);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (isFromInquirySearchModal && selectedSuppliers.length > 0) {
      const lastSupplier = selectedSuppliers[selectedSuppliers.length - 1];
      handleTagClick(lastSupplier.id);
      setIsFromInquirySearchModal(false); // 플래그를 초기화하여 다른 곳에서는 실행되지 않도록 함
    }
  }, [selectedSuppliers, isFromInquirySearchModal]);

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
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!customerInquiryId) {
      setIsEditMode(false);
      // 데이터 초기화
      setFormValues(INITIAL_FORM_VALUES);
      setItems(INITIAL_TABLE_VALUES);
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
      setIsLoading(false);
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
      setIsLoading(false);
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
                imoNumber: v.imoNumber,
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

    if ((formValues.customer + "").trim() !== "") {
      searchCompanyName(formValues.customer);
    } else {
      setCompanyNameList([]);
      setSelectedCustomerId(null);
      setVesselNameList([]);
      setVesselList([]);
    }
  }, [formValues.customer, isCustomerModalOpen, isVesselModalOpen]);

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
      .map((item) => item.companyName) // 배열의 값만 가져옴
      .filter((value, index, self) => self.indexOf(value) === index) // 중복 제거

      .map((item) => ({ value: item })); // 객체 형태로 변환

    setAutoCompleteOptions(filteredOptions);
  }, [companyNameList, formValues.customer]);

  const handleDelete = (index: number) => {
    const updatedItems = items
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, position: idx + 1 }));
    setItems(updatedItems);
  };

  const handleInputChange = useCallback(
    (index: number, field: string, value: string | number) => {
      setItems((prevItems) => {
        const updatedItems = [...prevItems];
        const itemToUpdate = updatedItems[index];

        if (itemToUpdate[field] === value) return updatedItems;

        itemToUpdate[field] = value;
        return updatedItems;
      });
    },
    []
  );

  const handleFormChange = <K extends keyof typeof formValues>(
    key: K,
    value: (typeof formValues)[K]
  ) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (): Promise<number | null> => {
    const selectedVessel = vesselList.find(
      (v) => v.vesselName === formValues.vesselName
    );

    try {
      // imoNumber와 hullNumber 체크
      if (!selectedVessel?.imoNumber || !selectedVessel?.hullNumber) {
        const result = await new Promise((resolve) => {
          Modal.confirm({
            title: "IMO number or Hull number is missing.",
            content: (
              <>
                <span
                  style={{ color: selectedVessel?.vesselName ? "" : "red" }}
                >
                  Vessel name: {selectedVessel?.vesselName}
                </span>
                <br />
                <span style={{ color: selectedVessel?.imoNumber ? "" : "red" }}>
                  IMO number: {selectedVessel?.imoNumber}
                </span>
                <br />
                <span
                  style={{ color: selectedVessel?.hullNumber ? "" : "red" }}
                >
                  Hull number: {selectedVessel?.hullNumber}
                </span>
                <br />
                <br />
                Do you want to proceed with saving?
              </>
            ),
            okText: "Ok",
            cancelText: "Cancel",
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });

        if (!result) {
          return null; // 저장 취소
        }
      }

      if (isDuplicate) {
        const result = await new Promise((resolve) => {
          Modal.confirm({
            title: "There are duplicate items.",
            content: "Do you want to save?",
            okText: "Ok",
            cancelText: "Cancel",
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });

        if (result) {
          const savedInquiryId = await saveInquiry(); // 저장 후 inquiryId 반환
          return savedInquiryId;
        } else {
          return null; // 저장 취소
        }
      } else {
        const savedInquiryId = await saveInquiry(); // 저장 후 inquiryId 반환
        return savedInquiryId;
      }
    } catch (error) {
      console.error("An error occurred while saving inquiry:", error);
      message.error("Retry Please");
      return null; // 저장 실패 시 null 반환
    }
  };

  // 저장 로직을 함수로 분리
  const saveInquiry = async (): Promise<number | null> => {
    // 선택된 vessel 및 customer 확인
    const selectedVessel = vesselList.find(
      (v) => v.vesselName === formValues.vesselName
    );

    if (!selectedVessel) {
      message.error("Please register Vessel!");
      return null;
    }

    if (!selectedCustomerId) {
      message.error("Please register Customer!");
      return null;
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

    setInquiryId(response);

    message.success("Saved successfully!");

    const newInquiryDetail = await fetchInquiryDetail(
      Number(isEditMode ? customerInquiryId : response)
    );

    navigate(`/makeinquiry/${response}`, {
      state: { inquiry: newInquiryDetail },
    });

    return response;
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

  const handleItemCodeChange = useCallback(
    async (index: number, value: string) => {
      handleInputChange(index, "itemCode", value?.trim());

      if ((value + "").trim() === "") {
        updateItemId(index, null);
        return;
      }

      try {
        const itemArray = await fetchAndProcessItemData(value);

        updateItemCodeOptions(itemArray);
        updateItemMaps(itemArray);
      } catch (error) {
        console.error("Error fetching item codes and suppliers:", error);
      }
    },
    [handleInputChange]
  );

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

  const updateSupplierOptions = async (value: string) => {
    try {
      const itemArray = await fetchAndProcessItemData(value);

      const newSupplierOptions = itemArray.flatMap((item) =>
        item.supplierList.map((supplier) => ({
          id: supplier.id,
          name: supplier.companyName,
          korName: supplier.korCompanyName || supplier.companyName,
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
    } catch (error) {
      console.error("Error fetching item codes and suppliers:", error);
    }
  };

  const handleHeaderSave = (text: string) => {
    setPdfHeader(text);
  };

  const handlePDFPreview = () => {
    setShowPDFPreview((prevState) => !prevState);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const fetchInquirySearchResults = async () => {
    if (!inquirySearchMakerName) return;
    try {
      const result = await searchInquiryWithMaker(inquirySearchMakerName);
      setInquirySearchMakerNameResult(result);
    } catch (error) {
      console.error("Search Error:", error);
    }
  };

  const handleInquirySearch = () => {
    fetchInquirySearchResults(); // 검색 수행
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
            message.error("Only up to 5 supplier can be registered.");
            return currentTags;
          }
          setTagColors((prevColors) => ({ ...prevColors, [id]: "#007bff" }));
          return [...currentTags, newTag];
        }
        return currentTags;
      }
    });
  };

  if (docDataloading || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <FormContainer>
      <Title>견적요청서 작성(MAKE INQUIRY)</Title>
      {formValues !== INITIAL_FORM_VALUES && (
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
          isEditMode={isEditMode}
          isDocNumDuplicate={isDocNumDuplicate}
          setIsDocNumDuplicate={setIsDocNumDuplicate}
          customerInquiryId={Number(customerInquiryId)}
          tagColors={tagColors}
          setTagColors={setTagColors}
          handleTagClick={handleTagClick}
          isCustomerModalOpen={isCustomerModalOpen}
          setIsCustomerModalOpen={setIsCustomerModalOpen}
          isVesselModalOpen={isVesselModalOpen}
          setIsVesselModalOpen={setIsVesselModalOpen}
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
        updateItemId={updateItemId}
        customerInquiryId={Number(customerInquiryId)}
        setItemCodeOptions={setItemCodeOptions}
        updateSupplierOptions={updateSupplierOptions}
      />
      <Button
        type="primary"
        onClick={handleSubmit}
        style={{ margin: "20px 0 0 15px", float: "right" }}
        disabled={isDocNumDuplicate}
      >
        Save
      </Button>
      <Button
        type="primary"
        onClick={showMailSenderModal}
        style={{ margin: "20px 0 0 15px", float: "right" }}
        disabled={isDocNumDuplicate}
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
        width={1200}
      >
        <MailSenderModal
          mode="makeInquiry"
          mailDataList={mailDataList}
          inquiryFormValues={formValues}
          handleSubmit={handleSubmit}
          selectedSupplierTag={selectedSupplierTag}
          setFileData={setFileData}
          setIsSendMail={setIsSendMail}
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
      {isMailSenderVisible && (
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
      )}

      {showPDFPreview && (
        <PDFDocument
          formValues={formValues}
          items={items}
          supplierName={
            pdfSupplierTag.length > 0
              ? language === "ENG"
                ? pdfSupplierTag[0].name
                : pdfSupplierTag[0].korName
              : ""
          }
          vesselInfo={selectedVessel}
          pdfHeader={pdfHeader}
          viewMode={true}
          language={language}
        />
      )}
      <BtnGroup>
        <FloatButton
          type="primary"
          tooltip="Search the maker's inquiries to identify the supplier"
          icon={<FileSearchOutlined />}
          onClick={openInquirySearchMakerModal}
        />
        <InquirySearchModal
          isVisible={isInquirySearchModalVisible}
          onClose={closeInquirySearchMakerModal}
          inquirySearchMakerName={inquirySearchMakerName}
          setInquirySearchMakerName={setInquirySearchMakerName}
          selectedSuppliers={selectedSuppliers}
          handleTagClick={handleTagClick}
          inquirySearchMakerNameResult={inquirySearchMakerNameResult}
          handleInquirySearch={handleInquirySearch}
          tagColors={tagColors}
          setSelectedSuppliers={setSelectedSuppliers}
          setIsFromInquirySearchModal={setIsFromInquirySearchModal}
        />
        <FloatButton.BackTop visibilityHeight={0} />
      </BtnGroup>
    </FormContainer>
  );
};

export default MakeInquiry;
