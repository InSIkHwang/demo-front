import React, { useEffect, useState } from "react";
import {
  Modal,
  Descriptions,
  Button,
  Table,
  Tag,
  Divider,
  message,
  Input,
  Typography,
} from "antd";
import {
  ComplexInquiryItemDetail,
  ComplexInquirySupplier,
  InquiryResponse,
} from "../../types/types";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  chkDuplicateDocNum,
  copyInquiry,
  deleteInquiry,
  fetchComplexInquiryDetail,
  fetchInquiryDetail,
} from "../../api/api";
import dayjs from "dayjs";

interface DetailInquiryModalProps {
  open: boolean;
  onClose: () => void;
  inquiryId: number;
  fetchData: () => Promise<void>;
  documentType: string;
}

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .ant-modal-close {
    display: none;
  }

  .ant-modal-header {
    background: #1890ff;
    color: #fff;
    border-bottom: none;
    padding: 16px 24px;
    border-radius: 12px 12px 0 0;
  }

  .ant-modal-title {
    color: #fff;
    font-size: 20px;
    font-weight: 600;
    margin-left: 0;
  }

  .ant-modal-body {
    padding: 24px;
  }

  .ant-modal-footer {
    border-top: 1px solid #f0f0f0;
    padding: 16px 24px;
    border-radius: 0 0 12px 12px;
  }

  .ant-descriptions {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .ant-descriptions-item-label {
    font-weight: 600;
    color: #1f2937;
    background-color: #f8fafc;
  }

  .ant-descriptions-item-content {
    color: #4b5563;
  }

  .ant-table {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .ant-table-thead > tr > th {
    background: #f8fafc;
    color: #1f2937;
    font-weight: 600;
  }

  .ant-divider {
    margin: 24px 0;
  }
`;

const TagStyled = styled(Tag)`
  margin-right: 8px;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
`;

const SPECIAL_ITEM_TYPES = ["MAKER", "TYPE", "DESC"];

const isSpecialItemType = (type: string) => SPECIAL_ITEM_TYPES.includes(type);

const DetailInquiryModal = ({
  open,
  onClose,
  inquiryId,
  fetchData,
  documentType,
}: DetailInquiryModalProps) => {
  const [inquiryDetail, setInquiryDetail] = useState<InquiryResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const [newDocumentNumber, setNewDocumentNumber] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (open) {
        try {
          setInquiryDetail(null);
          let response;

          if (documentType === "COMPLEX") {
            response = await fetchComplexInquiryDetail(inquiryId);
            const uniqueSuppliers = response.inquiryItemDetails
              .flatMap((item: ComplexInquiryItemDetail) => item.suppliers)
              .reduce(
                (
                  acc: ComplexInquirySupplier[],
                  curr: ComplexInquirySupplier
                ) => {
                  if (
                    !acc.find(
                      (supplier) => supplier.supplierId === curr.supplierId
                    )
                  ) {
                    acc.push(curr);
                  }
                  return acc;
                },
                []
              );

            const formattedResponse: InquiryResponse = {
              documentInfo: response.documentInfo,
              table: [
                {
                  itemDetails: response.inquiryItemDetails,
                  supplierList: uniqueSuppliers.map(
                    (supplier: ComplexInquirySupplier) => ({
                      supplierId: supplier.supplierId,
                      code: supplier.code,
                      companyName: supplier.companyName,
                      korCompanyName: supplier.korCompanyName,
                      representative: supplier.representative,
                      email: supplier.email,
                      communicationLanguage: supplier.communicationLanguage,
                      supplierRemark: supplier.supplierRemark,
                    })
                  ),
                },
              ],
            };
            setInquiryDetail(formattedResponse);
          } else {
            response = await fetchInquiryDetail(inquiryId);
            setInquiryDetail(response);
          }
        } catch (error) {
          message.error("Error fetching details:");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDetails();
  }, [open, inquiryId, documentType]);

  const handleEditClick = () => {
    if (inquiryDetail) {
      const basePath =
        documentType === "COMPLEX" ? "/makecomplexinquiry" : "/makeinquiry";
      const path = inquiryId ? `${basePath}/${inquiryId}` : basePath;
      navigate(path);
    }
  };

  const handleCopyClick = () => {
    setNewDocumentNumber(inquiryDetail!.documentInfo.documentNumber);
    setIsModalVisible(true);
  };

  const handleCopyOk = async () => {
    try {
      const isDuplicate = await chkDuplicateDocNum(
        newDocumentNumber,
        inquiryId
      );
      if (isDuplicate) {
        message.error(
          "Duplicate document number. Please use a different number."
        );
        return; // 중복일 경우 처리 중단
      }

      const { inquiryId: newInquiryId } = await copyInquiry(
        inquiryDetail!.documentInfo.documentNumber,
        newDocumentNumber
      );
      message.success("Copied successfully");
      fetchData();
      setIsModalVisible(false);

      navigate(`/makeinquiry/${newInquiryId}`);
    } catch (error) {
      message.error("Error copying inquiry. Please check document number");
    }
  };

  const handleCopyCancel = () => {
    setIsModalVisible(false);
  };

  const handleDeleteClick = () => {
    Modal.confirm({
      title: "Delete Confirmation",
      content: "Are you sure you want to delete this inquiry?",
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteInquiry(inquiryId);
          message.success("Inquiry deleted successfully.");
          onClose();
          fetchData();
        } catch (error) {
          console.error("Error deleting inquiry:", error);
          message.error("Failed to delete inquiry. Please try again.");
        }
      },
    });
  };

  const columns = [
    {
      title: "Item Code",
      dataIndex: "itemCode",
      key: "itemCode",
      width: 250,
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return record.itemType;
        }
        return text;
      },
    },
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return <div>{text}</div>;
        }
        return text;
      },
    },
    {
      title: "Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
      width: 150,
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        return text;
      },
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: 50,
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        return text;
      },
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      width: 50,
      render: (text: string, record: any) => {
        if (isSpecialItemType(record.itemType)) {
          return null;
        }
        return text;
      },
    },
  ];

  const TableSection = ({
    tableData,
    index,
  }: {
    tableData: any;
    index: number;
  }) => (
    <>
      <Divider orientation="left" style={{ borderColor: "#ccc" }}>
        Table {index + 1}
      </Divider>
      <div style={{ marginBottom: 20 }}>
        <Typography.Text type="secondary">Suppliers: </Typography.Text>
        {tableData.supplierList.map((supplier: any, idx: number) => (
          <TagStyled key={supplier.supplierId} color="blue">
            {supplier.code}
            {idx < tableData.supplierList.length - 1 ? "," : ""}
          </TagStyled>
        ))}
      </div>
      <Table
        columns={columns}
        dataSource={tableData.itemDetails}
        pagination={false}
        rowKey="position"
        scroll={{ y: 200 }}
        bordered
        size="small"
      />
    </>
  );

  return (
    <>
      <StyledModal
        title="Detail Information"
        open={open}
        onCancel={onClose}
        footer={[
          <Button type="dashed" key="copy" onClick={handleCopyClick}>
            Copy to new document
          </Button>,
          inquiryDetail &&
            inquiryDetail.documentInfo.documentStatus !== "PRICE_PENDING" && (
              <React.Fragment key="edit-delete-group">
                <Button type="primary" key="edit" onClick={handleEditClick}>
                  Edit
                </Button>
                <Button key="delete" danger onClick={handleDeleteClick}>
                  Delete
                </Button>
              </React.Fragment>
            ),
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
        width={1200}
      >
        {loading ? (
          <p>Loading...</p>
        ) : (
          inquiryDetail && (
            <>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Document Number">
                  {inquiryDetail.documentInfo.documentNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Registration Date">
                  {dayjs(inquiryDetail.documentInfo.registerDate).format(
                    "YYYY-MM-DD"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Company Name">
                  {inquiryDetail.documentInfo.companyName}
                </Descriptions.Item>
                <Descriptions.Item label="REF NO.">
                  {inquiryDetail.documentInfo.refNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Currency">
                  {inquiryDetail.documentInfo.currencyType}
                </Descriptions.Item>
                <Descriptions.Item label="Exchange Rate">
                  {`$${inquiryDetail.documentInfo.currency?.toFixed(0)}`}
                </Descriptions.Item>
                <Descriptions.Item label="Vessel Name">
                  {inquiryDetail.documentInfo.vesselName}
                </Descriptions.Item>
                <Descriptions.Item label="Vessel Hull Number">
                  {inquiryDetail.documentInfo.vesselHullNo}
                </Descriptions.Item>
                <Descriptions.Item label="Document Manager">
                  {inquiryDetail.documentInfo.docManager}
                </Descriptions.Item>
                <Descriptions.Item label="Company Representative">
                  {inquiryDetail.documentInfo.representative}
                </Descriptions.Item>
                <Descriptions.Item label="Document Status">
                  <TagStyled
                    color={
                      inquiryDetail.documentInfo.documentStatus ===
                      "VENDOR_PENDING"
                        ? "orange"
                        : inquiryDetail.documentInfo.documentStatus ===
                          "VENDOR_SELECTED"
                        ? "blue"
                        : "steelblue"
                    }
                  >
                    {inquiryDetail.documentInfo.documentStatus}
                  </TagStyled>
                </Descriptions.Item>

                <Descriptions.Item label="Inquiry Type">
                  <TagStyled color="green">
                    {inquiryDetail.documentInfo.inquiryType}
                  </TagStyled>
                </Descriptions.Item>
                <Descriptions.Item label="Remark">
                  {inquiryDetail.documentInfo.remark}
                </Descriptions.Item>
              </Descriptions>
              <Divider variant="dashed" style={{ borderColor: "#007bff" }}>
                Item List
              </Divider>
              {inquiryDetail.table.map((tableData, index) => (
                <TableSection key={index} tableData={tableData} index={index} />
              ))}
            </>
          )
        )}
      </StyledModal>
      <Modal
        title="Copy Document"
        open={isModalVisible}
        onOk={handleCopyOk}
        onCancel={handleCopyCancel}
      >
        <Input
          placeholder="Please enter a new document number"
          value={newDocumentNumber}
          onChange={(e) => setNewDocumentNumber(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default DetailInquiryModal;
