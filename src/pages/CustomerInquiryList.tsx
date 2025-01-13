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
import { useNavigate, useSearchParams } from "react-router-dom";
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
  .ant-table-column-sort {
    background-color: inherit !important;
  }
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

// 견적 요청 목록 테이블의 컬럼 정의
const columns: ColumnsType<Inquiry> = [
  {
    title: "Document Number", // 문서 번호
    dataIndex: "documentNumber",
    key: "documentNumber",
    sorter: (a, b) => {
      // 문서 번호 기준 정렬 로직
      if (!a.documentNumber && !b.documentNumber) return 0;
      if (!a.documentNumber) return 1;
      if (!b.documentNumber) return -1;
      return a.documentNumber.localeCompare(b.documentNumber);
    },
  },
  {
    title: "Registration Date", // 등록일
    dataIndex: "registerDate",
    key: "registerDate",
    sorter: (
      a,
      b // 날짜 기준 정렬
    ) =>
      new Date(a.registerDate).getTime() - new Date(b.registerDate).getTime(),
    sortDirections: ["ascend", "descend"],
  },
  {
    title: "Customer", // 고객사명
    dataIndex: "companyName",
    key: "companyName",
    sorter: (a, b) => a.companyName.localeCompare(b.companyName), // 고객사명 기준 정렬
    sortDirections: ["ascend", "descend"],
  },
  {
    title: "REF No.", // 참조 번호
    dataIndex: "refNumber",
    key: "refNumber",
  },
  {
    title: "Vessel Name", // 선박명
    dataIndex: "vesselName",
    key: "vesselName",
  },
  {
    title: "Remark", // 비고
    dataIndex: "remark",
    key: "remark",
    sorter: (a, b) => a.remark.localeCompare(b.remark), // 비고 기준 정렬
    sortDirections: ["ascend", "descend"],
  },
  {
    title: "Manager", // 담당자
    dataIndex: "docManager",
    key: "docManager",
    sorter: (a, b) => a.docManager.localeCompare(b.docManager), // 담당자 기준 정렬
  },
  {
    title: "Document Type", // 문서 유형
    dataIndex: "documentType",
    key: "documentType",
    sorter: (a, b) => a.documentType.localeCompare(b.documentType), // 문서 유형 기준 정렬
    render: (type) => {
      // 문서 유형별 태그 색상 지정
      let color;
      switch (type) {
        case "GENERAL": // 일반 문서
          color = "orange";
          break;
        case "COMPLEX": // 복합 문서
          color = "blue";
          break;
        default:
          color = "steelblue";
      }
      return <StyledTag color={color}>{type}</StyledTag>;
    },
  },
  {
    title: "Document Status", // 문서 상태
    dataIndex: "documentStatus",
    key: "documentStatus",
    sorter: (a, b) => a.documentStatus.localeCompare(b.documentStatus), // 문서 상태 기준 정렬
    sortDirections: ["ascend", "descend"],
    render: (status) => {
      // 문서 상태별 태그 색상 지정
      let color;
      switch (status) {
        case "VENDOR_PENDING": // 공급업체 대기
          color = "orange";
          break;
        case "VENDOR_SELECTED": // 공급업체 선택
          color = "blue";
          break;
        case "PRICE_PENDING": // 가격 대기
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<Inquiry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>(
    searchParams.get("searchText") || ""
  );
  const [searchCategory, setSearchCategory] = useState<string>(
    searchParams.get("searchCategory") || "ALL"
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number(searchParams.get("page")) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    Number(searchParams.get("pageSize")) || 100
  );
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [registerStartDate, setRegisterStartDate] = useState<string>(
    searchParams.get("startDate") ||
      dayjs().subtract(3, "month").format("YYYY-MM-DD")
  );
  const [registerEndDate, setRegisterEndDate] = useState<string>(
    searchParams.get("endDate") || dayjs().format("YYYY-MM-DD")
  );
  const [viewMyInquiryOnly, setViewMyInquiryOnly] = useState<boolean>(
    searchParams.get("viewMyInquiryOnly") === "true"
  );
  const [documentStatus, setDocumentStatus] = useState<string>(
    searchParams.get("documentStatus") || "ALL"
  );

  // 컴포넌트 마운트 시 검색 파라미터 존재 여부에 따라 검색 또는 데이터 조회
  useEffect(() => {
    if (searchParams.toString()) {
      handleSearch();
    } else {
      fetchData();
    }
  }, []);

  // 페이지, 페이지 크기, 내 문서만 보기, 문서 상태 변경 시 데이터 재조회
  useEffect(() => {
    if (
      (searchText && registerStartDate && registerEndDate) ||
      documentStatus !== "ALL"
    ) {
      handleSearch();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage, viewMyInquiryOnly, documentStatus]);

  // 견적 요청 목록 데이터 조회
  const fetchData = async () => {
    setLoading(true);
    updateSearchParams({
      page: currentPage,
      pageSize: itemsPerPage,
      viewMyInquiryOnly,
      documentStatus: documentStatus === "ALL" ? "" : documentStatus,
    });
    try {
      const response = await fetchInquiryList(
        currentPage,
        itemsPerPage,
        viewMyInquiryOnly,
        documentStatus === "ALL" ? "" : documentStatus
      );
      setData(response.customerInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  // 상세 모달 열림/닫힘 상태에 따른 body 스크롤 제어
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

  // URL 검색 파라미터 업데이트
  const updateSearchParams = (
    params: Record<string, string | number | boolean>
  ) => {
    const newSearchParams = new URLSearchParams(searchParams);

    Object.entries(params).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, String(value));
      }
    });

    setSearchParams(newSearchParams);
  };

  // 검색 조건에 따른 데이터 조회
  const handleSearch = async () => {
    setLoading(true);
    updateSearchParams({
      searchText,
      searchCategory,
      startDate: registerStartDate,
      endDate: registerEndDate,
      page: currentPage,
      pageSize: itemsPerPage,
      viewMyInquiryOnly,
      documentStatus: documentStatus,
    });
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
        documentStatus === "ALL" ? "" : documentStatus
      );

      setData(response.customerInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("An error occurred while searching:", error);
    } finally {
      setLoading(false);
    }
  };

  // 행 클릭 시 상세 모달 열기
  const handleRowClick = (record: Inquiry) => {
    setSelectedInquiryId(record.customerInquiryId);
    setIsDetailModalOpen(true);
  };

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateSearchParams({ page });
  };

  // 페이지 크기 변경 처리
  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    updateSearchParams({ pageSize: size, page: 1 });
  };

  // 내 문서만 보기 체크박스 상태 변경 처리
  const handleViewMyInquiryOnlyChange = (e: CheckboxChangeEvent) => {
    setViewMyInquiryOnly(e.target.checked);
    updateSearchParams({ viewMyInquiryOnly: e.target.checked });
  };

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
              <Select.Option value="customerName">Customer Name</Select.Option>
              <Select.Option value="vesselName">Vessel Name</Select.Option>
            </Select>
            <Input
              placeholder="Search..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                updateSearchParams({ searchText: e.target.value });
              }}
              onPressEnter={() => handleSearch()}
              style={{ width: 300, marginRight: 10 }}
            />
            <DatePicker
              placeholder="Start Date"
              format="YYYY-MM-DD"
              value={dayjs(registerStartDate)}
              onChange={(date) =>
                setRegisterStartDate(date ? date.format("YYYY-MM-DD") : "")
              }
              style={{ marginRight: 10 }}
            />
            <DatePicker
              placeholder="End Date"
              format="YYYY-MM-DD"
              value={dayjs(registerEndDate)}
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
              <Select
                defaultValue={documentStatus}
                style={{ width: 200, marginRight: 10 }}
                onChange={(value) => setDocumentStatus(value)}
              >
                <Select.Option value="">ALL</Select.Option>
                <Select.Option value="VENDOR_PENDING">
                  VENDOR_PENDING
                </Select.Option>
                <Select.Option value="VENDOR_SELECTED">
                  VENDOR_SELECTED
                </Select.Option>
                <Select.Option value="SENT_CUSTOMER_INQUIRY">
                  SENT_EMAIL_INQUIRY
                </Select.Option>
              </Select>
              <Checkbox
                checked={viewMyInquiryOnly}
                onChange={handleViewMyInquiryOnlyChange}
              >
                View My Inquiry Only
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
        {data?.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
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
              pageSizeOptions={[50, 100, 200]}
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
          searchParams={searchParams}
        />
      )}
    </>
  );
};

export default CustomerInquiryList;
