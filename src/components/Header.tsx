import React, { useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faCaretDown,
  faCaretUp,
  faDollarSign,
  faCode,
  faSignOutAlt,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const StyledHeader = styled.header`
  display: flex;
  align-items: center;
  position: fixed;
  width: 100%;
  height: 70px;
  padding: 0 20px;
  background-color: ${(props) => props.theme.blue};
  color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 2000;
`;

const HeaderTitle = styled.div`
  font-size: 24px;
  font-weight: bold;
  margin-left: 20px;
  flex-grow: 1;
`;

const HeaderMenuBtnWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #ffffff;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const HeaderMenuBtnIcon = styled(FontAwesomeIcon)`
  color: #333;
  font-size: 24px;

  ${HeaderMenuBtnWrapper}:hover & {
    color: ${(props) => props.theme.darkBlue};
    transition: color 0.3s ease;
  }
`;

const UserBox = styled.div`
  cursor: pointer;
  margin-right: 20px;
  display: flex;
  align-items: center;
`;

const UserLogin = styled.div`
  margin-right: 10px;
`;

const LogoutButton = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const SideMenu = styled(motion.div)`
  position: fixed;
  top: 70px;
  left: 0;
  height: calc(100% - 70px);
  width: 300px;
  background-color: #212529; /* Darker background for contrast */
  color: white;
  padding: 20px;
  z-index: 2000;
  overflow: hidden;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.3);
  border-right: 1px solid #343a40;
`;

const MenuItem = styled.div`
  margin: 10px 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #495057; /* Subtle hover effect */
    color: #ffffff;
  }
`;

interface SubMenuProps {
  $isOpen: boolean;
}

const SubMenu = styled.div<SubMenuProps>`
  margin-left: 20px;
  font-size: 14px;
  display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
  padding-left: 20px;
  border-left: 2px solid #495057;
  margin-bottom: 10px;
  transition: max-height 0.3s ease;
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
  background-color: rgba(0, 0, 0, 0.5); /* Slightly lighter background */
  z-index: 1999;
`;

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Header = ({ isAuthenticated, onLogout }: HeaderProps) => {
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
        <UserBox>
          {isAuthenticated ? (
            <LogoutButton onClick={onLogout}>
              <FontAwesomeIcon
                icon={faSignOutAlt}
                style={{ marginRight: "8px" }}
              />
              LOGOUT
            </LogoutButton>
          ) : (
            <UserLogin
              onClick={() => handleMenuItemClick(() => navigate("/userlogin"))}
            >
              <FontAwesomeIcon
                icon={faSignInAlt}
                style={{ marginRight: "8px" }}
              />
              LOGIN
            </UserLogin>
          )}
        </UserBox>
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
        <SubMenu $isOpen={isEstimateOpen}>
          <MenuItem
            onClick={() => handleMenuItemClick(() => navigate("/makeinquiry"))}
          >
            견적생성
          </MenuItem>
          <MenuItem
            onClick={() =>
              handleMenuItemClick(() => navigate("/customerInquirylist"))
            }
          >
            견적 요청 - Requests
          </MenuItem>
          <MenuItem
            onClick={() =>
              handleMenuItemClick(() => navigate("/supplierInquirylist"))
            }
          >
            견적 제안 - Offers
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
        <SubMenu $isOpen={isCodeOpen}>
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
