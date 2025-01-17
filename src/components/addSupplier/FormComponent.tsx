import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  AutoComplete,
  Tag,
  message,
  Tooltip,
} from "antd";
import styled from "styled-components";
import {
  fetchCategory,
  searchSupplier,
  searchSupplierUseMaker,
} from "../../api/api";
import CreateCompanyModal from "../company/CreateCompanyModal";
import SearchMakerModal from "../makeInquiry/SearchMakerModal";
import { MakerSupplierList } from "../../types/types";

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
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [makerSupplierList, setMakerSupplierList] = useState<
    MakerSupplierList[]
  >([]);

  // 카테고리 목록 로드
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

  // 모달 열기
  const showModal = (type: string) => {
    setSelectedType(type);
    setSupplierSearch("");
    setCategoryWord("");
    setMakerSupplierList([]);
    setCheckedSuppliers([]);
    setIsModalVisible(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalVisible(false);
    setMakerSearch("");
  };

  // 선택된 매입처 추가
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

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (supplier: { id: any }) => {
    setCheckedSuppliers((prevChecked) => {
      if (prevChecked.some((item) => item.id === supplier.id)) {
        return prevChecked.filter((item) => item.id !== supplier.id);
      } else {
        return [...prevChecked, supplier];
      }
    });
  };

  // 매입처 검색 핸들러
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

  // 메이커 검색 핸들러
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

  // 검색 핸들러
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

  // 카테고리 검색 핸들러
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
