import { Button, Input } from "antd";

import { Popover } from "antd";
import { useState } from "react";

const CreditNoteChargePopover = ({
  currency,
  onApply,
}: {
  currency: number;
  onApply: (krw: number, global: number) => void;
}) => {
  const [krwAmount, setKrwAmount] = useState<number>(0);
  const [globalAmount, setGlobalAmount] = useState<number>(0);

  const handleKrwChange = (value: number) => {
    setKrwAmount(value);
    setGlobalAmount(Number((value / currency).toFixed(2)));
  };

  const handleGlobalChange = (value: number) => {
    setGlobalAmount(value);
    setKrwAmount(Math.round(value * currency));
  };

  const content = (
    <div style={{ width: 300 }}>
      <div style={{ marginBottom: 10 }}>
        <Input
          type="number"
          value={krwAmount}
          onChange={(e) => handleKrwChange(Number(e.target.value))}
          addonAfter="₩"
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <Input
          type="number"
          value={globalAmount}
          onChange={(e) => handleGlobalChange(Number(e.target.value))}
          addonAfter="F"
        />
      </div>
      <Button type="primary" onClick={() => onApply(krwAmount, globalAmount)}>
        Apply
      </Button>
    </div>
  );

  return (
    <Popover
      content={content}
      title="Enter CREDIT NOTE / CHARGE Amount"
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
