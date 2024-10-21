import React, { Dispatch, SetStateAction } from "react";
import { Modal, Button, Input, Tag, Table, Empty } from "antd";
import {
  InquirySearchMakerInquirySearchResult,
  InquirySearchMakerSupplier,
} from "../../types/types";
import styled from "styled-components";
import { ColumnsType } from "antd/es/table";

const CustomTable = styled(Table)`
  .ant-table * {
    font-size: 13px;
  }
`;

interface InquirySearchModalProps {
  isVisible: boolean;
  onClose: () => void;
  inquirySearchMakerName: string;
  setInquirySearchMakerName: (value: string) => void;
  selectedSuppliers: {
    id: number;
    name: string;
    code: string;
    email: string;
  }[];
  handleTagClick: (id: number) => void;
  inquirySearchMakerNameResult: InquirySearchMakerInquirySearchResult | null;
  handleInquirySearch: () => void;
  tagColors: { [id: number]: string };
  setSelectedSuppliers: Dispatch<
    SetStateAction<
      {
        id: number;
        name: string;
        korName: string;
        code: string;
        email: string;
      }[]
    >
  >;
  setIsFromInquirySearchModal: Dispatch<SetStateAction<boolean>>;
}

const InquirySearchModal = ({
  isVisible,
  onClose,
  inquirySearchMakerName,
  setInquirySearchMakerName,
  selectedSuppliers,
  handleTagClick,
  inquirySearchMakerNameResult,
  handleInquirySearch,
  tagColors,
  setSelectedSuppliers,
  setIsFromInquirySearchModal,
}: InquirySearchModalProps) => {
  const searchListColumns: ColumnsType<any> = [
    {
      title: "Inquiry Item Type",
      dataIndex: "inquiryItemType",
      key: "inquiryItemType",
    },
    { title: "Item Name", dataIndex: "itemName", key: "itemName" },
    {
      title: "Item Remark",
      dataIndex: "itemRemark",
      key: "itemRemark",
    },
    {
      title: "Supplier List",
      key: "supplierList",
      render: (text, record) => (
        <div>
          {record.supplierList.map((supplier: InquirySearchMakerSupplier) => (
            <Tag
              key={supplier.id}
              onClick={() => {
                Modal.confirm({
                  title: "Add Supplier",
                  content: `Do you want to add ${supplier.companyName} as a supplier?`,
                  okText: "Yes",
                  cancelText: "No",
                  onOk: () => {
                    const selectedSupplier = {
                      id: supplier.id,
                      name: supplier.companyName,
                      korName: supplier.korCompanyName || supplier.companyName,
                      code: supplier.code || "",
                      email: supplier.email || "",
                    };

                    // 새로운 공급업체 추가
                    setSelectedSuppliers((prevSuppliers) => {
                      const newSuppliers = [...prevSuppliers, selectedSupplier];

                      setIsFromInquirySearchModal(true);

                      return newSuppliers; // 업데이트된 공급업체 리스트 반환
                    });
                  },
                });
              }}
              style={{ cursor: "pointer" }}
            >
              {supplier.code}({supplier.companyName})
            </Tag>
          ))}
        </div>
      ),
    },
  ];

  const bestSupplierList: ColumnsType<any> = [
    {
      title: "Supplier Code",
      dataIndex: "code",
      key: "code",
      render: (code, record) => (
        <Tag
          onClick={() => {
            Modal.confirm({
              title: "Add Supplier",
              content: `Do you want to add ${record.companyName} as a supplier?`,
              okText: "Yes",
              cancelText: "No",
              onOk: () => {
                const selectedSupplier = {
                  id: record.id,
                  name: record.companyName,
                  korName: record.korCompanyName || record.companyName,
                  code: record.code || "",
                  email: record.email || "",
                };

                // 새로운 공급업체 추가
                setSelectedSuppliers((prevSuppliers) => {
                  const newSuppliers = [...prevSuppliers, selectedSupplier];

                  setIsFromInquirySearchModal(true);

                  return newSuppliers; // 업데이트된 공급업체 리스트 반환
                });
              },
            });
          }}
          style={{ cursor: "pointer" }}
        >
          {code}({record.companyName})
        </Tag>
      ),
    },
    {
      title: "Supplier Name",
      dataIndex: "companyName",
      key: "companyName",
    },
    {
      title: "Representative",
      dataIndex: "representative",
      key: "representative",
    },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Count", dataIndex: "count", key: "count" },
  ];

  return (
    <Modal
      title="Search Inquiry(Supplier) by Maker"
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Close
        </Button>,
        <Button key="search" type="primary" onClick={handleInquirySearch}>
          Search
        </Button>,
      ]}
      width={1000}
    >
      <Input
        placeholder="Enter maker name: ex) MITUBUSHI"
        value={inquirySearchMakerName}
        onChange={(e) => setInquirySearchMakerName(e.target.value)}
        onPressEnter={handleInquirySearch}
      />
      {selectedSuppliers.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <span>Suppliers: </span>
          {selectedSuppliers.map((supplier) => (
            <Tag
              key={supplier.id}
              style={{
                borderColor: tagColors[supplier.id] || "default",
                cursor: "pointer",
              }}
              onClick={() => handleTagClick(supplier.id)}
              onClose={() => handleTagClick(supplier.id)}
            >
              {supplier.code}
            </Tag>
          ))}
        </div>
      )}
      {inquirySearchMakerNameResult ? (
        <>
          <h4>Best Suppliers</h4>

          <CustomTable
            dataSource={inquirySearchMakerNameResult.bestSupplierList}
            columns={bestSupplierList}
            size="small"
            className="custom-table"
            pagination={false}
          />
          <h4>Search List</h4>
          {
            <CustomTable
              dataSource={inquirySearchMakerNameResult.searchList}
              columns={searchListColumns}
              pagination={{ pageSize: 5 }}
              size="small"
              className="custom-table"
            />
          }
        </>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Modal>
  );
};

export default InquirySearchModal;
