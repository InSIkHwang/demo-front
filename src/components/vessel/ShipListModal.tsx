import React, { useState, useEffect } from "react";
import { Table, Input, Select, Pagination, Tag, Modal } from "antd";
import { SearchOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import axios from "../../api/axios";
import DetailVesselModal from "../vessel/DetailVesselModal";
import { Vessel } from "../../types/types";

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

const TableWrapper = styled.div`
  margin: 16px;
`;

const PaginationWrapper = styled(Pagination)`
  margin-top: 20px;
  display: flex;
  justify-content: center;
`;

const { Option } = Select;

interface ShipListModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const ShipListModal = ({ isVisible, onClose }: ShipListModalProps) => {
  const [data, setData] = useState<Vessel[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [isDetailVesselModalOpen, setIsDetailVesselModalOpen] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [totalCount, setTotalCount] = useState<number>();

  // 데이터 로드 효과
  useEffect(() => {
    if (searchText) {
      fetchFilteredData();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage]);

  // 모달 열기 효과
  useEffect(() => {
    if (isDetailVesselModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [, isDetailVesselModalOpen]);

  // 데이터 로드 함수
  const fetchData = async () => {
    try {
      const response = await axios.get("/api/vessels", {
        params: {
          page: currentPage - 1,
          pageSize: itemsPerPage,
        },
      });
      setData(response.data.vessels);
      setTotalCount(response.data.totalCount);
      setLoading(false);
    } catch (error) {
      setData([]);
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  // 필터링된 데이터 로드 함수
  const fetchFilteredData = async () => {
    try {
      const params: any = {
        page: currentPage - 1,
        pageSize: itemsPerPage,
      };
      if (searchCategory === "vesselName") {
        params.vesselName = searchText;
      } else if (searchCategory === "all") {
        params.query = searchText;
      } else if (searchCategory === "imoNumber") {
        params.imoNumber = searchText;
      } else if (searchCategory === "hullNumber") {
        params.hullNumber = searchText;
      } else if (searchCategory === "customerName") {
        params.customerName = searchText;
      }
      const response = await axios.get("/api/vessels/search", { params });
      setData(response.data.vessels);
      setTotalCount(response.data.totalCount);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      setLoading(false);
    }
  };

  // 테이블 열 정의
  const columns = [
    {
      title: "Vessel Name",
      dataIndex: "vesselName",
      key: "vesselName",
      sorter: (a: Vessel, b: Vessel) =>
        a.vesselName.localeCompare(b.vesselName),
    },
    {
      title: "IMO No.",
      dataIndex: "imoNumber",
      key: "imoNumber",
      sorter: (a: Vessel, b: Vessel) => a.imoNumber - b.imoNumber,
    },
    {
      title: "Customer Name",
      key: "customerName",
      render: (text: any, record: Vessel) =>
        record.customers
          ? record.customers.map(
              (customer) =>
                customer.companyName && (
                  <Tag key={customer.id}>{customer.companyName}</Tag>
                )
            )
          : "",
    },
  ];

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  // 선박 상세 모달 열기 함수
  const openDetailVesselModal = (category: Vessel) => {
    setSelectedVessel(category);
    setIsDetailVesselModalOpen(true);
  };

  return (
    <Modal
      title="Vessel List"
      open={isVisible}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      <SearchBar>
        <Select
          defaultValue="all"
          style={{ width: 120, marginRight: 10 }}
          onChange={(value) => setSearchCategory(value)}
        >
          <Option value="all">All</Option>
          <Option value="vesselName">Vessel Name</Option>
          <Option value="imoNumber">IMO No.</Option>
          <Option value="hullNumber">Hull No.</Option>
          <Option value="customerName">Customer Name</Option>
        </Select>
        <Input
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={() => {
            if (currentPage === 1) {
              fetchFilteredData();
            } else {
              setCurrentPage(1);
            }
          }}
          style={{ width: 300 }}
          suffix={
            <SearchOutlined
              onClick={() => {
                if (currentPage === 1) {
                  fetchFilteredData();
                } else {
                  setCurrentPage(1);
                }
              }}
            />
          }
        />
      </SearchBar>

      <TableWrapper>
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          loading={loading}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => openDetailVesselModal(record),
          })}
          style={{ cursor: "pointer" }}
        />
        {data.length > 0 && (
          <PaginationWrapper
            current={currentPage}
            pageSize={itemsPerPage}
            total={totalCount}
            onChange={handlePageChange}
            onShowSizeChange={handlePageSizeChange}
            showSizeChanger
            pageSizeOptions={[10, 20, 50]}
            showQuickJumper
            itemRender={(page, type, originalElement) => {
              if (type === "prev") return <LeftOutlined />;
              if (type === "next") return <RightOutlined />;
              return originalElement;
            }}
          />
        )}
      </TableWrapper>
      {isDetailVesselModalOpen && selectedVessel && (
        <DetailVesselModal
          vessel={selectedVessel}
          onClose={() => setIsDetailVesselModalOpen(false)}
          onUpdate={() => {
            if (searchText) {
              fetchFilteredData();
            } else {
              fetchData();
            }
          }}
        />
      )}
    </Modal>
  );
};

export default ShipListModal;
