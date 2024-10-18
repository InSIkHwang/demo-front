import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
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
import { ItemDataType } from "../../types/types";
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
  dataSource: ItemDataType[];
  setDataSource: Dispatch<SetStateAction<ItemDataType[]>>;
  handleInputChange: (
    index: number,
    key: keyof ItemDataType,
    value: any
  ) => void;
  currency: number;
  setIsDuplicate: Dispatch<SetStateAction<boolean>>;
  roundToTwoDecimalPlaces: (value: number) => number;
  calculateTotalAmount: (price: number, qty: number) => number;
  handleMarginChange: (index: number, marginValue: number) => void;
  handlePriceInputChange: (
    index: number,
    key: keyof ItemDataType,
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
  totals: {
    totalSalesAmountKRW: number;
    totalSalesAmountGlobal: number;
    totalPurchaseAmountKRW: number;
    totalPurchaseAmountGlobal: number;
    totalProfit: number;
    totalProfitPercent: number;
  };
  setTotals: Dispatch<
    SetStateAction<{
      totalSalesAmountKRW: number;
      totalSalesAmountGlobal: number;
      totalPurchaseAmountKRW: number;
      totalPurchaseAmountGlobal: number;
      totalProfit: number;
      totalProfitPercent: number;
    }>
  >;
  applyDcAndCharge: () => void;
  offerId: number;
}

interface SelectedItemData {
  index: number;
  itemName: string;
  itemId: number;
}

