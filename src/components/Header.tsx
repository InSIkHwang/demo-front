import React, { useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faCaretDown,
  faCaretUp,
  faCode,
  faSignOutAlt,
  faSignInAlt,
  faTrash,
  faBoxOpen,
  faFileInvoice,
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
  font-size: 26px;
  font-weight: 700;
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
  margin-right: 30px;
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
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
  background: rgba(33, 37, 41, 0.95);
  backdrop-filter: blur(10px);
  color: white;
  padding: 24px;
  z-index: 2000;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
`;

const MenuItem = styled.div`
  margin: 8px 0;
  font-size: 15px;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }

  svg {
    transition: all 0.3s ease;
  }

  &:hover svg {
    transform: scale(1.1);
  }
`;

interface SubMenuProps {
  $isOpen: boolean;
}

const SubMenu = styled.div<SubMenuProps>`
  margin-left: 24px;
  font-size: 14px;
  max-height: ${({ $isOpen }) => ($isOpen ? "500px" : "0")};
  opacity: ${({ $isOpen }) => ($isOpen ? "1" : "0")};
  overflow: hidden;
  padding-left: 20px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  margin-bottom: ${({ $isOpen }) => ($isOpen ? "10px" : "0")};
  transition: all 0.3s ease;
`;

const menuVariants = {
  open: { x: 0, opacity: 1 },
  closed: { x: "-100%", opacity: 0 },
};

const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
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
  const [isTrashOpen, setTrashOpen] = useState(false);
  const [isOrderOpen, setOrderOpen] = useState(false);
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
            icon={faFileInvoice}
            style={{ marginRight: "10px" }}
          />
          Quotation
          <FontAwesomeIcon
            icon={isEstimateOpen ? faCaretUp : faCaretDown}
            style={{ marginLeft: "auto", cursor: "pointer" }}
          />
        </MenuItem>
        <SubMenu $isOpen={isEstimateOpen}>
          <MenuItem
            onClick={() => handleMenuItemClick(() => navigate("/makeinquiry"))}
          >
            견적 생성 - Create Request
          </MenuItem>
          <MenuItem
            onClick={() =>
              handleMenuItemClick(() => navigate("/customerInquirylist"))
            }
          >
            견적 요청 - Request
          </MenuItem>
          <MenuItem
            onClick={() =>
              handleMenuItemClick(() => navigate("/supplierInquirylist"))
            }
          >
            견적 제안 - Offer
          </MenuItem>
          <MenuItem
            onClick={() =>
              handleMenuItemClick(() => navigate("/quotationlist"))
            }
          >
            최종 견적 - FInal Quotations
          </MenuItem>
        </SubMenu>
        <MenuItem onClick={() => setOrderOpen(!isOrderOpen)}>
          <FontAwesomeIcon icon={faBoxOpen} style={{ marginRight: "10px" }} />
          Order
          <FontAwesomeIcon
            icon={isOrderOpen ? faCaretUp : faCaretDown}
            style={{ marginLeft: "auto", cursor: "pointer" }}
          />
        </MenuItem>
        <SubMenu $isOpen={isOrderOpen}>
          <MenuItem
            onClick={() => handleMenuItemClick(() => navigate("/orderlist"))}
          >
            수주 관리 - Orders
          </MenuItem>
        </SubMenu>
        <MenuItem onClick={() => setCodeOpen(!isCodeOpen)}>
          <FontAwesomeIcon icon={faCode} style={{ marginRight: "10px" }} />
          Codes
          <FontAwesomeIcon
            icon={isCodeOpen ? faCaretUp : faCaretDown}
            style={{ marginLeft: "auto", cursor: "pointer" }}
          />
        </MenuItem>
        <SubMenu $isOpen={isCodeOpen}>
          <MenuItem
            onClick={() => handleMenuItemClick(() => navigate("/customerlist"))}
          >
            Customer
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuItemClick(() => navigate("/supplierlist"))}
          >
            Supplier
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuItemClick(() => navigate("/shiplist"))}
          >
            Vessel
          </MenuItem>
        </SubMenu>
        <MenuItem onClick={() => setTrashOpen(!isTrashOpen)}>
          <FontAwesomeIcon icon={faTrash} style={{ marginRight: "10px" }} />
          Trash
          <FontAwesomeIcon
            icon={isTrashOpen ? faCaretUp : faCaretDown}
            style={{ marginLeft: "auto", cursor: "pointer" }}
          />
        </MenuItem>
        <SubMenu $isOpen={isTrashOpen}>
          <MenuItem
            onClick={() => handleMenuItemClick(() => navigate("/trashlist"))}
          >
            Trash
          </MenuItem>
        </SubMenu>
      </SideMenu>
    </>
  );
};

export default Header;
