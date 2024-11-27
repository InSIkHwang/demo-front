import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  memo,
  forwardRef,
} from "react";
import {
  Table,
  Input,
  Select,
  InputNumber,
  Button,
  AutoComplete,
  notification,
  message,
  Tooltip,
  InputProps,
  InputRef,
  Space,
} from "antd";
import { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import { InvCharge, ItemDetailType } from "../../types/types";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  FileExcelOutlined,
  ExportOutlined,
  ZoomOutOutlined,
  ZoomInOutlined,
} from "@ant-design/icons";
import { fetchItemData, handleOfferExport } from "../../api/api";
import ExcelUploadModal from "../ExcelUploadModal";
import { TextAreaRef } from "antd/es/input/TextArea";
import { debounce } from "lodash";
import TotalCardsComponent from "./TotalCardsComponent";

interface TableProps {
  $zoomLevel?: number;
}

const CustomTable = styled(Table)<TableProps>`
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
`;

interface DisplayInputProps extends Omit<InputProps, "value" | "onChange"> {
  value: string | number | null;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  formatter?: (value: any) => string;
  parser?: (value: string) => string;
  addonBefore?: string;
  addonAfter?: string;
  className?: string;
}

interface TableComponentProps {
  itemDetails: ItemDetailType[];
  setItemDetails: Dispatch<SetStateAction<ItemDetailType[]>>;
  handleInputChange: (
    index: number,
    key: keyof ItemDetailType,
    value: any
  ) => void;
  currency: number;
  roundToTwoDecimalPlaces: (value: number) => number;
  calculateTotalAmount: (price: number, qty: number) => number;
  handleMarginChange: (index: number, marginValue: number) => void;
  handlePriceInputChange: (
    index: number,
    key: keyof ItemDetailType,
    value: any,
    currency: number
  ) => void;
  offerId: number;
  documentNumber: string;
  supplierName: string;
  pdfUrl: string | null;
  tableTotals: {
    totalSalesAmountKRW: number;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountKRW: number;
    totalPurchaseAmountGlobal: number;
    totalSalesAmountUnDcKRW: number;
    totalSalesAmountUnDcGlobal: number;
    totalPurchaseAmountUnDcKRW: number;
    totalPurchaseAmountUnDcGlobal: number;
    totalProfit: number;
    totalProfitPercent: number;
  };
  applyDcAndCharge: (mode: string) => void;
  dcInfo: { dcPercent: number; dcKrw: number; dcGlobal: number };
  setDcInfo: Dispatch<
    SetStateAction<{ dcPercent: number; dcKrw: number; dcGlobal: number }>
  >;
  invChargeList: InvCharge[] | null;
  setInvChargeList: Dispatch<SetStateAction<InvCharge[] | null>>;
}

// DisplayInput 컴포넌트를 TableComponent 외부로 이동
const DisplayInput = memo(
  forwardRef<InputRef, DisplayInputProps>(
    (
      {
        value,
        onChange,
        onBlur,
        formatter = (val: number | null | undefined) =>
          val?.toLocaleString() ?? "",
        parser = (val: string) => val.replace(/[^a-zA-Z0-9.-]/g, ""),
        ...props
      },
      ref
    ) => {
      const [displayValue, setDisplayValue] = useState<string>(
        formatter(value as number)
      );

      // 외부 value가 변경될 때만 displayValue 업데이트
      useEffect(() => {
        const formattedValue = formatter(value as number);
        if (formattedValue !== displayValue) {
          setDisplayValue(formattedValue);
        }
      }, [value, formatter]);

      const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const rawValue = e.target.value;
          setDisplayValue(rawValue);
          if (onChange) {
            const parsedValue = parser(rawValue);
            onChange(parsedValue);
          }
        },
        [onChange, parser]
      );

      return (
        <Input
          {...props}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
        />
      );
    }
  )
);

DisplayInput.displayName = "DisplayInput";

const MemoizedDisplayInput = memo(DisplayInput, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value;
});

