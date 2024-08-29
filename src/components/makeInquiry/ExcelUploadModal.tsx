import React, { useState } from "react";
import { Modal, Upload, Button, Table } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { InquiryItem } from "../../types/types";
import { fetchItemData } from "../../api/api";

interface ExcelUploadModalProps {
  open: boolean;
  onCancel: () => void;
  onApply: (mappedItems: InquiryItem[]) => void;
}

const ExcelUploadModal = ({
  open,
  onCancel,
  onApply,
}: ExcelUploadModalProps) => {
  const [excelData, setExcelData] = useState<InquiryItem[]>([]);

  const handleExcelUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
      }) as any[][];

      // 엑셀 데이터에서 속성명이 고정된 형식을 사용하여 데이터 추출
      const dataArray = jsonData.slice(1).map((row: any[], index: number) => ({
        position: index + 1, // position 속성
        itemCode: row[0] || "", // itemCode 속성
        itemType: "ITEM" as "ITEM", // itemType은 고정값 'ITEM'
        itemName: row[1] || "", // itemName 속성
        qty: parseInt(row[2], 10) || 0, // qty 속성
        unit: row[3] || "", // unit 속성
        itemRemark: row[4] || "", // itemRemark 속성
      }));

      setExcelData(dataArray);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleApplyExcelData = async () => {
    const updatedData = await Promise.all(
      excelData.map(async (item) => {
        if (item.itemCode.trim() === "") {
          return { ...item, itemId: null };
        }

        try {
          const { items } = await fetchItemData(item.itemCode);
          const fetchedItem = Array.isArray(items) ? items[0] : items;
          const itemId = fetchedItem ? fetchedItem.itemId : null;

          return { ...item, itemId }; // itemId를 추가
        } catch (error) {
          console.error(
            "Error fetching item ID for code:",
            item.itemCode,
            error
          );
          return { ...item, itemId: null }; // 오류 발생 시 itemId는 null로 설정
        }
      })
    );

    onApply(updatedData);
  };

  return (
    <Modal
      title="엑셀 파일 불러오기"
      open={open}
      onCancel={onCancel}
      onOk={handleApplyExcelData}
      okText="적용"
      cancelText="취소"
      width={1000}
    >
      <Upload beforeUpload={handleExcelUpload} accept=".xlsx, .xls">
        <Button icon={<UploadOutlined />}>엑셀 파일 선택</Button>
      </Upload>
      {excelData.length > 0 && (
        <Table
          dataSource={excelData}
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
