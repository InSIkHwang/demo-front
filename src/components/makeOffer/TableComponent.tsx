import React from "react";
import { Table, Input, Select } from "antd";
import { ColumnsType } from "antd/es/table";
import { InputNumber } from "antd";
import styled from "styled-components";

const CustomTable = styled(Table)`
  .ant-table-cell {
    padding: 12px !important;
  }
`;
interface TableComponentProps {
  dataSource: any[];
  handleInputChange: (index: number, key: keyof any, value: any) => void;
}

const TableComponent = ({
  dataSource,
  handleInputChange,
}: TableComponentProps) => {
  const columns: ColumnsType<any> = [
    {
      title: "품목코드",
      dataIndex: "itemCode",
      key: "itemCode",
      fixed: "left",
      width: 150,
      render: (text: string, record: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "itemCode", e.target.value)}
          style={{ borderRadius: "4px", width: "100%" }}
        />
      ),
    },
    {
      title: "OPT",
      dataIndex: "itemType",
      key: "itemType",
      width: 120,
      render: (text: string, record: any, index: number) => (
        <Select
          value={text}
          onChange={(value) => handleInputChange(index, "itemType", value)}
          style={{ width: "100%" }}
        >
          {["MAKER", "TYPE", "DESC", "ITEM"].map((opt) => (
            <Select.Option key={opt} value={opt}>
              {opt}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "품명",
      dataIndex: "itemName",
      key: "itemName",
      fixed: "left",
      width: 300,
      render: (text: string, record: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "itemName", e.target.value)}
          style={{ borderRadius: "4px", width: "100%" }}
        />
      ),
    },
    {
      title: "수량",
      dataIndex: "qty",
      key: "qty",
      width: 80,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) => handleInputChange(index, "qty", value ?? 0)}
          style={{ width: "100%" }}
          min={0}
          step={1}
          controls={false}
        />
      ),
    },
    {
      title: "단위",
      dataIndex: "unit",
      key: "unit",
      width: 80,
      render: (text: string, record: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "unit", e.target.value)}
          style={{ borderRadius: "4px", width: "100%" }}
        />
      ),
    },
    {
      title: "비고",
      dataIndex: "itemRemark",
      key: "itemRemark",
      width: 200,
      render: (text: string, record: any, index: number) => (
        <Input
          value={text}
          onChange={(e) =>
            handleInputChange(index, "itemRemark", e.target.value)
          }
          style={{ borderRadius: "4px", width: "100%" }}
        />
      ),
    },
    {
      title: "매출단가(KRW)",
      dataIndex: "salesPriceKRW",
      key: "salesPriceKRW",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) =>
            handleInputChange(index, "salesPriceKRW", value ?? 0)
          }
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `₩ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/₩\s?|,/g, "")) : 0
          }
          controls={false}
        />
      ),
    },
    {
      title: "매출단가(USD)",
      dataIndex: "salesPriceUSD",
      key: "salesPriceUSD",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) =>
            handleInputChange(index, "salesPriceUSD", value ?? 0)
          }
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `$ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/\$\s?|,/g, "")) : 0
          }
          controls={false}
        />
      ),
    },
    {
      title: "매출총액(KRW)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) =>
            handleInputChange(index, "salesAmountKRW", value ?? 0)
          }
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `₩ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/₩\s?|,/g, "")) : 0
          }
          controls={false}
        />
      ),
    },
    {
      title: "매출총액(USD)",
      dataIndex: "salesAmountUSD",
      key: "salesAmountUSD",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) =>
            handleInputChange(index, "salesAmountUSD", value ?? 0)
          }
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `$ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/\$\s?|,/g, "")) : 0
          }
          controls={false}
        />
      ),
    },
    {
      title: "마진",
      dataIndex: "margin",
      key: "margin",
      width: 120,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) => handleInputChange(index, "margin", value ?? 0)}
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `$ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/\$\s?|,/g, "")) : 0
          }
          controls={false}
        />
      ),
    },
    {
      title: "매입단가(KRW)",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) =>
            handleInputChange(index, "purchasePriceKRW", value ?? 0)
          }
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `₩ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/₩\s?|,/g, "")) : 0
          }
          controls={false}
        />
      ),
    },
    {
      title: "매입단가(USD)",
      dataIndex: "purchasePriceUSD",
      key: "purchasePriceUSD",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) =>
            handleInputChange(index, "purchasePriceUSD", value ?? 0)
          }
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `$ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/\$\s?|,/g, "")) : 0
          }
          controls={false}
        />
      ),
    },
    {
      title: "매입총액(KRW)",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) =>
            handleInputChange(index, "purchaseAmountKRW", value ?? 0)
          }
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `₩ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/₩\s?|,/g, "")) : 0
          }
          controls={false}
        />
      ),
    },
    {
      title: "매입총액(USD)",
      dataIndex: "purchaseAmountUSD",
      key: "purchaseAmountUSD",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) =>
            handleInputChange(index, "purchaseAmountUSD", value ?? 0)
          }
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `$ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/\$\s?|,/g, "")) : 0
          }
          controls={false}
        />
      ),
    },
  ];

  return (
    <div style={{ marginTop: 20, overflowX: "auto" }}>
      <CustomTable
        columns={columns}
        dataSource={dataSource}
        rowKey="itemDetailId"
        pagination={false}
        scroll={{ x: 2000 }}
        bordered
      />
    </div>
  );
};

export default TableComponent;
