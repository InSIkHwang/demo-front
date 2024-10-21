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

interface FormValues {
  docNumber: string;
  registerDate: any;
  shippingDate: any;
  customer: string;
  vesselName: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  remark: string;
  supplierName: string;
}

interface InquiryFormProps {
  formValues: FormValues;
  autoCompleteOptions: { value: string }[];
  vesselNameList: { id: number; name: string; imoNumber: number }[];
  supplierOptions: { value: string; id: number; code: string; email: string }[];
  selectedSuppliers: {
    id: number;
    name: string;
    code: string;
    email: string;
  }[];
  handleFormChange: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void;
  customerUnreg: boolean;
  vesselUnreg: boolean;
  setSelectedSupplierTag: Dispatch<
    SetStateAction<
      {
        id: number;
        name: string;
        korName: string;
        code: string;
        email: string;
      }[]
    >
  >;
  setSelectedSuppliers: Dispatch<
    SetStateAction<
      {
        id: number;
        name: string;
        korName: string;
        code: string;
        email: string;
      }[]
    >
  >;
  isEditMode: boolean;
  isDocNumDuplicate: boolean;
  setIsDocNumDuplicate: Dispatch<SetStateAction<boolean>>;
  customerInquiryId: number;
  tagColors: { [id: number]: string };
  setTagColors: Dispatch<SetStateAction<{ [id: number]: string }>>;
  handleTagClick: (id: number) => void;
  isCustomerModalOpen: boolean;
  setIsCustomerModalOpen: Dispatch<SetStateAction<boolean>>;
  isVesselModalOpen: boolean;
  setIsVesselModalOpen: Dispatch<SetStateAction<boolean>>;
}

