import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  AutoComplete,
  Tag,
  message,
  List,
  Modal,
  Checkbox,
  Tooltip,
} from "antd";
import styled from "styled-components";
import CreateCompanyModal from "../company/CreateCompanyModal";
import CreateVesselModal from "../vessel/CreateVesselModal";
import {
  chkDuplicateDocNum,
  chkDuplicateRefNum,
  fetchCategory,
  searchSupplier,
  searchSupplierUseMaker,
} from "../../api/api";
import SearchMakerModal from "../makeInquiry/SearchMakerModal";
import { MakerSupplierList } from "../../types/types";

const { Option } = Select;

const InquiryItemForm = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

const FormRow = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

const SearchBox = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: baseline;
`;

const StyledListItem = styled(List.Item)`
  display: flex;
  padding: 12px 0;
  color: rgba(0, 0, 0, 0.88);
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const MakerTitle = styled.h3`
  width: 100%;
  margin: 0;
  position: relative;
  font-size: 16px;
  color: #333;
`;

const SupplierContainer = styled.div`
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
`;

const SupplierItem = styled.div`
  display: flex;
  align-items: center;
  margin: 8px 0;
`;

const StyledCheckbox = styled(Checkbox)`
  margin-right: 8px;
`;

const StyledTag = styled(Tag)`
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
`;

interface FormValues {
  documentId: number | null;
  docNumber: string;
  docManagerName: string;
  registerDate: any;
  shippingDate: any;
  customer: string;
  vesselName: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  remark: string;
  supplierName: string;
  documentStatus: string;
}

interface InquiryFormProps {
  formValues: FormValues;
  autoCompleteOptions: { value: string }[];
  vesselNameList: { id: number; name: string; imoNumber: number }[];
  handleFormChange: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void;
  customerUnreg: boolean;
  vesselUnreg: boolean;
  setSelectedSuppliers: Dispatch<
    SetStateAction<
      {
        id: number;
        name: string;
        korName: string;
        code: string;
        email: string;
        communicationLanguage: string;
        supplierRemark: string;
      }[]
    >
  >;
  isEditMode: boolean;
  isDocNumDuplicate: boolean;
  setIsDocNumDuplicate: Dispatch<SetStateAction<boolean>>;
  complexInquiryId: number;
  toggleModal: (
    modalType:
      | "header"
      | "mail"
      | "inquirySearch"
      | "customer"
      | "vessel"
      | "supplier",
    isVisible: boolean
  ) => void;
  isCustomerModalOpen: boolean;
  isVesselModalOpen: boolean;
  isSupplierModalOpen: boolean;
  uniqueSuppliers:
    | {
        id: number;
        name: string;
        code: string;
        supplierRemark: string;
      }[]
    | undefined;
}

