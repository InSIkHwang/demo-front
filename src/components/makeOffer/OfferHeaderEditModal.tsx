import React, { useState, useEffect } from "react";
import { Modal, Button, Input, Checkbox } from "antd";
import styled from "styled-components";

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    top: 200px;
  }

  .ant-modal-header {
    border-bottom: 1px solid #e8e8e8;
  }

  .ant-modal-footer {
    border-top: 1px solid #e8e8e8;
    padding: 10px 0;
  }
`;

const StyledTextArea = styled(Input.TextArea)`
  resize: none;
  min-height: 200px;
  border-radius: 5px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.12);
`;

interface HeaderEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (header: string, footer: string) => void;
}

const OfferHeaderEditModal = ({
  open,
  onClose,
  onSave,
}: HeaderEditModalProps) => {
  const [headerChk, setHeaderChk] = useState<boolean>(false);
  const [footerChk, setFooterChk] = useState<boolean>(false);
  const [headerText, setHeaderText] = useState<string>("");
  const [footerText, setFooterText] = useState<string>("");

  const placeholderHeaderText = `PORT OF SHIPMENT : BUSAN, KOREA
DELIVERY TIME    :   DAYS AFTER ORDER
TERMS OF PAYMENT : 
OFFER VALIDITY   :   DAYS
PART CONDITION   : `;
  const placeholderRemarkText = `**REMARK
         
  1.`;

  useEffect(() => {
    if (headerChk) {
      setHeaderText(placeholderHeaderText);
    } else {
      setHeaderText("");
    }
  }, [headerChk, placeholderHeaderText]);

  useEffect(() => {
    if (footerChk) {
      setFooterText(placeholderRemarkText);
    } else {
      setFooterText("");
    }
  }, [footerChk, placeholderRemarkText]);

  const handleSave = () => {
    onSave(headerText, footerText);
    onClose();
  };

  return (
    <StyledModal
      title="Header / Remark"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          취소
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          저장
        </Button>,
      ]}
    >
      <Checkbox
        style={{ fontSize: 20 }}
        checked={headerChk}
        onChange={(e) => setHeaderChk(e.target.checked)}
      >
        Header
      </Checkbox>
      <StyledTextArea
        value={headerText}
        onChange={(e) => setHeaderText(e.target.value)}
        placeholder={placeholderHeaderText}
        autoSize={{ minRows: 5 }}
      />
      <Checkbox
        style={{ fontSize: 20 }}
        checked={footerChk}
        onChange={(e) => setFooterChk(e.target.checked)}
      >
        Remark
      </Checkbox>
      <StyledTextArea
        value={footerText}
        onChange={(e) => setFooterText(e.target.value)}
        placeholder={placeholderRemarkText}
        autoSize={{ minRows: 5 }}
      />
    </StyledModal>
  );
};

export default OfferHeaderEditModal;