const InquiryForm = ({
  formValues,
  autoCompleteOptions,
  vesselNameList,
  selectedSuppliers,
  handleFormChange,
  customerUnreg,
  vesselUnreg,
  setSelectedSupplierTag,
  setSelectedSuppliers,
  supplierOptions,
  isEditMode,
  isDocNumDuplicate,
  setIsDocNumDuplicate,
  customerInquiryId,
  tagColors,
  setTagColors,
  handleTagClick,
  isCustomerModalOpen,
  setIsCustomerModalOpen,
  isVesselModalOpen,
  setIsVesselModalOpen,
}: InquiryFormProps) => {
  const [supplierSearch, setSupplierSearch] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [makerSearch, setMakerSearch] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [checkedSuppliers, setCheckedSuppliers] = useState<any[]>([]);
  const [supplierList, setSupplierList] = useState<
    { name: string; korName: string; id: number; code: string; email: string }[]
  >([]);

  const [autoSearchSupCompleteOptions, setAutoSearchSupCompleteOptions] =
    useState<{ value: string }[]>([]);
  const [makerOptions, setMakerOptions] = useState<{ value: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string }[]>(
    []
  );
  const [categoryWord, setCategoryWord] = useState<string>("");
  const [isRefNumDuplicate, setIsRefNumDuplicate] = useState<boolean>(false);
  const [makerSupplierList, setMakerSupplierList] = useState<
    {
      maker: string;
      supplierList: {
        id: number;
        code: string;
        name: string;
        korName: string;
        email: string;
      }[];
    }[]
  >([]);
  const [isFromAutoComplete, setIsFromAutoComplete] = useState(false);

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

  useEffect(() => {
    if (isFromAutoComplete && checkedSuppliers.length > 0) {
      checkedSuppliers.forEach((supplier) => handleTagClick(supplier.id));
      setIsFromAutoComplete(false); // 플래그를 초기화하여 다른 곳에서는 실행되지 않도록 함
      setCheckedSuppliers([]);
    } else if (isFromAutoComplete && selectedSuppliers.length > 0) {
      const lastSupplier = selectedSuppliers[selectedSuppliers.length - 1];
      handleTagClick(lastSupplier.id);
      setIsFromAutoComplete(false);
    }
  }, [selectedSuppliers, isFromAutoComplete, checkedSuppliers, handleTagClick]);

  useEffect(() => {
    const checkDuplicateOnMount = async () => {
      if (formValues.docNumber) {
        const isDuplicate = await chkDuplicateDocNum(
          formValues.docNumber.trim(),
          customerInquiryId
        );
        setIsDocNumDuplicate(isDuplicate); // 중복 여부 설정
      }
    };

    checkDuplicateOnMount();
  }, [formValues.docNumber, customerInquiryId, setIsDocNumDuplicate]);

  useEffect(() => {
    if (selectedSuppliers.length > 0) {
      const initialColors = selectedSuppliers.reduce((colors, supplier) => {
        colors[supplier.id] = "#007bff";
        return colors;
      }, {} as { [id: number]: string });

      setTagColors(initialColors);
    }
  }, []);

  const showModal = (type: string) => {
    setSelectedType(type);
    setSupplierSearch("");
    setCategoryWord("");
    setSupplierList([]);
    setMakerSupplierList([]);
    setCheckedSuppliers([]);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setMakerSearch("");
  };

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

      // 플래그 설정 - 자동완성 또는 모달에서 추가된 경우
      setIsFromAutoComplete(true);
      return updatedSuppliers;
    });

    handleModalClose();
  };

  const handleCheckboxChange = (supplier: { id: any }) => {
    setCheckedSuppliers((prevChecked) => {
      if (prevChecked.some((item) => item.id === supplier.id)) {
        return prevChecked.filter((item) => item.id !== supplier.id);
      } else {
        return [...prevChecked, supplier];
      }
    });
  };

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

  const removeDuplicates = (
    arr: { id: number; name: string; code: string }[]
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
        }));
        setSupplierList(options);

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
      setSupplierList([]);
    }
  };

  const handleMakerSearch = async (
    value: string,
    categoryType: string | null
  ) => {
    setMakerSearch(value);
    if (value) {
      try {
        const data = await searchSupplierUseMaker(value, categoryType!.trim());
        const makerSupplierList = data.makerSupplierList.map((maker) => ({
          maker: maker.maker,
          supplierList: maker.supplierList.map((supplier) => ({
            name: supplier.companyName,
            korName: supplier.korCompanyName || supplier.companyName,
            id: supplier.supplierId,
            code: supplier.code,
            email: supplier.email,
          })),
        }));

        // 상태 업데이트
        setMakerSupplierList(makerSupplierList);
        const makerOptions = data.makerSupplierList.map((maker) => ({
          value: maker.maker,
        }));
        setMakerOptions(makerOptions);
      } catch (error) {
        message.error("An error occurred while searching.");
      }
    } else {
      setMakerSupplierList([]);
    }
  };

  const handleSearch = (value: string, categoryType: string | null) => {
    if (selectedType === "SUPPLIER") {
      handleSupplierSearch(value);
    } else if (selectedType === "MAKER") {
      handleMakerSearch(value, categoryType);
    }
  };

  const uniqueSuppliers = removeDuplicates(selectedSuppliers);

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
      <Form layout="vertical" initialValues={formValues}>
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
                  customerInquiryId
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
            validateStatus={isRefNumDuplicate ? "error" : undefined} // 중복 여부에 따라 상태 설정
            help={
              isRefNumDuplicate ? "The Ref number is duplicated." : undefined
            } // 중복 메시지 설정
          >
            <Input
              value={formValues.refNumber}
              onChange={(e) => handleFormChange("refNumber", e.target.value)}
              onBlur={async (e) => {
                const refNumber = e.target.value.trim();
                const isDuplicate = await chkDuplicateRefNum(
                  refNumber,
                  customerInquiryId
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
              onChange={(value) => handleFormChange("currencyType", value)}
            >
              {["USD", "EUR", "INR"].map((currency) => (
                <Option key={currency} value={currency}>
                  {currency}
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
          >
            <Button
              type="primary"
              style={{ position: "absolute", top: "-35px", right: "0" }}
              onClick={() => setIsCustomerModalOpen(true)}
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
          >
            <Button
              type="primary"
              style={{ position: "absolute", top: "-35px", right: "0" }}
              onClick={() => setIsVesselModalOpen(true)}
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
            label="비고(Remark)"
            name="remark"
            style={{ flex: "30%" }}
          >
            <Input
              value={formValues.remark}
              onChange={(e) => handleFormChange("remark", e.target.value)}
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <SearchBox>
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

                    // 자동완성에서 선택된 경우 플래그 설정
                    setIsFromAutoComplete(true);
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
            {selectedType === "MAKER" && (
              <Modal
                title={"Search MAKER"}
                open={isModalVisible}
                onCancel={handleModalClose}
                onOk={handleAddSelectedSuppliers}
                okText="Add"
                cancelText="Cancel"
                width={800}
              >
                <AutoComplete
                  value={categoryWord}
                  options={categoryOptions}
                  style={{ width: "100%", marginBottom: 10 }}
                  onChange={handleCategorySearch}
                  placeholder="Search Category ex) ENGINE"
                >
                  <Input />
                </AutoComplete>
                <AutoComplete
                  value={makerSearch}
                  onChange={(value) => handleSearch(value, categoryWord)}
                  options={makerOptions}
                  style={{ width: "100%", marginBottom: 10 }}
                  placeholder="Search MAKER ex) HYUNDAI"
                >
                  <Input />
                </AutoComplete>
                <List
                  dataSource={removeListDuplicates(makerSupplierList)}
                  renderItem={(item) => (
                    <StyledListItem>
                      <MakerTitle>{item.maker}</MakerTitle>
                      <SupplierContainer>
                        {item.supplierList.map(
                          (supplier: { id: any; name?: any; code?: any }) => (
                            <SupplierItem key={supplier.id}>
                              <StyledCheckbox
                                onChange={() => handleCheckboxChange(supplier)}
                                checked={checkedSuppliers.some(
                                  (checkedItem) =>
                                    checkedItem.id === supplier.id
                                )}
                              >
                                {supplier.name || ""} ({supplier.code})
                              </StyledCheckbox>
                            </SupplierItem>
                          )
                        )}
                      </SupplierContainer>
                    </StyledListItem>
                  )}
                />
              </Modal>
            )}
            <span style={{ marginRight: 10 }}>Searched Suppliers: </span>
            {uniqueSuppliers.map((supplier) => (
              <Tag
                key={supplier.id}
                style={{
                  borderColor: tagColors[supplier.id] || "default",
                  cursor: "pointer",
                }}
                onClick={() => handleTagClick(supplier.id)}
                onClose={() => handleTagClick(supplier.id)}
              >
                {supplier.code}
              </Tag>
            ))}
          </SearchBox>
        </FormRow>
      </Form>
      {isCustomerModalOpen && (
        <CreateCompanyModal
          category={"customer"}
          onClose={() => setIsCustomerModalOpen(false)}
          onUpdate={() => setIsCustomerModalOpen(false)}
        />
      )}
      {isVesselModalOpen && (
        <CreateVesselModal
          onClose={() => setIsVesselModalOpen(false)}
          onUpdate={() => setIsVesselModalOpen(false)}
        />
      )}
    </>
  );
};

export default InquiryForm;
