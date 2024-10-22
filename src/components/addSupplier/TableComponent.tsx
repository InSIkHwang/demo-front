import { useEffect, useState } from "react";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import { InquiryItem } from "../../types/types";

const CustomTable = styled(Table)`
  .ant-table * {
    font-size: 12px;
  }

  .ant-table-thead .ant-table-cell {
    text-align: center;
  }

  .ant-table-cell {
    border-inline-end: 1px solid #d1d1d1 !important;
    border-bottom: 1px solid #d1d1d1 !important;
  }

  .maker-row {
    background-color: #deefffd8; /* MAKER 행의 배경색 */
    &:hover {
      background-color: #deefff !important;
    }
    .ant-table-cell-row-hover {
      background-color: #deefff !important;
    }
  }
  .type-row {
    background-color: #fffdded8; /* TYPE 행의 배경색 */
    &:hover {
      background-color: #fffdde !important;
    }
    .ant-table-cell-row-hover {
      background-color: #fffdde !important;
    }
  }
  .desc-row {
    background-color: #f0f0f0d8;
    &:hover {
      background-color: #f0f0f0 !important;
    }
    .ant-table-cell-row-hover {
      background-color: #f0f0f0 !important;
    }
  }
`;

interface TableComponentProps {
  items: InquiryItem[];
}

const TableComponent = ({ items }: TableComponentProps) => {
  const [sortedData, setSortedData] = useState<InquiryItem[]>(items);

  useEffect(() => {
    const sorted = [...items].sort((a, b) => a.position! - b.position!);

    setSortedData(sorted);
  }, []);

  const columns: ColumnsType<any> = [
    {
      title: "No.",
      dataIndex: "no",
      key: "no",
      width: 0,
      render: (_: any, record: any, index: number) => {
        const filteredIndex = items
          .filter((item: any) => item.itemType === "ITEM")
          .indexOf(record);

        return record.itemType === "ITEM" ? (
          <span>{filteredIndex + 1}</span>
        ) : null;
      },
    },
    {
      title: "PartNo.",
      dataIndex: "itemCode",
      key: "itemCode",
      render: (text: string, record: InquiryItem) =>
        record.itemType === "ITEM" ? (
          <span>{text}</span>
        ) : (
          <span>{record.itemType}</span>
        ),
    },
    {
      title: "OPT.",
      dataIndex: "itemType",
      key: "itemType",
      render: (text: string, record: InquiryItem) =>
        record.itemType === "ITEM" ? (
          <span>{text}</span>
        ) : (
          <span>{record.itemType}</span>
        ),
    },

    {
      title: "Name",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      render: (text: number, record: InquiryItem) =>
        record.itemType === "ITEM" ? <span>{text}</span> : null,
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      render: (text: number, record: InquiryItem) =>
        record.itemType === "ITEM" ? <span>{text}</span> : null,
    },
    {
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      render: (text: string) => <span>{text}</span>,
    },
  ];

  return (
    <>
      <CustomTable
        rowClassName={(record: any, index) => {
          if (record.itemType === "MAKER") {
            return "maker-row";
          } else if (record.itemType === "TYPE") {
            return "type-row";
          } else {
            return index % 2 === 0 ? "even-row" : "odd-row"; // 기본 행 스타일
          }
        }}
        scroll={{ y: 600 }}
        virtual
        dataSource={sortedData}
        columns={columns}
        rowKey="position"
        pagination={false}
        bordered
      />
    </>
  );
};

export default TableComponent;
