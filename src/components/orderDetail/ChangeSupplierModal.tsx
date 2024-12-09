import { Modal, List, Card, Typography, Button, Space, message } from "antd";
import { OrderItemDetail, OrderSupplier } from "../../types/types";
import { fetchOrderSupplierInfo } from "../../api/api";
import { useState } from "react";
import styled from "styled-components";

const { Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  .ant-card-body {
    padding: 12px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &.selected {
    border-color: #1890ff;
  }
`;

const AmountDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4px;

  .ant-space {
    gap: 4px !important;
  }
`;

const ChangeSupplierModal = ({
  visible,
  onClose,
  supplierInfoList,
  setItems,
}: {
  visible: boolean;
  onClose: () => void;
  supplierInfoList: OrderSupplier[];
  setItems: (items: OrderItemDetail[]) => void;
}) => {
  const [selectedSupplier, setSelectedSupplier] =
    useState<OrderSupplier | null>(null);
  const [supplierItems, setSupplierItems] = useState<OrderItemDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSupplierInfo = async (supplier: OrderSupplier) => {
    setLoading(true);
    try {
      if (!supplier.supplierInquiryId) return;

      const response = await fetchOrderSupplierInfo(supplier.supplierInquiryId);

      setSupplierItems(response.itemDetailList);

      // 총액 계산
      const totalSales = response.itemDetailList.reduce(
        (sum: number, item: OrderItemDetail) =>
          sum + (item.salesAmountKRW || 0),
        0
      );
      const totalPurchase = response.itemDetailList.reduce(
        (sum: number, item: OrderItemDetail) =>
          sum + (item.purchaseAmountKRW || 0),
        0
      );

      return { totalSales, totalPurchase };
    } catch (error) {
      message.error("Failed to fetch supplier info");
      console.error("공급업체 정보 조회 중 오류 발생:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierSelect = async (supplier: OrderSupplier) => {
    setSelectedSupplier(supplier);
    await fetchSupplierInfo(supplier);
  };

  const handleConfirm = () => {
    if (supplierItems.length > 0) {
      setItems(supplierItems);
      onClose();
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  return (
    <Modal
      title="Change Supplier"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={!selectedSupplier || loading}
        >
          Confirm
        </Button>,
      ]}
    >
      <List
        loading={loading}
        dataSource={supplierInfoList}
        renderItem={(supplier) => {
          const isSelected =
            selectedSupplier?.supplierInquiryId === supplier.supplierInquiryId;

          return (
            <StyledCard
              className={isSelected ? "selected" : ""}
              onClick={() => handleSupplierSelect(supplier)}
            >
              <Space direction="vertical" style={{ width: "100%", gap: "4px" }}>
                <div>
                  <Text strong style={{ fontSize: "14px" }}>
                    {supplier.companyName}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ marginLeft: "8px", fontSize: "12px" }}
                  >
                    ({supplier.code})
                  </Text>
                </div>
                {isSelected && supplierItems?.length > 0 && (
                  <AmountDisplay>
                    <Space direction="vertical" size={1}>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Sales Amount :
                      </Text>
                      <Text
                        strong
                        style={{ color: "#52c41a", fontSize: "13px" }}
                      >
                        {formatAmount(
                          supplierItems.reduce(
                            (sum, item) => sum + (item.salesAmountKRW || 0),
                            0
                          )
                        )}
                      </Text>
                    </Space>
                    <Space direction="vertical" size={1}>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Purchase Amount :
                      </Text>
                      <Text
                        strong
                        style={{ color: "#1890ff", fontSize: "13px" }}
                      >
                        {formatAmount(
                          supplierItems.reduce(
                            (sum, item) => sum + (item.purchaseAmountKRW || 0),
                            0
                          )
                        )}
                      </Text>
                    </Space>
                  </AmountDisplay>
                )}
              </Space>
            </StyledCard>
          );
        }}
      />
    </Modal>
  );
};

export default ChangeSupplierModal;
