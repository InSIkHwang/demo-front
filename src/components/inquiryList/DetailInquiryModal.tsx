import React, { useEffect, useState } from "react";
import { Modal, Descriptions, Button, Table, Tag, Divider } from "antd";
import { Inquiry, InquiryListSupplier } from "../../types/types";
import axios from "../../api/axios";
import styled from "styled-components";

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

const DetailInquiryModal = ({
  visible,
  onClose,
  inquiryId,
}: DetailInquiryModalProps) => {
  const [inquiryDetail, setInquiryDetail] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  console.log(inquiryDetail);

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

  const columns = [
    {
      title: "품목 코드",
      dataIndex: "itemCode",
      key: "itemCode",
    },
    {
      title: "품명",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "비고",
      dataIndex: "itemRemark",
      key: "itemRemark",
    },
    {
      title: "수량",
      dataIndex: "qty",
      key: "qty",
    },
    {
      title: "단위",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "의뢰처",
      dataIndex: "suppliers",
      key: "suppliers",
      render: (suppliers: InquiryListSupplier[]) => (
        <>
          {suppliers.map((supplier) => (
            <div key={supplier.supplierId}>
              <strong>{supplier.companyName}</strong> ({supplier.code}),
            </div>
          ))}
        </>
      ),
    },
  ];

  return (
    <StyledModal
      title="상세 정보"
      visible={visible}
      onCancel={onClose}
      footer={[
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
              <Descriptions.Item label="환율">{`$${inquiryDetail.currency.toFixed(
                0
              )}`}</Descriptions.Item>
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
