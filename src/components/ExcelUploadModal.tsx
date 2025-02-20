import React, { useState } from "react";
import { Modal, Upload, Table, Button, Spin, Select } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import styled from "styled-components";

const BlockingLayer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CustomTable = styled(Table)`
  .ant-table * {
    font-size: 12px;
  }
`;

interface ExcelUploadModalProps {
  open: boolean;
  onCancel: () => void;
  onApply: (mappedItems: any) => void;
  onOverWrite: (mappedItems: any) => void;
  currency: number;
  type: string;
}

const ExcelUploadModal = ({
  open,
  onCancel,
  onApply,
  currency,
  type,
  onOverWrite,
}: ExcelUploadModalProps) => {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [headerMapping, setHeaderMapping] = useState<
    Record<string, string | null>
  >({});

  const availableHeaders = [
    "itemType",
    "itemCode",
    "itemName",
    "qty",
    "unit",
    "itemRemark",
    "salesPriceKRW",
    "salesPriceGlobal",
    "purchasePriceKRW",
    "purchasePriceGlobal",
    "margin",
  ];

  const handleExcelUpload = (file: any) => {
    // 데이터 초기화
    setExcelData([]);
    setFileList([file]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      let jsonData = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
      }) as any[][];

      // 빈 열 제거
      const filteredData = jsonData[0]
        .map((_, colIndex) => jsonData.map((row) => row[colIndex]))
        .filter((col) =>
          col.some((cell) => cell !== null && cell !== undefined && cell !== "")
        );

      const newData = filteredData[0].map((_, rowIndex) =>
        filteredData.map((col) => col[rowIndex])
      );

      // 헤더 설정
      const fileHeader = newData[0] || [];
      const initialMapping: Record<string, string | null> = {};
      fileHeader.forEach((header: string, index: number) => {
        initialMapping[`column_${index}`] = null;
      });

      setHeaderMapping(initialMapping);
      setExcelData(newData);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  // 가격 계산 함수
  const calculatePricing = (mappedRow: any, currency: number, type: string) => {
    const purchasePriceKRW = parseFloat(mappedRow.purchasePriceKRW) || 0;
    const purchasePriceGlobal = parseFloat(mappedRow.purchasePriceGlobal) || 0;
    const qty = mappedRow.qty;
    let marginPercent = parseFloat(mappedRow.margin) || 0;

    // 가격 계산 처리
    if (type === "offer") {
      if (purchasePriceKRW && !purchasePriceGlobal) {
        mappedRow.purchasePriceGlobal =
          parseFloat((purchasePriceKRW / currency).toFixed(2)) || 0;
      } else if (!purchasePriceKRW && purchasePriceGlobal) {
        mappedRow.purchasePriceKRW =
          Math.round(purchasePriceGlobal * currency) || 0;
      }

      // 매입 금액 계산
      mappedRow.purchaseAmountKRW =
        Math.round(mappedRow.purchasePriceKRW * qty) || 0; // 소수점 제거
      mappedRow.purchaseAmountGlobal =
        parseFloat((mappedRow.purchasePriceGlobal * qty).toFixed(2)) || 0;

      // 마진 계산
      if (marginPercent) {
        const marginValueKRW = (purchasePriceKRW * marginPercent) / 100;
        const marginValueGlobal = (purchasePriceGlobal * marginPercent) / 100;

        if (purchasePriceKRW) {
          mappedRow.salesPriceKRW =
            Math.round(purchasePriceKRW + marginValueKRW) || 0; // 소수점 제거
          mappedRow.salesPriceGlobal =
            parseFloat((mappedRow.salesPriceKRW / currency).toFixed(2)) || 0;
        } else {
          mappedRow.salesPriceGlobal =
            parseFloat((purchasePriceGlobal + marginValueGlobal).toFixed(2)) ||
            0;
          mappedRow.salesPriceKRW =
            Math.round(mappedRow.salesPriceGlobal * currency) || 0; // 소수점 제거
        }

        mappedRow.salesAmountKRW =
          Math.round(mappedRow.salesPriceKRW * qty) || 0; // 소수점 제거
        mappedRow.salesAmountGlobal =
          parseFloat((mappedRow.salesPriceGlobal * qty).toFixed(2)) || 0;
      }

      // salesPriceGlobal 또는 salesPriceKRW 값이 주어졌을 때
      if (mappedRow.salesPriceGlobal && !mappedRow.salesPriceKRW) {
        mappedRow.salesPriceKRW =
          Math.round(mappedRow.salesPriceGlobal * currency) || 0; // 소수점 제거

        // 마진 계산 (소수점 둘째 자리까지)
        marginPercent = parseFloat(
          (
            ((mappedRow.salesPriceGlobal - mappedRow.purchasePriceGlobal) /
              (mappedRow.purchasePriceGlobal || 1)) *
            100
          ).toFixed(2)
        );
        mappedRow.margin = marginPercent;
      } else if (mappedRow.salesPriceKRW && !mappedRow.salesPriceGlobal) {
        mappedRow.salesPriceGlobal =
          parseFloat((mappedRow.salesPriceKRW / currency).toFixed(2)) || 0;

        // 마진 계산 (소수점 둘째 자리까지)
        marginPercent = parseFloat(
          (
            ((mappedRow.salesPriceKRW - mappedRow.purchasePriceKRW) /
              (mappedRow.purchasePriceKRW || 1)) *
            100
          ).toFixed(2)
        );
        mappedRow.margin = marginPercent;
      }

      // 매출 금액 계산
      mappedRow.salesAmountKRW = Math.round(mappedRow.salesPriceKRW * qty) || 0; // 소수점 제거
      mappedRow.salesAmountGlobal =
        parseFloat((mappedRow.salesPriceGlobal * qty).toFixed(2)) || 0;
    }

    // 가격 관련 필드 기본값 설정
    mappedRow.purchasePriceKRW = mappedRow.purchasePriceKRW || 0;
    mappedRow.purchasePriceGlobal = mappedRow.purchasePriceGlobal || 0;
    mappedRow.purchaseAmountKRW = mappedRow.purchaseAmountKRW || 0;
    mappedRow.purchaseAmountGlobal = mappedRow.purchaseAmountGlobal || 0;
    mappedRow.salesPriceKRW = mappedRow.salesPriceKRW || 0;
    mappedRow.salesPriceGlobal = mappedRow.salesPriceGlobal || 0;
    mappedRow.salesAmountKRW = mappedRow.salesAmountKRW || 0;
    mappedRow.salesAmountGlobal = mappedRow.salesAmountGlobal || 0;
  };

  // 적용 핸들러
  const handleApplyExcelData = () => {
    // 데이터 매핑
    const mappedData = excelData
      .map((row) => {
        const mappedRow: any = {};
        Object.keys(headerMapping).forEach((key, index) => {
          const mappedKey = headerMapping[key];
          if (mappedKey) {
            if (
              mappedKey === "qty" ||
              mappedKey === "purchasePriceKRW" ||
              mappedKey === "purchasePriceGlobal" ||
              mappedKey === "salesPriceKRW" ||
              mappedKey === "salesPriceGlobal" ||
              mappedKey === "margin"
            ) {
              mappedRow[mappedKey] = parseFloat(row[index]) || 0;
            } else {
              mappedRow[mappedKey] =
                row[index] !== undefined && row[index] !== null
                  ? String(row[index])
                  : "";
            }
          }
        });

        // itemType 기본값 설정
        if (
          mappedRow["itemType"] === "+" ||
          mappedRow["itemType"] === "MAKER"
        ) {
          mappedRow["itemType"] = "MAKER";
        } else if (
          mappedRow["itemType"] === "-" ||
          mappedRow["itemType"] === "TYPE"
        ) {
          mappedRow["itemType"] = "TYPE";
        } else if (
          mappedRow["itemType"] === "=" ||
          mappedRow["itemType"] === "DESC"
        ) {
          mappedRow["itemType"] = "DESC";
        } else {
          mappedRow["itemType"] = "ITEM";
        }

        // 가격 계산 호출
        calculatePricing(mappedRow, currency, type);

        return mappedRow;
      })
      .filter((row) => Object.keys(row).length > 0);

    onApply(mappedData);
  };

  // 덮어쓰기 핸들러
  const handleOverwriteExcelData = () => {
    const mappedData = excelData
      .map((row) => {
        const mappedRow: any = {};
        Object.keys(headerMapping).forEach((key, index) => {
          const mappedKey = headerMapping[key];
          if (mappedKey) {
            if (
              mappedKey === "qty" ||
              mappedKey === "purchasePriceKRW" ||
              mappedKey === "purchasePriceGlobal" ||
              mappedKey === "salesPriceKRW" ||
              mappedKey === "salesPriceGlobal" ||
              mappedKey === "margin"
            ) {
              mappedRow[mappedKey] = parseFloat(row[index]) || 0;
            } else {
              mappedRow[mappedKey] =
                row[index] !== undefined && row[index] !== null
                  ? String(row[index])
                  : "";
            }
          }
        });

        // itemType이 없으면 기본값 "ITEM" 설정
        if (
          mappedRow["itemType"] === "+" ||
          mappedRow["itemType"] === "MAKER"
        ) {
          mappedRow["itemType"] = "MAKER";
        } else if (
          mappedRow["itemType"] === "-" ||
          mappedRow["itemType"] === "TYPE"
        ) {
          mappedRow["itemType"] = "TYPE";
        } else if (
          mappedRow["itemType"] === "=" ||
          mappedRow["itemType"] === "DESC"
        ) {
          mappedRow["itemType"] = "DESC";
        } else {
          mappedRow["itemType"] = "ITEM";
        }

        // 가격 계산 호출
        calculatePricing(mappedRow, currency, type);

        return mappedRow;
      })
      .filter((row) => Object.keys(row).length > 0);

    onOverWrite(mappedData);
  };

  // 매핑 변경 핸들러
  const handleMappingChange = (fileHeader: string, selectedHeader: string) => {
    setHeaderMapping((prev) => ({
      ...prev,
      [fileHeader]: selectedHeader,
    }));
  };

  // 행 삭제 핸들러
  const handleDeleteRow = (index: number) => {
    const newData = [...excelData];
    newData.splice(index, 1); // 선택한 인덱스의 행 삭제
    setExcelData(newData); // 새로운 데이터로 상태 업데이트
  };

  // 표시할 헤더 설정
  const displayHeaders = availableHeaders.map((header) => {
    return header === "itemCode" ? "partNo" : header;
  });

  return (
    <>
      {loading && (
        <BlockingLayer>
          <Spin size="large" />
        </BlockingLayer>
      )}
      <Modal
        title="Load Excel File"
        open={open}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button
            key="overwrite"
            type="primary"
            onClick={handleOverwriteExcelData}
          >
            Overwrite
          </Button>,
          <Button key="ok" type="primary" onClick={handleApplyExcelData}>
            Add
          </Button>,
        ]}
        width={1800}
      >
        <Upload.Dragger
          beforeUpload={handleExcelUpload}
          fileList={fileList}
          onRemove={() => setFileList([])}
          accept=".xlsx, .xls"
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Only one file can be uploaded. Uploading a new file will overwrite
            the current file.
          </p>
        </Upload.Dragger>
        {excelData.length > 0 && (
          <CustomTable
            bordered
            virtual
            scroll={{ y: 400 }}
            dataSource={excelData.map((row, index) => ({
              key: index,
              ...row.reduce((acc: any, val: any, idx: number) => {
                acc[`column_${idx}`] = val;
                return acc;
              }, {}),
              // 각 행에 삭제 버튼 추가
              deleteButton: (
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteRow(index)}
                />
              ),
            }))}
            columns={[
              ...Object.keys(headerMapping).map((key, index) => ({
                title: (
                  <Select
                    value={
                      headerMapping[key] === "itemCode"
                        ? "partNo"
                        : headerMapping[key]
                    }
                    onChange={(value) =>
                      handleMappingChange(
                        key,
                        value === "partNo" ? "itemCode" : value
                      )
                    }
                    style={{ width: "100%" }}
                    dropdownStyle={{ width: "200px" }}
                  >
                    {displayHeaders.map((header) => (
                      <Select.Option
                        key={header}
                        value={header === "partNo" ? "itemCode" : header}
                      >
                        {header}
                      </Select.Option>
                    ))}
                  </Select>
                ),
                dataIndex: `column_${index}`,
              })),
              {
                title: "Actions",
                dataIndex: "deleteButton",
                render: (text) => <>{text}</>,
              },
            ]}
            pagination={false}
            size="small"
          />
        )}
      </Modal>
    </>
  );
};

export default ExcelUploadModal;
