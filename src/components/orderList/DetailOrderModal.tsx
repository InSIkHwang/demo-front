import React, { useEffect, useState } from "react";
import {
  Modal,
  Descriptions,
  Button,
  Table,
  Tag,
  Divider,
  message,
  DatePicker,
  Checkbox,
} from "antd";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { confirmOrder, fetchOrderDetail } from "../../api/api";
import { OrderResponse } from "../../types/types";
import dayjs from "dayjs";

interface DetailOrderModalProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
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

// 한글 날짜 파싱 함수
export const parseKoreanDate = (text: string): string | null => {
  // 모든 공백 제거 후 파싱
  const cleanText = text.replace(/\s+/g, "");

  // "희망납기일-1월24일" 또는 "희망납기일-01월24일" 형식 파싱
  const koreanDatePattern = /희망납기일[-:]+(\d{1,2})월(\d{1,2})일/;
  const match = cleanText.match(koreanDatePattern);

  if (match) {
    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");
    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }
  return null;
};

// 영문 날짜 파싱 함수
export const parseEnglishDate = (text: string): string | null => {
  // 연속된 공백을 단일 공백으로 변경
  const cleanText = text.replace(/\s+/g, " ").trim();

  // "EXPECTED DELIVERY DATE : 15 JAN 2025" 형식 파싱
  const englishDatePattern =
    /EXPECTED DELIVERY DATE\s*:?\s*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i;
  const match = cleanText.match(englishDatePattern);

  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].toUpperCase();
    const year = match[3];
    return `${year}-${getMonthNumber(month)}-${day}`;
  }
  return null;
};

// 월 이름을 숫자로 변환
export const getMonthNumber = (month: string): string => {
  const months: { [key: string]: string } = {
    JAN: "01",
    FEB: "02",
    MAR: "03",
    APR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AUG: "08",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DEC: "12",
  };
  return months[month.toUpperCase()] || "01";
};

