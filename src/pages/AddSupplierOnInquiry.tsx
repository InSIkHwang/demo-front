import { useState, useEffect } from "react";
import styled from "styled-components";
import { Button, Divider, FloatButton, message, Modal, Select } from "antd";
import { FileSearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchVessel, searchInquiryWithMaker } from "../api/api";
import PDFDocument from "../components/makeInquiry/PDFDocument";
import {
  InquiryItem,
  emailSendData,
  VesselList,
  InquirySearchMakerInquirySearchResult,
  InquiryTable,
} from "../types/types";
import { useLocation, useNavigate } from "react-router-dom";
import HeaderEditModal from "../components/makeInquiry/HeaderEditModal";
import MailSenderModal from "../components/makeInquiry/MailSenderModal";
import PDFGenerator from "../components/makeInquiry/PDFGenerator";
import LoadingSpinner from "../components/LoadingSpinner";
import InquirySearchModal from "../components/makeInquiry/InquirySearchModal";
import FormComponent from "../components/addSupplier/FormComponent";
import TableComponent from "../components/addSupplier/TableComponent";

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

const AddSupplierOnInquiry = () => {
  const location = useLocation();
  const data = location.state;
  const navigate = useNavigate();
  const [items, setItems] = useState<InquiryItem[]>(data.itemDetails);
  const [selectedVessel, setSelectedVessel] = useState<VesselList | null>(null);
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
  const [language, setLanguage] = useState<string>("KOR");
  const [fileData, setFileData] = useState<File[]>([]);
  const [pdfFileData, setPdfFileData] = useState<File[]>([]);
  const [isSendMail, setIsSendMail] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 변수 추가
  const [inquirySearchMakerName, setInquirySearchMakerName] = useState("");
  const [inquirySearchMakerNameResult, setInquirySearchMakerNameResult] =
    useState<InquirySearchMakerInquirySearchResult | null>(null);

  const [tagColors, setTagColors] = useState<{ [id: number]: string }>({});
  const [isFromInquirySearchModal, setIsFromInquirySearchModal] =
    useState(false);
  const [headerEditModalVisible, setHeaderEditModalVisible] =
    useState<boolean>(false);
  const [isMailSenderVisible, setIsMailSenderVisible] = useState(false);
  const [isInquirySearchModalVisible, setIsInquirySearchModalVisible] =
    useState(false);
  const [tables, setTables] = useState<InquiryTable[]>([]);
  const [currentTableNo, setCurrentTableNo] = useState<number>(1);

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

  useEffect(() => {
    if (data.documentInfo) {
      // 최초 렌더링 시 data로 formValues 설정
      setFormValues({
        docNumber: data.documentInfo.documentNumber,
        registerDate: dayjs(data.documentInfo.registerDate), // 날짜 형식 변환
        shippingDate: dayjs(data.documentInfo.shippingDate), // 날짜 형식 변환
        customer: data.documentInfo.companyName, // 회사 이름
        vesselName: data.documentInfo.vesselName, // 선박 이름
        refNumber: data.documentInfo.refNumber, // 참조 번호
        currencyType: data.documentInfo.currencyType, // 통화 유형
        currency: data.documentInfo.currency, // 통화 금액
        remark: data.documentInfo.remark, // 비고
        supplierName: "", // 공급자 이름은 초기값으로 설정
      });

      // inquiryItemDetails를 items로 설정
      setItems(data.itemDetails);
      setIsLoading(false);

      fetchVesselInfo(data.documentInfo.vesselId);
    }
  }, []);

  const fetchVesselInfo = async (vesselId: number) => {
    try {
      const response = await fetchVessel(vesselId);

      setSelectedVessel(response);
    } catch (error) {
      console.error("Error fetching company name:", error);
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

  const handleFormChange = <K extends keyof typeof formValues>(
    key: K,
    value: (typeof formValues)[K]
  ) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
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
    setSelectedSuppliers((prevTags) => {
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleSubmit = (): Promise<unknown> => {
    return Promise.resolve(); // 빈 Promise를 반환
  };

  return (
    <FormContainer>
      <Title>매입처 추가(ADD SUPPLIER)</Title>
      {formValues !== INITIAL_FORM_VALUES && (
        <FormComponent
          formValues={formValues}
          selectedSuppliers={selectedSuppliers}
          handleFormChange={handleFormChange}
          setSelectedSuppliers={setSelectedSuppliers}
          tagColors={tagColors}
          setTagColors={setTagColors}
        />
      )}
      <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
        Item
      </Divider>
      <TableComponent items={items} setItems={setItems} />
      <Button
        type="primary"
        onClick={showMailSenderModal}
        style={{ margin: "20px 0 0 15px", float: "right" }}
      >
        Send Email
      </Button>
      <Button
        type="default"
        onClick={() => navigate(-1)}
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
        {mailDataList.length > 0 && (
          <MailSenderModal
            mode="addSupplier"
            mailDataList={mailDataList}
            inquiryFormValues={formValues}
            handleSubmit={handleSubmit}
            selectedSupplierTag={selectedSuppliers}
            setFileData={setFileData}
            setIsSendMail={setIsSendMail}
            getItemsForSupplier={(supplierId) => {
              return items;
            }}
            vesselInfo={selectedVessel}
            pdfHeader={pdfHeader}
            setPdfFileData={setPdfFileData}
            handleLanguageChange={handleLanguageChange}
          />
        )}
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
            const selected = selectedSuppliers.find(
              (tag) => tag.name === value
            );
            if (selected) {
              setPdfSupplierTag([selected]);
            }
          }}
        >
          {selectedSuppliers.map((tag) => (
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
          onClose={handleCloseHeaderModal}
          onSave={handleHeaderSave}
          pdfCompanyTag={pdfSupplierTag}
        />
      </div>
      {isMailSenderVisible && (
        <PDFGenerator
          selectedSupplierTag={selectedSuppliers}
          formValues={formValues}
          setMailDataList={setMailDataList}
          items={items}
          vesselInfo={selectedVessel}
          pdfHeader={pdfHeader}
          setPdfFileData={setPdfFileData}
        />
      )}

      {showPDFPreview && (
        <PDFDocument
          formValues={formValues}
          items={items}
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
          onClick={openInquirySearchMakerModal}
        />
        <InquirySearchModal
          isVisible={isInquirySearchModalVisible}
          onClose={closeInquirySearchMakerModal}
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

export default AddSupplierOnInquiry;
