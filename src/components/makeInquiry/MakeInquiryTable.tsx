import React, {
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Table, AutoComplete, Input, Select, Button, notification } from "antd";
import {
  DeleteOutlined,
  FileExcelOutlined,
  ExportOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { InquiryItem } from "../../types/types";
import ExcelUploadModal from "../ExcelUploadModal";
import { ColumnsType } from "antd/es/table";
import { handleExport } from "../../api/api";
import styled from "styled-components";
import { TextAreaRef } from "antd/es/input/TextArea";

const { Option } = Select;

const CustomTable = styled(Table)`
  .ant-table-cell {
    text-align: center !important;
  }

  .ant-table-cell-row-hover {
    background-color: #e7e7e7 !important;
  }

  .even-row {
    background-color: #ffffff;
    &:hover {
      background-color: #e7e7e7;
    }
  }
  .odd-row {
    background-color: #f0f0f0;
    &:hover {
      background-color: #e7e7e7;
    }
  }
`;

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
  updateItemId: (index: number, itemId: number | null) => void;
  customerInquiryId: number;
}

const MakeInquiryTable = ({
  items,
  handleInputChange,
  handleItemCodeChange,
  itemCodeOptions,
  handleDelete,
  setIsDuplicate,
  setItems,
  updateItemId,
  customerInquiryId,
}: MakeInquiryTableProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [unitOptions, setUnitOptions] = useState<string[]>(["PCS", "SET"]);
  const [duplicateStates, setDuplicateStates] = useState<{
    [key: string]: DuplicateState;
  }>({});
  const dataSource = useMemo(() => items, [items]);
  const inputRefs = useRef<(TextAreaRef | null)[][]>([]);

  // 공통 데이터 처리 함수
  const updateItems = (
    mappedItems: InquiryItem[],
    shouldOverwrite: boolean
  ) => {
    if (!Array.isArray(mappedItems)) {
      console.error("mappedItems is not an array");
      return;
    }

    setItems((prevItems) => {
      if (shouldOverwrite) {
        // 덮어쓰기 모드
        return mappedItems.map((item, idx) => ({
          ...item,
          position: idx + 1, // 덮어쓰기일 경우 새롭게 인덱스 지정
        }));
      } else {
        // 추가 모드
        return [
          ...prevItems,
          ...mappedItems.map((item, idx) => ({
            ...item,
            position: prevItems.length + idx + 1, // 기존 데이터에 추가
          })),
        ];
      }
    });

    setIsModalVisible(false); // 모달 닫기
  };

  // 데이터를 추가하는 함수
  const handleApplyExcelData = (mappedItems: InquiryItem[]) => {
    updateItems(mappedItems, false); // false는 추가 모드를 의미
  };

  // 데이터를 덮어쓰는 함수
  const handleOverwriteExcelData = (mappedItems: InquiryItem[]) => {
    updateItems(mappedItems, true); // true는 덮어쓰기 모드를 의미
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      const itemTypeMap: Record<string, string> = {
        "1": "MAKER",
        "2": "TYPE",
        "3": "DESC",
        "4": "ITEM",
      };
      if (itemTypeMap[e.key]) {
        handleInputChange(index, "itemType", itemTypeMap[e.key]);
      }
    },
    [handleInputChange] // handleInputChange가 변경되면 handleKeyDown도 변경됨
  );

  const checkDuplicates = useCallback(
    (key: string, value: string, index: number, items: any[]) => {
      // 빈 값인 경우 false 반환
      if (!(value + "")?.trim()) {
        return false;
      }

      // 값이 같은지 검사하고, 현재 인덱스를 제외한 다른 인덱스와 비교
      return items.some((item, idx) => item[key] === value && idx !== index);
    },
    [] // 의존성이 필요 없다면 빈 배열로 설정
  );

  const getDuplicateStates = useCallback(
    (items: any[]) => {
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
    },
    [checkDuplicates]
  );

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleUnitBlur = (index: number, value: string) => {
    handleInputChange(index, "unit", value);
    setUnitOptions((prevOptions) =>
      prevOptions.includes(value) ? prevOptions : [...prevOptions, value]
    );
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const applyUnitToAllRows = (selectedUnit: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        unit: selectedUnit,
      }))
    );
  };

  const handleExportButtonClick = async () => {
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

  const handleNextRowKeyDown = (
    e: React.KeyboardEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLDivElement
    >,
    rowIndex: number,
    columnIndex: number
  ) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); // 방향키 기본 동작을 막음
      if (
        e.key === "ArrowDown" &&
        inputRefs.current[rowIndex + 1]?.[columnIndex]
      ) {
        inputRefs.current[rowIndex + 1][columnIndex]?.focus(); // 다음 행의 Input으로 포커스 이동
      } else if (
        e.key === "ArrowUp" &&
        inputRefs.current[rowIndex - 1]?.[columnIndex]
      ) {
        inputRefs.current[rowIndex - 1][columnIndex]?.focus(); // 이전 행의 Input으로 포커스 이동
      }
    }
  };

  const handleAddItem = useCallback(
    (index: number) => {
      const newItem: InquiryItem = {
        itemCode: "",
        itemType: "ITEM",
        unit: "",
        itemName: "",
        qty: 0,
        itemRemark: "",
        position: index + 2,
      };

      setItems((prevItems) => {
        const newItems = [
          ...prevItems.slice(0, index + 1),
          newItem,
          ...prevItems.slice(index + 1).map((item, idx) => ({
            ...item,
            position: index + 3 + idx,
          })),
        ];
        return newItems;
      });
    },
    [setItems]
  );

  const columns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "No.",
        dataIndex: "no",
        key: "no",
        width: 0,
        render: (_: any, record: any, index: number) => {
          const filteredIndex = dataSource
            .filter((item: any) => item.itemType === "ITEM")
            .indexOf(record);

          return record.itemType === "ITEM" ? (
            <span>{filteredIndex + 1}</span>
          ) : null;
        },
      },
      {
        title: "PartNo",
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
                dropdownStyle={{ width: 400 }}
                style={{ width: "100%" }}
                ref={(el) => {
                  if (!inputRefs.current[index]) {
                    inputRefs.current[index] = [];
                  }
                  inputRefs.current[index][1] = el;
                }}
                onKeyDown={(e) => handleNextRowKeyDown(e, index, 1)}
              >
                <Input.TextArea
                  autoSize={{ minRows: 1, maxRows: 10 }}
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
          ) : (
            <Input
              readOnly
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][1] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 1)}
            ></Input>
          ),
        width: 300,
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
        width: 110,
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
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][2] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 2)}
              value={text}
              onBlur={(e) => handleUnitBlur(index, e.target.value)}
              onChange={(e) => handleInputChange(index, "unit", e.target.value)}
            />
          ) : (
            <Input
              readOnly
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][2] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 2)}
            ></Input>
          ),
        width: 110,
      },
      {
        title: "Name",
        dataIndex: "itemName",
        key: "itemName",
        render: (text: string, record: InquiryItem, index: number) => (
          <div
            style={{
              whiteSpace: "normal",
              wordWrap: "break-word",
              wordBreak: "break-all",
            }}
          >
            <Input.TextArea
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][3] = el;
              }}
              value={text}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 3)}
              onChange={(e) => {
                handleInputChange(index, "itemName", e.target.value);
                updateItemId(index, null);
              }}
              style={{
                borderColor: duplicateStates[record.position]?.name
                  ? "#faad14"
                  : "#d9d9d9",
              }}
              autoSize={{ minRows: 1, maxRows: 10 }} // 최소 1행, 최대 4행으로 설정
            />
            {duplicateStates[record.position]?.name && (
              <div style={{ color: "#faad14", marginTop: "5px" }}>
                duplicate name.
              </div>
            )}
          </div>
        ),
        width: 500,
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
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][4] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 4)}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                handleInputChange(index, "qty", isNaN(value) ? 0 : value);
              }}
            />
          ) : (
            <Input
              readOnly
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][4] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 4)}
            ></Input>
          ),
        width: 80,
      },
      {
        title: "Remark",
        dataIndex: "itemRemark",
        key: "itemRemark",
        render: (text: string, record: InquiryItem, index: number) => (
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 10 }}
            value={text}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][5] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 5)}
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
          <div>
            <Button
              icon={<PlusCircleOutlined />}
              type="default"
              style={{ marginRight: 10 }}
              onClick={() => handleAddItem(index)}
            />

            <Button
              icon={<DeleteOutlined />}
              type="default"
              onClick={() => {
                handleDelete(index);
                const newDuplicateStates = getDuplicateStates(items);
                setDuplicateStates(newDuplicateStates);
                setIsDuplicate(
                  Object.values(newDuplicateStates).includes(true)
                );
              }}
            />
          </div>
        ),
        width: 120, // 버튼 크기에 맞춰 조정
      },
    ],
    [
      applyUnitToAllRows,
      unitOptions,
      dataSource,
      itemCodeOptions,
      duplicateStates,
      handleItemCodeChange,
      updateItemId,
      handleInputChange,
      handleKeyDown,
      handleUnitBlur,
      handleAddItem,
      handleDelete,
      getDuplicateStates,
      items,
      setIsDuplicate,
    ]
  );

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
          onClick={handleExportButtonClick}
        >
          Export Excel
        </Button>
      </div>
      <CustomTable
        rowClassName={(record, index) =>
          index % 2 === 0 ? "even-row" : "odd-row"
        }
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        rowKey="position"
        scroll={{ y: 600 }}
        virtual
      />
      <Button
        type="primary"
        style={{ margin: "20px 5px" }}
        onClick={() => handleAddItem(items.length - 1)} // 마지막 인덱스에 새 품목 추가
      >
        Add item
      </Button>
      <ExcelUploadModal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onApply={handleApplyExcelData}
        onOverWrite={handleOverwriteExcelData}
        currency={1}
        type={"inquiry"}
      />
    </>
  );
};

export default MakeInquiryTable;
