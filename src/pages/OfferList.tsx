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
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import {
  editMurgedOffer,
  fetchOfferDetail,
  fetchOfferList,
  searchOfferList,
} from "../api/api";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import type { SupplierInquiryListIF } from "../types/types";

const expandAnimation = keyframes`
   from {
    transform: translateY(-20px);   
    opacity: 0;
  }
  to {
    transform: translateY(0);   
    opacity: 1;
  }
`;

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

const CardContainer = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  animation: ${expandAnimation} 0.5s ease-in-out;
  overflow: hidden;
`;

const SelectedSupplierNameBox = styled.div`
  position: absolute;
  left: 80px;
  font-weight: 700;
  span {
    border-left: 2px solid #007bff;
    border-right: 2px solid #007bff;
    margin: 0 3px;
    padding: 2px 4px;
    border-radius: 5px;
  }
`;

const StyledCard = styled(Card)`
  width: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  .ant-card-body {
    padding: 20px;
  }
  margin-top: 50px;
`;

const CardTitle = styled.h3`
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
`;

const CardContent = styled.div`
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
  margin-bottom: 10px;
`;

const Section = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Divider = styled.div`
  width: 1px;
  background-color: #ddd;
  flex-shrink: 0;
  margin: 0 5px;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #555;
`;

const columns: ColumnsType<SupplierInquiryListIF> = [
  {
    title: "문서번호",
    dataIndex: "documentNumber",
    key: "documentNumber",
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
    title: "매출처",
    dataIndex: "companyName",
    key: "companyName",
  },
  {
    title: "비고",
    dataIndex: "docRemark",
    key: "docRemark",
    sorter: (a, b) => a.docRemark.localeCompare(b.docRemark),
    sortDirections: ["ascend", "descend"],
  },
  {
    title: "REF NO.",
    dataIndex: "refNumber",
    key: "refNumber",
  },
  {
    title: "담당자",
    dataIndex: "docManager",
    key: "docManager",
  },
  {
    title: "문서 상태",
    dataIndex: "documentStatus",
    key: "documentStatus",
  },
];

const OfferList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SupplierInquiryListIF[]>([]);
  const [totalCount, setTotalCount] = useState<number>();
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] =
    useState<string>("documentNumber");
  const [registerStartDate, setRegisterStartDate] = useState<string>("");
  const [registerEndDate, setRegisterEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [supplierInfoList, setSupplierInfoList] = useState<any[]>([]);
  const [currentDetail, setCurrentDetail] = useState<any | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<
    Map<number, string>
  >(new Map());

  useEffect(() => {
    if (searchText) {
      handleSearch();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage]);

  const fetchData = async () => {
    try {
      const response = await fetchOfferList(currentPage, itemsPerPage);
      setData(response.supplierInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      // searchCategory에 해당하는 필드만 searchText를 할당
      const documentNumber =
        searchCategory === "documentNumber" ? searchText : "";
      const refNumber = searchCategory === "refNumber" ? searchText : "";
      const customerName = searchCategory === "customerName" ? searchText : "";

      const response = await searchOfferList(
        registerStartDate,
        registerEndDate,
        documentNumber,
        refNumber,
        customerName,
        currentPage,
        itemsPerPage
      );

      setData(response.supplierInquiryList);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("검색 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (record: SupplierInquiryListIF) => {
    setSelectedSupplierIds(new Map<number, string>());

    if (
      currentDetail &&
      record.documentNumber === currentDetail.documentNumber
    ) {
      // 현재 열려있는 항목을 다시 클릭하면 currentDetail을 숨깁니다.
      setCurrentDetail(null);
      setSupplierInfoList([]);
      setExpandedRowKeys([]);
    } else {
      // 새 항목을 클릭하면 supplierInfoList의 모든 항목에 대해 fetchOfferDetail을 호출합니다.
      try {
        // 선택한 항목의 세부정보를 가져오기 전에 기존 세부정보를 지웁니다.
        setSupplierInfoList([]);

        // 선택한 항목의 세부정보를 가져옵니다.
        const detailPromises = record.supplierInfoList.map(async (info) => {
          const { supplierId, supplierInquiryId } = info;
          const detailResponse = await fetchOfferDetail(
            supplierInquiryId,
            supplierId
          );

          return {
            info,
            detail: detailResponse,
          };
        });

        // 모든 요청이 완료된 후 결과를 상태에 저장
        const details = await Promise.all(detailPromises);

        setCurrentDetail(record); // 현재 항목을 현재 세부정보로 설정
        setSupplierInfoList(details);
        setExpandedRowKeys([record.documentNumber]); // 행을 확장합니다.
      } catch (error) {
        console.error("세부정보를 가져오는 중 오류가 발생했습니다:", error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const calculateTotals = (details: any[]) => {
    const totalPurchaseAmountKRW = details.reduce(
      (acc, item) => acc + item.purchaseAmountKRW,
      0
    );
    const totalSalesAmountKRW = details.reduce(
      (acc, item) => acc + item.salesAmountKRW,
      0
    );
    const totalPurchaseAmountGlobal = details.reduce(
      (acc, item) => acc + item.purchaseAmountGlobal,
      0
    );
    const totalSalesAmountGlobal = details.reduce(
      (acc, item) => acc + item.salesAmountGlobal,
      0
    );

    const totalProfitKRW = totalSalesAmountKRW - totalPurchaseAmountKRW;
    const totalProfitGlobal =
      totalSalesAmountGlobal - totalPurchaseAmountGlobal;
    const profitMarginKRW =
      totalSalesAmountKRW === 0
        ? 0
        : ((totalProfitKRW / totalSalesAmountKRW) * 100).toFixed(2);
    const profitMarginGlobal =
      totalSalesAmountGlobal === 0
        ? 0
        : ((totalProfitGlobal / totalSalesAmountGlobal) * 100).toFixed(2);

    return {
      totalPurchaseAmountKRW,
      totalSalesAmountKRW,
      totalProfitKRW: totalProfitKRW,
      profitMarginKRW,
      totalPurchaseAmountGlobal,
      totalSalesAmountGlobal,
      totalProfitGlobal: totalProfitGlobal,
      profitMarginGlobal,
    };
  };

  const handleEditClick = (info: any) => {
    navigate(`/makeoffer/${info.supplierInquiryId}`, {
      state: { info }, // 상세 정보를 상태로 전달
    });
  };

  const handleSendMailClick = async () => {
    if (selectedSupplierIds.size > 0) {
      try {
        // selectedSupplierIds의 모든 키(offerId)를 배열로 추출하여 info 객체 생성
        const info = {
          supplierInquiryId: Array.from(selectedSupplierIds.keys()),
        };

        // navigate를 사용하여 상태와 함께 페이지 이동
        navigate("/makeoffer/mergedoffer", { state: { info } });
      } catch (error) {
        console.error("오류가 발생했습니다:", error);
        message.error("메일 전송 중 오류가 발생했습니다."); // 오류 메시지 표시
      }
    } else {
      message.error("선택된 의뢰처가 없습니다."); // 선택된 의뢰처가 없을 때 에러 메시지 표시
    }
  };

  // 체크박스 핸들러
  const handleCheckboxChange = (
    supplierInquiryId: number,
    companyName: string,
    checked: boolean
  ) => {
    setSelectedSupplierIds((prev) => {
      const newSelectedIds = new Map(prev);
      if (checked) {
        newSelectedIds.set(supplierInquiryId, companyName);
      } else {
        newSelectedIds.delete(supplierInquiryId);
      }
      return newSelectedIds;
    });
  };

  return (
    <>
      <Container>
        <Title>견적 제안 - Offers</Title>
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
            <DatePicker
              placeholder="시작 날짜"
              format="YYYY-MM-DD"
              onChange={(date) =>
                setRegisterStartDate(date ? date.format("YYYY-MM-DD") : "")
              }
              style={{ marginRight: 10 }}
            />
            <DatePicker
              placeholder="종료 날짜"
              format="YYYY-MM-DD"
              onChange={(date) =>
                setRegisterEndDate(date ? date.format("YYYY-MM-DD") : "")
              }
              style={{ marginRight: 10 }}
            />
            <Button type="primary" onClick={handleSearch}>
              검색
            </Button>
          </SearchBar>
        </TableHeader>{" "}
        {data.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
          <>
            <Table
              columns={columns}
              dataSource={data}
              pagination={false}
              loading={loading}
              rowKey="documentNumber" // Use documentNumber as key for expansion
              expandedRowRender={(record) => {
                if (
                  currentDetail &&
                  record.documentNumber === currentDetail.documentNumber
                ) {
                  return (
                    <CardContainer>
                      <Button
                        type="primary"
                        style={{ position: "absolute", right: 20 }}
                        onClick={() => handleSendMailClick()}
                      >
                        메일전송
                      </Button>
                      <SelectedSupplierNameBox>
                        선택된 의뢰처:{" "}
                        {Array.from(selectedSupplierIds.values()).map(
                          (companyName, index) => (
                            <span key={index}>{companyName}</span>
                          )
                        )}
                        {selectedSupplierIds.size === 0 &&
                          "선택된 의뢰처가 없습니다."}
                      </SelectedSupplierNameBox>

                      {supplierInfoList.map(({ info, detail }) => {
                        const totals = calculateTotals(
                          detail.inquiryItemDetails
                        );
                        return (
                          <StyledCard
                            key={info.supplierInquiryId}
                            title={
                              <CardTitle
                                onClick={() => {
                                  const isChecked = selectedSupplierIds.has(
                                    info.supplierInquiryId
                                  );
                                  handleCheckboxChange(
                                    info.supplierInquiryId,
                                    info.companyName,
                                    !isChecked
                                  );
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSupplierIds.has(
                                    info.supplierInquiryId
                                  )}
                                  onChange={(e) =>
                                    handleCheckboxChange(
                                      info.supplierInquiryId,
                                      info.companyName,
                                      e.target.checked
                                    )
                                  }
                                  style={{ marginRight: 8 }}
                                />
                                {info.code} ({info.companyName})
                              </CardTitle>
                            }
                          >
                            <CardContent>
                              <Section>
                                <InfoText>
                                  매입액 (KRW):{" "}
                                  {totals.totalPurchaseAmountKRW.toLocaleString()}
                                </InfoText>
                                <InfoText>
                                  매출액 (KRW):{" "}
                                  {totals.totalSalesAmountKRW.toLocaleString()}
                                </InfoText>
                                <InfoText style={{ color: "#000" }}>
                                  총 이익 (KRW):{" "}
                                  {totals.totalProfitKRW.toLocaleString()}
                                </InfoText>
                              </Section>
                              <Divider />
                              <Section>
                                <InfoText>
                                  매입액 (F):{" "}
                                  {totals.totalPurchaseAmountGlobal.toLocaleString()}
                                </InfoText>
                                <InfoText>
                                  매출액 (F):{" "}
                                  {totals.totalSalesAmountGlobal.toLocaleString()}
                                </InfoText>
                                <InfoText style={{ color: "#000" }}>
                                  총 이익 (F):{" "}
                                  {totals.totalProfitGlobal.toLocaleString()}
                                </InfoText>
                              </Section>
                            </CardContent>
                            <InfoText style={{ color: "#000" }}>
                              이익율: {totals.profitMarginKRW}% (F:{" "}
                              {totals.profitMarginGlobal}%)
                            </InfoText>
                            <div
                              style={{
                                display: "grid",
                                height: 50,
                                margin: "5px 0",
                              }}
                            >
                              <InfoText>
                                적용환율: {record.currency} (
                                {record.currencyType})
                              </InfoText>
                              <Button
                                type="primary"
                                onClick={() => handleEditClick(detail)}
                              >
                                수정
                              </Button>
                            </div>
                          </StyledCard>
                        );
                      })}
                    </CardContainer>
                  );
                }
                return null;
              }}
              expandedRowKeys={expandedRowKeys}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
              })}
              onExpand={(expanded, record) => {
                if (expanded) {
                  handleRowClick(record);
                } else {
                  setCurrentDetail(null);
                  setSupplierInfoList([]);
                  setExpandedRowKeys([]);
                }
              }}
            />

            <PaginationWrapper
              current={currentPage}
              pageSize={itemsPerPage}
              total={totalCount}
              onChange={handlePageChange}
              onShowSizeChange={handlePageSizeChange}
              showSizeChanger
              pageSizeOptions={[10, 15, 20]}
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
