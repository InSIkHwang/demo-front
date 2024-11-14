import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button as AntButton,
  Select,
  Pagination,
  DatePicker,
  message,
  Tag,
  Divider,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { fetchOfferList, searchOfferList } from "../api/api";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import type { OfferSearchParams, SupplierInquiryListIF } from "../types/types";
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
    font-size: 16px;
    font-weight: 600;
    color: #1890ff;
    margin-bottom: 12px;
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
      return <StyledTag color={color}>{status}</StyledTag>;
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
  const [searchSubCategory, setSearchSubCategory] =
    useState<string>("itemName");
  const [searchSubText, setSearchSubText] = useState<string>("");
  const [registerStartDate, setRegisterStartDate] = useState<string>("");
  const [registerEndDate, setRegisterEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [viewMyOfferOnly, setViewMyOfferOnly] = useState<boolean>(false);
  const [showItemSearch, setShowItemSearch] = useState<boolean>(false);

  useEffect(() => {
    if (searchText || registerStartDate || registerEndDate || viewMyOfferOnly) {
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
      message.error("검색 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleItemSearchToggle = (e: CheckboxChangeEvent) => {
    setShowItemSearch(e.target.checked);
    if (!e.target.checked) {
      setSearchSubCategory("");
      setSearchSubText("");
    }
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

  const expandedRowRender = (record: SupplierInquiryListIF) => {
    return (
      <div>
        <EditButton
          type="primary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/makeoffer/${record.documentId}`, {
              state: { info: record, category: "offer" },
            });
          }}
        >
          View Details
        </EditButton>
        <SupplierPreviewCard>
          {record.supplierPreview.map((supplier) => {
            const isSalesZero = supplier.totalSalesAmountGlobal === 0;
            const isPurchaseZero = supplier.totalPurchaseAmountGlobal === 0;

            return (
              <Card key={supplier.supplierInquiryId}>
                <div className="supplier-name">{supplier.supplierName}</div>
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
              </Card>
            );
          })}
        </SupplierPreviewCard>
      </div>
    );
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
              </Select>
              <Input
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={() => handleSearch()}
                style={{ ...commonInputStyles, width: 280 }}
              />
              <DatePicker
                placeholder="Start Date"
                format="YYYY-MM-DD"
                onChange={(date) =>
                  setRegisterStartDate(date ? date.format("YYYY-MM-DD") : "")
                }
                style={commonInputStyles}
              />
              <DatePicker
                placeholder="End Date"
                format="YYYY-MM-DD"
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
              <Checkbox onChange={handleViewMyOfferOnlyChange}>
                View My Offer Only
              </Checkbox>
            </CheckboxWrapper>
          </SearchBar>
          <SearchBar>
            <SearchSection>
              <Checkbox onChange={handleItemSearchToggle}>
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
                    onChange={(e) => setSearchSubText(e.target.value)}
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
            <Table
              columns={columns}
              dataSource={data}
              pagination={false}
              loading={loading}
              rowKey="documentId"
              expandable={{
                expandedRowRender,
                expandRowByClick: true,
              }}
              onRow={(record) => ({
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
