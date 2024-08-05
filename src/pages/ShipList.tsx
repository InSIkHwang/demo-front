import React, { useState, useEffect } from "react";
import { Table, Input, Button as AntButton, Select, Pagination } from "antd";
import { SearchOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import CreateVesselModal from "../components/vessel/CreateVesselModal";
import type { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import axios from "../api/axios";
import DetailVesselModal from "../components/vessel/DetailVesselModal";

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
  background-color: #1976d2;
  color: white;
  transition: background-color 0.3s;

  &:hover {
    background-color: #1560ac !important;
  }
`;

const PaginationWrapper = styled(Pagination)`
  margin-top: 20px;
  justify-content: center;
`;

const { Option } = Select;

interface Vessel {
  id: number;
  code: string;
  vesselName: string;
  vesselCompanyName: string;
  imoNumber: number;
  hullNumber: string;
  shipYard: string;
  customer: {
    id: number;
    newCustomerId: string;
    code: string;
    companyName: string;
    newCustomerName: string;
  };
}

const ShipList = () => {
  const [data, setData] = useState<Vessel[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDetailVesselModalOpen, setIsDetailVesselModalOpen] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

  //데이터 FETCH
  const fetchData = async () => {
    try {
      const response = await axios.get("/api/vessels", {
        params: {
          page: currentPage - 1, // 페이지는 0
          size: itemsPerPage,
        },
      });
      setData(response.data.vessels);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  // 모달 열릴 때 스크롤 방지
  useEffect(() => {
    if (isModalOpen || isDetailVesselModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen, isDetailVesselModalOpen]);

  //검색 API 로직
  const fetchFilteredData = async () => {
    try {
      const params: any = {};
      if (searchCategory === "code") {
        params.code = searchText;
      } else if (searchCategory === "vesselName") {
        params.vesselName = searchText;
      } else if (searchCategory === "all") {
        params.query = searchText;
      }
      const response = await axios.get("/api/vessels/search", { params });
      setData(response.data.vessels);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      setLoading(false);
    }
  };

  //최초 렌더링 시 데이터 FETCH
  useEffect(() => {
    fetchData();
  }, []);

  const columns: ColumnsType<Vessel> = [
    {
      title: "코드",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "선명",
      dataIndex: "vesselName",
      key: "vesselName",
      sorter: (a, b) => a.vesselName.localeCompare(b.vesselName),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "선박회사",
      dataIndex: "vesselCompanyName",
      key: "vesselCompanyName",
    },

    {
      title: "IMO No.",
      dataIndex: "imoNumber",
      key: "imoNumber",
    },
    {
      title: "HULL No.",
      dataIndex: "hullNumber",
      key: "hullNumber",
    },
    {
      title: "SHIPYARD",
      dataIndex: "shipYard",
      key: "shipYard",
    },
    {
      title: "매출처",
      key: "customerName",
      render: (text, record) =>
        record.customer ? record.customer.companyName : "없음",
    },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openDetailVesselModal = (category: Vessel) => {
    setSelectedVessel(category);
    setIsDetailVesselModalOpen(true);
  };

  const closeDetailVesselModal = () => {
    setSelectedVessel(null);
    setIsDetailVesselModalOpen(false);
  };

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  return (
    <>
      <Container>
        <Title>선박 관리</Title>
        <TableHeader>
          <SearchBar>
            <Select
              defaultValue="all"
              style={{ width: 120, marginRight: 10 }}
              onChange={(value) => setSearchCategory(value)}
            >
              <Option value="all">통합검색</Option>
              <Option value="code">코드</Option>
              <Option value="vesselName">선명</Option>
            </Select>
            <Input
              placeholder="검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={fetchFilteredData}
              style={{ width: 300, marginRight: 10 }}
              suffix={<SearchOutlined onClick={fetchFilteredData} />}
            />
          </SearchBar>
          <Button type="primary" onClick={openModal}>
            신규 등록
          </Button>
        </TableHeader>
        <Table
          columns={columns}
          dataSource={paginatedData}
          pagination={false}
          loading={loading}
          rowKey="code"
          onRow={(record) => ({
            onClick: () => openDetailVesselModal(record),
          })}
          style={{ cursor: "pointer" }}
        />
        <PaginationWrapper
          current={currentPage}
          pageSize={itemsPerPage}
          total={data.length}
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
      {isModalOpen && (
        <CreateVesselModal onUpdate={fetchData} onClose={closeModal} />
      )}
      {isDetailVesselModalOpen && selectedVessel && (
        <DetailVesselModal
          vessel={selectedVessel}
          onClose={closeDetailVesselModal}
          onUpdate={fetchData}
        />
      )}
    </>
  );
};

export default ShipList;
