import React, { useState } from "react";
import { Modal, Upload, Button, Select, Table } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { InquiryItem } from "../../types/types";
import styled from "styled-components";

const { Option } = Select;

interface ExcelUploadModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (mappedItems: InquiryItem[]) => void;
  columns: Record<string, string>;
}

const ExcelUploadModal = ({
  visible,
  onCancel,
  onApply,
  columns,
}: ExcelUploadModalProps) => {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );
  const [excelColumns, setExcelColumns] = useState<string[]>([]);

  const handleExcelUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      // 타입 단언을 통해 jsonData를 string[][]로 처리
      const dataArray = jsonData as string[][];

      setExcelData(dataArray);
      setExcelColumns(dataArray[0] || []);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleMappingChange = (excelColumn: string, tableColumn: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [tableColumn]: excelColumn,
    }));
  };

  const handleApplyExcelData = () => {
    const mappedItems = excelData.slice(1).map((row, index) => {
      const newItem: InquiryItem = {
        position: index + 1,
        itemCode: row[excelColumns.indexOf(columnMapping["itemCode"])] || "",
        itemType: "ITEM",
        itemName: row[excelColumns.indexOf(columnMapping["itemName"])] || "",
        qty:
          parseInt(
            row[excelColumns.indexOf(columnMapping["qty"])] as string,
            10
          ) || 0,
        unit: row[excelColumns.indexOf(columnMapping["unit"])] || "",
        itemRemark:
          row[excelColumns.indexOf(columnMapping["itemRemark"])] || "",
      };

      return newItem;
    });

    onApply(mappedItems);
  };

  return (
    <Modal
      title="엑셀 파일 불러오기"
      visible={visible}
      onCancel={onCancel}
      onOk={handleApplyExcelData}
      okText="적용"
      cancelText="취소"
      width={1000}
    >
      <Upload beforeUpload={handleExcelUpload} accept=".xlsx, .xls">
        <Button icon={<UploadOutlined />}>엑셀 파일 선택</Button>
      </Upload>
      {excelColumns.length > 0 && (
        <>
          <Table
            dataSource={excelData.slice(0, 5).map((row, idx) => ({
              key: idx,
              ...row.reduce((obj: any, val: any, i: any) => {
                obj[excelColumns[i]] = val;
                return obj;
              }, {} as Record<string, string>),
            }))}
            columns={excelColumns.map((col, idx) => ({
              title: col,
              dataIndex: col,
              key: idx,
            }))}
            pagination={false}
            bordered
            style={{ margin: "20px 0", overflowX: "auto" }}
          />
          <div>
            {Object.keys(columns).map((colKey) => (
              <div key={colKey} style={{ margin: "10px 0" }}>
                <span>{colKey} 컬럼에 매핑될 엑셀 열 선택:</span>
                <Select
                  style={{ width: "100%" }}
                  onChange={(value) => handleMappingChange(value, colKey)}
                >
                  {excelColumns.map((header, idx) => (
                    <Option key={idx} value={header}>
                      {header} - {excelData[1][idx]}
                    </Option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
};

export default ExcelUploadModal;
