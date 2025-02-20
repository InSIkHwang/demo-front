import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Select,
  Pagination,
  DatePicker,
  message,
  Tag,
  Divider,
  Tooltip,
  Modal,
} from "antd";
import { LeftOutlined, RightOutlined, DeleteOutlined } from "@ant-design/icons";
import styled from "styled-components";
import {
  changeOfferStatus,
  confirmQutation,
  deleteOffer,
  deleteSupplierInquiry,
  fetchOfferList,
  searchOfferList,
} from "../api/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ColumnsType, TableProps } from "antd/es/table";
import type { OfferSearchParams, SupplierInquiryListIF } from "../types/types";
import Checkbox, { CheckboxChangeEvent } from "antd/es/checkbox";
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

const StyledTable = styled(Table)<
  { color?: string } & TableProps<SupplierInquiryListIF>
>`
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

const SupplierPreviewCard = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  box-sizing: border-box;
  flex-wrap: wrap;
`;

const Card = styled.div`
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 280px;

  .supplier-name {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px dotted #e6e6e6;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;

    .label {
      color: #666;
    }
  }
`;

const SupplierCode = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
`;
const SupplierName = styled.span`
  color: #666;
  font-size: 12px;
  font-weight: 500;
`;

const Value = styled.span<{ $isZero: boolean }>`
  font-weight: 500;
  color: ${({ $isZero }) =>
    $isZero ? "red" : "inherit"}; // 값이 0일 경우 빨간색
`;

const EditButton = styled(Button)`
  margin-top: 12px;
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

const SearchTag = styled(Tag)`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  margin: 0;
`;

interface SearchTagIF {
  category: string;
  value: string;
}

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
    title: "Customer",
    dataIndex: "companyName",
    key: "companyName",
  },
  {
    title: "REF No.",
    dataIndex: "refNumber",
    key: "refNumber",
  },
  {
    title: "Vessel",
    dataIndex: "vesselName",
    key: "vesselName",
  },
  {
    title: "Remark",
    dataIndex: "docRemark",
    key: "docRemark",
    sorter: (a, b) => a.docRemark.localeCompare(b.docRemark),
    sortDirections: ["ascend", "descend"],
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
      return type ? <StyledTag color={color}>{type}</StyledTag> : null;
    },
  },
  {
    title: "Document Status",
    dataIndex: "documentStatus",
    key: "documentStatus",
    sorter: (a, b) => a.documentStatus.localeCompare(b.documentStatus),
    sortDirections: ["ascend", "descend"],
    render: (status) => {
      let color;
      switch (status) {
        case "PRICE_PENDING":
          color = "blue";
          break;
        case "PRICE_ENTERED":
          color = "steelblue";
          break;
        default:
          color = "cornflowerblue";
      }
      return <StyledTag color={color}>{status}</StyledTag>;
    },
  },
];

