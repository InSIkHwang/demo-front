import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button as AntButton,
  Select,
  Pagination,
  message,
} from "antd";
import { SearchOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import CreateCompanyModal from "../components/company/CreateCompanyModal";
import type { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import DetailCompanyModal from "../components/company/DetailCompanyModal";
import axios from "../api/axios";
import { Customer } from "../types/types";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { fetchCustomerList, fetchCustomerSearch } from "../api/api";

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

const CustomerList = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDetailCompanyModalOpen, setIsDetailCompanyModalOpen] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const category = "customer";

  useEffect(() => {
    const debouncedSearch = debounce((text: string) => {
      setDebouncedSearch(text);
    }, 500);

    debouncedSearch(searchText);

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchText]);

  const {
    data: customers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["customers", currentPage, itemsPerPage, debouncedSearch],
    queryFn: async () => {
      const params: any = {
        page: currentPage - 1,
        pageSize: itemsPerPage,
      };

      if (debouncedSearch) {
        if (searchCategory === "code") {
          params.code = debouncedSearch;
        } else if (searchCategory === "companyName") {
          params.companyName = debouncedSearch;
        } else if (searchCategory === "all") {
          params.query = debouncedSearch;
        } else if (searchCategory === "vesselName") {
          params.vesselName = debouncedSearch;
        }
        return await fetchCustomerSearch(params);
      }
      return await fetchCustomerList(params);
    },

    staleTime: 30000,
  });

  // Error
  useEffect(() => {
    if (error) {
      message.error("Failed to fetch data");
    }
  }, [error]);

  // 모달 열릴 때 스크롤 방지
  useEffect(() => {
    if (isModalOpen || isDetailCompanyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen, isDetailCompanyModalOpen]);

  const columns: ColumnsType<Customer> = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Customer Name",
      dataIndex: "companyName",
      key: "companyName",
      sorter: (a, b) => a.companyName.localeCompare(b.companyName),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Contact",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Manager",
      dataIndex: "representative",
      key: "representative",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Language",
      dataIndex: "communicationLanguage",
      key: "communicationLanguage",
    },
    {
      title: "Modified Date",
      dataIndex: "modifiedAt",
      key: "modifiedAt",
      sorter: (a, b) =>
        new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime(),
      sortDirections: ["ascend", "descend"],
    },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openDetailCompanyModal = (category: Customer) => {
    setSelectedCustomer(category);
    setIsDetailCompanyModalOpen(true);
  };

  const closeDetailCompanyModal = () => {
    setSelectedCustomer(null);
    setIsDetailCompanyModalOpen(false);
  };

  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  return (
    <>
      <Container>
        <Title>Customer List</Title>
        <TableHeader>
          <SearchBar>
            <Select
              defaultValue="all"
              style={{ width: 120, marginRight: 10 }}
              onChange={(value) => setSearchCategory(value)}
              dropdownStyle={{ width: 150 }}
            >
              <Option value="all">All</Option>
              <Option value="code">Code</Option>
              <Option value="companyName">Customer Name</Option>
              <Option value="vesselName">Vessel Name</Option>
            </Select>
            <Input
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => {
                if (currentPage !== 1) {
                  setCurrentPage(1);
                }
              }}
              style={{ width: 300, marginRight: 10 }}
              suffix={
                <SearchOutlined
                  onClick={() => {
                    if (currentPage !== 1) {
                      setCurrentPage(1);
                    }
                  }}
                />
              }
            />
          </SearchBar>
          <Button type="primary" onClick={openModal}>
            New Customer
          </Button>
        </TableHeader>
        {customers?.customers?.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
          <>
            <Table
              columns={columns}
              dataSource={customers?.customers}
              pagination={false}
              loading={isLoading}
              rowKey="code"
              onRow={(record) => ({
                onClick: () => openDetailCompanyModal(record),
              })}
              style={{ cursor: "pointer" }}
              scroll={{ x: 1100 }}
            />
            <PaginationWrapper
              current={currentPage}
              pageSize={itemsPerPage}
              total={customers?.totalCount}
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
        <CreateCompanyModal
          category={category}
          onClose={closeModal}
          onUpdate={() => {
            refetch();
          }}
        />
      )}
      {isDetailCompanyModalOpen && selectedCustomer && (
        <DetailCompanyModal
          category={category}
          company={selectedCustomer}
          onClose={closeDetailCompanyModal}
          onUpdate={() => {
            refetch();
          }}
        />
      )}
    </>
  );
};

export default CustomerList;
