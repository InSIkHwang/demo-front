import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Checkbox,
  Tooltip,
  InputRef,
  TableColumnType,
  message,
} from "antd";
import {
  PlusCircleOutlined,
  DeleteOutlined,
  ZoomOutOutlined,
  ZoomInOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import {
  ComplexInquiryItemDetail,
  ComplexInquirySupplier,
} from "../../types/types";
import ExcelUploadModal from "../ExcelUploadModal";
import { TextAreaRef } from "antd/es/input/TextArea";

const { Option } = Select;

type RefType = InputRef | TextAreaRef;

interface TableProps {
  $zoomLevel?: number;
}

const CustomTable = styled(Table<ComplexInquiryItemDetail>)<TableProps>`
  // 기본 스타일
  .ant-table * {
    font-size: ${(props) => `${11 * (props.$zoomLevel || 1)}px`};
  }

  // 기존 트랜지션 스타일 제거 (중복 방지)
  .ant-table-row,
  .ant-table-row *,
  .ant-table-cell *,
  .ant-table-cell-row-hover {
    transition: none;
  }

  // 모든 테이블 셀 관련 요소에 동일한 트랜지션 적용
  .ant-table-cell,
  .ant-table-cell *,
  .ant-table-cell-fix-left,
  .ant-table-cell-fix-left-last,
  .ant-table-cell-row-hover,
  .ant-table-row,
  .ant-table-row * {
    transition: all 0.2s ease !important;
  }

  // 셀 스타일
  .ant-table-cell {
    padding: ${(props) =>
      `${12 * (props.$zoomLevel || 1)}px ${
        2 * (props.$zoomLevel || 1)
      }px`} !important;
    text-align: center !important;
    align-self: center;
    border: none !important;
  }

  // 하이라이트 셀
  .highlight-cell {
    font-weight: bold !important;
    .ant-input-group-addon,
    .ant-input-outlined {
      border-color: #007bff !important;
      font-weight: bold !important;
    }
  }

  // 애드온 패딩
  .ant-input-group-addon,
  .ant-input-number-group-addon {
    padding: 0 2px !important;
  }

  // 고정 셀 스타일
  .ant-table-cell-fix-left {
    background: inherit !important;
    z-index: 2 !important;
    transition: background-color 0.2s ease !important;
    &-last {
      box-shadow: 14px 0 10px -10px rgba(0, 0, 0, 0.05) !important;
    }
  }

  tr .ant-table-cell-fix-left {
    background: #fafafa !important;
  }

  // 행 타입별 스타일 믹스인
  ${(["item", "maker", "type", "desc", "remark"] as const).map((type) => {
    const colors: Record<typeof type, [string, string]> = {
      item: ["#ffffff", "#f0f0f0"],
      maker: ["#e3f2ff", "#c8e4ff"],
      type: ["#fffef0", "#fffdde"],
      desc: ["#fff5e0", "#ffe9bb"],
      remark: ["#eaffe6", "#dcffd1"],
    };

    return `
      .${type}-row {
          background-color: ${colors[type][0]} !important;
        &:hover, .ant-table-cell-row-hover {
          background-color: ${colors[type][1]} !important;
        }
      }
    `;
  })}

  // 커스텀 인풋 스타일
  .custom-input {
    .ant-input {
      background-color: #ffffe0 !important;
    }
    .ant-input-group-addon {
      background-color: #dff4ff !important;
    }
  }

  .ant-table-row .ant-table-cell-fix-left {
    background: inherit !important;
    z-index: 2;
    &-last {
      box-shadow: 14px 0 10px -10px rgba(0, 0, 0, 0.05) !important;
    }
  }
`;

interface ComplexInquiryTableProps {
  items: ComplexInquiryItemDetail[];
  setItems: React.Dispatch<React.SetStateAction<ComplexInquiryItemDetail[]>>;
  uniqueSuppliers: {
    code: string;
    communicationLanguage: string;
    email: string | null;
    id: number;
    korName: string;
    name: string;
    supplierRemark: string;
  }[];
  currency: number;
  documentStatus: string;
}

const ComplexInquiryTable = ({
  items,
  setItems,
  uniqueSuppliers,
  currency,
  documentStatus,
}: ComplexInquiryTableProps) => {
  const [unitOptions, setUnitOptions] = useState<string[]>(["PCS", "SET"]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isExcelModalVisible, setIsExcelModalVisible] = useState(false);
  const inputRefs = useRef<(RefType | null)[][]>([]);
  const [startItemNo, setStartItemNo] = useState<string>("");
  const [endItemNo, setEndItemNo] = useState<string>("");

  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 1.5;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const IndexNoCell = React.memo(
    ({ record, index, items, handleInputChange }: any) => {
      const [localValue, setLocalValue] = useState(record.indexNo);

      // record.indexNo가 변경될 때 로컬 상태 업데이트
      useEffect(() => {
        setLocalValue(record.indexNo);
      }, [record.indexNo]);

      // ITEM 타입일 때 자동 번호 부여 로직
      useEffect(() => {
        if (record.itemType === "ITEM") {
          const filteredIndex = items
            .filter((item: any) => item.itemType === "ITEM")
            .indexOf(record);
          const itemNo = (filteredIndex + 1).toString();

          if (record.indexNo !== itemNo) {
            handleInputChange(index, "indexNo", itemNo);
          }
        }
      }, [record, index, items, handleInputChange]);

      if (record.itemType === "DASH") {
        return (
          <Input
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value);
            }}
            onBlur={() => {
              handleInputChange(index, "indexNo", localValue);
            }}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][1] = el;
            }}
            onKeyDown={(e) => handleKeyDown(e, index, 1)}
          />
        );
      }

      if (record.itemType !== "ITEM" && record.itemType !== "DASH") {
        return null;
      }

      return <span>{record.indexNo}</span>;
    }
  );

  // 공통 데이터 처리 함수
  const updateDataSource = (
    mappedItems: ComplexInquiryItemDetail[],
    shouldOverwrite: boolean
  ) => {
    if (!Array.isArray(mappedItems)) {
      console.error("mappedItems is not an array");
      return;
    }

    setItems(
      shouldOverwrite
        ? mappedItems.map((item, idx) => ({
            ...item,
            position: idx + 1,
            suppliers: [],
          }))
        : [
            ...items,
            ...mappedItems.map((item, idx) => ({
              ...item,
              position: items.length + idx + 1,
              suppliers: [],
            })),
          ]
    );

    setIsExcelModalVisible(false);
  };

  // 데이터를 추가하는 함수
  const handleApplyExcelData = (mappedItems: ComplexInquiryItemDetail[]) => {
    updateDataSource(mappedItems, false); // 추가하는 작업, 덮어쓰지 않음
  };

  // 데이터를 덮어쓰는 함수
  const handleOverwriteExcelData = (
    mappedItems: ComplexInquiryItemDetail[]
  ) => {
    updateDataSource(mappedItems, true); // 덮어쓰기 작업
  };

  // 전체 선택/해제 처리 함수
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setCheckedItems(items.map((_, index) => index));
    } else {
      setCheckedItems([]);
    }
  };

  // 개별 체크박스 처리 함수
  const handleCheck = (index: number, checked: boolean) => {
    if (checked) {
      setCheckedItems([...checkedItems, index]);
    } else {
      setCheckedItems(checkedItems.filter((i) => i !== index));
    }
  };

  // 모든 행에 단위 적용 함수
  const applyUnitToAllRows = (selectedUnit: string) => {
    if (!items) return;

    const updatedItems: ComplexInquiryItemDetail[] = items.map((item) => ({
      ...item,
      unit: selectedUnit,
    }));
    setItems(updatedItems);
  };

  // 단위 입력 완료 시 단위 업데이트 함수
  const handleUnitBlur = (index: number, value: string) => {
    handleInputChange(index, "unit", value);
    setUnitOptions((prevOptions) =>
      prevOptions.includes(value) ? prevOptions : [...prevOptions, value]
    );
  };

  // 모든 행에 마진 적용 함수
  const applyMarginToAllRows = (margin: number) => {
    if (!items) return;

    const updatedItems: ComplexInquiryItemDetail[] = items.map((item) => ({
      ...item,
      salesPriceGlobal: 0,
      salesPriceKRW: 0,
      margin: margin,
    }));
    setItems(updatedItems);
  };

  // 모든 행에 납기일 적용 함수
  const applyDeliveryToAllRows = (deliveryValue: number) => {
    if (!items) return;

    const updatedItems = items.map((item) => ({
      ...item,
      deliveryDate: deliveryValue,
    }));

    setItems(updatedItems);
  };

  // 입력 값 변경 함수
  const handleInputChange = useCallback(
    (index: number, key: keyof ComplexInquiryItemDetail, value: any) => {
      const newItems = [...items];

      if (
        (key === "itemType" && value !== "ITEM" && value !== "DASH") ||
        (key === "itemRemark" && value)
      ) {
        newItems[index] = {
          ...newItems[index],
          [key]: value,
          purchasePriceKRW: 0,
          purchasePriceGlobal: 0,
          purchaseAmountKRW: 0,
          purchaseAmountGlobal: 0,
          salesPriceKRW: 0,
          salesPriceGlobal: 0,
          salesAmountKRW: 0,
          salesAmountGlobal: 0,
          margin: 0,
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          [key]: value,
        };
      }

      setItems(newItems);
    },
    [items, setItems]
  );

  // 아이템 추가 함수
  const handleAddItem = useCallback(
    (index: number) => {
      const newItem: ComplexInquiryItemDetail = {
        itemCode: "",
        itemType: "ITEM",
        unit: "",
        itemName: "",
        qty: 0,
        itemRemark: "",
        position: items.length + 1,
        indexNo: null,
        salesPriceKRW: 0,
        salesPriceGlobal: 0,
        salesAmountKRW: 0,
        salesAmountGlobal: 0,
        margin: 0,
        purchasePriceKRW: 0,
        purchasePriceGlobal: 0,
        purchaseAmountKRW: 0,
        purchaseAmountGlobal: 0,
        deliveryDate: 0,
        suppliers: [],
        confirmSupplier: null,
      };

      const updatedItems = [
        ...items.slice(0, index + 1),
        newItem,
        ...items.slice(index + 1),
      ].map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));

      setItems(updatedItems);
    },
    [items, setItems]
  );

  // 아이템 삭제 함수
  const handleDeleteItem = useCallback(
    (index: number) => {
      const updatedItems = items
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({
          ...item,
          position: idx + 1,
        }));
      setItems(updatedItems);
    },
    [items, setItems]
  );

  // 단축키 핸들러
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    rowIndex: number,
    columnIndex: number
  ) => {
    const totalColumns = columns.length;

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

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        // 이전 행부터 역순으로 검색하여 포커스 가능한 입력 요소 찾기
        for (let i = rowIndex - 1; i >= 0; i--) {
          if (inputRefs.current[i]?.[columnIndex]) {
            inputRefs.current[i][columnIndex]?.focus();
            break;
          }
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        // 다음 행부터 순차적으로 검색하여 포커스 가능한 입력 요소 찾기
        for (let i = rowIndex + 1; i < inputRefs.current.length; i++) {
          if (inputRefs.current[i]?.[columnIndex]) {
            inputRefs.current[i][columnIndex]?.focus();
            break;
          }
        }
        break;

      case "ArrowLeft":
        if (e.currentTarget.selectionStart === 0) {
          e.preventDefault();
          let prevColumn = columnIndex - 1;
          while (prevColumn >= 0) {
            if (inputRefs.current[rowIndex]?.[prevColumn]) {
              inputRefs.current[rowIndex][prevColumn]?.focus();
              break;
            }
            prevColumn--;
          }
        }
        break;

      case "ArrowRight":
        if (e.currentTarget.selectionEnd === e.currentTarget.value.length) {
          e.preventDefault();
          let nextColumn = columnIndex + 1;
          while (nextColumn < totalColumns) {
            if (inputRefs.current[rowIndex]?.[nextColumn]) {
              inputRefs.current[rowIndex][nextColumn]?.focus();
              break;
            }
            nextColumn++;
          }
        }
        break;
    }
  };

  // 범위 매출처 추가 함수
  const handleRangeSupplierAdd = (selectedId: number) => {
    if (!startItemNo || !endItemNo) {
      message.error("Please enter both start and end item numbers.");
      return;
    }

    // 시작과 끝 아이템의 인덱스 찾기
    const startIndex = items.findIndex((item) => item.indexNo === startItemNo);
    const endIndex = items.findIndex((item) => item.indexNo === endItemNo);

    if (startIndex === -1 || endIndex === -1) {
      message.error(
        "Could not find the item corresponding to the entered number."
      );
      return;
    }

    if (startIndex > endIndex) {
      message.error("The start number must be before the end number.");
      return;
    }

    const newItems = [...items];

    // 시작과 끝 인덱스 사이의 모든 아이템에 대해 처리
    for (let i = startIndex; i <= endIndex; i++) {
      const existingSuppliers = newItems[i].suppliers || [];

      // 이미 선택된 supplier가 아닌 경우에만 추가
      if (!existingSuppliers.some((s) => s.supplierId === selectedId)) {
        const selectedSupplier = uniqueSuppliers.find(
          (s) => s.id === selectedId
        );
        if (selectedSupplier) {
          newItems[i] = {
            ...newItems[i],
            suppliers: [
              ...existingSuppliers,
              {
                supplierId: selectedId,
                inquiryItemDetailId: null,
                code: selectedSupplier.code || "",
                companyName: selectedSupplier.name || "",
                korCompanyName: selectedSupplier.korName || "",
                representative: null,
                email: selectedSupplier.email || "",
                communicationLanguage:
                  selectedSupplier.communicationLanguage || "KOR",
                supplierRemark: selectedSupplier.supplierRemark || "",
              },
            ],
          };
        }
      }
    }

    setItems(newItems);
    setStartItemNo("");
    setEndItemNo("");
    message.success(
      `${startItemNo} - ${endItemNo} items have been added to suppliers.`
    );
  };

  // 테이블 열 정의
  const columns: TableColumnType<ComplexInquiryItemDetail>[] = [
    {
      title: "Actions",
      key: "actions",
      width: 70 * zoomLevel,
      render: (_: any, __: any, index: number) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            type="text"
            icon={<PlusCircleOutlined />}
            onClick={() => handleAddItem(index)}
          />
          {items.length > 1 && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteItem(index)}
            />
          )}
        </div>
      ),
    },
    {
      title: "No.",
      dataIndex: "indexNo",
      key: "indexNo",
      width: 70 * zoomLevel,
      fixed: "left",
      render: (text: string, record: any, index: number) => (
        <IndexNoCell
          record={record}
          index={index}
          items={items}
          handleInputChange={handleInputChange}
        />
      ),
    },
    {
      title: "Type",
      dataIndex: "itemType",
      key: "itemType",
      width: 80 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Select
          value={text}
          style={{ width: "100%" }}
          onChange={(value) => handleInputChange(index, "itemType", value)}
        >
          {["MAKER", "TYPE", "ITEM", "DESC", "DASH"].map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "PartNo",
      dataIndex: "itemCode",
      key: "itemCode",
      width: 115 * zoomLevel,
      fixed: "left",
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "itemCode", e.target.value)}
          ref={(el) => {
            if (!inputRefs.current[index]) {
              inputRefs.current[index] = [];
            }
            inputRefs.current[index][3] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, 3)}
        />
      ),
    },
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
      width: 200 * zoomLevel,
      fixed: "left",
      render: (text: string, _: any, index: number) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleInputChange(index, "itemName", e.target.value)}
          autoSize={{ minRows: 1, maxRows: 3 }}
          ref={(el) => {
            if (!inputRefs.current[index]) {
              inputRefs.current[index] = [];
            }
            inputRefs.current[index][4] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, 4)}
        />
      ),
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: 60 * zoomLevel,
      render: (text: number, _: any, index: number) => (
        <Input
          type="number"
          value={
            items[index].itemType !== "ITEM" && items[index].itemType !== "DASH"
              ? 0
              : text
          }
          onChange={(e) =>
            handleInputChange(index, "qty", Number(e.target.value))
          }
          ref={(el) => {
            if (!inputRefs.current[index]) {
              inputRefs.current[index] = [];
            }
            inputRefs.current[index][5] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, 5)}
        />
      ),
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
              <Select.Option key={unit} value={unit}>
                {unit}
              </Select.Option>
            ))}
          </Select>
        </div>
      ),
      dataIndex: "unit",
      key: "unit",
      width: 75 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          style={{ width: "100%" }}
          onBlur={(e) => handleUnitBlur(index, e.target.value)}
          onChange={(e) => handleInputChange(index, "unit", e.target.value)}
          ref={(el) => {
            if (!inputRefs.current[index]) {
              inputRefs.current[index] = [];
            }
            inputRefs.current[index][6] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, 6)}
        ></Input>
      ),
    },
    {
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      width: 150 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Input.TextArea
          value={text}
          placeholder="ex) N/A, Incl#1..."
          onChange={(e) =>
            handleInputChange(index, "itemRemark", e.target.value)
          }
          autoSize={{ minRows: 1, maxRows: 3 }}
          ref={(el) => {
            if (!inputRefs.current[index]) {
              inputRefs.current[index] = [];
            }
            inputRefs.current[index][7] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, 7)}
        />
      ),
    },
    {
      title: "Purchase Price KRW",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      width: 115 * zoomLevel,
      className: "highlight-cell",
      render: (text: string, _: any, index: number) => {
        return (items[index].itemType === "ITEM" ||
          items[index].itemType === "DASH") &&
          !items[index].itemRemark ? (
          <Input
            type="text" // number에서 text로 변경
            value={text ? Number(text).toLocaleString("ko-KR") : ""} // 천단위 구분기호 적용
            addonBefore="₩"
            className="custom-input"
            onFocus={(e) => {
              e.target.select();
              const newItems = [...items];
              newItems[index] = {
                ...newItems[index],
                purchasePriceGlobal: 0,
                purchaseAmountKRW: 0,
                purchaseAmountGlobal: 0,
              };
              setItems(newItems);
            }}
            onChange={(e) => {
              // 숫자가 아닌 문자 제거 후 숫자만 추출
              const value = e.target.value.replace(/[^\d]/g, "");
              handleInputChange(index, "purchasePriceKRW", Number(value));
            }}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][10] = el;
            }}
            onKeyDown={(e) => handleKeyDown(e, index, 10)}
          />
        ) : null;
      },
    },
    {
      title: "Purchase Price(F)",
      dataIndex: "purchasePriceGlobal",
      key: "purchasePriceGlobal",
      width: 115 * zoomLevel,
      className: "highlight-cell",
      render: (text: string, _: any, index: number) => {
        return (items[index].itemType === "ITEM" ||
          items[index].itemType === "DASH") &&
          !items[index].itemRemark ? (
          <Input
            type="text"
            value={text ? Number(text).toLocaleString("en-US") : ""}
            addonBefore="F"
            className="custom-input"
            onFocus={(e) => {
              e.target.select();
              const newItems = [...items];
              newItems[index] = {
                ...newItems[index],
                purchasePriceKRW: 0,
                purchaseAmountKRW: 0,
                purchaseAmountGlobal: 0,
              };
              setItems(newItems);
            }}
            onChange={(e) => {
              // 숫자가 아닌 문자 제거 후 숫자만 추출
              const value = e.target.value.replace(/[^\d]/g, "");
              handleInputChange(index, "purchasePriceGlobal", Number(value));
            }}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][11] = el;
            }}
            onKeyDown={(e) => handleKeyDown(e, index, 11)}
          />
        ) : null;
      },
    },
    {
      title: "Purchase Amount KRW",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) =>
        (items[index].itemType === "ITEM" ||
          items[index].itemType === "DASH") &&
        !items[index].itemRemark ? (
          <Input
            type="text"
            value={text ? Number(text).toLocaleString("ko-KR") : ""}
            readOnly
            addonBefore="₩"
          />
        ) : null,
    },
    {
      title: "Purchase Amount(F)",
      dataIndex: "purchaseAmountGlobal",
      key: "purchaseAmountGlobal",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) =>
        (items[index].itemType === "ITEM" ||
          items[index].itemType === "DASH") &&
        !items[index].itemRemark ? (
          <Input
            type="text"
            value={text ? Number(text).toLocaleString("en-US") : ""}
            readOnly
            addonBefore="F"
          />
        ) : null,
    },
    {
      title: "Sales Price KRW",
      dataIndex: "salesPriceKRW",
      key: "salesPriceKRW",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) =>
        (items[index].itemType === "ITEM" ||
          items[index].itemType === "DASH") &&
        !items[index].itemRemark ? (
          <Input
            type="text"
            value={text ? Number(text).toLocaleString("ko-KR") : ""}
            onFocus={(e) => {
              e.target.select();
              const newItems = [...items];
              newItems[index] = {
                ...newItems[index],
                salesPriceGlobal: 0,
                salesAmountKRW: 0,
                salesAmountGlobal: 0,
                margin: 0,
              };
              setItems(newItems);
            }}
            onChange={(e) =>
              handleInputChange(index, "salesPriceKRW", Number(e.target.value))
            }
            addonBefore="₩"
            className="custom-input"
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][8] = el;
            }}
            onKeyDown={(e) => handleKeyDown(e, index, 8)}
          />
        ) : null,
    },
    {
      title: "Sales Price(F)",
      dataIndex: "salesPriceGlobal",
      key: "salesPriceGlobal",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) =>
        (items[index].itemType === "ITEM" ||
          items[index].itemType === "DASH") &&
        !items[index].itemRemark ? (
          <Input
            type="text"
            value={text ? Number(text).toLocaleString("en-US") : ""}
            addonBefore="F"
            className="custom-input"
            onFocus={(e) => {
              e.target.select();
              const newItems = [...items];
              newItems[index] = {
                ...newItems[index],
                salesPriceKRW: 0,
                salesAmountKRW: 0,
                salesAmountGlobal: 0,
                margin: 0,
              };
              setItems(newItems);
            }}
            onChange={(e) =>
              handleInputChange(
                index,
                "salesPriceGlobal",
                Number(e.target.value)
              )
            }
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][9] = el;
            }}
            onKeyDown={(e) => handleKeyDown(e, index, 9)}
          />
        ) : null,
    },
    {
      title: "Sales Amount KRW",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) =>
        (items[index].itemType === "ITEM" ||
          items[index].itemType === "DASH") &&
        !items[index].itemRemark ? (
          <Input
            type="text"
            value={text ? Number(text).toLocaleString("ko-KR") : ""}
            readOnly
            addonBefore="₩"
          />
        ) : null,
    },
    {
      title: "Sales Amount(F)",
      dataIndex: "salesAmountGlobal",
      key: "salesAmountGlobal",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) =>
        (items[index].itemType === "ITEM" ||
          items[index].itemType === "DASH") &&
        !items[index].itemRemark ? (
          <Input
            type="text"
            value={text ? Number(text).toLocaleString("en-US") : ""}
            readOnly
            addonBefore="F"
          />
        ) : null,
    },
    {
      title: (
        <div>
          <Input
            placeholder="Margin"
            onBlur={(e) => applyMarginToAllRows(Number(e.target.value))}
            style={{ width: "100%" }}
          ></Input>
        </div>
      ),
      dataIndex: "margin",
      key: "margin",
      width: 60 * zoomLevel,
      render: (text: string, _: any, index: number) =>
        (items[index].itemType === "ITEM" ||
          items[index].itemType === "DASH") &&
        !items[index].itemRemark ? (
          <Input
            type="string" // number에서 string으로 변경
            value={text}
            className="custom-input"
            addonAfter={"%"}
            onFocus={(e) => {
              e.target.select();
              const newItems = [...items];
              newItems[index] = {
                ...newItems[index],
                salesPriceGlobal: 0,
                salesPriceKRW: 0,
                salesAmountKRW: 0,
                salesAmountGlobal: 0,
              };
              setItems(newItems);
            }}
            onChange={(e) => {
              const inputValue = e.target.value;
              // 음수 입력을 허용하는 정규식 패턴
              if (
                inputValue === "" ||
                inputValue === "-" ||
                !isNaN(Number(inputValue))
              ) {
                handleInputChange(index, "margin", inputValue);
              }
            }}
            onBlur={(e) => {
              // 포커스를 잃을 때 유효한 숫자로 변환
              const value = e.target.value;
              const processedValue = value === "-" ? 0 : Number(value) || 0;
              handleInputChange(index, "margin", processedValue);
            }}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][12] = el;
            }}
            onKeyDown={(e) => handleKeyDown(e, index, 12)}
          />
        ) : null,
    },
    {
      title: (
        <div>
          <Input
            placeholder="Delivery"
            onBlur={(e) => applyDeliveryToAllRows(Number(e.target.value))}
            style={{ width: "100%" }}
          ></Input>
        </div>
      ),
      dataIndex: "deliveryDate",
      key: "deliveryDate",
      width: 60 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Input
          type="string"
          value={text}
          className="custom-input"
          onFocus={(e) => {
            e.target.select();
            const newItems = [...items];
            newItems[index] = {
              ...newItems[index],
              deliveryDate: 0,
            };
            setItems(newItems);
          }}
          onChange={(e) => {
            const inputValue = e.target.value;
            // 숫자만 입력 가능하도록
            if (inputValue === "" || !isNaN(Number(inputValue))) {
              handleInputChange(index, "deliveryDate", inputValue);
            }
          }}
          ref={(el) => {
            if (!inputRefs.current[index]) {
              inputRefs.current[index] = [];
            }
            inputRefs.current[index][13] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, 13)}
        />
      ),
    },
    {
      title: () => (
        <Checkbox
          checked={selectAll}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      dataIndex: "check",
      key: "check",
      width: 50 * zoomLevel,
      render: (_: any, __: any, index: number) => (
        <Checkbox
          checked={checkedItems.includes(index)}
          onChange={(e) => handleCheck(index, e.target.checked)}
        />
      ),
    },
    {
      title: () => (
        <Select
          style={{ width: "100%" }}
          placeholder="Select supplier to send email"
          value={null}
          onChange={(selectedId: number) => {
            const newItems = [...items];
            checkedItems.forEach((index) => {
              // 기존 suppliers 배열을 유지하면서 새로운 supplier 추가
              const existingSuppliers = newItems[index].suppliers || [];
              // 이미 선택된 supplier가 아닌 경우에만 추가
              if (!existingSuppliers.some((s) => s.supplierId === selectedId)) {
                newItems[index] = {
                  ...newItems[index],
                  suppliers: [
                    ...existingSuppliers,
                    {
                      supplierId: selectedId,
                      inquiryItemDetailId: null,
                      code:
                        uniqueSuppliers.find((s) => s.id === selectedId)
                          ?.code || "",
                      companyName:
                        uniqueSuppliers.find((s) => s.id === selectedId)
                          ?.name || "",
                      korCompanyName:
                        uniqueSuppliers.find((s) => s.id === selectedId)
                          ?.korName || "",
                      representative: null,
                      email:
                        uniqueSuppliers.find((s) => s.id === selectedId)
                          ?.email || "",
                      communicationLanguage:
                        uniqueSuppliers.find((s) => s.id === selectedId)
                          ?.communicationLanguage || "",
                      supplierRemark:
                        uniqueSuppliers.find((s) => s.id === selectedId)
                          ?.supplierRemark || "",
                    },
                  ],
                };
              }
            });
            setItems(newItems);
          }}
          optionLabelProp="label"
        >
          {uniqueSuppliers.map((supplier) => (
            <Option key={supplier.id} value={supplier.id} label={supplier.code}>
              {supplier.code}
            </Option>
          ))}
        </Select>
      ),
      dataIndex: "suppliers",
      key: "suppliers",
      width: 200 * zoomLevel,
      render: (suppliers: ComplexInquirySupplier[], _: any, index: number) => {
        // 초기 suppliers의 id들을 기반으로 options 생성
        const initialOptions = suppliers?.map((supplier) => ({
          id: supplier.supplierId,
          code: supplier.code,
          name: supplier.companyName,
          korName: supplier.korCompanyName,
          email: supplier.email,
          communicationLanguage: supplier.communicationLanguage,
          supplierRemark: supplier.supplierRemark,
        }));

        // uniqueSuppliers와 초기 options 합치기 (중복 제거)
        const allOptions = [...uniqueSuppliers, ...initialOptions].reduce(
          (acc, current) => {
            const x = acc.find((item) => item.id === current.id);
            if (!x) {
              return acc.concat([current]);
            }
            return acc;
          },
          [] as any[]
        );

        // allOptions 배열에서 중복 제거
        const uniqueAllOptions = Array.from(
          new Map(allOptions.map((item) => [item.id, item])).values()
        );

        return (
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Select suppliers"
            value={Array.from(new Set(suppliers.map((s) => s.supplierId)))}
            optionLabelProp="label"
            onChange={(selectedIds: number[]) => {
              const newItems = [...items];
              newItems[index] = {
                ...newItems[index],
                suppliers: selectedIds.map((id) => ({
                  supplierId: id,
                  inquiryItemDetailId: null,
                  code: uniqueAllOptions.find((s) => s.id === id)?.code || "",
                  companyName:
                    uniqueAllOptions.find((s) => s.id === id)?.name || "",
                  korCompanyName:
                    uniqueAllOptions.find((s) => s.id === id)?.korName || "",
                  representative: null,
                  email: uniqueAllOptions.find((s) => s.id === id)?.email || "",
                  communicationLanguage:
                    uniqueAllOptions.find((s) => s.id === id)
                      ?.communicationLanguage || "",
                  supplierRemark:
                    uniqueAllOptions.find((s) => s.id === id)?.supplierRemark ||
                    "",
                })),
              };
              setItems(newItems);
            }}
            optionFilterProp="children"
          >
            {uniqueAllOptions.map((supplier) => (
              <Option
                key={supplier.id}
                value={supplier.id}
                label={supplier.code}
              >
                {supplier.code}
              </Option>
            ))}
          </Select>
        );
      },
    },
    {
      ...(documentStatus !== "VENDOR_PENDING" &&
      documentStatus !== "VENDOR_SELECTED" &&
      documentStatus !== ""
        ? {
            title: () => (
              <Select
                style={{ width: "100%" }}
                placeholder="Select supplier to confirm"
                value={null}
                onChange={(selectedId: number) => {
                  const newItems = [...items];
                  checkedItems.forEach((index) => {
                    // 해당 행의 suppliers에 있는 경우에만 적용
                    if (
                      newItems[index].suppliers?.some(
                        (s) => s.supplierId === selectedId
                      )
                    ) {
                      newItems[index] = {
                        ...newItems[index],
                        confirmSupplier: {
                          supplierId: selectedId,
                        },
                      };
                    }
                  });
                  setItems(newItems);
                }}
              >
                {Array.from(
                  new Set(
                    checkedItems
                      .flatMap((index) => items[index].suppliers || [])
                      .map((supplier) => supplier.supplierId)
                  )
                ).map((supplierId) => {
                  const supplier = items
                    .flatMap((item) => item.suppliers)
                    .find((s) => s?.supplierId === supplierId);
                  return (
                    <Option key={supplierId} value={supplierId}>
                      {supplier?.companyName}
                    </Option>
                  );
                })}
              </Select>
            ),
            dataIndex: "confirmSupplierId",
            key: "confirmSupplierId",
            width: 200 * zoomLevel,
            render: (
              _: any, // confirmSupplierId 대신 사용하지 않는 파라미터로 변경
              record: ComplexInquiryItemDetail,
              index: number
            ) => (
              <Select
                style={{ width: "100%" }}
                value={record.confirmSupplier?.supplierId || null} // 수정된 부분
                onChange={(selectedId: number) => {
                  const newItems = [...items];
                  newItems[index] = {
                    ...newItems[index],
                    confirmSupplier: {
                      supplierId: selectedId,
                    },
                  };
                  setItems(newItems);
                }}
              >
                {record.suppliers?.map((supplier) => (
                  <Option key={supplier.supplierId} value={supplier.supplierId}>
                    {supplier.code}
                  </Option>
                ))}
              </Select>
            ),
          }
        : null),
    },
  ];

  return (
    <div>
      <Space
        style={{
          marginBottom: 16,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Button
            icon={<ZoomOutOutlined />}
            onClick={handleZoomOut}
            disabled={zoomLevel <= MIN_ZOOM}
          />
          <span>{Math.round(zoomLevel * 100)}%</span>
          <Button
            icon={<ZoomInOutlined />}
            onClick={handleZoomIn}
            disabled={zoomLevel >= MAX_ZOOM}
          />
        </Space>
        <Space>
          <div style={{ display: "flex", gap: 10, marginRight: 10 }}>
            <Input
              size="small"
              placeholder="Start item No."
              value={startItemNo}
              onChange={(e) => setStartItemNo(e.target.value)}
              style={{ width: 150 }}
            />
            <span>-</span>
            <Input
              size="small"
              placeholder="End item No."
              value={endItemNo}
              onChange={(e) => setEndItemNo(e.target.value)}
              style={{ width: 150 }}
            />
            <Select
              size="small"
              placeholder="Select supplier"
              style={{ width: 200 }}
              onChange={handleRangeSupplierAdd}
            >
              {uniqueSuppliers.map((supplier) => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.code}
                </Option>
              ))}
            </Select>
          </div>
          <Tooltip title="Load excel file on your local">
            <Button
              type="dashed"
              style={{ margin: "20px 5px" }}
              onClick={() => setIsExcelModalVisible(true)}
              icon={<FileExcelOutlined />}
            >
              Load Excel File
            </Button>
          </Tooltip>
        </Space>
      </Space>
      <div
        style={
          {
            "--table-scale": zoomLevel,
          } as React.CSSProperties
        }
      >
        <CustomTable
          $zoomLevel={zoomLevel}
          columns={columns}
          dataSource={items}
          pagination={false}
          rowKey="position"
          bordered={true}
          rowClassName={(record: ComplexInquiryItemDetail) => {
            if (record.itemRemark) {
              return "remark-row";
            }
            switch (record.itemType) {
              case "MAKER":
                return "maker-row";
              case "TYPE":
                return "type-row";
              case "DESC":
                return "desc-row";
              default:
                return "item-row";
            }
          }}
          virtual
          scroll={{ y: 600 }}
        />
      </div>
      <Button
        type="primary"
        onClick={() => handleAddItem(items.length - 1)}
        style={{ marginTop: 16 }}
      >
        Add Item
      </Button>
      <ExcelUploadModal
        open={isExcelModalVisible}
        onCancel={() => setIsExcelModalVisible(false)}
        onApply={handleApplyExcelData}
        onOverWrite={handleOverwriteExcelData}
        currency={currency}
        type={"offer"}
      />
    </div>
  );
};

export default ComplexInquiryTable;
