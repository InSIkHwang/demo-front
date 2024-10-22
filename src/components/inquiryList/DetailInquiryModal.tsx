import React, { useEffect, useState } from "react";
import {
  Modal,
  Descriptions,
  Button,
  Table,
  Tag,
  Divider,
  message,
  Input,
} from "antd";
import { Inquiry, InquiryListSupplier } from "../../types/types";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  chkDuplicateDocNum,
  copyInquiry,
  deleteInquiry,
  fetchInquiryDetail,
} from "../../api/api";

interface DetailInquiryModalProps {
  open: boolean;
  onClose: () => void;
  inquiryId: number;
  fetchData: () => Promise<void>;
}

const StyledModal = styled(Modal)`
  .ant-modal-close {
    display: none;
  }
  .ant-modal-header {
    background-color: #1890ff;
    color: #fff;
    border-bottom: none;
    padding: 5px 0;
  }
  .ant-modal-title {
    color: #fff;
    font-size: 18px;
    margin-left: 10px;
  }
  .ant-modal-footer {
    border-top: none;
  }
  .ant-descriptions-item-label {
    font-weight: 600;
    color: #333;
  }
  .ant-descriptions-item-content {
    color: #666;
  }
  .item-name-full-width {
    td {
      display: block;
      width: 100%;
    }
  }
  .ant-table-body {
    max-height: 250px !important;
  }
`;

const TagStyled = styled(Tag)`
  margin-right: 8px;
`;

const SPECIAL_ITEM_TYPES = ["MAKER", "TYPE", "DESC"];

const isSpecialItemType = (type: string) => SPECIAL_ITEM_TYPES.includes(type);

const DetailInquiryModal = ({
  open,
  onClose,
  inquiryId,
  fetchData,
}: DetailInquiryModalProps) => {
  const [inquiryDetail, setInquiryDetail] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const [newDocumentNumber, setNewDocumentNumber] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (open) {
        try {
          setInquiryDetail(null);
          const data = await fetchInquiryDetail(inquiryId);
          setInquiryDetail(data);
        } catch (error) {
          message.error("Error fetching details:");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDetails();
  }, [open, inquiryId]);

  const handleEditClick = () => {
    if (inquiryDetail) {
      const path = inquiryId ? `/makeinquiry/${inquiryId}` : "/makeinquiry";
      navigate(path);
    }
  };

  const handleCopyClick = () => {
    setNewDocumentNumber(inquiryDetail!.documentNumber);
    setIsModalVisible(true);
  };

  const handleCopyOk = async () => {
    try {
      const isDuplicate = await chkDuplicateDocNum(
        newDocumentNumber,
        inquiryId
      );
      if (isDuplicate) {
        message.error(
          "Duplicate document number. Please use a different number."
        );
        return; // 중복일 경우 처리 중단
      }

      const { inquiryId: newInquiryId } = await copyInquiry(
        inquiryDetail!.documentNumber,
        newDocumentNumber
      );
      message.success("Copied successfully");
      fetchData();
      setIsModalVisible(false);

      navigate(`/makeinquiry/${newInquiryId}`);
    } catch (error) {
      message.error("Error copying inquiry. Please check document number");
    }
  };

  const handleCopyCancel = () => {
    setIsModalVisible(false);
  };

  const handleDeleteClick = () => {
    Modal.confirm({
      title: "Delete Confirmation",
      content: "Are you sure you want to delete this inquiry?",
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteInquiry(inquiryId);
          message.success("Inquiry deleted successfully.");
          onClose();
          fetchData();
        } catch (error) {
          console.error("Error deleting inquiry:", error);
          message.error("Failed to delete inquiry. Please try again.");
        }
      },
    });
  };

  const columns = [
    {
      title: "Item Code",
      dataIndex: "itemCode",
      key: "itemCode",
      width: 150,
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return record.itemType;
        }
        return text;
      },
    },
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return <div>{text}</div>;
        }
        return text;
      },
    },
    {
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      width: 150,
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        return text;
      },
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: 50,
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        return text;
      },
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      width: 50,
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        return text;
      },
    },
    {
      title: "Suppliers",
      dataIndex: "suppliers",
      key: "suppliers",
      width: 200,
      render: (suppliers: InquiryListSupplier[], record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }

        if (!suppliers) {
          return <div>No suppliers available</div>;
        }

        return (
          <>
            {suppliers.map((supplier) => (
              <div key={supplier.supplierId}>{supplier.code},</div>
            ))}
          </>
        );
      },
    },
  ];

  return (
    <>
      <StyledModal
        title="Detail Information"
        open={open}
        onCancel={onClose}
        footer={[
          <Button type="dashed" key="copy" onClick={handleCopyClick}>
            Copy to new document
          </Button>,
          inquiryDetail && inquiryDetail.documentStatus !== "INQUIRY_SENT" && (
            <>
              <Button type="primary" key="edit" onClick={handleEditClick}>
                Edit
              </Button>
              <Button key="delete" danger onClick={handleDeleteClick}>
                Delete
              </Button>
            </>
          ),
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
        width={1200}
      >
        {loading ? (
          <p>Loading...</p>
        ) : (
          inquiryDetail && (
            <>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Document Number">
                  {inquiryDetail.documentNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Registration Date">
                  {inquiryDetail.registerDate}
                </Descriptions.Item>
                <Descriptions.Item label="Company Name">
                  {inquiryDetail.companyName}
                </Descriptions.Item>
                <Descriptions.Item label="REF NO.">
                  {inquiryDetail.refNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Currency">
                  {inquiryDetail.currencyType}
                </Descriptions.Item>
                <Descriptions.Item label="Exchange Rate">
                  {`$${inquiryDetail.currency?.toFixed(0)}`}
                </Descriptions.Item>
                <Descriptions.Item label="Vessel Name">
                  {inquiryDetail.vesselName}
                </Descriptions.Item>
                <Descriptions.Item label="Vessel Hull Number">
                  {inquiryDetail.veeselHullNo}
                </Descriptions.Item>
                <Descriptions.Item label="Remark">
                  {inquiryDetail.docRemark}
                </Descriptions.Item>
                <Descriptions.Item label="Document Manager">
                  {inquiryDetail.docManager}
                </Descriptions.Item>
                <Descriptions.Item label="Company Representative">
                  {inquiryDetail.representative}
                </Descriptions.Item>
                <Descriptions.Item label="Document Status">
                  <TagStyled
                    color={
                      inquiryDetail.documentStatus === "WRITING_INQUIRY"
                        ? "orange"
                        : inquiryDetail.documentStatus ===
                          "WAITING_TO_SEND_INQUIRY"
                        ? "blue"
                        : "steelblue"
                    }
                  >
                    {inquiryDetail.documentStatus}
                  </TagStyled>
                </Descriptions.Item>

                <Descriptions.Item label="Inquiry Type">
                  <TagStyled color="green">
                    {inquiryDetail.inquiryType}
                  </TagStyled>
                </Descriptions.Item>
              </Descriptions>
              <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
                Item List
              </Divider>
              <Table
                columns={columns}
                dataSource={inquiryDetail.inquiryItemDetails}
                pagination={false}
                rowKey="position"
                scroll={{ y: 300 }}
                bordered
                size="small"
              />
            </>
          )
        )}
      </StyledModal>
      <Modal
        title="Copy Document"
        open={isModalVisible}
        onOk={handleCopyOk}
        onCancel={handleCopyCancel}
      >
        <Input
          placeholder="Please enter a new document number"
          value={newDocumentNumber}
          onChange={(e) => setNewDocumentNumber(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default DetailInquiryModal;
