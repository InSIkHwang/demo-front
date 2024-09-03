import React, { useState } from "react";
import { Button, Popover, Input, Form } from "antd";

const ChargeInputPopover = () => {
  const [dcValue, setDcValue] = useState("");
  const [chargeName, setChargeName] = useState("");
  const [chargeValue, setChargeValue] = useState("");

  const content = (
    <Form layout="horizontal">
      <Form.Item label="D/C">
        <Input
          value={dcValue}
          onChange={(e) => setDcValue(e.target.value)}
          placeholder="Enter D/C value"
        />
      </Form.Item>
      <Form.Item label="Charge Name">
        <Input
          value={chargeName}
          onChange={(e) => setChargeName(e.target.value)}
          placeholder="Enter charge name"
        />
      </Form.Item>
      <Form.Item label="Charges">
        <Input
          value={chargeValue}
          onChange={(e) => setChargeValue(e.target.value)}
          placeholder="Enter charge value"
        />
      </Form.Item>
    </Form>
  );

  return (
    <Popover
      content={content}
      title="Enter D/C and Charges"
      trigger="click"
      placement="bottom"
    >
      <Button type="dashed" style={{ float: "right" }}>
        Open Charge Input
      </Button>
    </Popover>
  );
};

export default ChargeInputPopover;
