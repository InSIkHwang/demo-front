import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
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
  InputRef,
} from "antd";
import { ColumnsType } from "antd/es/table";
import styled, { CSSProperties } from "styled-components";
import { InvCharge, ItemDataType } from "../../types/types";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { fetchItemData } from "../../api/api";

const RefreshBtn = styled(Button)``;

const CustomTable = styled(Table)`
  .ant-table * {
    font-size: 13px;
  }

  .ant-table-cell {
    padding: 12px 4px !important;
    text-align: center !important;
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
}: TableComponentProps) => {
  const inputRefs = useRef<(InputRef | null)[][]>([]);
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

  const handleItemCodeChange = async (index: number, value: string) => {
    if ((value + "").trim() === "") {
      updateItemId(index, null);
      return;
    }

    handleInputChange(index, "itemCode", value);
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
        items.map((item) => ({
          value: item.itemCode,
          name: item.itemName,
          key: item.itemId.toString(),
          label: `${item.itemCode}: ${item.itemName}`,
          itemId: item.itemId,
        }))
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
      console.error("Error fetching item codes and suppliers:", error);
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
    const totalSalesAmountKRW = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.salesPriceKRW, record.qty),
      0
    );
    const totalSalesAmountGlobal = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.salesPriceGlobal, record.qty),
      0
    );
    const totalPurchaseAmountKRW = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.purchasePriceKRW, record.qty),
      0
    );
    const totalPurchaseAmountGlobal = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.purchasePriceGlobal, record.qty),
      0
    );
    const totalProfit = totalSalesAmountKRW - totalPurchaseAmountKRW;
    const totalProfitPercent = Number(
      ((totalProfit / totalPurchaseAmountKRW) * 100).toFixed(2)
    );

    setTotals({
      totalSalesAmountKRW,
      totalSalesAmountGlobal,
      totalPurchaseAmountKRW,
      totalPurchaseAmountGlobal,
      totalProfit,
      totalProfitPercent,
    });
  }, [calculateTotalAmount, dataSource]);

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
    const updatedDataSource = dataSource.filter(
      (item) =>
        !(item.itemDetailId === itemDetailId && item.position === position)
    );
    setDataSource(updatedDataSource);
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
    e: React.KeyboardEvent<HTMLInputElement>,
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
      width: 90,
      render: (text: any, record: any, index: number) => (
        <div>
          <Button
            icon={<PlusCircleOutlined />}
            type="default"
            style={{ marginRight: 10 }}
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
      dataIndex: "no", // No. 값 표시
      key: "no",
      width: 40,
      render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
    },
    {
      title: "PartNo",
      dataIndex: "itemCode",
      key: "itemCode",
      fixed: "left",
      width: 115,
      render: (text: string, record: any, index: number) =>
        record.itemType === "ITEM" ? (
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
            >
              <Input
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
        ) : null,
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
      title: "품명",
      dataIndex: "itemName",
      key: "itemName",
      fixed: "left",
      width: 250,
      render: (text: string, record: any, index: number) => (
        <>
          <Input
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][2] = el; // columnIndex를 맞추어 설정
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
      title: "수량",
      dataIndex: "qty",
      key: "qty",
      width: 75,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={text.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][3] = el; // columnIndex를 맞추어 설정
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 3)}
            onChange={(e) => {
              // Remove formatting before processing
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
        ) : null,
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
      width: 70,
      render: (text: string, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            value={text}
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][4] = el; // columnIndex를 맞추어 설정
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, index, 4)}
            onBlur={(e) => handleUnitBlur(index, e.target.value)}
            onChange={(e) => handleInputChange(index, "unit", e.target.value)}
          />
        ) : null,
    },
    {
      title: "비고",
      dataIndex: "itemRemark",
      key: "itemRemark",
      width: 100,
      render: (text: string, record: any, index: number) => (
        <Input
          value={text}
          onChange={(e) =>
            handleInputChange(index, "itemRemark", e.target.value)
          }
          style={{ borderRadius: "4px", width: "100%" }}
        />
      ),
    },
    {
      title: "매출단가(KRW)",
      dataIndex: "salesPriceKRW",
      key: "salesPriceKRW",
      width: 115,
      render: (text: number, record: any, index: number) =>
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
      title: "매출단가(F)",
      dataIndex: "salesPriceGlobal",
      key: "salesPriceGlobal",
      width: 115,
      render: (text: number, record: any, index: number) =>
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
      title: "매출총액(KRW)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 115,
      className: "highlight-cell",
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            type="text"
            value={calculateTotalAmount(
              record.salesPriceKRW,
              record.qty
            ).toLocaleString()}
            style={{ width: "100%" }}
            readOnly
            addonBefore="₩"
          />
        ) : null,
    },
    {
      title: "매출총액(F)",
      dataIndex: "salesAmountGlobal",
      key: "salesAmountGlobal",
      width: 115,
      className: "highlight-cell",
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            type="text"
            value={calculateTotalAmount(
              record.salesPriceGlobal,
              record.qty
            ).toLocaleString()}
            style={{ width: "100%" }}
            readOnly
            addonBefore="F"
          />
        ) : null,
    },
    {
      title: "매입단가(KRW)",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      width: 115,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={text?.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][9] = el; // columnIndex를 맞추어 설정
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
          />
        ) : null,
    },
    {
      title: "매입단가(F)",
      dataIndex: "purchasePriceGlobal",
      key: "purchasePriceGlobal",
      width: 115,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            type="text" // Change to "text" to handle formatted input
            value={text?.toLocaleString()} // Display formatted value
            ref={(el) => {
              if (!inputRefs.current[index]) {
                inputRefs.current[index] = [];
              }
              inputRefs.current[index][10] = el; // columnIndex를 맞추어 설정
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
          />
        ) : null,
    },
    {
      title: "매입총액(KRW)",
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
            ).toLocaleString()} // Display formatted value
            style={{ width: "100%" }}
            readOnly
            addonBefore="₩"
          />
        ) : null,
    },
    {
      title: "매입총액(F)",
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
            ).toLocaleString()} // Display formatted value
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
            placeholder="margin"
            addonAfter={"%"}
            parser={(value) =>
              value ? parseFloat(value.replace(/ %/, "")) : 0
            }
            onChange={(value) => {
              const parsedValue = typeof value === "number" ? value : 0; // 숫자 타입이 아닐 경우 기본값으로 0 설정
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
        return (
          <InputNumber
            value={text}
            style={{ width: "100%" }}
            addonAfter={"%"}
            parser={(value) =>
              value ? parseFloat(value.replace(/ %/, "")) : 0
            }
            onChange={(value) => handleInputChange(index, "margin", value)}
            onBlur={() => handleMarginChange(index, text ?? 0)}
            controls={false}
          />
        );
      },
    },
  ];

  return (
    <div style={{ marginTop: 20, overflowX: "auto" }}>
      <TotalCards>
        <TotalCard>
          <span>매출총액(KRW)</span>
          <span className="value">
            ₩ {finalTotals.totalSalesAmountKRW.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매출총액(F)</span>
          <span className="value">
            F {finalTotals.totalSalesAmountGlobal.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(KRW)</span>
          <span className="value">
            ₩ {finalTotals.totalPurchaseAmountKRW.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(F)</span>
          <span className="value">
            F {finalTotals.totalPurchaseAmountGlobal.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={finalTotals.totalProfit >= 0}>
          <span>이익합계</span>
          <span className="value">
            ₩ {finalTotals.totalProfit.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard
          $isHighlight
          $isPositive={finalTotals.totalProfitPercent >= 0}
        >
          <span>이익율</span>
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
          onClick={applyDcAndCharge}
        />
      </TotalCards>
      <CustomTable
        rowKey="position"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ y: 600 }}
        virtual
      />
    </div>
  );
};

export default TableComponent;
