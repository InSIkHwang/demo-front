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
  const [companyNameList, setCompanyNameList] = useState<string[]>([]);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<
    { value: string }[]
  >([]);

  const [formValues, setFormValues] = useState({
    registerDate: moment().startOf("day"), // 오늘 날짜로 초기화
    shippingDate: moment().startOf("day"), // 오늘 날짜로 초기화
    customer: "",
    vesselName: "",
    refNumber: "",
    currencyType: "USD",
    currency: 0,
    remark: "",
  });

  // 초기화 시 3개의 의뢰처를 가진 아이템 설정
  const initializeItems = () => {
    setItems([
      {
        no: itemCount,
        itemId: 0,
        itemName: "",
        itemCode: "",
        itemType: "ITEM",
        qty: 0,
        unit: "",
        itemRemark: "",
        supplierIdList: Array(3).fill(""), // 3개의 빈 의뢰처로 초기화
      },
    ]);
    setItemCount(itemCount + 1);
  };

  // 컴포넌트가 마운트될 때 초기화
  useEffect(() => {
    initializeItems();
  }, []);

  // 품목 추가 함수
  const addItem = () => {
    setItems([
      ...items,
      {
        no: itemCount,
        itemId: 0,
        itemName: "",
        itemType: "ITEM",
        itemCode: "",
        qty: 0,
        unit: "",
        itemRemark: "",
        supplierIdList: Array(requesterCount).fill(""), // 현재 의뢰처 수만큼 빈 의뢰처로 초기화
      },
    ]);
    setItemCount(itemCount + 1);
  };

  // 입력값 변경 함수
  const handleInputChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newItems = [...items];

    if (
      field &&
      typeof field === "string" &&
      field.startsWith("supplierIdList")
    ) {
      const supplierIndexMatch = field.match(/\d+/);
      if (supplierIndexMatch) {
        const supplierIndex = parseInt(supplierIndexMatch[0], 10);
        if (!isNaN(supplierIndex)) {
          newItems[index].supplierIdList[supplierIndex] = value as string;
        }
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
    }

    setItems(newItems);
  };

  // 의뢰처 추가 함수
  const addRequesterField = () => {
    if (items.length > 0 && requesterCount < MAX_REQUESTERS) {
      setRequesterCount(requesterCount + 1);
    }
  };

  // 키 입력에 따른 OPT 변경 함수
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "1") {
      handleInputChange(index, "itemType", "MAKER");
    } else if (e.key === "2") {
      handleInputChange(index, "itemType", "TYPE");
    } else if (e.key === "3") {
      handleInputChange(index, "itemType", "DESC");
    } else if (e.key === "4") {
      handleInputChange(index, "itemType", "ITEM");
    }
  };

  // 폼 필드 값 변경 함수
  const handleFormChange = (
    key: keyof typeof formValues,
    value: string | number | moment.Moment
  ) => {
    setFormValues({
      ...formValues,
      [key]: value,
    });

    // 고객명이 변경될 때마다 자동완성 옵션 업데이트
    if (key === "customer" && typeof value === "string") {
      const filteredOptions = companyNameList
        .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
        .map((name) => ({ value: name })); // { value: string } 형태로 매핑
      setAutoCompleteOptions(filteredOptions);
    }
  };

  // 테이블 컬럼 정의
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
          onChange={(e) => handleInputChange(index, "itemId", e.target.value)}
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
          <Option value="MAKER">MAKER</Option>
          <Option value="TYPE">TYPE</Option>
          <Option value="DESC">DESC</Option>
          <Option value="ITEM">ITEM</Option>
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

  const handleSubmit = async () => {
    try {
      const requestData = {
        vesselId: 1, // 예시 값, 실제로는 입력 받은 값을 사용
        customerId: 1, // 예시 값, 실제로는 입력 받은 값을 사용
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
      // Optionally, reset the form and items
      setFormValues({
        registerDate: moment().startOf("day"), // 오늘 날짜로 초기화
        shippingDate: moment().startOf("day"), // 오늘 날짜로 초기화
        customer: "",
        vesselName: "",
        refNumber: "",
        currencyType: "USD",
        currency: 0,
        remark: "",
      });
      initializeItems();
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      message.error("Failed to submit inquiry. Please try again.");
    }
  };

  //매출처 검색 API 로직 수정할 것!!!
  const SearchCompanyName = async () => {
    try {
      const response = await axios.get<{ customers: Customer[] }>(
        `/api/customers/search?companyName=${formValues.customer}`
      );

      const companyNames = response.data.customers.map(
        (customer: Customer) => customer.companyName
      );
      setCompanyNameList(companyNames);

      console.log(response.data);
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
    const filteredOptions = companyNameList
      .filter((name) =>
        name.toLowerCase().includes(formValues.customer.toLowerCase())
      )
      .map((name) => ({ value: name }));
    setAutoCompleteOptions(filteredOptions);
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
              options={autoCompleteOptions} // { value: string }[] 형식
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
            <Input
              value={formValues.vesselName}
              onChange={(e) => handleFormChange("vesselName", e.target.value)}
            />
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
              <Option value="USD">USD</Option>
              <Option value="EUR">EUR</Option>
              <Option value="INR">INR</Option>
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
