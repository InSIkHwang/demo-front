import React, { useState } from "react";
import { Modal, Upload, Table, message, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { InquiryItem } from "../types/types";
import { fetchItemData } from "../api/api";
import { ItemDataType } from "../types/types";

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

      // 헤더 검증
      const fileHeader = jsonData[0] || [];
      const headerMapping: Record<string, string> = {
        "purchase price(KRW)": "purchasePriceKRW",
        "purchase price(Global)": "purchasePriceGlobal",
        margin: "margin",
      };

      if (
        fileHeader.length < expectedHeader.length ||
        !expectedHeader.every((header) => fileHeader.includes(header))
      ) {
        message.error(
          "The uploaded file's header does not match the expected format."
        );
        setFileList([]); // 파일 제거
        return;
      }

      const mappedHeaders = fileHeader.map(
        (header) => headerMapping[header] || header
      );

      // 데이터 추출 및 itemType 설정
      const dataArray = jsonData.slice(1).map((row: any[], index: number) => {
        const rowData: any = { position: index + 1, itemType: "ITEM" };

        mappedHeaders.forEach((header, colIdx) => {
          rowData[header] = row[colIdx] || "";
        });

        // type이 "offer"인 경우 가격 계산 처리
        if (type === "offer") {
          // 문자열을 숫자 형식으로 변환
          const purchasePriceKRW = parseFloat(rowData.purchasePriceKRW) || 0;
          const purchasePriceGlobal =
            parseFloat(rowData.purchasePriceGlobal) || 0;
          const qty = parseFloat(rowData.qty) || 0; // 수량 변환
          const marginPercent = parseFloat(rowData.margin) || 0; // margin을 퍼센트로 변환

          if (purchasePriceKRW && !purchasePriceGlobal) {
            rowData.purchasePriceGlobal = parseFloat(
              (purchasePriceKRW / currency).toFixed(2)
            );

            // purchaseAmount 계산
            rowData.purchaseAmountKRW = parseFloat(
              (purchasePriceKRW * qty).toFixed(2)
            );
            rowData.purchaseAmountGlobal = parseFloat(
              (rowData.purchasePriceGlobal * qty).toFixed(2)
            );

            // margin이 있는 경우 salesPrice 계산
            if (marginPercent) {
              const marginValueKRW = (purchasePriceKRW * marginPercent) / 100;
              rowData.salesPriceKRW = parseFloat(
                (purchasePriceKRW + marginValueKRW).toFixed(2)
              );
              rowData.salesPriceGlobal = parseFloat(
                (rowData.salesPriceKRW / currency).toFixed(2)
              );

              // salesAmount 계산
              rowData.salesAmountKRW = parseFloat(
                (rowData.salesPriceKRW * qty).toFixed(2)
              );
              rowData.salesAmountGlobal = parseFloat(
                (rowData.salesPriceGlobal * qty).toFixed(2)
              );
            }
          } else if (!purchasePriceKRW && purchasePriceGlobal) {
            rowData.purchasePriceKRW = Math.round(
              purchasePriceGlobal * currency
            );

            // purchaseAmount 계산
            rowData.purchaseAmountKRW = parseFloat(
              (rowData.purchasePriceKRW * qty).toFixed(2)
            );
            rowData.purchaseAmountGlobal = parseFloat(
              (purchasePriceGlobal * qty).toFixed(2)
            );

            // margin이 있는 경우 salesPrice 계산
            if (marginPercent) {
              const marginValueGlobal =
                (purchasePriceGlobal * marginPercent) / 100;
              rowData.salesPriceGlobal = parseFloat(
                (purchasePriceGlobal + marginValueGlobal).toFixed(2)
              );
              rowData.salesPriceKRW = Math.round(
                rowData.salesPriceGlobal * currency
              );

              // salesAmount 계산
              rowData.salesAmountKRW = parseFloat(
                (rowData.salesPriceKRW * qty).toFixed(2)
              );
              rowData.salesAmountGlobal = parseFloat(
                (rowData.salesPriceGlobal * qty).toFixed(2)
              );
            }
          }

          // margin 값이 없는 경우 기본값 설정 (예: 0)
          rowData.margin = marginPercent || 0;
        }

        return rowData;
      });

      setExcelData(dataArray);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const fetchItemId = async (item: { itemCode: string; itemName: string }) => {
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
      console.error("Error fetching item ID for code:", item.itemCode, error);
      return { ...item, itemId: null };
    }
  };

  const handleApplyExcelData = async () => {
    const updatedData = await Promise.all(excelData.map(fetchItemId));

    onApply(updatedData);
  };

  const handleOverwriteExcelData = async () => {
    const updatedData = await Promise.all(excelData.map(fetchItemId));

    onOverWrite(updatedData);
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
            { title: "Item Code", dataIndex: "itemCode", key: "itemCode" },
            { title: "Item Name", dataIndex: "itemName", key: "itemName" },
            { title: "Quantity", dataIndex: "qty", key: "qty" },
            { title: "Unit", dataIndex: "unit", key: "unit" },
            {
              title: "Item Remark",
              dataIndex: "itemRemark",
              key: "itemRemark",
            },
            ...(type === "offer"
              ? [
                  {
                    title: "Purchase Price (KRW)",
                    dataIndex: "purchasePriceKRW",
                    key: "purchasePriceKRW",
                  },
                  {
                    title: "Purchase Price (Global)",
                    dataIndex: "purchasePriceGlobal",
                    key: "purchasePriceGlobal",
                  },
                  { title: "Margin", dataIndex: "margin", key: "margin" },
                ]
              : []),
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
