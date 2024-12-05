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
import type { ColumnsType, TableProps } from "antd/es/table";
import { Inquiry } from "../types/types";
import { useNavigate } from "react-router-dom";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import dayjs from "dayjs";

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

const StyledTable = styled(Table)<{ color?: string } & TableProps<Inquiry>>`
  .ant-table-tbody {
    tr {
      // complex-row 스타일을 custom-color-row보다 나중에 선언
      &.custom-color-row {
        background-color: var(--row-color) !important;

        &:hover > td {
          background-color: var(--row-hover-color) !important;
          filter: brightness(0.95) !important;
        }
      }

      &.complex-row {
        background-color: #f5fff0 !important;

        &:hover > td {
          background-color: #e5f7d3 !important;
        }
      }

      // complex-row가 custom-color-row보다 우선하도록 추가
      &.complex-row.custom-color-row {
        background-color: #f5fff0 !important;

        &:hover > td {
          background-color: #e5f7d3 !important;
        }
      }
    }
  }
`;

const TableHeader = styled.div`
  margin-bottom: 20px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
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

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid #f0f0f0;
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
    title: "Costomer",
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
    title: "Manager",
    dataIndex: "docManager",
    key: "docManager",
    sorter: (a, b) => a.docManager.localeCompare(b.docManager),
  },
  {
    title: "Document Type",
    dataIndex: "documentType",
    key: "documentType",
    sorter: (a, b) => a.documentType.localeCompare(b.documentType),
    render: (type) => {
      let color;
      switch (type) {
        case "GENERAL":
          color = "orange";
          break;
        case "COMPLEX":
          color = "blue";
          break;
        default:
          color = "steelblue";
      }
      return <StyledTag color={color}>{type}</StyledTag>;
    },
  },
  {
    title: "Document Status",
    dataIndex: "documentStatus",
    key: "documentStatus",
    render: (status) => {
      let color;
      switch (status) {
        case "VENDOR_PENDING":
          color = "orange";
          break;
        case "VENDOR_SELECTED":
          color = "blue";
          break;
        case "PRICE_PENDING":
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
  const [registerStartDate, setRegisterStartDate] = useState<string>(
    dayjs().subtract(1, "month").format("YYYY-MM-DD")
  );
  const [registerEndDate, setRegisterEndDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );
  const [viewMyInquiryOnly, setViewMyInquiryOnly] = useState<boolean>(false);
  const [viewOnlySentEmails, setViewOnlySentEmails] = useState<boolean>(false);

  useEffect(() => {
    if (searchText && registerStartDate && registerEndDate) {
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
              defaultValue={dayjs().subtract(1, "month")}
              onChange={(date) =>
                setRegisterStartDate(date ? date.format("YYYY-MM-DD") : "")
              }
              style={{ marginRight: 10 }}
            />
            <DatePicker
              placeholder="End Date"
              format="YYYY-MM-DD"
              defaultValue={dayjs()}
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
            <CheckboxWrapper>
              <Checkbox onChange={handleViewMyInquiryOnlyChange}>
                View My Inquiry Only
              </Checkbox>
              <Checkbox
                style={{ marginLeft: 10 }}
                onChange={handleViewOnlySentEmailsChange}
              >
                View Only Sent Emails
              </Checkbox>
            </CheckboxWrapper>
          </SearchBar>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              onClick={() => navigate("/makecomplexinquiry")}
              style={{ marginRight: 10 }}
            >
              New Complex Request
            </Button>
            <Button type="primary" onClick={() => navigate("/makeinquiry")}>
              New Request
            </Button>
          </div>
        </TableHeader>{" "}
        <Divider />
        {data.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
          <>
            <StyledTable
              columns={columns}
              dataSource={data}
              pagination={false}
              loading={loading}
              rowKey="customerInquiryId"
              style={{ cursor: "pointer" }}
              onRow={(record) => {
                const rowProps = {
                  onClick: () => handleRowClick(record),
                  style: {
                    cursor: "pointer",
                    // CSS 변수로 색상 설정
                    ...(record.color && {
                      "--row-color": record.color,
                      "--row-hover-color": record.color, // hover 색상도 같이 설정
                    }),
                  } as React.CSSProperties,
                  className: `${
                    record.documentType === "COMPLEX" ? "complex-row" : ""
                  } ${record.color ? "custom-color-row" : ""}`,
                };

                return {
                  ...rowProps,
                };
              }}
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
          documentType={
            data.find((item) => item.customerInquiryId === selectedInquiryId)
              ?.documentType || "GENERAL"
          }
          onClose={() => setIsDetailModalOpen(false)}
          inquiryId={selectedInquiryId}
          fetchData={fetchData}
        />
      )}
    </>
  );
};

export default CustomerInquiryList;
