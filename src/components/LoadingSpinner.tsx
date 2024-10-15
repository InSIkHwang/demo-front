import React from "react";
import styled, { keyframes } from "styled-components";

// 애니메이션 정의
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// 스타일링된 스피너 컴포넌트
const Spinner = styled.div`
  z-index: 1000;
  border: 8px solid rgba(0, 0, 0, 0.1); /* 배경색 */
  border-left: 8px solid #3498db; /* 스피너 색상 */
  border-radius: 50%;
  width: 80px;
  height: 80px;
  animation: ${spin} 1.2s ease-in-out infinite;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 그림자 추가 */
`;

// 스타일링된 컨테이너
const LoaderContainer = styled.div`
  top: 0;
  z-index: 999;
  position: fixed;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #ffffff, #d4d4d4);
`;

// 로딩 메시지 스타일링
const LoadingMessage = styled.p`
  z-index: 1000;
  font-size: 1.5rem;
  color: #333;
  margin-top: 20px;
`;

// 컴포넌트
const LoadingSpinner = () => (
  <LoaderContainer>
    <Spinner />
    <LoadingMessage>Loading, please wait...</LoadingMessage>
  </LoaderContainer>
);

export default LoadingSpinner;
