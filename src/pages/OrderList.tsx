import { useState, useEffect } from "react";
import {
  Table,
  Button as AntButton,
  Pagination,
  Tag,
  Empty,
  Divider,
  message,
  Select,
  Input,
  DatePicker,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { fetchOrderList, searchOrderList } from "../api/api";
import type { ColumnsType } from "antd/es/table";
import { OfferSearchParams, Order, orderAllResponses } from "../types/types";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import DetailOrderModal from "../components/orderList/DetailOrderModal";
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
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #e6e6e6;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: #1890ff;
    box-shadow: 0 2px 0 0 rgba(24, 144, 255, 0.1);
  }
`;

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid #f0f0f0;
`;

// Select, Input, DatePicker 등의 공통 스타일
const commonInputStyles = {
  borderRadius: "4px",
  height: "32px",
};

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

const columns: ColumnsType<Order> = [
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
    title: "Customer",
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
    title: "Vessel Name",
    dataIndex: "vesselName",
    key: "vesselName",
  },
  {
    title: "Remark",
    dataIndex: "docRemark",
    key: "docRemark",
  },
  {
    title: "Document Manager",
    dataIndex: "docManager",
    key: "docManager",
  },
  {
    title: "Document Status",
    dataIndex: "documentStatus",
    key: "documentStatus",
    render: (status) => {
      let color;
      switch (status) {
        case "QUOTATION_CONFIRM":
          color = "tomato";
          break;
        default:
          color = "cornflowerblue";
      }
      return <StyledTag color={color}>{status}</StyledTag>;
    },
  },
];

