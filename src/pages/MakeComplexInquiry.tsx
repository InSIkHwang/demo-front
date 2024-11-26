import { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import {
  Alert,
  Button,
  Divider,
  FloatButton,
  message,
  Modal,
  Select,
} from "antd";
import { FileSearchOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import {
  fetchDocData,
  fetchCompanyNames,
  fetchItemData,
  searchInquiryWithMaker,
  chkDuplicateDocNum,
  fetchComplexInquiryDetail,
  submitComplexInquiry,
} from "../api/api";
import InquiryForm from "../components/MakeComplexInquiry/InquiryForm";
import PDFDocument from "../components/makeInquiry/PDFDocument";
import {
  emailSendData,
  VesselList,
  InquirySearchMakerInquirySearchResult,
  ComplexInquiry,
  ComplexInquiryItemDetail,
  InvCharge,
  FormValuesType,
  offerEmailSendData,
  HeaderFormData,
} from "../types/types";
import { useNavigate, useParams } from "react-router-dom";
import HeaderEditModal from "../components/makeInquiry/HeaderEditModal";
import MailSenderModal from "../components/makeInquiry/MailSenderModal";
import PDFGenerator from "../components/makeInquiry/PDFGenerator";
import LoadingSpinner from "../components/LoadingSpinner";
import InquirySearchModal from "../components/makeInquiry/InquirySearchModal";
import ComplexInquiryTable from "../components/MakeComplexInquiry/ComplexInquiryTable";
import TotalCardsComponent from "../components/makeOffer/TotalCardsComponent";
import OfferPDFGenerator from "../components/makeOffer/OfferPDFGenerator";
import OfferPDFDocument from "../components/makeOffer/OfferPDFDocument";
import OfferHeaderEditModal from "../components/makeOffer/OfferHeaderEditModal";
import OfferMailSender from "../components/makeOffer/OfferSendMail";

// Styles
const FormContainer = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  padding-bottom: 80px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 95vw;
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
  docManagerName: string;
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
  documentStatus: string;
}

const INITIAL_FORM_VALUES: FormValues = {
  documentId: null,
  docManagerName: "",
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
  documentStatus: "",
};

const INITIAL_ITEM_VALUES: ComplexInquiryItemDetail[] = [
  {
    itemCode: "",
    itemType: "MAKER",
    unit: "",
    itemName: "[MAKER]",
    qty: 0,
    itemRemark: "",
    position: 1,
    indexNo: null,
    salesPriceKRW: 0,
    salesPriceGlobal: 0,
    salesAmountKRW: 0,
    salesAmountGlobal: 0,
    margin: 0,
    purchasePriceKRW: 0,
    purchasePriceGlobal: 0,
    purchaseAmountKRW: 0,
    purchaseAmountGlobal: 0,
    suppliers: [],
    confirmSupplier: null,
  },
  {
    itemCode: "",
    itemType: "TYPE",
    unit: "",
    itemName: "[TYPE]",
    qty: 0,
    itemRemark: "",
    position: 2,
    indexNo: null,
    salesPriceKRW: 0,
    salesPriceGlobal: 0,
    salesAmountKRW: 0,
    salesAmountGlobal: 0,
    margin: 0,
    purchasePriceKRW: 0,
    purchasePriceGlobal: 0,
    purchaseAmountKRW: 0,
    purchaseAmountGlobal: 0,
    suppliers: [],
    confirmSupplier: null,
  },
  {
    itemCode: "",
    itemType: "ITEM",
    unit: "",
    itemName: "",
    qty: 0,
    itemRemark: "",
    position: 3,
    indexNo: null,
    salesPriceKRW: 0,
    salesPriceGlobal: 0,
    salesAmountKRW: 0,
    salesAmountGlobal: 0,
    margin: 0,
    purchasePriceKRW: 0,
    purchasePriceGlobal: 0,
    purchaseAmountKRW: 0,
    purchaseAmountGlobal: 0,
    suppliers: [],
    confirmSupplier: null,
  },
];

const MakeComplexInquiry = () => {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { complexInquiryId } = useParams<{ complexInquiryId?: string }>();
  const navigate = useNavigate();
  const [inquiryDetail, setInquiryDetail] = useState<ComplexInquiry | null>(
    null
  );
  const [docDataloading, setDocDataLoading] = useState(true);
  const [items, setItems] = useState<ComplexInquiryItemDetail[]>([]);
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
  const [inquiryPdfHeader, setInquiryPdfHeader] = useState<string>("");
  const [quotationPdfHeader, setQuotationPdfHeader] = useState<HeaderFormData>({
    portOfShipment: "",
    exWork: "",
    deliveryTime: "",
    termsOfPayment: "",
    offerValidity: "",
    partCondition: "",
  });
  const [quotationPdfFooter, setQuotationPdfFooter] = useState<string[]>([]);
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
  const [mailDataList, setMailDataList] = useState<emailSendData[]>([]);
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
  const [finalTotals, setFinalTotals] = useState({
    totalSalesAmountKRW: 0,
    totalSalesAmountGlobal: 0,
    totalPurchaseAmountKRW: 0,
    totalPurchaseAmountGlobal: 0,
    totalSalesAmountUnDcKRW: 0,
    totalSalesAmountUnDcGlobal: 0,
    totalPurchaseAmountUnDcKRW: 0,
    totalPurchaseAmountUnDcGlobal: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
  });
  const [dcInfo, setDcInfo] = useState({
    dcPercent: 0,
    dcKrw: 0,
    dcGlobal: 0,
  });
  const [invChargeList, setInvChargeList] = useState<InvCharge[] | null>([]);
  const [documentType, setDocumentType] = useState<string>("inquiry");
  const [documentInfo, setDocumentInfo] = useState<FormValuesType | null>(null);
  const [mailData, setMailData] = useState<offerEmailSendData | null>(null);
  const [pdfFileData, setPdfFileData] = useState<File | null>(null);
  const [pdfCustomerTag, setPdfCustomerTag] = useState<{
    id: number;
    name: string;
  }>({ id: 0, name: "" });
  const [supplierTags, setSupplierTags] = useState<
    {
      id: number;
      name: string;
      korName: string;
      communicationLanguage: string;
      code: string;
      email: string;
      supplierRemark: string;
    }[]
  >([]);

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
    setShowPDFPreview(false);
  };

  const fetchDetail = useCallback(async () => {
    try {
      const data = await fetchComplexInquiryDetail(Number(complexInquiryId));
      setInquiryDetail(data);
      setIsLoading(false);
    } catch (error) {
      console.error("An error occurred while retrieving details:", error);
      setIsLoading(false);
    }
  }, [complexInquiryId]);

  // Load document data
  const loadDocData = useCallback(async () => {
    try {
      const docData = await fetchDocData();

      setFormValues((prev) => ({
        ...prev,
        documentId: docData.documentId,
        docNumber: docData.docNumber,
        docManagerName: docData.docManagerName,
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
      setItems(INITIAL_ITEM_VALUES);
      setSelectedSuppliers([]);
      setPdfSupplierTag([]);
      setVesselList([]);
      setVesselNameList([]);
      setAutoCompleteOptions([]);
      setInquiryDetail(null);
      setShowPDFPreview(false);
      setDocumentInfo(null);
      setFinalTotals({
        totalSalesAmountKRW: 0,
        totalSalesAmountGlobal: 0,
        totalPurchaseAmountKRW: 0,
        totalPurchaseAmountGlobal: 0,
        totalSalesAmountUnDcKRW: 0,
        totalSalesAmountUnDcGlobal: 0,
        totalPurchaseAmountUnDcKRW: 0,
        totalPurchaseAmountUnDcGlobal: 0,
        totalProfit: 0,
        totalProfitPercent: 0,
      });
      setDcInfo({
        dcPercent: 0,
        dcKrw: 0,
        dcGlobal: 0,
      });
      setInvChargeList(null);
    };

    resetState();

    if (!complexInquiryId) {
      setIsEditMode(false);
      setDocDataLoading(true);
      loadDocData();
    } else {
      fetchDetail();
      setDocDataLoading(false);
    }
  }, [complexInquiryId, loadDocData, fetchDetail]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // 데이터 로딩 후 상태 업데이트
  useEffect(() => {
    if (docDataloading || !complexInquiryId || !inquiryDetail) {
      return;
    }

    setIsEditMode(true);

    const { documentInfo, discount, invChargeList } = inquiryDetail;

    setDocumentInfo({
      documentId: documentInfo.documentId,
      documentNumber: documentInfo.documentNumber,
      registerDate: dayjs(documentInfo.registerDate),
      shippingDate: dayjs(documentInfo.shippingDate),
      refNumber: documentInfo.refNumber,
      currencyType: documentInfo.currencyType,
      currency: documentInfo.currency,
      docRemark: documentInfo.remark || "",
      docManager: documentInfo.docManager,
      documentStatus: documentInfo.documentStatus,
      customerId: documentInfo.customerId,
      companyName: documentInfo.companyName,
      vesselId: documentInfo.vesselId,
      vesselName: documentInfo.vesselName,
      vesselHullNo: documentInfo.vesselHullNo || "",
      imoNo: documentInfo.imoNo || undefined,
      discount,
      invChargeList: invChargeList || [],
    });

    setPdfCustomerTag({
      id: documentInfo.customerId,
      name: documentInfo.companyName,
    });

    // Form 값 업데이트
    setFormValues({
      documentId: documentInfo.documentId,
      docNumber: documentInfo.documentNumber,
      docManagerName: documentInfo.docManager,
      registerDate: dayjs(documentInfo.registerDate),
      shippingDate: dayjs(documentInfo.shippingDate),
      customer: documentInfo.companyName,
      vesselName: documentInfo.vesselName,
      refNumber: documentInfo.refNumber,
      currencyType: documentInfo.currencyType,
      currency: documentInfo.currency,
      remark: documentInfo.remark || "",
      supplierName: "",
      documentStatus: documentInfo.documentStatus,
    });

    setItems(inquiryDetail.inquiryItemDetails);

    setDcInfo({
      dcPercent: discount || 0,
      dcKrw: 0,
      dcGlobal: 0,
    });

    setInvChargeList(invChargeList || []);
  }, [docDataloading, complexInquiryId, inquiryDetail]);

  const checkDuplicateOnMount = useCallback(async () => {
    if (formValues.docNumber) {
      const isDuplicate = await chkDuplicateDocNum(
        formValues.docNumber?.trim(),
        Number(complexInquiryId)
      );
      setIsDocNumDuplicate(isDuplicate);
    }
  }, [formValues.docNumber, complexInquiryId]);

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
        Number(complexInquiryId)
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

    // applyDcAndCharge의 결과를 기다리고 업데이트된 items를 반환받음
    const updatedItems = await applyDcAndCharge();
    if (!updatedItems) return null;

    return await saveInquiry(updatedItems);
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

  // 저장 로직
  const saveInquiry = async (
    updatedItems: ComplexInquiryItemDetail[]
  ): Promise<number | null> => {
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

      const requestData = {
        documentInfo: {
          docNumber: formValues.docNumber,
          registerDate: formValues.registerDate.format("YYYY-MM-DD"),
          shippingDate: formValues.shippingDate.format("YYYY-MM-DD"),
          remark: formValues.remark,
          refNumber: formValues.refNumber,
          currencyType: formValues.currencyType,
          currency: formValues.currency,
          vesselId: selectedVessel.id,
          customerId: selectedCustomerId,
        },
        inquiryItemDetails: updatedItems.map((item) => ({
          itemDetailId: item.itemDetailId || null,
          itemId: item.itemId || null,
          itemType: item.itemType,
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemRemark: item.itemRemark || "",
          qty: item.qty,
          unit: item.unit || "",
          position: item.position,
          indexNo: item.indexNo || null,
          salesPriceKRW: item.salesPriceKRW || 0,
          salesPriceGlobal: item.salesPriceGlobal || 0,
          salesAmountKRW: item.salesAmountKRW || 0,
          salesAmountGlobal: item.salesAmountGlobal || 0,
          margin: item.margin || 0,
          purchasePriceKRW: item.purchasePriceKRW || 0,
          purchasePriceGlobal: item.purchasePriceGlobal || 0,
          purchaseAmountKRW: item.purchaseAmountKRW || 0,
          purchaseAmountGlobal: item.purchaseAmountGlobal || 0,
          supplierIdList:
            item.suppliers?.map((supplier) => supplier.supplierId) || [],
          confirmSupplier: item.confirmSupplier || null,
        })),
        ...(isEditMode && {
          discount: dcInfo.dcPercent,
          invChargeList: invChargeList || [],
        }),
      };

      const response = await submitComplexInquiry(
        Number(complexInquiryId),
        Number(formValues.documentId),
        requestData,
        isEditMode
      );

      message.success("Saved successfully!");

      const newInquiryDetail = await fetchComplexInquiryDetail(
        Number(isEditMode ? complexInquiryId : response)
      );

      navigate(`/makecomplexinquiry/${response}`, {
        state: { inquiry: newInquiryDetail },
      });

      return response;
    } catch (error) {
      console.error("An error occurred while saving inquiry:", error);
      message.error("Retry Please");
      return null;
    }
  };

  const handleInquiryHeaderSave = (text: string) => {
    setInquiryPdfHeader(text);
  };

  const handleQuotationHeaderSave = (
    header: HeaderFormData,
    footer: string[]
  ) => {
    setQuotationPdfHeader(header);
    setQuotationPdfFooter(footer);
  };

  const handlePDFPreview = () => {
    setShowPDFPreview((prevState) => !prevState);
  };

  const handleLanguageChange = useCallback((value: string, id: number) => {
    // PDF 생성용 태그만 별도 업데이트
    setPdfSupplierTag((prevTags) =>
      prevTags.map((tag) =>
        tag.id === id ? { ...tag, communicationLanguage: value } : tag
      )
    );
    setSupplierTags((prevTags) =>
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

  const getSelectedSupplierItems = useCallback(
    (supplierId?: number) => {
      if (
        !pdfSupplierTag[0] &&
        selectedSuppliers.length === 0 &&
        documentType === "inquiry" &&
        supplierTags.length < 1
      ) {
        message.error("Please select supplier.");
        return [];
      }

      const baseItemFields = (item: any) => ({
        tableNo: 1,
        itemDetailId: item.itemDetailId || undefined,
        itemId: item.itemId || undefined,
        itemType: item.itemType,
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemRemark: item.itemRemark,
        qty: item.qty,
        unit: item.unit || "",
        position: item.position,
        indexNo: item.indexNo || null,
        salesPriceKRW: item.salesPriceKRW || 0,
        salesPriceGlobal: item.salesPriceGlobal || 0,
        salesAmountKRW: item.salesAmountKRW || 0,
        salesAmountGlobal: item.salesAmountGlobal || 0,
        purchasePriceKRW: item.purchasePriceKRW || 0,
        purchasePriceGlobal: item.purchasePriceGlobal || 0,
        purchaseAmountKRW: item.purchaseAmountKRW || 0,
        purchaseAmountGlobal: item.purchaseAmountGlobal || 0,
        margin: item.margin || 0,
      });

      if (documentType === "inquiry") {
        const targetSupplierId = supplierId || pdfSupplierTag[0]?.id;
        if (!targetSupplierId) return [];

        const filteredItems = items.filter((item) =>
          item.suppliers?.some(
            (supplier) => supplier.supplierId === targetSupplierId
          )
        );

        return filteredItems
          .map((item) => ({
            ...baseItemFields(item),
            suppliers: item.suppliers
              ?.filter((supplier) => supplier.supplierId === targetSupplierId)
              .map((supplier) => ({
                supplierId: supplier.supplierId,
                inquiryItemDetailId: supplier.inquiryItemDetailId || undefined,
                code: supplier.code,
                companyName: supplier.companyName,
                korCompanyName: supplier.korCompanyName || "",
                representative: supplier.representative || "",
                email: supplier.email || "",
                communicationLanguage: supplier.communicationLanguage || "KOR",
              })),
          }))
          .sort((a, b) => a.position - b.position);
      } else {
        return items
          .map((item) => baseItemFields(item))
          .sort((a, b) => a.position - b.position);
      }
    },
    [items, pdfSupplierTag, documentType]
  );

  // 메모이제이션된 계산 함수들
  const calculateAmounts = useCallback(
    (price: number, qty: number, currency: number, isGlobal: boolean) => {
      if (isGlobal) {
        return {
          global: Number((price * qty).toFixed(2)),
          krw: Math.round(price * currency * qty),
        };
      }
      return {
        global: Number(((price / currency) * qty).toFixed(2)),
        krw: Math.round(price * qty),
      };
    },
    []
  );

  // 아이템 매핑 함수 최적화
  const handleItemIdMapping = useCallback(async (): Promise<
    ComplexInquiryItemDetail[]
  > => {
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        if (item.itemType !== "ITEM" && item.itemType !== "DASH") return item;

        const trimmedCode = item.itemCode.trim();
        const trimmedName = item.itemName.trim();
        if (!trimmedCode) return item;

        try {
          const { items: searchResult } = await fetchItemData(trimmedCode);
          const foundItem = Array.isArray(searchResult)
            ? searchResult.find(
                (result) =>
                  result.itemCode.trim() === trimmedCode &&
                  result.itemName.trim() === trimmedName
              )
            : searchResult?.itemCode.trim() === trimmedCode &&
              searchResult?.itemName.trim() === trimmedName
            ? searchResult
            : null;

          return foundItem?.itemId
            ? { ...item, itemId: foundItem.itemId }
            : item;
        } catch (error) {
          console.error(`Error mapping item code ${trimmedCode}:`, error);
          return item;
        }
      })
    );

    setItems(updatedItems);
    return updatedItems;
  }, [items]);

  // 총액 계산 함수 메모이제이션
  const calculateTotal = useCallback(
    (data: Array<any>, key: string, qtyKey: string = "qty") => {
      return data.reduce((acc: number, record: any) => {
        const price = record[key] || 0;
        const qty =
          data === invChargeList ? record[qtyKey] || 1 : record[qtyKey] || 0;
        return acc + price * qty;
      }, 0);
    },
    [invChargeList]
  );

  // 할인 적용 함수 메모이제이션
  const applyDiscount = useCallback(
    (amount: number, discountPercent: number | undefined) => {
      return discountPercent ? amount * (1 - discountPercent / 100) : amount;
    },
    []
  );

  // applyDcAndCharge를 async 함수로 변경
  const applyDcAndCharge = async (): Promise<
    ComplexInquiryItemDetail[] | null
  > => {
    if (items.length === 0) {
      message.warning("No items to calculate");
      return null;
    }

    try {
      const mappedItems = await handleItemIdMapping();
      const updatedItems = mappedItems.map((item) => {
        if (item.itemType !== "ITEM" && item.itemType !== "DASH") return item;

        const newItem = { ...item };

        // 구매가격 계산
        if (newItem.purchasePriceKRW && !newItem.purchasePriceGlobal) {
          const amounts = calculateAmounts(
            newItem.purchasePriceKRW,
            1,
            formValues.currency,
            false
          );
          newItem.purchasePriceGlobal = amounts.global;
        } else if (newItem.purchasePriceGlobal && !newItem.purchasePriceKRW) {
          const amounts = calculateAmounts(
            newItem.purchasePriceGlobal,
            1,
            formValues.currency,
            true
          );
          newItem.purchasePriceKRW = amounts.krw;
        }

        // 판매가격이 있고 마진이 없는 경우의 마진율 계산 로직 추가
        if (
          newItem.salesPriceKRW &&
          !newItem.salesPriceGlobal &&
          !newItem.margin
        ) {
          const amounts = calculateAmounts(
            newItem.salesPriceKRW,
            1,
            formValues.currency,
            false
          );
          newItem.salesPriceGlobal = amounts.global;
          newItem.margin = Number(
            Number(
              ((newItem.salesPriceKRW - newItem.purchasePriceKRW) /
                newItem.purchasePriceKRW) *
                100
            ).toFixed(2)
          );
        } else if (
          newItem.salesPriceGlobal &&
          !newItem.salesPriceKRW &&
          !newItem.margin
        ) {
          const amounts = calculateAmounts(
            newItem.salesPriceGlobal,
            1,
            formValues.currency,
            true
          );
          newItem.salesPriceKRW = amounts.krw;
          newItem.margin = Number(
            Number(
              ((newItem.salesPriceGlobal - newItem.purchasePriceKRW) /
                newItem.purchasePriceKRW) *
                100
            ).toFixed(2)
          );
        }
        // 마진이 있고 판매가격이 없는 경우
        else if (
          newItem.salesPriceKRW === 0 &&
          newItem.salesPriceGlobal === 0
        ) {
          newItem.salesPriceKRW = Math.round(
            newItem.purchasePriceKRW * (1 + newItem.margin / 100)
          );

          newItem.salesPriceGlobal = Number(
            (newItem.purchasePriceGlobal * (1 + newItem.margin / 100)).toFixed(
              2
            )
          );
        }

        // 수량 기반 금액 계산
        if (newItem.qty) {
          const purchaseAmounts = calculateAmounts(
            newItem.purchasePriceKRW,
            newItem.qty,
            formValues.currency,
            false
          );
          const salesAmounts = calculateAmounts(
            newItem.salesPriceKRW ||
              newItem.purchasePriceKRW * (1 + (newItem.margin || 0) / 100),
            newItem.qty,
            formValues.currency,
            false
          );

          newItem.purchaseAmountKRW = purchaseAmounts.krw;
          newItem.purchaseAmountGlobal = purchaseAmounts.global;
          newItem.salesAmountKRW = salesAmounts.krw;
          newItem.salesAmountGlobal = salesAmounts.global;
        }

        return newItem;
      });

      // 상태 업데이트를 기다림
      await new Promise<void>((resolve) => {
        setItems(updatedItems);
        requestAnimationFrame(() => resolve());
      });

      // 업데이트된 items로 총액 계산
      const totalSalesAmountKRW = updatedItems.reduce(
        (sum, item) => sum + (item.salesAmountKRW || 0),
        0
      );
      const totalSalesAmountGlobal = updatedItems.reduce(
        (sum, item) => sum + (item.salesAmountGlobal || 0),
        0
      );
      const totalPurchaseAmountKRW = updatedItems.reduce(
        (sum, item) => sum + (item.purchaseAmountKRW || 0),
        0
      );
      const totalPurchaseAmountGlobal = updatedItems.reduce(
        (sum, item) => sum + (item.purchaseAmountGlobal || 0),
        0
      );

      // 할인 적용된 총액 계산
      const newTotalSalesAmountKRW = applyDiscount(
        totalSalesAmountKRW,
        dcInfo.dcPercent
      );
      const newTotalSalesAmountGlobal = applyDiscount(
        totalSalesAmountGlobal,
        dcInfo.dcPercent
      );

      // charge 계산
      const chargePriceKRWTotal = calculateTotal(
        invChargeList || [],
        "chargePriceKRW"
      );
      const chargePriceGlobalTotal = calculateTotal(
        invChargeList || [],
        "chargePriceGlobal"
      );

      // 최종 금액 계산
      const updatedTotalSalesAmountKRW =
        newTotalSalesAmountKRW + chargePriceKRWTotal;
      const updatedTotalSalesAmountGlobal =
        newTotalSalesAmountGlobal + chargePriceGlobalTotal;

      // 이익 계산
      const updatedTotalProfit =
        updatedTotalSalesAmountKRW - totalPurchaseAmountKRW;
      const updatedTotalProfitPercent = Number(
        ((updatedTotalProfit / totalPurchaseAmountKRW) * 100).toFixed(2)
      );

      setFinalTotals({
        totalSalesAmountKRW: Math.round(updatedTotalSalesAmountKRW),
        totalSalesAmountGlobal: updatedTotalSalesAmountGlobal,
        totalPurchaseAmountKRW,
        totalPurchaseAmountGlobal,
        totalSalesAmountUnDcKRW: Math.round(totalSalesAmountKRW),
        totalSalesAmountUnDcGlobal: totalSalesAmountGlobal,
        totalPurchaseAmountUnDcKRW: Math.round(totalPurchaseAmountKRW),
        totalPurchaseAmountUnDcGlobal: totalPurchaseAmountGlobal,
        totalProfit: Math.round(updatedTotalProfit),
        totalProfitPercent: updatedTotalProfitPercent,
      });

      // 업데이트된 items 반환
      return updatedItems;
    } catch (error) {
      console.error("Error in applyDcAndCharge:", error);
      message.error("There was an error in calculating the total amounts");
      return null;
    }
  };

  const getSuppliersByItems = useCallback(() => {
    const supplierMap = new Map();

    items.forEach((item) => {
      if (item.suppliers) {
        item.suppliers.forEach((supplier) => {
          if (!supplierMap.has(supplier.supplierId)) {
            supplierMap.set(supplier.supplierId, {
              id: supplier.supplierId,
              name: supplier.companyName,
              korName: supplier.korCompanyName || supplier.companyName,
              communicationLanguage: supplier.communicationLanguage || "KOR",
              code: supplier.code,
              email: supplier.email || "",
              supplierRemark: supplier.supplierRemark || "",
            });
          }
        });
      }
    });

    setSupplierTags(Array.from(supplierMap.values()));
  }, [items]);

  useEffect(() => {
    getSuppliersByItems();
  }, [getSuppliersByItems]);

  if (docDataloading || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <FormContainer>
      <Title>복합 견적 작성(MAKE COMPLEX INQUIRY)</Title>
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
          complexInquiryId={Number(complexInquiryId)}
          toggleModal={toggleModal}
          isCustomerModalOpen={isCustomerModalOpen}
          isVesselModalOpen={isVesselModalOpen}
          isSupplierModalOpen={isSupplierModalOpen}
          uniqueSuppliers={uniqueSuppliers}
        />
      )}
      <Divider variant="dashed" style={{ borderColor: "#ccc" }} />
      <div style={{ marginTop: 50 }}>
        <TotalCardsComponent
          finalTotals={finalTotals}
          applyDcAndCharge={applyDcAndCharge}
          mode={"multiple"}
          currency={formValues.currency}
          dcInfo={dcInfo}
          setDcInfo={setDcInfo}
          invChargeList={invChargeList}
          setInvChargeList={setInvChargeList}
        />
      </div>
      <ComplexInquiryTable
        items={items}
        setItems={setItems}
        uniqueSuppliers={uniqueSuppliers}
        currency={formValues.currency}
        documentStatus={formValues.documentStatus}
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
        {documentType === "inquiry" && (
          <MailSenderModal
            mode="makeInquiry"
            mailDataList={mailDataList}
            inquiryFormValues={formValues}
            handleSubmit={handleSubmit}
            selectedSupplierTag={supplierTags}
            getItemsForSupplier={getSelectedSupplierItems}
            vesselInfo={selectedVessel}
            pdfHeader={inquiryPdfHeader}
            handleLanguageChange={handleLanguageChange}
            isMailSenderVisible={isMailSenderVisible}
          />
        )}
        {documentInfo && documentType === "quotation" ? (
          <OfferMailSender
            inquiryFormValues={{
              documentNumber: documentInfo.documentNumber,
              customer: documentInfo.companyName,
              refNumber: documentInfo.refNumber,
              vesselName: documentInfo.vesselName,
            }}
            handleSubmit={handleSubmit}
            pdfFileData={pdfFileData}
            mailData={mailData}
            pdfHeader={quotationPdfHeader}
            selectedSupplierIds={[]} //복합일 때만 빈 배열
          />
        ) : documentType === "quotation" ? (
          <div style={{ marginTop: 20 }}>
            <Alert
              message="There is no document information. Please Save the document first."
              type="error"
            />
          </div>
        ) : null}
      </Modal>
      <div
        style={{
          display: "flex",
          marginTop: 20,
          alignItems: "center",
          paddingLeft: 20,
        }}
      >
        {documentType === "inquiry" && (
          <>
            <span>Supplier: </span>
            <Select
              style={{ width: 200, float: "left", marginLeft: 10 }}
              value={pdfSupplierTag[0]?.id || ""}
              onChange={(supplierId) => {
                const selectedSupplier = supplierTags.find(
                  (supplier) => supplier.id === supplierId
                );

                if (selectedSupplier) {
                  setPdfSupplierTag([selectedSupplier]);
                }
              }}
            >
              {supplierTags.map((supplier) => (
                <Select.Option key={supplier.id} value={supplier.id}>
                  {supplier.code}
                </Select.Option>
              ))}
            </Select>
          </>
        )}
        <Button
          onClick={() => toggleModal("header", true)}
          style={{ marginLeft: 20 }}
        >
          {documentType === "inquiry" ? "Edit Header" : "Edit Header / Remark"}
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
        <span style={{ marginLeft: 20 }}>DOCUMENT TYPE: </span>
        <Select
          style={{ width: 250, float: "left", marginLeft: 10 }}
          value={documentType}
          onChange={(value) => {
            setDocumentType(value);
            setPdfSupplierTag([]);
            setShowPDFPreview(false);
          }}
        >
          <Select.Option value="inquiry">INQUIRY TO SUPPLIER</Select.Option>
          <Select.Option value="quotation">QUOTATION TO CUSTOMER</Select.Option>
        </Select>
        {documentType === "inquiry" && (
          <HeaderEditModal
            open={headerEditModalVisible}
            onClose={() => toggleModal("header", false)}
            onSave={handleInquiryHeaderSave}
            pdfCompanyTag={pdfSupplierTag}
          />
        )}
        {documentType === "quotation" && (
          <OfferHeaderEditModal
            open={headerEditModalVisible}
            onClose={() => toggleModal("header", false)}
            onSave={handleQuotationHeaderSave}
          />
        )}
      </div>
      {isMailSenderVisible && documentType === "inquiry" && (
        <PDFGenerator
          selectedSupplierTag={supplierTags}
          formValues={formValues}
          setMailDataList={setMailDataList}
          vesselInfo={selectedVessel}
          pdfHeader={inquiryPdfHeader}
        />
      )}

      {showPDFPreview && documentType === "inquiry" && (
        <PDFDocument
          formValues={formValues}
          items={getSelectedSupplierItems()}
          supplier={pdfSupplierTag[0]}
          vesselInfo={selectedVessel}
          pdfHeader={inquiryPdfHeader}
          viewMode={true}
        />
      )}
      {documentInfo && isMailSenderVisible && documentType === "quotation" && (
        <OfferPDFGenerator
          info={documentInfo}
          items={getSelectedSupplierItems()}
          pdfHeader={quotationPdfHeader}
          pdfFooter={quotationPdfFooter}
          language={"ENG"}
          setMailData={setMailData}
          setPdfFileData={setPdfFileData}
          customerTag={pdfCustomerTag}
          finalTotals={finalTotals}
          dcInfo={dcInfo}
          invChargeList={invChargeList}
        />
      )}
      {documentInfo && showPDFPreview && documentType === "quotation" && (
        <OfferPDFDocument
          info={documentInfo}
          items={getSelectedSupplierItems()}
          pdfHeader={quotationPdfHeader}
          pdfFooter={quotationPdfFooter}
          viewMode={true}
          language={"ENG"}
          finalTotals={finalTotals}
          dcInfo={dcInfo}
          invChargeList={invChargeList}
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
        />
        <FloatButton.BackTop visibilityHeight={0} />
      </BtnGroup>
    </FormContainer>
  );
};

export default MakeComplexInquiry;