const OfferList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<SupplierInquiryListIF[]>([]);
  const [totalCount, setTotalCount] = useState<number>();
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>(
    searchParams.get("searchText") || ""
  );
  const [searchCategory, setSearchCategory] = useState<string>(
    searchParams.get("searchCategory") || "query"
  );
  const [searchSubCategory, setSearchSubCategory] = useState<string>(
    searchParams.get("searchSubCategory") || "itemName"
  );
  const [searchSubText, setSearchSubText] = useState<string>(
    searchParams.get("searchSubText") || ""
  );
  const [registerStartDate, setRegisterStartDate] = useState<string>(
    searchParams.get("startDate") ||
      dayjs().subtract(3, "month").format("YYYY-MM-DD")
  );
  const [registerEndDate, setRegisterEndDate] = useState<string>(
    searchParams.get("endDate") || dayjs().format("YYYY-MM-DD")
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number(searchParams.get("page")) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    Number(searchParams.get("pageSize")) || 100
  );
  const [viewMyOfferOnly, setViewMyOfferOnly] = useState<boolean>(
    searchParams.get("viewMyOfferOnly") === "true"
  );
  const [showItemSearch, setShowItemSearch] = useState<boolean>(
    searchParams.get("showItemSearch") === "true"
  );
  const [viewDocumentStatus, setViewDocumentStatus] = useState<string>(
    searchParams.get("viewDocumentStatus") || "ALL"
  );
  const [searchTags, setSearchTags] = useState<SearchTagIF[]>(() => {
    const tags: SearchTagIF[] = [];
    const searchCategories = [
      "documentNumber",
      "refNumber",
      "customerName",
      "supplierName",
      "vesselName",
    ];

    searchCategories.forEach((category) => {
      const value = searchParams.get(category);
      if (value) {
        tags.push({ category, value });
      }
    });

    return tags;
  });

  // 데이터 로드
  useEffect(() => {
    if (
      // 검색 조건이 있는 경우
      ((searchText || searchSubText || searchTags.length > 0) &&
        registerStartDate &&
        registerEndDate) ||
      viewDocumentStatus !== "ALL"
    ) {
      handleSearch();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage, viewMyOfferOnly, viewDocumentStatus]);

  // 데이터 로드 함수
  const fetchData = async () => {
    updateSearchParams({
      page: currentPage,
      pageSize: itemsPerPage,
      viewMyOfferOnly,
      viewDocumentStatus:
        viewDocumentStatus === "ALL" ? "" : viewDocumentStatus,
    });
    try {
      const response = await fetchOfferList(
        currentPage,
        itemsPerPage,
        viewMyOfferOnly,
        viewDocumentStatus === "ALL" ? "" : viewDocumentStatus
      );
      setData(response.supplierInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      message.error("An error occurred while retrieving data:");
    } finally {
      setLoading(false);
    }
  };

  // 검색 함수
  const handleSearch = async () => {
    setLoading(true);

    if (searchTags.length > 0 && searchCategory === "query") {
      message.error(
        "if Tags are added, you cannot search with ALL.\n(태그가 있는 경우 ALL 카테고리로 검색할 수 없습니다.)"
      );
      setLoading(false);
      return;
    }

    // URL 파라미터 업데이트
    updateSearchParams({
      searchText,
      searchCategory,
      searchSubCategory,
      searchSubText,
      startDate: registerStartDate,
      endDate: registerEndDate,
      page: currentPage,
      pageSize: itemsPerPage,
      viewMyOfferOnly,
      showItemSearch,
      viewDocumentStatus,
    });

    try {
      const searchParams: OfferSearchParams = {
        registerStartDate,
        registerEndDate,
        page: currentPage,
        pageSize: itemsPerPage,
        writer: viewMyOfferOnly ? "MY" : "ALL",
        ...(showItemSearch && {
          [searchSubCategory]: searchSubText,
        }),
        ...(viewDocumentStatus !== "ALL" && {
          documentStatus: viewDocumentStatus,
        }),
      };

      // 태그 추가
      searchTags.forEach((tag) => {
        searchParams[tag.category] = tag.value;
      });

      if (searchText.trim()) {
        if (searchCategory === "query") {
          searchParams.query = searchText.trim();
        } else {
          searchParams[searchCategory] = searchText.trim();
        }
      }

      const response = await searchOfferList(searchParams);
      setData(response.supplierInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      message.error("An error occurred while searching");
    } finally {
      setLoading(false);
    }
  };

  // 아이템 검색 토글 함수
  const handleItemSearchToggle = (e: CheckboxChangeEvent) => {
    setShowItemSearch(e.target.checked);
    if (!e.target.checked) {
      setSearchSubCategory("");
      setSearchSubText("");
      updateSearchParams({
        showItemSearch: false,
        searchSubCategory: "",
        searchSubText: "",
      });
    } else {
      updateSearchParams({ showItemSearch: true });
    }
  };

  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateSearchParams({ page });
  };

  // 페이지 크기 변경 함수
  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    updateSearchParams({ pageSize: size, page: 1 });
  };

  // 내가 작성한 문서만 보기 토글 함수
  const handleViewMyOfferOnlyChange = (e: CheckboxChangeEvent) => {
    setViewMyOfferOnly(e.target.checked);
    updateSearchParams({ viewMyOfferOnly: e.target.checked });
  };

  // 견적 확인 함수 (OFFER -> ORDER)
  const handleConfirmClick = (supplierInquiryId: number) => {
    Modal.confirm({
      title: "Confirm Quotation",
      content: "Are you sure you want to confirm this quotation?",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await confirmQutation(supplierInquiryId);
          message.success("Quotation confirmed successfully.");
          fetchData();
        } catch (error) {
          console.error("Error confirming the quotation:", error);
          message.error("Failed to confirm the quotation. Please try again.");
        }
      },
    });
  };

  // N/A 처리 함수
  const handleNAClick = (supplierInquiryId: number) => {
    Modal.confirm({
      title: "Handle N/A",
      content: "Are you sure you want to handle N/A?",
      okText: "Ok",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await changeOfferStatus(supplierInquiryId, "NA");
          message.success("N/A handled successfully.");
          fetchData();
        } catch (error) {
          console.error("Error handling N/A:", error);
          message.error("Failed to handle N/A. Please try again.");
        }
      },
    });
  };

  // 견적 삭제 함수
  const handleDelete = async (documentId: number) => {
    Modal.confirm({
      title: "Delete Offer",
      content: "Are you sure you want to delete this offer?",
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteOffer(documentId);
          message.success("Offer deleted successfully.");
          // 목록 갱신
          fetchData();
        } catch (error) {
          console.error("Error deleting offer:", error);
          message.error("Failed to delete offer. Please try again.");
        }
      },
    });
  };

  // 공급처 삭제 함수
  const handleDeleteSupplier = async (
    inquiryId: number,
    supplierName: string
  ) => {
    Modal.confirm({
      title: "Delete Supplier on Offer",
      content: `Are you sure you want to delete ${supplierName} on this offer?`,
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteSupplierInquiry(inquiryId);
          message.success("Supplier deleted successfully.");
          // 목록 갱신
          fetchData();
        } catch (error) {
          console.error("Error deleting supplier inquiry:", error);
          message.error("Failed to delete supplier. Please try again.");
        }
      },
    });
  };

  // 검색어 추가 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();

      if (searchTags.length > 2) {
        message.error(
          "You can only add up to 3 search terms.(최대 3개의 검색어만 추가할 수 있습니다.)"
        );
        return;
      }

      if (searchCategory === "query") {
        message.error(
          "Please select a specific category before adding a search term.(특정 카테고리를 선택한 후 검색어를 추가해주세요.)"
        );
        return;
      }

      if (!searchText.trim()) {
        return;
      }

      // 중복 체크
      const isDuplicate = searchTags.some(
        (tag) =>
          tag.category === searchCategory && tag.value === searchText.trim()
      );

      if (isDuplicate) {
        message.warning(
          "This search term is already added.(이미 추가된 검색어입니다.)"
        );
        return;
      }

      setSearchTags((prev) => [
        ...prev,
        {
          category: searchCategory,
          value: searchText.trim(),
        },
      ]);
      setSearchText("");
    }
  };

  // 확장된 행 렌더링 함수
  const expandedRowRender = (record: SupplierInquiryListIF) => {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <EditButton
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(
                {
                  pathname:
                    record.documentType === "COMPLEX"
                      ? `/makecomplexinquiry/${record.customerInquiryId}`
                      : `/makeoffer/${record.documentId}`,
                  search: searchParams.toString(),
                },
                {
                  state: {
                    info: record,
                    category: "offer",
                  },
                }
              );
            }}
          >
            View Details
          </EditButton>
          <EditButton
            danger
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record.documentId);
            }}
          >
            Delete
          </EditButton>
        </div>
        <SupplierPreviewCard>
          {record.supplierPreview.map((supplier) => {
            const isSalesZero = supplier.totalSalesAmountGlobal === 0;
            const isPurchaseZero = supplier.totalPurchaseAmountGlobal === 0;

            const chargeCurrency = () => {
              switch (supplier.currencyType) {
                case "USD":
                  return 1400;
                case "EUR":
                  return 1500;
                case "INR":
                  return 16;
                default:
                  return 1400;
              }
            };

            // 이익 금액과 이익율 계산
            const profit =
              supplier.totalSalesAmountGlobal * chargeCurrency() -
              supplier.totalPurchaseAmountKrw;
            const profitRate =
              supplier.totalSalesAmountGlobal === 0
                ? 0
                : (profit /
                    (supplier.totalSalesAmountGlobal * chargeCurrency())) *
                  100;
            const isProfitNegative = profit < 0;

            return (
              <Card key={supplier.supplierInquiryId}>
                <div className="supplier-name">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      justifyContent: "space-between",
                    }}
                  >
                    <SupplierCode>{supplier.supplierCode}</SupplierCode>
                    <DeleteOutlined
                      style={{ color: "#ff4d4f", cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSupplier(
                          supplier.supplierInquiryId,
                          supplier.supplierName
                        );
                      }}
                    />
                  </div>
                  <SupplierName>{supplier.supplierName}</SupplierName>
                </div>
                <div className="info-row">
                  <span className="label">Sales Amount:</span>
                  <Value $isZero={isSalesZero}>
                    {supplier.totalSalesAmountGlobal.toLocaleString("en-US", {
                      style: "currency",
                      currency: record.currencyType,
                    })}
                  </Value>
                </div>
                <div className="info-row">
                  <span className="label">Purchase Amount:</span>
                  <Value $isZero={isPurchaseZero}>
                    {supplier.totalPurchaseAmountGlobal.toLocaleString(
                      "en-US",
                      {
                        style: "currency",
                        currency: record.currencyType,
                      }
                    )}
                  </Value>
                </div>
                <div className="info-row">
                  <span className="label">Profit:</span>
                  <Value
                    $isZero={isProfitNegative}
                    style={{ color: isProfitNegative ? "red" : "green" }}
                  >
                    {profit.toLocaleString("ko-KR", {
                      style: "currency",
                      currency: "KRW",
                    })}
                  </Value>
                </div>
                <div className="info-row">
                  <span className="label">Profit Rate:</span>
                  <Value
                    $isZero={isProfitNegative}
                    style={{ color: isProfitNegative ? "red" : "green" }}
                  >
                    {profitRate.toFixed(2)}%
                  </Value>
                </div>
                <div className="info-row">
                  <span className="label">Document Status:</span>
                  <Value
                    $isZero={false}
                    style={{
                      color: supplier.status === "NA" ? "red" : "black",
                    }}
                  >
                    {supplier.status}
                  </Value>
                </div>
                <Divider />
                <div className="info-row">
                  <Button
                    onClick={() => {
                      handleNAClick(supplier.supplierInquiryId);
                    }}
                    danger
                  >
                    N/A
                  </Button>
                  <Tooltip
                    title={
                      supplier.status === "QUOTATION_SENT"
                        ? ""
                        : "Please send Email before confirming"
                    }
                  >
                    <Button
                      type="primary"
                      disabled={supplier.status !== "QUOTATION_SENT"}
                      onClick={() => {
                        handleConfirmClick(supplier.supplierInquiryId);
                      }}
                    >
                      Confirm
                    </Button>
                  </Tooltip>
                </div>
              </Card>
            );
          })}
        </SupplierPreviewCard>
      </div>
    );
  };

  // 검색 파라미터 업데이트 함수
  const updateSearchParams = (
    params: Record<string, string | number | boolean>
  ) => {
    const newSearchParams = new URLSearchParams(searchParams);

    // 기존 파라미터 업데이트
    Object.entries(params).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, String(value));
      }
    });

    // 검색 태그 파라미터 추가
    searchTags.forEach((tag) => {
      if (tag.value) {
        newSearchParams.set(tag.category, tag.value);
      }
    });

    setSearchParams(newSearchParams);
  };

  return (
    <>
      <Container>
        <Title>견적 제안 - Offers</Title>
        <TableHeader>
          <SearchBar>
            <SearchSection>
              <Select
                defaultValue={searchCategory}
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
              <Tooltip
                placement="topLeft"
                title="Ctrl + Enter to add a search term"
                color="blue"
              >
                <Input
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    updateSearchParams({ searchText: e.target.value });
                  }}
                  onKeyDown={handleKeyDown}
                  onPressEnter={(e) => {
                    if (!e.ctrlKey) {
                      // Ctrl + Enter가 아닌 경우에만 검색 실행
                      handleSearch();
                    }
                  }}
                  style={{ ...commonInputStyles, width: 280 }}
                />
              </Tooltip>
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
              <Select
                defaultValue={viewDocumentStatus}
                style={{ width: 150, marginRight: 10 }}
                onChange={(value) => setViewDocumentStatus(value)}
              >
                <Select.Option value="ALL">ALL</Select.Option>
                <Select.Option value="PRICE_PENDING">
                  PRICE_PENDING
                </Select.Option>
                <Select.Option value="PRICE_ENTERED">
                  PRICE_ENTERED
                </Select.Option>
              </Select>
              <Checkbox
                checked={viewMyOfferOnly}
                onChange={handleViewMyOfferOnlyChange}
              >
                View My Offer Only
              </Checkbox>
            </CheckboxWrapper>
          </SearchBar>
          <TagContainer>
            {searchTags.map((tag, index) => (
              <SearchTag
                key={`${tag.category}-${index}`}
                closable
                onClose={() => {
                  setSearchTags((prev) => prev.filter((_, i) => i !== index));
                }}
              >
                {`${tag.category}: ${tag.value}`}
              </SearchTag>
            ))}
          </TagContainer>
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
        {data?.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
          <>
            <StyledTable
              columns={columns}
              dataSource={data}
              pagination={false}
              loading={loading}
              rowKey="documentId"
              expandable={{
                expandedRowRender,
                expandRowByClick: true,
              }}
              onRow={(record) => {
                const rowProps = {
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
    </>
  );
};

export default OfferList;
