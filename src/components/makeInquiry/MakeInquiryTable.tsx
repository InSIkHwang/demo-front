import React, {
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Table, AutoComplete, Input, Select, Button, notification } from "antd";
import {
  DeleteOutlined,
  FileExcelOutlined,
  ExportOutlined,
} from "@ant-design/icons";
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
import { handleExport } from "../../api/api";

const { Option } = Select;

interface DuplicateState {
  code: boolean;
  name: boolean;
  all: boolean;
}

interface MakeInquiryTableProps {
  items: InquiryItem[];
  handleInputChange: (index: number, key: string, value: any) => void;
  handleItemCodeChange: (index: number, value: string) => void;
  itemCodeOptions: { value: string; key: string; label: string }[];
  handleDelete: (index: number) => void;
  setIsDuplicate: Dispatch<SetStateAction<boolean>>;
  setItems: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
  addItem: () => void;
  updateItemId: (index: number, itemId: number | null) => void;
  customerInquiryId: number;
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
  updateItemId,
  customerInquiryId,
}: MakeInquiryTableProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [unitOptions, setUnitOptions] = useState<string[]>(["PCS", "SET"]);
  const [duplicateStates, setDuplicateStates] = useState<{
    [key: string]: DuplicateState;
  }>({});

  const handleApplyExcelData = (mappedItems: InquiryItem[]) => {
    setItems((prevItems) => [
      ...prevItems,
      ...mappedItems.map((item, idx) => ({
        ...item,
        position: prevItems.length + idx + 1,
      })),
    ]);
    setIsModalVisible(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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

  const checkDuplicates = (
    key: string,
    value: string,
    index: number,
    items: any[]
  ) => {
    // 빈 값인 경우 false 반환
    if (!(value + "")?.trim()) {
      return false;
    }

    // 값이 같은지 검사하고, 현재 인덱스를 제외한 다른 인덱스와 비교
    return items.some((item, idx) => item[key] === value && idx !== index);
  };

  const getDuplicateStates = useCallback((items: any[]) => {
    return items.reduce((acc, item, index) => {
      const isDuplicateCode = checkDuplicates(
        "itemCode",
        item.itemCode,
        index,
        items
      );
      const isDuplicateName = checkDuplicates(
        "itemName",
        item.itemName,
        index,
        items
      );

      if (isDuplicateCode || isDuplicateName) {
        acc[item.position] = {
          code: isDuplicateCode,
          name: isDuplicateName,
          all: isDuplicateCode || isDuplicateName,
        };
      }
      return acc;
    }, {} as { [key: string]: DuplicateState });
  }, []);

  useEffect(() => {
    const newDuplicateStates: {
      [key: string]: { code: boolean; name: boolean; all: boolean };
    } = getDuplicateStates(items);

    // 중첩된 객체 내에 하나라도 true가 있으면 true 반환
    const hasDuplicate = Object.values(newDuplicateStates).some((state) =>
      Object.values(state).some((value) => value === true)
    );

    setDuplicateStates(newDuplicateStates);
    setIsDuplicate(hasDuplicate);
  }, [getDuplicateStates, items, setIsDuplicate]);

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
    setUnitOptions((prevOptions) =>
      prevOptions.includes(value) ? prevOptions : [...prevOptions, value]
    );
  };

  const applyUnitToAllRows = (selectedUnit: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        unit: selectedUnit,
      }))
    );
  };

  const handleButtonClick = async () => {
    try {
      // 선택한 파일들의 이름을 서버로 전송
      const response = await handleExport(customerInquiryId);

      // 사용자가 경로를 설정하여 파일을 다운로드할 수 있도록 설정
      const link = document.createElement("a");
      link.href = response; // 서버에서 받은 파일 경로
      link.download = "exported_file.xlsx"; // 사용자에게 보여질 파일 이름
      link.click(); // 다운로드 트리거

      notification.success({
        message: "Export Success",
        description: "Excel file exported successfully.",
      });
    } catch (error) {
      notification.error({
        message: "Export Failed",
        description: "Failed to export the Excel file.",
      });
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "No.",
      dataIndex: "position",
      key: "position",
      render: (text: string) => <span>{text}</span>,
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
              value={record.itemCode}
              onChange={(value) => handleItemCodeChange(index, value)}
              options={itemCodeOptions.map((option) => ({
                ...option,
                value: option.value,
                key: option.key,
                label: option.label,
              }))}
              onSelect={(value: string, option: any) => {
                const itemId = option.itemId; // AutoComplete의 옵션에서 itemId를 가져옴
                updateItemId(index, itemId); // itemId로 아이템 업데이트
                handleInputChange(index, "itemCode", value); // itemCode 업데이트
                handleInputChange(index, "itemName", option.name); // itemName 업데이트
              }}
              dropdownStyle={{ width: 250 }}
            >
              <Input
                style={{
                  borderColor: duplicateStates[record.position]?.code
                    ? "#faad14"
                    : "#d9d9d9",
                }}
              />
            </AutoComplete>
            {duplicateStates[record.position]?.code && (
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
            onChange={(e) => {
              handleInputChange(index, "itemName", e.target.value);
              updateItemId(index, null);
            }}
            style={{
              borderColor: duplicateStates[record.position]?.name
                ? "#faad14"
                : "#d9d9d9",
            }}
          />
          {duplicateStates[record.position]?.name && (
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
          onClick={() => {
            handleDelete(index);
            const newDuplicateStates = getDuplicateStates(items);

            setDuplicateStates(newDuplicateStates);
            setIsDuplicate(Object.values(newDuplicateStates).includes(true));
          }}
        />
      ),
      width: 80,
    },
  ];

  return (
    <>
      <div>
        <Button
          type="dashed"
          style={{ margin: "20px 5px" }}
          onClick={() => setIsModalVisible(true)}
          icon={<FileExcelOutlined />}
        >
          Load Excel File
        </Button>
        <Button
          type="dashed"
          style={{ margin: "20px 5px" }}
          icon={<ExportOutlined />}
          onClick={handleButtonClick}
        >
          Export Excel
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
      <Button type="primary" onClick={addItem} style={{ margin: "20px 5px" }}>
        Add item
      </Button>
      <ExcelUploadModal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onApply={handleApplyExcelData}
      />
    </>
  );
};

export default MakeInquiryTable;
