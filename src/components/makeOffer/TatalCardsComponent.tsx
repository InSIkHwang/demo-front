import { ReloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { Dispatch, SetStateAction } from "react";
import styled from "styled-components";
import { InvCharge } from "../../types/types";
import ChargeInputPopover from "./ChargeInputPopover";

interface TotalCardsProps {
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
  invChargeList: InvCharge[] | null;
  setInvChargeList: Dispatch<SetStateAction<InvCharge[] | null>>;
}
const RefreshBtn = styled(Button)`
  width: 32px;
  height: 32px;
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

const TotalCards = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin: 0px 0 20px 0;
  padding: 15px;
  border-radius: 12px;
  background: linear-gradient(145deg, #f6f8fa, #ffffff);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  gap: 12px;
`;

const TotalCard = styled.div<{ $isHighlight?: boolean; $isPositive?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  padding: 12px 15px;
  border-radius: 8px;
  transition: all 0.3s ease;

  background: ${({ $isHighlight, $isPositive }) =>
    $isHighlight
      ? $isPositive
        ? "linear-gradient(145deg, #f0fff0, #e6ffe6)"
        : "linear-gradient(145deg, #fff0f0, #ffe6e6)"
      : "linear-gradient(145deg, #ffffff, #f8f8f8)"};

  box-shadow: ${({ $isHighlight }) =>
    $isHighlight
      ? "0 2px 8px rgba(0, 0, 0, 0.1)"
      : "0 1px 3px rgba(0, 0, 0, 0.05)"};

  border: ${({ $isHighlight, $isPositive }) =>
    $isHighlight
      ? `1px solid ${$isPositive ? "#b7ebba" : "#ebb7b7"}`
      : "1px solid #eaeaea"};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  span {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: ${({ $isHighlight, $isPositive }) =>
      $isHighlight ? ($isPositive ? "#2e8b57" : "#d9534f") : "#666"};
    margin-bottom: 4px;
    letter-spacing: 0.3px;
  }

  span.value {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0 0 12px 0;
  padding: 8px 0;
  text-align: left;
  border-bottom: 2px solid #e8e8e8;
  letter-spacing: 0.5px;

  span {
    color: #1890ff;
    margin-left: 8px;
    font-weight: 500;
    font-size: 14px;
  }
`;

const TotalCardsWrapper = styled.div`
  margin-bottom: 24px;
`;

const TotalCardsComponent = ({
  finalTotals,
  applyDcAndCharge,
  mode,
  currency,
  dcInfo,
  setDcInfo,
  invChargeList,
  setInvChargeList,
}: TotalCardsProps) => {
  return (
    <TotalCardsWrapper>
      <Title>
        {mode === "multiple" ? (
          <>
            Final Price Data<span>Total amount for all suppliers</span>
          </>
        ) : (
          <>
            Supplier Price Data<span>Amount for current supplier</span>
          </>
        )}
      </Title>
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <RefreshBtn
            icon={<ReloadOutlined />}
            type="primary"
            onClick={() => applyDcAndCharge(mode)}
          />
          {mode === "multiple" && (
            <ChargeInputPopover
              currency={currency}
              dcInfo={dcInfo}
              setDcInfo={setDcInfo}
              invChargeList={invChargeList}
              setInvChargeList={setInvChargeList}
              applyDcAndCharge={applyDcAndCharge}
              finalTotals={finalTotals}
            />
          )}
        </div>
      </TotalCards>
    </TotalCardsWrapper>
  );
};

export default TotalCardsComponent;
