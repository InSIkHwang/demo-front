import React, { useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faCaretDown,
  faCaretUp,
  faDollarSign,
  faCode,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Styled components
const StyledHeader = styled.header`
  display: flex;
  align-items: center;
  position: fixed;
  width: 100vw;
  height: 30px; /* 헤더 높이 조정 */
  top: 0;
  font-size: 14px;
  padding: 20px;
  color: white;
  z-index: 1000; /* 헤더가 사이드 메뉴보다 위에 오도록 z-index 조정 */
  background-color: #1976d2;
`;

const HeaderTitle = styled.div`
  font-size: 28px;
  font-weight: 700;
  margin-left: 30px;
`;

const HeaderMenuBtnWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white;
  cursor: pointer;
  z-index: 1001; /* 버튼이 헤더와 사이드 메뉴보다 위에 있도록 z-index 조정 */
`;

const HeaderMenuBtnIcon = styled(FontAwesomeIcon)`
  color: grey;
  font-size: 24px;

  ${HeaderMenuBtnWrapper}:hover & {
    color: black;
    transition: color 0.5s ease;
  }
`;

const SideMenu = styled(motion.div)`
  position: fixed;
  top: 60px; /* 헤더의 높이만큼 조정 */
  left: 0;
  height: calc(100vh - 60px); /* 헤더의 높이만큼 제외 */
  width: 280px;
  background-color: #333; /* 배경 색상 */
  color: white;
  padding: 20px;
  z-index: 999; /* 사이드 메뉴가 헤더와 버튼보다 아래에 있도록 z-index 조정 */
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
`;

// TypeScript interface for SubMenu props
interface SubMenuProps {
  isOpen: boolean;
}

const MenuItem = styled.div`
  margin: 10px 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  padding-top: 30px;
  cursor: pointer;
`;

const SubMenu = styled.div<SubMenuProps>`
  margin-left: 20px;
  font-size: 12px;
  display: ${({ isOpen }) => (isOpen ? "block" : "none")};
`;

const menuVariants = {
  open: { x: 0, opacity: 1 },
  closed: { x: "-100%", opacity: 0 },
};

// Main Header component
const Header = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isEstimateOpen, setEstimateOpen] = useState(false);
  const [isCodeOpen, setCodeOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <StyledHeader onClick={closeMenu}>
        <HeaderMenuBtnWrapper onClick={toggleMenu}>
          <HeaderMenuBtnIcon icon={faBars} />
        </HeaderMenuBtnWrapper>
        <HeaderTitle>BAS KOREA</HeaderTitle>
      </StyledHeader>

      <SideMenu
        initial="closed"
        animate={isMenuOpen ? "open" : "closed"}
        variants={menuVariants}
        transition={{ type: "spring", stiffness: 300, damping: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => setEstimateOpen(!isEstimateOpen)}>
          <FontAwesomeIcon
            icon={faDollarSign}
            style={{ marginRight: "10px" }}
          />
          견적관리
          <FontAwesomeIcon
            icon={isEstimateOpen ? faCaretUp : faCaretDown}
            style={{ marginLeft: "auto", cursor: "pointer" }}
          />
        </MenuItem>
        <SubMenu isOpen={isEstimateOpen}>
          <MenuItem>견적생성</MenuItem>
          <MenuItem>견적관리</MenuItem>
        </SubMenu>
        <MenuItem onClick={() => setCodeOpen(!isCodeOpen)}>
          <FontAwesomeIcon icon={faCode} style={{ marginRight: "10px" }} />
          코드관리
          <FontAwesomeIcon
            icon={isCodeOpen ? faCaretUp : faCaretDown}
            style={{ marginLeft: "auto", cursor: "pointer" }}
          />
        </MenuItem>
        <SubMenu isOpen={isCodeOpen}>
          <MenuItem onClick={() => navigate("/customerlist")}>매출처</MenuItem>
          <MenuItem>매입처</MenuItem>
          <MenuItem>선박</MenuItem>
        </SubMenu>
      </SideMenu>
    </>
  );
};

export default Header;
