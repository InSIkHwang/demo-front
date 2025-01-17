import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Divider,
  message,
  Form as AntForm,
  Input,
  Card,
  Select,
  Flex,
  Tag,
  AutoComplete,
} from "antd";
import axios from "../../api/axios";
import styled from "styled-components";
import {
  AddMaker,
  checkCompanyCodeUnique,
  deleteCompany,
  DeleteMaker,
  fetchCategory,
  fetchCompanyDetail,
  searchSupplierUseMaker,
  updateCompany,
} from "../../api/api";
import LoadingSpinner from "../LoadingSpinner";
import {
  QueryClient,
  QueryCache,
  useQuery,
  useMutation,
} from "@tanstack/react-query";

const { Option } = Select;
const { confirm } = Modal;

interface Company {
  id: number;
  code: string;
  companyName: string;
  korCompanyName?: string;
  phoneNumber: string;
  representative: string;
  email: string;
  address: string;
  communicationLanguage: string;
  modifiedAt: string;
  headerMessage: string;
  margin?: number;
  supplierRemark?: string;
  makerCategoryList?: { category: string; makers: string[] }[];
}

interface ModalProps {
  category: string;
  company: Company;
  onClose: () => void;
  onUpdate: () => void;
}

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    padding: 20px;
  }

  .ant-modal-header {
    border-bottom: none;
    text-align: center;
  }

  .ant-modal-title {
    font-size: 24px;
    font-weight: 700;
    color: #333;
  }

  .ant-modal-close {
    top: 20px;
    right: 20px;
  }

  .ant-divider-horizontal {
    margin: 12px 0;
  }

  .ant-modal-footer {
    display: flex;
    justify-content: flex-end;
    border-top: none;
    padding-top: 20px;
  }
`;

const StyledFormItem = styled(AntForm.Item)`
  margin-bottom: 20px;

  .ant-form-item-label {
    white-space: normal;
    word-wrap: break-word;
    font-weight: 600;
    color: #2d3748;
  }

  .ant-input {
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    padding: 2px 6px;
    transition: all 0.3s ease;

    &:hover,
    &:focus {
      border-color: #4299e1;
      box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
    }
  }

  .ant-input[readonly] {
    background-color: #f7fafc;
    border: 1px solid #edf2f7;
  }
`;

const StyledCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;

  .ant-card-head {
    background: #4096ff;
    border-radius: 16px 16px 0 0;
    color: white;
    padding: 16px 24px;
  }

  .ant-card-body {
    padding: 24px;
  }
`;

