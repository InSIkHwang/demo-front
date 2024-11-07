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
import {
  confirmQutation,
  deleteQutation,
  fetchQuotationDetail,
} from "../../api/api";
import { QuotationDetail } from "../../types/types";

interface DetailQuotationModalProps {
  open: boolean;
  onClose: () => void;
  quotationId: number;
  fetchData: () => Promise<void>;
}

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .ant-modal-close {
    display: none;
  }

  .ant-modal-header {
    background: #1890ff;
    color: #fff;
    border-bottom: none;
    padding: 16px 24px;
    border-radius: 12px 12px 0 0;
  }

  .ant-modal-title {
    color: #fff;
    font-size: 20px;
    font-weight: 600;
    margin-left: 0;
  }

  .ant-modal-body {
    padding: 24px;
  }

  .ant-modal-footer {
    border-top: 1px solid #f0f0f0;
    padding: 16px 24px;
    border-radius: 0 0 12px 12px;
  }

  .ant-descriptions {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-bottom: 16px;
  }

  .ant-descriptions-item-label {
    font-weight: 600;
    color: #1f2937;
    background-color: #f8fafc;
  }

  .descriptions-totals .ant-descriptions-item-label,
  .descriptions-totals .ant-descriptions-item-content {
    text-align: center;
    background-color: #f8fafc;
  }

  .ant-descriptions-item-content {
    color: #4b5563;
  }

  .ant-table {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .ant-table-thead > tr > th {
    background: #f8fafc;
    color: #1f2937;
    font-weight: 600;
  }
`;

const TagStyled = styled(Tag)`
  margin-right: 8px;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const DividerStyled = styled(Divider)`
  height: 1.5em;
`;

const TableStyled = styled(Table)`
  .ant-table-thead .ant-table-cell {
    font-size: 13px;
    text-align: center;
    background: #f8fafc;
    font-weight: 600;
  }

  .ant-table-tbody {
    font-size: 13px;
  }

  .ant-table-tbody > tr:hover > td {
    background: #f1f5f9;
  }
`;

const AmountTotal = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px;
  background: #fff;
  border-radius: 8px;

  span {
    font-weight: 500;
    color: #1f2937;
  }
`;

// Constants and utility functions
const SPECIAL_ITEM_TYPES = ["MAKER", "TYPE", "DESC"];

const isSpecialItemType = (type: string) => SPECIAL_ITEM_TYPES.includes(type);

const currencySymbols = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  JPY: "¥",
} as const;

const DetailQuotationModal = ({
  open,
  onClose,
  quotationId,
  fetchData,
}: DetailQuotationModalProps) => {
  const [quotationDetail, SetquotationDetail] =
    useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currencySymbol, setCurrencySymbol] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      if (open) {
        try {
          SetquotationDetail(null);
          const data = await fetchQuotationDetail(quotationId);
          SetquotationDetail(data);
          const currencyType =
            quotationDetail?.quotationDocumentDetail.currencyType;
          if (
            currencyType &&
            currencySymbols[currencyType as keyof typeof currencySymbols]
          ) {
            setCurrencySymbol(
              currencySymbols[currencyType as keyof typeof currencySymbols]
            );
          } else {
            setCurrencySymbol(""); // currencyType이 undefined일 경우 빈 문자열 설정
          }
        } catch (error) {
          message.error("상세 정보를 가져오는 중 오류가 발생했습니다:");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDetails();
  }, [open, quotationId]);

  // 총합 계산
  const totalItem = quotationDetail?.quotationItemDetailResponseList.reduce(
    (acc, item) => (item.itemType === "ITEM" ? acc + 1 : acc),
    0
  );

  const totalSalesAmountKrw: number =
    quotationDetail?.quotationItemDetailResponseList.reduce(
      (acc, item) => acc + (item.salesAmountKRW || 0),
      0
    ) || 0;

  const totalPurchaseAmountKrw: number =
    quotationDetail?.quotationItemDetailResponseList.reduce(
      (acc, item) => acc + (item.purchaseAmountKRW || 0),
      0
    ) || 0;

  const totalSalesAmountGlobal: number =
    quotationDetail?.quotationItemDetailResponseList.reduce(
      (acc, item) => acc + (item.salesAmountGlobal || 0),
      0
    ) || 0;

  const totalPurchaseAmountGlobal: number =
    quotationDetail?.quotationItemDetailResponseList.reduce(
      (acc, item) => acc + (item.purchaseAmountGlobal || 0),
      0
    ) || 0;

  // 총 마진 계산
  const totalMarginAmountKrw =
    (totalSalesAmountKrw ?? 0) - (totalPurchaseAmountKrw ?? 0);

  // 매출 마진 계산
  const salesMarginAmount = totalSalesAmountKrw ?? 0;

  // 매입 마진 계산
  const purchaseMarginAmount = totalPurchaseAmountKrw ?? 0;
  const purchaseMarginRate =
    purchaseMarginAmount !== 0
      ? ((totalMarginAmountKrw / purchaseMarginAmount) * 100).toFixed(2)
      : 0;

  // 할인 및 부과 비용 반영
  const discount = quotationDetail?.quotationDocumentDetail.discount || 0;
  const invChargeList = quotationDetail?.invChargeList || [];

  // 할인 반영한 금액 계산
  const discountedSalesAmountKrw = totalSalesAmountKrw * (1 - discount / 100);
  const discountedSalesAmountGlobal =
    totalSalesAmountGlobal * (1 - discount / 100);

  // 부과 비용 추가
  const totalInvChargeKrw = invChargeList.reduce(
    (acc, charge) => acc + (charge.chargePriceKRW || 0),
    0
  );
  const totalInvChargeGlobal = invChargeList.reduce(
    (acc, charge) => acc + (charge.chargePriceGlobal || 0),
    0
  );

  // 최종 계산된 금액 (할인 및 부과 비용 적용)
  const finalSalesAmountKrw = discountedSalesAmountKrw + totalInvChargeKrw;
  const finalSalesAmountGlobal =
    discountedSalesAmountGlobal + totalInvChargeGlobal;

  // 최종 마진 계산 (할인 및 부과 비용 적용)
  const finalMarginAmountKrw = finalSalesAmountKrw - totalPurchaseAmountKrw;
  const finalMarginAmountGlobal =
    finalSalesAmountGlobal - totalPurchaseAmountGlobal;

  const salesMarginRate =
    salesMarginAmount !== 0
      ? ((finalMarginAmountKrw / salesMarginAmount) * 100).toFixed(2)
      : 0;

  const totalProfitRate =
    salesMarginAmount !== 0
      ? ((finalMarginAmountKrw / totalPurchaseAmountKrw) * 100).toFixed(2)
      : 0;

  const handleEditClick = () => {
    console.log("Edit");
  };

  const handleConfirmClick = () => {
    Modal.confirm({
      title: "Confirm Quotation",
      content: "Are you sure you want to confirm this quotation?",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await confirmQutation(quotationId);
          message.success("Quotation confirmed successfully.");
          onClose();
          fetchData();
        } catch (error) {
          console.error("Error confirming the quotation:", error);
          message.error("Failed to confirm the quotation. Please try again.");
        }
      },
    });
  };

  const handleDeleteClick = () => {
    Modal.confirm({
      title: "Delete Confirmation",
      content: "Are you sure you want to delete this?",
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteQutation(quotationId);
          message.success("Deleted successfully.");
          onClose();
          fetchData();
        } catch (error) {
          console.error("Error occurred while deleting:", error);
          message.error("Failed to delete. Please try again.");
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
      title: "Sales Amount",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 130,
      render: (text: number, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        const amount = text ?? 0; // 값이 null일 경우 0으로 처리
        return `₩ ${amount?.toLocaleString()}`;
      },
    },
    {
      title: "Purchase Amount",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      width: 130,
      render: (text: number, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        const amount = text ?? 0; // 값이 null일 경우 0으로 처리
        return `₩ ${amount?.toLocaleString()}`;
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
        return typeof text === "number" ? `${text.toFixed(2)}%` : "0.00%";
      },
    },
    {
      title: "Supplier",
      dataIndex: "supplierCode",
      key: "supplierCode",
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
        <Button type="primary" key="edit" onClick={handleConfirmClick}>
          Confirm
        </Button>,
        <Button type="default" key="edit" onClick={handleEditClick}>
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
              <Descriptions.Item label="Document Manager">
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
              <Descriptions.Item label="Remark">
                {quotationDetail.quotationDocumentDetail.docRemark}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions
              className="descriptions-totals"
              layout="vertical"
              bordered
              column={4}
              size="small"
              style={{ marginTop: 10 }}
            >
              <Descriptions.Item label="Total Item">
                {totalItem}
              </Descriptions.Item>
              <Descriptions.Item label="Total Sales Amount (After Discount)">
                <AmountTotal>
                  <span>{`₩ ${finalSalesAmountKrw?.toLocaleString()}`}</span>
                  <DividerStyled
                    style={{ borderColor: "#ccc" }}
                    type="vertical"
                  />
                  <span>{`${currencySymbol} ${finalSalesAmountGlobal?.toLocaleString()}`}</span>
                </AmountTotal>
              </Descriptions.Item>
              <Descriptions.Item label="Total Purchase Amount ">
                <AmountTotal>
                  <span>{`₩ ${totalPurchaseAmountKrw?.toLocaleString()}`}</span>
                  <DividerStyled
                    style={{ borderColor: "#ccc" }}
                    type="vertical"
                  />
                  <span>{`${currencySymbol} ${totalPurchaseAmountGlobal?.toLocaleString()}`}</span>
                </AmountTotal>
              </Descriptions.Item>
              <Descriptions.Item label="Total Margin Amount">
                <AmountTotal>
                  <span>{`₩ ${finalMarginAmountKrw?.toLocaleString()}`}</span>
                  <DividerStyled
                    style={{ borderColor: "#ccc" }}
                    type="vertical"
                  />
                  <span>{`${currencySymbol} ${finalMarginAmountGlobal?.toLocaleString()}`}</span>
                </AmountTotal>
              </Descriptions.Item>
            </Descriptions>
            <Descriptions
              className="descriptions-totals-discount"
              layout="vertical"
              bordered
              column={5}
              size="small"
            >
              <Descriptions.Item label="Discount">
                {`${discount}%`}
              </Descriptions.Item>
              <Descriptions.Item label="Charges">
                {invChargeList.length > 0 ? (
                  invChargeList.map((charge) => (
                    <div key={charge.invChargeId}>
                      {`${
                        charge.customCharge
                      }: ₩ ${charge.chargePriceKRW.toLocaleString()}`}
                    </div>
                  ))
                ) : (
                  <span>No charges available</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Purchase Margin Rate">
                {`${purchaseMarginRate}%`}
              </Descriptions.Item>
              <Descriptions.Item label="Sales Margin Rate">
                {`${salesMarginRate}%`}
              </Descriptions.Item>
              <Descriptions.Item label="Total Profit Rate">
                {`${totalProfitRate}%`}
              </Descriptions.Item>
            </Descriptions>
            <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
              Item List
            </Divider>
            <TableStyled
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
