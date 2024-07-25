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

const StyledHeader = styled.header`
  top: 0;
  display: flex;
  align-items: center;
  position: fixed;
  width: 100%;
  height: 70px;
  font-size: 14px;
  padding: 20px;
  color: white;
  z-index: 1000;
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
  z-index: 1001;
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
  top: 60px;
  left: 0;
  height: calc(100% - 60px);
  width: 280px;
  background-color: #333;
  color: white;
  padding: 20px;
  z-index: 999;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
`;

const MenuItem = styled.div`
  margin: 10px 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.205);
  }
`;
interface SubMenuProps {
  isOpen: boolean;
}

const SubMenu = styled.div<SubMenuProps>`
  margin-left: 40px;
  font-size: 12px;
  display: ${({ isOpen }) => (isOpen ? "block" : "none")};
  margin-bottom: 35px;

  & > div {
    border-radius: 5px;
    border-left: 1px solid #ccc;
  }
`;

const menuVariants = {
  open: { x: 0, opacity: 1 },
  closed: { x: "-100%", opacity: 0 },
};

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #0000004e;
  z-index: 998;
`;

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

  const handleMenuItemClick = (callback: () => void) => {
    callback();
    setMenuOpen(false);
  };

  return (
    <>
      <StyledHeader>
        <HeaderMenuBtnWrapper onClick={toggleMenu}>
          <HeaderMenuBtnIcon icon={faBars} />
        </HeaderMenuBtnWrapper>
        <HeaderTitle>BAS KOREA</HeaderTitle>
      </StyledHeader>

      {isMenuOpen && <Backdrop onClick={closeMenu} />}

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
          <MenuItem
            onClick={() => handleMenuItemClick(() => console.log("견적생성"))}
          >
            견적생성
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuItemClick(() => console.log("견적관리"))}
          >
            견적관리
          </MenuItem>
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
          <MenuItem
            onClick={() => handleMenuItemClick(() => navigate("/customerlist"))}
          >
            매출처
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuItemClick(() => navigate("/supplierlist"))}
          >
            매입처
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuItemClick(() => navigate("/shiplist"))}
          >
            선박
          </MenuItem>
        </SubMenu>
      </SideMenu>
    </>
  );
};

export default Header;
