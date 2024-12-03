import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  notification,
  message,
  Tag,
  Card,
  Divider,
  Flex,
  Select,
  AutoComplete,
} from "antd";
import axios from "../../api/axios";
import styled from "styled-components";
import { fetchCategory, searchSupplierUseMaker } from "../../api/api";

const { Option } = Select;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 20px;
    padding: 30px;
    background: linear-gradient(to bottom right, #ffffff, #f8f9fa);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  }

  .ant-modal-header {
    border-bottom: none;
    text-align: center;
    margin-bottom: 24px;
  }

  .ant-modal-title {
    font-size: 24px;
    font-weight: 700;
    color: #333;
  }

  .ant-modal-close {
    top: 24px;
    right: 24px;
    transition: transform 0.2s ease;

    &:hover {
      transform: rotate(90deg);
    }
  }
`;

const StyledForm = styled(Form)`
  max-width: 100%;
`;

const StyledFormItem = styled(Form.Item)`
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

interface Payload {
  code: string;
  companyName: string;
  korCompanyName?: string;
  phoneNumber: string;
  representative: string;
  email: string;
  address: string;
  communicationLanguage: string;
  makerCategoryList?: { category: string; makers: string[] }[]; // supplier일 때만 전송
  supplierRemark?: string; // supplier일 때만 전송
}

interface ModalProps {
  category: string;
  onClose: () => void;
  onUpdate: () => void;
}

const CreateCompanyModal = ({ category, onClose, onUpdate }: ModalProps) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    korName: "",
    contact: "",
    manager: "",
    email: "",
    address: "",
    language: "",
    headerMessage: "",
    supplierRemark: "",
  });

  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

  const handleAddMaker = () => {
    if (!selectedCategory || !makerSearch) {
      message.error("Please select a category and enter a maker.");
      return;
    }

    // 기존 리스트에 해당 카테고리가 있는지 확인
    const existingCategory = makerCategoryList.find(
      (item) => item.category === selectedCategory
    );

    if (existingCategory) {
      // 해당 카테고리에 새로운 maker 추가
      setMakerCategoryList((prevList) =>
        prevList.map((item) =>
          item.category === selectedCategory
            ? { ...item, makers: [...item.makers, makerSearch] }
            : item
        )
      );
    } else {
      // 새로운 카테고리와 maker 추가
      setMakerCategoryList((prevList) => [
        ...prevList,
        { category: selectedCategory, makers: [makerSearch] },
      ]);
    }

    // 입력값 초기화
    setMakerSearch("");
  };

  const handleTagClose = (category: string, maker: string) => {
    setMakerCategoryList((prevList) =>
      prevList.map((item) =>
        item.category === category
          ? { ...item, makers: item.makers.filter((m) => m !== maker) }
          : item
      )
    );
  };

  const debounce = <T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ) => {
    let timer: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const checkCodeUnique = debounce(async () => {
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
  }, 200);

  useEffect(() => {
    checkCodeUnique();
  }, [formData.code]);

  const postCreate = async (values: {
    code: string;
    name: string;
    korName: string;
    contact: string;
    manager: string;
    email: string;
    address: string;
    language: string;
    supplierRemark: string;
  }) => {
    try {
      setLoading(true);
      const endpoint =
        category === "customer" ? "/api/customers" : "/api/suppliers";

      const payload: Payload = {
        code: values.code,
        companyName: values.name,
        phoneNumber: values.contact,
        representative: values.manager,
        email: values.email,
        address: values.address,
        communicationLanguage: values.language,
        supplierRemark: values.supplierRemark,
      };

      // category가 supplier인 경우 makerCategoryList 추가
      if (category === "supplier") {
        payload.makerCategoryList = makerCategoryList;
        payload.korCompanyName = values.korName;
      }

      await axios.post(endpoint, payload);

      notification.success({
        message: "Registration complete",
        description: "You have registered successfully.",
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error posting data:", error);
      notification.error({
        message: "Registration failed",
        description: "An error occurred while registering.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!isCodeUnique) return; // 코드가 유효하지 않으면 제출하지 않음
    await postCreate(values);
  };

  return (
    <StyledModal
      open={true}
      onCancel={onClose}
      footer={null}
      title={
        category === "customer"
          ? "New customer registration"
          : category === "supplier"
          ? "New Supplier registration"
          : "등록"
      }
      width={700}
    >
      <StyledForm
        layout="horizontal"
        labelCol={{ span: 5 }}
        onFinish={handleSubmit}
        size="small"
      >
        <StyledFormItem
          label="code:"
          name="code"
          validateStatus={
            formData.code === "" ? "error" : !isCodeUnique ? "error" : "success"
          }
          help={
            formData.code === ""
              ? "Enter code!"
              : !isCodeUnique
              ? "Invalid code."
              : ""
          }
          rules={[{ required: true, message: "Enter code!" }]}
          hasFeedback
        >
          <Input
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="FlowMate"
          />
        </StyledFormItem>
        <StyledFormItem
          label="name:"
          name="name"
          rules={[{ required: true, message: "Please enter name!" }]}
        >
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="FlowMate"
          />
        </StyledFormItem>
        {category === "supplier" && (
          <StyledFormItem label="name (KOR):" name="korName">
            <Input
              name="korName"
              value={formData.korName}
              onChange={handleChange}
              placeholder="바스코리아"
            />
          </StyledFormItem>
        )}
        <StyledFormItem label="contact:" name="contact">
          <Input
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="051-123-4567"
          />
        </StyledFormItem>
        <StyledFormItem label="manager:" name="manager">
          <Input
            name="manager"
            value={formData.manager}
            onChange={handleChange}
            placeholder="김바스"
          />
        </StyledFormItem>
        <StyledFormItem label="email:" name="email">
          <Input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="info@bas-korea.com"
          />
        </StyledFormItem>
        <StyledFormItem label="address:" name="address">
          <Input
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="부산광역시 해운대구"
          />
        </StyledFormItem>
        <StyledFormItem label="language:" name="language">
          <Input
            name="language"
            value={formData.language}
            onChange={handleChange}
            placeholder="KOR"
          />
        </StyledFormItem>
        <StyledFormItem label="Header Message:" name="headerMessage">
          <Input.TextArea
            name="headerMessage"
            value={formData.headerMessage}
            onChange={handleChange}
            placeholder="We wish your company continued success."
          />
        </StyledFormItem>
        {category === "supplier" && (
          <StyledFormItem label="remark:" name="supplierRemark">
            <Input.TextArea
              name="supplierRemark"
              value={formData.supplierRemark}
              onChange={handleChange}
              placeholder="TEST item is no longer handled by our purchaser."
            />
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
              {makerCategoryList.map(({ category, makers }) => (
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
                        closeIcon
                        onClose={() => handleTagClose(category, maker)}
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

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={
            !isCodeUnique || formData.code === "" || formData.name === ""
          }
          block
          size="middle"
        >
          Submit
        </Button>
      </StyledForm>
    </StyledModal>
  );
};

export default CreateCompanyModal;