const TableComponent = ({
  dataSource,
  handleInputChange,
  currency,
  setDataSource,
  setIsDuplicate,
  roundToTwoDecimalPlaces,
  calculateTotalAmount,
  handleMarginChange,
  handlePriceInputChange,
  finalTotals,
  setTotals,
  applyDcAndCharge,
  offerId,
}: TableComponentProps) => {
  const inputRefs = useRef<(TextAreaRef | null)[][]>([]);
  const [itemCodeOptions, setItemCodeOptions] = useState<{ value: string }[]>(
    []
  );
  const [itemNameMap, setItemNameMap] = useState<{ [key: string]: string }>({});
  const [itemIdMap, setItemIdMap] = useState<{ [key: string]: number }>({});
  const [supplierOptions, setSupplierOptions] = useState<
    { value: string; id: number; itemId: number; code: string; email: string }[]
  >([]);

  const [unitOptions, setUnitOptions] = useState<string[]>(["PCS", "SET"]);
  const [updatedIndex, setUpdatedIndex] = useState<number | null>(null);
  const [selectedItemData, setSelectedItemData] =
    useState<SelectedItemData | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 공통 데이터 처리 함수
  const updateDataSource = (
    mappedItems: ItemDataType[],
    shouldOverwrite: boolean
  ) => {
    if (!Array.isArray(mappedItems)) {
      console.error("mappedItems is not an array");
      return;
    }

    setDataSource((prevItems) => {
      if (shouldOverwrite) {
        // 기존 데이터를 덮어쓰는 경우
        return mappedItems.map((item, idx) => ({
          ...item,
          position: idx + 1,
        }));
      } else {
        // 기존 데이터에 추가하는 경우
        return [
          ...prevItems,
          ...mappedItems.map((item, idx) => ({
            ...item,
            position: prevItems.length + idx + 1,
          })),
        ];
      }
    });

    setIsModalVisible(false); // 모달 닫기
  };

  // 데이터를 추가하는 함수
  const handleApplyExcelData = (mappedItems: ItemDataType[]) => {
    updateDataSource(mappedItems, false); // 추가하는 작업, 덮어쓰지 않음
  };

  // 데이터를 덮어쓰는 함수
  const handleOverwriteExcelData = (mappedItems: ItemDataType[]) => {
    updateDataSource(mappedItems, true); // 덮어쓰기 작업
  };

  const handleExportButtonClick = async () => {
    try {
      // 선택한 파일들의 이름을 서버로 전송
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

  const handleItemCodeChange = async (index: number, value: string) => {
    if ((value + "").trim() === "") {
      updateItemId(index, null);
      return;
    }

    handleInputChange(index, "itemCode", value?.trim());
    setUpdatedIndex(index);

    try {
      const { items } = await fetchItemData(value);

      if (!Array.isArray(items)) {
        console.error("Items data is not an array:", items);
        return;
      }

      const newItemNameMap: { [key: number]: string } = {};
      const newItemIdMap: { [key: number]: number } = {};
      const newSupplierOptions: {
        value: string;
        id: number;
        itemId: number;
        code: string;
        email: string;
      }[] = [];

      items.forEach((item) => {
        newItemNameMap[item.itemId] = item.itemName;
        newItemIdMap[item.itemId] = item.itemId;
        newSupplierOptions.push(
          ...item.supplierList.map((supplier) => ({
            value: supplier.companyName,
            id: supplier.id,
            itemId: supplier.itemId,
            code: supplier.code,
            email: supplier.email,
          }))
        );
      });

      setItemCodeOptions(
        items.reduce(
          (
            acc: {
              value: string;
              name: string;
              key: string;
              label: string;
              itemId: number;
            }[],
            item
          ) => {
            // 이미 동일한 itemId가 존재하는지 확인
            if (!acc.some((option) => option.itemId === item.itemId)) {
              acc.push({
                value: item.itemCode,
                name: item.itemName,
                key: item.itemId.toString(),
                label: `${item.itemCode}: ${item.itemName}`,
                itemId: item.itemId,
              });
            }
            return acc;
          },
          []
        )
      );

      setItemNameMap((prevMap) => ({ ...prevMap, ...newItemNameMap }));
      setItemIdMap((prevMap) => ({ ...prevMap, ...newItemIdMap }));

      setSupplierOptions((prevOptions) => [
        ...prevOptions,
        ...newSupplierOptions.filter(
          (newSupplier) =>
            !prevOptions.some(
              (existingSupplier) => existingSupplier.id === newSupplier.id
            )
        ),
      ]);

      const selectedItem = items.find((item) => item.itemCode === value);
      if (selectedItem) {
        setSelectedItemData({
          index,
          itemName: selectedItem.itemName,
          itemId: selectedItem.itemId,
        });
      }
    } catch (error) {
      message.error("Error fetching item codes and suppliers:");
    }
  };

  const updateItemId = useCallback(
    (index: number, itemId: number | null) => {
      setDataSource((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index] = {
          ...updatedItems[index],
          itemId,
        };
        return updatedItems;
      });
    },
    [setDataSource]
  );

  useEffect(() => {
    if (updatedIndex !== null && selectedItemData) {
      const { index, itemName, itemId } = selectedItemData;
      handleInputChange(index, "itemName", itemName);
      updateItemId(index, itemId);
      setUpdatedIndex(null);
      setSelectedItemData(null);
    }
  }, [
    dataSource,
    handleInputChange,
    selectedItemData,
    updateItemId,
    updatedIndex,
  ]);

  const checkDuplicate = useCallback(
    (key: string, value: string, index: number) => {
      if (!(value + "")?.trim()) {
        return false;
      }

      return dataSource.some(
        (item: any, idx) => item[key] === value && idx !== index
      );
    },
    [dataSource]
  );
  // 컴포넌트 최초 렌더링 시 중복 여부를 확인
  useEffect(() => {
    // 중복 여부를 전체적으로 확인합니다.
    const hasDuplicate = dataSource.some((item: any, index) =>
      ["itemCode", "itemName"].some((key) =>
        checkDuplicate(key, item[key], index)
      )
    );

    setIsDuplicate(hasDuplicate);
  }, [checkDuplicate, dataSource, setIsDuplicate]);

  useEffect(() => {
    const totalSalesAmountKRW =
      dataSource.reduce(
        (acc, record) =>
          acc + calculateTotalAmount(record.salesPriceKRW, record.qty),
        0
      ) || 0; // NaN일 경우 0으로 처리

    const totalSalesAmountGlobal =
      dataSource.reduce(
        (acc, record) =>
          acc + calculateTotalAmount(record.salesPriceGlobal, record.qty),
        0
      ) || 0; // NaN일 경우 0으로 처리

    const totalPurchaseAmountKRW =
      dataSource.reduce(
        (acc, record) =>
          acc + calculateTotalAmount(record.purchasePriceKRW, record.qty),
        0
      ) || 0; // NaN일 경우 0으로 처리

    const totalPurchaseAmountGlobal =
      dataSource.reduce(
        (acc, record) =>
          acc + calculateTotalAmount(record.purchasePriceGlobal, record.qty),
        0
      ) || 0; // NaN일 경우 0으로 처리

    const totalProfit = totalSalesAmountKRW - totalPurchaseAmountKRW;
    const totalProfitPercent =
      totalPurchaseAmountKRW === 0
        ? 0 // NaN일 경우 0으로 처리
        : Number(((totalProfit / totalPurchaseAmountKRW) * 100).toFixed(2));

    setTotals({
      totalSalesAmountKRW: totalSalesAmountKRW,
      totalSalesAmountGlobal: totalSalesAmountGlobal,
      totalPurchaseAmountKRW: totalPurchaseAmountKRW,
      totalPurchaseAmountGlobal: totalPurchaseAmountGlobal,
      totalProfit: totalProfit || 0, // NaN일 경우 0으로 처리
      totalProfitPercent,
    });
  }, [calculateTotalAmount, dataSource, setTotals]);

  const handleAddItem = (index: number) => {
    const newItem: ItemDataType = {
      position: index + 2,
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
      ...dataSource.slice(0, index + 1), // 기존 행까지
      newItem, // 새 행 추가
      ...dataSource.slice(index + 1).map((item, idx) => ({
        ...item,
        position: index + 3 + idx, // 기존 행의 position 업데이트
      })), // 기존 행 나머지의 position 업데이트
    ];

    setDataSource(newItems);
  };

  const handleDeleteItem = (itemDetailId: number, position: number) => {
    // 선택한 항목을 삭제한 새로운 데이터 소스를 생성
    const updatedDataSource = dataSource.filter(
      (item) =>
        !(item.itemDetailId === itemDetailId && item.position === position)
    );

    // 남은 항목들의 position 값을 1부터 다시 정렬
    const reorderedDataSource = updatedDataSource.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));

    // 새로운 데이터 소스로 업데이트
    setDataSource(reorderedDataSource);
  };

  const handleUnitBlur = (index: number, value: string) => {
    handleInputChange(index, "unit", value);
    setUnitOptions((prevOptions) =>
      prevOptions.includes(value) ? prevOptions : [...prevOptions, value]
    );
  };

  const applyUnitToAllRows = (selectedUnit: string) => {
    setDataSource((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        unit: selectedUnit,
      }))
    );
  };

  const applyMarginToAllRows = (marginValue: number) => {
    const updatedData = dataSource.map((row) => {
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

      // Global 가격 계산 (환율 적용)
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

    setDataSource(updatedData); // 상태 업데이트
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
      dataIndex: "no",
      key: "no",
      width: 30,
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
      width: 115,
      render: (text: string, record: any, index: number) => {
        if (record.itemType !== "ITEM") {
          // handleInputChange를 호출하여 값을 0으로 설정
          handleInputChange(index, "itemCode", "");
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
                updateItemId(index, null);
              }}
              options={itemCodeOptions}
              onSelect={(value: string, option: any) => {
                const itemId = option.itemId; // AutoComplete의 옵션에서 itemId를 가져옴
                updateItemId(index, itemId); // itemId로 아이템 업데이트
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
                autoSize={{ minRows: 1, maxRows: 10 }}
                style={{
                  borderColor: checkDuplicate("itemCode", text, index)
                    ? "#faad14"
                    : "#d9d9d9", // 중복 시 배경색 빨간색
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
          {["MAKER", "TYPE", "DESC", "ITEM"].map((opt) => (
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
              updateItemId(index, null);
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
        if (record.itemType !== "ITEM") {
          // handleInputChange를 호출하여 값을 0으로 설정
          handleInputChange(index, "qty", 0);
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
        record.itemType === "ITEM" ? (
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
      render: (text: number, record: any) =>
        record.itemType === "ITEM" ? (
          <Input
            type="text"
            value={text?.toLocaleString()}
            readOnly
            style={{ width: "100%" }}
            addonBefore="₩"
          />
        ) : null,
    },
    {
      title: "Sales Price(F)",
      dataIndex: "salesPriceGlobal",
      key: "salesPriceGlobal",
      width: 115,
      render: (text: number, record: any) =>
        record.itemType === "ITEM" ? (
          <Input
            type="text"
            value={text?.toLocaleString()}
            readOnly
            style={{ width: "100%" }}
            addonBefore="F"
          />
        ) : null,
    },
    {
      title: "Sales Amount(KRW)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 115,
      className: "highlight-cell",
      render: (text: number, record: any) =>
        record.itemType === "ITEM" ? (
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
        record.itemType === "ITEM" ? (
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
        if (record.itemType !== "ITEM") {
          handleInputChange(index, "purchasePriceKRW", 0); // 값을 0으로 설정
          return (
            <Input
              value={0}
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][9] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 9)}
            />
          );
        }
        return (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={text?.toLocaleString()} // Display formatted value
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
        if (record.itemType !== "ITEM") {
          handleInputChange(index, "purchasePriceGlobal", 0); // 값을 0으로 설정
          return (
            <Input
              value={0}
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][10] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 10)}
            />
          );
        }
        return (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={text?.toLocaleString()} // Display formatted value
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
        record.itemType === "ITEM" ? (
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
        record.itemType === "ITEM" ? (
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
        if (record.itemType !== "ITEM") {
          handleInputChange(index, "margin", 0); // 값을 0으로 설정
          return (
            <Input
              value={0}
              ref={(el) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = [];
                }
                inputRefs.current[index][13] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, index, 13)}
            />
          );
        }
        return (
          <Input
            value={text}
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
              const value = e.target.value.replace(/[^0-9.]/g, "");
              handleInputChange(index, "margin", value);
            }}
            onBlur={() => handleMarginChange(index, text ?? 0)}
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
          } else {
            return index % 2 === 0 ? "even-row" : "odd-row"; // 기본 행 스타일
          }
        }}
        rowKey="position"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ y: 600 }}
        virtual
      />
      <Button
        type="primary"
        style={{ margin: "20px 5px" }}
        onClick={() => handleAddItem(dataSource.length - 1)} // 마지막 인덱스에 새 품목 추가
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
