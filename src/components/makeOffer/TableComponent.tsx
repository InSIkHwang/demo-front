import React, { Dispatch, useEffect, useState } from "react";
import { Table, Input, Select, InputNumber, Button, AutoComplete } from "antd";
import { ColumnsType } from "antd/es/table";
import styled from "styled-components";
import { ItemDataType } from "../../types/types";
import { DeleteOutlined } from "@ant-design/icons";
import { fetchItemData } from "../../api/api";

const CustomTable = styled(Table)`
  .ant-table-cell {
    padding: 12px !important;
    text-align: center !important;
  }

  .highlight-cell {
    font-weight: bold;
    background-color: #dff4ff;
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

// 소수점 둘째자리까지 반올림하는 함수
const roundToTwoDecimalPlaces = (value: number) => {
  return Math.round(value * 100) / 100;
};

// 환율을 적용하여 KRW와 USD를 상호 변환하는 함수
const convertCurrency = (
  value: number,
  currency: number,
  toCurrency: "KRW" | "USD"
) => {
  if (toCurrency === "KRW") {
    return roundToTwoDecimalPlaces(value * currency);
  }
  return roundToTwoDecimalPlaces(value / currency);
};

// 수량과 단가를 곱하여 총액을 계산하는 함수
export const calculateTotalAmount = (price: number, qty: number) =>
  roundToTwoDecimalPlaces(price * qty);

// 마진을 계산하는 함수
const calculateMargin = (salesAmount: number, purchaseAmount: number) =>
  purchaseAmount === 0
    ? 0
    : roundToTwoDecimalPlaces(
        ((salesAmount - purchaseAmount) / purchaseAmount) * 100
      );

interface TableComponentProps {
  dataSource: ItemDataType[];
  setDataSource: Dispatch<ItemDataType[]>;
  handleInputChange: (
    index: number,
    key: keyof ItemDataType,
    value: any
  ) => void;
  currency: number;
}

const TableComponent = ({
  dataSource,
  handleInputChange,
  currency,
  setDataSource,
}: TableComponentProps) => {
  const [totals, setTotals] = useState({
    totalSalesAmountKRW: 0,
    totalSalesAmountUSD: 0,
    totalPurchaseAmountKRW: 0,
    totalPurchaseAmountUSD: 0,
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

  const handleItemCodeChange = (index: number, value: string) => {
    handleInputChange(index, "itemCode", value);

    if (value.trim() === "") {
      return;
    }

    const searchItemCode = async () => {
      try {
        const { items } = await fetchItemData(value);
        const itemArray = Array.isArray(items) ? items : [items];

        const newItemNameMap = itemArray.reduce<{ [key: string]: string }>(
          (acc, item) => {
            acc[item.itemCode] = item.itemName;
            return acc;
          },
          {}
        );

        const newItemIdMap = itemArray.reduce<{ [key: string]: number }>(
          (acc, item) => {
            acc[item.itemCode] = item.itemId;
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

        setItemCodeOptions(itemArray.map((item) => ({ value: item.itemCode })));
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

        if (newItemNameMap[value]) {
          handleInputChange(index, "itemName", newItemNameMap[value]);
        }

        if (newItemIdMap[value]) {
          const updatedItems = [...dataSource];
          updatedItems[index] = {
            ...updatedItems[index],
            itemId: newItemIdMap[value],
          };
          setDataSource(updatedItems);
        }
      } catch (error) {
        console.error("Error fetching item codes and suppliers:", error);
      }
    };
    searchItemCode();
  };

  useEffect(() => {
    const updatedDataSource = dataSource.map((item, index) => ({
      ...item,
      no: index + 1, // No. 추가
    }));

    setDataSource(updatedDataSource);
    const totalSalesAmountKRW = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.salesPriceKRW, record.qty),
      0
    );
    const totalSalesAmountUSD = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.salesPriceUSD, record.qty),
      0
    );
    const totalPurchaseAmountKRW = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.purchasePriceKRW, record.qty),
      0
    );
    const totalPurchaseAmountUSD = dataSource.reduce(
      (acc, record) =>
        acc + calculateTotalAmount(record.purchasePriceUSD, record.qty),
      0
    );
    const totalProfit = totalSalesAmountKRW - totalPurchaseAmountKRW;
    const totalProfitPercent = Number(
      ((totalProfit / totalSalesAmountKRW) * 100).toFixed(2)
    );

    setTotals({
      totalSalesAmountKRW,
      totalSalesAmountUSD,
      totalPurchaseAmountKRW,
      totalPurchaseAmountUSD,
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
      salesPriceUSD: 0,
      salesAmountKRW: 0,
      salesAmountUSD: 0,
      margin: 0,
      purchasePriceKRW: 0,
      purchasePriceUSD: 0,
      purchaseAmountKRW: 0,
      purchaseAmountUSD: 0,
    };

    setDataSource([...dataSource, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    const updatedDataSource = dataSource.filter((_, i) => i !== index);
    setDataSource(updatedDataSource);
  };

  const columns: ColumnsType<any> = [
    {
      title: "삭제",
      key: "delete",
      width: 60,
      render: (text: any, record: any, index: number) => (
        <Button
          type="default"
          onClick={() => handleDeleteItem(index)}
          icon={<DeleteOutlined />}
        ></Button>
      ),
    },
    {
      title: "No.",
      dataIndex: "no", // No. 값 표시
      key: "no",
      render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
      width: 50,
    },
    {
      title: "품목코드",
      dataIndex: "itemCode",
      key: "itemCode",
      fixed: "left",
      width: 150,
      render: (text: string, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <AutoComplete
            value={text}
            onChange={(value) => handleItemCodeChange(index, value)}
            options={itemCodeOptions}
            style={{ borderRadius: "4px", width: "100%" }}
          >
            <Input />
          </AutoComplete>
        ) : null,
    },
    {
      title: "OPT",
      dataIndex: "itemType",
      key: "itemType",
      width: 120,
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
      width: 300,
      render: (text: string, record: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, "itemName", e.target.value)}
          style={{ borderRadius: "4px", width: "100%" }}
        />
      ),
    },
    {
      title: "수량",
      dataIndex: "qty",
      key: "qty",
      width: 80,
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
      title: "단위",
      dataIndex: "unit",
      key: "unit",
      width: 80,
      render: (text: string, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <Input
            value={text}
            onChange={(e) => handleInputChange(index, "unit", e.target.value)}
            style={{ borderRadius: "4px", width: "100%" }}
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
      width: 150,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={text}
            onChange={(value) => {
              const updatedValue = value ?? 0;
              handleInputChange(
                index,
                "salesPriceKRW",
                roundToTwoDecimalPlaces(updatedValue)
              );
              handleInputChange(
                index,
                "salesPriceUSD",
                convertCurrency(updatedValue, currency, "USD")
              );
            }}
            style={{ width: "100%" }}
            min={0}
            step={0.01}
            formatter={(value) => `₩ ${value}`}
            parser={(value) => {
              // 빈 문자열이거나 공백만 있는 경우 0으로 변환
              if (!value || value.trim() === "") {
                return 0;
              }
              // 다른 경우 숫자로 변환
              return parseFloat(value.replace(/\₩\s?|,/g, "")) || 0;
            }}
            controls={false}
          />
        ) : null,
    },
    {
      title: "매출단가(USD)",
      dataIndex: "salesPriceUSD",
      key: "salesPriceUSD",
      width: 150,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={text}
            onChange={(value) => {
              const updatedValue = value ?? 0;
              handleInputChange(
                index,
                "salesPriceUSD",
                roundToTwoDecimalPlaces(updatedValue)
              );
              handleInputChange(
                index,
                "salesPriceKRW",
                convertCurrency(updatedValue, currency, "KRW")
              );
            }}
            style={{ width: "100%" }}
            min={0}
            step={0.01}
            formatter={(value) => `$ ${value}`}
            parser={(value) => {
              // 빈 문자열이거나 공백만 있는 경우 0으로 변환
              if (!value || value.trim() === "") {
                return 0;
              }
              // 다른 경우 숫자로 변환
              return parseFloat(value.replace(/\$\s?|,/g, "")) || 0;
            }}
            controls={false}
          />
        ) : null,
    },
    {
      title: "매출총액(KRW)",
      dataIndex: "salesAmountKRW",
      key: "salesAmountKRW",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={calculateTotalAmount(record.salesPriceKRW, record.qty)}
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `₩ ${value}`}
          parser={(value) => {
            // 빈 문자열이거나 공백만 있는 경우 0으로 변환
            if (!value || value.trim() === "") {
              return 0;
            }
            // 다른 경우 숫자로 변환
            return parseFloat(value.replace(/\₩\s?|,/g, "")) || 0;
          }}
          readOnly
          className="highlight-cell"
        />
      ),
    },
    {
      title: "매출총액(USD)",
      dataIndex: "salesAmountUSD",
      key: "salesAmountUSD",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={calculateTotalAmount(record.salesPriceUSD, record.qty)}
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `$ ${value}`}
          parser={(value) => {
            // 빈 문자열이거나 공백만 있는 경우 0으로 변환
            if (!value || value.trim() === "") {
              return 0;
            }
            // 다른 경우 숫자로 변환
            return parseFloat(value.replace(/\$\s?|,/g, "")) || 0;
          }}
          readOnly
          className="highlight-cell"
        />
      ),
    },
    {
      title: "매입단가(KRW)",
      dataIndex: "purchasePriceKRW",
      key: "purchasePriceKRW",
      width: 150,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={text}
            onChange={(value) => {
              const updatedValue = value ?? 0;
              handleInputChange(
                index,
                "purchasePriceKRW",
                roundToTwoDecimalPlaces(updatedValue)
              );
              handleInputChange(
                index,
                "purchasePriceUSD",
                convertCurrency(updatedValue, currency, "USD")
              );
            }}
            style={{ width: "100%" }}
            min={0}
            step={0.01}
            formatter={(value) => `₩ ${value}`}
            parser={(value) => {
              // 빈 문자열이거나 공백만 있는 경우 0으로 변환
              if (!value || value.trim() === "") {
                return 0;
              }
              // 다른 경우 숫자로 변환
              return parseFloat(value.replace(/\₩\s?|,/g, "")) || 0;
            }}
            controls={false}
          />
        ) : null,
    },
    {
      title: "매입단가(USD)",
      dataIndex: "purchasePriceUSD",
      key: "purchasePriceUSD",
      width: 150,
      render: (text: number, record: any, index: number) =>
        record.itemType === "ITEM" ? (
          <InputNumber
            value={text}
            onChange={(value) => {
              const updatedValue = value ?? 0;
              handleInputChange(
                index,
                "purchasePriceUSD",
                roundToTwoDecimalPlaces(updatedValue)
              );
              handleInputChange(
                index,
                "purchasePriceKRW",
                convertCurrency(updatedValue, currency, "KRW")
              );
            }}
            style={{ width: "100%" }}
            min={0}
            step={0.01}
            formatter={(value) => `$ ${value}`}
            parser={(value) => {
              // 빈 문자열이거나 공백만 있는 경우 0으로 변환
              if (!value || value.trim() === "") {
                return 0;
              }
              // 다른 경우 숫자로 변환
              return parseFloat(value.replace(/\$\s?|,/g, "")) || 0;
            }}
            controls={false}
          />
        ) : null,
    },
    {
      title: "매입총액(KRW)",
      dataIndex: "purchaseAmountKRW",
      key: "purchaseAmountKRW",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={calculateTotalAmount(record.purchasePriceKRW, record.qty)}
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `₩ ${value}`}
          parser={(value) => {
            // 빈 문자열이거나 공백만 있는 경우 0으로 변환
            if (!value || value.trim() === "") {
              return 0;
            }
            // 다른 경우 숫자로 변환
            return parseFloat(value.replace(/\₩\s?|,/g, "")) || 0;
          }}
          readOnly
          className="highlight-cell"
        />
      ),
    },
    {
      title: "매입총액(USD)",
      dataIndex: "purchaseAmountUSD",
      key: "purchaseAmountUSD",
      width: 150,
      render: (text: number, record: any, index: number) => (
        <InputNumber
          value={calculateTotalAmount(record.purchasePriceUSD, record.qty)}
          style={{ width: "100%" }}
          min={0}
          step={0.01}
          formatter={(value) => `$ ${value}`}
          parser={(value) => {
            // 빈 문자열이거나 공백만 있는 경우 0으로 변환
            if (!value || value.trim() === "") {
              return 0;
            }
            // 다른 경우 숫자로 변환
            return parseFloat(value.replace(/\$\s?|,/g, "")) || 0;
          }}
          readOnly
          className="highlight-cell"
        />
      ),
    },
    {
      title: "마진(%)",
      dataIndex: "margin",
      key: "margin",
      width: 120,
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
            ₩ {totals.totalSalesAmountKRW.toFixed(2)}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매출총액(USD)</span>
          <span className="value">
            $ {totals.totalSalesAmountUSD.toFixed(2)}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(KRW)</span>
          <span className="value">
            ₩ {totals.totalPurchaseAmountKRW.toFixed(2)}
          </span>
        </TotalCard>
        <TotalCard>
          <span>매입총액(USD)</span>
          <span className="value">
            $ {totals.totalPurchaseAmountUSD.toFixed(2)}
          </span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={totals.totalProfit >= 0}>
          <span>이익합계</span>
          <span className="value">₩ {totals.totalProfit.toFixed(2)}</span>
        </TotalCard>
        <TotalCard $isHighlight $isPositive={totals.totalProfitPercent >= 0}>
          <span>이익율</span>
          <span className="value">
            {isNaN(totals.totalProfitPercent) ? 0 : totals.totalProfitPercent}%
          </span>
        </TotalCard>
      </TotalCards>
      <Button
        type="primary"
        style={{ margin: "5px 0 10px 0" }}
        onClick={handleAddItem}
      >
        추가
      </Button>
      <CustomTable
        columns={columns}
        dataSource={dataSource}
        rowKey="itemDetailId"
        pagination={false}
        scroll={{ x: 2000 }}
        bordered
      />
    </div>
  );
};

export default TableComponent;
