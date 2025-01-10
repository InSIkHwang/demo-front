import { ReloadOutlined, UpOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import styled from "styled-components";
import { InvoiceCharge } from "../../types/types";
import InvoiceChargeInputPopover from "./InvoiceChargeInputPopover";

interface InvoiceTotalCardsComponentProps {
  finalTotals: {
    totalSalesAmountKRW: number;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountKRW: number;
    totalPurchaseAmountGlobal: number;
    totalSalesAmountUnDcKRW: number;
    totalSalesAmountUnDcGlobal: number;
    totalPurchaseAmountUnDcKRW: number;
    totalPurchaseAmountUnDcGlobal: number;
    totalProfit: number;
    totalProfitPercent: number;
  };
  applyDcAndCharge: (mode: string) => void;
  mode: string;
  currency: number;
  dcInfo: { dcPercent: number; dcKrw: number; dcGlobal: number };
  setDcInfo: Dispatch<
    SetStateAction<{ dcPercent: number; dcKrw: number; dcGlobal: number }>
  >;
  invChargeList: InvoiceCharge[] | null;
  setInvChargeList: Dispatch<SetStateAction<InvoiceCharge[] | null>>;
  handleSave: () => void;
}
const RefreshBtn = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;

  &:hover {
    transform: rotate(180deg);
    background: #1890ff;
    color: white;
  }
`;

const TotalCardsWrapper = styled.div<{ $isCollapsed: boolean }>`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: ${(props) =>
    props.$isCollapsed
      ? "translate(-50%, calc(100% - 50px))"
      : "translate(-50%, 0)"};
  width: ${(props) => (props.$isCollapsed ? "auto" : "auto")};
  min-width: ${(props) => (props.$isCollapsed ? "300px" : "auto")};
  background: white;
  box-shadow: ${(props) =>
    props.$isCollapsed
      ? "0 -2px 15px rgba(0, 0, 0, 0.1)"
      : "0 -4px 20px rgba(0, 0, 0, 0.15)"};
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 20px 20px 0 0;
  background: #f8fafc;
`;

const CollapseHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 32px;
  background: white;
  cursor: pointer;
  border-radius: 20px 20px 0 0;
  position: relative;
  white-space: nowrap;

  &:before {
    content: "";
    position: absolute;
    top: 8px;
    width: 60px;
    height: 4px;
    background: #e8e8e8;
    border-radius: 4px;
  }

  &:hover:before {
    background: #d0d0d0;
  }
`;

const TotalCards = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
`;

const TotalCard = styled.div<{ $isHighlight?: boolean; $isPositive?: boolean }>`
  background: white;
  padding: 6px;
  text-align: center;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  width: 140px;
  flex: 1;
  border: 1px solid
    ${({ $isHighlight, $isPositive }) =>
      $isHighlight
        ? $isPositive
          ? "rgba(52, 211, 153, 0.2)"
          : "rgba(239, 68, 68, 0.2)"
        : "rgba(226, 232, 240, 0.6)"};

  ${({ $isHighlight, $isPositive }) =>
    $isHighlight &&
    `
    background: ${
      $isPositive
        ? "linear-gradient(135deg, #f0fdf4, #ffffff)"
        : "linear-gradient(135deg, #fef2f2, #ffffff)"
    };
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  span {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span.value {
    font-size: 14px;
    font-weight: 600;
    color: ${({ $isHighlight, $isPositive }) =>
      $isHighlight ? ($isPositive ? "#059669" : "#dc2626") : "#1e293b"};
  }
`;

const Title = styled.h2`
  font-size: 15px;
  font-weight: 600;
  color: #334155;
  margin: 0;

  span {
    color: #3b82f6;
    margin-left: 8px;
    font-weight: 500;
    font-size: 14px;
  }
`;

const InvoiceTotalCardsComponent = ({
  finalTotals,
  applyDcAndCharge,
  mode,
  currency,
  dcInfo,
  setDcInfo,
  invChargeList,
  setInvChargeList,
  handleSave,
}: InvoiceTotalCardsComponentProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 초기 렌더링 시 할인 및 차지 적용
  useEffect(() => {
    applyDcAndCharge(mode);
  }, []);

  return (
    <TotalCardsWrapper $isCollapsed={isCollapsed}>
      <CollapseHeader onClick={() => setIsCollapsed((prev) => !prev)}>
        <Title>
          Total Price Information{" "}
          <span>
            Total Profit: ₩ {finalTotals.totalProfit?.toLocaleString("ko-KR")} (
            {finalTotals.totalProfitPercent}%)
          </span>
        </Title>
      </CollapseHeader>
      <div style={{ padding: "15px 20px" }}>
        <TotalCards>
          <TotalCard>
            <span>Sales Amount(KRW)</span>
            <span className="value">
              ₩ {finalTotals.totalSalesAmountKRW?.toLocaleString("ko-KR")}
            </span>
          </TotalCard>
          <TotalCard>
            <span>Sales Amount(F)</span>
            <span className="value">
              F {finalTotals.totalSalesAmountGlobal?.toLocaleString("en-US")}
            </span>
          </TotalCard>
          <TotalCard>
            <span>Purchase Amount(KRW)</span>
            <span className="value">
              ₩ {finalTotals.totalPurchaseAmountKRW?.toLocaleString("ko-KR")}
            </span>
          </TotalCard>
          <TotalCard>
            <span>Purchase Amount(F)</span>
            <span className="value">
              F {finalTotals.totalPurchaseAmountGlobal?.toLocaleString("en-US")}
            </span>
          </TotalCard>
          <TotalCard $isHighlight $isPositive={finalTotals.totalProfit >= 0}>
            <span>Profit Amount</span>
            <span className="value">
              ₩ {finalTotals.totalProfit?.toLocaleString("ko-KR")}
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
          </TotalCard>{" "}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <RefreshBtn
              icon={<ReloadOutlined />}
              type="primary"
              onClick={() => applyDcAndCharge(mode)}
            />
            {mode === "multiple" && (
              <InvoiceChargeInputPopover
                currency={currency}
                dcInfo={dcInfo}
                setDcInfo={setDcInfo}
                invChargeList={invChargeList}
                setInvChargeList={setInvChargeList}
                applyDcAndCharge={applyDcAndCharge}
                handleSave={handleSave}
                finalTotals={finalTotals}
              />
            )}
          </div>
        </TotalCards>
      </div>
    </TotalCardsWrapper>
  );
};

export default InvoiceTotalCardsComponent;
