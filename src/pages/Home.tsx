import React, { useEffect, useState } from "react";
import { Table, Typography, Card, message, Divider } from "antd";
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
  top: 150px;
  margin-bottom: 200px;
`;

const CardContainer = styled.div`
  position: relative;
  display: flex;
  gap: 20px;
  padding: 20px;
  flex-wrap: wrap;
  max-width: 70vw;
  margin: 0 auto;
  align-items: flex-start;
  justify-content: center;
`;

const TableCard = styled(Card)`
  flex: 1 1 calc(50% - 20px);
  max-width: calc(33% - 20px);
  border: 1px solid #f0f0f0;
  box-sizing: border-box;
`;

const CustomTable = styled(Table)`
  .ant-table-thead {
    font-size: 12px;
  }
  .ant-table-tbody {
    font-size: 12px;
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

  useEffect(() => {
    fetchData().then((result) => setData(result));
  }, []);

  return (
    <Container>
      <CardContainer>
        <Divider style={{ borderColor: "#007bff" }}>Quotation List</Divider>
        <TableCard title="Customer Inquiries">
          <CustomTable
            size="small"
            columns={columnsCustomerInquiry}
            dataSource={data.customerInquiry.slice(0, 5)}
            pagination={false}
            rowKey="customInquiryId"
          />
        </TableCard>
        <TableCard title="Supplier Inquiries">
          <CustomTable
            size="small"
            columns={columnsSupplierInquiry}
            dataSource={data.supplierInquiry.slice(0, 5)}
            pagination={false}
            rowKey="supplierInquiryId"
          />
        </TableCard>
        <TableCard title="Quotations">
          <CustomTable
            size="small"
            columns={columnsQuotation}
            dataSource={data.quotationListByMemberId.slice(0, 5)}
            pagination={false}
            rowKey="quotationId"
          />
        </TableCard>
      </CardContainer>
    </Container>
  );
};

export default Home;
