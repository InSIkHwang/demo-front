import React, { Dispatch, SetStateAction } from "react";
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

import { CSSProperties } from "styled-components";

const { Option } = Select;

interface MakeInquiryTableProps {
  items: InquiryItem[];
  handleInputChange: (index: number, key: string, value: any) => void;
  handleItemCodeChange: (index: number, value: string) => void;
  itemCodeOptions: { value: string }[];
  handleDelete: (index: number) => void;
  setIsDuplicate: Dispatch<SetStateAction<boolean>>;
  setItems: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
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
    ...(isDragging ? { position: "relative", zIndex: 9999 } : {}),
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
}: MakeInquiryTableProps) => {
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
    if (!value.trim()) {
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

  const columns = [
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
      title: "품목코드",
      dataIndex: "itemCode",
      key: "itemCode",
      render: (text: string, record: InquiryItem, index: number) =>
        record.itemType === "ITEM" ? (
          <AutoComplete
            value={text}
            onChange={(value) => handleItemCodeChange(index, value)}
            options={itemCodeOptions}
          >
            <Input
              style={{
                borderColor: checkDuplicate("itemCode", text, index)
                  ? "red"
                  : "#d9d9d9", // 중복 시 배경색 빨간색
              }}
            />
          </AutoComplete>
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
      title: "품명",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string, record: InquiryItem, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "itemName", e.target.value)}
          style={{
            borderColor: checkDuplicate("itemName", text, index)
              ? "red"
              : "#d9d9d9", // 중복 시 배경색 빨간색
          }}
        />
      ),
      width: 250,
    },
    {
      title: "수량",
      dataIndex: "qty",
      key: "qty",
      render: (text: number, record: InquiryItem, index: number) => (
        <Input
          type="number"
          value={text}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            handleInputChange(index, "qty", isNaN(value) ? 0 : value);
          }}
        />
      ),
      width: 100,
    },
    {
      title: "단위",
      dataIndex: "unit",
      key: "unit",
      render: (text: string, record: InquiryItem, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "unit", e.target.value)}
        />
      ),
      width: 100,
    },
    {
      title: "비고",
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
  );
};

export default MakeInquiryTable;
