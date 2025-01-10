import { Button, Checkbox, Input, message, Select } from "antd";
import PDFDownloadProgress from "./PDFDownloadProgress";

import { Table } from "antd";
import { useCallback, useEffect, useState } from "react";

export interface PDFDownloadItem {
  pdfType: string;
  downloadChk: boolean;
  fileName: string;
  itemType?: string;
}

interface PDFDownloadTableProps {
  formValues: any;
  itemTypeOption: string[];
  onDownload: (
    items: PDFDownloadItem[],
    updateProgress: (downloaded: number) => void
  ) => Promise<void>;
}

const PDFDownloadTable = ({
  formValues,
  itemTypeOption,
  onDownload,
}: PDFDownloadTableProps) => {
  // 파일 이름 생성 함수
  const generateFileName = useCallback(
    (option: string, pdfType: string) => {
      const baseFileName = formValues?.refNumber || "";
      if (option === "DEFAULT") {
        return `${baseFileName}(${
          pdfType === "PROFORMAINVOICE" ? "PROFORMA INVOICE" : "INVOICE"
        })`;
      }
      return `${baseFileName}(${option} ${
        pdfType === "PROFORMAINVOICE" ? "PROFORMA INVOICE" : "INVOICE"
      })`;
    },
    [formValues?.refNumber]
  );

  const [items, setItems] = useState<PDFDownloadItem[]>([]);
  const [allChecked, setAllChecked] = useState(false);
  const [headerPdfType, setHeaderPdfType] = useState<string>("INVOICE");
  const [headerOriginChk, setHeaderOriginChk] = useState<string>("both");
  const [downloading, setDownloading] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // 아이템 초기화를 위한 별도 함수
  const initializeItems = useCallback(() => {
    const newItems = itemTypeOption.map((option) => ({
      pdfType: headerPdfType,
      downloadChk: allChecked,
      originChk: headerOriginChk,
      fileName: generateFileName(option, headerPdfType),
      itemType: option,
    }));
    setItems(newItems);
  }, [itemTypeOption]);

  // useEffect에서는 itemTypeOption이 변경될 때만 초기화
  useEffect(() => {
    initializeItems();
  }, [itemTypeOption, initializeItems]);

  // PDF 유형 변경 함수
  const handlePdfTypeChange = (value: string) => {
    setHeaderPdfType(value);
    setItems(
      items.map((item) => ({
        ...item,
        pdfType: value,
        fileName: generateFileName(item.itemType || "DEFAULT", value),
      }))
    );
  };

  const columns = [
    {
      title: (
        <Select
          defaultValue="INVOICE"
          style={{ width: "100%" }}
          onChange={handlePdfTypeChange}
        >
          <Select.Option value="INVOICE">INVOICE</Select.Option>
          <Select.Option value="PROFORMAINVOICE">
            PROFORMA INVOICE
          </Select.Option>
        </Select>
      ),
      dataIndex: "itemType",
      render: (text: string, _: any, index: number) => {
        return itemTypeOption[index] || "";
      },
      width: 250,
    },
    {
      title: (
        <Checkbox
          checked={allChecked}
          onChange={(e) => handleCheckAll(e.target.checked)}
        />
      ),
      dataIndex: "downloadChk",
      render: (checked: boolean, _: any, index: number) => (
        <Checkbox
          checked={checked}
          onChange={(e) =>
            handleItemChange(index, "downloadChk", e.target.checked)
          }
        />
      ),
      width: 50,
    },
    {
      title: "File Name",
      dataIndex: "fileName",
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleItemChange(index, "fileName", e.target.value)}
        />
      ),
    },
  ];

  const handleCheckAll = (checked: boolean) => {
    setAllChecked(checked);
    setItems(items.map((item) => ({ ...item, downloadChk: checked })));
  };

  const handleItemChange = (
    index: number,
    key: keyof PDFDownloadItem,
    value: any
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: value };
    setItems(newItems);
  };

  const resetDownloadState = useCallback(() => {
    setDownloading(false);
    setDownloadedFiles(0);
    setTotalFiles(0);
  }, []);

  const handleDownload = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const selectedItems = items.filter((item) => item.downloadChk);
    if (selectedItems.length === 0) {
      message.warning("Please select items to download.");
      return;
    }

    setDownloading(true);
    setDownloadedFiles(0);
    setTotalFiles(selectedItems.length);

    try {
      await onDownload(selectedItems, setDownloadedFiles);
    } finally {
      setTimeout(resetDownloadState, 1000); // 1초 후 상태 초기화
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <Table
        columns={columns}
        dataSource={items}
        pagination={false}
        rowKey={(record, index) => index?.toString() || ""}
      />
      <div style={{ marginTop: 16 }}>
        <PDFDownloadProgress
          downloading={downloading}
          downloadedFiles={downloadedFiles}
          totalFiles={totalFiles}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" onClick={handleDownload} loading={downloading}>
            Download Selected PDFs
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PDFDownloadTable;
