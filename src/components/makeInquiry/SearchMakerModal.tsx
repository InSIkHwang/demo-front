import React, { useCallback } from "react";
import { Modal, AutoComplete, Input, List, Checkbox, Divider } from "antd";
import styled from "styled-components";
import { MakerSupplierList } from "../../types/types";
import { debounce } from "lodash";

const MakerTitle = styled.div`
  display: flex;
  width: 100%;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
`;

const MakerName = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
`;

const CategoryBadge = styled.span`
  background-color: #f0f7ff;
  color: #0050b3;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .ant-modal-header {
    border-radius: 12px 12px 0 0;
    background: #f8f9fa;
    padding: 16px 24px;

    .ant-modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .ant-modal-body {
    padding: 24px;
  }

  .ant-modal-footer {
    border-top: 1px solid #f0f0f0;
    padding: 16px 24px;
  }
`;

const StyledListItem = styled(List.Item)`
  flex-direction: column;
  padding: 10px !important;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  margin-bottom: 12px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #fafafa;
    border-color: #e6e6e6;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
`;

const SupplierContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 0;
`;

const StyledCheckbox = styled(Checkbox)`
  background: white;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;

  &:hover {
    background: #f8f9fa;
    border-color: #e6e6e6;
  }

  .ant-checkbox-wrapper {
    margin-right: 8px;
  }

  .ant-checkbox-checked .ant-checkbox-inner {
    background-color: #1890ff;
    border-color: #1890ff;
  }
`;

interface SearchMakerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onOk: () => void;
  categoryWord: string;
  categoryOptions: { value: string }[];
  makerSearch: string;
  makerOptions: { value: string; label: string }[];
  makerSupplierList: MakerSupplierList[];
  checkedSuppliers: any[];
  onCategorySearch: (value: string) => void;
  onSearch: (value: string, categoryWord: string) => void;
  onCheckboxChange: (supplier: any) => void;
  setMakerSearch: (value: string) => void;
}

const SearchMakerModal = ({
  isVisible,
  onClose,
  onOk,
  categoryWord,
  categoryOptions,
  makerSearch,
  makerOptions,
  makerSupplierList,
  checkedSuppliers,
  onCategorySearch,
  onSearch,
  onCheckboxChange,
  setMakerSearch,
}: SearchMakerModalProps) => {
  const handleSearch = (value: string) => {
    setMakerSearch(value); // 즉시 검색어 상태 업데이트
    onSearch(value, categoryWord); // 디바운스된 검색 실행
  };

  const removeDuplicateSuppliers = (makerSupplierList: MakerSupplierList[]) => {
    return makerSupplierList.map((makerSupplier) => {
      // Set을 사용하여 중복 제거를 위한 id 추적
      const uniqueIds = new Set();

      // supplierList 내의 중복 제거
      const uniqueSuppliers = makerSupplier.supplierList.filter((supplier) => {
        if (uniqueIds.has(supplier.id)) {
          return false;
        }
        uniqueIds.add(supplier.id);
        return true;
      });

      // 중복이 제거된 supplierList로 업데이트
      return {
        ...makerSupplier,
        supplierList: uniqueSuppliers,
      };
    });
  };

  // 중복 제거된 makerSupplierList 생성
  const uniqueMakerSupplierList = removeDuplicateSuppliers(makerSupplierList);

  return (
    <StyledModal
      title="Search MAKER"
      open={isVisible}
      onCancel={onClose}
      onOk={onOk}
      okText="Add"
      cancelText="Cancel"
      width={800}
    >
      <AutoComplete
        value={makerSearch}
        onChange={handleSearch}
        options={makerOptions}
        style={{ width: "100%", marginBottom: 16 }}
        placeholder="Search MAKER ex) HYUNDAI"
      >
        <Input.Search />
      </AutoComplete>
      <List
        dataSource={uniqueMakerSupplierList}
        renderItem={(item) => (
          <StyledListItem>
            <MakerTitle>
              <MakerName>{item.maker}</MakerName>
              <CategoryBadge>{item.category}</CategoryBadge>
            </MakerTitle>
            <SupplierContainer>
              {item.supplierList.map((supplier: any, index: number) => (
                <StyledCheckbox
                  key={supplier.id}
                  onChange={() => onCheckboxChange(supplier)}
                  checked={checkedSuppliers.some(
                    (checkedItem) => checkedItem.id === supplier.id
                  )}
                >
                  {supplier.name || ""} ({supplier.code})
                </StyledCheckbox>
              ))}
            </SupplierContainer>
          </StyledListItem>
        )}
      />
    </StyledModal>
  );
};

export default SearchMakerModal;
