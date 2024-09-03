import React, { Dispatch, SetStateAction, useState } from "react";
import { Table, AutoComplete, Input, Select, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { InquiryItem } from "../../types/types";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import styled, { CSSProperties } from "styled-components";
import ExcelUploadModal from "./ExcelUploadModal";
import { ColumnsType } from "antd/es/table";

const { Option } = Select;

interface MakeInquiryTableProps {
  items: InquiryItem[];
  handleInputChange: (index: number, key: string, value: any) => void;
  handleItemCodeChange: (index: number, value: string) => void;
  itemCodeOptions: { value: string }[];
  handleDelete: (index: number) => void;
  setIsDuplicate: Dispatch<SetStateAction<boolean>>;
  setItems: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
  addItem: () => void;
}

const Row = (props: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });

  const transformStyle: CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};

  const style: CSSProperties = {
    ...props.style,
    ...transformStyle,
    transition,
    cursor: "move",
    ...(isDragging ? { position: "relative", zIndex: 999 } : {}),
  };

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
};

const MakeInquiryTable = ({
  items,
  handleInputChange,
  handleItemCodeChange,
  itemCodeOptions,
  handleDelete,
  setIsDuplicate,
  setItems,
  addItem,
}: MakeInquiryTableProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 입력된 단위들을 저장하는 상태 변수 추가
  const [unitOptions, setUnitOptions] = useState<string[]>(["PCS", "SET"]);

  const handleApplyExcelData = (mappedItems: InquiryItem[]) => {
    setItems((prevItems) => [
      ...prevItems,
      ...mappedItems.map((item, idx) => ({
        ...item,
        position: prevItems.length + idx + 1, // position 값 설정
      })),
    ]);
    setIsModalVisible(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Customize the distance for drag start
      },
    })
  );

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    const itemTypeMap: Record<string, string> = {
      "1": "MAKER",
      "2": "TYPE",
      "3": "DESC",
      "4": "ITEM",
    };
    if (itemTypeMap[e.key]) {
      handleInputChange(index, "itemType", itemTypeMap[e.key]);
    }
  };

  const checkDuplicate = (key: string, value: string, index: number) => {
    // 빈 값인 경우 false 반환
    if (!value?.trim()) {
      setIsDuplicate(false); // 빈 값일 때 중복 아님으로 설정
      return false;
    }

    const isDuplicate = items.some(
      (item: any, idx) => item[key] === value && idx !== index
    );

    if (isDuplicate) {
      setIsDuplicate(true);
    } else {
      setIsDuplicate(false); // 중복이 아닌 경우 false 설정
    }

    return isDuplicate;
  };

  const onDragEnd = ({ active, over }: any) => {
    if (active.id !== over?.id) {
      setItems((prevItems) => {
        const activeIndex = prevItems.findIndex(
          (item) => item.position === active.id
        );
        const overIndex = prevItems.findIndex(
          (item) => item.position === over?.id
        );
        return arrayMove(prevItems, activeIndex, overIndex).map(
          (item, index) => ({
            ...item,
            position: index + 1,
          })
        );
      });
    }
  };

  const handleUnitBlur = (index: number, value: string) => {
    handleInputChange(index, "unit", value);

    // 새로운 단위가 입력되었을 경우, 단위 리스트에 추가
    setUnitOptions((prevOptions) =>
      prevOptions.includes(value) ? prevOptions : [...prevOptions, value]
    );
  };

  // 일괄 단위 적용
  const applyUnitToAllRows = (selectedUnit: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        unit: selectedUnit,
      }))
    );
  };

  const columns: ColumnsType<any> = [
    {
      title: "No.",
      dataIndex: "position",
      key: "position",
      render: (text: string, record: InquiryItem, index: number) => (
        <span>{text}</span>
      ),
      width: 50,
    },
    {
      title: "Code",
      dataIndex: "itemCode",
      key: "itemCode",
      render: (text: string, record: InquiryItem, index: number) =>
        record.itemType === "ITEM" ? (
          <div>
            <AutoComplete
              value={text}
              onChange={(value) => handleItemCodeChange(index, value)}
              options={itemCodeOptions}
            >
              <Input
                style={{
                  borderColor: checkDuplicate("itemCode", text, index)
                    ? "#faad14"
                    : "#d9d9d9", // 중복 시 경고색
                }}
              />
            </AutoComplete>
            {checkDuplicate("itemCode", text, index) && (
              <div style={{ color: "#faad14", marginTop: "5px" }}>
                duplicate code.
              </div>
            )}
          </div>
        ) : null,
      width: 150,
    },
    {
      title: "OPT",
      dataIndex: "itemType",
      key: "itemType",
      render: (text: string, record: InquiryItem, index: number) => (
        <Select
          value={text}
          onChange={(value) => handleInputChange(index, "itemType", value)}
          style={{ width: "100%" }}
          onKeyDown={(e) =>
            handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>, index)
          }
        >
          {["MAKER", "TYPE", "DESC", "ITEM"].map((opt) => (
            <Option key={opt} value={opt}>
              {opt}
            </Option>
          ))}
        </Select>
      ),
      width: 100,
    },
    {
      title: (
        <div>
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
        </div>
      ),
      dataIndex: "unit",
      key: "unit",
      render: (text: string, record: InquiryItem, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            value={text}
            onBlur={(e) => handleUnitBlur(index, e.target.value)}
            onChange={(e) => handleInputChange(index, "unit", e.target.value)}
          />
        ) : null,
      width: 100,
    },
    {
      title: "Name",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string, record: InquiryItem, index: number) => (
        <div>
          <Input
            value={text}
            onChange={(e) =>
              handleInputChange(index, "itemName", e.target.value)
            }
            style={{
              borderColor: checkDuplicate("itemName", text, index)
                ? "#faad14"
                : "#d9d9d9", // 중복 시 경고색
            }}
          />
          {checkDuplicate("itemName", text, index) && (
            <div style={{ color: "#faad14", marginTop: "5px" }}>
              duplicate name.
            </div>
          )}
        </div>
      ),
      width: 250,
    },
    {
      title: "QTY",
      dataIndex: "qty",
      key: "qty",
      render: (text: number, record: InquiryItem, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            type="number"
            value={text}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              handleInputChange(index, "qty", isNaN(value) ? 0 : value);
            }}
          />
        ) : null,
      width: 100,
    },
    {
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      render: (text: string, record: InquiryItem, index: number) => (
        <Input
          value={text}
          onChange={(e) =>
            handleInputChange(index, "itemRemark", e.target.value)
          }
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, __: any, index: number) => (
        <Button
          icon={<DeleteOutlined />}
          type="default"
          onClick={() => handleDelete(index)}
        />
      ),
      width: 80,
    },
  ];

  return (
    <>
      <div>
        <Button type="primary" onClick={addItem} style={{ margin: "20px 5px" }}>
          Add item
        </Button>
        <Button
          type="dashed"
          style={{ margin: "20px 5px" }}
          onClick={() => setIsModalVisible(true)}
        >
          Load Excel File
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.position)}
          strategy={verticalListSortingStrategy}
        >
          <Table
            components={{
              body: {
                row: Row,
              },
            }}
            columns={columns}
            dataSource={items}
            pagination={false}
            rowKey="position"
          />
        </SortableContext>
      </DndContext>
      <ExcelUploadModal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onApply={handleApplyExcelData}
      />
    </>
  );
};

export default MakeInquiryTable;
