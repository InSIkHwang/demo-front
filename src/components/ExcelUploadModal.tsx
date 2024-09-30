import React, { useState } from "react";
import { Modal, Upload, Table, message, Button, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { InquiryItem } from "../types/types";
import { fetchItemData } from "../api/api";
import styled from "styled-components";

const BlockingLayer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex; /* 중앙 정렬을 위해 flex 사용 */
  justify-content: center; /* 가로 중앙 정렬 */
  align-items: center; /* 세로 중앙 정렬 */
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
  const [excelData, setExcelData] = useState<InquiryItem[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const expectedHeader = ["partNo", "itemName", "qty", "unit", "itemRemark"];

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
        partNo: "itemCode",
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
          if (header === "qty") {
            // qty는 숫자로 변환
            rowData[header] = parseFloat(row[colIdx]) || 0;
          } else {
            // 나머지 컬럼은 문자열로 변환, 빈 문자열 대신 null로 설정
            rowData[header] =
              row[colIdx] !== undefined && row[colIdx] !== null
                ? String(row[colIdx])
                : "";
          }
        });

        // type이 "offer"인 경우 가격 계산 처리
        if (type === "offer") {
          // 문자열을 숫자 형식으로 변환
          const purchasePriceKRW = parseFloat(rowData.purchasePriceKRW) || 0;
          const purchasePriceGlobal =
            parseFloat(rowData.purchasePriceGlobal) || 0;
          const qty = rowData.qty; // 이미 숫자로 변환됨

          const marginPercent = parseFloat(rowData.margin) || 0; // margin을 퍼센트로 변환
          rowData.margin = marginPercent || 0; // margin 값이 없는 경우 기본값 설정

          if (purchasePriceKRW && !purchasePriceGlobal) {
            rowData.purchasePriceGlobal =
              parseFloat((purchasePriceKRW / currency || 0).toFixed(2)) || 0;

            // purchaseAmount 계산
            rowData.purchaseAmountKRW =
              parseFloat((purchasePriceKRW * qty).toFixed(2)) || 0; // 비어있다면 0으로 설정
            rowData.purchaseAmountGlobal =
              parseFloat((rowData.purchasePriceGlobal * qty).toFixed(2)) || 0; // 비어있다면 0으로 설정

            // margin이 있는 경우 salesPrice 계산
            if (marginPercent) {
              const marginValueKRW = (purchasePriceKRW * marginPercent) / 100;
              rowData.salesPriceKRW =
                parseFloat((purchasePriceKRW + marginValueKRW).toFixed(2)) || 0; // 비어있다면 0으로 설정
              rowData.salesPriceGlobal =
                parseFloat((rowData.salesPriceKRW / currency).toFixed(2)) || 0; // 비어있다면 0으로 설정

              // salesAmount 계산
              rowData.salesAmountKRW =
                parseFloat((rowData.salesPriceKRW * qty).toFixed(2)) || 0; // 비어있다면 0으로 설정
              rowData.salesAmountGlobal =
                parseFloat((rowData.salesPriceGlobal * qty).toFixed(2)) || 0; // 비어있다면 0으로 설정
            }
          } else if (!purchasePriceKRW && purchasePriceGlobal) {
            rowData.purchasePriceKRW =
              Math.round(purchasePriceGlobal * currency || 0) || 0; // 비어있다면 0으로 설정

            // purchaseAmount 계산
            rowData.purchaseAmountKRW =
              parseFloat((rowData.purchasePriceKRW * qty).toFixed(2)) || 0; // 비어있다면 0으로 설정
            rowData.purchaseAmountGlobal =
              parseFloat((purchasePriceGlobal * qty).toFixed(2)) || 0; // 비어있다면 0으로 설정

            // margin이 있는 경우 salesPrice 계산
            if (marginPercent) {
              const marginValueGlobal =
                (purchasePriceGlobal * marginPercent) / 100;
              rowData.salesPriceGlobal =
                parseFloat(
                  (purchasePriceGlobal + marginValueGlobal).toFixed(2)
                ) || 0; // 비어있다면 0으로 설정
              rowData.salesPriceKRW =
                Math.round(rowData.salesPriceGlobal * currency || 0) || 0; // 비어있다면 0으로 설정

              // salesAmount 계산
              rowData.salesAmountKRW =
                parseFloat((rowData.salesPriceKRW * qty).toFixed(2)) || 0; // 비어있다면 0으로 설정
              rowData.salesAmountGlobal =
                parseFloat((rowData.salesPriceGlobal * qty).toFixed(2)) || 0; // 비어있다면 0으로 설정
            }
          }
        }

        // 가격 관련 필드 null 대신 0으로 설정
        rowData.purchasePriceKRW = rowData.purchasePriceKRW || 0;
        rowData.purchasePriceGlobal = rowData.purchasePriceGlobal || 0;
        rowData.purchaseAmountKRW = rowData.purchaseAmountKRW || 0;
        rowData.purchaseAmountGlobal = rowData.purchaseAmountGlobal || 0;
        rowData.salesPriceKRW = rowData.salesPriceKRW || 0;
        rowData.salesPriceGlobal = rowData.salesPriceGlobal || 0;
        rowData.salesAmountKRW = rowData.salesAmountKRW || 0;
        rowData.salesAmountGlobal = rowData.salesAmountGlobal || 0;

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
      message.error("Error fetching item ID for code:");
      return { ...item, itemId: null };
    }
  };

  const handleExcelData = async (applyFunc: (data: any[]) => void) => {
    setLoading(true); // 로딩 시작
    const updatedData = await Promise.all(excelData.map(fetchItemId));

    applyFunc(updatedData); // 적용할 함수를 인자로 전달
    setLoading(false); // 로딩 완료
  };

  const handleApplyExcelData = async () => {
    await handleExcelData(onApply); // onApply 함수 전달
  };

  const handleOverwriteExcelData = async () => {
    await handleExcelData(onOverWrite); // onOverWrite 함수 전달
  };

  const handleRemoveFile = () => {
    setExcelData([]);
    setFileList([]);
    message.success("File removed successfully");
  };

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
            Only one file can be uploaded. Uploading a new file will overwrite
            the current file.
          </p>
        </Upload.Dragger>
        {excelData.length > 0 && (
          <Table
            dataSource={excelData}
            columns={[
              { title: "No.", dataIndex: "position", key: "position" },
              { title: "Part No.", dataIndex: "itemCode", key: "itemCode" },
              { title: "Item Name", dataIndex: "itemName", key: "itemName" },
              { title: "Qty", dataIndex: "qty", key: "qty" },
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
            virtual
            scroll={{ y: 500 }}
          />
        )}
      </Modal>
    </>
  );
};

export default ExcelUploadModal;
