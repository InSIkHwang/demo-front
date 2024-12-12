import { useEffect, useState, useCallback, useRef } from "react";
import { Table, Input, Select, Button } from "antd";
import { PlusCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import { InquiryItem } from "../../types/types";
import { TextAreaRef } from "antd/es/input/TextArea";

const { Option } = Select;

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
  setItems: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
}

const TableComponent = ({ items, setItems }: TableComponentProps) => {
  const [unitOptions, setUnitOptions] = useState<string[]>(["", "PCS", "SET"]);
  const inputRefs = useRef<(TextAreaRef | null)[][]>([]);

  useEffect(() => {
    const sorted = [...items].sort((a, b) => a.position! - b.position!);
    setItems(sorted);
  }, []);

  const handleInputChange = useCallback(
    (index: number, key: string, value: any) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = {
          ...newItems[index],
          [key]: value,
        };
        return newItems;
      });
    },
    []
  );

  const handleUnitBlur = useCallback(
    (index: number, value: string) => {
      handleInputChange(index, "unit", value);
      setUnitOptions((prev) =>
        prev.includes(value) ? prev : [...prev, value]
      );
    },
    [handleInputChange]
  );

  const applyUnitToAllRows = useCallback((selectedUnit: string) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        unit: selectedUnit,
      }))
    );
  }, []);

  const handleNextRowKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
      rowIndex: number,
      columnIndex: number
    ) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleAddItem(rowIndex);
        if (inputRefs.current[rowIndex + 1]?.[columnIndex]) {
          inputRefs.current[rowIndex + 1][columnIndex]?.focus();
        }

        return;
      }

      // Ctrl + Backspace 키 감지
      if (e.ctrlKey && e.key === "Backspace") {
        e.preventDefault();

        handleDeleteItem(rowIndex);
        if (inputRefs.current[rowIndex - 1]?.[columnIndex]) {
          inputRefs.current[rowIndex - 1][columnIndex]?.focus();
        }

        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const nextIndex = e.key === "ArrowDown" ? rowIndex + 1 : rowIndex - 1;
        inputRefs.current[nextIndex]?.[columnIndex]?.focus();
      }
    },
    []
  );

  const handleAddItem = useCallback((index: number) => {
    setItems((prev) => {
      const newItems = [...prev];
      const currentItem = newItems[index];

      // 새 아이템 생성
      const newItem: InquiryItem = {
        tableNo: 1,
        itemDetailId: null,
        position: currentItem.position + 1,
        itemType: "ITEM",
        itemCode: "",
        itemName: "",
        itemRemark: "",
        qty: 0,
        unit: "",
      };

      // 새 아이템을 현재 아이템 다음 위치에 삽입
      newItems.splice(index + 1, 0, newItem);

      // position 재정렬
      return newItems.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));
    });
  }, []);

  const handleDeleteItem = useCallback((index: number) => {
    setItems((prev) => {
      const newItems = prev.filter((_, idx) => idx !== index);

      // position 재정렬
      return newItems.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));
    });
  }, []);

  const columns: ColumnsType<any> = [
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: any, record: InquiryItem, index: number) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <Button
            type="default"
            icon={<PlusCircleOutlined />}
            onClick={() => handleAddItem(index)}
            size="small"
          />
          {items.length > 1 && ( // 최소 1개의 아이템은 유지
            <Button
              type="default"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteItem(index)}
              size="small"
            />
          )}
        </div>
      ),
    },
    {
      title: "No.",
      dataIndex: "no",
      key: "no",
      width: 60,
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
      width: 300,
      render: (text: string, record: InquiryItem, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "itemCode", e.target.value)}
          ref={(el) => {
            if (!inputRefs.current[index]) inputRefs.current[index] = [];
            inputRefs.current[index][1] = el;
          }}
          onKeyDown={(e) => handleNextRowKeyDown(e, index, 1)}
        />
      ),
    },
    {
      title: "OPT.",
      dataIndex: "itemType",
      key: "itemType",
      width: 120,
      render: (text: string, record: InquiryItem, index: number) => (
        <Select
          value={text}
          onChange={(value) => handleInputChange(index, "itemType", value)}
          style={{ width: "100%" }}
        >
          {["MAKER", "TYPE", "ITEM"].map((opt) => (
            <Option key={opt} value={opt}>
              {opt}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Name",
      dataIndex: "itemName",
      key: "itemName",
      width: 550,
      render: (text: string, record: InquiryItem, index: number) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleInputChange(index, "itemName", e.target.value)}
          autoSize={{ minRows: 1, maxRows: 5 }}
          ref={(el) => {
            if (!inputRefs.current[index]) inputRefs.current[index] = [];
            inputRefs.current[index][3] = el;
          }}
          onKeyDown={(e) => handleNextRowKeyDown(e, index, 3)}
        />
      ),
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: 80,
      render: (text: number, record: InquiryItem, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            type="number"
            value={text}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              handleInputChange(index, "qty", isNaN(value) ? 0 : value);
            }}
            ref={(el) => {
              if (!inputRefs.current[index]) inputRefs.current[index] = [];
              inputRefs.current[index][4] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 4)}
          />
        ) : null,
    },
    {
      title: (
        <Select
          placeholder="Unit"
          onChange={applyUnitToAllRows}
          style={{ width: "100%" }}
        >
          {unitOptions.map((unit) => (
            <Option key={unit} value={unit}>
              {unit}
            </Option>
          ))}
        </Select>
      ),
      dataIndex: "unit",
      key: "unit",
      width: 100,
      render: (text: string, record: InquiryItem, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            value={text}
            onChange={(e) => handleInputChange(index, "unit", e.target.value)}
            onBlur={(e) => handleUnitBlur(index, e.target.value)}
            ref={(el) => {
              if (!inputRefs.current[index]) inputRefs.current[index] = [];
              inputRefs.current[index][5] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 5)}
          />
        ) : null,
    },
    {
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      render: (text: string, record: InquiryItem, index: number) => (
        <Input.TextArea
          value={text}
          onChange={(e) =>
            handleInputChange(index, "itemRemark", e.target.value)
          }
          autoSize={{ minRows: 1, maxRows: 3 }}
          ref={(el) => {
            if (!inputRefs.current[index]) inputRefs.current[index] = [];
            inputRefs.current[index][6] = el;
          }}
          onKeyDown={(e) => handleNextRowKeyDown(e, index, 6)}
        />
      ),
    },
  ];

  return (
    <CustomTable
      rowClassName={(record: any) => {
        if (record.itemType === "MAKER") return "maker-row";
        if (record.itemType === "TYPE") return "type-row";
        return "";
      }}
      scroll={{ y: 600 }}
      virtual
      dataSource={items}
      columns={columns}
      rowKey="position"
      pagination={false}
      bordered
    />
  );
};

export default TableComponent;
