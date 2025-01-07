import { AutoComplete, Button, Form, Input, Space } from "antd";
import { Popover } from "antd";
import { useState } from "react";
import { InvoiceChargeListIF } from "../../types/types";
import styled from "styled-components";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { updateInvoiceCharge } from "../../api/api";

const ChargeBox = styled.div`
  padding: 20px;
  width: 500px;
  background: #fff;
`;

const ChargeItem = styled.div`
  padding: 15px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const StyledInputGroup = styled(Input.Group)`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
`;

const CreditNoteChargePopover = ({
  currency,
  invoiceChargeList,
  setInvoiceChargeList,
  onApply,
  finalTotals,
}: {
  currency: number;
  invoiceChargeList: InvoiceChargeListIF[];
  setInvoiceChargeList: (list: InvoiceChargeListIF[]) => void;
  onApply: () => void;
  finalTotals: any;
}) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);

  const handleChargeChange = (
    index: number,
    field: keyof InvoiceChargeListIF,
    value: string | number
  ) => {
    const newList = [...invoiceChargeList];
    const charge = { ...newList[index] };

    if (field === "chargePriceKRW") {
      charge.chargePriceKRW = Number(value);
      charge.chargePriceGlobal = Number((Number(value) / currency).toFixed(2));
    } else if (field === "chargePriceGlobal") {
      charge.chargePriceGlobal = Number(value);
      charge.chargePriceKRW = Math.round(Number(value) * currency);
    } else if (field === "customCharge" && value === "CREDIT NOTE") {
      charge.customCharge = "CREDIT NOTE";
      // 총액의 10%로 계산하고 소수점 셋째자리에서 반올림
      charge.chargePriceKRW = Math.round(finalTotals.totalSalesAmountKRW * 0.1);
      charge.chargePriceGlobal = Number(
        (finalTotals.totalSalesAmountGlobal * 0.1).toFixed(2)
      );
    } else {
      //필드 타입 명시적으로 추가
      (charge[field] as string | number) = value;
    }

    newList[index] = charge;
    setInvoiceChargeList(newList);
  };

  const addCharge = () => {
    setInvoiceChargeList([
      ...invoiceChargeList,
      {
        invoiceChargeId: null,
        customCharge: "",
        chargePriceKRW: 0,
        chargePriceGlobal: 0,
      },
    ]);
  };

  const removeCharge = (index: number) => {
    const newList = invoiceChargeList.filter((_, i) => i !== index);
    setInvoiceChargeList(newList);
  };

  const handleApply = async () => {
    onApply();
    setOpen(false);
  };

  const content = (
    <ChargeBox>
      <Form form={form} layout="vertical">
        {invoiceChargeList.map((charge, index) => (
          <ChargeItem key={index}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <AutoComplete
                value={charge.customCharge}
                onChange={(value) =>
                  handleChargeChange(index, "customCharge", value)
                }
                style={{ width: "100%" }}
                options={[
                  { value: "CREDIT NOTE", label: "CREDIT NOTE" },
                  { value: "AIR FREIGHT CHARGE", label: "AIR FREIGHT CHARGE" },
                ]}
              >
                <Input
                  placeholder="Charge Description"
                  style={{ borderRadius: "6px" }}
                />
              </AutoComplete>
              <StyledInputGroup>
                <Input
                  style={{ flex: 1 }}
                  type="number"
                  value={charge.chargePriceKRW}
                  onChange={(e) =>
                    handleChargeChange(index, "chargePriceKRW", e.target.value)
                  }
                  placeholder="KRW Amount"
                  addonAfter="₩"
                />
                <Input
                  style={{ flex: 1 }}
                  type="number"
                  value={charge.chargePriceGlobal}
                  onChange={(e) =>
                    handleChargeChange(
                      index,
                      "chargePriceGlobal",
                      e.target.value
                    )
                  }
                  placeholder="Global Amount"
                  addonAfter="F"
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeCharge(index)}
                />
              </StyledInputGroup>
            </Space>
          </ChargeItem>
        ))}
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginTop: 8,
            borderTop: "1px solid #f0f0f0",
            paddingTop: 8,
          }}
        >
          <Button icon={<PlusOutlined />} onClick={addCharge} type="dashed">
            Add Charge
          </Button>
          <Button type="primary" onClick={handleApply}>
            Apply
          </Button>
        </Space>
      </Form>
    </ChargeBox>
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={content}
      title="CREDIT NOTE / CHARGE"
      trigger="click"
      placement="top"
    >
      <Button style={{ marginLeft: 10 }} type="default">
        CREDIT NOTE / CHARGE
      </Button>
    </Popover>
  );
};

export default CreditNoteChargePopover;
