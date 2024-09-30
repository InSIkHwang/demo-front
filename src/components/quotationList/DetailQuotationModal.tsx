import React, { useEffect, useState } from "react";
import {
  Modal,
  Descriptions,
  Button,
  Table,
  Tag,
  Divider,
  message,
} from "antd";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { deleteQutation, fetchQuotationDetail } from "../../api/api";
import { QuotationDetail } from "../../types/types";

interface DetailQuotationModalProps {
  open: boolean;
  onClose: () => void;
  quotationId: number;
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

// Constants and utility functions
const SPECIAL_ITEM_TYPES = ["MAKER", "TYPE", "DESC"];

const isSpecialItemType = (type: string) => SPECIAL_ITEM_TYPES.includes(type);

const DetailQuotationModal = ({
  open,
  onClose,
  quotationId,
  fetchData,
}: DetailQuotationModalProps) => {
  const [quotationDetail, SetquotationDetail] =
    useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      if (open) {
        try {
          SetquotationDetail(null);
          const data = await fetchQuotationDetail(quotationId);
          SetquotationDetail(data);
        } catch (error) {
          message.error("상세 정보를 가져오는 중 오류가 발생했습니다:");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDetails();
  }, [open, quotationId]);

  const handleEditClick = () => {
    console.log("Edit");
  };

  const handleDeleteClick = () => {
    Modal.confirm({
      title: "삭제 확인",
      content: "정말로 삭제하시겠습니까?",
      okText: "삭제",
      cancelText: "취소",
      onOk: async () => {
        try {
          await deleteQutation(quotationId);
          message.success("성공적으로 삭제되었습니다.");
          onClose();
          fetchData();
        } catch (error) {
          console.error("삭제 중 오류가 발생했습니다:", error);
          message.error("삭제에 실패했습니다. 다시 시도해 주세요.");
        }
      },
    });
  };

  const columns = [
    {
      title: "Code",
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
      title: "Name",
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
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: 50,
      render: (text: number, record: any) => {
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
      title: "Sales Amount(₩)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 100,
      render: (text: number, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        const amount = text ?? 0; // 값이 null일 경우 0으로 처리
        return `₩ ${amount.toLocaleString()}`;
      },
    },
    {
      title: "Purchase Amount(₩)",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      width: 100,
      render: (text: number, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        const amount = text ?? 0; // 값이 null일 경우 0으로 처리
        return `₩ ${amount.toLocaleString()}`;
      },
    },
    {
      title: "Margin",
      dataIndex: "margin",
      key: "margin",
      width: 100,
      render: (text: number, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        return typeof text === "number" ? `${text.toFixed(2)}%` : "0";
      },
    },
    {
      title: "Supplier",
      dataIndex: "supplierCode",
      key: "supplierCode",
      width: 200,
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        return text;
      },
    },
  ];

  return (
    <StyledModal
      title="Info"
      open={open}
      onCancel={onClose}
      footer={[
        <Button type="primary" key="edit" onClick={handleEditClick}>
          Edit
        </Button>,
        <Button key="delete" danger onClick={handleDeleteClick}>
          Delete
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={1200}
    >
      {loading ? (
        <p>Loading...</p>
      ) : (
        quotationDetail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Document Number">
                {quotationDetail.quotationDocumentDetail.docNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Registration Date">
                {quotationDetail.quotationDocumentDetail.registerDate}
              </Descriptions.Item>
              <Descriptions.Item label="Costomer Name">
                {quotationDetail.quotationDocumentDetail.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="REF NO.">
                {quotationDetail.quotationDocumentDetail.refNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Currency">
                {quotationDetail.quotationDocumentDetail.currencyType}
              </Descriptions.Item>
              <Descriptions.Item label="Exchange Rate">
                {`$${quotationDetail.quotationDocumentDetail.currency?.toFixed(
                  0
                )}`}
              </Descriptions.Item>
              <Descriptions.Item label="Vessel Name">
                {quotationDetail.quotationDocumentDetail.vesselName}
              </Descriptions.Item>
              <Descriptions.Item label="Vessel HullNo">
                {quotationDetail.quotationDocumentDetail.vesselHullNo}
              </Descriptions.Item>
              <Descriptions.Item label="Remark">
                {quotationDetail.quotationDocumentDetail.docRemark}
              </Descriptions.Item>
              <Descriptions.Item label="Manager">
                {quotationDetail.quotationDocumentDetail.docManager}
              </Descriptions.Item>
              <Descriptions.Item label="Customer's Manager">
                {quotationDetail.quotationDocumentDetail.representative}
              </Descriptions.Item>
              <Descriptions.Item label="Document Status">
                <TagStyled color="blue">
                  {quotationDetail.quotationDocumentDetail.documentStatus}
                </TagStyled>
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">
                {quotationDetail.quotationDocumentDetail.supplierName.map(
                  (name, index) => (
                    <TagStyled key={index} color="green">
                      {name}
                    </TagStyled>
                  )
                )}
              </Descriptions.Item>
            </Descriptions>
            <Divider />
            <h3>Items</h3>
            <Table
              columns={columns}
              dataSource={quotationDetail.quotationItemDetailResponseList}
              pagination={false}
              rowKey="itemId"
              scroll={{ y: 300 }}
              bordered
              size="small"
            />
          </>
        )
      )}
    </StyledModal>
  );
};

export default DetailQuotationModal;
