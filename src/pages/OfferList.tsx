import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button as AntButton,
  Select,
  Pagination,
  DatePicker,
  Card,
  message,
  Tag,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import {
  addSupplierFetchData,
  fetchOfferDetail,
  fetchOfferList,
  searchOfferList,
} from "../api/api";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import type { SupplierInquiryListIF } from "../types/types";
import Checkbox, { CheckboxChangeEvent } from "antd/es/checkbox";

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

const columns: ColumnsType<SupplierInquiryListIF> = [
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
  },
  {
    title: "Remark",
    dataIndex: "docRemark",
    key: "docRemark",
    sorter: (a, b) => a.docRemark.localeCompare(b.docRemark),
    sortDirections: ["ascend", "descend"],
  },
  {
    title: "REF No.",
    dataIndex: "refNumber",
    key: "refNumber",
  },
  {
    title: "Manager",
    dataIndex: "docManager",
    key: "docManager",
    sorter: (a, b) => a.docManager.localeCompare(b.docManager),
  },
  {
    title: "Document Status",
    dataIndex: "documentStatus",
    key: "documentStatus",
    render: (status) => {
      let color;
      switch (status) {
        case "INQUIRY_SENT":
          color = "cornflowerblue";
          break;
        case "WAITING_TO_SEND_QUOTATION":
          color = "blue";
          break;
        default:
          color = "steelblue";
      }
      return <Tag color={color}>{status}</Tag>;
    },
  },
];

const OfferList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SupplierInquiryListIF[]>([]);
  const [totalCount, setTotalCount] = useState<number>();
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("query");
  const [registerStartDate, setRegisterStartDate] = useState<string>("");
  const [registerEndDate, setRegisterEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [viewMyOfferOnly, setViewMyOfferOnly] = useState<boolean>(false);

  useEffect(() => {
    if (searchText) {
      handleSearch();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage]);

  const fetchData = async () => {
    try {
      const response = await fetchOfferList(
        currentPage,
        itemsPerPage,
        viewMyOfferOnly
      );
      setData(response.supplierInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      message.error("An error occurred while retrieving data:");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      // searchCategory에 해당하는 필드만 searchText를 할당
      const query = searchCategory === "query" ? searchText : "";
      const documentNumber =
        searchCategory === "documentNumber" ? searchText : "";
      const refNumber = searchCategory === "refNumber" ? searchText : "";
      const customerName = searchCategory === "customerName" ? searchText : "";

      const response = await searchOfferList(
        registerStartDate,
        registerEndDate,
        query,
        documentNumber,
        refNumber,
        customerName,
        currentPage,
        itemsPerPage,
        viewMyOfferOnly
      );

      setData(response.supplierInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      message.error("An error occurred while searching");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (record: SupplierInquiryListIF) => {
    navigate(`/makeoffer/${record.documentId}`, {
      state: { info: record, catrgory: "offer" },
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const fetchFilteredData = () => {
    setCurrentPage(1); // 페이지를 1로 초기화
    fetchData(); // 데이터 재요청
  };

  const handleViewMyOfferOnlyChange = (e: CheckboxChangeEvent) => {
    setViewMyOfferOnly(e.target.checked);
  };

  useEffect(() => {
    fetchFilteredData(); // 상태가 변경되면 데이터 재요청
  }, [viewMyOfferOnly]);

  return (
    <>
      <Container>
        <Title>견적 제안 - Offers</Title>
        <TableHeader>
          <SearchBar>
            <Select
              defaultValue="ALL"
              style={{ width: 150, marginRight: 10 }}
              onChange={(value) => setSearchCategory(value)}
            >
              <Select.Option value="query">ALL</Select.Option>
              <Select.Option value="documentNumber">Document No.</Select.Option>
              <Select.Option value="refNumber">REF No.</Select.Option>
              <Select.Option value="customerName">Costomer Name</Select.Option>
            </Select>
            <Input
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => handleSearch()}
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
            <Button
              type="primary"
              onClick={() => {
                if (currentPage === 1) {
                  handleSearch();
                } else {
                  setCurrentPage(1);
                }
              }}
            >
              Search
            </Button>
            <div style={{ marginLeft: 15 }}>
              <Checkbox onChange={handleViewMyOfferOnlyChange}>
                View My Offer Only
              </Checkbox>
            </div>
          </SearchBar>
        </TableHeader>{" "}
        {data.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
          <>
            <Table
              columns={columns}
              dataSource={data}
              pagination={false}
              loading={loading}
              rowKey="documentId"
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: "pointer" },
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
    </>
  );
};

export default OfferList;
