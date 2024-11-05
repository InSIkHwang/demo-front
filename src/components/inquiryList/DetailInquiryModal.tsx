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
  Typography,
} from "antd";
import {
  Inquiry,
  InquiryListSupplier,
  InquiryResponse,
} from "../../types/types";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  chkDuplicateDocNum,
  copyInquiry,
  deleteInquiry,
  fetchInquiryDetail,
} from "../../api/api";
import dayjs from "dayjs";

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
  const [inquiryDetail, setInquiryDetail] = useState<InquiryResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const [newDocumentNumber, setNewDocumentNumber] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (open) {
        try {
          setInquiryDetail(null);
          const response: InquiryResponse = await fetchInquiryDetail(inquiryId);

          setInquiryDetail(response);
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
    setNewDocumentNumber(inquiryDetail!.documentInfo.documentNumber);
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
        inquiryDetail!.documentInfo.documentNumber,
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
      width: 250,
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
  ];

  const TableSection = ({
    tableData,
    index,
  }: {
    tableData: any;
    index: number;
  }) => (
    <>
      <Divider orientation="left">Table {index + 1}</Divider>
      <div style={{ marginBottom: 20 }}>
        <Typography.Text type="secondary">Suppliers: </Typography.Text>
        {tableData.supplierList.map((supplier: any, idx: number) => (
          <Tag key={supplier.supplierId} color="blue">
            {supplier.code}
            {idx < tableData.supplierList.length - 1 ? "," : ""}
          </Tag>
        ))}
      </div>
      <Table
        columns={columns}
        dataSource={tableData.itemDetails}
        pagination={false}
        rowKey="position"
        scroll={{ y: 200 }}
        bordered
        size="small"
      />
    </>
  );

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
          inquiryDetail &&
            inquiryDetail.documentInfo.documentStatus !== "INQUIRY_SENT" && (
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
                  {inquiryDetail.documentInfo.documentNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Registration Date">
                  {dayjs(inquiryDetail.documentInfo.registerDate).format(
                    "YYYY-MM-DD"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Company Name">
                  {inquiryDetail.documentInfo.companyName}
                </Descriptions.Item>
                <Descriptions.Item label="REF NO.">
                  {inquiryDetail.documentInfo.refNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Currency">
                  {inquiryDetail.documentInfo.currencyType}
                </Descriptions.Item>
                <Descriptions.Item label="Exchange Rate">
                  {`$${inquiryDetail.documentInfo.currency?.toFixed(0)}`}
                </Descriptions.Item>
                <Descriptions.Item label="Vessel Name">
                  {inquiryDetail.documentInfo.vesselName}
                </Descriptions.Item>
                <Descriptions.Item label="Vessel Hull Number">
                  {inquiryDetail.documentInfo.vesselHullNo}
                </Descriptions.Item>
                <Descriptions.Item label="Document Manager">
                  {inquiryDetail.documentInfo.docManager}
                </Descriptions.Item>
                <Descriptions.Item label="Company Representative">
                  {inquiryDetail.documentInfo.representative}
                </Descriptions.Item>
                <Descriptions.Item label="Document Status">
                  <TagStyled
                    color={
                      inquiryDetail.documentInfo.documentStatus ===
                      "WRITING_INQUIRY"
                        ? "orange"
                        : inquiryDetail.documentInfo.documentStatus ===
                          "WAITING_TO_SEND_INQUIRY"
                        ? "blue"
                        : "steelblue"
                    }
                  >
                    {inquiryDetail.documentInfo.documentStatus}
                  </TagStyled>
                </Descriptions.Item>

                <Descriptions.Item label="Inquiry Type">
                  <TagStyled color="green">
                    {inquiryDetail.documentInfo.inquiryType}
                  </TagStyled>
                </Descriptions.Item>
                <Descriptions.Item label="Remark">
                  {inquiryDetail.documentInfo.docRemark}
                </Descriptions.Item>
              </Descriptions>
              <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
                Item List
              </Divider>
              {inquiryDetail.table.map((tableData, index) => (
                <TableSection key={index} tableData={tableData} index={index} />
              ))}
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
