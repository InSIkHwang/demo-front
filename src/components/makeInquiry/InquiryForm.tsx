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
} from "antd";
import styled from "styled-components";
import CreateCompanyModal from "../company/CreateCompanyModal";
import CreateVesselModal from "../vessel/CreateVesselModal";
import { searchSupplier, searchSupplierUseMaker } from "../../api/api";

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
  align-items: center !important;
`;

const categoryList = [
  "ENGINE_AUX_ENGINE",
  "COMPRESSOR",
  "PUMP",
  "BOILER_INCINERATOR",
  "PURIFIER",
  "ELEC_EQUIPMENTS",
  "SEPARATOR",
  "CRANE",
  "SHIP_SUPPLIES",
  "VALVE",
  "CRANE_GRAB",
  "BLOWER_MOTOR",
  "THE_OTHERS",
  "ANODE",
  "FIRE_FIGHTING",
  "STEERING_GEAR",
  "LIFE_BOAT",
  "GALLEY_EQUIPMENTS",
  "HATCHCOVER",
  "COOLER",
  "AIR_DRYER",
  "BWTS",
];

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
  vesselNameList: { id: number; name: string }[];
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
    SetStateAction<{ id: number; name: string; code: string; email: string }[]>
  >;
  setSelectedSuppliers: Dispatch<
    SetStateAction<{ id: number; name: string; code: string; email: string }[]>
  >;
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
}: InquiryFormProps) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [tagColors, setTagColors] = useState<{ [id: number]: string }>({});
  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedType, setSelectedType] = useState("MAKER");
  const [supplierList, setSupplierList] = useState<
    { name: string; id: number; code: string; email: string }[]
  >([]);
  const [autoSearchSupCompleteOptions, setAutoSearchSupCompleteOptions] =
    useState<{ value: string }[]>([]);
  const [makerOptions, setMakerOptions] = useState<{ value: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string }[]>(
    []
  );
  const [categoryWord, setCategoryWord] = useState<string>("");
  const [makerSupplierList, setMakerSupplierList] = useState<
    {
      maker: string;
      supplierList: {
        id: number;
        code: string;
        name: string;
        email: string;
      }[];
    }[]
  >([]);

  useEffect(() => {
    if (selectedSuppliers.length > 0) {
      const initialColors = selectedSuppliers.reduce((colors, supplier) => {
        colors[supplier.id] = "#007bff";
        return colors;
      }, {} as { [id: number]: string });

      setTagColors(initialColors);
    }
  }, []);

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

  const handleSearch = async (value: string, categoryType: string | null) => {
    setSupplierSearch(value);
    if (value) {
      try {
        if (selectedType === "의뢰처") {
          const data = await searchSupplier(value);
          const options = data.suppliers.map((supplier) => ({
            name: supplier.companyName,
            id: supplier.id,
            code: supplier.code,
            email: supplier.email,
          }));
          setSupplierList(options);
          setAutoSearchSupCompleteOptions(
            options
              .filter((supplier) =>
                supplier.name.toLowerCase().includes(value.toLowerCase())
              )
              .map((supplier) => ({ value: supplier.name }))
          );
        } else if (selectedType === "MAKER") {
          const data = await searchSupplierUseMaker(value, categoryType);
          const makerSupplierList = data.makerSupplierList.map((maker) => ({
            maker: maker.maker,
            supplierList: maker.supplierList.map((supplier) => ({
              name: supplier.companyName,
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
        }
      } catch (error) {
        message.error("An error occurred while searching.");
      }
    } else {
      setSupplierList([]);
      setMakerSupplierList([]);
    }
  };
  const handleTagClick = (id: number) => {
    setSelectedSupplierTag((prevTags) => {
      const isAlreadySelected = prevTags.some((tag) => tag.id === id);
      const currentTags = [...prevTags];

      if (isAlreadySelected) {
        setTagColors((prevColors) => ({ ...prevColors, [id]: "#d9d9d9" }));
        return currentTags.filter((tag) => tag.id !== id);
      } else {
        const newTag = selectedSuppliers.find((supplier) => supplier.id === id);

        if (newTag) {
          if (currentTags.length >= 5) {
            message.error("Only up to 5 supplier can be registered.");
            return currentTags;
          }
          setTagColors((prevColors) => ({ ...prevColors, [id]: "#007bff" }));
          return [...currentTags, newTag];
        }
        return currentTags;
      }
    });
  };

  const uniqueSuppliers = removeDuplicates(selectedSuppliers);

  const handleAddSupplier = () => {
    let matchedSuppliers: any[] = [];

    if (selectedType === "의뢰처") {
      const matchedSupplier = supplierList.find(
        (supplier) =>
          supplier.name.toLowerCase() === supplierSearch.toLowerCase()
      );
      if (matchedSupplier) {
        matchedSuppliers = [matchedSupplier];
      }
    } else if (selectedType === "MAKER") {
      const matchedMaker = makerSupplierList.find(
        (maker) => maker.maker.toLowerCase() === supplierSearch.toLowerCase()
      );
      if (matchedMaker) {
        matchedSuppliers = matchedMaker.supplierList;
      }
    }

    if (matchedSuppliers.length > 0) {
      setSelectedSuppliers((prevSuppliers) => {
        const newSuppliers = matchedSuppliers.filter(
          (supplier) =>
            !prevSuppliers.some(
              (existingSupplier) => existingSupplier.id === supplier.supplierId
            )
        );

        if (newSuppliers.length === 0) {
          message.warning("This request has already been added.");
          return prevSuppliers;
        }

        const updatedSuppliers = [
          ...prevSuppliers,
          ...newSuppliers.map((supplier) => ({
            id: supplier.id,
            name: supplier.name,
            code: supplier.code,
            email: supplier.email,
          })),
        ];
        return updatedSuppliers;
      });

      setSupplierSearch("");
      setAutoSearchSupCompleteOptions([]);
    } else {
      message.warning(
        "No matching items were found in the searched supplier list."
      );
    }
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
            style={{ maxWidth: 200 }}
          >
            <Input
              value={formValues.docNumber}
              readOnly
              style={{ cursor: "default" }}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="작성일자(Register Date)"
            name="registerDate"
            rules={[{ required: true, message: "Please select register date" }]}
            style={{ maxWidth: 180 }}
          >
            <DatePicker
              value={formValues.registerDate}
              onChange={(date) => handleFormChange("registerDate", date!)}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="선적일자(Shipment date)"
            name="shippingDate"
            rules={[{ required: true, message: "Please select shipping date" }]}
            style={{ maxWidth: 180 }}
          >
            <DatePicker
              value={formValues.shippingDate}
              onChange={(date) => handleFormChange("shippingDate", date!)}
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
          >
            <Input
              type="number"
              value={formValues.currency}
              onChange={(e) =>
                handleFormChange("currency", parseFloat(e.target.value))
              }
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
                value: vessel.name, // UI에 표시될 이름
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
            style={{ flex: "20%" }}
            label="Ref No."
            name="refNumber"
            rules={[{ required: true, message: "Please enter ref number" }]}
          >
            <Input
              value={formValues.refNumber}
              onChange={(e) => handleFormChange("refNumber", e.target.value)}
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <InquiryItemForm
            label="비고(Remark)"
            name="remark"
            style={{ flex: "50%" }}
          >
            <Input
              value={formValues.remark}
              onChange={(e) => handleFormChange("remark", e.target.value)}
            />
          </InquiryItemForm>
        </FormRow>
        <FormRow>
          <SearchBox>
            <AutoComplete
              value={categoryWord}
              options={categoryOptions}
              style={{ width: 250, marginRight: 5 }}
              onChange={handleCategorySearch}
              placeholder="search for category"
            >
              <Input />
            </AutoComplete>
            <Select
              value={selectedType}
              onChange={(value) => setSelectedType(value)}
              style={{ width: 100, marginRight: 10 }}
            >
              <Option value="MAKER">MAKER</Option>
              <Option value="의뢰처">Supplier</Option>
            </Select>
            <InquiryItemForm name="searchSupplier">
              <AutoComplete
                value={supplierSearch}
                onChange={(value) => handleSearch(value, categoryWord)}
                options={
                  selectedType === "MAKER"
                    ? makerOptions
                    : autoSearchSupCompleteOptions
                }
                style={{ width: "100%" }}
                placeholder="search Maker or Supplier"
              >
                <Input style={{ marginTop: 3 }} />
              </AutoComplete>
            </InquiryItemForm>
            <Button onClick={handleAddSupplier} style={{ marginRight: 20 }}>
              ADD
            </Button>
            <span style={{ marginRight: 10 }}>Added Suplliers : </span>
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
