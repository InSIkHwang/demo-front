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
  DeleteMaker,
  fetchCategory,
  fetchSupplierDetail,
  searchSupplierUseMaker,
} from "../../api/api";
import LoadingSpinner from "../LoadingSpinner";

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
  margin-bottom: 16px;

  .ant-form-item-label {
    white-space: normal;
    word-wrap: break-word;
    font-weight: 600;
  }

  .ant-input[readonly] {
    background-color: #f5f5f5;
    border: 1px solid #d9d9d9;
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
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Company | null>(null);
  const [loadData, setLoadData] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = AntForm.useForm();
  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
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

  useEffect(() => {
    const fetchCategoryList = async () => {
      try {
        const response = await fetchCategory();
        setCategoryList(response.categoryType);
        setInitialCategoryList(response.categoryType);
      } catch (error) {
        console.error("Error fetching category list:", error);
      }
    };

    fetchCategoryList();
  }, []);

  const getCompanyDetails = async () => {
    setIsLoading(true);
    try {
      const supplierDetail = await fetchSupplierDetail(company.id, category);
      setFormData(supplierDetail);
      setLoadData(supplierDetail);
      setMakerCategoryList(supplierDetail.makerCategoryList);
    } catch (error) {
      console.error("Error fetching supplier details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (company.id) {
      getCompanyDetails();
    }
  }, []);

  useEffect(() => {
    if (formData) {
      // formData가 null이 아닐 때만 실행
      checkCodeUnique();
    }
  }, [formData?.code]);

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

        const makerOptions = data.makerSupplierList.map((item) => ({
          value: item.maker,
          label: item.maker,
        }));

        setMakerOptions(makerOptions);
      } catch (error) {
        message.error("An error occurred while searching.");
      }
    } else {
      setMakerOptions([]);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "add_new_category") {
      setIsAddingNewCategory(true);
      setSelectedCategory("");
    } else {
      setSelectedCategory(value);
      setIsAddingNewCategory(false); // 기존 카테고리를 선택하면 Input 창 숨기기
    }
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      setCategoryList([...categoryList, newCategory]);
      setSelectedCategory(newCategory);
      setIsAddingNewCategory(false);
      setNewCategory(""); // 입력값 초기화
    }
  };

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

          getCompanyDetails();
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
            getCompanyDetails();
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

  const handleChange = (changedValues: any) => {
    setFormData({
      ...formData,
      ...changedValues,
    });
  };

  const checkCodeUnique = async () => {
    if (formData) {
      // formData가 null이 아닐 때만 실행
      if (company.code !== formData.code) {
        if ((formData.code + "").trim() === "") {
          setIsCodeUnique(true);
          return;
        }
        setIsCheckingCode(true);
        try {
          const endpoint =
            category === "customer"
              ? `/api/customers/check-code/${formData.code}`
              : `/api/suppliers/check-code/${formData.code}`;
          const response = await axios.get(endpoint);
          setIsCodeUnique(!response.data); // 응답 T/F를 반전시킴
        } catch (error) {
          message.error("Error checking code unique");
          setIsCodeUnique(true); // 오류가 발생하면 기본적으로 유효하다고 처리
        } finally {
          setIsCheckingCode(false);
        }
      } else if (company.code === formData.code) {
        setIsCodeUnique(true);
        setIsCheckingCode(false);
      }
    }
  };

  const editData = async () => {
    if (formData) {
      try {
        const endpoint =
          category === "customer"
            ? `/api/customers/${formData.id}`
            : `/api/suppliers/${formData.id}`;
        await axios.put(endpoint, formData);
        message.success("Successfully updated.");
      } catch (error) {
        message.error("An error occurred while updating.");
      }
    }
  };

  const deleteData = async () => {
    if (formData) {
      try {
        const endpoint =
          category === "customer"
            ? `/api/customers/${formData.id}`
            : `/api/suppliers/${formData.id}`;
        await axios.delete(endpoint);
        message.success("Successfully deleted.");
      } catch (error) {
        message.error("An error occurred while deleting.");
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    await editData();
    setLoading(false);
    onUpdate();
    setIsEditing(false);
    getCompanyDetails();
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: "Are you sure you want to delete?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setLoading(true);
        await deleteData();
        setLoading(false);
        onUpdate();
        onClose();
      },
    });
  };

  if (!formData) {
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
        initialValues={formData || undefined}
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

        {category === "supplier" && (
          <>
            <Divider />
            <Card
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
              {formData.makerCategoryList?.map(({ category, makers }) => (
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
                      <Tag
                        key={maker}
                        closeIcon={isEditing ? true : null}
                        onClose={
                          isEditing
                            ? (e) => handleTagClose(category, maker, e)
                            : undefined
                        }
                      >
                        {maker}
                      </Tag>
                    ))}
                  </Flex>
                </>
              ))}
            </Card>
            <Divider />
          </>
        )}
        <ButtonGroup>
          {isEditing ? (
            <>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={
                  !isCodeUnique ||
                  formData.code === "" ||
                  formData.companyName === ""
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
          <Button danger onClick={handleDelete} loading={loading} size="middle">
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
