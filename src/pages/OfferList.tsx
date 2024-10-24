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
  width: 460px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  .ant-card-body {
    padding: 20px;
  }
  margin: 50px 0 10px 0;
`;

const CardTitle = styled.h3`
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 0;
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
  font-size: 13px;
  color: #555;
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
  const [searchCategory, setSearchCategory] =
    useState<string>("documentNumber");
  const [registerStartDate, setRegisterStartDate] = useState<string>("");
  const [registerEndDate, setRegisterEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [supplierInfoList, setSupplierInfoList] = useState<any[]>([]);
  const [currentDetail, setCurrentDetail] = useState<any | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<
    Map<number, string>
  >(new Map());
  const [viewMyOfferOnly, setViewMyOfferOnly] = useState<boolean>(false);

  useEffect(() => {
    if (searchText) {
      handleSearch();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage]);
  console.log(currentPage);

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
        message.error("An error occurred while retrieving details");
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

  const fetchFilteredData = () => {
    setCurrentPage(1); // 페이지를 1로 초기화
    fetchData(); // 데이터 재요청
  };

  const calculateTotals = (
    details: any[],
    dcPercent: number,
    invChargeList: any[]
  ) => {
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

    // DC 적용
    const discountAmountKRW = dcPercent
      ? totalSalesAmountKRW * (dcPercent / 100)
      : 0;
    const discountAmountGlobal = dcPercent
      ? totalSalesAmountGlobal * (dcPercent / 100)
      : 0;

    const newTotalSalesAmountKRW = totalSalesAmountKRW - discountAmountKRW;
    const newTotalSalesAmountGlobal =
      totalSalesAmountGlobal - discountAmountGlobal;

    // InvChargeList 합산
    const chargePriceKRWTotal =
      invChargeList && Array.isArray(invChargeList)
        ? invChargeList.reduce((acc, charge) => acc + charge.chargePriceKRW, 0)
        : 0;

    const chargePriceGlobalTotal =
      invChargeList && Array.isArray(invChargeList)
        ? invChargeList.reduce(
            (acc, charge) => acc + charge.chargePriceGlobal,
            0
          )
        : 0;

    const updatedTotalSalesAmountKRW =
      newTotalSalesAmountKRW + chargePriceKRWTotal;
    const updatedTotalSalesAmountGlobal =
      newTotalSalesAmountGlobal + chargePriceGlobalTotal;

    const totalProfitKRW = updatedTotalSalesAmountKRW - totalPurchaseAmountKRW;
    const totalProfitGlobal =
      updatedTotalSalesAmountGlobal - totalPurchaseAmountGlobal;

    const profitMarginKRW =
      totalSalesAmountKRW === 0
        ? 0
        : ((totalProfitKRW / totalPurchaseAmountKRW) * 100).toFixed(2);
    const profitMarginGlobal =
      totalSalesAmountGlobal === 0
        ? 0
        : ((totalProfitGlobal / totalSalesAmountGlobal) * 100).toFixed(2);

    return {
      totalPurchaseAmountKRW,
      totalSalesAmountKRW: updatedTotalSalesAmountKRW,
      totalProfitKRW,
      profitMarginKRW,
      totalPurchaseAmountGlobal,
      totalSalesAmountGlobal: updatedTotalSalesAmountGlobal,
      totalProfitGlobal,
      profitMarginGlobal,
    };
  };

  const handleEditClick = (info: any) => {
    navigate(`/makeoffer/${info.supplierInquiryId}`, {
      state: { info, catrgory: "offer" }, // 상세 정보를 상태로 전달
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
        navigate("/makeoffer/mergedoffer", {
          state: { info, catrgory: "offer" },
        });
      } catch (error) {
        message.error("An error occurred while sending the email."); // 오류 메시지 표시
      }
    } else {
      message.error("There are no suppliers selected."); // 선택된 의뢰처가 없을 때 에러 메시지 표시
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

  const handleViewMyOfferOnlyChange = (e: CheckboxChangeEvent) => {
    setViewMyOfferOnly(e.target.checked);
  };

  const handlePdfDownload = (detail: any) => {
    if (detail.pdfUrl) {
      const link = document.createElement("a");
      link.href = detail.pdfUrl;
      link.download = `${detail.supplierName}_REQUEST FOR QUOTATION_${detail.documentNumber}.pdf`; // 다운로드할 파일 이름
      link.click();
    } else {
      message.warning(
        `PDF URL for supplier ${detail.documentNumber} is not available`
      );
    }
  };

  const handleAddSupplier = async (documentNumber: string) => {
    try {
      const response = await addSupplierFetchData(documentNumber);
      const data = response;

      navigate(`/addsupplierininquiry/${documentNumber}`, { state: data });
    } catch (error) {
      console.error("Error fetching supplier data:", error);
    }
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
              defaultValue="documentNumber"
              style={{ width: 150, marginRight: 10 }}
              onChange={(value) => setSearchCategory(value)}
            >
              <Select.Option value="documentNumber">Document No.</Select.Option>
              <Select.Option value="refNumber">REF No.</Select.Option>
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
              rowKey="documentNumber"
              expandable={{
                expandedRowRender: (record) => {
                  if (
                    currentDetail &&
                    record.documentNumber === currentDetail.documentNumber
                  ) {
                    return (
                      <CardContainer>
                        <div style={{ position: "absolute", right: 20 }}>
                          <Button
                            type="primary"
                            style={{ marginRight: 10 }}
                            onClick={() =>
                              handleAddSupplier(currentDetail.documentNumber)
                            }
                          >
                            Add Supplier
                          </Button>
                          <Button
                            type="primary"
                            onClick={() => handleSendMailClick()}
                          >
                            Send mail
                          </Button>
                        </div>
                        <SelectedSupplierNameBox>
                          Selected Suppliers:{" "}
                          {Array.from(selectedSupplierIds.values()).map(
                            (companyName, index) => (
                              <span key={index}>{companyName}</span>
                            )
                          )}
                          {selectedSupplierIds.size === 0 &&
                            "There are no suppliers selected."}
                        </SelectedSupplierNameBox>

                        {supplierInfoList.map(({ info, detail }) => {
                          const dcPercent = detail.discount;
                          const invChargeList = detail.invChargeList;
                          const totals = calculateTotals(
                            detail.inquiryItemDetails,
                            dcPercent,
                            invChargeList
                          );

                          return (
                            <StyledCard
                              key={info.supplierInquiryId}
                              title={
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    marginBottom: 10,
                                  }}
                                >
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
                                  <div style={{ alignSelf: "flex-end" }}>
                                    <Button
                                      type="primary"
                                      size="small"
                                      onClick={() => handlePdfDownload(detail)}
                                    >
                                      PDF file download
                                    </Button>
                                  </div>
                                </div>
                              }
                            >
                              <CardContent>
                                <Section>
                                  <InfoText>
                                    Purchase amount (KRW):{" "}
                                    {totals.totalPurchaseAmountKRW?.toLocaleString()}
                                  </InfoText>
                                  <InfoText>
                                    Sales amount (KRW):{" "}
                                    {totals.totalSalesAmountKRW?.toLocaleString()}
                                  </InfoText>
                                  <InfoText style={{ color: "#000" }}>
                                    Profit (KRW):{" "}
                                    {totals.totalProfitKRW?.toLocaleString()}
                                  </InfoText>
                                </Section>
                                <Divider />
                                <Section>
                                  <InfoText>
                                    Purchase amount (F):{" "}
                                    {totals.totalPurchaseAmountGlobal?.toLocaleString()}
                                  </InfoText>
                                  <InfoText>
                                    Sales amount (F):{" "}
                                    {totals.totalSalesAmountGlobal?.toLocaleString()}
                                  </InfoText>
                                  <InfoText style={{ color: "#000" }}>
                                    Profit (F):{" "}
                                    {totals.totalProfitGlobal?.toLocaleString()}
                                  </InfoText>
                                </Section>
                                <Divider />
                                <Section>
                                  <InfoText>Discount: {dcPercent}%</InfoText>
                                  {invChargeList &&
                                    invChargeList.length > 0 && (
                                      <InfoText>
                                        Charges:{" "}
                                        {invChargeList
                                          .map(
                                            (charge: {
                                              customCharge: any;
                                              chargePriceKRW: {
                                                toLocaleString: () => any;
                                              };
                                            }) =>
                                              `${
                                                charge.customCharge
                                              }(${charge.chargePriceKRW.toLocaleString()} KRW)`
                                          )
                                          .join(", ")}
                                      </InfoText>
                                    )}
                                </Section>
                              </CardContent>
                              <InfoText>
                                Total Items: {detail.inquiryItemDetails.length}
                              </InfoText>
                              <InfoText style={{ color: "#000" }}>
                                Profit Margin: {totals.profitMarginKRW}%
                              </InfoText>
                              <div
                                style={{
                                  display: "grid",
                                  height: 50,
                                  margin: "5px 0",
                                }}
                              >
                                <InfoText style={{ textAlign: "right" }}>
                                  Currency: {detail.currency} (
                                  {detail.currencyType})
                                </InfoText>
                                <Button
                                  type="primary"
                                  onClick={() => handleEditClick(detail)}
                                  style={{ marginTop: 10 }}
                                >
                                  Edit
                                </Button>
                              </div>
                            </StyledCard>
                          );
                        })}
                      </CardContainer>
                    );
                  }
                  return null;
                },
                expandedRowKeys: expandedRowKeys,
                onExpand: (expanded, record) => {
                  if (expanded) {
                    handleRowClick(record);
                  } else {
                    setCurrentDetail(null);
                    setSupplierInfoList([]);
                    setExpandedRowKeys([]);
                  }
                },
              }}
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
    </>
  );
};

export default OfferList;
