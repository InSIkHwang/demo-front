import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  AutoComplete,
  Tag,
  message,
  List,
  Modal,
  Checkbox,
  Tooltip,
} from "antd";
import styled from "styled-components";
import {
  fetchCategory,
  searchSupplier,
  searchSupplierUseMaker,
} from "../../api/api";
import CreateCompanyModal from "../company/CreateCompanyModal";

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
  selectedSuppliers: {
    id: number;
    name: string;
    code: string;
    email: string;
    communicationLanguage: string;
    supplierRemark: string;
  }[];
  handleFormChange: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void;
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
  mode: string;
}

const FormComponent = ({
  formValues,
  selectedSuppliers,
  setSelectedSuppliers,
  mode,
}: InquiryFormProps) => {
  const [supplierSearch, setSupplierSearch] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [makerSearch, setMakerSearch] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [checkedSuppliers, setCheckedSuppliers] = useState<any[]>([]);

  const [autoSearchSupCompleteOptions, setAutoSearchSupCompleteOptions] =
    useState<{ value: string }[]>([]);
  const [makerOptions, setMakerOptions] = useState<{ value: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string }[]>(
    []
  );
  const [categoryWord, setCategoryWord] = useState<string>("");
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
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

  const showModal = (type: string) => {
    setSelectedType(type);
    setSupplierSearch("");
    setCategoryWord("");
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
      const uniqueIds = new Set(prevSuppliers.map((supplier) => supplier.id));
      const newSuppliers = checkedSuppliers.filter(
        (supplier) => !uniqueIds.has(supplier.id)
      );
      return [...prevSuppliers, ...newSuppliers];
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
            communicationLanguage: supplier.communicationLanguage || "KOR",
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

  const handleClose = (removedSupplier: any) => {
    setSelectedSuppliers((prevSuppliers) =>
      prevSuppliers.filter((supplier) => supplier.id !== removedSupplier.id)
    );
  };

  return (
    <>
      <Form layout="vertical" initialValues={formValues}>
        <FormRow>
          <InquiryItemForm
            label="문서번호(Document No.)"
            name="docNumber"
            style={{ maxWidth: 300 }}
          >
            <Input disabled />
          </InquiryItemForm>
          <InquiryItemForm
            style={{ flex: "20%" }}
            label="Ref No."
            name="refNumber"
          >
            <Input value={formValues.refNumber} disabled />
          </InquiryItemForm>
          <InquiryItemForm
            label="작성일자(Register Date)"
            name="registerDate"
            style={{ width: 120 }}
          >
            <DatePicker
              value={formValues.registerDate}
              style={{ width: "100%" }}
              disabled
            />
          </InquiryItemForm>
          <InquiryItemForm label="화폐(Currency)" name="currencyType">
            <Input value={formValues.currencyType} disabled />
          </InquiryItemForm>
          <InquiryItemForm
            label="환율(Exchange Rate)"
            name="currency"
            style={{ width: 100 }}
          >
            <Input
              type="number"
              value={formValues.currency || 0} // currency의 초기값이 없는 경우 빈 문자열
              disabled
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <InquiryItemForm label="매출처(Customer)" name="customer">
            <Input value={formValues.customer} disabled />
          </InquiryItemForm>
          <InquiryItemForm label="선명(Vessel Name)" name="vesselName">
            <Input value={formValues.vesselName} disabled />
          </InquiryItemForm>
          <InquiryItemForm
            label="비고(Remark)"
            name="remark"
            style={{ flex: "30%" }}
          >
            <Input value={formValues.remark} disabled />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          {mode === "add" ? (
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
                    onClick={() => setIsSupplierModalOpen(true)}
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
                    onSelect={(value: string, option: any) => {
                      const selectedSupplier = option.supplier;
                      if (selectedSupplier) {
                        setSelectedSuppliers((prevSuppliers) => {
                          // 중복 제거를 위한 Set 생성
                          const uniqueIds = new Set(
                            prevSuppliers.map((supplier) => supplier.id)
                          );

                          // 이미 존재하는 supplier가 아닌 경우에만 추가
                          if (!uniqueIds.has(selectedSupplier.id)) {
                            return [...prevSuppliers, selectedSupplier];
                          }
                          return prevSuppliers;
                        });
                      }
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
                                  onChange={() =>
                                    handleCheckboxChange(supplier)
                                  }
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedSuppliers.map((supplier) => (
                  <Tooltip title={supplier.supplierRemark} color="red">
                    <StyledTag
                      key={supplier.id}
                      closable
                      color={supplier.supplierRemark ? "#f5222d" : "default"}
                      style={{
                        cursor: "pointer",
                        transition: "all 0.3s",
                      }}
                      onClose={(e) => {
                        e.preventDefault();
                        handleClose(supplier);
                      }}
                    >
                      {supplier.code}
                    </StyledTag>
                  </Tooltip>
                ))}
              </div>
            </SearchBox>
          ) : (
            <div style={{ display: "flex", alignItems: "center" }}>
              <h3 style={{ marginRight: 10 }}>Selected Suppliers: </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedSuppliers.map((supplier) => (
                  <StyledTag>{supplier.code}</StyledTag>
                ))}
              </div>
            </div>
          )}
        </FormRow>
      </Form>
      {isSupplierModalOpen && (
        <CreateCompanyModal
          category={"supplier"}
          onClose={() => setIsSupplierModalOpen(false)}
          onUpdate={() => setIsSupplierModalOpen(false)}
        />
      )}
    </>
  );
};

export default FormComponent;
