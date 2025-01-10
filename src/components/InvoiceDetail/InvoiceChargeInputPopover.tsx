import React, { Dispatch, SetStateAction, useCallback, useEffect } from "react";
import {
  Button,
  Popover,
  Input,
  Form,
  Tooltip,
  AutoComplete,
  Checkbox,
  CheckboxChangeEvent,
} from "antd";
import styled from "styled-components";
import { InvoiceCharge } from "../../types/types";
import {
  PercentageOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const InputGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ChargeBox = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChargeBtn = styled(Button)`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
`;

const CHARGE_OPTIONS = ["CREDIT NOTE", "PACKING CHARGE", "FREIGHT CHARGE"];

interface InvoiceChargeInputPopoverProps {
  handleSave: () => void;
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
  currency: number;
  dcInfo: { dcPercent: number; dcKrw: number; dcGlobal: number };
  setDcInfo: Dispatch<
    SetStateAction<{ dcPercent: number; dcKrw: number; dcGlobal: number }>
  >;
  invChargeList: InvoiceCharge[] | null;
  setInvChargeList: Dispatch<SetStateAction<InvoiceCharge[] | null>>;
  applyDcAndCharge: (mode: string) => void;
}

const ChargeItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 10px;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const ChargeItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ChargeItemBody = styled.div`
  display: flex;
  gap: 8px;
`;

const InvoiceChargeInputPopover = ({
  currency,
  dcInfo,
  setDcInfo,
  invChargeList,
  setInvChargeList,
  applyDcAndCharge,
  handleSave,
  finalTotals,
}: InvoiceChargeInputPopoverProps) => {
  // 할인 계산 함수
  const calculateDcKrw = (totalSalesAmountKRW: number, value: number) => {
    return Math.round(totalSalesAmountKRW * (value / 100));
  };

  // 할인 계산 함수
  const calculateDcPercentFromKrw = (
    value: number,
    totalSalesAmountKRW: number
  ) => {
    return Number(((value / totalSalesAmountKRW) * 100).toFixed(2));
  };

  // 할인 계산 함수
  const calculateDcGlobal = (totalSalesAmount: number, dcPercent: number) => {
    return Number((totalSalesAmount * (dcPercent / 100)).toFixed(2));
  };

  // 할인율 변경 핸들러
  const handleDcChange = useCallback(
    (key: string, value: number) => {
      setDcInfo((prevInfo) => {
        let newDcInfo = { ...prevInfo, [key]: value };
        const { totalSalesAmountUnDcKRW, totalSalesAmountUnDcGlobal } =
          finalTotals;

        // 할인율 변경 시 할인 금액 계산
        if (key === "dcPercent") {
          newDcInfo.dcKrw = calculateDcKrw(totalSalesAmountUnDcKRW, value);
          newDcInfo.dcGlobal = calculateDcGlobal(
            totalSalesAmountUnDcGlobal,
            value
          );
        } else if (key === "dcKrw") {
          // 할인 금액 변경 시 할인율 계산
          newDcInfo.dcPercent = calculateDcPercentFromKrw(
            value,
            totalSalesAmountUnDcKRW
          );
          newDcInfo.dcGlobal = calculateDcGlobal(
            totalSalesAmountUnDcGlobal,
            newDcInfo.dcPercent
          );
        } else if (key === "dcGlobal") {
          // 할인 금액 변경 시 할인율 계산
          newDcInfo.dcPercent = Number(
            ((value / totalSalesAmountUnDcGlobal) * 100).toFixed(2)
          );
          newDcInfo.dcKrw = calculateDcKrw(
            totalSalesAmountUnDcKRW,
            newDcInfo.dcPercent
          );
        }

        return newDcInfo;
      });
    },
    [finalTotals, setDcInfo]
  );

  // 차지 입력값 변경 핸들러
  const handleChargeInputChange = (
    index: number,
    key: string,
    value: string | number | boolean
  ) => {
    setInvChargeList((prevList) =>
      prevList!.map((charge, idx) => {
        if (idx === index) {
          return { ...charge, [key]: value };
        }
        return charge;
      })
    );
  };

  // 차지 계산 핸들러
  const handleChargeCalculation = (
    index: number,
    key: string,
    value: string | number
  ) => {
    setInvChargeList((prevList) =>
      prevList!.map((charge, idx) => {
        if (idx === index) {
          const newCharge = { ...charge };

          if (key === "chargePriceKRW") {
            newCharge.chargePriceGlobal = Number(
              ((value as number) / currency).toFixed(2)
            );
          } else if (key === "chargePriceGlobal") {
            newCharge.chargePriceKRW = Number(
              ((value as number) * currency).toFixed(2)
            );
          } else if (key === "customCharge" && value === "CREDIT NOTE") {
            newCharge.chargePriceKRW = Math.round(
              finalTotals.totalSalesAmountUnDcKRW * 0.1
            );
            newCharge.chargePriceGlobal = Number(
              (finalTotals.totalSalesAmountUnDcGlobal * 0.1).toFixed(2)
            );
          }

          return newCharge;
        }
        return charge;
      })
    );
  };

  // 새로운 차지 추가 핸들러
  const addNewCharge = () => {
    const newCharge = {
      invChargeId: null,
      customCharge: "",
      chargePriceKRW: 0,
      chargePriceGlobal: 0,
      isChecked: false,
    };

    setInvChargeList((prevList) =>
      prevList ? [...prevList, newCharge] : [newCharge]
    );
  };

  // 차지 삭제 핸들러
  const removeCharge = (index: number) => {
    setInvChargeList((prevList) => prevList!.filter((_, idx) => idx !== index));
  };

  // 할인율, 금액 변경 시 할인 금액 계산
  useEffect(() => {
    handleDcChange("dcPercent", Number(dcInfo.dcPercent));
  }, [finalTotals, handleDcChange, dcInfo.dcPercent]);

  const content = (
    <Form style={{ width: 600, paddingBottom: 40 }} layout="horizontal">
      <Form.Item
        label="Discount"
        style={{ borderBottom: "1px solid #ccc", paddingBottom: 20 }}
      >
        <InputGroup>
          <Input
            type="number"
            step="0.01"
            value={dcInfo.dcPercent}
            onChange={(e) =>
              handleDcChange("dcPercent", Number(e.target.value))
            }
            placeholder="Discount %"
            addonAfter="%"
            onWheel={(e) => e.currentTarget.blur()}
          />
          <Input
            type="number"
            step="0.01"
            value={dcInfo.dcKrw}
            onChange={(e) => handleDcChange("dcKrw", Number(e.target.value))}
            placeholder="Discount (₩)"
            addonAfter="₩"
            onWheel={(e) => e.currentTarget.blur()}
          />
          <Input
            type="number"
            step="0.01"
            value={dcInfo.dcGlobal}
            onChange={(e) => handleDcChange("dcGlobal", Number(e.target.value))}
            placeholder="Discount (F)"
            addonAfter="F"
            onWheel={(e) => e.currentTarget.blur()}
          />
        </InputGroup>
      </Form.Item>

      <ChargeBox style={{ borderBottom: "1px solid #ccc" }}>
        <Button
          style={{ marginBottom: 10 }}
          type="default"
          icon={<PlusOutlined />}
          onClick={addNewCharge}
        >
          Add Additional Charge
        </Button>

        {invChargeList !== null && invChargeList?.length > 0 && (
          <Form.Item>
            {invChargeList.map((charge, index) => (
              <ChargeItemWrapper key={index}>
                <ChargeItemHeader>
                  <Checkbox
                    checked={charge.isChecked}
                    onChange={(e: CheckboxChangeEvent) =>
                      handleChargeInputChange(
                        index,
                        "isChecked",
                        e.target.checked
                      )
                    }
                  >
                    Separate on PDF
                  </Checkbox>
                  <AutoComplete
                    style={{ flex: 1 }}
                    value={charge.customCharge}
                    onChange={(value) =>
                      handleChargeInputChange(index, "customCharge", value)
                    }
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                      handleChargeCalculation(
                        index,
                        "customCharge",
                        e.target.value
                      )
                    }
                    options={CHARGE_OPTIONS.map((option) => ({
                      value: option,
                    }))}
                    placeholder="Enter charge name"
                    filterOption={(inputValue, option) =>
                      option!.value
                        .toUpperCase()
                        .indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeCharge(index)}
                  />
                </ChargeItemHeader>

                <ChargeItemBody>
                  <Input
                    type="number"
                    step="0.01"
                    value={charge.chargePriceKRW}
                    onChange={(e) =>
                      handleChargeInputChange(
                        index,
                        "chargePriceKRW",
                        Number(e.target.value)
                      )
                    }
                    onBlur={(e) =>
                      handleChargeCalculation(
                        index,
                        "chargePriceKRW",
                        e.target.value
                      )
                    }
                    placeholder="Amount (₩)"
                    addonAfter="₩"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={charge.chargePriceGlobal}
                    onChange={(e) =>
                      handleChargeInputChange(
                        index,
                        "chargePriceGlobal",
                        Number(e.target.value)
                      )
                    }
                    onBlur={(e) =>
                      handleChargeCalculation(
                        index,
                        "chargePriceGlobal",
                        e.target.value
                      )
                    }
                    placeholder="Amount (F)"
                    addonAfter="F"
                  />
                </ChargeItemBody>
              </ChargeItemWrapper>
            ))}
          </Form.Item>
        )}
      </ChargeBox>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <Button
          type="default"
          style={{ flex: 1 }}
          onClick={() => applyDcAndCharge("multiple")}
        >
          Apply Discount & Charges
        </Button>
        <Button type="primary" style={{ flex: 1 }} onClick={handleSave}>
          Save
        </Button>
      </div>
    </Form>
  );

  return (
    <>
      <Popover
        content={content}
        title="Enter D/C and Charges"
        trigger="click"
        placement="bottom"
      >
        <Tooltip title="write and apply D/C and charges" placement="bottomLeft">
          <ChargeBtn icon={<PercentageOutlined />} />
        </Tooltip>
      </Popover>
    </>
  );
};

export default InvoiceChargeInputPopover;
