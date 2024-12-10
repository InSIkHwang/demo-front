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
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import {
  changeOfferStatus,
  confirmQutation,
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

const Value = styled.span<{ isZero: boolean }>`
  font-weight: 500;
  color: ${({ isZero }) =>
    isZero ? "red" : "inherit"}; // 값이 0일 경우 빨간색
`;

const EditButton = styled(Button)`
  margin-top: 12px;
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
    title: "Costomer",
    dataIndex: "companyName",
    key: "companyName",
  },
  {
    title: "REF No.",
    dataIndex: "refNumber",
    key: "refNumber",
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
      dayjs().subtract(1, "month").format("YYYY-MM-DD")
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

  useEffect(() => {
    if (searchParams.toString()) {
      handleSearch();
    } else {
      fetchData();
    }
  }, []);

  useEffect(() => {
    if ((searchText || searchSubText) && registerStartDate && registerEndDate) {
      handleSearch();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage, viewMyOfferOnly]);

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

      const response = await searchOfferList(searchParams);
      setData(response.supplierInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      message.error("An error occurred while searching");
    } finally {
      setLoading(false);
    }
  };

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateSearchParams({ page });
  };

  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    updateSearchParams({ pageSize: size, page: 1 });
  };

  const handleViewMyOfferOnlyChange = (e: CheckboxChangeEvent) => {
    setViewMyOfferOnly(e.target.checked);
    updateSearchParams({ viewMyOfferOnly: e.target.checked });
  };

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

  const expandedRowRender = (record: SupplierInquiryListIF) => {
    return (
      <div>
        <EditButton
          type="primary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(
              record.documentType === "COMPLEX"
                ? `/makecomplexinquiry/${record.customerInquiryId}`
                : `/makeoffer/${record.documentId}`,
              {
                state: { info: record, category: "offer" },
              }
            );
          }}
        >
          View Details
        </EditButton>
        <SupplierPreviewCard>
          {record.supplierPreview.map((supplier) => {
            const isSalesZero = supplier.totalSalesAmountGlobal === 0;
            const isPurchaseZero = supplier.totalPurchaseAmountGlobal === 0;

            // 이익 금액과 이익율 계산
            const profit =
              supplier.totalSalesAmountGlobal -
              supplier.totalPurchaseAmountGlobal;
            const profitRate =
              supplier.totalSalesAmountGlobal === 0
                ? 0
                : (profit / supplier.totalPurchaseAmountGlobal) * 100;
            const isProfitNegative = profit < 0;

            return (
              <Card key={supplier.supplierInquiryId}>
                <div className="supplier-name">
                  <SupplierCode>{supplier.supplierCode}</SupplierCode>
                  <SupplierName>{supplier.supplierName}</SupplierName>
                </div>
                <div className="info-row">
                  <span className="label">Sales Amount:</span>
                  <Value isZero={isSalesZero}>
                    {supplier.totalSalesAmountGlobal.toLocaleString("en-US", {
                      style: "currency",
                      currency: record.currencyType,
                    })}
                  </Value>
                </div>
                <div className="info-row">
                  <span className="label">Purchase Amount:</span>
                  <Value isZero={isPurchaseZero}>
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
                    isZero={isProfitNegative}
                    style={{ color: isProfitNegative ? "red" : "green" }}
                  >
                    {profit.toLocaleString("en-US", {
                      style: "currency",
                      currency: record.currencyType,
                    })}
                  </Value>
                </div>
                <div className="info-row">
                  <span className="label">Profit Rate:</span>
                  <Value
                    isZero={isProfitNegative}
                    style={{ color: isProfitNegative ? "red" : "green" }}
                  >
                    {profitRate.toFixed(2)}%
                  </Value>
                </div>
                <div className="info-row">
                  <span className="label">Document Status:</span>
                  <Value
                    isZero={false}
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

  return (
    <>
      <Container>
        <Title>견적 제안 - Offers</Title>
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
                defaultValue={dayjs().subtract(1, "month")}
                onChange={(date) =>
                  setRegisterStartDate(date ? date.format("YYYY-MM-DD") : "")
                }
                style={commonInputStyles}
              />
              <DatePicker
                placeholder="End Date"
                format="YYYY-MM-DD"
                defaultValue={dayjs()}
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
        {data.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
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
