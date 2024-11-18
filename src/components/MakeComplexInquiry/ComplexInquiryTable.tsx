import React, { useState, useCallback, useRef } from "react";
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Checkbox,
  message,
  Tooltip,
  InputRef,
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
  InvCharge,
} from "../../types/types";
import { fetchItemData } from "../../api/api";
import ExcelUploadModal from "../ExcelUploadModal";
import { TextAreaRef } from "antd/es/input/TextArea";

const { Option } = Select;

type RefType = InputRef | TextAreaRef;

interface TableProps {
  $zoomLevel?: number;
}

const CustomTable = styled(Table<ComplexInquiryItemDetail>)<TableProps>`
  .ant-table * {
    font-size: ${(props) =>
      props.$zoomLevel ? `${11 * props.$zoomLevel}px` : "11px"};
  }

  .ant-table-cell {
    padding: ${(props) =>
      props.$zoomLevel
        ? `${12 * props.$zoomLevel}px ${2 * props.$zoomLevel}px`
        : "12px 2px"} !important;
    text-align: center !important;
    align-self: center;
    border: none !important;
  }

  .highlight-cell {
    font-weight: bold !important;

    .ant-input-group-addon {
      background-color: #dff4ff;
    }
  }
  .ant-input-group-addon {
    padding: 0 2px !important;
  }
  .ant-input-number-group-addon {
    padding: 0 2px !important;
  }

  .ant-table-row {
    &:hover {
      background-color: rgba(240, 240, 240, 0.875) !important;
    }
    .ant-table-cell-row-hover {
      background-color: rgba(240, 240, 240, 0.875) !important;
    }
    transition: background-color 0.3s ease;
  }

  .maker-row {
    background-color: #c8e4ff90; /* MAKER 행의 배경색 */
    &:hover {
      background-color: #c8e4ff !important;
    }
    .ant-table-cell-row-hover {
      background-color: #c8e4ff !important;
    }
  }
  .type-row {
    background-color: #fffdde90; /* TYPE 행의 배경색 */
    &:hover {
      background-color: #fffdde !important;
    }
    .ant-table-cell-row-hover {
      background-color: #fffdde !important;
    }
  }
  .desc-row {
    background-color: #f0f0f090;
    &:hover {
      background-color: #f0f0f0 !important;
    }
    .ant-table-cell-row-hover {
      background-color: #f0f0f0 !important;
    }
  }
  .remark-row {
    background-color: #d5ffd190;
    &:hover {
      background-color: #dcffd1 !important;
    }
    .ant-table-cell-row-hover {
      background-color: #dcffd1 !important;
    }
  }

  .custom-input .ant-input {
    background-color: #ffffe0 !important;
  }
  .custom-input .ant-input-group-addon {
    background-color: #dff4ff !important;
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
}

const ComplexInquiryTable = ({
  items,
  setItems,
  uniqueSuppliers,
  currency,
}: ComplexInquiryTableProps) => {
  const [unitOptions, setUnitOptions] = useState<string[]>(["PCS", "SET"]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isExcelModalVisible, setIsExcelModalVisible] = useState(false);
  const inputRefs = useRef<(RefType | null)[][]>([]);

  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 1.5;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

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

  const applyUnitToAllRows = (selectedUnit: string) => {
    if (!items) return;

    const updatedItems: ComplexInquiryItemDetail[] = items.map((item) => ({
      ...item,
      unit: selectedUnit,
    }));
    setItems(updatedItems);
  };

  const handleUnitBlur = (index: number, value: string) => {
    handleInputChange(index, "unit", value);
    setUnitOptions((prevOptions) =>
      prevOptions.includes(value) ? prevOptions : [...prevOptions, value]
    );
  };

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

  const handleInputChange = (
    index: number,
    key: keyof ComplexInquiryItemDetail,
    value: any
  ) => {
    const newItems = [...items];

    if (
      (key === "itemType" && value !== "ITEM" && value !== "DASH") ||
      (key === "itemRemark" && value)
    ) {
      // itemType이 ITEM 또는 DASH가 아닌 경우 가격 관련 필드 초기화
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
        qty: 0,
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        [key]: value,
      };
    }

    setItems(newItems);
  };

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
        suppliers: [],
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

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    rowIndex: number,
    columnIndex: number
  ) => {
    const totalColumns = columns.length;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (inputRefs.current[rowIndex - 1]?.[columnIndex]) {
          inputRefs.current[rowIndex - 1][columnIndex]?.focus();
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (inputRefs.current[rowIndex + 1]?.[columnIndex]) {
          inputRefs.current[rowIndex + 1][columnIndex]?.focus();
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

  const columns = [
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
      render: (text: string, record: any, index: number) => {
        if (record.itemType === "DASH") {
          return (
            <Input
              value={text}
              onChange={(value) => {
                handleInputChange(index, "indexNo", value);
              }}
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][1] = el;
              }}
              onKeyDown={(e) => handleKeyDown(e, index, 1)}
            ></Input>
          );
        }

        const filteredIndex = items
          .filter((item: any) => item.itemType === "ITEM")
          .indexOf(record);

        return record.itemType === "ITEM" ? (
          <span>{filteredIndex + 1}</span>
        ) : null;
      },
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
      title: "Sales Price KRW",
      dataIndex: "salesPriceKRW",
      key: "salesPriceKRW",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) => {
        return (
          <Input
            type="number"
            value={text}
            onFocus={(e) => {
              e.target.select();
              const newItems = [...items];
              newItems[index] = {
                ...newItems[index],
                salesPriceGlobal: 0,
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
        );
      },
    },
    {
      title: "Sales Price(F)",
      dataIndex: "salesPriceGlobal",
      key: "salesPriceGlobal",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Input
          type="number"
          value={text}
          addonBefore="F"
          className="custom-input"
          onFocus={(e) => {
            e.target.select();
            const newItems = [...items];
            newItems[index] = {
              ...newItems[index],
              salesPriceKRW: 0,
              margin: 0,
            };
            setItems(newItems);
          }}
          onChange={(e) =>
            handleInputChange(index, "salesPriceGlobal", Number(e.target.value))
          }
          ref={(el) => {
            if (!inputRefs.current[index]) {
              inputRefs.current[index] = [];
            }
            inputRefs.current[index][9] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, 9)}
        />
      ),
    },
    {
      title: "Sales Amount KRW",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Input type="number" value={text} readOnly addonBefore="₩" />
      ),
    },
    {
      title: "Sales Amount(F)",
      dataIndex: "salesAmountGlobal",
      key: "salesAmountGlobal",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Input type="number" value={text} readOnly addonBefore="F" />
      ),
    },
    {
      title: "Purchase Price KRW",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Input
          type="number"
          value={text}
          addonBefore="₩"
          className="custom-input"
          onFocus={(e) => {
            e.target.select();
            const newItems = [...items];
            newItems[index] = {
              ...newItems[index],
              purchasePriceGlobal: 0,
            };
            setItems(newItems);
          }}
          onChange={(e) =>
            handleInputChange(index, "purchasePriceKRW", Number(e.target.value))
          }
          ref={(el) => {
            if (!inputRefs.current[index]) {
              inputRefs.current[index] = [];
            }
            inputRefs.current[index][10] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, 10)}
        />
      ),
    },
    {
      title: "Purchase Price(F)",
      dataIndex: "purchasePriceGlobal",
      key: "purchasePriceGlobal",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Input
          type="number"
          value={text}
          addonBefore="F"
          className="custom-input"
          onFocus={(e) => {
            e.target.select();
            const newItems = [...items];
            newItems[index] = {
              ...newItems[index],
              purchasePriceKRW: 0,
            };
            setItems(newItems);
          }}
          onChange={(e) =>
            handleInputChange(
              index,
              "purchasePriceGlobal",
              Number(e.target.value)
            )
          }
          ref={(el) => {
            if (!inputRefs.current[index]) {
              inputRefs.current[index] = [];
            }
            inputRefs.current[index][11] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, 11)}
        />
      ),
    },
    {
      title: "Purchase Amount KRW",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Input type="number" value={text} readOnly addonBefore="₩" />
      ),
    },
    {
      title: "Purchase Amount(F)",
      dataIndex: "purchaseAmountGlobal",
      key: "purchaseAmountGlobal",
      width: 115 * zoomLevel,
      render: (text: string, _: any, index: number) => (
        <Input type="number" value={text} readOnly addonBefore="F" />
      ),
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
      render: (text: string, _: any, index: number) => (
        <Input
          type="number"
          value={text}
          className="custom-input"
          addonAfter={"%"}
          onChange={(e) => {
            const newItems = [...items];
            newItems[index] = {
              ...newItems[index],
              salesPriceGlobal: 0,
              salesPriceKRW: 0,
              margin: Number(e.target.value),
            };
            setItems(newItems);
          }}
          ref={(el) => {
            if (!inputRefs.current[index]) {
              inputRefs.current[index] = [];
            }
            inputRefs.current[index][12] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, 12)}
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
          placeholder="Apply to checked"
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

        return (
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Select suppliers"
            value={suppliers.map((s) => s.supplierId)}
            optionLabelProp="label"
            onChange={(selectedIds: number[]) => {
              const newItems = [...items];
              newItems[index] = {
                ...newItems[index],
                suppliers: selectedIds.map((id) => ({
                  supplierId: id,
                  inquiryItemDetailId: null,
                  code: allOptions.find((s) => s.id === id)?.code || "",
                  companyName: allOptions.find((s) => s.id === id)?.name || "",
                  korCompanyName:
                    allOptions.find((s) => s.id === id)?.korName || "",
                  representative: null,
                  email: allOptions.find((s) => s.id === id)?.email || "",
                  communicationLanguage:
                    allOptions.find((s) => s.id === id)
                      ?.communicationLanguage || "",
                  supplierRemark:
                    allOptions.find((s) => s.id === id)?.supplierRemark || "",
                })),
              };
              setItems(newItems);
            }}
            optionFilterProp="children"
          >
            {allOptions.map((supplier) => (
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
          scroll={{ y: 600 }}
          virtual
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
