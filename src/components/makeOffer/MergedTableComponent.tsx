import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import { ItemDataType } from "../../types/types";

const CustomTable = styled(Table)`
  .ant-table-cell {
    padding: 12px !important;
    text-align: center !important;
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
      dataIndex: "position",
      key: "position",
      render: (text: number) => <span>{text}</span>,
      width: 50,
    },
    {
      title: "PartNo",
      dataIndex: "itemCode",
      key: "itemCode",
      render: (text: string, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <span>{text}</span>
        ) : (
          <span>{record.itemType}</span>
        ),
    },
    {
      title: "품목명",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: "의뢰처",
      dataIndex: "supplierCode",
      key: "supplierCode",
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: "수량",
      dataIndex: "qty",
      key: "qty",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? <span>{text}</span> : null,
    },
    {
      title: "단가 (KRW)",
      dataIndex: "salesPriceKRW",
      key: "salesPriceKRW",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <span>{`₩ ${text?.toLocaleString()}`}</span>
        ) : null,
    },
    {
      title: "단가 (F)",
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
      width: 110,
    },
    {
      title: "총액 (KRW)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <span>{`₩ ${text?.toLocaleString()}`}</span>
        ) : null,
    },
    {
      title: "총액 (F)",
      dataIndex: "salesAmountGlobal",
      key: "salesAmountGlobal",
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
      width: 110,
    },
    {
      title: "구매단가 (KRW)",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <span>{`₩ ${text?.toLocaleString()}`}</span>
        ) : null,
    },
    {
      title: "구매단가 (F)",
      dataIndex: "purchasePriceGlobal",
      key: "purchasePriceGlobal",
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
      width: 110,
    },
    {
      title: "구매총액 (KRW)",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      render: (text: number, record: ItemDataType) =>
        record.itemType === "ITEM" ? (
          <span>{`₩ ${text?.toLocaleString()}`}</span>
        ) : null,
    },
    {
      title: "구매총액 (F)",
      dataIndex: "purchaseAmountGlobal",
      key: "purchaseAmountGlobal",
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
      width: 110,
    },
    {
      title: "마진 (%)",
      dataIndex: "margin",
      key: "margin",
      render: (text: number, record: any, index: number) => {
        const salesAmountKRW = record.salesAmountKRW;
        const purchaseAmountKRW = record.purchaseAmountKRW;
        const marginPercent = calculateMargin(
          salesAmountKRW,
          purchaseAmountKRW
        );
        return !isNaN(marginPercent) && record.itemType === "ITEM" ? (
          <span>{marginPercent}%</span>
        ) : null;
      },
      width: 80,
    },
  ];

  return (
    <>
      <TotalCards>
        <TotalCard>
          <span>매출총액(KRW)</span>
          <span className="value">
            ₩ {finalTotals.totalSalesAmountKRW.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매출총액(F)</span>
          <span className="value">
            F {finalTotals.totalSalesAmountGlobal.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(KRW)</span>
          <span className="value">
            ₩ {finalTotals.totalPurchaseAmountKRW.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(F)</span>
          <span className="value">
            F {finalTotals.totalPurchaseAmountGlobal.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={finalTotals.totalProfit >= 0}>
          <span>이익합계</span>
          <span className="value">₩ {finalTotals.totalProfit}</span>
        </TotalCard>
        <TotalCard
          $isHighlight
          $isPositive={finalTotals.totalProfitPercent >= 0}
        >
          <span>이익율</span>
          <span className="value">
            {isNaN(finalTotals.totalProfitPercent)
              ? 0
              : finalTotals.totalProfitPercent}
            %
          </span>
        </TotalCard>
      </TotalCards>
      <CustomTable
        dataSource={sortedData}
        columns={columns}
        rowKey="position"
        pagination={false}
      />
    </>
  );
};

export default MergedTableComponent;
