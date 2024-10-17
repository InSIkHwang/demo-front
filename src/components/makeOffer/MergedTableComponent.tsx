import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import { ItemDataType } from "../../types/types";

const CustomTable = styled(Table)`
  .ant-table * {
    font-size: 12px;
  }

  .ant-table-thead .ant-table-cell {
    text-align: center;
  }

  .ant-table-cell {
    border-inline-end: 1px solid #d1d1d1 !important;
    border-bottom: 1px solid #d1d1d1 !important;
  }

  .maker-row {
    background-color: #deefffd8; /* MAKER 행의 배경색 */
    &:hover {
      background-color: #deefff !important;
    }
    .ant-table-cell-row-hover {
      background-color: #deefff !important;
    }
  }
  .type-row {
    background-color: #fffdded8; /* TYPE 행의 배경색 */
    &:hover {
      background-color: #fffdde !important;
    }
    .ant-table-cell-row-hover {
      background-color: #fffdde !important;
    }
  }
  .desc-row {
    background-color: #f0f0f0d8;
    &:hover {
      background-color: #f0f0f0 !important;
    }
    .ant-table-cell-row-hover {
      background-color: #f0f0f0 !important;
    }
  }
`;

const HighlightedCell = styled.span`
  background-color: #ffffe0 !important;
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

// 수량과 단가를 곱하여 총액을 계산하는 함수
export const calculateTotalAmount = (price: number, qty: number) =>
  roundToTwoDecimalPlaces(price * qty);

interface MergedTableComponentProps {
  dataSource: ItemDataType[];
  setDataSource: Dispatch<SetStateAction<ItemDataType[]>>;
  currency: number;
  currencyType: string;
  finalTotals: {
    totalSalesAmountKRW: number;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountKRW: number;
    totalPurchaseAmountGlobal: number;
    totalProfit: number;
    totalProfitPercent: number;
  };
}

const MergedTableComponent = ({
  dataSource,
  currency,
  setDataSource,
  currencyType,
  finalTotals,
}: MergedTableComponentProps) => {
  const [totals, setTotals] = useState({
    totalSalesAmountKRW: 0,
    totalSalesAmountGlobal: 0,
    totalPurchaseAmountKRW: 0,
    totalPurchaseAmountGlobal: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
  });

  const [sortedData, setSortedData] = useState<ItemDataType[]>(dataSource);

  // 마진을 계산하는 함수
  const calculateMargin = (salesAmount: number, purchaseAmount: number) =>
    purchaseAmount === 0
      ? 0
      : roundToTwoDecimalPlaces(
          ((salesAmount - purchaseAmount) / purchaseAmount) * 100
        );

  useEffect(() => {
    const sorted = [...dataSource].sort((a, b) => a.position! - b.position!);

    const totalSalesAmountKRW = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.salesPriceKRW, record.qty),
      0
    );
    const totalSalesAmountGlobal = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.salesPriceGlobal, record.qty),
      0
    );
    const totalPurchaseAmountKRW = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.purchasePriceKRW, record.qty),
      0
    );
    const totalPurchaseAmountGlobal = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.purchasePriceGlobal, record.qty),
      0
    );
    const totalProfit = totalSalesAmountKRW - totalPurchaseAmountKRW;
    const totalProfitPercent = Number(
      ((totalProfit / totalPurchaseAmountKRW) * 100).toFixed(2)
    );

    setDataSource(sorted);
    setSortedData(sorted);

    setTotals({
      totalSalesAmountKRW,
      totalSalesAmountGlobal,
      totalPurchaseAmountKRW,
      totalPurchaseAmountGlobal,
      totalProfit,
      totalProfitPercent,
    });
  }, []);

  const columns: ColumnsType<any> = [
    {
      title: "No.",
      dataIndex: "no",
      key: "no",
      width: 0,
      render: (_: any, record: any, index: number) => {
        const filteredIndex = dataSource
          .filter((item: any) => item.itemType === "ITEM")
          .indexOf(record);

        return record.itemType === "ITEM" ? (
          <span>{filteredIndex + 1}</span>
        ) : null;
      },
    },
    {
      title: "PartNo.",
      dataIndex: "itemCode",
      key: "itemCode",
      render: (text: string, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <span>{text}</span>
        ) : (
          <span>{record.itemType}</span>
        ),
      width: 200,
    },
    {
      title: "Name",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string) => <span>{text}</span>,
      width: 300,
    },
    {
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      render: (text: string) => <span>{text}</span>,
      width: 100,
    },
    {
      title: "Supplier",
      dataIndex: "supplierCode",
      key: "supplierCode",
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? <span>{text}</span> : null,
      width: 60,
    },
    {
      title: "Sales Price(KRW)",
      dataIndex: "salesPriceKRW",
      key: "salesPriceKRW",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <span>{`₩ ${text?.toLocaleString()}`}</span>
        ) : null,
    },
    {
      title: "Sales Price(F)",
      dataIndex: "salesPriceGlobal",
      key: "salesPriceGlobal",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <span>
            {(() => {
              switch (currencyType) {
                case "USD":
                  return `$ ${text?.toLocaleString()}`;
                case "EUR":
                  return `€ ${text?.toLocaleString()}`;
                case "INR":
                  return `₹ ${text?.toLocaleString()}`;
                case "JPY":
                  return `¥ ${text?.toLocaleString()}`;
                default:
                  return `${text?.toLocaleString()}`;
              }
            })()}
          </span>
        ) : null,
    },
    {
      title: "Sales Amount(KRW)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <HighlightedCell>{`₩ ${text?.toLocaleString()}`}</HighlightedCell>
        ) : null,
    },
    {
      title: "Sales Amount(F)",
      dataIndex: "salesAmountGlobal",
      key: "salesAmountGlobal",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <HighlightedCell>
            {(() => {
              switch (currencyType) {
                case "USD":
                  return `$ ${text?.toLocaleString()}`;
                case "EUR":
                  return `€ ${text?.toLocaleString()}`;
                case "INR":
                  return `₹ ${text?.toLocaleString()}`;
                case "JPY":
                  return `¥ ${text?.toLocaleString()}`;
                default:
                  return `${text?.toLocaleString()}`;
              }
            })()}
          </HighlightedCell>
        ) : null,
    },
    {
      title: "Purchase Price(KRW)",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <span>{`₩ ${(text ?? 0)?.toLocaleString()}`}</span>
        ) : null,
    },
    {
      title: "Purchase Price(F)",
      dataIndex: "purchasePriceGlobal",
      key: "purchasePriceGlobal",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <span>
            {(() => {
              const value = text ?? 0; // null 또는 undefined일 때 0으로 처리
              switch (currencyType) {
                case "USD":
                  return `$ ${value?.toLocaleString()}`;
                case "EUR":
                  return `€ ${value?.toLocaleString()}`;
                case "INR":
                  return `₹ ${value?.toLocaleString()}`;
                case "JPY":
                  return `¥ ${value?.toLocaleString()}`;
                default:
                  return `${value?.toLocaleString()}`;
              }
            })()}
          </span>
        ) : null,
    },
    {
      title: "Purchase Amount(KRW)",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <HighlightedCell className="custom-span">{`₩ ${(
            text ?? 0
          )?.toLocaleString()}`}</HighlightedCell>
        ) : null,
    },
    {
      title: "Purchase Amount(F)",
      dataIndex: "purchaseAmountGlobal",
      key: "purchaseAmountGlobal",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <HighlightedCell>
            {(() => {
              const value = text ?? 0; // null 또는 undefined일 때 0으로 처리
              switch (currencyType) {
                case "USD":
                  return `$ ${value?.toLocaleString()}`;
                case "EUR":
                  return `€ ${value?.toLocaleString()}`;
                case "INR":
                  return `₹ ${value?.toLocaleString()}`;
                case "JPY":
                  return `¥ ${value?.toLocaleString()}`;
                default:
                  return `${value?.toLocaleString()}`;
              }
            })()}
          </HighlightedCell>
        ) : null,
    },
    {
      title: "Margin(%)",
      dataIndex: "margin",
      key: "margin",
      render: (text: number) => <HighlightedCell>{text}</HighlightedCell>,
      width: 60,
    },
  ];

  return (
    <>
      <TotalCards>
        <TotalCard>
          <span>Sales Amount(KRW)</span>
          <span className="value">
            ₩ {finalTotals.totalSalesAmountKRW?.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>Sales Amount(F)</span>
          <span className="value">
            F {finalTotals.totalSalesAmountGlobal?.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>Purchase Amount(KRW)</span>
          <span className="value">
            ₩ {finalTotals.totalPurchaseAmountKRW?.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>Purchase Amount(F)</span>
          <span className="value">
            F {finalTotals.totalPurchaseAmountGlobal?.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={finalTotals.totalProfit >= 0}>
          <span>Profit Amount</span>
          <span className="value">
            ₩ {finalTotals.totalProfit?.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard
          $isHighlight
          $isPositive={finalTotals.totalProfitPercent >= 0}
        >
          <span>Profit Percent</span>
          <span className="value">
            {isNaN(finalTotals.totalProfitPercent)
              ? 0
              : finalTotals.totalProfitPercent}
            %
          </span>
        </TotalCard>
      </TotalCards>
      <CustomTable
        rowClassName={(record: any, index) => {
          if (record.itemType === "MAKER") {
            return "maker-row";
          } else if (record.itemType === "TYPE") {
            return "type-row";
          } else {
            return index % 2 === 0 ? "even-row" : "odd-row"; // 기본 행 스타일
          }
        }}
        scroll={{ y: 600 }}
        virtual
        dataSource={sortedData}
        columns={columns}
        rowKey="position"
        pagination={false}
        bordered
      />
    </>
  );
};

export default MergedTableComponent;
