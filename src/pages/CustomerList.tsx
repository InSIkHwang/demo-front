import React, { useState, useEffect } from "react";
import { Table, Input, Button as AntButton, Select, Pagination } from "antd";
import { SearchOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import CustomerCreateModal from "../components/customer/CustomerCreateModal";
import type { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import CustomerDetailModal from "../components/customer/CustomerDetailModal ";

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
  name: string;
  contact: string;
  manager: string;
  email: string;
  address: string;
  date: string;
}

const CustomerList = () => {
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

  useEffect(() => {
    fetch("/data/customer.json")
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

  const applyFilter = () => {
    const result =
      searchText.trim() === ""
        ? data
        : data.filter((item) => {
            if (searchCategory === "all") {
              return (
                item.code.includes(searchText) ||
                item.name.includes(searchText) ||
                item.contact.includes(searchText) ||
                item.manager.includes(searchText) ||
                item.email.includes(searchText) ||
                item.address.includes(searchText)
              );
            } else if (searchCategory === "code") {
              return item.code.includes(searchText);
            } else if (searchCategory === "name") {
              return item.name.includes(searchText);
            } else if (searchCategory === "address") {
              return item.address.includes(searchText);
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
      title: "상호명",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "연락처",
      dataIndex: "contact",
      key: "contact",
    },
    {
      title: "담당자",
      dataIndex: "manager",
      key: "manager",
    },
    {
      title: "이메일",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "주소",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "등록일",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      sortDirections: ["ascend", "descend"],
    },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openDetailModal = (customer: Customer) => {
    setSelectedCustomer(customer);
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
        <Title>매출처 관리</Title>
        <TableHeader>
          <SearchBar>
            <Select
              defaultValue="all"
              style={{ width: 120, marginRight: 10 }}
              onChange={(value) => setSearchCategory(value)}
            >
              <Option value="all">통합검색</Option>
              <Option value="code">코드</Option>
              <Option value="name">상호명</Option>
              <Option value="address">주소</Option>
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
      {isModalOpen && <CustomerCreateModal onClose={closeModal} />}
      {isDetailModalOpen && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={closeDetailModal}
        />
      )}
    </>
  );
};

export default CustomerList;
