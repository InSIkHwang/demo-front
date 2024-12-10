import {
  Modal,
  List,
  Card,
  Typography,
  Button,
  Space,
  message,
  Spin,
  Row,
  Col,
} from "antd";
import { OrderItemDetail, OrderSupplier } from "../../types/types";
import { fetchOrderSupplierInfo } from "../../api/api";
import { useState, useEffect } from "react";
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

  &.selected {
    border-color: #1890ff;
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
  const [supplierData, setSupplierData] = useState<{
    [key: string]: { items: any[]; totals: any };
  }>({});
  const [loading, setLoading] = useState<boolean>(true);

  // 모달이 열릴 때 모든 공급처의 데이터를 미리 로드
  useEffect(() => {
    if (visible) {
      const fetchAllSupplierData = async () => {
        setLoading(true);
        const data: {
          [key: string]: { items: any[]; totals: any };
        } = {};

        try {
          await Promise.all(
            supplierInfoList.map(async (supplier) => {
              if (!supplier.supplierInquiryId) return;

              const response = await fetchOrderSupplierInfo(
                supplier.supplierInquiryId
              );
              const items = response.itemDetailList;

              // 총액 계산
              const totals = {
                salesKRW: items.reduce(
                  (sum: number, item: any) => sum + (item.salesAmountKRW || 0),
                  0
                ),
                purchaseKRW: items.reduce(
                  (sum: number, item: any) =>
                    sum + (item.purchaseAmountKRW || 0),
                  0
                ),
                salesGlobal: items.reduce(
                  (sum: number, item: any) =>
                    sum + (item.salesAmountGlobal || 0),
                  0
                ),
                purchaseGlobal: items.reduce(
                  (sum: number, item: any) =>
                    sum + (item.purchaseAmountGlobal || 0),
                  0
                ),
              };

              data[supplier.supplierInquiryId] = { items, totals };
            })
          );

          setSupplierData(data);
        } catch (error) {
          message.error("Error loading supplier data");
          console.error("Error loading supplier data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchAllSupplierData();
    }
  }, [visible, supplierInfoList]);

  const handleSupplierSelect = (supplier: OrderSupplier) => {
    setSelectedSupplier(supplier);
  };

  const handleConfirm = () => {
    if (
      selectedSupplier?.supplierInquiryId &&
      supplierData[selectedSupplier.supplierInquiryId]
    ) {
      const formattedItems = supplierData[
        selectedSupplier.supplierInquiryId
      ].items.map((item) => ({
        ordersItemId: null,
        itemType: item.inquiryItemType,
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemRemark: item.itemRemark,
        qty: item.qty,
        position: item.position,
        unit: item.unit,
        indexNo: item.indexNo,
        salesPriceKRW: item.salesPriceKRW,
        salesPriceGlobal: item.salesPriceGlobal,
        salesAmountKRW: item.salesAmountKRW,
        salesAmountGlobal: item.salesAmountGlobal,
        margin: item.margin,
        purchasePriceKRW: item.purchasePriceKRW,
        purchasePriceGlobal: item.purchasePriceGlobal,
        purchaseAmountKRW: item.purchaseAmountKRW,
        purchaseAmountGlobal: item.purchaseAmountGlobal,
      }));

      setItems(formattedItems);
      onClose();
    }
  };

  const formatAmount = (amount: number, isGlobal: boolean = false) => {
    return new Intl.NumberFormat(isGlobal ? "en-US" : "ko-KR", {
      style: "currency",
      currency: isGlobal ? "USD" : "KRW",
      maximumFractionDigits: isGlobal ? 2 : 0,
    }).format(amount);
  };

  return (
    <Modal
      title="Change Supplier"
      open={visible}
      onCancel={onClose}
      width={800}
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
      <Spin spinning={loading}>
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={supplierInfoList}
          renderItem={(supplier) => {
            const isSelected =
              selectedSupplier?.supplierInquiryId ===
              supplier.supplierInquiryId;
            const data = supplierData[supplier.supplierInquiryId || ""];

            return (
              <List.Item>
                <StyledCard
                  className={isSelected ? "selected" : ""}
                  onClick={() => handleSupplierSelect(supplier)}
                  hoverable
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <Text strong>{supplier.companyName}</Text>
                      <Text type="secondary">{supplier.code}</Text>
                    </div>
                    {data && (
                      <Space
                        direction="vertical"
                        size="small"
                        style={{ width: "100%" }}
                      >
                        <Row justify="space-between">
                          <Col>
                            <Text type="secondary">Sales:</Text>
                          </Col>
                          <Col>
                            <Text strong style={{ color: "#52c41a" }}>
                              {formatAmount(data.totals.salesKRW)}
                            </Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              (F {formatAmount(data.totals.salesGlobal, true)})
                            </Text>
                          </Col>
                        </Row>
                        <Row justify="space-between">
                          <Col>
                            <Text type="secondary">Purchase:</Text>
                          </Col>
                          <Col>
                            <Text strong style={{ color: "#1890ff" }}>
                              {formatAmount(data.totals.purchaseKRW)}
                            </Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              (F{" "}
                              {formatAmount(data.totals.purchaseGlobal, true)})
                            </Text>
                          </Col>
                        </Row>
                      </Space>
                    )}
                  </Space>
                </StyledCard>
              </List.Item>
            );
          }}
        />
      </Spin>
    </Modal>
  );
};

export default ChangeSupplierModal;