const TableComponent = ({
  itemDetails,
  handleInputChange,
  currency,
  setItemDetails,
  roundToTwoDecimalPlaces,
  calculateTotalAmount,
  handleMarginChange,
  handlePriceInputChange,
  offerId,
  tableTotals,
  applyDcAndCharge,
  dcInfo,
  setDcInfo,
  invChargeList,
  setInvChargeList,
  pdfUrl,
  supplierName,
  documentNumber,
}: TableComponentProps) => {
  const inputRefs = useRef<(TextAreaRef | null)[][]>([]);
  const [itemCodeOptions, setItemCodeOptions] = useState<
    {
      value: string;
      name: string;
      key: string;
      label: string;
      itemId: number;
    }[]
  >([]);
  const [unitOptions, setUnitOptions] = useState<string[]>(["PCS", "SET"]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

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
    mappedItems: ItemDetailType[],
    shouldOverwrite: boolean
  ) => {
    if (!Array.isArray(mappedItems)) {
      console.error("mappedItems is not an array");
      return;
    }

    setItemDetails(
      shouldOverwrite
        ? mappedItems.map((item, idx) => ({
            ...item,
            position: idx + 1,
          }))
        : [
            ...itemDetails,
            ...mappedItems.map((item, idx) => ({
              ...item,
              position: itemDetails.length + idx + 1,
            })),
          ]
    );

    setIsModalVisible(false);
  };

  // 데이터를 추가하는 함수
  const handleApplyExcelData = (mappedItems: ItemDetailType[]) => {
    updateDataSource(mappedItems, false); // 추가하는 작업, 덮어쓰지 않음
  };

  // 데이터를 덮어쓰는 함수
  const handleOverwriteExcelData = (mappedItems: ItemDetailType[]) => {
    updateDataSource(mappedItems, true); // 덮어쓰기 작업
  };

  const handleExportButtonClick = async () => {
    try {
      // 선택한 파일들의 름을 서버로 전송
      const response = await handleOfferExport(offerId);

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

  const updateItemId = useCallback(
    (index: number, itemId: number | null) => {
      const updatedItems = [...itemDetails];
      updatedItems[index] = {
        ...updatedItems[index],
        itemId,
      };
      setItemDetails(updatedItems);
    },
    [itemDetails, setItemDetails]
  );

  const debouncedFetchItemData = useMemo(
    () =>
      debounce(async (value: string, index: number) => {
        try {
          const { items } = await fetchItemData(value);
          if (!Array.isArray(items)) {
            console.error("Items data is not an array:", items);
            return;
          }

          setItemCodeOptions(
            items.reduce((acc, item) => {
              if (!acc?.some((option) => option.itemId === item.itemId)) {
                acc.push({
                  value: item.itemCode,
                  name: item.itemName,
                  key: item.itemId.toString(),
                  label: `${item.itemCode}: ${item.itemName}`,
                  itemId: item.itemId,
                });
              }
              return acc;
            }, [] as { value: string; name: string; key: string; label: string; itemId: number }[])
          );
        } catch (error) {
          message.error("Error fetching item codes and suppliers:");
        }
      }, 300),
    []
  );

  const handleItemCodeChange = async (index: number, value: string) => {
    const trimmedValue = (value + "").trim();

    // 상태 업데이트를 한 번만 수행
    handleInputChange(index, "itemCode", trimmedValue);
    debouncedFetchItemData(trimmedValue, index);
  };

  const handleAddItem = (index: number) => {
    const newItem: ItemDetailType = {
      position: index + 2,
      indexNo: null,
      itemDetailId: null,
      itemId: null,
      itemType: "ITEM",
      itemCode: "",
      itemName: "",
      itemRemark: "",
      qty: 0,
      unit: "",
      salesPriceKRW: 0,
      salesPriceGlobal: 0,
      salesAmountKRW: 0,
      salesAmountGlobal: 0,
      margin: 0,
      purchasePriceKRW: 0,
      purchasePriceGlobal: 0,
      purchaseAmountKRW: 0,
      purchaseAmountGlobal: 0,
    };

    const newItems = [
      ...itemDetails.slice(0, index + 1), // 기존 행까지
      newItem, // 새 행 추가
      ...itemDetails.slice(index + 1).map((item, idx) => ({
        ...item,
        position: index + 3 + idx, // 기존 행의 position 업데이트
      })), // 기존 행 나머지의 position 업데이트
    ];

    setItemDetails(newItems);
  };

  const handleDeleteItem = (itemDetailId: number, position: number) => {
    // 선택한 항목을 삭제한 새로운 데이터 소스를 생성
    const updatedItemDetails = itemDetails.filter(
      (item) =>
        !(item.itemDetailId === itemDetailId && item.position === position)
    );

    // 남은 항목들의 position 값을 1부터 다시 정렬
    const reorderedItemDetails = updatedItemDetails.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));

    // 새로운 데이터 소스로 업데이트
    setItemDetails(reorderedItemDetails);
  };

  const handleUnitBlur = (index: number, value: string) => {
    handleInputChange(index, "unit", value);
    setUnitOptions((prevOptions) =>
      prevOptions.includes(value) ? prevOptions : [...prevOptions, value]
    );
  };

  const applyUnitToAllRows = (selectedUnit: string) => {
    if (!itemDetails) return;

    const updatedItems: ItemDetailType[] = itemDetails.map((item) => ({
      ...item,
      unit: selectedUnit,
    }));
    setItemDetails(updatedItems);
  };

  const applyMarginToAllRows = (marginValue: number) => {
    const updatedData = itemDetails.map((row) => {
      const updatedRow = {
        ...row,
        margin: marginValue,
      };

      // 새로운 매출단가(KRW) 계산
      const salesPriceKRW = calculateSalesPrice(
        updatedRow.purchasePriceKRW,
        marginValue
      );
      updatedRow.salesPriceKRW = salesPriceKRW;

      // 매출총액(KRW) 계산
      updatedRow.salesAmountKRW = calculateTotalAmount(
        updatedRow.salesPriceKRW,
        updatedRow.qty
      );

      // Global 가격 계산 (환 적용)
      const exchangeRate = currency; // currency에 해당하는 환율 값
      const salesPriceGlobal = roundToTwoDecimalPlaces(
        salesPriceKRW / exchangeRate
      );
      updatedRow.salesPriceGlobal = salesPriceGlobal;

      // 매출총액(Global) 계산
      updatedRow.salesAmountGlobal = calculateTotalAmount(
        updatedRow.salesPriceGlobal,
        updatedRow.qty
      );

      return updatedRow;
    });

    setItemDetails(updatedData); // 상태 업데이트
  };

  // 마진에 따라 매출가격을 계산하는 함수 예시
  const calculateSalesPrice = (purchasePrice: number, margin: number) => {
    return purchasePrice * (1 + margin / 100); // 마진을 백분율로 적용
  };

  const handleNextRowKeyDown = (
    e: React.KeyboardEvent<
      HTMLInputElement | HTMLDivElement | HTMLTextAreaElement
    >,
    rowIndex: number,
    columnIndex: number
  ) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();

      if (e.key === "ArrowDown") {
        // 다음 행부터 순차적으로 검색하여 포커스 가능한 입력 요소 찾기
        for (let i = rowIndex + 1; i < inputRefs.current.length; i++) {
          if (inputRefs.current[i]?.[columnIndex]) {
            inputRefs.current[i][columnIndex]?.focus();
            break;
          }
        }
      } else if (e.key === "ArrowUp") {
        // 이전 행부터 역순으로 검색하여 포커스 가능한 입력 요소 찾기
        for (let i = rowIndex - 1; i >= 0; i--) {
          if (inputRefs.current[i]?.[columnIndex]) {
            inputRefs.current[i][columnIndex]?.focus();
            break;
          }
        }
      }
    }
  };

  const handleDownloadPdf = (
    pdfUrl: string,
    supplierName: string,
    documentNumber: string
  ) => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${supplierName}_REQUEST FOR QUOTATION_${documentNumber}.pdf`;
      link.click();

      notification.success({
        message: "Export Success",
        description: "PDF file exported successfully.",
      });
    } else {
      notification.error({
        message: "Export Failed",
        description: "Failed to export the PDF file.",
      });
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Action",
      key: "action",
      width: 80 * zoomLevel,
      render: (text: any, record: any, index: number) => (
        <div>
          <Button
            icon={<PlusCircleOutlined />}
            type="default"
            style={{ marginRight: 5 }}
            size="small"
            onClick={() => handleAddItem(index)}
          />
          <Button
            type="default"
            danger
            size="small"
            onClick={() =>
              handleDeleteItem(record.itemDetailId, record.position)
            }
            icon={<DeleteOutlined />}
          />
        </div>
      ),
    },
    {
      title: "No.",
      dataIndex: "indexNo",
      key: "indexNo",
      fixed: "left",
      width: 70 * zoomLevel,
      render: (text: string, record: any, index: number) => {
        if (record.itemType === "DASH") {
          return (
            <MemoizedDisplayInput
              value={text}
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][0] = el;
              }}
              onChange={(value) => {
                handleInputChange(index, "indexNo", value);
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 0)}
            ></MemoizedDisplayInput>
          );
        }

        const filteredIndex = itemDetails
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
      fixed: "left",
      width: 115 * zoomLevel,
      render: (text: string, record: any, index: number) => {
        if (record.itemType !== "ITEM" && record.itemType !== "DASH") {
          return (
            <MemoizedDisplayInput
              value={text}
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][1] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 1)}
            ></MemoizedDisplayInput>
          );
        }
        return (
          <>
            <AutoComplete
              value={text}
              onChange={(value) => {
                if (value === "") {
                  setItemDetails((prev) => {
                    const updated = [...prev];
                    updated[index] = {
                      ...updated[index],
                      itemId: null,
                      itemCode: "",
                    };
                    return updated;
                  });
                } else {
                  handleItemCodeChange(index, value);
                }
              }}
              options={itemCodeOptions.map((option) => ({
                ...option,
                value: option.label,
              }))}
              onSelect={(label: string) => {
                const selectedOption = itemCodeOptions.find(
                  (item) => item.label === label
                );

                if (selectedOption) {
                  const updates = {
                    itemCode: selectedOption.value,
                    itemName: selectedOption.name,
                    itemId: selectedOption.itemId,
                  };

                  setItemDetails((prev) => {
                    const updated = [...prev];
                    updated[index] = {
                      ...updated[index],
                      ...updates,
                    };
                    return updated;
                  });
                }
              }}
              style={{ borderRadius: "4px", width: "100%" }}
              dropdownStyle={{ width: 250 }}
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][1] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 1)}
            >
              <Input.TextArea autoSize={{ maxRows: 10 }} />
            </AutoComplete>
          </>
        );
      },
    },
    {
      title: "OPT",
      dataIndex: "itemType",
      key: "itemType",
      width: 80 * zoomLevel,
      render: (text: string, record: any, index: number) => (
        <Select
          value={text}
          onChange={(value) => {
            handleInputChange(index, "itemType", value);
            // DASH가 아닌 타입으로 변경될 때 indexNo를 빈 문자열로 설정
            if (value !== "DASH") {
              handleInputChange(index, "indexNo", "");
            }
          }}
          style={{ width: "100%" }}
        >
          {["MAKER", "TYPE", "DESC", "ITEM", "DASH"].map((opt) => (
            <Select.Option key={opt} value={opt}>
              {opt}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Name",
      dataIndex: "itemName",
      key: "itemName",
      fixed: "left",
      width: 200 * zoomLevel,
      render: (text: string, record: any, index: number) => (
        <>
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 10 }}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][2] = el;
            }}
            value={text}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 2)}
            onChange={(e) => {
              handleInputChange(index, "itemName", e.target.value);
            }}
            style={{
              borderRadius: "4px",
              width: "100%",
            }}
          />
        </>
      ),
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: 60 * zoomLevel,
      render: (text: number, record: any, index: number) => {
        // itemType이 ITEM이 아닐 경우 qty 값을 0으로 설정
        if (record.itemType !== "ITEM" && record.itemType !== "DASH") {
          return (
            <MemoizedDisplayInput
              value={text}
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][3] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 3)}
            ></MemoizedDisplayInput>
          ); // 화면에는 0을 표시
        }

        return (
          <MemoizedDisplayInput
            type="text"
            value={text?.toLocaleString()}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][3] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 3)}
            onChange={(value) => {
              const unformattedValue = value.replace(/,/g, "");
              const updatedValue = isNaN(Number(unformattedValue))
                ? 0
                : Number(unformattedValue);
              handleInputChange(index, "qty", updatedValue);
            }}
            style={{ width: "100%" }}
            min={0}
            step={1}
          />
        );
      },
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
      render: (text: string, record: any, index: number) =>
        record.itemType === "ITEM" || record.itemType === "DASH" ? (
          <MemoizedDisplayInput
            value={text}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][4] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 4)}
            onBlur={(e) => handleUnitBlur(index, e.target.value)}
            onChange={(value) => handleInputChange(index, "unit", value)}
          />
        ) : (
          <MemoizedDisplayInput
            value={text}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][4] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 4)}
          ></MemoizedDisplayInput>
        ),
    },
    {
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      width: 150 * zoomLevel,
      render: (text: string, record: any, index: number) => (
        <Input.TextArea
          placeholder="ex) N/A, Incl#1..."
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
          style={{ borderRadius: "4px", width: "100%" }}
        />
      ),
    },
    {
      title: "Purchase Price(KRW)",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      width: 115 * zoomLevel,
      className: "highlight-cell",
      render: (text: number, record: any, index: number) => {
        const value =
          (record.itemType !== "ITEM" && record.itemType !== "DASH") ||
          record.itemRemark
            ? 0
            : text;

        return (record.itemType === "ITEM" || record.itemType === "DASH") &&
          !record.itemRemark ? (
          <MemoizedDisplayInput
            type="text" // Change to "text" to handle formatted input
            value={value?.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][9] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 9)}
            onChange={(value) => {
              handleInputChange(index, "purchasePriceKRW", value);
            }}
            onBlur={(e) => {
              const value = e.target.value;
              const unformattedValue = value.replace(/,/g, "");
              const updatedValue = isNaN(Number(unformattedValue))
                ? 0
                : Number(unformattedValue);
              handlePriceInputChange(
                index,
                "purchasePriceKRW",
                roundToTwoDecimalPlaces(updatedValue),
                currency
              );
            }}
            style={{ width: "100%" }}
            addonBefore="₩"
            className="custom-input"
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
      render: (text: number, record: any, index: number) => {
        const value =
          (record.itemType !== "ITEM" && record.itemType !== "DASH") ||
          record.itemRemark
            ? 0
            : text;

        return (record.itemType === "ITEM" || record.itemType === "DASH") &&
          !record.itemRemark ? (
          <MemoizedDisplayInput
            type="text" // Change to "text" to handle formatted input
            value={value?.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][10] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 10)}
            onChange={(value) => {
              handleInputChange(index, "purchasePriceGlobal", value);
            }}
            onBlur={(e) => {
              const value = e.target.value;
              const unformattedValue = value.replace(/,/g, "");
              const updatedValue = isNaN(Number(unformattedValue))
                ? 0
                : Number(unformattedValue);
              handlePriceInputChange(
                index,
                "purchasePriceGlobal",
                roundToTwoDecimalPlaces(updatedValue),
                currency
              );
            }}
            style={{ width: "100%" }}
            addonBefore="F"
            className="custom-input"
          />
        ) : null;
      },
    },
    {
      title: "Purchase Amount(KRW)",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      width: 115 * zoomLevel,
      render: (text: number, record: any, index: number) =>
        (record.itemType === "ITEM" || record.itemType === "DASH") &&
        !record.itemRemark ? (
          <MemoizedDisplayInput
            type="text" // Change to "text" to handle formatted input
            value={calculateTotalAmount(
              record.purchasePriceKRW,
              record.qty
            )?.toLocaleString()} // Display formatted value
            onChange={(value) =>
              handleInputChange(index, "purchaseAmountKRW", value)
            }
            style={{ width: "100%" }}
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
      render: (text: number, record: any, index: number) =>
        (record.itemType === "ITEM" || record.itemType === "DASH") &&
        !record.itemRemark ? (
          <MemoizedDisplayInput
            type="text" // Change to "text" to handle formatted input
            value={calculateTotalAmount(
              record.purchasePriceGlobal,
              record.qty
            )?.toLocaleString()} // Display formatted value
            onChange={(value) =>
              handleInputChange(index, "purchaseAmountGlobal", value)
            }
            style={{ width: "100%" }}
            readOnly
            addonBefore="F"
          />
        ) : null,
    },
    {
      title: "Sales Price(KRW)",
      dataIndex: "salesPriceKRW",
      key: "salesPriceKRW",
      width: 115 * zoomLevel,
      render: (text: number, record: any, index: number) => {
        const value =
          (record.itemType !== "ITEM" && record.itemType !== "DASH") ||
          record.itemRemark
            ? 0
            : text;

        return (record.itemType === "ITEM" || record.itemType === "DASH") &&
          !record.itemRemark ? (
          <MemoizedDisplayInput
            type="text" // Change to "text" to handle formatted input
            value={value?.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][6] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 6)}
            onChange={(value) =>
              handleInputChange(index, "salesPriceKRW", value)
            }
            onBlur={(e) => {
              const value = e.target.value;
              const unformattedValue = value.replace(/,/g, "");
              const updatedValue = isNaN(Number(unformattedValue))
                ? 0
                : Number(unformattedValue);
              handlePriceInputChange(
                index,
                "salesPriceKRW",
                roundToTwoDecimalPlaces(updatedValue),
                currency
              );
            }}
            style={{ width: "100%" }}
            addonBefore="₩"
            className="custom-input"
          />
        ) : null;
      },
    },
    {
      title: "Sales Price(F)",
      dataIndex: "salesPriceGlobal",
      key: "salesPriceGlobal",
      width: 115 * zoomLevel,
      render: (text: number, record: any, index: number) => {
        const value =
          (record.itemType !== "ITEM" && record.itemType !== "DASH") ||
          record.itemRemark
            ? 0
            : text;

        return (record.itemType === "ITEM" || record.itemType === "DASH") &&
          !record.itemRemark ? (
          <MemoizedDisplayInput
            type="text" // Change to "text" to handle formatted input
            value={value?.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][7] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 7)}
            onChange={(value) =>
              handleInputChange(index, "salesPriceGlobal", value)
            }
            onBlur={(e) => {
              const value = e.target.value;
              const unformattedValue = value.replace(/,/g, "");
              const updatedValue = isNaN(Number(unformattedValue))
                ? 0
                : Number(unformattedValue);
              handlePriceInputChange(
                index,
                "salesPriceGlobal",
                roundToTwoDecimalPlaces(updatedValue),
                currency
              );
            }}
            style={{ width: "100%" }}
            addonBefore="F"
            className="custom-input"
          />
        ) : null;
      },
    },
    {
      title: "Sales Amount(KRW)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 115 * zoomLevel,
      render: (text: number, record: any) =>
        (record.itemType === "ITEM" || record.itemType === "DASH") &&
        !record.itemRemark ? (
          <MemoizedDisplayInput
            type="text"
            value={calculateTotalAmount(
              record.salesPriceKRW,
              record.qty
            )?.toLocaleString()}
            style={{ width: "100%" }}
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
      render: (text: number, record: any) =>
        (record.itemType === "ITEM" || record.itemType === "DASH") &&
        !record.itemRemark ? (
          <MemoizedDisplayInput
            type="text"
            value={calculateTotalAmount(
              record.salesPriceGlobal,
              record.qty
            )?.toLocaleString()}
            style={{ width: "100%" }}
            readOnly
            addonBefore="F"
          />
        ) : null,
    },
    {
      title: (
        <div>
          <InputNumber
            placeholder="Margin"
            parser={(value) =>
              value ? parseFloat(value.replace(/ %/, "")) : 0
            }
            onBlur={(e) => {
              const parsedValue = Number(e.target.value) || 0; // 숫자 타입이 아닐 경우 기본값으로 0 설정

              applyMarginToAllRows(parsedValue); // 모든 행에 마진 적용
            }}
            style={{ width: "100%" }}
            controls={false} // 스핀 버튼 제거
          />
        </div>
      ),
      dataIndex: "margin",
      key: "margin",
      width: 60 * zoomLevel,

      render: (text: number, record: any, index: number) => {
        const value =
          (record.itemType !== "ITEM" && record.itemType !== "DASH") ||
          record.itemRemark
            ? 0
            : text;

        return (record.itemType === "ITEM" || record.itemType === "DASH") &&
          !record.itemRemark ? (
          <MemoizedDisplayInput
            value={value}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][13] = el;
            }}
            style={{ width: "100%" }}
            className="custom-input"
            addonAfter={"%"}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 13)}
            onChange={(value) => {
              const inputValue = value.replace(/[^0-9.-]/g, "");
              if (
                inputValue === "" ||
                inputValue === "-" ||
                !isNaN(Number(inputValue))
              ) {
                handleInputChange(index, "margin", inputValue);
              }
            }}
            onBlur={() => {
              // 값이 0으로 시작하고 길이가 1보다 큰 경우 앞의 0 제거
              const processedValue = String(value).replace(/^0+(?=\d)/, "");
              handleMarginChange(index, Number(processedValue) || 0);
            }}
          />
        ) : null;
      },
    },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <Tooltip title="Load excel file on your local">
        <Button
          type="dashed"
          style={{ margin: "20px 5px" }}
          onClick={() => setIsModalVisible(true)}
          icon={<FileExcelOutlined />}
        >
          Load Excel File
        </Button>
      </Tooltip>
      <Tooltip title="Export excel file on your table">
        <Button
          type="dashed"
          style={{ margin: "20px 5px" }}
          icon={<ExportOutlined />}
          onClick={handleExportButtonClick}
        >
          Export Excel
        </Button>
      </Tooltip>
      <div style={{ float: "right" }}>
        <Tooltip title="Download PDF file before you send">
          <Button
            type="dashed"
            style={{ margin: "20px 5px" }}
            onClick={() =>
              handleDownloadPdf(pdfUrl || "", supplierName, documentNumber)
            }
            icon={<FileExcelOutlined />}
          >
            Download PDF File
          </Button>
        </Tooltip>
      </div>
      <TotalCardsComponent
        finalTotals={tableTotals}
        applyDcAndCharge={applyDcAndCharge}
        mode={"single"}
        currency={currency}
        dcInfo={dcInfo}
        setDcInfo={setDcInfo}
        invChargeList={invChargeList}
        setInvChargeList={setInvChargeList}
      />
      <Space style={{ marginBottom: 16 }}>
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
      <div
        style={
          {
            "--table-scale": zoomLevel,
          } as React.CSSProperties
        }
      >
        <CustomTable
          $zoomLevel={zoomLevel}
          rowClassName={(record: any, index) => {
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
          rowKey="position"
          columns={columns}
          dataSource={itemDetails}
          pagination={false}
          scroll={{ y: 600 }}
          virtual
        />
      </div>
      <Button
        type="primary"
        style={{ margin: "20px 5px" }}
        onClick={() => handleAddItem(itemDetails.length - 1)} // 마지막 인덱스에 새 품목 추가
      >
        Add item
      </Button>
      <ExcelUploadModal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onApply={handleApplyExcelData}
        onOverWrite={handleOverwriteExcelData}
        currency={currency}
        type={"offer"}
      />
    </div>
  );
};

export default TableComponent;
