import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Table,
  message,
  AutoComplete,
} from "antd";
import moment from "moment";
import axios from "../api/axios";

const { Option } = Select;

const FormContainer = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  padding-bottom: 80px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 70vw;
  margin: 0 auto;
  margin-bottom: 200px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
`;

const InquiryItemForm = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

const FormRow = styled.div`
  display: flex;
`;

const AddButton = styled(Button)`
  margin-top: 5px;
`;

interface Customer {
  id: number;
  code: string;
  companyName: string;
  phoneNumber: string;
  representative: string;
  email: string;
  address: string;
  country: string;
  communicationLanguage: string;
  modifiedAt: string;
  vesselList: Array<{
    id: number;
    code: string;
    vesselName: string;
    vesselCompanyName: string;
    imoNumber: number;
    hullNumber: string;
    shipYard: string;
  }>;
}

interface InquiryItem {
  no: number;
  itemId: number;
  itemType: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  itemRemark: string;
  supplierIdList: string[];
}

const MAX_REQUESTERS = 5;

const MakeInquiry = () => {
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [itemCount, setItemCount] = useState(1);
  const [requesterCount, setRequesterCount] = useState(3);
  const [vesselList, setVesselList] = useState<
    Array<{ id: number; vesselName: string }>
  >([]);

  const [companyNameList, setCompanyNameList] = useState<string[]>([]);
  const [vesselNameList, setVesselNameList] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);

  const [autoCompleteOptions, setAutoCompleteOptions] = useState<
    { value: string }[]
  >([]);

  const [formValues, setFormValues] = useState({
    registerDate: moment().startOf("day"),
    shippingDate: moment().startOf("day"),
    customer: "",
    vesselName: "",
    refNumber: "",
    currencyType: "USD",
    currency: 0,
    remark: "",
  });

  // Initialize items with default values
  const initializeItems = () => {
    setItems([createNewItem()]);
  };

  // Create a new inquiry item with default values
  const createNewItem = (): InquiryItem => ({
    no: itemCount,
    itemId: 0,
    itemType: "ITEM",
    itemCode: "",
    itemName: "",
    qty: 0,
    unit: "",
    itemRemark: "",
    supplierIdList: Array(requesterCount).fill(""),
  });

  // Add a new inquiry item
  const addItem = () => {
    setItems([...items, createNewItem()]);
    setItemCount(itemCount + 1);
  };

  // 항목 필드 업데이트
  const handleInputChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      if (field.startsWith("supplierIdList")) {
        // supplierIdList 변경 처리
        const supplierIndex = parseInt(field.match(/\d+/)?.[0] || "0", 10);
        newItems[index].supplierIdList[supplierIndex] = value as string;
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }
      return newItems;
    });
  };

  // Add a requester field
  const addRequesterField = () => {
    if (requesterCount < MAX_REQUESTERS) {
      setRequesterCount(requesterCount + 1);
      setItems(
        items.map((item) => ({
          ...item,
          supplierIdList: [...item.supplierIdList, ""],
        }))
      );
    }
  };

  // Handle keydown event to change item type
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    const itemTypeMap: Record<string, string> = {
      "1": "MAKER",
      "2": "TYPE",
      "3": "DESC",
      "4": "ITEM",
    };
    if (itemTypeMap[e.key]) {
      handleInputChange(index, "itemType", itemTypeMap[e.key]);
    }
  };

  // Update form field values
  const handleFormChange = <K extends keyof typeof formValues>(
    key: K,
    value: (typeof formValues)[K]
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Update auto-complete options if customer field changes
    if (key === "customer" && typeof value === "string") {
      setAutoCompleteOptions(
        companyNameList
          .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
          .map((name) => ({ value: name }))
      );
    }
  };

  // Form columns for the table
  const columns = [
    {
      title: "No.",
      dataIndex: "no",
      key: "no",
      render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
    },
    {
      title: "ID",
      dataIndex: "itemId",
      key: "itemId",
      render: (text: number, record: InquiryItem, index: number) => (
        <Input
          value={text}
          type="number"
          onChange={(e) =>
            handleInputChange(index, "itemId", parseInt(e.target.value))
          }
        />
      ),
    },
    {
      title: "품목코드",
      dataIndex: "itemCode",
      key: "itemCode",
      render: (text: string, record: InquiryItem, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "itemCode", e.target.value)}
        />
      ),
    },
    {
      title: "OPT",
      dataIndex: "itemType",
      key: "itemType",
      render: (text: string, record: InquiryItem, index: number) => (
        <Select
          value={text}
          onChange={(value) => handleInputChange(index, "itemType", value)}
          style={{ width: "100%" }}
          onKeyDown={(e) =>
            handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>, index)
          }
        >
          {["MAKER", "TYPE", "DESC", "ITEM"].map((opt) => (
            <Option key={opt} value={opt}>
              {opt}
            </Option>
          ))}
        </Select>
      ),
      width: 80,
    },
    {
      title: "품명",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string, record: InquiryItem, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "itemName", e.target.value)}
        />
      ),
      width: 250,
    },
    {
      title: "수량",
      dataIndex: "qty",
      key: "qty",
      render: (text: number, record: InquiryItem, index: number) => (
        <Input
          type="number"
          value={text}
          onChange={(e) =>
            handleInputChange(index, "qty", parseInt(e.target.value))
          }
        />
      ),
      width: 80,
    },
    {
      title: "단위",
      dataIndex: "unit",
      key: "unit",
      render: (text: string, record: InquiryItem, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "unit", e.target.value)}
        />
      ),
      width: 80,
    },
    {
      title: "비고",
      dataIndex: "itemRemark",
      key: "itemRemark",
      render: (text: string, record: InquiryItem, index: number) => (
        <Input
          value={text}
          onChange={(e) =>
            handleInputChange(index, "itemRemark", e.target.value)
          }
        />
      ),
    },
    ...Array.from({ length: requesterCount }, (_, index) => ({
      title: `의뢰처${index + 1}`,
      dataIndex: `requester${index + 1}`,
      key: `requester${index + 1}`,
      width: 100,
      render: (_: any, record: InquiryItem, itemIndex: number) => (
        <Input
          value={record.supplierIdList[index] || ""}
          onChange={(e) =>
            handleInputChange(
              itemIndex,
              `supplierIdList[${index}]`,
              e.target.value
            )
          }
        />
      ),
    })),
  ];

  // Submit form data
  const handleSubmit = async () => {
    try {
      // 선박명에 해당하는 ID 찾기
      const selectedVessel = vesselList.find(
        (vessel) => vessel.vesselName === formValues.vesselName
      );
      setSelectedVesselId(selectedVessel ? selectedVessel.id : null);

      const requestData = {
        vesselId: selectedVesselId, // 최종적으로 선택된 선박 ID
        customerId: selectedCustomerId, // 기본값을 사용할 수 있습니다.
        refNumber: formValues.refNumber,
        registerDate: formValues.registerDate.format("YYYY-MM-DD"),
        shippingDate: formValues.shippingDate.format("YYYY-MM-DD"),
        remark: formValues.remark,
        currencyType: formValues.currencyType,
        currency: parseFloat(formValues.currency as any),
        inquiryItemDetails: items.map((item) => ({
          itemId: item.itemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemRemark: item.itemRemark,
          qty: item.qty,
          unit: item.unit,
          itemType: item.itemType,
          supplierIdList: item.supplierIdList
            .map((supplierId) => parseInt(supplierId, 10))
            .filter((supplierId) => !isNaN(supplierId)),
        })),
      };

      await axios.post("/api/customer-inquiries", requestData);
      message.success("Inquiry submitted successfully!");
      setFormValues({
        registerDate: moment().startOf("day"),
        shippingDate: moment().startOf("day"),
        customer: "",
        vesselName: "",
        refNumber: "",
        currencyType: "USD",
        currency: 0,
        remark: "",
      });
      setSelectedCustomerId(null);
      setSelectedVesselId(null);
      initializeItems();
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      message.error("Failed to submit inquiry. Please try again.");
    }
  };

  // Fetch company names based on customer input
  const SearchCompanyName = async () => {
    try {
      const response = await axios.get<{ customers: Customer[] }>(
        `/api/customers/search?companyName=${formValues.customer}`
      );

      setCompanyNameList(
        response.data.customers.map((customer) => customer.companyName)
      );

      // 매출처 선택 시 선박 목록 업데이트
      const selectedCustomer = response.data.customers.find(
        (customer) => customer.companyName === formValues.customer
      );
      if (selectedCustomer) {
        setSelectedCustomerId(selectedCustomer.id);
        // 저장할 수 있도록 선박 목록을 상태에 저장합니다
        setVesselNameList(
          selectedCustomer.vesselList.map((vessel) => vessel.vesselName)
        );
        // 선박 목록을 상태로 저장
        setVesselList(selectedCustomer.vesselList);
      } else {
        setSelectedCustomerId(null);
        setVesselNameList([]);
        setVesselList([]); // 선박 목록도 초기화
      }
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }
  };

  useEffect(() => {
    if (formValues.customer) {
      SearchCompanyName();
    }
  }, [formValues.customer]);

  useEffect(() => {
    setAutoCompleteOptions(
      companyNameList
        .filter((name) =>
          name.toLowerCase().includes(formValues.customer.toLowerCase())
        )
        .map((name) => ({ value: name }))
    );
  }, [companyNameList, formValues.customer]);

  return (
    <FormContainer>
      <Title>견적요청서 작성</Title>
      <Form layout="vertical" initialValues={formValues}>
        <FormRow>
          <InquiryItemForm
            label="작성일자"
            name="registerDate"
            rules={[{ required: true, message: "Please select register date" }]}
          >
            <DatePicker
              value={formValues.registerDate}
              onChange={(date) => handleFormChange("registerDate", date!)}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="선적일자"
            name="shippingDate"
            rules={[{ required: true, message: "Please select shipping date" }]}
          >
            <DatePicker
              value={formValues.shippingDate}
              onChange={(date) => handleFormChange("shippingDate", date!)}
            />
          </InquiryItemForm>
          <InquiryItemForm
            label="매출처"
            name="customer"
            rules={[{ required: true, message: "Please enter customer" }]}
          >
            <AutoComplete
              value={formValues.customer}
              onChange={(value) => handleFormChange("customer", value)}
              options={autoCompleteOptions}
              style={{ width: "100%" }}
              filterOption={(inputValue, option) =>
                option!.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            >
              <Input />
            </AutoComplete>
          </InquiryItemForm>
          <InquiryItemForm
            label="선박명"
            name="vesselName"
            rules={[{ required: true, message: "Please enter vessel name" }]}
          >
            <AutoComplete
              value={formValues.vesselName}
              onChange={(value) => handleFormChange("vesselName", value)}
              options={vesselNameList.map((name) => ({ value: name }))}
              style={{ width: "100%" }}
              filterOption={(inputValue, option) =>
                option!.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            >
              <Input />
            </AutoComplete>
          </InquiryItemForm>

          <InquiryItemForm
            style={{ flex: "40%" }}
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
            label="화폐"
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
            label="환율"
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
          <InquiryItemForm label="비고" name="remark" style={{ flex: "50%" }}>
            <Input
              value={formValues.remark}
              onChange={(e) => handleFormChange("remark", e.target.value)}
            />
          </InquiryItemForm>
        </FormRow>
        <Button type="primary" onClick={addItem} style={{ margin: "20px 0" }}>
          품목 추가
        </Button>
        <Table
          columns={columns}
          dataSource={items}
          pagination={false}
          rowKey="no"
        />
        {requesterCount < MAX_REQUESTERS && (
          <AddButton onClick={addRequesterField}>의뢰처 추가</AddButton>
        )}
        <Button
          type="primary"
          onClick={handleSubmit}
          style={{ marginTop: "20px", float: "right" }}
        >
          저장하기
        </Button>
      </Form>
    </FormContainer>
  );
};

export default MakeInquiry;
