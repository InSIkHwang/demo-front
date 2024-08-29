import React, { useState } from "react";
import { Modal, Upload, Button, Table } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { InquiryItem } from "../../types/types";

interface ExcelUploadModalProps {
  open: boolean;
  onCancel: () => void;
  onApply: (mappedItems: InquiryItem[]) => void;
  handleItemCodeChange: (
    index: number,
    value: string
  ) => Promise<{ itemId: number | null; itemName: string }>; // 반환 타입 명시
}

const ExcelUploadModal = ({
  open,
  onCancel,
  onApply,
  handleItemCodeChange,
}: ExcelUploadModalProps) => {
  const [excelData, setExcelData] = useState<InquiryItem[]>([]);
  const [rawExcelData, setRawExcelData] = useState<any[][]>([]);

  const handleExcelUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
      }) as any[][];
      setRawExcelData(jsonData.slice(1)); // 첫 번째 행은 헤더이므로 제외
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const processExcelData = async () => {
    const processedData = await Promise.all(
      rawExcelData.map(async (row: any[], index: number) => {
        const itemCode = row[0] || "";
        let itemName = row[1] || "";
        const qty = parseInt(row[2], 10) || 0;
        const unit = row[3] || "";
        const itemRemark = row[4] || "";

        let itemId: number | null = null;

        if (itemCode) {
          const result = await handleItemCodeChange(index, itemCode);
          itemId = result.itemId;
          itemName = result.itemName || itemName;
        }

        return {
          position: index + 1,
          itemCode,
          itemType: "ITEM" as "ITEM",
          itemName,
          qty,
          unit,
          itemRemark,
          itemId,
        };
      })
    );
    setExcelData(processedData);
    return processedData;
  };

  const handleOk = async () => {
    const dataToApply = await processExcelData();
    onApply(dataToApply); // 최종 데이터 전달
  };

  return (
    <Modal
      title="엑셀 파일 불러오기"
      open={open}
      onCancel={onCancel}
      onOk={handleOk} // `handleOk` 함수 사용
      okText="적용"
      cancelText="취소"
      width={1000}
    >
      <Upload beforeUpload={handleExcelUpload} accept=".xlsx, .xls">
        <Button icon={<UploadOutlined />}>엑셀 파일 선택</Button>
      </Upload>
      {rawExcelData.length > 0 && (
        <Table
          dataSource={rawExcelData.map((row, index) => ({
            position: index + 1,
            itemCode: row[0],
            itemName: row[1],
            qty: row[2],
            unit: row[3],
            itemRemark: row[4],
          }))}
          columns={[
            { title: "No.", dataIndex: "position", key: "position" },
            { title: "Item Code", dataIndex: "itemCode", key: "itemCode" },
            { title: "Item Name", dataIndex: "itemName", key: "itemName" },
            { title: "Quantity", dataIndex: "qty", key: "qty" },
            { title: "Unit", dataIndex: "unit", key: "unit" },
            {
              title: "Item Remark",
              dataIndex: "itemRemark",
              key: "itemRemark",
            },
          ]}
          pagination={false}
          bordered
          style={{ margin: "20px 0", overflowX: "auto" }}
        />
      )}
    </Modal>
  );
};

export default ExcelUploadModal;
