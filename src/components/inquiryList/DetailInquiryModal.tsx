import React, { useEffect, useState } from "react";
import { Modal, Descriptions, Button, Table, Tag, Divider } from "antd";
import { Inquiry, InquiryListSupplier } from "../../types/types";
import axios from "../../api/axios";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

interface DetailInquiryModalProps {
  visible: boolean;
  onClose: () => void;
  inquiryId: number;
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
  visible,
  onClose,
  inquiryId,
}: DetailInquiryModalProps) => {
  const [inquiryDetail, setInquiryDetail] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInquiryDetail = async () => {
      try {
        const response = await axios.get(
          `/api/customer-inquiries/${inquiryId}`
        );
        setInquiryDetail(response.data);
        setLoading(false);
      } catch (error) {
        console.error("상세 정보를 가져오는 중 오류가 발생했습니다:", error);
        setLoading(false);
      }
    };

    if (visible) {
      fetchInquiryDetail();
    }
  }, [visible, inquiryId]);

  const handleEditClick = () => {
    if (inquiryDetail) {
      // `MakeInquiry` 페이지로 데이터를 넘기기 위해 state를 사용합니다.
      navigate("/makeinquiry", { state: { inquiry: inquiryDetail } });
    }
  };

  const columns = [
    {
      title: "품목 코드",
      dataIndex: "itemCode",
      key: "itemCode",
      width: 150,
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.inquiryItemType)) {
          return null;
        }
        return text;
      },
    },
    {
      title: "품명",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.inquiryItemType)) {
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
        if (isSpecialItemType(record.inquiryItemType)) {
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
        if (isSpecialItemType(record.inquiryItemType)) {
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
        if (isSpecialItemType(record.inquiryItemType)) {
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
        if (isSpecialItemType(record.inquiryItemType)) {
          return null;
        }
        return (
          <>
            {suppliers.map((supplier) => (
              <div key={supplier.supplierId}>
                <strong>{supplier.companyName}</strong> ({supplier.code}),
              </div>
            ))}
          </>
        );
      },
    },
  ];

  return (
    <StyledModal
      title="상세 정보"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="edit" onClick={handleEditClick}>
          수정
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
                {inquiryDetail.docManger}
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
              dataSource={inquiryDetail.inquiryItems}
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
