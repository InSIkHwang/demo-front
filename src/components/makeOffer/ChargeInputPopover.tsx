import React, { Dispatch, SetStateAction, useCallback, useEffect } from "react";
import { Button, Popover, Input, Form, Tooltip, AutoComplete } from "antd";
import styled from "styled-components";
import { InvCharge } from "../../types/types";
import { PercentageOutlined } from "@ant-design/icons";

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

const CHARGE_OPTIONS = ["PACKING CHARGE", "FREIGHT CHARGE"];

interface ChargeComponentProps {
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
  invChargeList: InvCharge[] | null;
  setInvChargeList: Dispatch<SetStateAction<InvCharge[] | null>>;
  applyDcAndCharge: (mode: string) => void;
}

const ChargeInputPopover = ({
  currency,
  dcInfo,
  setDcInfo,
  invChargeList,
  setInvChargeList,
  applyDcAndCharge,
  finalTotals,
}: ChargeComponentProps) => {
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

  // 차지 변경 핸들러
  const handleChargeChange = (
    index: number,
    key: string,
    value: string | number
  ) => {
    setInvChargeList((prevList) =>
      prevList!.map((charge, idx) => {
        if (idx === index) {
          const newCharge = { ...charge, [key]: value };

          // 환율 변경 시 차지 계산
          if (key === "chargePriceKRW") {
            newCharge.chargePriceGlobal = Number(
              ((value as number) / currency).toFixed(2)
            );
          } else if (key === "chargePriceGlobal") {
            newCharge.chargePriceKRW = Number(
              ((value as number) * currency).toFixed(2)
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
    };

    setInvChargeList((prevList) => [...prevList!, newCharge]);
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
    <Form style={{ maxWidth: 600, paddingBottom: 40 }} layout="horizontal">
      <Form.Item
        label="D/C"
        style={{ borderBottom: "1px solid #ccc", paddingBottom: 20 }}
      >
        <InputGroup>
          <Input
            type="number" // type을 number로 설정
            step="0.01" // 소수점 입력을 위해 step을 설정
            value={dcInfo.dcPercent}
            onChange={(e) =>
              handleDcChange("dcPercent", Number(e.target.value))
            }
            placeholder="Enter D/C %"
            addonAfter="%"
            onWheel={(e) => e.currentTarget.blur()}
          />
          <Input
            type="number" // type을 number로 설정
            step="0.01" // 소수점 입력을 위해 step을 설정
            value={dcInfo.dcKrw}
            onChange={(e) => handleDcChange("dcKrw", Number(e.target.value))}
            placeholder="Enter D/C ₩"
            addonAfter="₩"
            onWheel={(e) => e.currentTarget.blur()}
          />
          <Input
            type="number" // type을 number로 설정
            step="0.01" // 소수점 입력을 위해 step을 설정
            value={dcInfo.dcGlobal}
            onChange={(e) => handleDcChange("dcGlobal", Number(e.target.value))}
            placeholder="Enter D/C Global"
            addonAfter="F"
            onWheel={(e) => e.currentTarget.blur()}
          />
        </InputGroup>
      </Form.Item>
      <ChargeBox style={{ borderBottom: "1px solid #ccc" }}>
        <Button
          type="default"
          style={{ margin: "10px 0" }}
          onClick={addNewCharge}
        >
          Add Charge
        </Button>
        {invChargeList !== null && invChargeList?.length > 0 && (
          <Form.Item label="Charge Info">
            {invChargeList.map((charge, index) => (
              <InputGroup style={{ marginBottom: 5 }} key={index}>
                <AutoComplete
                  value={charge.customCharge}
                  onChange={(value) =>
                    handleChargeChange(index, "customCharge", value)
                  }
                  options={CHARGE_OPTIONS.map((option) => ({ value: option }))}
                  placeholder="Enter charge name"
                  filterOption={(inputValue, option) =>
                    option!.value
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                />
                <Input
                  type="number" // type을 number로 설정
                  step="0.01" // 소수점 입력을 위해 step을 설정
                  value={charge.chargePriceKRW}
                  onChange={(e) =>
                    handleChargeChange(
                      index,
                      "chargePriceKRW",
                      Number(e.target.value)
                    )
                  }
                  placeholder="Enter charge value (₩)"
                  addonAfter="₩"
                />
                <Input
                  type="number" // type을 number로 설정
                  step="0.01" // 소수점 입력을 위해 step을 설정
                  value={charge.chargePriceGlobal}
                  onChange={(e) =>
                    handleChargeChange(
                      index,
                      "chargePriceGlobal",
                      Number(e.target.value)
                    )
                  }
                  placeholder="Enter charge value (Global)"
                  addonAfter="F"
                />
                <Button
                  type="default"
                  onClick={() => removeCharge(index)}
                  style={{ marginLeft: 8 }}
                >
                  Delete
                </Button>
              </InputGroup>
            ))}
          </Form.Item>
        )}
      </ChargeBox>

      <Button
        type="primary"
        style={{ marginTop: 10, width: "100%" }}
        onClick={() => applyDcAndCharge("multiple")}
      >
        Apply D/C & Charge
      </Button>
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

export default ChargeInputPopover;
