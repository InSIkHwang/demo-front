import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button as AntButton,
  Select,
  Pagination,
  Tag,
  message,
} from "antd";
import { SearchOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import CreateVesselModal from "../components/vessel/CreateVesselModal";
import type { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import DetailVesselModal from "../components/vessel/DetailVesselModal";
import { Vessel, VesselResponse } from "../types/types";
import { fetchVesselList, fetchVesselSearch } from "../api/api";
import { useQuery } from "@tanstack/react-query";

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

const { Option } = Select;

const ShipList = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDetailVesselModalOpen, setIsDetailVesselModalOpen] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

  // 선박 목록 조회 쿼리
  const {
    data: vesselData,
    isLoading,
    error,
    refetch,
  } = useQuery<VesselResponse>({
    queryKey: ["vessels", currentPage, itemsPerPage],
    queryFn: async () => {
      const params: any = {
        page: currentPage - 1,
        pageSize: itemsPerPage,
      };

      if (searchText) {
        if (searchCategory === "all") {
          params.query = searchText;
        } else {
          params[searchCategory] = searchText;
        }
        return await fetchVesselSearch(params);
      }
      return await fetchVesselList(currentPage, itemsPerPage);
    },
    placeholderData: (previousData) => previousData,
  });

  // Error
  useEffect(() => {
    if (error) {
      message.error("Failed to fetch data");
    }
  }, [error]);

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

  const columns: ColumnsType<Vessel> = [
    {
      title: "Vessel Name",
      dataIndex: "vesselName",
      key: "vesselName",
      sorter: (a, b) => a.vesselName.localeCompare(b.vesselName),
    },
    {
      title: "IMO No.",
      dataIndex: "imoNumber",
      key: "imoNumber",
      sorter: (a, b) => a.imoNumber - b.imoNumber,
    },
    {
      title: "HULL No.",
      dataIndex: "hullNumber",
      key: "hullNumber",
    },
    {
      title: "Shipyard",
      dataIndex: "shipYard",
      key: "shipYard",
    },
    {
      title: "Nationality",
      dataIndex: "countryOfManufacture",
      key: "countryOfManufacture",
    },
    {
      title: "Customer Name",
      key: "customerName",
      render: (text, record) =>
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

  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  return (
    <>
      <Container>
        <Title>Vessel List</Title>
        <TableHeader>
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
                if (currentPage !== 1) {
                  setCurrentPage(1);
                }
                refetch();
              }}
              style={{ width: 300, marginRight: 10 }}
              suffix={
                <SearchOutlined
                  onClick={() => {
                    if (currentPage !== 1) {
                      setCurrentPage(1);
                    }
                    refetch();
                  }}
                />
              }
            />
          </SearchBar>
          <Button type="primary" onClick={openModal}>
            New Vessel
          </Button>
        </TableHeader>
        {vesselData &&
          vesselData.vessels.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
            <>
              <Table
                columns={columns}
                dataSource={vesselData.vessels}
                pagination={false}
                loading={isLoading}
                rowKey="id"
                onRow={(record) => ({
                  onClick: () => openDetailVesselModal(record),
                })}
                style={{ cursor: "pointer" }}
              />
              <PaginationWrapper
                current={currentPage}
                pageSize={itemsPerPage}
                total={vesselData.totalCount}
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
      {isModalOpen && (
        <CreateVesselModal
          onUpdate={() => {
            refetch();
          }}
          onClose={closeModal}
        />
      )}
      {isDetailVesselModalOpen && selectedVessel && (
        <DetailVesselModal
          vessel={selectedVessel}
          onClose={closeDetailVesselModal}
          onUpdate={() => {
            refetch();
          }}
        />
      )}
    </>
  );
};

export default ShipList;
