import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Input, message } from "antd";
import styled from "styled-components";
import { Supplier } from "../../types/types";
import { fetchSupplierDetail } from "../../api/api";

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
  onSave: (text: string) => void;
  pdfCompanyTag: { id: number; name: string }[];
}

const HeaderEditModal = ({
  open,
  onClose,
  onSave,
  pdfCompanyTag,
}: HeaderEditModalProps) => {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const prevSupplierIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (open) {
      const currentSupplierId = pdfCompanyTag[0]?.id;
      if (prevSupplierIdRef.current !== currentSupplierId) {
        fetchData();
        prevSupplierIdRef.current = currentSupplierId;
      }
    }
  }, [open, pdfCompanyTag]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchSupplierDetail(
        pdfCompanyTag[0].id,
        "supplier"
      );
      setSelectedSupplier(response);
      setText(response.headerMessage || "");
    } catch (error) {
      message.error("Error fetching data:");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  return (
    <StyledModal
      title="Edit Header Text"
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
      <StyledTextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your text here. (You can change lines with the Enter key.)"
        autoSize={{ minRows: 5 }}
      />
    </StyledModal>
  );
};

export default HeaderEditModal;
