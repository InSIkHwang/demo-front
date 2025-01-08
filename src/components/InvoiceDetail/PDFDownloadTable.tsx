import { Button, Checkbox, Input, message, Select } from "antd";

import { Table } from "antd";
import { useCallback, useEffect, useState } from "react";

export interface PDFDownloadItem {
  pdfType: string;
  downloadChk: boolean;
  originChk: string;
  fileName: string;
  itemType?: string;
}

interface PDFDownloadTableProps {
  formValues: any;
  itemTypeOption: string[];
  onDownload: (items: PDFDownloadItem[]) => void;
}

const PDFDownloadTable = ({
  formValues,
  itemTypeOption,
  onDownload,
}: PDFDownloadTableProps) => {
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

  // itemTypeOption이 변경될 때마다 items 상태 업데이트
  useEffect(() => {
    const newItems = itemTypeOption.map((option) => ({
      pdfType: headerPdfType,
      downloadChk: allChecked,
      originChk: headerOriginChk,
      fileName: generateFileName(option, headerPdfType),
      itemType: option,
    }));
    setItems(newItems);
  }, [
    itemTypeOption,
    headerPdfType,
    headerOriginChk,
    allChecked,
    generateFileName,
  ]);

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
      title: (
        <Select
          defaultValue="both"
          onChange={(value) => handleHeaderOriginChange(value)}
          style={{ width: "100%" }}
        >
          <Select.Option value="both">Both</Select.Option>
          <Select.Option value="original">Original</Select.Option>
          <Select.Option value="copy">Copy</Select.Option>
        </Select>
      ),
      dataIndex: "originChk",
      render: (value: string, _: any, index: number) => (
        <Select
          value={value}
          onChange={(value) => handleItemChange(index, "originChk", value)}
          style={{ width: "100%" }}
        >
          <Select.Option value="both">Both</Select.Option>
          <Select.Option value="original">Original</Select.Option>
          <Select.Option value="copy">Copy</Select.Option>
        </Select>
      ),
      width: 150,
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

  const handleHeaderOriginChange = (value: string) => {
    setHeaderOriginChk(value);
    setItems(items.map((item) => ({ ...item, originChk: value })));
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

  const handleDownload = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const selectedItems = items.filter((item) => item.downloadChk);
    if (selectedItems.length === 0) {
      message.warning("Please select items to download.");
      return;
    }
    onDownload(selectedItems);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <Table
        columns={columns}
        dataSource={items}
        pagination={false}
        rowKey={(record, index) => index?.toString() || ""}
      />
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
      >
        <Button type="primary" onClick={handleDownload}>
          Download Selected PDFs
        </Button>
      </div>
    </div>
  );
};

export default PDFDownloadTable;
