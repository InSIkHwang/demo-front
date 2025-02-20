import { useEffect, useState } from "react";
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
  fetchInvoiceDetail,
} from "../../api/api";
import { InvoiceDetailIF } from "../../types/types";

interface DetailInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: number;
  fetchData: () => Promise<void>;
}

const StyledModal = styled(Modal)`
  .ant-modal-close {
    display: none;
  }
  .ant-modal-header {
    background: #1890ff;
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
  .descriptions-totals .ant-descriptions-item-label,
  .descriptions-totals .ant-descriptions-item-content {
    text-align: center;
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

const DividerStyled = styled(Divider)`
  height: 1.5em;
`;

const TableStyled = styled(Table)`
  .ant-table-thead .ant-table-cell {
    font-size: 13px;
    text-align: center;
  }
  .ant-table-tbody {
    font-size: 13px;
  }
`;

const AmountTotal = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
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

const DetailInvoiceModal = ({
  open,
  onClose,
  invoiceId,
  fetchData,
}: DetailInvoiceModalProps) => {
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetailIF | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [currencySymbol, setCurrencySymbol] = useState("");
  const navigate = useNavigate();

  // 모달 열기 시 데이터 로드
  useEffect(() => {
    const fetchDetails = async () => {
      if (open) {
        try {
          setInvoiceDetail(null);
          const data = await fetchInvoiceDetail(invoiceId);
          setInvoiceDetail(data);
          const currencyType = invoiceDetail?.documentInfo.currencyType;
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
          message.error("There was an error fetching the data.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDetails();
  }, [open, invoiceId]);

  // 총합 계산
  const totalItem = invoiceDetail?.itemDetailList.reduce(
    (acc, item) => (item.itemType === "ITEM" ? acc + 1 : acc),
    0
  );

  const totalSalesAmountKrw = invoiceDetail?.itemDetailList.reduce(
    (acc, item) => acc + (item.salesAmountKRW || 0),
    0
  );

  const totalPurchaseAmountKrw = invoiceDetail?.itemDetailList.reduce(
    (acc, item) => acc + (item.purchaseAmountKRW || 0),
    0
  );

  const totalSalesAmountGlobal = invoiceDetail?.itemDetailList.reduce(
    (acc, item) => acc + (item.salesAmountGlobal || 0),
    0
  );

  const totalPurchaseAmountGlobal = invoiceDetail?.itemDetailList.reduce(
    (acc, item) => acc + (item.purchaseAmountGlobal || 0),
    0
  );

  // 총 마진 계산
  const totalMarginAmountKrw =
    (totalSalesAmountKrw ?? 0) - (totalPurchaseAmountKrw ?? 0);
  const totalMarginAmountGlobal =
    (totalSalesAmountGlobal ?? 0) - (totalPurchaseAmountGlobal ?? 0);

  // 매출 마진 계산
  const salesMarginAmount = totalSalesAmountKrw ?? 0;
  const salesMarginRate =
    salesMarginAmount !== 0
      ? ((totalMarginAmountKrw / salesMarginAmount) * 100).toFixed(2)
      : 0;

  // 매입 마진 계산
  const purchaseMarginAmount = totalPurchaseAmountKrw ?? 0;
  const purchaseMarginRate =
    purchaseMarginAmount !== 0
      ? ((totalMarginAmountKrw / purchaseMarginAmount) * 100).toFixed(2)
      : 0;

  // 삭제 확인 모달 함수 - API 미완
  const handleDeleteClick = () => {
    Modal.confirm({
      title: "Delete Confirmation",
      content: "Are you sure you want to delete this?",
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          // await deleteInvoice(invoiceId);
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
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      width: 100,
      render: (text: string, record: any) => {
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
        return `₩ ${amount?.toLocaleString("ko-KR")}`;
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
        return `₩ ${amount?.toLocaleString("ko-KR")}`;
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
        <Button
          type="primary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/invoice/${invoiceId}`);
          }}
        >
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
        invoiceDetail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Document Number">
                {invoiceDetail.documentInfo.invoiceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Registration Date">
                {invoiceDetail.documentInfo.registerDate}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Name">
                {invoiceDetail.documentInfo.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="REF NO.">
                {invoiceDetail.documentInfo.refNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Currency">
                {invoiceDetail.documentInfo.currencyType}
              </Descriptions.Item>
              <Descriptions.Item label="Exchange Rate">
                {`$${invoiceDetail.documentInfo.currency?.toFixed(0)}`}
              </Descriptions.Item>
              <Descriptions.Item label="Vessel Name">
                {invoiceDetail.documentInfo.vesselName}
              </Descriptions.Item>
              <Descriptions.Item label="Document Manager">
                {invoiceDetail.documentInfo.docManager}
              </Descriptions.Item>
              <Descriptions.Item label="Document Status">
                <TagStyled color="blue">
                  {invoiceDetail.documentInfo.documentStatus}
                </TagStyled>
              </Descriptions.Item>
              <Descriptions.Item label="Remark">
                {invoiceDetail.documentInfo.docRemark}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions
              className="descriptions-totals"
              layout="vertical"
              bordered
              column={7}
              size="small"
              style={{ marginTop: 10 }}
            >
              <Descriptions.Item label="Total Item">
                {totalItem}
              </Descriptions.Item>
              <Descriptions.Item label="Total Sales Amount">
                <AmountTotal>
                  <span>{`₩ ${totalSalesAmountKrw?.toLocaleString(
                    "ko-KR"
                  )}`}</span>
                  <DividerStyled
                    style={{ borderColor: "#ccc" }}
                    type="vertical"
                  />
                  <span>{`${currencySymbol} ${totalSalesAmountGlobal?.toLocaleString(
                    "en-US"
                  )}`}</span>
                </AmountTotal>
              </Descriptions.Item>
              <Descriptions.Item label="Total Purchase Amount">
                <AmountTotal>
                  <span>{`₩ ${totalPurchaseAmountKrw?.toLocaleString(
                    "ko-KR"
                  )}`}</span>
                  <DividerStyled
                    style={{ borderColor: "#ccc" }}
                    type="vertical"
                  />
                  <span>{`${currencySymbol} ${totalPurchaseAmountGlobal?.toLocaleString(
                    "en-US"
                  )}`}</span>
                </AmountTotal>
              </Descriptions.Item>
              <Descriptions.Item label="Total Margin Amount">
                <AmountTotal>
                  <span>{`₩ ${totalMarginAmountKrw?.toLocaleString(
                    "ko-KR"
                  )}`}</span>
                  <DividerStyled
                    style={{ borderColor: "#ccc" }}
                    type="vertical"
                  />
                  <span>{`${currencySymbol} ${totalMarginAmountGlobal?.toLocaleString(
                    "en-US"
                  )}`}</span>
                </AmountTotal>
              </Descriptions.Item>
              <Descriptions.Item label="Purchase Margin Rate">
                {`${purchaseMarginRate}%`}
              </Descriptions.Item>
              <Descriptions.Item label="Sales Margin Rate">
                {`${salesMarginRate}%`}
              </Descriptions.Item>
            </Descriptions>
            <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
              Item List
            </Divider>
            <TableStyled
              columns={columns}
              dataSource={invoiceDetail.itemDetailList}
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
  );
};

export default DetailInvoiceModal;
