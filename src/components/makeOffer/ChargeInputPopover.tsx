import React, { useState } from "react";
import { Button, Popover, Input, Form } from "antd";
import styled from "styled-components";

const InputGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ChargeInputPopover = () => {
  const [dcValue, setDcValue] = useState("");
  const [chargeName, setChargeName] = useState("");
  const [chargeValue, setChargeValue] = useState("");

  const content = (
    <Form layout="horizontal">
      <Form.Item label="D/C">
        <InputGroup>
          <Input
            value={dcValue}
            onChange={(e) => setDcValue(e.target.value)}
            placeholder="Enter D/C value"
            addonAfter="%"
          />
          <Input placeholder="Enter D/C value" addonAfter="₩" />
          <Input placeholder="Enter D/C value" addonAfter="F" />
        </InputGroup>
      </Form.Item>
      <Form.Item label="Charge Name">
        <InputGroup>
          <Input
            value={chargeName}
            onChange={(e) => setChargeName(e.target.value)}
            placeholder="Enter charge name"
          />
          <Input
            value={chargeValue}
            onChange={(e) => setChargeValue(e.target.value)}
            placeholder="Enter charge value"
          />
        </InputGroup>
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
      <Button type="dashed" style={{ float: "right", marginBottom: 10 }}>
        Open Charge Input
      </Button>
    </Popover>
  );
};

export default ChargeInputPopover;
