import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button as AntButton,
  Select,
  Pagination,
  DatePicker,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import {
  fetchOfferDetail,
  fetchOfferList,
  searchInquiryList,
} from "../api/api";
import DetailInquiryModal from "../components/inquiryList/DetailInquiryModal";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { SupplierInquiryListIF } from "../types/types";

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
  const [isDetailCompanyModalOpen, setIsDetailCompanyModalOpen] =
    useState<boolean>(false);
  const [registerStartDate, setRegisterStartDate] = useState<string>("");
  const [registerEndDate, setRegisterEndDate] = useState<string>("");

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

  useEffect(() => {
    if (isDetailCompanyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDetailCompanyModalOpen]);

  const fetchDetail = async () => {
    try {
      const response = await fetchOfferDetail(1, 1);
    } catch (error) {
      console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
    }
  };

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = async (record: SupplierInquiryListIF) => {
    try {
      // supplierInfoList의 첫 번째 항목을 가져오기
      const firstSupplierInfo = record.supplierInfoList[0];
      if (firstSupplierInfo) {
        const { supplierId } = firstSupplierInfo;
        const { supplierInquiryId } = firstSupplierInfo; // 첫 번째 항목의 supplierInquiryId를 사용

        // 상태에 값 설정
        setSelectedInquiryIds(supplierId);

        // fetchDetail 함수 호출하여 세부정보 가져오기
        const detailResponse = await fetchOfferDetail(
          supplierInquiryId,
          supplierId
        );

        // 세부정보를 콘솔에 출력
        console.log(detailResponse);
      }
    } catch (error) {
      console.error("세부정보를 가져오는 중 오류가 발생했습니다:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
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
