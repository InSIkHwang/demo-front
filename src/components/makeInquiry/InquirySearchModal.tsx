import React, { Dispatch, SetStateAction } from "react";
import { Modal, Button, Input, Tag, Table, Empty, Tooltip } from "antd";
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
    communicationLanguage: string;
    supplierRemark: string;
  }[];
  inquirySearchMakerNameResult: InquirySearchMakerInquirySearchResult | null;
  handleInquirySearch: () => void;
  setSelectedSuppliers: Dispatch<
    SetStateAction<
      {
        id: number;
        name: string;
        korName: string;
        code: string;
        email: string;
        communicationLanguage: string;
        supplierRemark: string;
      }[]
    >
  >;
}

const InquirySearchModal = ({
  isVisible,
  onClose,
  inquirySearchMakerName,
  setInquirySearchMakerName,
  selectedSuppliers,
  inquirySearchMakerNameResult,
  handleInquirySearch,
  setSelectedSuppliers,
}: InquirySearchModalProps) => {
  // 검색 목록 컬럼 정의
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
          {/* 매입처 목록 렌더링 */}
          {record.supplierList.map((supplier: InquirySearchMakerSupplier) => (
            <Tag
              key={supplier.id}
              onClick={() => {
                // 매입처 선택 핸들러
                const selectedSupplier = {
                  id: supplier.id,
                  name: supplier.companyName,
                  korName: supplier.korCompanyName || supplier.companyName,
                  code: supplier.code || "",
                  email: supplier.email || "",
                  communicationLanguage: supplier.communicationLanguage || "",
                  supplierRemark: supplier.supplierRemark || "",
                };

                // 새로운 매입처 추가
                setSelectedSuppliers((prevSuppliers) => {
                  const newSuppliers = [...prevSuppliers, selectedSupplier];

                  return newSuppliers; // 업데이트된 매입처 리스트 반환
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

  // 상위 매입처 목록 컬럼 정의
  const bestSupplierList: ColumnsType<any> = [
    {
      title: "Supplier Code",
      dataIndex: "code",
      key: "code",
      render: (code, record) => (
        <Tag
          onClick={() => {
            const selectedSupplier = {
              id: record.id,
              name: record.companyName,
              korName: record.korCompanyName || record.companyName,
              code: record.code || "",
              email: record.email || "",
              communicationLanguage: record.communicationLanguage || "",
              supplierRemark: record.communicationLanguage || "",
            };

            // 새로운 매입처 추가
            setSelectedSuppliers((prevSuppliers) => {
              const newSuppliers = [...prevSuppliers, selectedSupplier];

              return newSuppliers; // 업데이트된 매입처 리스트 반환
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
      ]}
      width={1000}
    >
      <div style={{ display: "flex" }}>
        <Input
          style={{ flex: 8 }}
          placeholder="Enter maker name: ex) MITUBUSHI"
          value={inquirySearchMakerName}
          onChange={(e) => setInquirySearchMakerName(e.target.value)}
          onPressEnter={handleInquirySearch}
        />
        <Button
          style={{ flex: 2, marginLeft: 5 }}
          key="search"
          type="primary"
          onClick={handleInquirySearch}
        >
          Search
        </Button>
      </div>

      {selectedSuppliers.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <span>Suppliers: </span>
          {selectedSuppliers.map((supplier) => (
            <Tooltip
              placement="bottomLeft"
              title={supplier.supplierRemark || null}
              overlayInnerStyle={{ fontSize: 12 }}
              color="red"
            >
              <Tag
                key={supplier.id}
                color={supplier.supplierRemark ? "red" : "default"}
                style={{
                  cursor: "pointer",
                }}
              >
                {supplier.code}
              </Tag>
            </Tooltip>
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
