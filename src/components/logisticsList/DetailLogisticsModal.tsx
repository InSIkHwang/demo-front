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
  confirmLogistics,
  confirmOrder,
  fetchLogisticsDetail,
} from "../../api/api";
import { LogisticsResponse } from "../../types/types";

interface DetailLogisticsModalProps {
  open: boolean;
  onClose: () => void;
  logisticsId: number;
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

const DetailLogisticsModal = ({
  open,
  onClose,
  logisticsId,
  fetchData,
}: DetailLogisticsModalProps) => {
  const [logisticsDetail, setLogisticsDetail] =
    useState<LogisticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currencySymbol, setCurrencySymbol] = useState("");
  const navigate = useNavigate();

  // 초기 렌더링 시 데이터 조회
  useEffect(() => {
    const fetchDetails = async () => {
      if (open) {
        try {
          setLogisticsDetail(null);
          const data = await fetchLogisticsDetail(logisticsId);
          setLogisticsDetail(data);
          const currencyType = logisticsDetail?.documentInfo.currencyType;
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
  }, [open, logisticsId]);

  // 총합 계산
  const totalItem = logisticsDetail?.itemDetailList.reduce(
    (acc, item) => (item.itemType === "ITEM" ? acc + 1 : acc),
    0
  );

  // 매출액 계산
  const totalSalesAmountKrw = logisticsDetail?.itemDetailList.reduce(
    (acc, item) => acc + (item.salesAmountKRW || 0),
    0
  );

  // 매입액 계산
  const totalPurchaseAmountKrw = logisticsDetail?.itemDetailList.reduce(
    (acc, item) => acc + (item.purchaseAmountKRW || 0),
    0
  );

  const totalSalesAmountGlobal = logisticsDetail?.itemDetailList.reduce(
    (acc, item) => acc + (item.salesAmountGlobal || 0),
    0
  );

  const totalPurchaseAmountGlobal = logisticsDetail?.itemDetailList.reduce(
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

  // 삭제 확인 모달 핸들러
  const handleDeleteClick = () => {
    Modal.confirm({
      title: "Delete Confirmation",
      content: "Are you sure you want to delete this?",
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          // await deleteQutation(logisticsId);
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

  // 확정 핸들러
  const handleConfirmClick = async () => {
    try {
      await confirmLogistics(logisticsId);
      message.success("Confirmed successfully.");
      onClose();
      fetchData();
    } catch (error) {
      console.error("Error occurred while confirming:", error);
      message.error("Failed to confirm. Please try again.");
    }
  };

  // 테이블 열 정의
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
        return record.supplier?.companyName;
      },
    },
  ];

  return (
    <StyledModal
      title="Info"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="confirm" type="primary" onClick={handleConfirmClick}>
          Confirm
        </Button>,
        <Button
          type="primary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/logistics/${logisticsId}`);
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
        logisticsDetail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Document Number">
                {logisticsDetail.documentInfo.documentNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Registration Date">
                {logisticsDetail.documentInfo.registerDate}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Name">
                {logisticsDetail.documentInfo.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="REF NO.">
                {logisticsDetail.documentInfo.refNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Currency">
                {logisticsDetail.documentInfo.currencyType}
              </Descriptions.Item>
              <Descriptions.Item label="Exchange Rate">
                {`$${logisticsDetail.documentInfo.currency?.toFixed(0)}`}
              </Descriptions.Item>
              <Descriptions.Item label="Vessel Name">
                {logisticsDetail.documentInfo.vesselName}
              </Descriptions.Item>
              <Descriptions.Item label="Document Manager">
                {logisticsDetail.documentInfo.docManager}
              </Descriptions.Item>
              <Descriptions.Item label="Document Status">
                <TagStyled color="blue">
                  {logisticsDetail.documentInfo.documentStatus}
                </TagStyled>
              </Descriptions.Item>
              <Descriptions.Item label="Remark">
                {logisticsDetail.documentInfo.docRemark}
              </Descriptions.Item>
              <Descriptions.Item label="Forwarder">
                {logisticsDetail.documentInfo.forwarder}
              </Descriptions.Item>
              <Descriptions.Item label="Loc">
                {logisticsDetail.documentInfo.loc}
              </Descriptions.Item>
              <Descriptions.Item label="Packing Details">
                {logisticsDetail.documentInfo.packingDetails}
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
              <Descriptions.Item label="Delivery Date(납기일)">
                {logisticsDetail?.logisticsDate?.deliveryDate}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Receiving Date(예정 입고일)">
                {logisticsDetail?.logisticsDate?.expectedReceivingDate}
              </Descriptions.Item>
              <Descriptions.Item label="Receiving Date(입고일)">
                {logisticsDetail?.logisticsDate?.receivingDate}
              </Descriptions.Item>
              <Descriptions.Item label="Shipping Date(출고일)">
                {logisticsDetail?.logisticsDate?.shippingDate}
              </Descriptions.Item>
            </Descriptions>
            <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
              Item List
            </Divider>
            <TableStyled
              columns={columns}
              dataSource={logisticsDetail.itemDetailList}
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

export default DetailLogisticsModal;
