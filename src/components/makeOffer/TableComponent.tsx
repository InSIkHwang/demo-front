import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Table, Input, Select, InputNumber, Button, AutoComplete } from "antd";
import { ColumnsType } from "antd/es/table";
import styled, { CSSProperties } from "styled-components";
import { ItemDataType } from "../../types/types";
import { DeleteOutlined } from "@ant-design/icons";
import { fetchItemData } from "../../api/api";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  UniqueIdentifier,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import ChargeInputPopover from "./ChargeInputPopover";

const CustomTable = styled(Table)`
  .ant-table * {
    font-size: 13px;
  }

  .ant-table-cell {
    padding: 12px !important;
    text-align: center !important;
  }

  .highlight-cell {
    font-weight: bold;

    .ant-input-number-group-addon {
      background-color: #dff4ff;
    }
  }
  .ant-input-number-group-addon {
    padding: 0 2px;
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
  convertCurrency: (
    value: number,
    currency: number,
    toCurrency: "KRW" | "USD" | "EUR" | "INR"
  ) => number;
  updateGlobalPrices: () => void;
  calculateTotalAmount: (price: number, qty: number) => number;
  calculateMargin: (salesAmount: number, purchaseAmount: number) => number;
}

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  "data-row-key": number;
}

const Row = (props: RowProps) => {
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

  // Manually format transform values if transform is available
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

const TableComponent = ({
  dataSource,
  handleInputChange,
  currency,
  setDataSource,
  setIsDuplicate,
  roundToTwoDecimalPlaces,
  convertCurrency,
  updateGlobalPrices,
  calculateTotalAmount,
  calculateMargin,
}: TableComponentProps) => {
  const [totals, setTotals] = useState({
    totalSalesAmountKRW: 0,
    totalSalesAmountGlobal: 0,
    totalPurchaseAmountKRW: 0,
    totalPurchaseAmountGlobal: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
  });

  const [itemCodeOptions, setItemCodeOptions] = useState<{ value: string }[]>(
    []
  );
  const [itemNameMap, setItemNameMap] = useState<{ [key: string]: string }>({});
  const [itemIdMap, setItemIdMap] = useState<{ [key: string]: number }>({});
  const [supplierOptions, setSupplierOptions] = useState<
    { value: string; id: number; itemId: number; code: string; email: string }[]
  >([]);
  const [activeDragItem, setActiveDragItem] = useState<UniqueIdentifier | null>(
    null
  );
  const [unitOptions, setUnitOptions] = useState<string[]>(["PCS", "SET"]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  const itemIds: UniqueIdentifier[] = useMemo(
    () => dataSource.map((item) => item.position as UniqueIdentifier),
    [dataSource]
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragItem(event.active.id); // 드래그 시작 시 현재 아이템 ID 저장
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragItem(null); // 드래그가 끝나면 초기화

      const { active, over } = event; // event에서 active와 over 추출

      if (active.id !== over?.id) {
        setDataSource((prev) => {
          const activeIndex = prev.findIndex(
            (item) => item.position === active.id
          );
          const overIndex = prev.findIndex(
            (item) => item.position === over?.id
          );

          if (activeIndex === -1 || overIndex === -1) {
            return prev; // 인덱스가 잘못된 경우 원래 상태 반환
          }

          // 아이템의 순서를 변경
          const reorderedItems = arrayMove(prev, activeIndex, overIndex);

          // position 속성을 업데이트
          const updatedItems = reorderedItems.map((item, index) => ({
            ...item,
            position: index + 1, // position 속성 업데이트 (1부터 시작)
          }));

          return updatedItems;
        });
      }
    },
    [setDataSource]
  );
  const handleItemCodeChange = async (index: number, value: string) => {
    handleInputChange(index, "itemCode", value);

    if (value.trim() === "") {
      updateItemId(index, null);
      return;
    }

    try {
      const { items } = await fetchItemData(value);

      if (!Array.isArray(items)) {
        console.error("Items data is not an array:", items);
        return;
      }

      const itemArray = items;

      const newItemNameMap = itemArray.reduce<{ [key: number]: string }>(
        (acc, item) => {
          acc[item.itemId] = item.itemName;
          return acc;
        },
        {}
      );

      const newItemIdMap = itemArray.reduce<{ [key: number]: number }>(
        (acc, item) => {
          acc[item.itemId] = item.itemId;
          return acc;
        },
        {}
      );

      const newSupplierOptions = itemArray.flatMap((item) =>
        item.supplierList.map((supplier) => ({
          value: supplier.companyName,
          id: supplier.id,
          itemId: supplier.itemId,
          code: supplier.code,
          email: supplier.email,
        }))
      );

      setItemCodeOptions(
        itemArray.map((item) => ({
          value: item.itemCode,
          name: item.itemName,
          key: item.itemId.toString(),
          label: `${item.itemCode}: ${item.itemName}`,
          itemId: item.itemId,
        }))
      );
      setItemNameMap(newItemNameMap);
      setItemIdMap(newItemIdMap);

      setSupplierOptions((prevOptions) => [
        ...prevOptions,
        ...newSupplierOptions.filter(
          (newSupplier) =>
            !prevOptions.some(
              (existingSupplier) => existingSupplier.id === newSupplier.id
            )
        ),
      ]);

      const selectedItem = itemArray.find((item) => item.itemCode === value);
      if (selectedItem) {
        handleInputChange(index, "itemName", itemNameMap[selectedItem.itemId]);
        updateItemId(index, selectedItem.itemId);
      }
    } catch (error) {
      console.error("Error fetching item codes and suppliers:", error);
    }
  };

  const updateItemId = (index: number, itemId: number | null) => {
    setDataSource((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        itemId,
      };
      return updatedItems;
    });
  };

  const checkDuplicate = useCallback(
    (key: string, value: string, index: number) => {
      if (!value?.trim()) {
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
      ((totalProfit / totalSalesAmountKRW) * 100).toFixed(2)
    );

    setTotals({
      totalSalesAmountKRW,
      totalSalesAmountGlobal,
      totalPurchaseAmountKRW,
      totalPurchaseAmountGlobal,
      totalProfit,
      totalProfitPercent,
    });
  }, [dataSource, currency]);

  const handleAddItem = () => {
    const newItem: ItemDataType = {
      position: dataSource.length + 1,
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

    setDataSource([...dataSource, newItem]);
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

  const columns: ColumnsType<any> = [
    {
      title: "삭제",
      key: "delete",
      width: 60,
      render: (text: any, record: any, index: number) => (
        <Button
          type="default"
          onClick={() => handleDeleteItem(record.itemDetailId, record.position)}
          icon={<DeleteOutlined />}
        ></Button>
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
      title: "품목코드",
      dataIndex: "itemCode",
      key: "itemCode",
      fixed: "left",
      width: 130,
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
                handleInputChange(index, "itemCode", value); // itemCode 업데이트
                handleInputChange(index, "itemName", option.name); // itemName 업데이트
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
            value={text}
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
          <InputNumber
            value={text}
            onChange={(value) => handleInputChange(index, "qty", value ?? 0)}
            style={{ width: "100%" }}
            min={0}
            step={1}
            controls={false}
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
      width: 130,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={text?.toLocaleString()}
            onChange={(value) => {
              const updatedValue = Number(value) ?? 0;
              handleInputChange(
                index,
                "salesPriceKRW",
                roundToTwoDecimalPlaces(updatedValue)
              );
              handleInputChange(
                index,
                "salesPriceGlobal",
                convertCurrency(updatedValue, currency, "USD")
              );
            }}
            style={{ width: "100%" }}
            controls={false}
            addonBefore="₩"
          />
        ) : null,
    },
    {
      title: "매출단가(F)",
      dataIndex: "salesPriceGlobal",
      key: "salesPriceGlobal",
      width: 130,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={text?.toLocaleString()}
            onChange={(value) => {
              const updatedValue = Number(value) ?? 0;
              handleInputChange(
                index,
                "salesPriceGlobal",
                roundToTwoDecimalPlaces(updatedValue)
              );
              handleInputChange(
                index,
                "salesPriceKRW",
                convertCurrency(updatedValue, currency, "KRW")
              );
            }}
            style={{ width: "100%" }}
            controls={false}
            addonBefore="F"
          />
        ) : null,
    },
    {
      title: "매출총액(KRW)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 130,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={calculateTotalAmount(
              record.salesPriceKRW,
              record.qty
            ).toLocaleString()}
            style={{ width: "100%" }}
            readOnly
            className="highlight-cell"
            addonBefore="₩"
          />
        ) : null,
    },
    {
      title: "매출총액(F)",
      dataIndex: "salesAmountGlobal",
      key: "salesAmountGlobal",
      width: 130,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={calculateTotalAmount(
              record.salesPriceGlobal,
              record.qty
            ).toLocaleString()}
            style={{ width: "100%" }}
            readOnly
            className="highlight-cell"
            addonBefore="F"
          />
        ) : null,
    },
    {
      title: "매입단가(KRW)",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      width: 130,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={text?.toLocaleString()}
            onChange={(value) => {
              const updatedValue = Number(value) ?? 0;
              handleInputChange(
                index,
                "purchasePriceKRW",
                roundToTwoDecimalPlaces(updatedValue)
              );
              handleInputChange(
                index,
                "purchasePriceGlobal",
                convertCurrency(updatedValue, currency, "USD")
              );
            }}
            style={{ width: "100%" }}
            controls={false}
            addonBefore="₩"
          />
        ) : null,
    },
    {
      title: "매입단가(F)",
      dataIndex: "purchasePriceGlobal",
      key: "purchasePriceGlobal",
      width: 130,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={text?.toLocaleString()}
            onChange={(value) => {
              const updatedValue = Number(value) ?? 0;
              handleInputChange(
                index,
                "purchasePriceGlobal",
                roundToTwoDecimalPlaces(updatedValue)
              );
              handleInputChange(
                index,
                "purchasePriceKRW",
                convertCurrency(updatedValue, currency, "KRW")
              );
            }}
            style={{ width: "100%" }}
            controls={false}
            addonBefore="F"
          />
        ) : null,
    },
    {
      title: "매입총액(KRW)",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      width: 130,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={calculateTotalAmount(
              record.purchasePriceKRW,
              record.qty
            ).toLocaleString()}
            style={{ width: "100%" }}
            readOnly
            className="highlight-cell"
            addonBefore="₩"
          />
        ) : null,
    },
    {
      title: "매입총액(F)",
      dataIndex: "purchaseAmountGlobal",
      key: "purchaseAmountGlobal",
      width: 130,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={calculateTotalAmount(
              record.purchasePriceGlobal,
              record.qty
            ).toLocaleString()}
            style={{ width: "100%" }}
            readOnly
            className="highlight-cell"
            addonBefore="F"
          />
        ) : null,
    },
    {
      title: "마진(%)",
      dataIndex: "margin",
      key: "margin",
      width: 80,
      render: (text: number, record: any, index: number) => {
        const salesAmountKRW = calculateTotalAmount(
          record.salesPriceKRW,
          record.qty
        );
        const purchaseAmountKRW = calculateTotalAmount(
          record.purchasePriceKRW,
          record.qty
        );
        const marginPercent = calculateMargin(
          salesAmountKRW,
          purchaseAmountKRW
        );
        return (
          <InputNumber
            value={marginPercent}
            style={{ width: "100%" }}
            min={0}
            step={0.01}
            formatter={(value) => `${value} %`}
            parser={(value) =>
              value ? parseFloat(value.replace(/ %/, "")) : 0
            }
            readOnly
            className="highlight-cell"
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
            ₩ {totals.totalSalesAmountKRW.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매출총액(F)</span>
          <span className="value">
            F {totals.totalSalesAmountGlobal.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(KRW)</span>
          <span className="value">
            ₩ {totals.totalPurchaseAmountKRW.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(F)</span>
          <span className="value">
            F {totals.totalPurchaseAmountGlobal.toLocaleString()}
          </span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={totals.totalProfit >= 0}>
          <span>이익합계</span>
          <span className="value">₩ {totals.totalProfit.toLocaleString()}</span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={totals.totalProfitPercent >= 0}>
          <span>이익율</span>
          <span className="value">
            {isNaN(totals.totalProfitPercent) ? 0 : totals.totalProfitPercent}%
          </span>
        </TotalCard>
      </TotalCards>
      <ChargeInputPopover />
      <DndContext
        sensors={sensors}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <CustomTable
            components={{
              body: {
                row: Row,
              },
            }}
            rowKey="position"
            columns={columns}
            dataSource={dataSource}
            pagination={false}
          />
        </SortableContext>
      </DndContext>
      <Button
        type="primary"
        style={{ margin: "5px 0 10px 0" }}
        onClick={handleAddItem}
      >
        Add item
      </Button>
    </div>
  );
};

export default TableComponent;
