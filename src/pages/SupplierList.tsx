import React, { useState, useEffect } from "react";
import { Table, Input, Button as AntButton, Select, Pagination } from "antd";
import { SearchOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import CreateCompanyModal from "../components/company/CreateCompanyModal";
import type { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import DetailCompanyModal from "../components/company/DetailCompanyModal";
import axios from "../api/axios";
import { Supplier } from "../types/types";

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

const SupplierList = () => {
  const [data, setData] = useState<Supplier[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDetailCompanyModalOpen, setIsDetailCompanyModalOpen] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [totalCount, setTotalCount] = useState<number>();

  const category = "supplier";

  useEffect(() => {
    if (searchText) {
      fetchFilteredData();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage]);

  //데이터 FETCH
  const fetchData = async () => {
    try {
      const response = await axios.get("/api/suppliers", {
        params: {
          page: currentPage - 1,
          pageSize: itemsPerPage,
        },
      });

      setData(response.data.suppliers || []); // 빈 배열로 초기화
      setTotalCount(response.data.totalCount || 0); // totalCount도 초기화
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]); // 오류 발생 시 빈 배열로 초기화
      setLoading(false);
    }
  };

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

  //검색 API 로직
  const fetchFilteredData = async () => {
    try {
      const params: any = {
        page: currentPage - 1, // 페이지는 0부터 시작
        pageSize: itemsPerPage, // 페이지당 아이템 수
      };
      if (searchCategory === "code") {
        params.code = searchText;
      } else if (searchCategory === "companyName") {
        params.companyName = searchText;
      } else if (searchCategory === "all") {
        params.query = searchText;
      }
      const response = await axios.get("/api/suppliers/search", { params });
      setData(response.data.suppliers);
      setTotalCount(response.data.totalCount);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      setLoading(false);
    }
  };

  const columns: ColumnsType<Supplier> = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Supplier Name",
      dataIndex: "companyName",
      key: "companyName",
      sorter: (a, b) =>
        (a.companyName || "").localeCompare(b.companyName || ""),
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
      width: 280,
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

  const openDetailCompanyModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDetailCompanyModalOpen(true);
  };

  const closeDetailCompanyModal = () => {
    setSelectedSupplier(null);
    setIsDetailCompanyModalOpen(false);
  };

  const handlePageSizeChange = (current: number, size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  return (
    <>
      <Container>
        <Title>Supplier List</Title>
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
              <Option value="companyName">Supplier Name</Option>
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
              style={{ width: 300, marginRight: 10 }}
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
          <Button type="primary" onClick={openModal}>
            New Supplier
          </Button>
        </TableHeader>
        {data?.length > 0 && ( // 데이터가 있을 때만 페이지네이션을 표시
          <>
            <Table
              columns={columns}
              dataSource={data}
              pagination={false}
              loading={loading}
              rowKey="code"
              onRow={(record) => ({
                onClick: () => openDetailCompanyModal(record),
              })}
              style={{ cursor: "pointer" }}
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
      {isModalOpen && (
        <CreateCompanyModal
          category={category}
          onClose={closeModal}
          onUpdate={() => {
            if (searchText) {
              fetchFilteredData();
            } else {
              fetchData();
            }
          }}
        />
      )}
      {isDetailCompanyModalOpen && selectedSupplier && (
        <DetailCompanyModal
          category={category}
          company={selectedSupplier}
          onClose={closeDetailCompanyModal}
          onUpdate={() => {
            if (searchText) {
              fetchFilteredData();
            } else {
              fetchData();
            }
          }}
        />
      )}
    </>
  );
};

export default SupplierList;
