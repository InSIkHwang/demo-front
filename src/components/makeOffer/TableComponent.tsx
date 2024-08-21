import React, { useEffect, useState } from "react";
import { Table, Input, Select, InputNumber } from "antd";
import { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import { ItemDataType } from "../../types/types";

const CustomTable = styled(Table)`
  .ant-table-cell {
    padding: 12px !important;
  }
  .highlight-cell {
    font-weight: bold;
    background-color: #dff4ff;
  }
`;

const TotalCards = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 6px;
  background: #f8f8f8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TotalCard = styled.div<{ $isHighlight?: boolean; $isPositive?: boolean }>`
  flex: 1;
  text-align: center;
  padding: 8px;
  margin: 0 5px;
  border-radius: 4px;
  background: ${({ $isHighlight, $isPositive }) =>
    $isHighlight ? ($isPositive ? "#eaffea" : "#ffe6e6") : "#ffffff"};
  box-shadow: ${({ $isHighlight }) =>
    $isHighlight ? "0 1px 2px rgba(0, 0, 0, 0.1)" : "none"};
  border: ${({ $isHighlight, $isPositive }) =>
    $isHighlight
      ? `1px solid ${$isPositive ? "#b3e6b3" : "#f5b3b3"}`
      : "1px solid #ddd"};

  span {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: ${({ $isHighlight, $isPositive }) =>
      $isHighlight ? ($isPositive ? "#2e8b57" : "#d9534f") : "#666"};
  }

  span.value {
    font-size: 18px;
    font-weight: 600;
  }
`;

// 소수점 둘째자리까지 반올림하는 함수
const roundToTwoDecimalPlaces = (value: number) => {
  return Math.round(value * 100) / 100;
};

// 환율을 적용하여 KRW와 USD를 상호 변환하는 함수
const convertCurrency = (
  value: number,
  currency: number,
  toCurrency: "KRW" | "USD"
) => {
  if (toCurrency === "KRW") {
    return roundToTwoDecimalPlaces(value * currency);
  }
  return roundToTwoDecimalPlaces(value / currency);
};

// 수량과 단가를 곱하여 총액을 계산하는 함수
export const calculateTotalAmount = (price: number, qty: number) =>
  roundToTwoDecimalPlaces(price * qty);

// 마진을 계산하는 함수
const calculateMargin = (salesAmount: number, purchaseAmount: number) =>
  purchaseAmount === 0
    ? 0
    : roundToTwoDecimalPlaces(
        ((salesAmount - purchaseAmount) / purchaseAmount) * 100
      );

interface TableComponentProps {
  dataSource: any[];
  handleInputChange: (
    index: number,
    key: keyof ItemDataType,
    value: any
  ) => void;
  currency: number;
}

const TableComponent = ({
  dataSource,
  handleInputChange,
  currency,
}: TableComponentProps) => {
  const [totals, setTotals] = useState({
    totalSalesAmountKRW: 0,
    totalSalesAmountUSD: 0,
    totalPurchaseAmountKRW: 0,
    totalPurchaseAmountUSD: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
  });

  useEffect(() => {
    const totalSalesAmountKRW = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.salesPriceKRW, record.qty),
      0
    );
    const totalSalesAmountUSD = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.salesPriceUSD, record.qty),
      0
    );
    const totalPurchaseAmountKRW = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.purchasePriceKRW, record.qty),
      0
    );
    const totalPurchaseAmountUSD = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.purchasePriceUSD, record.qty),
      0
    );
    const totalProfit = totalSalesAmountKRW - totalPurchaseAmountKRW;
    const totalProfitPercent = Number(
      ((totalProfit / totalPurchaseAmountKRW) * 100).toFixed(2)
    );

    setTotals({
      totalSalesAmountKRW,
      totalSalesAmountUSD,
      totalPurchaseAmountKRW,
      totalPurchaseAmountUSD,
      totalProfit,
      totalProfitPercent,
    });
  }, [dataSource, currency]);

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
      width: 100,
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
          onChange={(value) => {
            const updatedValue = value ?? 0;
            handleInputChange(
              index,
              "salesPriceKRW",
              roundToTwoDecimalPlaces(updatedValue)
            );
            handleInputChange(
              index,
              "salesPriceUSD",
              convertCurrency(updatedValue, currency, "USD")
            );
          }}
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
          onChange={(value) => {
            const updatedValue = value ?? 0;
            handleInputChange(
              index,
              "salesPriceUSD",
              roundToTwoDecimalPlaces(updatedValue)
            );
            handleInputChange(
              index,
              "salesPriceKRW",
              convertCurrency(updatedValue, currency, "KRW")
            );
          }}
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
          value={calculateTotalAmount(record.salesPriceKRW, record.qty)}
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `₩ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/₩\s?|,/g, "")) : 0
          }
          readOnly
          className="highlight-cell"
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
          value={calculateTotalAmount(record.salesPriceUSD, record.qty)}
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `$ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/\$\s?|,/g, "")) : 0
          }
          readOnly
          className="highlight-cell"
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
          onChange={(value) => {
            const updatedValue = value ?? 0;
            handleInputChange(
              index,
              "purchasePriceKRW",
              roundToTwoDecimalPlaces(updatedValue)
            );
            handleInputChange(
              index,
              "purchasePriceUSD",
              convertCurrency(updatedValue, currency, "USD")
            );
          }}
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
          onChange={(value) => {
            const updatedValue = value ?? 0;
            handleInputChange(
              index,
              "purchasePriceUSD",
              roundToTwoDecimalPlaces(updatedValue)
            );
            handleInputChange(
              index,
              "purchasePriceKRW",
              convertCurrency(updatedValue, currency, "KRW")
            );
          }}
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
          value={calculateTotalAmount(record.purchasePriceKRW, record.qty)}
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `₩ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/₩\s?|,/g, "")) : 0
          }
          readOnly
          className="highlight-cell"
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
          value={calculateTotalAmount(record.purchasePriceUSD, record.qty)}
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `$ ${value}`}
          parser={(value) =>
            value ? parseFloat(value.replace(/\$\s?|,/g, "")) : 0
          }
          readOnly
          className="highlight-cell"
        />
      ),
    },
    {
      title: "마진(%)",
      dataIndex: "margin",
      key: "margin",
      width: 120,
      render: (text: number, record: any, index: number) => {
        const salesAmountKRW = calculateTotalAmount(
          record.salesPriceKRW,
          record.qty
        );
        const purchaseAmountKRW = calculateTotalAmount(
          record.purchasePriceKRW,
          record.qty
        );
        const marginPercent = calculateMargin(
          salesAmountKRW,
          purchaseAmountKRW
        );
        return (
          <InputNumber
            value={marginPercent}
            style={{ width: "100%" }}
            min={0}
            step={0.01}
            formatter={(value) => `${value} %`}
            parser={(value) =>
              value ? parseFloat(value.replace(/ %/, "")) : 0
            }
            readOnly
            className="highlight-cell"
          />
        );
      },
    },
  ];

  return (
    <div style={{ marginTop: 20, overflowX: "auto" }}>
      <TotalCards>
        <TotalCard>
          <span>매출총액(KRW)</span>
          <span className="value">
            ₩ {totals.totalSalesAmountKRW.toFixed(2)}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매출총액(USD)</span>
          <span className="value">
            $ {totals.totalSalesAmountUSD.toFixed(2)}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(KRW)</span>
          <span className="value">
            ₩ {totals.totalPurchaseAmountKRW.toFixed(2)}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(USD)</span>
          <span className="value">
            $ {totals.totalPurchaseAmountUSD.toFixed(2)}
          </span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={totals.totalProfit >= 0}>
          <span>이익합계</span>
          <span className="value">₩ {totals.totalProfit.toFixed(2)}</span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={totals.totalProfitPercent >= 0}>
          <span>이익율</span>
          <span className="value">
            {isNaN(totals.totalProfitPercent) ? 0 : totals.totalProfitPercent}%
          </span>
        </TotalCard>
      </TotalCards>
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
