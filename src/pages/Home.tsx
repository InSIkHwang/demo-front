import React, { useEffect, useState } from "react";
import { Table, Card, message, Typography, Statistic, Row, Col } from "antd";
import {
  FileTextOutlined,
  ShopOutlined,
  DollarOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { fetchHome } from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";

interface CustomerInquiry {
  customInquiryId: number;
  docNumber: string;
  refNumber: string;
  remark: string;
  customerName: string;
  vesselName: string;
}

interface SupplierInquiry {
  supplierInquiryId: number;
  docNumber: string;
  refNumber: string;
  remark: string;
  supplierName: string;
}

interface Quotation {
  quotationId: number;
  docNumber: string;
  refNumber: string;
  remark: string;
  customerName: string;
}

interface HomeData {
  customerInquiry: CustomerInquiry[];
  supplierInquiry: SupplierInquiry[];
  quotationListByMemberId: Quotation[];
}

const { Title } = Typography;

const Container = styled.div`
  position: relative;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  top: 100px;
  margin-bottom: 200px;
`;

const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const StatisticCard = styled(StyledCard)`
  text-align: center;
  margin-bottom: 24px;
`;

const TableCard = styled(StyledCard)`
  margin-bottom: 24px;

  .ant-table {
    background: transparent;
  }

  .ant-table-thead > tr > th {
    background: #f8fafd;
    font-weight: 600;
  }
`;

const StyledTable = styled(Table)`
  .ant-table-tbody > tr:hover > td {
    background: #f0f5ff;
  }

  .ant-table-thead > tr > th {
    border-bottom: 2px solid #e8eef7;
  }
`;

const columnsCustomerInquiry = [
  {
    title: "Document Number",
    dataIndex: "docNumber",
    key: "docNumber",
  },
  {
    title: "Customer Name",
    dataIndex: "customerName",
    key: "customerName",
  },
  {
    title: "Vessel Name",
    dataIndex: "vesselName",
    key: "vesselName",
  },
  {
    title: "Reference Number",
    dataIndex: "refNumber",
    key: "refNumber",
  },
];

const columnsSupplierInquiry = [
  {
    title: "Document Number",
    dataIndex: "docNumber",
    key: "docNumber",
  },
  {
    title: "Reference Number",
    dataIndex: "refNumber",
    key: "refNumber",
  },
  {
    title: "Supplier Name",
    dataIndex: "supplierName",
    key: "supplierName",
  },
];

const columnsQuotation = [
  {
    title: "Document Number",
    dataIndex: "docNumber",
    key: "docNumber",
  },
  {
    title: "Reference Number",
    dataIndex: "refNumber",
    key: "refNumber",
  },
  {
    title: "Customer Name",
    dataIndex: "customerName",
    key: "customerName",
  },
  {
    title: "Remark",
    dataIndex: "remark",
    key: "remark",
  },
];

const fetchData = async (): Promise<HomeData> => {
  try {
    const data: HomeData = await fetchHome();
    return data;
  } catch (error) {
    message.error("Error fetching data");
    return {
      customerInquiry: [],
      supplierInquiry: [],
      quotationListByMemberId: [],
    };
  }
};

const Home = () => {
  const [data, setData] = useState<HomeData>({
    customerInquiry: [],
    supplierInquiry: [],
    quotationListByMemberId: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await fetchData();
        setData(result);
      } catch (error) {
        message.error("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || !data) {
    return <LoadingSpinner />;
  }

  return (
    <Container>
      <Title level={2} style={{ marginBottom: 24, color: "#1a3353" }}>
        Dashboard Overview
      </Title>
      <Row gutter={24}>
        <Col span={8}>
          <StatisticCard>
            <Statistic
              title="Customer Inquiries"
              value={data.customerInquiry.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </StatisticCard>
        </Col>
        <Col span={8}>
          <StatisticCard>
            <Statistic
              title="Supplier Inquiries"
              value={data.supplierInquiry.length}
              prefix={<ShopOutlined />}
              valueStyle={{ color: "#fc4050" }}
            />
          </StatisticCard>
        </Col>
        <Col span={8}>
          <StatisticCard>
            <Statistic
              title="Quotations"
              value={data.quotationListByMemberId.length}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </StatisticCard>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={8}>
          <TableCard title="Recent Customer Inquiries">
            <StyledTable
              columns={columnsCustomerInquiry}
              dataSource={data.customerInquiry.slice(0, 5)}
              pagination={false}
              rowKey="customInquiryId"
              size="middle"
            />
          </TableCard>
        </Col>
        <Col span={8}>
          <TableCard title="Recent Supplier Inquiries">
            <StyledTable
              columns={columnsSupplierInquiry}
              dataSource={data.supplierInquiry.slice(0, 5)}
              pagination={false}
              rowKey="supplierInquiryId"
              size="middle"
            />
          </TableCard>
        </Col>
        <Col span={8}>
          <TableCard title="Recent Quotations">
            <StyledTable
              columns={columnsQuotation}
              dataSource={data.quotationListByMemberId.slice(0, 5)}
              pagination={false}
              rowKey="quotationId"
              size="middle"
            />
          </TableCard>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
