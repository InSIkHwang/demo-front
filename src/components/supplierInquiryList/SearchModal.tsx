import React, { useState } from "react";
import { Modal, Input, Select, Button, Table, Row, Col } from "antd";
import { searchInquiryList } from "../../api/api";
import { Inquiry } from "../../types/types";

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

const SearchModal = ({ visible, onClose }: SearchModalProps) => {
  const [searchText, setSearchText] = useState<string>("");
  const [searchCategory, setSearchCategory] =
    useState<string>("documentNumber");
  const [customerInquiryList, setCustomerInquiryList] = useState<Inquiry[]>([]);

  const handleSearch = async () => {
    try {
      const response = await searchInquiryList(
        "", // registerStartDate
        "", // registerEndDate
        searchCategory === "documentNumber" ? searchText : "", // documentNumber
        searchCategory === "refNumber" ? searchText : "", // refNumber
        "" // customerName (빈 문자열로 기본값 설정)
      );

      setCustomerInquiryList(response.customerInquiryList);
    } catch (error) {
      console.error("검색 중 오류가 발생했습니다:", error);
    }
  };

  // 테이블 컬럼 정의
  const columns = [
    {
      title: "문서번호",
      dataIndex: "documentNumber",
      key: "documentNumber",
    },
    {
      title: "회사명",
      dataIndex: "companyName",
      key: "companyName",
    },
    {
      title: "담당자",
      dataIndex: "docManager",
      key: "docManager",
    },
    {
      title: "비고",
      dataIndex: "docRemark",
      key: "docRemark",
      render: (text: string) => text || "없음",
    },
    {
      title: "상태",
      dataIndex: "documentStatus",
      key: "documentStatus",
    },
    {
      title: "REF NO.",
      dataIndex: "refNumber",
      key: "refNumber",
      render: (text: string) => text || "없음",
    },
    {
      title: "등록일",
      dataIndex: "registerDate",
      key: "registerDate",
    },
    {
      title: "선박명",
      dataIndex: "vesselName",
      key: "vesselName",
      render: (text: string) => text || "없음",
    },
  ];

  return (
    <Modal
      title="검색"
      visible={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={1400}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }} // 높이와 스크롤 설정
    >
      <Row gutter={16}>
        <Col span={6}>
          <Select
            defaultValue="documentNumber"
            style={{ width: "100%" }}
            onChange={(value) => setSearchCategory(value)}
          >
            <Select.Option value="documentNumber">문서번호</Select.Option>
            <Select.Option value="refNumber">REF NO.</Select.Option>
            <Select.Option value="docRemark">매출처</Select.Option>
          </Select>
        </Col>
        <Col span={12}>
          <Input
            placeholder="검색어 입력"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={6} style={{ display: "flex", alignItems: "flex-end" }}>
          <Button
            type="primary"
            onClick={handleSearch}
            style={{ width: "100%" }}
          >
            검색
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={customerInquiryList}
        rowKey="customerInquiryId"
        style={{ marginTop: 16 }}
        pagination={false} // 페이지네이션을 사용하지 않도록 설정
      />
    </Modal>
  );
};

export default SearchModal;
