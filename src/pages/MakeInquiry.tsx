import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { Button, Divider, FloatButton, message, Modal, Select } from "antd";
import {
  FileSearchOutlined,
  SaveOutlined,
  MailOutlined,
  FilePdfOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import {
  fetchDocData,
  fetchCompanyNames,
  fetchItemData,
  submitInquiry,
  fetchInquiryDetail,
  searchInquiryWithMaker,
  chkDuplicateDocNum,
} from "../api/api";
import InquiryForm from "../components/makeInquiry/InquiryForm";
import MakeInquiryTable from "../components/makeInquiry/MakeInquiryTable";
import PDFDocument from "../components/makeInquiry/PDFDocument";
import {
  InquiryItem,
  InquiryListSupplier,
  emailSendData,
  VesselList,
  Item,
  InquirySearchMakerInquirySearchResult,
  InquiryResponse,
  InquiryTable,
} from "../types/types";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

const BtnGroup = styled(FloatButton.Group)``;

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
  color: string;
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
  color: "#fff",
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
  const [searchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
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
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 변수 추가
  const [isDocNumDuplicate, setIsDocNumDuplicate] = useState<boolean>(false);
  const [inquirySearchMakerName, setInquirySearchMakerName] = useState("");
  const [inquirySearchMakerNameResult, setInquirySearchMakerNameResult] =
    useState<InquirySearchMakerInquirySearchResult | null>(null);
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

  const fetchDetail = useCallback(async () => {
    try {
      const data = await fetchInquiryDetail(Number(customerInquiryId));
      setInquiryDetail(data);
      setIsLoading(false);
    } catch (error) {
      console.error("An error occurred while retrieving details:", error);
      setIsLoading(false);
    }
  }, [customerInquiryId]);

  // Load document data
  const loadDocData = useCallback(async () => {
    try {
      const docData = await fetchDocData();
      setFormValues((prev) => ({
        ...prev,
        documentId: docData.documentId,
        docNumber: docData.docNumber,
        registerDate: dayjs(docData.registerDate),
        shippingDate: dayjs(docData.shippingDate),
        currencyType: docData.currencyType,
        currency: docData.currencyValue,
      }));
    } catch (error) {
      console.error("Error loading document data:", error);
    } finally {
      setDocDataLoading(false);
      setIsLoading(false);
    }
  }, []);

  // 데이터 초기화 및 로드
  const initializeData = useCallback(() => {
    const resetState = () => {
      setFormValues(INITIAL_FORM_VALUES);
      setItems(INITIAL_TABLE_VALUES);
      setSelectedSuppliers([]);
      setPdfSupplierTag([]);
      setVesselList([]);
      setVesselNameList([]);
      setAutoCompleteOptions([]);
      setItemCodeOptions([]);
      setInquiryDetail(null);
      setTables([]);
      setShowPDFPreview(false);
    };

    resetState();

    if (!customerInquiryId) {
      setIsEditMode(false);
      setDocDataLoading(true);
      loadDocData();
    } else {
      fetchDetail();
      setDocDataLoading(false);
    }
  }, [customerInquiryId, loadDocData, fetchDetail]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // 데이터 로딩 후 상태 업데이트
  useEffect(() => {
    if (docDataloading || !customerInquiryId || !inquiryDetail) {
      return;
    }

    setIsEditMode(true);

    const {
      documentId,
      documentNumber: docNumber,
      registerDate,
      shippingDate,
      companyName,
      refNumber,
      currencyType,
      currency,
      vesselName,
      remark,
      color,
    } = inquiryDetail.documentInfo;

    // Form 값 업데이트
    setFormValues({
      documentId,
      docNumber,
      registerDate: dayjs(registerDate),
      shippingDate: dayjs(shippingDate),
      customer: companyName,
      vesselName,
      refNumber,
      currencyType,
      currency,
      remark: remark || "",
      supplierName: "",
      color: color || "#fff",
    });

    // 아이템 데이터 처리
    const processItemDetails = () => {
      const allItemDetails = inquiryDetail.table.reduce<InquiryItem[]>(
        (acc, table) => [...acc, ...table.itemDetails],
        []
      );

      return allItemDetails
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
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
        }));
    };

    // 공급자 데이터 처리
    const processSuppliers = () => {
      const allItems = inquiryDetail.table.reduce<InquiryItem[]>(
        (acc, table) => [...acc, ...table.itemDetails],
        []
      );
      const suppliers = getSupplierMap(allItems);
      setSelectedSuppliers(suppliers);
    };

    setItems(processItemDetails());
    processSuppliers();
    setIsLoading(false);
  }, [docDataloading, customerInquiryId, inquiryDetail]);

  const checkDuplicateOnMount = useCallback(async () => {
    if (formValues.docNumber) {
      const isDuplicate = await chkDuplicateDocNum(
        formValues.docNumber?.trim(),
        Number(customerInquiryId)
      );
      setIsDocNumDuplicate(isDuplicate);
    }
  }, [formValues.docNumber, customerInquiryId]);

  useEffect(() => {
    checkDuplicateOnMount();
  }, [checkDuplicateOnMount]);

  useEffect(() => {
    const resetCompanyData = () => {
      setSelectedCustomerId(null);
      setVesselNameList([]);
      setVesselList([]);
    };

    const updateVesselData = (selectedCustomer: any) => {
      setSelectedCustomerId(selectedCustomer.id);
      setVesselNameList(
        selectedCustomer.vesselList.map((v: any) => ({
          id: v.id,
          name: v.vesselName,
          imoNumber: v.imoNumber,
        }))
      );
      setVesselList(selectedCustomer.vesselList);
    };

    const searchCompanyName = async (customerName: string) => {
      try {
        const { isExist, customerDetailResponse } = await fetchCompanyNames(
          customerName
        );

        if (!isExist) {
          resetCompanyData();
          return;
        }

        setCompanyNameList(
          customerDetailResponse.map((c) => ({
            companyName: c.companyName,
            code: c.code,
          }))
        );

        const selectedCustomer = customerDetailResponse.find(
          (c) => c.companyName === customerName || c.code === customerName
        );

        selectedCustomer
          ? updateVesselData(selectedCustomer)
          : resetCompanyData();
      } catch (error) {
        console.error("Error fetching company name:", error);
        resetCompanyData();
      }
    };

    const customerName = (formValues.customer + "")?.trim();
    customerName ? searchCompanyName(customerName) : resetCompanyData();
  }, [formValues.customer, isCustomerModalOpen, isVesselModalOpen]);

  useEffect(() => {
    const updateSelectedVessel = () => {
      const vessel = vesselList.find(
        (v) => v.vesselName === formValues.vesselName
      );
      setSelectedVessel(vessel ?? null);
    };

    updateSelectedVessel();
  }, [formValues.vesselName, vesselList]);

  useEffect(() => {
    const getFilteredCompanyOptions = () => {
      const searchTerm = formValues.customer.toLowerCase();

      return companyNameList
        .filter((item) => {
          const companyName = item.companyName.toLowerCase();
          const code = item.code.toLowerCase();
          return companyName.includes(searchTerm) || code.includes(searchTerm);
        })
        .map((item) => item.companyName)
        .filter((value, index, self) => self.indexOf(value) === index)
        .map((name) => ({ value: name }));
    };

    const filteredOptions = getFilteredCompanyOptions();

    setAutoCompleteOptions(filteredOptions);
  }, [companyNameList, formValues.customer]);

  const handleInputChange = useCallback(
    (index: number, field: keyof InquiryItem, value: string | number) => {
      const updateItem = (item: InquiryItem) => ({
        ...item,
        [field]: value,
      });
      setItems((prevItems) => {
        const updatedItems = [...prevItems];
        const itemToUpdate = updatedItems.find(
          (item) => item.tableNo === currentTableNo
        );

        if (itemToUpdate) {
          updatedItems[index] = updateItem(updatedItems[index]);
        }
        return updatedItems;
      });

      setTables((prevTables) =>
        prevTables.map((table, tableIndex) => {
          if (tableIndex + 1 !== currentTableNo) return table;

          const updatedItemDetails = [...table.itemDetails];
          if (index < updatedItemDetails.length) {
            updatedItemDetails[index] = updateItem(updatedItemDetails[index]);
          }

          return {
            ...table,
            itemDetails: updatedItemDetails,
          };
        })
      );
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
    if (formValues.docNumber) {
      const isDuplicate = await chkDuplicateDocNum(
        formValues.docNumber?.trim(),
        Number(customerInquiryId)
      );
      setIsDocNumDuplicate(isDuplicate);

      if (isDuplicate) {
        message.error("Document number is duplicated. please enter another.");
        return null;
      }
    }

    const selectedVessel = vesselList.find(
      (v) => v.vesselName === formValues.vesselName
    );

    // IMO 번호와 Hull 번호 검증
    const isVesselInfoValid = await validateVesselInfo(selectedVessel);
    if (!isVesselInfoValid) return null;

    // 중복 아이템 검증
    if (isDuplicate) {
      const shouldSave = await showDuplicateConfirmModal();
      if (!shouldSave) return null;
    }

    return await saveInquiry();
  };

  // 선박 검증 모달
  const validateVesselInfo = async (
    selectedVessel: VesselList | undefined
  ): Promise<boolean> => {
    if (!selectedVessel?.imoNumber || !selectedVessel?.hullNumber) {
      return await new Promise((resolve) => {
        Modal.confirm({
          title: "IMO number or Hull number is missing.",
          content: (
            <>
              <span style={{ color: selectedVessel?.vesselName ? "" : "red" }}>
                Vessel name: {selectedVessel?.vesselName}
              </span>
              <br />
              <span style={{ color: selectedVessel?.imoNumber ? "" : "red" }}>
                IMO number: {selectedVessel?.imoNumber}
              </span>
              <br />
              <span style={{ color: selectedVessel?.hullNumber ? "" : "red" }}>
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
    }
    return true;
  };

  // 중복 아이템 확인 모달
  const showDuplicateConfirmModal = async (): Promise<boolean> => {
    return await new Promise((resolve) => {
      Modal.confirm({
        title: "There are duplicate items.",
        content: "Do you want to save?",
        okText: "Ok",
        cancelText: "Cancel",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  // 저장 로직
  const saveInquiry = async (): Promise<number | null> => {
    try {
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

      const documentInfo = {
        vesselId: selectedVessel.id,
        customerId: selectedCustomerId,
        documentId: formValues.documentId,
        docNumber: formValues.docNumber,
        registerDate: formValues.registerDate.format("YYYY-MM-DD"),
        shippingDate: formValues.shippingDate.format("YYYY-MM-DD"),
        refNumber: formValues.refNumber,
        remark: formValues.remark,
        currencyType: formValues.currencyType,
        currency: parseFloat(formValues.currency as any),
        color: formValues.color,
      };

      const table = tables.map((table, index) => ({
        supplierIdList:
          table.supplierList?.map((supplier) => supplier.supplierId) || [],
        itemDetails: table.itemDetails.map((item) => ({
          itemDetailId: item.itemDetailId || null,
          itemId: item.itemId || null,
          itemType: item.itemType,
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemRemark: item.itemRemark,
          qty: item.qty,
          unit: item.unit,
          position: item.position,
          tableNo: index + 1,
        })),
      }));

      const requestData = { documentInfo, table };

      const response = await submitInquiry(
        Number(customerInquiryId),
        Number(formValues.documentId),
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

      return response;
    } catch (error) {
      console.error("An error occurred while saving inquiry:", error);
      message.error("Retry Please");
      return null;
    }
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

      if ((value + "")?.trim() === "") {
        updateItemId(index, null);
        return;
      }

      try {
        const itemArray = await fetchAndProcessItemData(value);

        updateItemCodeOptions(itemArray);
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

  const handleHeaderSave = (text: string) => {
    setPdfHeader(text);
  };

  const handlePDFPreview = () => {
    setShowPDFPreview((prevState) => !prevState);
  };

  const handleLanguageChange = useCallback((value: string, id: number) => {
    // tables 상태 업데이트를 통해 한 번에 처리
    setTables((prevTables) =>
      prevTables.map((table) => ({
        ...table,
        supplierList: table.supplierList?.map((supplier) =>
          supplier.supplierId === id
            ? { ...supplier, communicationLanguage: value }
            : supplier
        ),
      }))
    );

    // PDF 생성용 태그만 별도 업데이트
    setPdfSupplierTag((prevTags) =>
      prevTags.map((tag) =>
        tag.id === id ? { ...tag, communicationLanguage: value } : tag
      )
    );
  }, []);

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

    // 모든 테이블의 itemDetails 하나의 배열로 합치기
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

  const memoizedSuppliers = useMemo(
    () => getAllTableSuppliers(),
    [getAllTableSuppliers]
  );

  const handleKeyboardSave = useCallback(
    async (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();

        // 문서번호 중복 체크
        if (formValues.docNumber) {
          const isDuplicate = await chkDuplicateDocNum(
            formValues.docNumber?.trim(),
            Number(customerInquiryId)
          );
          setIsDocNumDuplicate(isDuplicate);

          if (isDuplicate) {
            message.error(
              "Document number is duplicated. please enter another."
            );
            return;
          }
        }

        await handleSubmit();
      }
    },
    [selectedVessel, selectedCustomerId, formValues, tables]
  );

  useEffect(() => {
    // 로딩이 완료된 후에만 이벤트 리스너 등록
    if (!docDataloading && !isLoading) {
      document.addEventListener("keydown", handleKeyboardSave);
      return () => document.removeEventListener("keydown", handleKeyboardSave);
    }
  }, [handleKeyboardSave, docDataloading, isLoading]);

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
          handleFormChange={handleFormChange}
          customerUnreg={!selectedCustomerId}
          vesselUnreg={!selectedVessel?.id}
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
          setTables={setTables}
        />
      )}
      <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
        ITEMS
      </Divider>
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
          isDocNumDuplicate ||
          !formValues.docNumber ||
          !formValues.refNumber?.trim()
        }
      >
        Save
      </Button>
      <Button
        type="primary"
        onClick={() => toggleModal("mail", true)}
        style={{ margin: "20px 0 0 15px", float: "right" }}
        disabled={
          isDocNumDuplicate ||
          !formValues.docNumber ||
          formValues.refNumber?.trim() === ""
        }
      >
        Send Email
      </Button>
      <Button
        type="default"
        onClick={() =>
          navigate({
            pathname: "/customerInquirylist",
            search: searchParamsString,
          })
        }
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
          handleLanguageChange={handleLanguageChange}
          isMailSenderVisible={isMailSenderVisible}
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
          value={
            pdfSupplierTag[0]
              ? `${tables.findIndex((table) =>
                  table.supplierList?.some(
                    (supplier) => supplier.supplierId === pdfSupplierTag[0].id
                  )
                )}:${pdfSupplierTag[0].id}`
              : ""
          }
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
          selectedSupplierTag={memoizedSuppliers}
          formValues={formValues}
          setMailDataList={setMailDataList}
          vesselInfo={selectedVessel}
          pdfHeader={pdfHeader}
        />
      )}

      {showPDFPreview && (
        <PDFDocument
          formValues={formValues}
          items={getSelectedTableItems()}
          supplier={pdfSupplierTag[0]}
          vesselInfo={selectedVessel}
          pdfHeader={pdfHeader}
          viewMode={true}
        />
      )}

      <FloatButton.Group trigger="hover">
        <FloatButton
          type="primary"
          tooltip="Save"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          style={{
            opacity:
              isDocNumDuplicate ||
              !formValues.docNumber ||
              !formValues.refNumber?.trim()
                ? 0.5
                : 1,
            pointerEvents:
              isDocNumDuplicate ||
              !formValues.docNumber ||
              !formValues.refNumber?.trim()
                ? "none"
                : "auto",
          }}
        />
        <FloatButton
          type="primary"
          tooltip="Send Email"
          icon={<MailOutlined />}
          onClick={() => toggleModal("mail", true)}
          style={{
            opacity:
              isDocNumDuplicate ||
              !formValues.docNumber ||
              formValues.refNumber?.trim() === ""
                ? 0.5
                : 1,
            pointerEvents:
              isDocNumDuplicate ||
              !formValues.docNumber ||
              formValues.refNumber?.trim() === ""
                ? "none"
                : "auto",
          }}
        />
        <FloatButton
          tooltip="PDF Preview"
          icon={<FilePdfOutlined />}
          onClick={() => {
            window.scrollTo(0, document.body.scrollHeight);
            setShowPDFPreview(true);
          }}
        />
        <FloatButton
          type="primary"
          tooltip="Search the maker's inquiries to identify the supplier"
          icon={<FileSearchOutlined />}
          onClick={() => toggleModal("inquirySearch", true)}
        />
        <FloatButton.BackTop visibilityHeight={0} />
        <FloatButton
          tooltip="Back"
          icon={<RollbackOutlined />}
          onClick={() =>
            navigate({
              pathname: "/customerInquirylist",
              search: searchParamsString,
            })
          }
        />
      </FloatButton.Group>
      <InquirySearchModal
        isVisible={isInquirySearchModalVisible}
        onClose={() => toggleModal("inquirySearch", false)}
        inquirySearchMakerName={inquirySearchMakerName}
        setInquirySearchMakerName={setInquirySearchMakerName}
        selectedSuppliers={selectedSuppliers}
        inquirySearchMakerNameResult={inquirySearchMakerNameResult}
        handleInquirySearch={handleInquirySearch}
        setSelectedSuppliers={setSelectedSuppliers}
      />
    </FormContainer>
  );
};

export default MakeInquiry;
