import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Button, FloatButton, message, Modal, Select } from "antd";
import { FileSearchOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
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
  InquiryResponse,
  InquiryTable,
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
interface FormValues {
  documentId: number | null;
  docNumber: string;
  registerDate: Dayjs;
  shippingDate: Dayjs;
  customer: string;
  vesselName: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  remark: string;
  supplierName: string;
}

const INITIAL_FORM_VALUES: FormValues = {
  documentId: null,
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
    tableNo: 1,
  },
  {
    itemCode: "",
    itemType: "TYPE",
    unit: "",
    itemName: "[TYPE]",
    qty: 0,
    itemRemark: "",
    position: 2,
    tableNo: 1,
  },
  {
    itemCode: "",
    itemType: "ITEM",
    unit: "",
    itemName: "",
    qty: 0,
    itemRemark: "",
    position: 3,
    tableNo: 1,
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
  communicationLanguage: string;
  supplierRemark: string;
}[] => {
  const supplierMap = new Map<
    number,
    {
      id: number;
      name: string;
      korName: string;
      code: string;
      email: string;
      communicationLanguage: string;
      supplierRemark: string;
    }
  >();
  itemDetails.forEach((item) =>
    item.suppliers?.forEach((supplier: InquiryListSupplier) =>
      supplierMap.set(supplier.supplierId, {
        id: supplier.supplierId,
        name: supplier.companyName,
        korName: supplier.korCompanyName || supplier.companyName,
        code: supplier.code,
        email: supplier.email,
        communicationLanguage: supplier.communicationLanguage || "KOR",
        supplierRemark: supplier.supplierRemark || "",
      })
    )
  );
  return Array.from(supplierMap.values());
};

const MakeInquiry = () => {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { customerInquiryId } = useParams<{ customerInquiryId?: string }>();
  const navigate = useNavigate();
  const [inquiryDetail, setInquiryDetail] = useState<InquiryResponse | null>(
    null
  );
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
    {
      id: number;
      name: string;
      korName: string;
      code: string;
      email: string;
      communicationLanguage: string;
      supplierRemark: string;
    }[]
  >([]);
  const [selectedSupplierTag, setSelectedSupplierTag] = useState<
    {
      id: number;
      name: string;
      korName: string;
      code: string;
      email: string;
      communicationLanguage: string;
    }[]
  >([]);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfSupplierTag, setPdfSupplierTag] = useState<
    {
      id: number;
      name: string;
      korName: string;
      communicationLanguage: string;
    }[]
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
  const [isFromInquirySearchModal, setIsFromInquirySearchModal] =
    useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [headerEditModalVisible, setHeaderEditModalVisible] =
    useState<boolean>(false);
  const [isMailSenderVisible, setIsMailSenderVisible] = useState(false);
  const [isInquirySearchModalVisible, setIsInquirySearchModalVisible] =
    useState(false);
  const [tables, setTables] = useState<InquiryTable[]>([]);
  const [currentTableNo, setCurrentTableNo] = useState<number>(1);

  const modalActions = {
    header: [setHeaderEditModalVisible, () => {}],
    mail: [setIsMailSenderVisible, () => {}],
    inquirySearch: [
      (isVisible: boolean) => {
        setIsInquirySearchModalVisible(isVisible);
        if (!isVisible) {
          setInquirySearchMakerName("");
          setInquirySearchMakerNameResult(null);
        }
      },
      () => {},
    ],
    customer: [setIsCustomerModalOpen, () => {}],
    vessel: [setIsVesselModalOpen, () => {}],
    supplier: [setIsSupplierModalOpen, () => {}],
  };

  const setModalVisibility = (
    modalType: keyof typeof modalActions,
    isVisible: boolean
  ) => {
    modalActions[modalType][0](isVisible);
  };

  const toggleModal = (
    modalType: keyof typeof modalActions,
    isVisible: boolean
  ) => {
    setModalVisibility(modalType, isVisible);
  };

  // Load document data
  const loadDocData = useCallback(async () => {
    try {
      const {
        documentId,
        docNumber,
        registerDate,
        shippingDate,
        currencyType,
        currencyValue,
      } = await fetchDocData();
      setFormValues((prev) => ({
        ...prev,
        documentId,
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
    setInquiryDetail(null);
    if (!customerInquiryId) {
      setIsEditMode(false);
      setDocDataLoading(true); // 데이터 로딩 상태를 true로 설정
      loadDocData(); // 초기 데이터 로딩 호출
    } else {
      fetchDetail();
      setDocDataLoading(false); // 데이터 로딩이 완료되면 false로 설정
    }
  }, [customerInquiryId, loadDocData]);

  const fetchDetail = async () => {
    try {
      const data = await fetchInquiryDetail(Number(customerInquiryId));
      setInquiryDetail(data);
      setIsLoading(false);
    } catch (error) {
      console.error("An error occurred while retrieving details:", error);
      setIsLoading(false);
    }
  };

  // 데이터 로딩 후 상태 업데이트
  useEffect(() => {
    if (docDataloading) {
      return;
    }

    if (customerInquiryId) {
      setIsEditMode(true);

      if (inquiryDetail) {
        const {
          documentId,
          documentNumber,
          registerDate,
          shippingDate,
          companyName,
          refNumber,
          currencyType,
          currency,
          vesselName,
          docRemark,
        } = inquiryDetail.documentInfo;

        setFormValues({
          documentId: documentId,
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

        // 모든 테이블의 itemDetails를 하나의 배열로 합침
        const allItemDetails = inquiryDetail.table.reduce<InquiryItem[]>(
          (acc, table) => [...acc, ...table.itemDetails],
          []
        );

        // position 기준으로 정렬
        const sortedItems = allItemDetails.sort(
          (a, b) => a.position - b.position
        );

        setItems(
          sortedItems.map((item) => ({
            itemDetailId: item.itemDetailId,
            itemId: item.itemId,
            position: item.position,
            itemType: item.itemType as "ITEM" | "MAKER" | "TYPE",
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemRemark: item.itemRemark,
            qty: item.qty,
            unit: item.unit,
            tableNo: item.tableNo,
          }))
        );

        // suppliers 정보가 필요한 경우
        const suppliers = getSupplierMap(
          inquiryDetail.table.reduce<InquiryItem[]>(
            (acc, table) => [...acc, ...table.itemDetails],
            []
          )
        );

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

  const handleInputChange = useCallback(
    (index: number, field: keyof InquiryItem, value: string | number) => {
      setItems((prevItems) => {
        const updatedItems = [...prevItems];
        const itemToUpdate = updatedItems.find(
          (item) => item.tableNo === currentTableNo
        );

        if (itemToUpdate) {
          updatedItems[index] = {
            ...updatedItems[index],
            [field]: value,
          };
        }
        return updatedItems;
      });

      setTables((prevTables) => {
        return prevTables.map((table, tableIndex) => {
          if (tableIndex + 1 === currentTableNo) {
            const updatedItemDetails = [...table.itemDetails];
            if (index < updatedItemDetails.length) {
              updatedItemDetails[index] = {
                ...updatedItemDetails[index],
                [field]: value,
              };
            }
            return {
              ...table,
              itemDetails: updatedItemDetails,
            };
          }
          return table;
        });
      });
    },
    [currentTableNo]
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
      return null; // 저장 실패 시 null 환
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

    // documentInfo 구성
    const documentInfo = {
      docNumber: formValues.docNumber,
      vesselId: selectedVessel.id,
      customerId: selectedCustomerId,
      refNumber: formValues.refNumber,
      registerDate: formValues.registerDate.format("YYYY-MM-DD"),
      shippingDate: formValues.shippingDate.format("YYYY-MM-DD"),
      remark: formValues.remark,
      currencyType: formValues.currencyType,
      currency: parseFloat(formValues.currency as any),
    };

    // customerInquiryTables 구성
    const customerInquiryTables = tables.map((table, index) => {
      const tableNo = index + 1;
      return {
        supplierIdList:
          table.supplierList?.map((supplier) => supplier.supplierId) || [],
        inquiryItemDetails: table.itemDetails.map((item) => ({
          itemId: item.itemId || null,
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemRemark: item.itemRemark,
          qty: item.qty,
          unit: item.unit,
          itemType: item.itemType,
          position: item.position,
          tableNo: tableNo,
        })),
      };
    });

    const requestData = {
      documentInfo,
      customerInquiryTables,
    };

    // Submit the inquiry and get the response
    const response = await submitInquiry(
      formValues.documentId,
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

  // itemId 업데이트를 별도 수로 분리
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

  const handleHeaderSave = (text: string) => {
    setPdfHeader(text);
  };

  const handlePDFPreview = () => {
    setShowPDFPreview((prevState) => !prevState);
  };

  const handleLanguageChange = (value: string, id: number) => {
    // pdfSupplierTag 업데이트
    setPdfSupplierTag((prevTags) => {
      const updatedTags = prevTags.map((tag) =>
        tag.id === id ? { ...tag, communicationLanguage: value } : tag
      );
      return updatedTags;
    });

    // selectedSupplierTag 업데이트
    setSelectedSupplierTag((prevTags) => {
      const updatedSelectedTags = prevTags.map((tag) =>
        tag.id === id ? { ...tag, communicationLanguage: value } : tag
      );
      return updatedSelectedTags;
    });
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

  const removeDuplicates = (
    arr: {
      code: string;
      communicationLanguage: string;
      email: string | null;
      id: number;
      korName: string;
      name: string;
      supplierRemark: string;
    }[]
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

  const uniqueSuppliers = removeDuplicates(selectedSuppliers);

  // 선택된 supplier의 테이블 아이템들을 찾는 함수 추가
  const getSelectedTableItems = useCallback(() => {
    if (!pdfSupplierTag[0]) return [];

    // 선택된 supplier가 포함된 모든 테이블 찾기
    const selectedTables = tables.filter((table) =>
      table.supplierList?.some(
        (supplier) => supplier.supplierId === pdfSupplierTag[0].id
      )
    );

    // 모든 테이블의 itemDetails를 하나의 배열로 합치기
    const allItems = selectedTables.reduce<InquiryItem[]>((acc, table) => {
      return [...acc, ...table.itemDetails];
    }, []);

    // position 순서대로 정렬
    return allItems.sort((a, b) => a.position - b.position);
  }, [tables, pdfSupplierTag]);

  const getAllTableSuppliers = useCallback(() => {
    // 모든 테이블의 supplierList를 하나의 배열로 합침
    const allSuppliers = tables.reduce<InquiryListSupplier[]>((acc, table) => {
      if (table.supplierList) {
        acc.push(...table.supplierList);
      }
      return acc;
    }, []);

    // 중복 제거를 위해 Map 사용
    const supplierMap = new Map();
    allSuppliers.forEach((supplier) => {
      if (!supplierMap.has(supplier.supplierId)) {
        supplierMap.set(supplier.supplierId, {
          id: supplier.supplierId,
          name: supplier.companyName,
          korName: supplier.korCompanyName || supplier.companyName, // fallback to companyName if korCompanyName is undefined
          code: supplier.code,
          email: supplier.email || "", // fallback to empty string if email is undefined
          communicationLanguage: supplier.communicationLanguage || "KOR", // fallback to "KOR" if undefined
        });
      }
    });

    return Array.from(supplierMap.values());
  }, [tables]);

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
          toggleModal={toggleModal}
          isCustomerModalOpen={isCustomerModalOpen}
          isVesselModalOpen={isVesselModalOpen}
          isSupplierModalOpen={isSupplierModalOpen}
          uniqueSuppliers={uniqueSuppliers}
        />
      )}

      <MakeInquiryTable
        items={items}
        inquiryDetail={inquiryDetail}
        handleInputChange={handleInputChange}
        handleItemCodeChange={handleItemCodeChange}
        itemCodeOptions={itemCodeOptions}
        setIsDuplicate={setIsDuplicate}
        setItems={setItems}
        updateItemId={updateItemId}
        customerInquiryId={Number(customerInquiryId)}
        setItemCodeOptions={setItemCodeOptions}
        tables={tables}
        setTables={setTables}
        setCurrentTableNo={setCurrentTableNo}
        uniqueSuppliers={uniqueSuppliers}
      />

      <Button
        type="primary"
        onClick={handleSubmit}
        style={{ margin: "20px 0 0 15px", float: "right" }}
        disabled={
          isDocNumDuplicate || !formValues.docNumber || !formValues.refNumber
        }
      >
        Save
      </Button>
      <Button
        type="primary"
        onClick={() => toggleModal("mail", true)}
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
        onOk={() => toggleModal("mail", false)}
        onCancel={() => toggleModal("mail", false)}
        footer={null}
        width={1200}
      >
        <MailSenderModal
          mode="makeInquiry"
          mailDataList={mailDataList}
          inquiryFormValues={formValues}
          handleSubmit={handleSubmit}
          selectedSupplierTag={getAllTableSuppliers()}
          setFileData={setFileData}
          setIsSendMail={setIsSendMail}
          getItemsForSupplier={(supplierId) => {
            const selectedTables = tables.filter((table) =>
              table.supplierList?.some(
                (supplier) => supplier.supplierId === supplierId
              )
            );
            const allItems = selectedTables.reduce<InquiryItem[]>(
              (acc, table) => {
                return [...acc, ...table.itemDetails];
              },
              []
            );
            return allItems.sort((a, b) => a.position - b.position);
          }}
          vesselInfo={selectedVessel}
          pdfHeader={pdfHeader}
          setPdfFileData={setPdfFileData}
          handleLanguageChange={handleLanguageChange}
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
            const [tableIndex, supplierId] = value.split(":");
            const selectedTable = tables[parseInt(tableIndex)];
            const selectedSupplier = selectedTable?.supplierList?.find(
              (supplier) => supplier.supplierId.toString() === supplierId
            );
            if (selectedSupplier) {
              setPdfSupplierTag([
                {
                  id: selectedSupplier.supplierId,
                  name: selectedSupplier.companyName,
                  communicationLanguage:
                    selectedSupplier.communicationLanguage || "KOR",
                  korName:
                    selectedSupplier.korCompanyName ||
                    selectedSupplier.companyName,
                },
              ]);
            }
          }}
        >
          {tables.map((table, tableIndex) =>
            table.supplierList?.map((supplier) => (
              <Select.Option
                key={`${tableIndex}:${supplier.supplierId}`}
                value={`${tableIndex}:${supplier.supplierId}`}
              >
                {`Table ${tableIndex + 1}: ${supplier.code}`}
              </Select.Option>
            ))
          )}
        </Select>
        <Button
          onClick={() => toggleModal("header", true)}
          style={{ marginLeft: 20 }}
        >
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
          value={pdfSupplierTag[0]?.communicationLanguage}
          onChange={(value) =>
            handleLanguageChange(value, pdfSupplierTag[0]?.id)
          }
        >
          <Select.Option value="KOR">KOR</Select.Option>
          <Select.Option value="ENG">ENG</Select.Option>
        </Select>
        <HeaderEditModal
          open={headerEditModalVisible}
          onClose={() => toggleModal("header", false)}
          onSave={handleHeaderSave}
          pdfCompanyTag={pdfSupplierTag}
        />
      </div>
      {isMailSenderVisible && (
        <PDFGenerator
          selectedSupplierTag={getAllTableSuppliers()}
          formValues={formValues}
          setMailDataList={setMailDataList}
          items={getSelectedTableItems()} // 선택된 테이블의 아이템들만 전달
          vesselInfo={selectedVessel}
          pdfHeader={pdfHeader}
          setPdfFileData={setPdfFileData}
        />
      )}

      {showPDFPreview && (
        <PDFDocument
          formValues={formValues}
          items={getSelectedTableItems()} // 선택된 테이블의 아이템들만 전달
          supplier={pdfSupplierTag[0]}
          vesselInfo={selectedVessel}
          pdfHeader={pdfHeader}
          viewMode={true}
        />
      )}
      <BtnGroup>
        <FloatButton
          type="primary"
          tooltip="Search the maker's inquiries to identify the supplier"
          icon={<FileSearchOutlined />}
          onClick={() => toggleModal("inquirySearch", true)}
        />
        <InquirySearchModal
          isVisible={isInquirySearchModalVisible}
          onClose={() => toggleModal("inquirySearch", false)}
          inquirySearchMakerName={inquirySearchMakerName}
          setInquirySearchMakerName={setInquirySearchMakerName}
          selectedSuppliers={selectedSuppliers}
          inquirySearchMakerNameResult={inquirySearchMakerNameResult}
          handleInquirySearch={handleInquirySearch}
          setSelectedSuppliers={setSelectedSuppliers}
          setIsFromInquirySearchModal={setIsFromInquirySearchModal}
        />
        <FloatButton.BackTop visibilityHeight={0} />
      </BtnGroup>
    </FormContainer>
  );
};

export default MakeInquiry;
