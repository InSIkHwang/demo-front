import React from "react";
import styled, { keyframes } from "styled-components";

// 애니메이션 정의
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// 스타일링된 스피너 컴포넌트
const Spinner = styled.div`
  border: 8px solid rgba(0, 0, 0, 0.1); /* 배경색 */
  border-left: 8px solid #007bff; /* 스피너 색상 */
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: ${spin} 1.5s linear infinite;
`;

// 스타일링된 컨테이너
const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f5f5f5; /* 배경색 */
`;

// 컴포넌트
const LoadingSpinner = () => (
  <LoaderContainer>
    <Spinner />
  </LoaderContainer>
);

export default LoadingSpinner;