// deliveryTime 파싱 함수
export const parseDeliveryTime = (
  deliveryTime: string | null
): string | null => {
  if (!deliveryTime) return null;

  // 연속된 공백을 단일 공백으로 변경하고 앞뒤 공백 제거
  const cleanText = deliveryTime.replace(/\s+/g, " ").trim();

  // "25 JAN 2025" 또는 "25 JAN, 2025" 형식 파싱
  const pattern = /(\d{1,2})\s+([A-Za-z]{3})[,\s]+(\d{4})/;
  const match = cleanText.match(pattern);

  if (match) {
    const day = match[1].padStart(2, "0");
    const month = getMonthNumber(match[2]);
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return null;
};

const ConfirmModalContent = ({
  isProforma,
  setIsProforma,
  confirmDates,
  setConfirmDates,
}: {
  isProforma: boolean;
  setIsProforma: (checked: boolean) => void;
  confirmDates: {
    expectedReceivingDate: string;
    deliveryDate: string;
  };
  setConfirmDates: (dates: {
    expectedReceivingDate: string;
    deliveryDate: string;
  }) => void;
}) => {
  return (
    <div style={{ marginTop: 16 }}>
      <Checkbox
        style={{
          marginBottom: 16,
          fontSize: 16,
          color: "#1890ff",
        }}
        checked={isProforma}
        onChange={(e) => setIsProforma(e.target.checked)}
      >
        Proforma Invoice
      </Checkbox>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          Expected Receiving Date.(예상 입고일)
        </div>
        <DatePicker
          style={{ width: "100%" }}
          format="YYYY-MM-DD"
          value={
            confirmDates.expectedReceivingDate
              ? dayjs(confirmDates.expectedReceivingDate)
              : null
          }
          onChange={(date) => {
            setConfirmDates({
              expectedReceivingDate: date ? date.format("YYYY-MM-DD") : "",
              deliveryDate: confirmDates.deliveryDate,
            });
          }}
          placeholder="Expected Receiving Date.(예상 입고일)"
          disabled={isProforma}
        />
      </div>
      <div>
        <div style={{ marginBottom: 8 }}>Delivery Date.(납기일)</div>
        <DatePicker
          style={{ width: "100%" }}
          format="YYYY-MM-DD"
          value={
            confirmDates.deliveryDate ? dayjs(confirmDates.deliveryDate) : null
          }
          onChange={(date) => {
            setConfirmDates({
              expectedReceivingDate: confirmDates.expectedReceivingDate,
              deliveryDate: date ? date.format("YYYY-MM-DD") : "",
            });
          }}
          placeholder="Delivery Date.(납기일)"
          disabled={isProforma}
        />
      </div>
    </div>
  );
};

const DetailOrderModal = ({
  open,
  onClose,
  orderId,
  fetchData,
}: DetailOrderModalProps) => {
  const [orderDetail, setOrderDetail] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currencySymbol, setCurrencySymbol] = useState("");
  const navigate = useNavigate();
  const [confirmDates, setConfirmDates] = useState({
    expectedReceivingDate: "",
    deliveryDate: "",
  });
  const [isProforma, setIsProforma] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // 초기 렌더링 시 데이터 조회
  useEffect(() => {
    const fetchDetails = async () => {
      if (open) {
        try {
          setOrderDetail(null);
          const data = await fetchOrderDetail(orderId);
          setOrderDetail(data);

          // 통화 타입 설정
          const currencyType = data?.documentInfo.currencyType;
          if (
            currencyType &&
            currencySymbols[currencyType as keyof typeof currencySymbols]
          ) {
            setCurrencySymbol(
              currencySymbols[currencyType as keyof typeof currencySymbols]
            );
          } else {
            setCurrencySymbol("");
          }

          // 날짜 초기값 설정
          let expectedDate = null;
          let deliveryDate = null;

          // orderSupplierRemark에서 예상 입고일 파싱
          if (
            data?.orderHeaderResponse?.orderSupplierRemark?.[0]?.orderRemark
          ) {
            const remarks =
              data.orderHeaderResponse.orderSupplierRemark[0].orderRemark.split(
                "\n"
              );
            for (const remark of remarks) {
              const koreanDate = parseKoreanDate(remark);
              const englishDate = parseEnglishDate(remark);
              if (koreanDate || englishDate) {
                expectedDate = koreanDate || englishDate;
                break;
              }
            }
          }

          // orderCustomerHeader에서 납기일 파싱
          if (data?.orderHeaderResponse?.orderCustomerHeader?.deliveryTime) {
            deliveryDate = parseDeliveryTime(
              data.orderHeaderResponse.orderCustomerHeader.deliveryTime
            );
          }

          // 날짜 상태 업데이트
          setConfirmDates({
            expectedReceivingDate: expectedDate || "",
            deliveryDate: deliveryDate || "",
          });
        } catch (error) {
          message.error("There was an error fetching the data.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDetails();
  }, [open, orderId]);

  // 총합 계산
  const totalItem = orderDetail?.itemDetailList.reduce(
    (acc, item) => (item.itemType === "ITEM" ? acc + 1 : acc),
    0
  );

  // 매출액 계산
  const totalSalesAmountKrw = orderDetail?.itemDetailList.reduce(
    (acc, item) => acc + (item.salesAmountKRW || 0),
    0
  );

  // 매입액 계산
  const totalPurchaseAmountKrw = orderDetail?.itemDetailList.reduce(
    (acc, item) => acc + (item.purchaseAmountKRW || 0),
    0
  );

  const totalSalesAmountGlobal = orderDetail?.itemDetailList.reduce(
    (acc, item) => acc + (item.salesAmountGlobal || 0),
    0
  );

  const totalPurchaseAmountGlobal = orderDetail?.itemDetailList.reduce(
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
          // await deleteQutation(orderId);
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

  // 주문 컨펌 함수
  const handleConfirmClick = () => {
    setConfirmModalVisible(true);
  };

  const handleModalConfirm = async () => {
    if (
      !isProforma &&
      (!confirmDates.expectedReceivingDate || !confirmDates.deliveryDate)
    ) {
      message.error("Please fill in all fields.(날짜를 모두 입력해주세요.)");
      return;
    }

    try {
      await confirmOrder(
        Number(orderId),
        isProforma ? "" : confirmDates.expectedReceivingDate,
        isProforma ? "" : confirmDates.deliveryDate,
        isProforma
      );
      message.success("Order confirmed successfully.");
      navigate("/orderlist");
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
    <>
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
              navigate(`/order/${orderId}`);
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
          orderDetail && (
            <>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Document Number">
                  {orderDetail.documentInfo.documentNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Registration Date">
                  {orderDetail.documentInfo.registerDate}
                </Descriptions.Item>
                <Descriptions.Item label="Customer Name">
                  {orderDetail.documentInfo.companyName}
                </Descriptions.Item>
                <Descriptions.Item label="REF NO.">
                  {orderDetail.documentInfo.refNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Currency">
                  {orderDetail.documentInfo.currencyType}
                </Descriptions.Item>
                <Descriptions.Item label="Exchange Rate">
                  {`$${orderDetail.documentInfo.currency?.toFixed(0)}`}
                </Descriptions.Item>
                <Descriptions.Item label="Vessel Name">
                  {orderDetail.documentInfo.vesselName}
                </Descriptions.Item>
                <Descriptions.Item label="Document Manager">
                  {orderDetail.documentInfo.docManager}
                </Descriptions.Item>
                <Descriptions.Item label="Document Status">
                  <TagStyled color="blue">
                    {orderDetail.documentInfo.documentStatus}
                  </TagStyled>
                </Descriptions.Item>
                <Descriptions.Item label="Remark">
                  {orderDetail.documentInfo.docRemark}
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
                dataSource={orderDetail.itemDetailList}
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
        title="Confirm Order"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onOk={handleModalConfirm}
        width={500}
        okText="Confirm"
        cancelText="Cancel"
      >
        <ConfirmModalContent
          isProforma={isProforma}
          setIsProforma={setIsProforma}
          confirmDates={confirmDates}
          setConfirmDates={setConfirmDates}
        />
      </Modal>
    </>
  );
};

export default DetailOrderModal;
