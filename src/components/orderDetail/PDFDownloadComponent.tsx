import React, { useCallback, useState } from "react";
import { Button, Checkbox, Input, message, Modal, Select, Table } from "antd";
import { Order, OrderSupplier } from "../../types/types";
import PDFDownloadProgress from "../InvoiceDetail/PDFDownloadProgress";

interface PDFDownloadComponentProps {
  onDownload: (
    selectedTypes: {
      type: string;
      language: string;
      fileName: string;
      checked: boolean;
    }[],
    updateProgress: (downloaded: number) => void
  ) => void;
  supplier: OrderSupplier;
  formValues: Order;
}

const PDFDownloadComponent: React.FC<PDFDownloadComponentProps> = ({
  onDownload,
  supplier,
  formValues,
}) => {
  const generateFileName = (type: string, language: string) => {
    if (type === "PO") {
      if (language === "KOR") {
        return `${supplier.korCompanyName || supplier.companyName}_발주서_${
          formValues.documentNumber
        }.pdf`;
      } else {
        return `${supplier.companyName}_PURCHASE_ORDER_${formValues.documentNumber}.pdf`;
      }
    } else if (type === "OA") {
      if (language === "KOR") {
        return `${formValues.refNumber}(주문확인서).pdf`;
      } else {
        return `${formValues.refNumber}(ORDER_ACK).pdf`;
      }
    }
    return "";
  };

  const [selectedTypes, setSelectedTypes] = useState<
    {
      type: string;
      language: string;
      fileName: string;
      checked: boolean;
    }[]
  >([
    {
      type: "PO",
      language: "KOR",
      fileName: generateFileName("PO", "KOR"),
      checked: true,
    },
    {
      type: "OA",
      language: "ENG",
      fileName: generateFileName("OA", "ENG"),
      checked: true,
    },
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const handleTypeChange = (type: string, checked: boolean) => {
    setSelectedTypes((prev) =>
      prev.map((t) => (t.type === type ? { ...t, checked } : t))
    );
  };

  const handleLanguageChange = (index: number, language: string) => {
    const updatedTypes = [...selectedTypes];
    updatedTypes[index].language = language;
    updatedTypes[index].fileName = generateFileName(
      updatedTypes[index].type,
      language
    );
    setSelectedTypes(updatedTypes);
  };

  const handleFileNameChange = (index: number, fileName: string) => {
    const updatedTypes = [...selectedTypes];
    updatedTypes[index].fileName = fileName;
    setSelectedTypes(updatedTypes);
  };

  const resetDownloadState = useCallback(() => {
    setDownloading(false);
    setDownloadedFiles(0);
    setTotalFiles(0);
    setIsModalVisible(false);
  }, []);

  const handleDownload = async () => {
    const selected = selectedTypes.filter(
      (t) => t.checked && t.fileName !== ""
    );
    if (selected.length === 0) {
      message.error("Please select at least one document type.");
      return;
    }

    setDownloading(true);
    setDownloadedFiles(0);
    setTotalFiles(selected.length);

    try {
      await onDownload(selected, setDownloadedFiles);
    } finally {
      setTimeout(resetDownloadState, 1000); // 1초 후 상태 초기화
    }
  };

  const columns = [
    {
      title: "Document Type",
      dataIndex: "type",
      render: (text: string, _: any, index: number) => (
        <Checkbox
          checked={selectedTypes[index].checked}
          onChange={(e) => handleTypeChange(text, e.target.checked)}
        >
          {text === "PO" ? "PURCHASE ORDER" : "ORDER ACKNOWLEDGEMENT"}
        </Checkbox>
      ),
      width: 250,
    },
    {
      title: "Language",
      dataIndex: "language",
      render: (text: string, _: any, index: number) => (
        <Select
          value={text}
          onChange={(value) => handleLanguageChange(index, value)}
        >
          <Select.Option value="KOR">KOR</Select.Option>
          <Select.Option value="ENG">ENG</Select.Option>
        </Select>
      ),
      width: 100,
    },
    {
      title: "File Name",
      dataIndex: "fileName",
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleFileNameChange(index, e.target.value)}
        />
      ),
    },
  ];

  return (
    <>
      <Button
        style={{ marginLeft: "10px" }}
        onClick={() => setIsModalVisible(true)}
        type="default"
      >
        Download PDFs
      </Button>
      <Modal
        width={800}
        title="Download PDFs"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="download" type="primary" onClick={handleDownload}>
            Download
          </Button>,
        ]}
      >
        <Table
          columns={columns}
          dataSource={selectedTypes}
          pagination={false}
          rowKey={(record) => record.type}
        />
        <PDFDownloadProgress
          downloading={downloading}
          downloadedFiles={downloadedFiles}
          totalFiles={totalFiles}
        />
      </Modal>
    </>
  );
};

export default PDFDownloadComponent;
