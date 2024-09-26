import React, { useEffect, useState } from "react";
import { Table, Typography, Card, message } from "antd";
import styled from "styled-components";
import { fetchHome } from "../api/api";

const { Title } = Typography;

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

const Container = styled.div`
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  gap: 20px;
  padding: 20px;
  flex-direction: column;
  align-items: center;
  top: 150px;
  margin-bottom: 200px;
`;

const TableCard = styled(Card)`
  width: 100%;
  max-width: 1200px;
  flex: 1;
  border: 1px solid #f0f0f0;
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
    title: "Customer Name",
    dataIndex: "customerName",
    key: "customerName",
  },
  {
    title: "Reference Number",
    dataIndex: "refNumber",
    key: "refNumber",
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

  useEffect(() => {
    fetchData().then((result) => setData(result));
  }, []);

  return (
    <Container>
      <TableCard title="Customer Inquiries">
        <Table
          columns={columnsCustomerInquiry}
          dataSource={data.customerInquiry.slice(0, 5)}
          pagination={false}
          rowKey="customInquiryId"
        />
      </TableCard>

      <TableCard title="Supplier Inquiries">
        <Table
          columns={columnsSupplierInquiry}
          dataSource={data.supplierInquiry.slice(0, 5)}
          pagination={false}
          rowKey="supplierInquiryId"
        />
      </TableCard>

      <TableCard title="Quotations">
        <Table
          columns={columnsQuotation}
          dataSource={data.quotationListByMemberId.slice(0, 5)}
          pagination={false}
          rowKey="quotationId"
        />
      </TableCard>
    </Container>
  );
};

export default Home;
