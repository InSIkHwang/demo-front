import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button as AntButton,
  Select,
  Pagination,
  DatePicker,
  Card,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { fetchOfferDetail, fetchOfferList } from "../api/api";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import type { SupplierInquiryListIF } from "../types/types";

const Container = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  border: 2px solid #ccc;
  border-radius: 8px;
  margin: 0 auto;
  width: 1200px;
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
  flex-wrap: wrap;
  gap: 20px;
`;

const StyledCard = styled(Card)`
  width: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  .ant-card-body {
    padding: 20px;
  }
`;

const CardTitle = styled.h3`
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
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
    width: 130,
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
    title: "선적 날짜",
    dataIndex: "shippingDate",
    key: "shippingDate",
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

const SupplierInquiryList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SupplierInquiryListIF[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] =
    useState<string>("documentNumber");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<number | null>(
    null
  );
  const [registerStartDate, setRegisterStartDate] = useState<string>("");
  const [registerEndDate, setRegisterEndDate] = useState<string>("");
  const [supplierInfoList, setSupplierInfoList] = useState<any[]>([]);
  const [currentDetail, setCurrentDetail] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchOfferList();
        setData(response.supplierInquiryList);
        setTotalCount(response.totalCount);
      } catch (error) {
        console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = async (record: SupplierInquiryListIF) => {
    if (
      currentDetail &&
      record.documentNumber === currentDetail.documentNumber
    ) {
      // 현재 열려있는 항목을 다시 클릭하면 currentDetail을 숨깁니다.
      setCurrentDetail(null);
      setSupplierInfoList([]);
    } else {
      // 새 항목을 클릭하면 supplierInfoList의 모든 항목에 대해 fetchOfferDetail을 호출합니다.
      const fetchDetails = async () => {
        try {
          // 모든 요청을 동시에 실행
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

          setSupplierInfoList(details);
        } catch (error) {
          console.error("세부정보를 가져오는 중 오류가 발생했습니다:", error);
        }
      };

      fetchDetails();
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
    const totalPurchaseAmountUSD = details.reduce(
      (acc, item) => acc + item.purchaseAmountUSD,
      0
    );
    const totalSalesAmountUSD = details.reduce(
      (acc, item) => acc + item.salesAmountUSD,
      0
    );

    const totalProfitKRW = totalSalesAmountKRW - totalPurchaseAmountKRW;
    const totalProfitUSD = totalSalesAmountUSD - totalPurchaseAmountUSD;
    const profitMarginKRW =
      totalSalesAmountKRW === 0
        ? 0
        : (totalProfitKRW / totalSalesAmountKRW) * 100;
    const profitMarginUSD =
      totalSalesAmountUSD === 0
        ? 0
        : (totalProfitUSD / totalSalesAmountUSD) * 100;

    return {
      totalPurchaseAmountKRW,
      totalSalesAmountKRW,
      totalProfitKRW: totalProfitKRW,
      profitMarginKRW,
      totalPurchaseAmountUSD,
      totalSalesAmountUSD,
      totalProfitUSD: totalProfitUSD,
      profitMarginUSD,
    };
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
              <Select.Option value="docRemark">매출처</Select.Option>
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
          </SearchBar>
          <Button type="primary" onClick={() => navigate("/makeinquiry")}>
            신규 등록
          </Button>
        </TableHeader>
        <Table
          columns={columns}
          dataSource={paginatedData}
          pagination={false}
          loading={loading}
          rowKey="supplierInquiryId"
          style={{ cursor: "pointer" }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
        />
        {supplierInfoList.length > 0 && (
          <CardContainer>
            {supplierInfoList.map(({ info, detail }) => {
              const totals = calculateTotals(detail.inquiryItemDetails);
              return (
                <StyledCard
                  key={info.supplierInquiryId}
                  title={
                    <CardTitle>
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
                        총 이익 (KRW): {totals.totalProfitKRW.toLocaleString()}
                      </InfoText>
                    </Section>
                    <Divider />
                    <Section>
                      <InfoText>
                        매입액 (USD):{" "}
                        {totals.totalPurchaseAmountUSD.toLocaleString()}
                      </InfoText>
                      <InfoText>
                        매출액 (USD):{" "}
                        {totals.totalSalesAmountUSD.toLocaleString()}
                      </InfoText>
                      <InfoText style={{ color: "#000" }}>
                        총 이익 (USD): {totals.totalProfitUSD.toLocaleString()}
                      </InfoText>
                    </Section>
                  </CardContent>
                  <InfoText style={{ color: "#000" }}>
                    이익율: {totals.profitMarginKRW.toFixed(2)}% (USD:{" "}
                    {totals.profitMarginUSD.toFixed(2)}%)
                  </InfoText>
                  <InfoText style={{ float: "right" }}>
                    적용환율: {detail.currency} ({detail.currencyType})
                  </InfoText>
                </StyledCard>
              );
            })}
          </CardContainer>
        )}
        <PaginationWrapper
          current={currentPage}
          pageSize={itemsPerPage}
          total={totalCount}
          onChange={handlePageChange}
          onShowSizeChange={handlePageSizeChange}
          showSizeChanger
          pageSizeOptions={[10, 15, 30, 50, 100]}
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
      </Container>
    </>
  );
};

export default SupplierInquiryList;
