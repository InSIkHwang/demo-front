import React, { useState, useEffect } from "react";
import {
  Table,
  Button as AntButton,
  Pagination,
  notification,
  Tag,
} from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { fetchTrashList, recoverTrash } from "../api/api";
import type { ColumnsType } from "antd/es/table";
import { TrashItem } from "../types/types";

const Container = styled.div`
  position: relative;
  top: 150px;
  padding: 20px;
  border: 2px solid #ccc;
  border-radius: 8px;
  margin: 0 auto;
  max-width: 70vw;
  margin-bottom: 300px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
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

const TrashList = () => {
  const [data, setData] = useState<TrashItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  const fetchData = async () => {
    try {
      const response = await fetchTrashList(currentPage, itemsPerPage);
      setData(response.trashList); // trashList 사용
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (docNumber: string) => {
    try {
      await recoverTrash(docNumber);
      notification.success({
        message: "Document Recovered",
        description: `Document ${docNumber} has been successfully recovered.`,
        placement: "topRight",
      });
      // 복구 후 데이터를 다시 불러오거나 UI를 업데이트하는 로직 추가
      fetchData(); // 복구 후 데이터를 다시 불러오는 함수 호출
    } catch (error) {
      notification.error({
        message: "Recovery Failed",
        description: `Failed to recover document ${docNumber}. Please try again.`,
        placement: "topRight",
      });
      console.error("복구 중 오류가 발생했습니다:", error);
    }
  };

  const columns: ColumnsType<TrashItem> = [
    {
      title: "Document Number",
      dataIndex: "docNumber", // trashList의 docNumber 사용
      key: "docNumber",
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
      title: "Currency",
      dataIndex: "currencyType",
      key: "currencyType",
    },
    {
      title: "Currency Value",
      dataIndex: "currencyValue",
      key: "currencyValue",
      render: (value) => `$${value.toFixed(2)}`, // 통화값을 포맷팅
    },
    {
      title: "Document Status",
      dataIndex: "documentStatus",
      key: "documentStatus",
      render: (status) => {
        let color;
        switch (status) {
          default:
            color = "grey";
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Document Manager",
      dataIndex: "docManagerName", // 담당자 이름 추가
      key: "docManagerName",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<RollbackOutlined />} // 아이콘 추가
          onClick={() => handleRecover(record.docNumber)}
        >
          Recover
        </Button>
      ),
    },
  ];

  return (
    <Container>
      <Title>휴지통 - Trash</Title>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        loading={loading}
        rowKey="docNumber"
      />
      <PaginationWrapper
        current={currentPage}
        pageSize={itemsPerPage}
        total={totalCount}
        onChange={(page) => setCurrentPage(page)}
        onShowSizeChange={(current, size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
      />
    </Container>
  );
};

export default TrashList;
