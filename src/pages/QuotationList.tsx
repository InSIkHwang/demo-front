import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button as AntButton,
  Select,
  Pagination,
  DatePicker,
  Tag,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { fetchQuotationList, searchQutationList } from "../api/api";
import type { ColumnsType } from "antd/es/table";
import { Quotation } from "../types/types";
import { useNavigate } from "react-router-dom";
import DetailQuotationModal from "../components/quotationList/DetailQuotationModal";

const Container = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  border: 2px solid #ccc;
  border-radius: 8px;
  margin: 0 auto;
  max-width: 80vw;
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

const columns: ColumnsType<Quotation> = [
  {
    title: "Document Number",
    dataIndex: "documentNumber",
    key: "documentNumber",
    sorter: (a, b) => a.documentNumber.localeCompare(b.documentNumber),
  },
  {
    title: "Registration Date",
    dataIndex: "registerDate",
    key: "registerDate",
    sorter: (a, b) =>
      new Date(a.registerDate).getTime() - new Date(b.registerDate).getTime(),
    sortDirections: ["ascend", "descend"],
  },
  {
    title: "Costomer Name",
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
    title: "Currency",
    dataIndex: "currencyType",
    key: "currencyType",
  },
  {
    title: "Exchange Rate",
    dataIndex: "currency",
    key: "currency",
    render: (_, record) => {
      const { currency, currencyType } = record;
      switch (currencyType) {
        case "USD":
          return `$${currency?.toFixed(0)}`;
        case "EUR":
          return `€${currency?.toFixed(0)}`;
        case "INR":
          return `₹${currency?.toFixed(0)}`;
        case "JPY":
          return `¥${currency?.toFixed(0)}`;
        default:
          return `${currency?.toFixed(0)}`;
      }
    },
  },
  {
    title: "Vessel Name",
    dataIndex: "vesselName",
    key: "vesselName",
  },
  {
    title: "Remark",
    dataIndex: "remark",
    key: "remark",
  },
  {
    title: "Document Status",
    dataIndex: "documentStatus",
    key: "documentStatus",
    render: (status) => {
      let color;
      switch (status) {
        default:
          color = "cornflowerblue";
      }
      return <Tag color={color}>{status}</Tag>;
    },
  },
];

const QuotationList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Quotation[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] =
    useState<string>("documentNumber");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [registerStartDate, setRegisterStartDate] = useState<string>("");
  const [registerEndDate, setRegisterEndDate] = useState<string>("");

  useEffect(() => {
    if (searchText) {
      handleSearch();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage]);

  const fetchData = async () => {
    try {
      const response = await fetchQuotationList(currentPage, itemsPerPage);
      setData(response.quotationList);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDetailModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDetailModalOpen]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await searchQutationList(
        registerStartDate,
        registerEndDate,
        searchCategory === "documentNumber" ? searchText : "",
        searchCategory === "refNumber" ? searchText : "",
        searchCategory === "customerName" ? searchText : "",
        currentPage,
        itemsPerPage
      );

      setData(response.quotationList);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("검색 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (record: Quotation) => {
    setSelectedQuotationId(record.quotationId);
    setIsDetailModalOpen(true);
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
        <Title>최종 견적 - FInal Quotations</Title>
        <TableHeader>
          <SearchBar>
            <Select
              defaultValue="documentNumber"
              style={{ width: 140, marginRight: 10 }}
              onChange={(value) => setSearchCategory(value)}
              dropdownStyle={{ width: 200 }}
            >
              <Select.Option value="documentNumber">
                Document Number
              </Select.Option>
              <Select.Option value="refNumber">REF NO.</Select.Option>
              <Select.Option value="customerName">Costomer Name</Select.Option>
            </Select>
            <Input
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300, marginRight: 10 }}
            />
            <DatePicker
              placeholder="Start Date"
              format="YYYY-MM-DD"
              onChange={(date) =>
                setRegisterStartDate(date ? date.format("YYYY-MM-DD") : "")
              }
              style={{ marginRight: 10 }}
            />
            <DatePicker
              placeholder="End Date"
              format="YYYY-MM-DD"
              onChange={(date) =>
                setRegisterEndDate(date ? date.format("YYYY-MM-DD") : "")
              }
              style={{ marginRight: 10 }}
            />
            <Button type="primary" onClick={handleSearch}>
              Search
            </Button>
          </SearchBar>
        </TableHeader>
        {data.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
          <>
            <Table
              columns={columns}
              dataSource={data}
              pagination={false}
              loading={loading}
              rowKey="quotationId"
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
              pageSizeOptions={[30, 50, 100]}
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
          </>
        )}
      </Container>
      {selectedQuotationId !== null && (
        <DetailQuotationModal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          quotationId={selectedQuotationId}
          fetchData={fetchData}
        />
      )}
    </>
  );
};

export default QuotationList;
