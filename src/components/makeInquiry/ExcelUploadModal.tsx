import React, { useState } from "react";
import { Modal, Upload, Button, Table, message } from "antd";
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
  const [fileList, setFileList] = useState<any[]>([]);

  const expectedHeader = ["itemCode", "itemName", "qty", "unit", "itemRemark"];

  const handleExcelUpload = (file: any) => {
    setExcelData([]);
    setFileList([file]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
      }) as any[][];

      // 첫 번째 행의 헤더와 expectedHeader 비교
      const fileHeader = jsonData[0] || [];
      if (
        fileHeader.length !== expectedHeader.length ||
        !fileHeader.every((header, idx) => header === expectedHeader[idx])
      ) {
        message.error(
          "The uploaded file's header does not match the expected format."
        );
        setFileList([]); // 파일 제거
        return;
      }

      // 엑셀 데이터에서 속성명이 고정된 형식을 사용하여 데이터 추출
      const dataArray = jsonData.slice(1).map((row: any[], index: number) => ({
        position: index + 1,
        itemCode: row[0] || "",
        itemType: "ITEM" as "ITEM",
        itemName: row[1] || "",
        qty: parseInt(row[2], 10) || 0,
        unit: row[3] || "",
        itemRemark: row[4] || "",
      }));

      setExcelData(dataArray);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleApplyExcelData = async () => {
    const updatedData = await Promise.all(
      excelData.map(async (item) => {
        if ((item.itemCode + "").trim() === "") {
          return { ...item, itemId: null };
        }

        try {
          const { items } = await fetchItemData(item.itemCode);

          const fetchedItem = Array.isArray(items)
            ? items.find(
                (fetched) =>
                  fetched.itemCode === item.itemCode &&
                  fetched.itemName === item.itemName
              )
            : null;

          const itemId = fetchedItem ? fetchedItem.itemId : null;

          return { ...item, itemId };
        } catch (error) {
          console.error(
            "Error fetching item ID for code:",
            item.itemCode,
            error
          );
          return { ...item, itemId: null };
        }
      })
    );

    onApply(updatedData);
  };

  const handleRemoveFile = () => {
    setExcelData([]);
    setFileList([]);
    message.success("File removed successfully");
  };

  return (
    <Modal
      title="Load Excel File"
      open={open}
      onCancel={onCancel}
      onOk={handleApplyExcelData}
      okText="Ok"
      cancelText="Cancel"
      width={1000}
    >
      <Upload.Dragger
        beforeUpload={handleExcelUpload}
        fileList={fileList}
        onRemove={handleRemoveFile}
        accept=".xlsx, .xls"
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Only one file can be uploaded. Uploading a new file will overwrite the
          current file.
        </p>
      </Upload.Dragger>
      {excelData.length > 0 && (
        <Table
          dataSource={excelData}
          columns={[
            { title: "No.", dataIndex: "position", key: "position" },
            { title: "Item Code", dataIndex: "itemCode", key: "position" },
            { title: "Item Name", dataIndex: "itemName", key: "position" },
            { title: "Quantity", dataIndex: "qty", key: "position" },
            { title: "Unit", dataIndex: "unit", key: "position" },
            {
              title: "Item Remark",
              dataIndex: "itemRemark",
              key: "position",
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
