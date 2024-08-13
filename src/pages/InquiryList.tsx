import React, { useState, useEffect } from "react";
import { Table, Input, Button as AntButton, Select, Pagination } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { fetchInquiryList, searchInquiryList } from "../api/api";
import DetailInquiryModal from "../components/inquiryList/DetailInquiryModal";
import type { ColumnsType } from "antd/es/table";
import { Inquiry } from "../types/types";
import { useNavigate } from "react-router-dom";

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
  background-color: ${(props) => props.theme.blue};
  color: white;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${(props) => props.theme.darkBlue} !important;
  }
`;

const PaginationWrapper = styled(Pagination)`
  margin-top: 20px;
  justify-content: center;
`;

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

const useInquiryData = () => {
  const [data, setData] = useState<Inquiry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInquiryData = async () => {
    try {
      const response = await fetchInquiryList();
      setData(response.customerInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiryData();
  }, []);

  return { data, totalCount, loading };
};

const InquiryList = () => {
  const navigate = useNavigate();
  const { data, totalCount, loading } = useInquiryData();
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] =
    useState<string>("documentNumber");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(
    null
  );
  const [isDetailCompanyModalOpen, setIsDetailCompanyModalOpen] =
    useState<boolean>(false);

  useEffect(() => {
    if (isDetailCompanyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDetailCompanyModalOpen]);

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (record: Inquiry) => {
    setSelectedInquiryId(record.customerInquiryId);
    setIsDetailCompanyModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
            <Select
              defaultValue="documentNumber"
              style={{ width: 120, marginRight: 10 }}
              onChange={(value) => setSearchCategory(value)}
            >
              <Select.Option value="documentNumber">문서번호</Select.Option>
              <Select.Option value="refNumber">REF NO.</Select.Option>
              <Select.Option value="customerName">매출처</Select.Option>
            </Select>
            <Input
              placeholder="검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300, marginRight: 10 }}
            />
          </SearchBar>
          <Button
            type="primary"
            onClick={() => {
              navigate("/makeinquiry");
            }}
          >
            신규 등록
          </Button>
        </TableHeader>
        <Table
          columns={columns}
          dataSource={paginatedData}
          pagination={false}
          loading={loading}
          rowKey="customerInquiryId"
          style={{ cursor: "pointer" }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
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
      {selectedInquiryId !== null && (
        <DetailInquiryModal
          visible={isDetailCompanyModalOpen}
          onClose={() => setIsDetailCompanyModalOpen(false)}
          inquiryId={selectedInquiryId}
        />
      )}
    </>
  );
};

export default InquiryList;
