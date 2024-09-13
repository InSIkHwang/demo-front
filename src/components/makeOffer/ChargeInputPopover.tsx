import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button, Popover, Input, Form } from "antd";
import styled from "styled-components";
import { InvCharge } from "../../types/types";

const InputGroup = styled.div`
  display: flex;
  gap: 8px;
`;

interface ChargeComponentProps {
  totals: {
    totalSalesAmountKRW: number;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountKRW: number;
    totalPurchaseAmountGlobal: number;
    totalProfit: number;
    totalProfitPercent: number;
  };

  finalTotals: {
    totalSalesAmountKRW: number;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountKRW: number;
    totalPurchaseAmountGlobal: number;
    totalProfit: number;
    totalProfitPercent: number;
  };
  setFinalTotals: Dispatch<
    SetStateAction<{
      totalSalesAmountKRW: number;
      totalSalesAmountGlobal: number;
      totalPurchaseAmountKRW: number;
      totalPurchaseAmountGlobal: number;
      totalProfit: number;
      totalProfitPercent: number;
    }>
  >;
  currency: number;
  dcInfo: { dcPercent: number; dcKrw: number; dcGlobal: number };
  setDcInfo: Dispatch<
    SetStateAction<{ dcPercent: number; dcKrw: number; dcGlobal: number }>
  >;
  invChargeList: InvCharge[] | null;
  setInvChargeList: Dispatch<SetStateAction<InvCharge[] | null>>;
}

const ChargeInputPopover = ({
  totals,
  finalTotals,
  setFinalTotals,
  currency,
  dcInfo,
  setDcInfo,
  invChargeList,
  setInvChargeList,
}: ChargeComponentProps) => {
  const handleDcChange = (key: string, value: number) => {
    setDcInfo((prevInfo) => {
      let newDcInfo = { ...prevInfo, [key]: value };
      const { totalSalesAmountKRW, totalSalesAmountGlobal } = totals;

      if (key === "dcPercent") {
        newDcInfo.dcKrw = Number(
          (totalSalesAmountKRW * (value / 100)).toFixed(2)
        );
        newDcInfo.dcGlobal = Number(
          (totalSalesAmountGlobal * (value / 100)).toFixed(2)
        );
      } else if (key === "dcKrw") {
        newDcInfo.dcPercent = Number(
          ((value / totalSalesAmountKRW) * 100).toFixed(2)
        );
        newDcInfo.dcGlobal = Number(
          (totalSalesAmountGlobal * (newDcInfo.dcPercent / 100)).toFixed(2)
        );
      } else if (key === "dcGlobal") {
        newDcInfo.dcPercent = Number(
          ((value / totalSalesAmountGlobal) * 100).toFixed(2)
        );
        newDcInfo.dcKrw = Number(
          (totalSalesAmountKRW * (newDcInfo.dcPercent / 100)).toFixed(2)
        );
      }

      return newDcInfo;
    });
  };

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

  const applyDcAndCharge = () => {
    // Calculate new totals
    const newTotalSalesAmountKRW = totals.totalSalesAmountKRW - dcInfo.dcKrw;
    const newTotalSalesAmountGlobal =
      totals.totalSalesAmountGlobal - dcInfo.dcGlobal;

    const chargePriceKRWTotal = invChargeList!.reduce(
      (acc, charge) => acc + charge.chargePriceKRW,
      0
    );
    const chargePriceGlobalTotal = invChargeList!.reduce(
      (acc, charge) => acc + charge.chargePriceGlobal,
      0
    );

    const updatedTotalSalesAmountKRW =
      newTotalSalesAmountKRW + chargePriceKRWTotal;
    const updatedTotalSalesAmountGlobal =
      newTotalSalesAmountGlobal + chargePriceGlobalTotal;

    const updatedtotalProfit =
      updatedTotalSalesAmountKRW - totals.totalPurchaseAmountKRW;
    const updatedtotalProfitPercent = Number(
      ((updatedtotalProfit / totals.totalPurchaseAmountKRW) * 100).toFixed(2)
    );

    // Set final totals
    setFinalTotals({
      ...finalTotals,
      totalSalesAmountKRW: updatedTotalSalesAmountKRW,
      totalSalesAmountGlobal: updatedTotalSalesAmountGlobal,
      totalPurchaseAmountKRW: totals.totalPurchaseAmountKRW,
      totalPurchaseAmountGlobal: totals.totalPurchaseAmountGlobal,
      totalProfit: updatedtotalProfit, // Adjust if needed
      totalProfitPercent: updatedtotalProfitPercent, // Adjust if needed
    });
  };

  useEffect(() => {
    applyDcAndCharge();
  }, []);

  const content = (
    <Form style={{ maxWidth: 600, paddingBottom: 40 }} layout="horizontal">
      <Form.Item label="D/C">
        <InputGroup>
          <Input
            value={dcInfo.dcPercent}
            onChange={(e) =>
              handleDcChange("dcPercent", Number(e.target.value))
            }
            placeholder="Enter D/C %"
            addonAfter="%"
          />
          <Input
            value={dcInfo.dcKrw}
            onChange={(e) => handleDcChange("dcKrw", Number(e.target.value))}
            placeholder="Enter D/C ₩"
            addonAfter="₩"
          />
          <Input
            value={dcInfo.dcGlobal}
            onChange={(e) => handleDcChange("dcGlobal", Number(e.target.value))}
            placeholder="Enter D/C Global"
            addonAfter="F"
          />
        </InputGroup>
        <Button
          type="default"
          style={{ float: "right", marginTop: 20 }}
          onClick={addNewCharge}
        >
          Add Charge
        </Button>
      </Form.Item>

      {invChargeList !== null && (
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
      <Button
        type="primary"
        style={{ float: "right", marginTop: 10 }}
        onClick={applyDcAndCharge}
      >
        Apply D/C & Charge
      </Button>
    </Form>
  );

  return (
    <Popover
      content={content}
      title="Enter D/C and Charges"
      trigger="click"
      placement="bottom"
    >
      <Button type="dashed" style={{ float: "right", marginBottom: 10 }}>
        Open Charge Input
      </Button>
    </Popover>
  );
};

export default ChargeInputPopover;
