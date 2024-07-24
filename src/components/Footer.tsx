import styled from "styled-components";

const FooterDiv = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 100px;
  height: 100px;
  font-size: 13px;
  color: #7c7c7c;
  border-top: 1px solid #7c7c7c;
`;

const Footer = () => {
  return (
    <FooterDiv>© Copyright 2024. BAS KOREA All rights reserved.</FooterDiv>
  );
};

export default Footer;
