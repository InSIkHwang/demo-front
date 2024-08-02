import React from "react";
import { Table, AutoComplete, Input, Select } from "antd";

const { Option } = Select;

interface MakeInquiryTableProps {
  items: InquiryItem[];
  handleInputChange: (index: number, key: string, value: any) => void;
  handleItemCodeChange: (index: number, value: string) => void;
  itemCodeOptions: { value: string }[];
}

interface InquiryItem {
  itemCode: string;
  itemType: string;
  itemName: string;
  qty: number;
  unit: string;
  itemRemark: string;
}

const MakeInquiryTable = ({
  items,
  handleInputChange,
  handleItemCodeChange,
  itemCodeOptions,
}: MakeInquiryTableProps) => {
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
  const columns = [
    {
      title: "No.",
      dataIndex: "no",
      key: "no",
      render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
      width: 50,
    },
    {
      title: "품목코드",
      dataIndex: "itemCode",
      key: "itemCode",
      render: (text: string, record: InquiryItem, index: number) => (
        <AutoComplete
          value={text}
          onChange={(value) => handleItemCodeChange(index, value)}
          options={itemCodeOptions}
          style={{ width: "100%" }}
        >
          <Input />
        </AutoComplete>
      ),
      width: 150,
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
      width: 100,
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
          value={text}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            handleInputChange(index, "qty", isNaN(value) ? 0 : value);
          }}
        />
      ),
      width: 100,
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
      width: 100,
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
  ];

  return (
    <Table
      columns={columns}
      dataSource={items}
      pagination={false}
      rowKey="no"
    />
  );
};

export default MakeInquiryTable;
