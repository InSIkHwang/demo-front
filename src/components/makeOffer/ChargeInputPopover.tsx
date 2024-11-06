import React, { Dispatch, SetStateAction, useCallback, useEffect } from "react";
import { Button, Popover, Input, Form, Tooltip } from "antd";
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

const RefreshBtn = styled(Button)`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
`;

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
  const calculateDcKrw = (totalSalesAmountKRW: number, value: number) => {
    return Math.round(totalSalesAmountKRW * (value / 100));
  };

  const calculateDcPercentFromKrw = (
    value: number,
    totalSalesAmountKRW: number
  ) => {
    return Number(((value / totalSalesAmountKRW) * 100).toFixed(2));
  };

  const calculateDcGlobal = (totalSalesAmount: number, dcPercent: number) => {
    return Number((totalSalesAmount * (dcPercent / 100)).toFixed(2));
  };

  const handleDcChange = useCallback(
    (key: string, value: number) => {
      setDcInfo((prevInfo) => {
        let newDcInfo = { ...prevInfo, [key]: value };
        const { totalSalesAmountUnDcKRW, totalSalesAmountUnDcGlobal } =
          finalTotals;

        if (key === "dcPercent") {
          newDcInfo.dcKrw = calculateDcKrw(totalSalesAmountUnDcKRW, value);
          newDcInfo.dcGlobal = calculateDcGlobal(
            totalSalesAmountUnDcGlobal,
            value
          );
        } else if (key === "dcKrw") {
          newDcInfo.dcPercent = calculateDcPercentFromKrw(
            value,
            totalSalesAmountUnDcKRW
          );
          newDcInfo.dcGlobal = calculateDcGlobal(
            totalSalesAmountUnDcGlobal,
            newDcInfo.dcPercent
          );
        } else if (key === "dcGlobal") {
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

  const handleChargeChange = (
    index: number,
    key: string,
    value: string | number
  ) => {
    setInvChargeList((prevList) =>
      prevList!.map((charge, idx) => {
        if (idx === index) {
          const newCharge = { ...charge, [key]: value };

          // Calculate the other field based on the conversion rate
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

  const addNewCharge = () => {
    const newCharge = {
      invChargeId: null,
      customCharge: "",
      chargePriceKRW: 0,
      chargePriceGlobal: 0,
    };

    setInvChargeList((prevList) => [...prevList!, newCharge]);
  };

  const removeCharge = (index: number) => {
    setInvChargeList((prevList) => prevList!.filter((_, idx) => idx !== index));
  };

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
                <Input
                  value={charge.customCharge}
                  onChange={(e) =>
                    handleChargeChange(index, "customCharge", e.target.value)
                  }
                  placeholder="Enter charge name"
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
          <RefreshBtn icon={<PercentageOutlined />} />
        </Tooltip>
      </Popover>
    </>
  );
};

export default ChargeInputPopover;
