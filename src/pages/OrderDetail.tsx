import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Divider, message, Descriptions, Tag } from "antd";
import styled from "styled-components";
import dayjs, { Dayjs } from "dayjs";
import { fetchOrderDetail } from "../api/api";
import {
  InvCharge,
  Order,
  OrderItemDetail,
  OrderResponse,
  Supplier,
} from "../types/types";
// import TableComponent from "../components/order/TableComponent";
import LoadingSpinner from "../components/LoadingSpinner";
import FormComponent from "../components/orderDetail/FormComponent";

const Container = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 95vw;
  margin: 0 auto;
  margin-bottom: 200px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
`;

const OrderDetail = () => {
  const { orderId } = useParams();
  const [formValues, setFormValues] = useState<Order>();
  const [items, setItems] = useState<OrderItemDetail[]>([]);
  const [supplier, setSupplier] = useState<Supplier>();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log(orderData);

  useEffect(() => {
    const loadOrderDetail = async () => {
      try {
        const data = await fetchOrderDetail(Number(orderId));
        setOrderData(data);
        setFormValues(data.documentInfo);
        setItems(data.itemDetailList);
        setSupplier(data.suppliers[0]);
      } catch (error) {
        message.error("Failed to load order detail.");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderDetail();
  }, [orderId]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!orderData) {
    return <div>Order not found.</div>;
  }

  return (
    <Container>
      <Title>Order Detail</Title>
      {formValues && supplier && <FormComponent formValues={formValues} />}
      <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
        Order Item List
      </Divider>

      {/* <TableComponent
        items={orderData.itemDetailList}
        currency={orderData.documentInfo.currency}
      /> */}

      <Button
        type="default"
        onClick={() => navigate(-1)}
        style={{ marginTop: 20, float: "right" }}
      >
        Back
      </Button>
    </Container>
  );
};

export default OrderDetail;