const StyledTag = styled(Tag)`
  border-radius: 20px;
  padding: 4px 12px;
  margin: 4px;
  font-size: 13px;
  border: none;
  background: #edf2f7;
  color: #2d3748;
  transition: all 0.3s ease;

  &:hover {
    background: #e2e8f0;
    transform: translateY(-1px);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const DetailCompanyModal = ({
  category,
  company,
  onClose,
  onUpdate,
}: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Company | null>(null);
  const [loadData, setLoadData] = useState<Company | null>(null);
  const [form] = AntForm.useForm();
  const [makerCategoryList, setMakerCategoryList] = useState<
    { category: string; makers: string[] }[]
  >([]);
  const [makerSearch, setMakerSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [makerOptions, setMakerOptions] = useState<{ value: string }[]>([]);
  const [initialCategoryList, setInitialCategoryList] = useState<string[]>([]);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error: any, query: any) => {
        if (query.meta.errorMessage) {
          message.error(query.meta.errorMessage);
        }
      },
    }),
  });

  // 카테고리 목록 로드
  const { data: categoryData } = useQuery({
    queryKey: ["category"],
    queryFn: fetchCategory,
    meta: {
      errorMessage:
        "Failed to fetch category list(카테고리 목록을 불러오는데 실패했습니다.)",
    },
  });

  // categoryData가 변경될 때마다 상태 업데이트를 위한 useEffect 추가
  useEffect(() => {
    if (categoryData?.categoryType) {
      const sortedCategories = [...categoryData.categoryType].sort(
        (a: string, b: string) => a.localeCompare(b)
      );
      setCategoryList(sortedCategories);
      setInitialCategoryList(sortedCategories);
    }
  }, [categoryData]);

  // 매입처 상세 정보 가져오기
  const {
    data: companyDetail,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["companyDetail", company.id, category],
    queryFn: () => fetchCompanyDetail(company.id, category),
    enabled: !!company.id,
    staleTime: 30000,
    meta: {
      errorMessage: "고객사/매입처 상세 정보를 불러오는데 실패했습니다.",
    },
  });

  useEffect(() => {
    if (companyDetail) {
      setFormData(companyDetail);
      setLoadData(companyDetail);
      setMakerCategoryList(companyDetail.makerCategoryList || []);
    }
  }, [companyDetail]);

  // 메이커 검색 핸들러
  const handleMakerSearch = async (
    value: string,
    categoryType: string | null
  ) => {
    setMakerSearch(value);

    if (categoryType && !initialCategoryList.includes(categoryType)) {
      categoryType = ""; // 빈 문자열로 설정
    }

    if (value) {
      try {
        const data = await searchSupplierUseMaker(value, categoryType);

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
      setMakerOptions([]);
    }
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (value: string) => {
    if (value === "add_new_category") {
      setIsAddingNewCategory(true);
      setSelectedCategory("");
    } else {
      setSelectedCategory(value);
      setIsAddingNewCategory(false); // 기존 카테고리를 선택하면 Input 창 숨기기
    }
  };

  // 새로운 카테고리 추가 핸들러
  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      setCategoryList([...categoryList, newCategory]);
      setSelectedCategory(newCategory);
      setIsAddingNewCategory(false);
      setNewCategory(""); // 입력값 초기화
    }
  };

  // 메이커 추가 핸들러
  const handleAddMaker = async () => {
    if (!selectedCategory || !makerSearch) {
      message.error("Please select a category and enter a maker.");
      return;
    }

    const existingCategory = makerCategoryList.find(
      (item) =>
        item.category === selectedCategory && item.makers.includes(makerSearch)
    );

    if (existingCategory) {
      message.warning("This maker has already been added.");
    } else {
      if (formData) {
        try {
          await AddMaker(formData.id, selectedCategory, makerSearch);

          refetch();
          message.success("maker has been added successfully.");
        } catch (error) {
          console.error("Error add maker:", error);
          message.error("Failed to add maker. Please try again.");
        }
      } else {
        message.error("Please Check Supplier.");
        return;
      }
    }

    // 입력값 초기화
    setMakerSearch("");
  };

  // 메이커 태그 닫기 핸들러
  const handleTagClose = async (
    category: string,
    maker: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();

    if (formData) {
      confirm({
        title: "Are you sure you want to delete this maker?",
        content: "Once deleted, this action cannot be undone.",
        okText: "Delete",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await DeleteMaker(formData.id, category, maker);
            refetch();
            message.success("Maker has been deleted successfully.");
          } catch (error) {
            console.error("Error deleting maker:", error);
            message.error("Failed to delete maker. Please try again.");
          }
        },
        onCancel() {
          message.info("Deletion has been canceled.");
        },
      });
    } else {
      message.error("Please check supplier.");
      return;
    }
  };

  // 입력 핸들러
  const handleChange = (changedValues: any) => {
    if ("margin" in changedValues) {
      changedValues.margin = changedValues.margin
        ? Number(changedValues.margin)
        : null;
    }
    setFormData({
      ...formData,
      ...changedValues,
    });
  };

  // 코드 고유성 검사 함수
  const { data: isCodeUnique = true, isFetching: isCheckingCode } = useQuery({
    queryKey: ["checkCompanyCode", category, formData?.code],
    queryFn: () => {
      // 로드된 데이터의 코드와 현재 폼 데이터의 코드가 같으면 true 반환
      if (loadData && formData && loadData.code === formData.code) {
        return true;
      }
      // 다른 경우에는 API 호출하여 중복 체크
      return checkCompanyCodeUnique(category, formData?.code || "");
    },
    enabled: formData?.code.trim() !== "" && isEditing, // 편집 모드이고 코드가 비어있지 않을 때만 실행
    staleTime: 30000,
    meta: {
      errorMessage: "Failed to check code uniqueness(코드 고유성 확인 실패)",
    },
  });

  // 데이터 업데이트 함수
  const updateCompanyMutation = useMutation({
    mutationFn: () => {
      if (!formData) throw new Error("Please check supplier.");
      return updateCompany(category, formData.id, formData);
    },
    onSuccess: () => {
      message.success("Successfully updated.");
      queryClient.invalidateQueries({
        queryKey: ["companyDetail", company.id],
      });
      queryClient.invalidateQueries({ queryKey: [`${category}List`] });
      onUpdate();
      setIsEditing(false);
    },
    onError: () => {
      message.error("An error occurred while updating.");
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: () => {
      if (!formData) throw new Error("Please check supplier.");
      return deleteCompany(category, formData.id);
    },
    onSuccess: () => {
      message.success("Successfully deleted.");
      queryClient.invalidateQueries({ queryKey: [`${category}List`] });
      onUpdate();
      onClose();
    },
    onError: () => {
      message.error("An error occurred while deleting.");
    },
  });

  // 핸들러 수정
  const handleSubmit = () => {
    updateCompanyMutation.mutate();
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Are you sure you want to delete this supplier?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        deleteCompanyMutation.mutate();
      },
    });
  };

  if (isLoading || !formData) {
    return <LoadingSpinner />;
  }

  return (
    <StyledModal
      open={true}
      onCancel={onClose}
      footer={null}
      title={category === "customer" ? "Customer Details" : "Supplier Details"}
      width={700}
    >
      <AntForm
        form={form}
        layout="horizontal"
        labelCol={{ span: 7 }}
        initialValues={formData}
        onValuesChange={handleChange}
        size="small"
      >
        <StyledFormItem
          label="Code"
          name="code"
          rules={[{ required: true, message: "Please enter the code!" }]}
          hasFeedback={isEditing}
          validateStatus={
            formData?.code === ""
              ? "error"
              : !isCodeUnique
              ? "error"
              : "success"
          }
          help={
            formData?.code === ""
              ? "Enter code!"
              : !isCodeUnique
              ? "Invalid code."
              : ""
          }
        >
          <Input readOnly={!isEditing} />
        </StyledFormItem>
        <StyledFormItem
          label="Company Name"
          name="companyName"
          rules={[
            { required: true, message: "Please enter the company name!" },
          ]}
        >
          <Input readOnly={!isEditing} />
        </StyledFormItem>
        {category === "supplier" && (
          <StyledFormItem label="Company Name(KOR)" name="korCompanyName">
            <Input readOnly={!isEditing} />
          </StyledFormItem>
        )}
        <StyledFormItem label="Phone Number" name="phoneNumber">
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem label="Representative" name="representative">
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem label="Email" name="email">
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem label="Address" name="address">
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem
          label="Communication Language"
          name="communicationLanguage"
        >
          <Input readOnly={!isEditing} />
        </StyledFormItem>

        <StyledFormItem label="Modified At" name="modifiedAt">
          <Input readOnly />
        </StyledFormItem>

        <StyledFormItem label="Header Message" name="headerMessage">
          <Input.TextArea readOnly={!isEditing} />
        </StyledFormItem>
        {category === "customer" && (
          <StyledFormItem
            label="Margin:"
            name="margin"
            rules={[
              {
                pattern: /^\d*\.?\d*$/,
                message: "Only numbers can be entered",
              },
            ]}
          >
            <Input readOnly={!isEditing} type="number" min={0} />
          </StyledFormItem>
        )}
        {category === "supplier" && (
          <StyledFormItem label="remark:" name="supplierRemark">
            <Input.TextArea readOnly={!isEditing} />
          </StyledFormItem>
        )}

        {category === "supplier" && (
          <>
            <Divider />
            <StyledCard
              title="Category & Maker"
              style={{
                padding: "16px",
                border: "1px solid #ccc",
                marginBottom: 20,
              }}
            >
              {isEditing && (
                <div style={{ display: "flex", gap: 5 }}>
                  <Select
                    dropdownStyle={{ width: "300px" }}
                    style={{ flex: 2 }}
                    placeholder="Select Category"
                    onChange={handleCategoryChange}
                    value={selectedCategory}
                  >
                    <Option
                      key="add_new_category"
                      value="add_new_category"
                      style={{ color: "#4096ff" }}
                    >
                      Add new category...
                    </Option>
                    {categoryList.map((category) => (
                      <Option key={category} value={category}>
                        {category}
                      </Option>
                    ))}
                  </Select>
                  {isAddingNewCategory && (
                    <div style={{ flex: 7, display: "flex", gap: 5 }}>
                      <Input
                        style={{ flex: 7 }}
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter new category name"
                      />
                      <Button
                        type="primary"
                        style={{ flex: 3 }}
                        onClick={handleAddNewCategory}
                      >
                        Add new category
                      </Button>
                    </div>
                  )}
                  {!isAddingNewCategory && (
                    <>
                      <AutoComplete
                        value={makerSearch}
                        onChange={(value) =>
                          handleMakerSearch(value, selectedCategory)
                        }
                        options={makerOptions}
                        style={{ flex: 7 }}
                        placeholder="Maker name: ex) HYUNDAI"
                      >
                        <Input />
                      </AutoComplete>
                      <Button
                        style={{ float: "right", flex: 1 }}
                        type="primary"
                        onClick={handleAddMaker}
                      >
                        Add
                      </Button>
                    </>
                  )}
                </div>
              )}
              {formData?.makerCategoryList?.map(({ category, makers }) => (
                <>
                  <Divider
                    orientation="left"
                    plain
                    style={{ borderColor: "#555" }}
                  >
                    {category}
                  </Divider>
                  <Flex gap="4px 0" wrap>
                    {makers.map((maker) => (
                      <StyledTag
                        key={maker}
                        closeIcon={isEditing ? true : null}
                        onClose={
                          isEditing
                            ? (e) => handleTagClose(category, maker, e)
                            : undefined
                        }
                      >
                        {maker}
                      </StyledTag>
                    ))}
                  </Flex>
                </>
              ))}
            </StyledCard>
            <Divider />
          </>
        )}
        <ButtonGroup>
          {isEditing ? (
            <>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={updateCompanyMutation.isPending}
                disabled={
                  !isCodeUnique ||
                  formData?.code === "" ||
                  formData?.companyName === "" ||
                  updateCompanyMutation.isPending
                }
                size="middle"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(loadData);
                  form.setFieldsValue(loadData);
                }}
                size="middle"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              onClick={() => setIsEditing(true)}
              size="middle"
            >
              Edit
            </Button>
          )}
          <Button
            danger
            onClick={handleDelete}
            loading={deleteCompanyMutation.isPending}
            disabled={deleteCompanyMutation.isPending}
            size="middle"
          >
            Delete
          </Button>
          <Button onClick={onClose} size="middle">
            Close
          </Button>
        </ButtonGroup>
      </AntForm>
    </StyledModal>
  );
};

export default DetailCompanyModal;