const InquiryForm = ({
  formValues,
  autoCompleteOptions,
  vesselNameList,
  handleFormChange,
  customerUnreg,
  vesselUnreg,
  setSelectedSuppliers,
  isDocNumDuplicate,
  setIsDocNumDuplicate,
  complexInquiryId,
  toggleModal,
  isCustomerModalOpen,
  isVesselModalOpen,
  isSupplierModalOpen,
  uniqueSuppliers,
}: InquiryFormProps) => {
  const [form] = Form.useForm();
  const [supplierSearch, setSupplierSearch] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [makerSearch, setMakerSearch] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [checkedSuppliers, setCheckedSuppliers] = useState<any[]>([]);
  const [autoSearchSupCompleteOptions, setAutoSearchSupCompleteOptions] =
    useState<{ value: string }[]>([]);
  const [makerOptions, setMakerOptions] = useState<
    {
      label: string;
      value: string;
    }[]
  >([]);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string }[]>(
    []
  );
  const [categoryWord, setCategoryWord] = useState<string>("");
  const [isRefNumDuplicate, setIsRefNumDuplicate] = useState<boolean>(false);
  const [makerSupplierList, setMakerSupplierList] = useState<
    MakerSupplierList[]
  >([]);

  // 초기 렌더링 시 카테고리 데이터 조회
  useEffect(() => {
    const fetchCategoryList = async () => {
      try {
        const response = await fetchCategory();
        setCategoryList(response.categoryType);
      } catch (error) {
        console.error("Error fetching category list:", error);
      }
    };

    fetchCategoryList();
  }, []);

  // 모달 열기 함수
  const showModal = (type: string) => {
    setSelectedType(type);
    setSupplierSearch("");
    setCategoryWord("");
    setMakerSupplierList([]);
    setCheckedSuppliers([]);
    setIsModalVisible(true);
  };

  // 모달 닫기 함수
  const handleModalClose = () => {
    setIsModalVisible(false);
    setMakerSearch("");
  };

  // 선택된 매입처 추가 함수
  const handleAddSelectedSuppliers = () => {
    setSelectedSuppliers((prevSuppliers) => {
      const updatedSuppliers = [
        ...prevSuppliers,
        ...checkedSuppliers.filter(
          (supplier) =>
            !prevSuppliers.some(
              (existingSupplier) => existingSupplier.id === supplier.id
            )
        ),
      ];

      return updatedSuppliers;
    });

    handleModalClose();
  };

  // 선택된 매입처 체크 함수
  const handleCheckboxChange = (supplier: { id: any }) => {
    setCheckedSuppliers((prevChecked) => {
      if (prevChecked.some((item) => item.id === supplier.id)) {
        return prevChecked.filter((item) => item.id !== supplier.id);
      } else {
        return [...prevChecked, supplier];
      }
    });
  };

  // 매출처 검증 함수
  const validateCustomer = () => {
    if (customerUnreg) {
      return {
        status: (formValues.customer + "").trim() === "" ? "error" : "error",
        message:
          (formValues.customer + "").trim() === ""
            ? "Please enter a customer"
            : "This is an unregistered customer",
      };
    }
    return { status: undefined, message: undefined };
  };

  // 선박 검증 함수
  const validateVessel = () => {
    if (vesselUnreg) {
      return {
        status: (formValues.vesselName + "").trim() === "" ? "error" : "error",
        message:
          (formValues.vesselName + "").trim() === ""
            ? "Please enter a vessel"
            : "This is an unregistered vessel",
      };
    }
    return { status: undefined, message: undefined };
  };

  // 매입처 검색 함수
  const handleSupplierSearch = async (value: string) => {
    setSupplierSearch(value);
    if (value) {
      try {
        const data = await searchSupplier(value);
        const options = data.suppliers.map((supplier) => ({
          name: supplier.companyName,
          korName: supplier.korCompanyName || supplier.companyName,
          id: supplier.id,
          code: supplier.code,
          email: supplier.email,
          communicationLanguage: supplier.communicationLanguage || "KOR",
          supplierRemark: supplier.supplierRemark || "",
        }));

        // 공급자 객체를 포함하여 자동완성 옵션 설정
        setAutoSearchSupCompleteOptions(
          options.map((supplier) => ({
            key: supplier.id,
            value: supplier.code, // 선택 시 표시될 값
            supplier, // 공급자 객체 포함
          }))
        );
      } catch (error) {
        message.error("An error occurred while searching.");
      }
    } else {
      setAutoSearchSupCompleteOptions([]);
    }
  };

  // 메이커 검색 함수
  const handleMakerSearch = async (
    value: string,
    categoryType: string | null
  ) => {
    setMakerSearch(value);
    if (value) {
      try {
        const data = await searchSupplierUseMaker(value, categoryType!.trim());

        // 메이커 리스트 데이터 변환
        const makerSupplierList = data.map((item) => ({
          maker: item.maker,
          category: item.category,
          supplierList: item.supplierList.map((supplier) => ({
            name: supplier.companyName,
            korName: supplier.korCompanyName || supplier.companyName,
            id: supplier.supplierId,
            code: supplier.code,
            email: supplier.email || "",
            communicationLanguage: supplier.communicationLanguage || "KOR",
            supplierRemark: supplier.supplierRemark || "",
          })),
        }));

        // 상태 업데이트
        setMakerSupplierList(makerSupplierList);

        // 메이커 옵션 생성 - 카테고리와 함께 표시
        const makerOptions = data.map((item) => ({
          label: `${item.maker} (${item.category})`,
          value: item.maker,
        }));
        setMakerOptions(makerOptions);
      } catch (error) {
        message.error("An error occurred while searching.");
      }
    } else {
      setMakerSupplierList([]);
    }
  };

  // 검색 함수
  const handleSearch = (value: string, categoryType: string | null) => {
    if (selectedType === "SUPPLIER") {
      handleSupplierSearch(value);
    } else if (selectedType === "MAKER") {
      handleMakerSearch(value, categoryType);
    }
  };

  // 중복 제거 함수
  const removeListDuplicates = (list: any[]) => {
    const uniqueItems: any[] = [];
    const seenIds = new Set();

    list.forEach((item) => {
      const supplierId = item.supplierList[0].id;
      if (!seenIds.has(supplierId)) {
        uniqueItems.push(item);
        seenIds.add(supplierId);
      }
    });

    return uniqueItems;
  };

  // 카테고리 검색 함수
  const handleCategorySearch = (searchText: string) => {
    setCategoryWord(searchText);
    if (searchText.length > 0) {
      const filteredOptions = categoryList
        .filter((category) =>
          category.toLowerCase().includes(searchText.toLowerCase())
        )
        .map((category) => ({ value: category }));

      setCategoryOptions(filteredOptions);
    } else {
      setCategoryOptions([]);
    }
  };

  return (
    <>
      <Form form={form} layout="vertical" initialValues={formValues}>
        <FormRow>
          <InquiryItemForm
            label="문서번호(Document No.)"
            name="docNumber"
            style={{ maxWidth: 300 }}
            rules={[{ required: true, message: "Please write Document No." }]}
            normalize={(value) => value.trim()}
            validateStatus={isDocNumDuplicate ? "error" : undefined} // 중복 여부에 따라 상태 설정
            help={
              isDocNumDuplicate
                ? "The document number is duplicated."
                : undefined
            } // 중복 메시지 설정
          >
            <Input
              style={{ cursor: "default" }}
              onChange={(e) => {
                const newValue = e.target.value.trim();
                handleFormChange("docNumber", newValue);
              }}
              onBlur={async (e) => {
                const docNumber = e.target.value.trim();

                const isDuplicate = await chkDuplicateDocNum(
                  docNumber,
                  complexInquiryId
                );
                setIsDocNumDuplicate(isDuplicate); // 중복 여부 설정
              }}
            />
          </InquiryItemForm>
          <InquiryItemForm
            style={{ flex: "20%" }}
            label="Ref No."
            name="refNumber"
            rules={[{ required: true, message: "Please enter ref number" }]}
            validateStatus={
              !formValues.refNumber
                ? "error"
                : isRefNumDuplicate
                ? "error"
                : undefined
            } // 비어있거나 중복일 때 오류 상태 설정
            help={
              !formValues.refNumber
                ? "Please enter ref number"
                : isRefNumDuplicate
                ? "The Ref number is duplicated."
                : undefined
            }
          >
            <Input
              value={formValues.refNumber?.trim()}
              onChange={(e) =>
                handleFormChange("refNumber", e.target.value.trim())
              }
              onBlur={async (e) => {
                const refNumber = e.target.value.trim();
                const isDuplicate = await chkDuplicateRefNum(
                  refNumber,
                  complexInquiryId
                );
                setIsRefNumDuplicate(isDuplicate); // 중복 여부 설정
              }}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="작성일자(Register Date)"
            name="registerDate"
            rules={[{ required: true, message: "Please select register date" }]}
            style={{ width: 120 }}
          >
            <DatePicker
              value={formValues.registerDate}
              onChange={(date) => handleFormChange("registerDate", date!)}
              style={{ width: "100%" }}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="화폐(Currency)"
            name="currencyType"
            rules={[{ required: true, message: "Please select currency type" }]}
          >
            <Select
              value={formValues.currencyType}
              onChange={(value) => {
                handleFormChange("currencyType", value);
                let currency = 0;
                if (value === "USD") {
                  currency = 1050;
                } else if (value === "EUR") {
                  currency = 1150;
                } else if (value === "INR") {
                  currency = 14;
                }

                handleFormChange("currency", currency);
                // form 필드 동기화
                form.setFieldsValue({ currency: currency });
              }}
            >
              {["USD", "EUR", "INR"].map((currencyType) => (
                <Option key={currencyType} value={currencyType}>
                  {currencyType}
                </Option>
              ))}
            </Select>
          </InquiryItemForm>
          <InquiryItemForm
            label="환율(Exchange Rate)"
            name="currency"
            rules={[
              {
                required: true,
                message: "Please enter currency exchange rate",
              },
            ]}
            style={{ width: 100 }}
          >
            <Input
              type="number"
              value={formValues.currency || 0} // currency의 초기값이 없는 경우 빈 문자열
              onChange={(e) => {
                const value = e.target.value;
                const parsedValue = parseFloat(value);
                handleFormChange(
                  "currency",
                  isNaN(parsedValue) ? 0 : parsedValue
                ); // NaN일 경우 0으로 설정
              }}
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <InquiryItemForm
            label="매출처(Customer)"
            name="customer"
            validateStatus={
              validateCustomer().status as
                | ""
                | "error"
                | "success"
                | "warning"
                | "validating"
                | undefined
            }
            help={validateCustomer().message}
            rules={[{ required: true, message: "Please enter customer" }]}
            style={{ flex: 2 }}
          >
            <Button
              type="primary"
              style={{ position: "absolute", top: "-35px", right: "0" }}
              onClick={() => toggleModal("customer", true)}
            >
              Register
            </Button>
            <AutoComplete
              value={formValues.customer}
              onChange={(value) => handleFormChange("customer", value)}
              options={autoCompleteOptions}
              style={{ width: "100%" }}
            >
              <Input />
            </AutoComplete>
          </InquiryItemForm>
          <InquiryItemForm
            label="선명(Vessel Name)"
            name="vesselName"
            validateStatus={
              validateVessel().status as
                | ""
                | "error"
                | "success"
                | "warning"
                | "validating"
                | undefined
            }
            help={validateVessel().message}
            rules={[{ required: true, message: "Please enter vessel name" }]}
            style={{ flex: 2 }}
          >
            <Button
              type="primary"
              style={{ position: "absolute", top: "-35px", right: "0" }}
              onClick={() => toggleModal("vessel", true)}
            >
              Register
            </Button>
            <AutoComplete
              value={formValues.vesselName}
              onChange={(value, option) => {
                handleFormChange("vesselName", value);
              }}
              options={vesselNameList.map((vessel) => ({
                label: vessel.imoNumber
                  ? `${vessel.name} (IMO No.: ${vessel.imoNumber})`
                  : `${vessel.name} (IMO No.: None)`, // 표시용 텍스트
                value: vessel.name, // 실제로 선택되는 값은 vessel.name
                key: vessel.id, // 각 항목의 고유 ID
              }))}
              style={{ width: "100%" }}
              filterOption={(inputValue, option) =>
                option!.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            >
              <Input />
            </AutoComplete>
          </InquiryItemForm>
          <InquiryItemForm
            label="문서상태(Document Status)"
            name="documentStatus"
            style={{ flex: 1 }}
          >
            <Input value={formValues.documentStatus} readOnly />
          </InquiryItemForm>
          <InquiryItemForm
            label="비고(Remark)"
            name="remark"
            style={{ flex: 3 }}
          >
            <Input
              value={formValues.remark}
              onChange={(e) => handleFormChange("remark", e.target.value)}
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <SearchBox>
            <div>
              <div
                style={{
                  display: "flex",
                  marginRight: 20,
                  width: 400,
                  marginBottom: 3,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>매입처(Supplier)</span>
                <Button
                  type="primary"
                  onClick={() => toggleModal("supplier", true)}
                >
                  Register
                </Button>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginRight: 20,
                  width: 400,
                }}
              >
                <AutoComplete
                  value={supplierSearch}
                  onFocus={() => {
                    setSelectedType("SUPPLIER");
                  }}
                  onChange={(value) => {
                    handleSearch(value, null);
                  }}
                  onSelect={(value, option: any) => {
                    const selectedSupplier = option.supplier; // option.supplier를 통해 supplier 객체 접근

                    if (selectedSupplier) {
                      setSelectedSuppliers((prevSuppliers) => [
                        ...prevSuppliers,
                        selectedSupplier,
                      ]);
                    }

                    // 검색창 초기화
                    setSupplierSearch("");
                  }}
                  options={autoSearchSupCompleteOptions} // supplier 객체 포함된 옵션 사용
                  placeholder="Search SUPPLIER ex) TECHLOG"
                >
                  <Input style={{ width: "100%" }} />
                </AutoComplete>
                <Button
                  onClick={() => showModal("MAKER")}
                  style={{ marginTop: 10, width: 250 }}
                >
                  Search supplier by category & maker
                </Button>
              </div>
            </div>
            {selectedType === "MAKER" && (
              <SearchMakerModal
                isVisible={isModalVisible}
                onClose={handleModalClose}
                onOk={handleAddSelectedSuppliers}
                categoryWord={categoryWord}
                categoryOptions={categoryOptions}
                makerSearch={makerSearch}
                makerOptions={makerOptions}
                makerSupplierList={makerSupplierList}
                checkedSuppliers={checkedSuppliers}
                onCategorySearch={handleCategorySearch}
                onSearch={handleSearch}
                onCheckboxChange={handleCheckboxChange}
                setMakerSearch={setMakerSearch}
              />
            )}
            <span style={{ marginRight: 10 }}>Searched Suppliers: </span>
            {uniqueSuppliers?.map((supplier) => (
              <Tooltip
                placement="bottomLeft"
                title={supplier.supplierRemark || null}
                overlayInnerStyle={{ fontSize: 12 }}
                color="red"
              >
                <StyledTag
                  key={supplier.id}
                  color={supplier.supplierRemark ? "red" : "default"}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  {supplier.code}
                </StyledTag>
              </Tooltip>
            ))}
          </SearchBox>
        </FormRow>
      </Form>
      {isCustomerModalOpen && (
        <CreateCompanyModal
          category={"customer"}
          onClose={() => toggleModal("customer", false)}
          onUpdate={() => toggleModal("customer", false)}
        />
      )}
      {isVesselModalOpen && (
        <CreateVesselModal
          onClose={() => toggleModal("vessel", false)}
          onUpdate={() => toggleModal("vessel", false)}
        />
      )}
      {isSupplierModalOpen && (
        <CreateCompanyModal
          category={"supplier"}
          onClose={() => toggleModal("supplier", false)}
          onUpdate={() => toggleModal("supplier", false)}
        />
      )}
    </>
  );
};

export default InquiryForm;
