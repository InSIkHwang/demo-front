import React, { useState, useEffect } from "react";
import { Table, Input, Button as AntButton, Select, Pagination } from "antd";
import { SearchOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import CreateModal from "../components/ship/CreateModal";
import type { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import axios from "axios";
import DetailModal from "../components/ship/DetailModal";

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

interface Customer {
  code: string;
  shipname: string;
  company: string;
  callsign: string;
  imonumber: string;
  hullnumber: string;
  shipyard: string;
  shiptype: string;
  remark: string;
  enginetype1: string;
  enginetype2: string;
}

const ShipList = () => {
  const [data, setData] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [filteredData, setFilteredData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const category = "customer";

  useEffect(() => {
    fetch("/data/ship.json")
      .then((response) => response.json())
      .then((data: Customer[]) => {
        setData(data);
        setFilteredData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        setLoading(false);
      });
  }, []);

  // 모달 열릴 때 스크롤 방지
  useEffect(() => {
    if (isModalOpen || isDetailModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen, isDetailModalOpen]);

  const applyFilter = () => {
    const result =
      searchText.trim() === ""
        ? data
        : data.filter((item) => {
            if (searchCategory === "all") {
              return (
                item.code.includes(searchText) ||
                item.shipname.includes(searchText) ||
                item.company.includes(searchText) ||
                item.callsign.includes(searchText) ||
                item.imonumber.includes(searchText) ||
                item.hullnumber.includes(searchText) ||
                item.shipyard.includes(searchText) ||
                item.shiptype.includes(searchText) ||
                item.remark.includes(searchText) ||
                item.enginetype1.includes(searchText) ||
                item.enginetype2.includes(searchText)
              );
            } else if (searchCategory === "code") {
              return item.code.includes(searchText);
            } else if (searchCategory === "shipname") {
              return item.shipname.includes(searchText);
            } else if (searchCategory === "company") {
              return item.company.includes(searchText);
            }
            return false;
          });
    setFilteredData(result);
    setCurrentPage(1);
  };

  const columns: ColumnsType<Customer> = [
    {
      title: "코드",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "선명",
      dataIndex: "shipname",
      key: "shipname",
      sorter: (a, b) => a.shipname.localeCompare(b.shipname),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "선박회사",
      dataIndex: "company",
      key: "company",
    },
    {
      title: "호출부호",
      dataIndex: "callsign",
      key: "callsign",
    },
    {
      title: "IMO No.",
      dataIndex: "imonumber",
      key: "imonumber",
    },
    {
      title: "HULL No.",
      dataIndex: "hullnumber",
      key: "hullnumber",
    },
    {
      title: "SHIPYARD",
      dataIndex: "shipyard",
      key: "shipyard",
    },
    {
      title: "선박구분",
      dataIndex: "shiptype",
      key: "shiptype",
    },
    {
      title: "비고",
      dataIndex: "remark",
      key: "remark",
    },
    {
      title: "엔진타입1",
      dataIndex: "enginetype1",
      key: "enginetype1",
    },
    {
      title: "엔진타입2",
      dataIndex: "enginetype2",
      key: "enginetype2",
    },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openDetailModal = (category: Customer) => {
    setSelectedCustomer(category);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setSelectedCustomer(null);
    setIsDetailModalOpen(false);
  };

  const paginatedData = filteredData.slice(
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
              <Option value="shipname">선명</Option>
              <Option value="company">선박회사</Option>
            </Select>
            <Input
              placeholder="검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={applyFilter}
              style={{ width: 300, marginRight: 10 }}
              suffix={<SearchOutlined onClick={applyFilter} />}
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
            onClick: () => openDetailModal(record),
          })}
          style={{ cursor: "pointer" }}
        />
        <PaginationWrapper
          current={currentPage}
          pageSize={itemsPerPage}
          total={filteredData.length}
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
      {isModalOpen && <CreateModal category={category} onClose={closeModal} />}
      {isDetailModalOpen && selectedCustomer && (
        <DetailModal
          category={category}
          company={selectedCustomer}
          onClose={closeDetailModal}
        />
      )}
    </>
  );
};

export default ShipList;
