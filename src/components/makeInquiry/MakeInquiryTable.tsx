import React from "react";
import { Table, AutoComplete, Input, Select, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { InquiryItem } from "../../types/types";

const { Option } = Select;

interface MakeInquiryTableProps {
  items: InquiryItem[];
  handleInputChange: (index: number, key: string, value: any) => void;
  handleItemCodeChange: (index: number, value: string) => void;
  itemCodeOptions: { value: string }[];
  handleDelete: (index: number) => void;
}

const MakeInquiryTable = ({
  items,
  handleInputChange,
  handleItemCodeChange,
  itemCodeOptions,
  handleDelete,
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
      dataIndex: "position",
      key: "position",
      render: (text: string, record: InquiryItem, index: number) => (
        <span>{text}</span>
      ),
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
          type="number" // Ensure it's a number input
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
    {
      title: "Action",
      key: "action",
      render: (_: any, __: any, index: number) => (
        <Button
          icon={<DeleteOutlined />}
          type="default" // Replace 'danger' with 'default' or another supported type
          onClick={() => handleDelete(index)}
        />
      ),
      width: 80,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={items}
      pagination={false}
      rowKey="no" // Use a unique key, adjust if necessary
    />
  );
};

export default MakeInquiryTable;
