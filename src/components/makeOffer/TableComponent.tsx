import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
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
} from "antd";
import { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import { ItemDetailType } from "../../types/types";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { fetchItemData, handleOfferExport } from "../../api/api";
import ExcelUploadModal from "../ExcelUploadModal";
import { TextAreaRef } from "antd/es/input/TextArea";
import { debounce } from "lodash";

const RefreshBtn = styled(Button)``;

const CustomTable = styled(Table)`
  .ant-table * {
    font-size: 12px;
  }

  .ant-table-cell {
    padding: 14px 4px !important;
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

const TotalCards = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 6px;
  background: #f8f8f8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TotalCard = styled.div<{ $isHighlight?: boolean; $isPositive?: boolean }>`
  flex: 1;
  text-align: center;
  padding: 8px;
  margin: 0 5px;
  border-radius: 4px;
  background: ${({ $isHighlight, $isPositive }) =>
    $isHighlight ? ($isPositive ? "#eaffea" : "#ffe6e6") : "#ffffff"};
  box-shadow: ${({ $isHighlight }) =>
    $isHighlight ? "0 1px 2px rgba(0, 0, 0, 0.1)" : "none"};
  border: ${({ $isHighlight, $isPositive }) =>
    $isHighlight
      ? `1px solid ${$isPositive ? "#b3e6b3" : "#f5b3b3"}`
      : "1px solid #ddd"};

  span {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: ${({ $isHighlight, $isPositive }) =>
      $isHighlight ? ($isPositive ? "#2e8b57" : "#d9534f") : "#666"};
  }

  span.value {
    font-size: 18px;
    font-weight: 600;
  }
`;

interface TableComponentProps {
  itemDetails: ItemDetailType[];
  setItemDetails: Dispatch<SetStateAction<ItemDetailType[]>>;
  handleInputChange: (
    index: number,
    key: keyof ItemDetailType,
    value: any
  ) => void;
  currency: number;
  setIsDuplicate: Dispatch<SetStateAction<boolean>>;
  roundToTwoDecimalPlaces: (value: number) => number;
  calculateTotalAmount: (price: number, qty: number) => number;
  handleMarginChange: (index: number, marginValue: number) => void;
  handlePriceInputChange: (
    index: number,
    key: keyof ItemDetailType,
    value: any,
    currency: number
  ) => void;
  finalTotals: {
    totalSalesAmountKRW: number;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountKRW: number;
    totalPurchaseAmountGlobal: number;
    totalProfit: number;
    totalProfitPercent: number;
  };
  applyDcAndCharge: () => void;
  offerId: number;
}

const TableComponent = ({
  itemDetails,
  handleInputChange,
  currency,
  setItemDetails,
  setIsDuplicate,
  roundToTwoDecimalPlaces,
  calculateTotalAmount,
  handleMarginChange,
  handlePriceInputChange,
  finalTotals,
  applyDcAndCharge,
  offerId,
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
  const [updatedIndex, setUpdatedIndex] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

    if (trimmedValue === "") {
      updateItemId(index, null);
      return;
    }

    // 상태 업데이트를 한 번만 수행
    handleInputChange(index, "itemCode", trimmedValue);
    setUpdatedIndex(index);
    debouncedFetchItemData(trimmedValue, index);
  };

  const checkDuplicate = useCallback(
    (key: string, value: string, index: number) => {
      if (!(value + "")?.trim()) {
        return false;
      }

      return itemDetails?.some(
        (item: any, idx) => item[key] === value && idx !== index
      );
    },
    [itemDetails]
  );
  // 컴포넌트 최초 렌더링 시 중복 여부를 확인
  useEffect(() => {
    // 중복 여부를 전체적으로 확인합니다.
    const hasDuplicate = itemDetails?.some((item: any, index) =>
      ["itemCode", "itemName"]?.some((key) =>
        checkDuplicate(key, item[key], index)
      )
    );

    setIsDuplicate(hasDuplicate);
  }, [checkDuplicate, itemDetails]);

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

  const columns: ColumnsType<any> = [
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (text: any, record: any, index: number) => (
        <div>
          <Button
            icon={<PlusCircleOutlined />}
            type="default"
            style={{ marginRight: 5 }}
            onClick={() => handleAddItem(index)}
          />
          <Button
            type="default"
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
      width: 80,
      render: (text: string, record: any, index: number) => {
        if (record.itemType === "DASH") {
          return (
            <Input
              value={text}
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][0] = el;
              }}
              onChange={(e) => {
                handleInputChange(index, "indexNo", e.target.value);
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 0)}
            ></Input>
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
      width: 115,
      render: (text: string, record: any, index: number) => {
        if (record.itemType !== "ITEM" && record.itemType !== "DASH") {
          return (
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
          );
        }
        return (
          <>
            <AutoComplete
              value={text}
              onChange={(value) => {
                handleItemCodeChange(index, value);
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
              <Input.TextArea
                autoSize={{ maxRows: 10 }}
                style={{
                  borderColor: checkDuplicate("itemCode", text, index)
                    ? "#faad14"
                    : "#d9d9d9",
                }}
              />
            </AutoComplete>
            {checkDuplicate("itemCode", text, index) && (
              <div style={{ color: "#faad14", marginTop: "5px" }}>
                duplicate code.
              </div>
            )}
          </>
        );
      },
    },
    {
      title: "OPT",
      dataIndex: "itemType",
      key: "itemType",
      width: 80,
      render: (text: string, record: any, index: number) => (
        <Select
          value={text}
          onChange={(value) => handleInputChange(index, "itemType", value)}
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
      width: 200,
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
              borderColor: checkDuplicate("itemName", text, index)
                ? "#faad14"
                : "#d9d9d9", // 중복 시 배경색 빨간색
            }}
          />{" "}
          {checkDuplicate("itemName", text, index) && (
            <div style={{ color: "#faad14", marginTop: "5px" }}>
              duplicate name.
            </div>
          )}
        </>
      ),
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: 60,
      render: (text: number, record: any, index: number) => {
        // itemType이 ITEM이 아닐 경우 qty 값을 0으로 설정
        if (record.itemType !== "ITEM" && record.itemType !== "DASH") {
          return (
            <Input
              readOnly
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][3] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 3)}
            ></Input>
          ); // 화면에는 0을 표시
        }

        return (
          <Input
            type="text"
            value={text?.toLocaleString()}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][3] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 3)}
            onChange={(e) => {
              const unformattedValue = e.target.value.replace(/,/g, "");
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
      width: 75,
      render: (text: string, record: any, index: number) =>
        record.itemType === "ITEM" || record.itemType === "DASH" ? (
          <Input
            value={text}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][4] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 4)}
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
              inputRefs.current[index][4] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 4)}
          ></Input>
        ),
    },
    {
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      width: 150,
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
      title: "Sales Price(KRW)",
      dataIndex: "salesPriceKRW",
      key: "salesPriceKRW",
      width: 115,
      render: (text: number, record: any, index: number) => {
        const value =
          (record.itemType !== "ITEM" && record.itemType !== "DASH") ||
          record.itemRemark
            ? 0
            : text;

        return (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={value?.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][5] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 5)}
            onChange={(e) =>
              handleInputChange(index, "salesPriceKRW", e.target.value)
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
        );
      },
    },
    {
      title: "Sales Price(F)",
      dataIndex: "salesPriceGlobal",
      key: "salesPriceGlobal",
      width: 115,
      render: (text: number, record: any, index: number) => {
        const value =
          (record.itemType !== "ITEM" && record.itemType !== "DASH") ||
          record.itemRemark
            ? 0
            : text;

        return (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={value?.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][6] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 6)}
            onChange={(e) =>
              handleInputChange(index, "salesPriceGlobal", e.target.value)
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
            addonBefore="₩"
            className="custom-input"
          />
        );
      },
    },
    {
      title: "Sales Amount(KRW)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 115,
      className: "highlight-cell",
      render: (text: number, record: any) =>
        (record.itemType === "ITEM" || record.itemType === "DASH") &&
        !record.itemRemark ? (
          <Input
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
      width: 115,
      className: "highlight-cell",
      render: (text: number, record: any) =>
        (record.itemType === "ITEM" || record.itemType === "DASH") &&
        !record.itemRemark ? (
          <Input
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
      title: "Purchase Price(KRW)",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      width: 115,
      render: (text: number, record: any, index: number) => {
        const value =
          (record.itemType !== "ITEM" && record.itemType !== "DASH") ||
          record.itemRemark
            ? 0
            : text;

        return (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={value?.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][9] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 9)}
            onChange={(e) =>
              handleInputChange(index, "purchasePriceKRW", e.target.value)
            }
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
        );
      },
    },
    {
      title: "Purchase Price(F)",
      dataIndex: "purchasePriceGlobal",
      key: "purchasePriceGlobal",
      width: 115,
      render: (text: number, record: any, index: number) => {
        const value =
          (record.itemType !== "ITEM" && record.itemType !== "DASH") ||
          record.itemRemark
            ? 0
            : text;

        return (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={value?.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][10] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 10)}
            onChange={(e) =>
              handleInputChange(index, "purchasePriceGlobal", e.target.value)
            }
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
        );
      },
    },
    {
      title: "Purchase Amount(KRW)",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      width: 115,
      className: "highlight-cell",
      render: (text: number, record: any, index: number) =>
        (record.itemType === "ITEM" || record.itemType === "DASH") &&
        !record.itemRemark ? (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={calculateTotalAmount(
              record.purchasePriceKRW,
              record.qty
            )?.toLocaleString()} // Display formatted value
            onChange={(e) =>
              handleInputChange(index, "purchaseAmountKRW", e.target.value)
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
      width: 115,
      className: "highlight-cell",
      render: (text: number, record: any, index: number) =>
        (record.itemType === "ITEM" || record.itemType === "DASH") &&
        !record.itemRemark ? (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={calculateTotalAmount(
              record.purchasePriceGlobal,
              record.qty
            )?.toLocaleString()} // Display formatted value
            onChange={(e) =>
              handleInputChange(index, "purchaseAmountGlobal", e.target.value)
            }
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
      width: 80,
      className: "highlight-cell",

      render: (text: number, record: any, index: number) => {
        const value =
          (record.itemType !== "ITEM" && record.itemType !== "DASH") ||
          record.itemRemark
            ? 0
            : text;

        return (
          <Input
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
            onChange={(e) => {
              const inputValue = e.target.value.replace(/[^0-9.-]/g, "");
              if (
                inputValue === "" ||
                inputValue === "-" ||
                !isNaN(Number(inputValue))
              ) {
                handleInputChange(index, "margin", inputValue);
              }
            }}
            onBlur={() => {
              handleMarginChange(index, value || 0);
            }}
          />
        );
      },
    },
  ];

  return (
    <div style={{ marginTop: 20, overflowX: "auto" }}>
      <TotalCards>
        <TotalCard>
          <span>Sales Amount(KRW)</span>
          <span className="value">
            ₩ {finalTotals.totalSalesAmountKRW?.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>Sales Amount(F)</span>
          <span className="value">
            F {finalTotals.totalSalesAmountGlobal?.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>Purchase Amount(KRW)</span>
          <span className="value">
            ₩ {finalTotals.totalPurchaseAmountKRW?.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>Purchase Amount(F)</span>
          <span className="value">
            F {finalTotals.totalPurchaseAmountGlobal?.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={finalTotals.totalProfit >= 0}>
          <span>Profit Amount</span>
          <span className="value">
            ₩ {finalTotals.totalProfit?.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard
          $isHighlight
          $isPositive={finalTotals.totalProfitPercent >= 0}
        >
          <span>Profit Percent</span>
          <span className="value">
            {isNaN(finalTotals.totalProfitPercent)
              ? 0
              : finalTotals.totalProfitPercent}
            %
          </span>
        </TotalCard>
        <RefreshBtn
          icon={<ReloadOutlined />}
          type="primary"
          onClick={() => {
            applyDcAndCharge();
          }}
        />
      </TotalCards>
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
      <CustomTable
        rowClassName={(record: any, index) => {
          if (record.itemType === "MAKER") {
            return "maker-row";
          } else if (record.itemType === "TYPE") {
            return "type-row";
          } else if (record.itemType === "DESC") {
            return "desc-row";
          } else if (record.itemRemark) {
            return "remark-row";
          } else {
            return index % 2 === 0 ? "even-row" : "odd-row"; // 기본 행 스타일
          }
        }}
        rowKey="position"
        columns={columns}
        dataSource={itemDetails}
        pagination={false}
        scroll={{ y: 600 }}
        virtual
      />
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
