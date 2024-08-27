import React, { Dispatch, useEffect, useState } from "react";
import { Table, Button } from "antd";
import { ColumnsType } from "antd/es/table";
import styled from "styled-components";

// ItemDataType을 정의
interface ItemDataType {
  position?: number;
  itemCode: string;
  itemName: string;
  itemType: string;
  qty: number;
  salesPriceKRW: number;
  salesPriceGlobal: number;
  salesAmountKRW: number;
  salesAmountGlobal: number;
  purchasePriceKRW: number;
  purchasePriceGlobal: number;
  purchaseAmountKRW: number;
  purchaseAmountGlobal: number;
  margin?: number;
}

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
  setDataSource: Dispatch<ItemDataType[]>;
  currency: number;
}

const MergedTableComponent = ({
  dataSource,
  currency,
  setDataSource,
}: MergedTableComponentProps) => {
  const [totals, setTotals] = useState({
    totalSalesAmountKRW: 0,
    totalSalesAmountGlobal: 0,
    totalPurchaseAmountKRW: 0,
    totalPurchaseAmountGlobal: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
  });

  // 마진을 계산하는 함수
  const calculateMargin = (salesAmount: number, purchaseAmount: number) =>
    purchaseAmount === 0
      ? 0
      : roundToTwoDecimalPlaces(
          ((salesAmount - purchaseAmount) / purchaseAmount) * 100
        );

  useEffect(() => {
    const updatedDataSource = dataSource.map((item, position) => ({
      ...item,
      position: position, // No. 추가
    }));

    setDataSource(updatedDataSource);
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
      ((totalProfit / totalSalesAmountKRW) * 100).toFixed(2)
    );

    setTotals({
      totalSalesAmountKRW,
      totalSalesAmountGlobal,
      totalPurchaseAmountKRW,
      totalPurchaseAmountGlobal,
      totalProfit,
      totalProfitPercent,
    });
  }, [dataSource, currency]);

  const columns: ColumnsType<any> = [
    {
      title: "No.",
      dataIndex: "position",
      key: "position",
      render: (text: number) => <span>{text}</span>,
      width: 50,
    },
    {
      title: "품목코드",
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
      title: "수량",
      dataIndex: "qty",
      key: "qty",
      render: (text: number) => <span>{text}</span>,
    },
    {
      title: "단가 (KRW)",
      dataIndex: "salesPriceKRW",
      key: "salesPriceKRW",
      render: (text: number) => <span>{text?.toLocaleString()}</span>,
    },
    {
      title: "단가 (F)",
      dataIndex: "salesPriceGlobal",
      key: "salesPriceGlobal",
      render: (text: number) => <span>{text?.toLocaleString()}</span>,
    },
    {
      title: "총액 (KRW)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      render: (text: number) => <span>{text?.toLocaleString()}</span>,
    },
    {
      title: "총액 (F)",
      dataIndex: "salesAmountGlobal",
      key: "salesAmountGlobal",
      render: (text: number) => <span>{text?.toLocaleString()}</span>,
    },
    {
      title: "구매단가 (KRW)",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      render: (text: number) => <span>{text?.toLocaleString()}</span>,
    },
    {
      title: "구매단가 (F)",
      dataIndex: "purchasePriceGlobal",
      key: "purchasePriceGlobal",
      render: (text: number) => <span>{text?.toLocaleString()}</span>,
    },
    {
      title: "구매총액 (KRW)",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      render: (text: number) => <span>{text?.toLocaleString()}</span>,
    },
    {
      title: "구매총액 (F)",
      dataIndex: "purchaseAmountGlobal",
      key: "purchaseAmountGlobal",
      render: (text: number) => <span>{text?.toLocaleString()}</span>,
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
        return !isNaN(marginPercent) ? (
          <span>{marginPercent}%</span>
        ) : (
          <span></span>
        );
      },
    },
  ];

  return (
    <>
      <TotalCards>
        <TotalCard>
          <span>매출총액(KRW)</span>
          <span className="value">
            ₩ {totals.totalSalesAmountKRW.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매출총액(F)</span>
          <span className="value">
            F {totals.totalSalesAmountGlobal.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(KRW)</span>
          <span className="value">
            ₩ {totals.totalPurchaseAmountKRW.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(F)</span>
          <span className="value">
            F {totals.totalPurchaseAmountGlobal.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={totals.totalProfit >= 0}>
          <span>이익합계</span>
          <span className="value">₩ {totals.totalProfit}</span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={totals.totalProfitPercent >= 0}>
          <span>이익율</span>
          <span className="value">
            {isNaN(totals.totalProfitPercent) ? 0 : totals.totalProfitPercent}%
          </span>
        </TotalCard>
      </TotalCards>
      <CustomTable
        dataSource={dataSource}
        columns={columns}
        rowKey="itemCode"
        pagination={false}
      />
    </>
  );
};

export default MergedTableComponent;
