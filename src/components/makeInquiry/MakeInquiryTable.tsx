import React, {
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Table,
  AutoComplete,
  Input,
  Select,
  Button,
  notification,
  Tooltip,
  Tag,
  Space,
} from "antd";
import {
  DeleteOutlined,
  FileExcelOutlined,
  ExportOutlined,
  PlusCircleOutlined,
  CloseCircleOutlined,
  ZoomOutOutlined,
  ZoomInOutlined,
} from "@ant-design/icons";
import { InquiryItem, InquiryResponse, InquiryTable } from "../../types/types";
import ExcelUploadModal from "../ExcelUploadModal";
import { ColumnsType } from "antd/es/table";
import { handleExport } from "../../api/api";
import styled, { css } from "styled-components";
import { TextAreaRef } from "antd/es/input/TextArea";

const { Option } = Select;

interface TableProps {
  $zoomLevel?: number;
}

const CustomTable = styled(Table)<TableProps>`
  .ant-table * {
    font-size: ${(props) =>
      props.$zoomLevel ? `${13 * props.$zoomLevel}px` : "13px"};
  }

  .ant-table-cell {
    padding: ${(props) =>
      props.$zoomLevel
        ? `${14 * props.$zoomLevel}px ${4 * props.$zoomLevel}px`
        : "14px 4px"} !important;
    text-align: center !important;
    align-self: center;
    border: none !important;
  }

  ${(props) => css`
    .maker-row {
      background-color: #deefffd8;
      &:hover {
        background-color: #deefff !important;
      }
      .ant-table-cell-row-hover {
        background-color: #deefff !important;
      }
    }

    .type-row {
      background-color: #fffdded8;
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

    .item-row {
      &:hover {
        background-color: #fafafa !important;
      }
    }
  `}
`;

interface DuplicateState {
  code: boolean;
  name: boolean;
  all: boolean;
}

interface MakeInquiryTableProps {
  items: InquiryItem[];
  inquiryDetail?: InquiryResponse | null;
  handleInputChange: (
    index: number,
    field: keyof InquiryItem,
    value: string | number
  ) => void;
  handleItemCodeChange: (index: number, value: string) => void;
  itemCodeOptions: {
    itemId: number;
    value: string;
    name: string;
    key: string;
    label: string;
  }[];
  setIsDuplicate: Dispatch<SetStateAction<boolean>>;
  setItems: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
  updateItemId: (index: number, itemId: number | null) => void;
  customerInquiryId: number;
  setItemCodeOptions: Dispatch<
    SetStateAction<
      {
        itemId: number;
        value: string;
        name: string;
        key: string;
        label: string;
      }[]
    >
  >;
  uniqueSuppliers?:
    | {
        code: string;
        communicationLanguage: string;
        email: string | null;
        id: number;
        korName: string;
        name: string;
        supplierRemark: string;
      }[]
    | undefined;
  tables: InquiryTable[];
  setTables: React.Dispatch<React.SetStateAction<InquiryTable[]>>;
  setCurrentTableNo: React.Dispatch<React.SetStateAction<number>>;
}

interface TableSectionProps extends MakeInquiryTableProps {
  tableIndex: number;
  onDeleteTable: (index: number) => void;
  columns: ColumnsType<any>;
  tables: InquiryTable[];
  setTables: React.Dispatch<React.SetStateAction<InquiryTable[]>>;
  handleAddItem: (tableIndex: number, position: number) => void;
  setCurrentTableNo: Dispatch<SetStateAction<number>>;
  zoomLevel: number;
  setZoomLevel: Dispatch<SetStateAction<number>>;
  customerInquiryId: number;
}

// 개별 테이블 컴포넌트
function TableSection({
  items,
  tableIndex,
  onDeleteTable,
  columns,
  handleAddItem,
  tables,
  setTables,
  uniqueSuppliers,
  setCurrentTableNo,
  setItems,
  zoomLevel,
  setZoomLevel,
  customerInquiryId,
}: TableSectionProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const currentTable = tables[tableIndex];

  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.5; // 최소 50% 크기
  const MAX_ZOOM = 1.5; // 최대 150% 크기

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const handleSupplierSelect = (supplierId: number) => {
    const selectedSupplier = uniqueSuppliers?.find(
      (supplier) => supplier.id === supplierId
    );

    if (selectedSupplier) {
      setTables((prevTables) => {
        const updatedTables = [...prevTables];
        const targetTable = { ...updatedTables[tableIndex] };

        // 이미 존재하는 supplier인지 확인
        const isExisting = targetTable.supplierList?.some(
          (supplier) => supplier.supplierId === supplierId
        );

        if (!isExisting) {
          // supplierList가 없으면 새로 생성
          if (!targetTable.supplierList) {
            targetTable.supplierList = [];
          }

          // 새로운 supplier 추가
          targetTable.supplierList.push({
            inquiryItemDetailId: undefined,
            supplierId: selectedSupplier.id,
            code: selectedSupplier.code,
            companyName: selectedSupplier.name,
            korCompanyName: selectedSupplier.korName,
            representative: "",
            email: selectedSupplier.email || "",
            communicationLanguage: selectedSupplier.communicationLanguage,
            supplierRemark: selectedSupplier.supplierRemark,
          });

          updatedTables[tableIndex] = targetTable;
        }
        return updatedTables;
      });
    }
  };

  // 컴포넌트가 마운트되거나 tableIndex가 변경될 때 현재 테이블 번호 설정
  useEffect(() => {
    setCurrentTableNo(tableIndex + 1);
  }, [tableIndex, setCurrentTableNo]);

  const handleSupplierRemove = (supplierId: number) => {
    setTables((prevTables) => {
      const updatedTables = [...prevTables];
      const targetTable = { ...updatedTables[tableIndex] };

      // supplierList에서 해당 supplier 제거
      targetTable.supplierList = targetTable.supplierList?.filter(
        (supplier) => supplier.supplierId !== supplierId
      );

      updatedTables[tableIndex] = targetTable;
      return updatedTables;
    });
  };

  // 공통 데이터 처리 함수
  const updateItems = (
    mappedItems: InquiryItem[],
    shouldOverwrite: boolean
  ) => {
    if (!Array.isArray(mappedItems)) {
      console.error("mappedItems is not an array");
      return;
    }

    // tables 상태 업데이트
    setTables((prevTables) => {
      const updatedTables = [...prevTables];
      const targetTable = { ...updatedTables[tableIndex] };

      if (shouldOverwrite) {
        // 덮어쓰기 모드
        targetTable.itemDetails = mappedItems.map((item, idx) => ({
          ...item,
          position: idx + 1,
          tableNo: tableIndex + 1,
        }));
      } else {
        // 추가 모드
        const currentMaxPosition = Math.max(
          ...targetTable.itemDetails.map((item) => item.position),
          0
        );

        targetTable.itemDetails = [
          ...targetTable.itemDetails,
          ...mappedItems.map((item, idx) => ({
            ...item,
            position: currentMaxPosition + idx + 1,
            tableNo: tableIndex + 1,
          })),
        ];
      }

      updatedTables[tableIndex] = targetTable;
      return updatedTables;
    });

    // items 상태도 함께 업데이트
    setItems((prevItems) => {
      const otherTableItems = prevItems.filter(
        (item) => item.tableNo !== tableIndex + 1
      );

      const updatedTableItems = shouldOverwrite
        ? mappedItems.map((item, idx) => ({
            ...item,
            position: idx + 1,
            tableNo: tableIndex + 1,
          }))
        : [
            ...prevItems.filter((item) => item.tableNo === tableIndex + 1),
            ...mappedItems.map((item, idx) => ({
              ...item,
              position:
                prevItems.filter((item) => item.tableNo === tableIndex + 1)
                  .length +
                idx +
                1,
              tableNo: tableIndex + 1,
            })),
          ];

      return [...otherTableItems, ...updatedTableItems].sort((a, b) => {
        if (a.tableNo !== b.tableNo) {
          return a.tableNo - b.tableNo;
        }
        return a.position - b.position;
      });
    });

    setIsModalVisible(false);
  };

  // 데이터를 추가하는 함수
  const handleApplyExcelData = (mappedItems: InquiryItem[]) => {
    updateItems(mappedItems, false); // false는 추 모드를 의미
  };

  // 데이터를 덮어쓰는 함수
  const handleOverwriteExcelData = (mappedItems: InquiryItem[]) => {
    updateItems(mappedItems, true); // true는 덮어쓰기 모드를 의미
  };

  const handleExportButtonClick = async () => {
    try {
      // 선택한 파일들의 이름을 서버로 전송
      const response = await handleExport(customerInquiryId);

      // 사용자가 로를 설정하여 파일 다운로드할 수 있도록 설정
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

  return (
    <div
      style={{
        marginBottom: "20px",
        position: "relative",
        border: "1px solid #f0f0f0",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          borderBottom: "1px solid #f0f0f0",
          paddingBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ margin: "0 10px 0 0" }}>Suplliers: </span>
          <Tooltip title="Search a supplier before you add">
            <Select
              style={{ width: 200, marginRight: 8 }}
              placeholder="Select a supplier to add"
              onChange={handleSupplierSelect}
              options={uniqueSuppliers?.map((supplier) => ({
                value: supplier.id,
                label: `${supplier.code}`,
              }))}
            />
          </Tooltip>
          {currentTable?.supplierList?.map((supplier) => (
            <Tooltip
              key={supplier.supplierId}
              title={`${
                supplier.supplierRemark ? ` ${supplier.supplierRemark}` : ""
              }`}
              color={"red"}
            >
              <Tag
                closable
                onClose={(e) => {
                  e.preventDefault();
                  handleSupplierRemove(supplier.supplierId);
                }}
                closeIcon={<CloseCircleOutlined />}
                color={supplier.supplierRemark ? "red" : "default"}
                style={{ marginLeft: 4 }}
              >
                {supplier.code}
              </Tag>
            </Tooltip>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Button
            type="default"
            onClick={() => setIsModalVisible(true)}
            icon={<FileExcelOutlined />}
          >
            Load Excel
          </Button>
          <Button
            type="default"
            icon={<ExportOutlined />}
            onClick={handleExportButtonClick}
          >
            Export Excel
          </Button>
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            size="middle"
            onClick={() => handleAddItem(tableIndex, items.length)}
          >
            Add Item
          </Button>
          {tableIndex > 0 && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDeleteTable(tableIndex)}
              size="middle"
            >
              Delete Table
            </Button>
          )}
        </div>
      </div>
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
      </Space>{" "}
      <div
        style={
          {
            "--table-scale": zoomLevel,
          } as React.CSSProperties
        }
      >
        <CustomTable
          $zoomLevel={zoomLevel}
          rowClassName={(record: any) => {
            if (record.itemType === "MAKER") {
              return "maker-row";
            } else if (record.itemType === "TYPE") {
              return "type-row";
            } else if (record.itemType === "DESC") {
              return "desc-row";
            } else {
              return "item-row";
            }
          }}
          columns={columns}
          dataSource={currentTable.itemDetails}
          pagination={false}
          rowKey="position"
          scroll={{ y: 500 }}
          virtual
          size="small"
          onRow={() => ({
            onClick: () => setCurrentTableNo(tableIndex + 1),
          })}
        />
      </div>
      <ExcelUploadModal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onApply={handleApplyExcelData}
        onOverWrite={handleOverwriteExcelData}
        currency={1}
        type={"inquiry"}
      />
    </div>
  );
}

function MakeInquiryTable({
  items,
  inquiryDetail,
  handleInputChange,
  handleItemCodeChange,
  itemCodeOptions,
  setItemCodeOptions,
  setIsDuplicate,
  setItems,
  updateItemId,
  customerInquiryId,
  tables,
  setTables,
  setCurrentTableNo,
  uniqueSuppliers,
}: MakeInquiryTableProps) {
  const [isDataReady, setIsDataReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // 초기 데이터를 테이블별로 분리
  useEffect(() => {
    if (!inquiryDetail?.table) return;

    // 서버 응답의 table 구조를 변환하여 사용
    const formattedTables: InquiryTable[] = inquiryDetail.table.map(
      (table) => ({
        itemDetails: table.itemDetails,
        supplierList: table.supplierList || [],
      })
    );

    setTables(formattedTables);

    // items 상태도 모든 테이블의 itemDetails를 하나의 배열로 합쳐서 업데이트
    const allItems = inquiryDetail.table.flatMap((table) => table.itemDetails);
    setItems(allItems);
    // 데이터가 준비되었음을 표시
    setIsDataReady(true);
  }, [inquiryDetail]);

  // 새로운 useEffect 추가 (items가 없을 때의 초기 상태 처리)
  useEffect(() => {
    if (!inquiryDetail && items.length === 0) {
      setTables([{ itemDetails: [], supplierList: [] }]);
      setIsDataReady(true);
    } else if (!inquiryDetail && items.length > 0) {
      setTables([{ itemDetails: items, supplierList: [] }]);
      setIsDataReady(true);
    }
  }, []);

  // 새 테이블 추가
  const handleAddTable = () => {
    const newTableIndex = tables.length; // 현재 테이블의 개수를 사용하여 새로운 테이블의 인덱스를 설정

    const newTableItems: InquiryItem[] = [
      {
        position: 1,
        tableNo: newTableIndex + 1, // tableIndex를 tableNo로 설정
        itemType: "MAKER",
        itemCode: "",
        itemName: "[MAKER]",
        itemRemark: "",
        qty: 0,
        unit: "",
      },
      {
        position: 2,
        tableNo: newTableIndex + 1, // tableIndex를 tableNo로 설정
        itemType: "TYPE",
        itemCode: "",
        itemName: "[TYPE]",
        itemRemark: "",
        qty: 0,
        unit: "",
      },
      {
        position: 3,
        tableNo: newTableIndex + 1, // tableIndex를 tableNo로 설정
        itemType: "ITEM",
        itemCode: "",
        itemName: "",
        itemRemark: "",
        qty: 0,
        unit: "",
      },
    ];

    const newTable = { itemDetails: newTableItems, supplierList: [] };

    setTables((prevTables) => [...prevTables, newTable]);
    setItems((prevItems) => [...prevItems, ...newTableItems]);
  };

  // 테이블 삭제
  const handleDeleteTable = (tableIndex: number) => {
    setTables((prevTables) =>
      prevTables.filter((_, index) => index !== tableIndex)
    );

    const updatedItems = items.filter(
      (item) =>
        !tables[tableIndex].itemDetails.some(
          (tableItem) => tableItem.position === item.position
        )
    );

    setItems(updatedItems);
  };

  const [unitOptions, setUnitOptions] = useState<string[]>(["PCS", "SET"]);
  const [duplicateStates, setDuplicateStates] = useState<{
    [key: string]: DuplicateState;
  }>({});
  const inputRefs = useRef<{ [tableIndex: number]: (TextAreaRef | null)[][] }>(
    {}
  );

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
    [handleInputChange] // handleInputChange가 변경되면 handleKeyDown도 변경되면 빈 배열로 설정
  );

  const checkDuplicates = useCallback(
    (key: string, value: string, index: number, items: any[]) => {
      // 빈 값인 경우 false 반
      if (!(value + "")?.trim()) {
        return false;
      }

      // 값이 같은지 검사하고, 현재 인덱스를 제외한 다른 인덱스와 비교
      return items.some((item, idx) => item[key] === value && idx !== index);
    },
    [] // 의존성이 필요 다면 빈 배열로 설정
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

  const handleUnitBlur = (index: number, value: string) => {
    handleInputChange(index, "unit", value);
    setUnitOptions((prevOptions) =>
      prevOptions.includes(value) ? prevOptions : [...prevOptions, value]
    );
  };

  const applyUnitToAllRows = (selectedUnit: string) => {
    if (!items) return;

    setTables((prevTables) =>
      prevTables.map((table) => ({
        ...table,
        itemDetails: table.itemDetails.map((item) => ({
          ...item,
          unit: selectedUnit,
        })),
      }))
    );
  };

  const handleNextRowKeyDown = (
    e: React.KeyboardEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLDivElement
    >,
    tableIndex: number,
    rowIndex: number,
    columnIndex: number
  ) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();

      // 현재 테이블의 inputRefs 가져오기
      const currentTableRefs = inputRefs.current[tableIndex];
      if (!currentTableRefs) return;

      if (
        e.key === "ArrowDown" &&
        currentTableRefs[rowIndex + 1]?.[columnIndex]
      ) {
        currentTableRefs[rowIndex + 1][columnIndex]?.focus();
      } else if (
        e.key === "ArrowUp" &&
        currentTableRefs[rowIndex - 1]?.[columnIndex]
      ) {
        currentTableRefs[rowIndex - 1][columnIndex]?.focus();
      }
    }
  };

  const handleAddItem = useCallback((tableIndex: number, position: number) => {
    setTables((prevTables) => {
      const updatedTables = [...prevTables];
      const targetTable = { ...updatedTables[tableIndex] };
      const currentTableItems = targetTable?.itemDetails;

      // 현재 테이블에서 선택한 아이템의 실제 인덱스 찾기
      const itemIndexInTable =
        currentTableItems?.findIndex((item) => item?.position === position) ??
        -1;

      // 현재 테이블의 최대 position 찾기
      const maxPosition = Math.max(
        ...currentTableItems.map((item) => item.position)
      );

      const newItem: InquiryItem = {
        position: maxPosition + 1, // 현재 테이블의 최대 position + 1
        tableNo: tableIndex + 1,
        itemType: "ITEM",
        itemCode: "",
        itemName: "",
        itemRemark: "",
        qty: 0,
        unit: "",
      };

      // 현재 테이블의 아이템들 업데이트
      targetTable.itemDetails = [
        ...currentTableItems.slice(0, itemIndexInTable + 1), // 현재 아이템까지
        newItem, // 새 아이템
        ...currentTableItems.slice(itemIndexInTable + 1), // 나머지 아이템들
      ];

      // position 재정렬
      targetTable.itemDetails = targetTable.itemDetails.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));

      updatedTables[tableIndex] = targetTable;
      return updatedTables;
    });

    setItems((prevItems) => {
      // 현재 테이블의 아이템들만 필터링
      const currentTableItems = prevItems.filter(
        (item) => item.tableNo === tableIndex + 1
      );
      const otherTableItems = prevItems.filter(
        (item) => item.tableNo !== tableIndex + 1
      );

      // 현재 테이블에서 선택한 아이템의 인덱스 찾기
      const itemIndex = currentTableItems.findIndex(
        (item) => item.position === position
      );

      // 새 아이템 생성
      const newItem: InquiryItem = {
        position: itemIndex + 2, // 선택한 아이템 다음 위치
        tableNo: tableIndex + 1,
        itemType: "ITEM",
        itemCode: "",
        itemName: "",
        itemRemark: "",
        qty: 0,
        unit: "",
      };

      // 현재 테이블의 아이템들 업데이트
      const updatedTableItems = [
        ...currentTableItems.slice(0, itemIndex + 1),
        newItem,
        ...currentTableItems.slice(itemIndex + 1),
      ].map((item, idx) => ({
        ...item,
        position: idx + 1, // position을 1부터 순차적으로 재할당
      }));

      // 모든 테이블의 아이템들 합치기
      return [...otherTableItems, ...updatedTableItems].sort((a, b) => {
        // tableNo로 먼저 정렬하고, 같은 테이블 내에서는 position으로 정렬
        if (a.tableNo !== b.tableNo) {
          return a.tableNo - b.tableNo;
        }
        return a.position - b.position;
      });
    });
  }, []);

  const handleDeleteItem = useCallback(
    (tableIndex: number, position: number) => {
      setTables((prevTables) => {
        const updatedTables = [...prevTables];
        const targetTable = { ...updatedTables[tableIndex] };

        // 현재 테이블에서 해당 position의 아이템 제거
        targetTable.itemDetails = targetTable.itemDetails
          .filter((item) => item.position !== position)
          // position 재정렬
          .map((item, idx) => ({
            ...item,
            position: idx + 1,
          }));

        updatedTables[tableIndex] = targetTable;
        return updatedTables;
      });

      setItems((prevItems) => {
        // 현재 테이블의 아이템들만 필터링
        const currentTableItems = prevItems.filter(
          (item) => item.tableNo === tableIndex + 1
        );
        const otherTableItems = prevItems.filter(
          (item) => item.tableNo !== tableIndex + 1
        );

        // 현재 테이블의 아이템들 업데이트
        const updatedTableItems = currentTableItems
          .filter((item) => item.position !== position)
          .map((item, idx) => ({
            ...item,
            position: idx + 1, // position을 1부터 순차적으로 재할당
          }));

        // 모든 테이블의 아이템들 합치기
        return [...otherTableItems, ...updatedTableItems].sort((a, b) => {
          // tableNo로 먼저 정렬하고, 같은 테이블 내에서는 position으로 정렬
          if (a.tableNo !== b.tableNo) {
            return a.tableNo - b.tableNo;
          }
          return a.position - b.position;
        });
      });
    },
    []
  );

  const columns: ColumnsType<any> = [
    {
      title: "No.",
      dataIndex: "no",
      key: "no",
      width: 40 * zoomLevel,
      render: (_: any, record: any) => {
        if (!items || items.length === 0) {
          return null;
        }

        if (record.itemType === "ITEM") {
          // 현재 테이블의 ITEM 타입 아이템들만 필터링
          const currentTableItems = items.filter(
            (item: any) =>
              item.itemType === "ITEM" && item.tableNo === record.tableNo
          );

          // 현재 아이템의 인덱스 찾기
          const itemIndex = currentTableItems.findIndex(
            (item) => item.position === record.position
          );

          // 1부터 시작하는 번호 반환
          return itemIndex !== -1 ? <span>{itemIndex + 1}</span> : null;
        }
        return null;
      },
    },
    {
      title: "PartNo",
      dataIndex: "itemCode",
      key: "itemCode",
      render: (text: string, record: InquiryItem, index: number) => {
        const tableIndex = record.tableNo - 1;
        return record.itemType === "ITEM" ? (
          <div>
            <AutoComplete
              value={record.itemCode}
              onChange={(value) => handleItemCodeChange(index, value)}
              options={itemCodeOptions.map((option) => ({
                value: option.key,
                label: option.label,
                name: option.name,
                itemId: option.itemId,
              }))}
              onFocus={() => {
                setItemCodeOptions([]);
              }}
              onSelect={(key: string, option: any) => {
                const selectedOption = itemCodeOptions.find(
                  (opt) => opt.key === key
                );

                if (selectedOption) {
                  updateItemId(index, selectedOption.itemId);
                  handleInputChange(index, "itemCode", selectedOption.value);
                  handleInputChange(index, "itemName", selectedOption.name);
                }
              }}
              dropdownStyle={{ width: 400 }}
              style={{ width: "100%" }}
              ref={(el) => {
                if (!inputRefs.current[tableIndex]) {
                  inputRefs.current[tableIndex] = [];
                }
                if (!inputRefs.current[tableIndex][index]) {
                  inputRefs.current[tableIndex][index] = [];
                }
                inputRefs.current[tableIndex][index][1] = el;
              }}
              onKeyDown={(e) => handleNextRowKeyDown(e, tableIndex, index, 1)}
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
              if (!inputRefs.current[tableIndex]) {
                inputRefs.current[tableIndex] = [];
              }
              if (!inputRefs.current[tableIndex][index]) {
                inputRefs.current[tableIndex][index] = [];
              }
              inputRefs.current[tableIndex][index][1] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, tableIndex, index, 1)}
          ></Input>
        );
      },
      width: 300 * zoomLevel,
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
      width: 120 * zoomLevel,
    },
    {
      title: "Name",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string, record: InquiryItem, index: number) => {
        const tableIndex = record.tableNo - 1;
        return (
          <div
            style={{
              whiteSpace: "normal",
              wordWrap: "break-word",
              wordBreak: "break-all",
            }}
          >
            <Input.TextArea
              ref={(el) => {
                if (!inputRefs.current[tableIndex]) {
                  inputRefs.current[tableIndex] = [];
                }
                if (!inputRefs.current[tableIndex][index]) {
                  inputRefs.current[tableIndex][index] = [];
                }
                inputRefs.current[tableIndex][index][3] = el;
              }}
              value={text}
              onKeyDown={(e) => handleNextRowKeyDown(e, tableIndex, index, 3)}
              onChange={(e) => {
                handleInputChange(index, "itemName", e.target.value);
                updateItemId(index, null);
              }}
              style={{
                borderColor: duplicateStates[record.position]?.name
                  ? "#faad14"
                  : "#d9d9d9",
              }}
              autoSize={{ minRows: 1, maxRows: 10 }} // 최소 1행, 최대 4행으로 정
            />
            {duplicateStates[record.position]?.name && (
              <div style={{ color: "#faad14", marginTop: "5px" }}>
                duplicate name.
              </div>
            )}
          </div>
        );
      },
      width: 450 * zoomLevel,
    },
    {
      title: "QTY",
      dataIndex: "qty",
      key: "qty",
      render: (text: number, record: InquiryItem, index: number) => {
        const tableIndex = record.tableNo - 1;
        return record.itemType === "ITEM" ? (
          <Input
            type="text" // type을 text로 변경
            value={text}
            ref={(el) => {
              if (!inputRefs.current[tableIndex]) {
                inputRefs.current[tableIndex] = [];
              }
              if (!inputRefs.current[tableIndex][index]) {
                inputRefs.current[tableIndex][index] = [];
              }
              inputRefs.current[tableIndex][index][4] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, tableIndex, index, 4)}
            onChange={(e) => {
              handleInputChange(index, "qty", e.target.value);
            }}
            onBlur={(e) => {
              const value = e.target.value;
              const unformattedValue = value.replace(/,/g, "");
              const updatedValue = isNaN(Number(unformattedValue))
                ? 0
                : Number(unformattedValue);
              handleInputChange(index, "qty", updatedValue);
            }}
          />
        ) : (
          <Input
            readOnly
            ref={(el) => {
              if (!inputRefs.current[tableIndex]) {
                inputRefs.current[tableIndex] = [];
              }
              if (!inputRefs.current[tableIndex][index]) {
                inputRefs.current[tableIndex][index] = [];
              }
              inputRefs.current[tableIndex][index][4] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, tableIndex, index, 4)}
          ></Input>
        );
      },
      width: 80 * zoomLevel,
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
      render: (text: string, record: InquiryItem, index: number) => {
        const tableIndex = record.tableNo - 1;
        return record.itemType === "ITEM" ? (
          <Input
            ref={(el) => {
              if (!inputRefs.current[tableIndex]) {
                inputRefs.current[tableIndex] = [];
              }
              if (!inputRefs.current[tableIndex][index]) {
                inputRefs.current[tableIndex][index] = [];
              }
              inputRefs.current[tableIndex][index][2] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, tableIndex, index, 2)}
            value={text}
            onBlur={(e) => handleUnitBlur(index, e.target.value)}
            onChange={(e) => handleInputChange(index, "unit", e.target.value)}
          />
        ) : (
          <Input
            readOnly
            ref={(el) => {
              if (!inputRefs.current[tableIndex]) {
                inputRefs.current[tableIndex] = [];
              }
              if (!inputRefs.current[tableIndex][index]) {
                inputRefs.current[tableIndex][index] = [];
              }
              inputRefs.current[tableIndex][index][2] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, tableIndex, index, 2)}
          ></Input>
        );
      },
      width: 110 * zoomLevel,
    },
    {
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      render: (text: string, record: InquiryItem, index: number) => {
        const tableIndex = record.tableNo - 1;
        return (
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 10 }}
            value={text}
            ref={(el) => {
              if (!inputRefs.current[tableIndex]) {
                inputRefs.current[tableIndex] = [];
              }
              if (!inputRefs.current[tableIndex][index]) {
                inputRefs.current[tableIndex][index] = [];
              }
              inputRefs.current[tableIndex][index][5] = el;
            }}
            onKeyDown={(e) => handleNextRowKeyDown(e, tableIndex, index, 5)}
            onChange={(e) =>
              handleInputChange(index, "itemRemark", e.target.value)
            }
          />
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <div>
          <Button
            icon={<PlusCircleOutlined />}
            type="default"
            style={{ marginRight: 10 }}
            size="small"
            onClick={() => handleAddItem(record.tableNo - 1, record.position)}
          />
          <Button
            icon={<DeleteOutlined />}
            type="default"
            danger
            size="small"
            onClick={() =>
              handleDeleteItem(record.tableNo - 1, record.position)
            }
          />
        </div>
      ),
      width: 120 * zoomLevel,
    },
  ];

  return (
    <>
      {isDataReady &&
        tables.map((table, index) => (
          <TableSection
            key={`table-${index}`}
            tableIndex={index}
            items={table.itemDetails}
            onDeleteTable={handleDeleteTable}
            inquiryDetail={inquiryDetail}
            handleInputChange={handleInputChange}
            handleItemCodeChange={handleItemCodeChange}
            itemCodeOptions={itemCodeOptions}
            setItemCodeOptions={setItemCodeOptions}
            setIsDuplicate={setIsDuplicate}
            setItems={setItems}
            updateItemId={updateItemId}
            customerInquiryId={customerInquiryId}
            columns={columns}
            tables={tables}
            setTables={setTables}
            handleAddItem={handleAddItem}
            setCurrentTableNo={setCurrentTableNo}
            uniqueSuppliers={uniqueSuppliers}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
          />
        ))}
    </>
  );
}

export default MakeInquiryTable;
