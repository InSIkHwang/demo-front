import React, { useState, useEffect, KeyboardEvent } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

// Styled components
const ListWrap = styled.div`
  position: relative;
  top: 100px;
  margin: 0 auto;
  width: 1200px;
  border: 2px solid #ccc;
  padding: 20px;
  border-radius: 8px;
`;

const ListTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
`;

const ListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 20px;
  width: 100%;
`;

const ListSearchBarWrapper = styled.div`
  position: relative;
  display: flex;
  width: 40%;
  margin-left: 10px;
  justify-content: flex-end;
`;

const ListSearchBar = styled.input`
  width: 100%;
  padding: 10px 40px 10px 10px; /* 아이콘을 위한 패딩 추가 */
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const SearchIcon = styled(FontAwesomeIcon)`
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  color: #888;
  cursor: pointer; /* 클릭할 수 있음을 시각적으로 표시 */
`;

const SearchDropdown = styled.select`
  width: 20%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px; /* 검색 바와의 간격 */
  box-sizing: border-box; /* 패딩과 테두리를 너비에 포함 */
`;

const ListTable = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  background-color: #1976d2;
  color: white;
  padding: 10px;
  text-align: left;
`;

const TableCell = styled.td`
  padding: 10px;
  border: 1px solid #ddd;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 18px;
  color: #666;
  padding: 20px;
`;

// Define the Customer type
interface Customer {
  code: string;
  name: string;
  contact: string;
  manager: string;
  email: string;
  address: string;
  date: string;
}

const CustomerList = () => {
  const [data, setData] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [filteredData, setFilteredData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가

  useEffect(() => {
    fetch("/data/customer.json") // 데이터 파일 경로
      .then((response) => response.json())
      .then((data: Customer[]) => {
        setData(data);
        setFilteredData(data); // 데이터 로드 후 필터링된 데이터 초기화
        setLoading(false); // 데이터 로드 완료 후 로딩 상태 변경
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        setLoading(false); // 오류 발생 시에도 로딩 상태 변경
      });
  }, []);

  // Search filter logic
  const applyFilter = () => {
    const result =
      searchText.trim() === ""
        ? data
        : data.filter((item) => {
            if (searchCategory === "all") {
              return (
                item.code.includes(searchText) ||
                item.name.includes(searchText) ||
                item.contact.includes(searchText) ||
                item.manager.includes(searchText) ||
                item.email.includes(searchText) ||
                item.address.includes(searchText)
              );
            } else if (searchCategory === "code") {
              return item.code.includes(searchText);
            } else if (searchCategory === "name") {
              return item.name.includes(searchText);
            }
            return false;
          });
    setFilteredData(result);
  };

  // Handle Enter key press
  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      applyFilter();
    }
  };

  if (loading) {
    return <LoadingMessage>로딩 중...</LoadingMessage>;
  }

  return (
    <ListWrap>
      <ListTitle>매출처 관리</ListTitle>
      <ListHeader>
        <SearchDropdown onChange={(e) => setSearchCategory(e.target.value)}>
          <option value="all">통합검색</option>
          <option value="code">코드검색</option>
          <option value="name">상호명</option>
        </SearchDropdown>
        <ListSearchBarWrapper>
          <ListSearchBar
            placeholder="검색..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={handleKeyPress} // 엔터 키 이벤트 핸들링
          />
          <SearchIcon icon={faSearch} onClick={applyFilter} />{" "}
          {/* 돋보기 버튼 클릭 시 필터링 */}
        </ListSearchBarWrapper>
      </ListHeader>
      <ListTable>
        <Table>
          <thead>
            <tr>
              <TableHeader>코드</TableHeader>
              <TableHeader>상호명</TableHeader>
              <TableHeader>연락처</TableHeader>
              <TableHeader>담당자</TableHeader>
              <TableHeader>이메일</TableHeader>
              <TableHeader>주소</TableHeader>
              <TableHeader>등록일</TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <TableRow key={item.code}>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.contact}</TableCell>
                <TableCell>{item.manager}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.address}</TableCell>
                <TableCell>{item.date}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </ListTable>
    </ListWrap>
  );
};

export default CustomerList;
