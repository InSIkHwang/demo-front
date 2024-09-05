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
import { Inquiry, InquiryListSupplier } from "../../types/types";
import axios from "../../api/axios";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { deleteInquiry, fetchInquiryDetail } from "../../api/api";

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

// Constants and utility functions
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

  useEffect(() => {
    const fetchDetails = async () => {
      if (open) {
        try {
          setInquiryDetail(null);
          const data = await fetchInquiryDetail(inquiryId);
          setInquiryDetail(data);
        } catch (error) {
          console.error("상세 정보를 가져오는 중 오류가 발생했습니다:", error);
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

  const handleDeleteClick = () => {
    Modal.confirm({
      title: "삭제 확인",
      content: "정말로 이 견적서를 삭제하시겠습니까?",
      okText: "삭제",
      cancelText: "취소",
      onOk: async () => {
        try {
          await deleteInquiry(inquiryId);
          message.success("견적서가 성공적으로 삭제되었습니다.");
          onClose();
          fetchData();
        } catch (error) {
          console.error("견적서 삭제 중 오류가 발생했습니다:", error);
          message.error("견적서 삭제에 실패했습니다. 다시 시도해 주세요.");
        }
      },
    });
  };

  const columns = [
    {
      title: "품목 코드",
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
      title: "품명",
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
      title: "비고",
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
      title: "수량",
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
      title: "단위",
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
      title: "의뢰처",
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
    <StyledModal
      title="상세 정보"
      open={open}
      onCancel={onClose}
      footer={[
        <Button type="primary" key="edit" onClick={handleEditClick}>
          수정
        </Button>,
        <Button key="delete" danger onClick={handleDeleteClick}>
          삭제
        </Button>,
        <Button key="close" onClick={onClose}>
          닫기
        </Button>,
      ]}
      width={1200}
    >
      {loading ? (
        <p>로딩 중...</p>
      ) : (
        inquiryDetail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="문서번호">
                {inquiryDetail.documentNumber}
              </Descriptions.Item>
              <Descriptions.Item label="등록 날짜">
                {inquiryDetail.registerDate}
              </Descriptions.Item>
              <Descriptions.Item label="선적 날짜">
                {inquiryDetail.shippingDate}
              </Descriptions.Item>
              <Descriptions.Item label="매출처명">
                {inquiryDetail.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="REF NO.">
                {inquiryDetail.refNumber || "없음"}
              </Descriptions.Item>
              <Descriptions.Item label="통화">
                {inquiryDetail.currencyType}
              </Descriptions.Item>
              <Descriptions.Item label="환율">
                {`$${inquiryDetail.currency.toFixed(0)}`}
              </Descriptions.Item>
              <Descriptions.Item label="선명">
                {inquiryDetail.vesselName}
              </Descriptions.Item>
              <Descriptions.Item label="선박 번호">
                {inquiryDetail.veeselHullNo}
              </Descriptions.Item>
              <Descriptions.Item label="비고">
                {inquiryDetail.docRemark || "없음"}
              </Descriptions.Item>
              <Descriptions.Item label="문서 담당자">
                {inquiryDetail.docManager}
              </Descriptions.Item>
              <Descriptions.Item label="대표자">
                {inquiryDetail.representative}
              </Descriptions.Item>
              <Descriptions.Item label="문서 상태">
                <TagStyled color="blue">
                  {inquiryDetail.documentStatus}
                </TagStyled>
              </Descriptions.Item>
              <Descriptions.Item label="견적 유형">
                <TagStyled color="green">{inquiryDetail.inquiryType}</TagStyled>
              </Descriptions.Item>
            </Descriptions>
            <Divider />
            <h3>품목 목록</h3>
            <Table
              columns={columns}
              dataSource={inquiryDetail.inquiryItemDetails}
              pagination={{ pageSize: 10 }}
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

export default DetailInquiryModal;
