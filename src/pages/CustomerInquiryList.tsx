import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button as AntButton,
  Select,
  Pagination,
  DatePicker,
  Checkbox,
  Tag,
  Divider,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { fetchInquiryList, searchInquiryList } from "../api/api";
import DetailInquiryModal from "../components/inquiryList/DetailInquiryModal";
import type { ColumnsType } from "antd/es/table";
import { Inquiry } from "../types/types";
import { useNavigate } from "react-router-dom";
import { CheckboxChangeEvent } from "antd/es/checkbox";

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

const StyledTag = styled(Tag)`
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
`;

const columns: ColumnsType<Inquiry> = [
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
    title: "REF No.",
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
        case "WRITING_INQUIRY":
          color = "orange";
          break;
        case "WAITING_TO_SEND_INQUIRY":
          color = "blue";
          break;
        case "INQUIRY_SENT":
          color = "cornflowerblue";
          break;
        default:
          color = "steelblue";
      }
      return <StyledTag color={color}>{status}</StyledTag>;
    },
  },
];

const CustomerInquiryList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Inquiry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [registerStartDate, setRegisterStartDate] = useState<string>("");
  const [registerEndDate, setRegisterEndDate] = useState<string>("");
  const [viewMyInquiryOnly, setViewMyInquiryOnly] = useState<boolean>(false);
  const [viewOnlySentEmails, setViewOnlySentEmails] = useState<boolean>(false);

  useEffect(() => {
    if (
      searchText ||
      registerStartDate ||
      registerEndDate ||
      viewMyInquiryOnly ||
      viewOnlySentEmails
    ) {
      handleSearch();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchInquiryList(
        currentPage,
        itemsPerPage,
        viewMyInquiryOnly,
        viewOnlySentEmails
      );
      setData(response.customerInquiryList);
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
      const response = await searchInquiryList(
        registerStartDate,
        registerEndDate,
        searchCategory === "documentNumber" ? searchText : "",
        searchCategory === "refNumber" ? searchText : "",
        searchCategory === "customerName" ? searchText : "",
        searchCategory === "vesselName" ? searchText : "",
        searchCategory === "ALL" ? searchText : "",
        currentPage,
        itemsPerPage,
        viewMyInquiryOnly,
        viewOnlySentEmails
      );

      setData(response.customerInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("검색 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (record: Inquiry) => {
    setSelectedInquiryId(record.customerInquiryId);
    setIsDetailModalOpen(true);
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

  // 체크박스의 상태 변경 처리 함수
  const handleViewMyInquiryOnlyChange = (e: CheckboxChangeEvent) => {
    setViewMyInquiryOnly(e.target.checked);
  };

  const handleViewOnlySentEmailsChange = (e: CheckboxChangeEvent) => {
    setViewOnlySentEmails(e.target.checked);
  };

  // useEffect를 사용하여 상태 변화 감지
  useEffect(() => {
    fetchFilteredData(); // 상태가 변경되면 데이터 재요청
  }, [viewMyInquiryOnly, viewOnlySentEmails]);

  return (
    <>
      <Container>
        <Title>견적 요청 - Requests</Title>
        <TableHeader>
          <SearchBar>
            <Select
              defaultValue="ALL"
              style={{ width: 140, marginRight: 10 }}
              onChange={(value) => setSearchCategory(value)}
            >
              <Select.Option value="ALL">ALL</Select.Option>
              <Select.Option value="documentNumber">Document No.</Select.Option>
              <Select.Option value="refNumber">REF No.</Select.Option>
              <Select.Option value="customerName">Costomer Name</Select.Option>
              <Select.Option value="vesselName">Vessel Name</Select.Option>
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
              <Checkbox onChange={handleViewMyInquiryOnlyChange}>
                View My Inquiry Only
              </Checkbox>
              <Checkbox
                style={{ marginLeft: 10 }}
                onChange={handleViewOnlySentEmailsChange}
              >
                View Only Sent Emails
              </Checkbox>
            </div>
          </SearchBar>
          <Button type="primary" onClick={() => navigate("/makeinquiry")}>
            New Request
          </Button>
        </TableHeader>{" "}
        <Divider />
        {data.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
          <>
            <Table
              columns={columns}
              dataSource={data}
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
      {selectedInquiryId !== null && (
        <DetailInquiryModal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          inquiryId={selectedInquiryId}
          fetchData={fetchData}
        />
      )}
    </>
  );
};

export default CustomerInquiryList;
