import React, { useState, useEffect } from "react";
import { Table, Input, Button as AntButton, Select, Pagination } from "antd";
import { SearchOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import CreateCompanyModal from "../components/company/CreateCompanyModal";
import type { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import DetailCompanyModal from "../components/company/DetailCompanyModal";
import axios from "../api/axios";
import { Customer, Inquiry } from "../types/types";
import { fetchInquiryList, inquiryDetail } from "../api/api";

const Container = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  border: 2px solid #ccc;
  border-radius: 8px;
  margin: 0 auto;
  width: 1200px;
  margin-bottom: 300px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled(AntButton)`
  background-color: #1976d2;
  color: white;
  transition: background-color 0.3s;

  &:hover {
    background-color: #1560ac !important;
  }
`;

const PaginationWrapper = styled(Pagination)`
  margin-top: 20px;
  justify-content: center;
`;

const { Option } = Select;

const InquiryList = () => {
  const [data, setData] = useState<Inquiry[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDetailCompanyModalOpen, setIsDetailCompanyModalOpen] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [inquiryNum, setInquiryNum] = useState<number>(7);

  // 데이터 FETCH
  const fetchInquiryData = async () => {
    try {
      const response = await fetchInquiryList();
      setData(response.customerInquiryList);
      setTotalCount(response.totalCount);
      setLoading(false);
    } catch (error) {
      console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
      setLoading(false);
    }
  };

  const fetchInquiryDetail = async () => {
    try {
      const response = await inquiryDetail(inquiryNum);
      console.log(response);
    } catch (error) {
      console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
    }
  };

  useEffect(() => {
    fetchInquiryData();
    fetchInquiryDetail();
  }, []);

  const columns: ColumnsType<Inquiry> = [
    {
      title: "문서번호",
      dataIndex: "documentNumber",
      key: "documentNumber",
      width: 130,
    },
    {
      title: "등록 날짜",
      dataIndex: "registerDate",
      key: "registerDate",
      sorter: (a, b) =>
        new Date(a.registerDate).getTime() - new Date(b.registerDate).getTime(),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "선적 날짜",
      dataIndex: "shippingDate",
      key: "shippingDate",
    },
    {
      title: "매출처명",
      dataIndex: "companyName",
      key: "companyName",
      sorter: (a, b) => a.companyName.localeCompare(b.companyName),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "REF NO.",
      dataIndex: "refNumber",
      key: "refNumber",
    },
    {
      title: "통화",
      dataIndex: "currencyType",
      key: "currencyType",
    },
    {
      title: "환율",
      dataIndex: "currency",
      key: "currency",
      render: (text) => `$${text.toFixed(0)}`,
    },
    {
      title: "선명",
      dataIndex: "vesselName",
      key: "vesselName",
    },
    {
      title: "비고",
      dataIndex: "remark",
      key: "remark",
    },
    {
      title: "문서 상태",
      dataIndex: "documentStatus",
      key: "documentStatus",
    },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 한 페이지에 보일 데이터
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  return (
    <>
      <Container>
        <Title>견적 관리</Title>
        <TableHeader>
          <SearchBar>
            <Select defaultValue="all" style={{ width: 120, marginRight: 10 }}>
              <Option value="all">통합검색</Option>
              <Option value="code">코드</Option>
              <Option value="companyName">상호명</Option>
            </Select>
            <Input
              placeholder="검색..."
              value={searchText}
              style={{ width: 300, marginRight: 10 }}
            />
          </SearchBar>
          <Button type="primary">신규 등록</Button>
        </TableHeader>
        <Table
          columns={columns}
          dataSource={paginatedData}
          pagination={false}
          loading={loading}
          rowKey="customerInquiryId"
          style={{ cursor: "pointer" }}
        />
        <PaginationWrapper
          current={currentPage}
          pageSize={itemsPerPage}
          total={totalCount}
          onChange={handlePageChange}
          onShowSizeChange={handlePageSizeChange}
          showSizeChanger
          pageSizeOptions={[10, 15, 30, 50, 100]}
          showQuickJumper
          itemRender={(page, type, originalElement) => {
            if (type === "prev") {
              return <LeftOutlined />;
            }
            if (type === "next") {
              return <RightOutlined />;
            }
            return originalElement;
          }}
        />
      </Container>
    </>
  );
};

export default InquiryList;