const OrderList = () => {
  const [data, setData] = useState<Order[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>(
    searchParams.get("searchText") || ""
  );
  const [searchCategory, setSearchCategory] = useState<string>(
    searchParams.get("searchCategory") || "documentNumber"
  );
  const [searchSubCategory, setSearchSubCategory] = useState<string>(
    searchParams.get("searchSubCategory") || "itemName"
  );
  const [searchSubText, setSearchSubText] = useState<string>(
    searchParams.get("searchSubText") || ""
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number(searchParams.get("page")) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    Number(searchParams.get("pageSize")) || 100
  );
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [registerStartDate, setRegisterStartDate] = useState<string>(
    searchParams.get("startDate") ||
      dayjs().subtract(3, "month").format("YYYY-MM-DD")
  );
  const [registerEndDate, setRegisterEndDate] = useState<string>(
    searchParams.get("endDate") || dayjs().format("YYYY-MM-DD")
  );
  const [viewMyOfferOnly, setViewMyOfferOnly] = useState<boolean>(
    searchParams.get("viewMyOfferOnly") === "true"
  );
  const [showItemSearch, setShowItemSearch] = useState<boolean>(
    searchParams.get("showItemSearch") === "true"
  );

  // 초기 렌더링 시 파라미터가 있으면 검색, 없으면 데이터 조회
  useEffect(() => {
    if (searchParams.toString()) {
      handleSearch();
    } else {
      fetchData();
    }
  }, []);

  // 페이지 변경 또는 옵션 변경 시 검색 또는 데이터 조회
  useEffect(() => {
    if ((searchText || searchSubText) && registerStartDate && registerEndDate) {
      handleSearch();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage, viewMyOfferOnly, showItemSearch]);

  // 데이터 조회 함수
  const fetchData = async () => {
    setLoading(true);
    updateSearchParams({
      page: currentPage,
      pageSize: itemsPerPage,
      viewMyOfferOnly,
    });
    try {
      const response = await fetchOrderList(
        currentPage,
        itemsPerPage,
        viewMyOfferOnly
      );
      setData(response.orderList);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("OrderList fetchData error", error);
    } finally {
      setLoading(false);
    }
  };

  // 모달 열기/닫기 시 스크롤 제어
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

  // 검색 파라미터 업데이트 함수
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

  // 검색 함수
  const handleSearch = async () => {
    setLoading(true);
    updateSearchParams({
      searchText,
      searchCategory,
      startDate: registerStartDate,
      endDate: registerEndDate,
      page: currentPage,
      pageSize: itemsPerPage,
      writer: viewMyOfferOnly ? "MY" : ("ALL" as const),
    });
    try {
      const searchParams: OfferSearchParams = {
        registerStartDate,
        registerEndDate,
        ...(searchCategory === "query" && { query: searchText }),
        ...(searchCategory === "documentNumber" && {
          documentNumber: searchText,
        }),
        ...(searchCategory === "refNumber" && { refNumber: searchText }),
        ...(searchCategory === "customerName" && { customerName: searchText }),
        ...(searchCategory === "supplierName" && { supplierName: searchText }),
        ...(searchCategory === "vesselName" && { vesselName: searchText }),
        page: currentPage,
        pageSize: itemsPerPage,
        writer: viewMyOfferOnly ? "MY" : ("ALL" as const),
        ...(showItemSearch && {
          [searchSubCategory]: searchSubText,
        }),
      };

      const response = await searchOrderList(searchParams);

      setData(response.orderList);
      setTotalCount(response.totalCount);
    } catch (error) {
      message.error("Error occurred while searching");
    } finally {
      setLoading(false);
    }
  };

  // 내 문서만 보기 체크 핸들러
  const handleViewMyOfferOnlyChange = (e: CheckboxChangeEvent) => {
    setViewMyOfferOnly(e.target.checked);
    updateSearchParams({ viewMyOfferOnly: e.target.checked });
  };

  // 아이템 검색 옵션 토글 핸들러
  const handleItemSearchToggle = (e: CheckboxChangeEvent) => {
    setShowItemSearch(e.target.checked);
    if (!e.target.checked) {
      setSearchSubCategory("");
      setSearchSubText("");
      updateSearchParams({ showItemSearch: false });
    } else {
      updateSearchParams({ showItemSearch: true });
    }
  };

  // 행 클릭 시 모달 열기
  const handleRowClick = (record: Order) => {
    setSelectedOrderId(record.orderId ?? null);
    setIsDetailModalOpen(true);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateSearchParams({ page });
  };

  // 페이지 사이즈 변경 핸들러
  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    updateSearchParams({ pageSize: size, page: 1 });
  };

  return (
    <>
      <Container>
        <Title>수주 / 발주 - Orders</Title>
        <TableHeader>
          <SearchBar>
            <SearchSection>
              <Select
                defaultValue="ALL"
                style={{ ...commonInputStyles, width: 140 }}
                onChange={(value) => setSearchCategory(value)}
              >
                <Select.Option value="query">ALL</Select.Option>
                <Select.Option value="documentNumber">
                  Document No.
                </Select.Option>
                <Select.Option value="refNumber">REF No.</Select.Option>
                <Select.Option value="customerName">
                  Customer Name
                </Select.Option>
                <Select.Option value="supplierName">
                  Supplier Name
                </Select.Option>
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
                style={{ ...commonInputStyles, width: 280 }}
              />
              <DatePicker
                placeholder="Start Date"
                format="YYYY-MM-DD"
                value={dayjs(registerStartDate)}
                onChange={(date) =>
                  setRegisterStartDate(date ? date.format("YYYY-MM-DD") : "")
                }
                style={commonInputStyles}
              />
              <DatePicker
                placeholder="End Date"
                format="YYYY-MM-DD"
                value={dayjs(registerEndDate)}
                onChange={(date) =>
                  setRegisterEndDate(date ? date.format("YYYY-MM-DD") : "")
                }
                style={commonInputStyles}
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
            </SearchSection>
            <CheckboxWrapper>
              <Checkbox
                checked={viewMyOfferOnly}
                onChange={handleViewMyOfferOnlyChange}
              >
                View My Offer Only
              </Checkbox>
            </CheckboxWrapper>
          </SearchBar>
          <SearchBar>
            <SearchSection>
              <Checkbox
                checked={showItemSearch}
                onChange={handleItemSearchToggle}
              >
                Item Search Option
              </Checkbox>
              {showItemSearch && (
                <>
                  <Select
                    defaultValue="Item Name"
                    style={{ ...commonInputStyles, width: 140 }}
                    onChange={(value) => setSearchSubCategory(value)}
                  >
                    <Select.Option value="itemName">Item Name</Select.Option>
                    <Select.Option value="itemCode">Item Code</Select.Option>
                  </Select>
                  <Input
                    placeholder="Search items..."
                    value={searchSubText}
                    onChange={(e) => {
                      setSearchSubText(e.target.value);
                      updateSearchParams({ searchSubText: e.target.value });
                    }}
                    onPressEnter={() => handleSearch()}
                    style={{ ...commonInputStyles, width: 280 }}
                  />
                </>
              )}
            </SearchSection>
          </SearchBar>
        </TableHeader>
        <Divider />
        {data?.length > 0 ? ( // 데이터가 있을 때만 페이지네이션을 표시
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
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Container>
      {selectedOrderId !== null && (
        <DetailOrderModal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          orderId={selectedOrderId}
          fetchData={fetchData}
        />
      )}
    </>
  );
};

export default OrderList;
