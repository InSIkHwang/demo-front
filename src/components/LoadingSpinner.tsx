import React from "react";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const LoaderContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  z-index: 999;
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const SpinnerWrapper = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
`;

const Spinner = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border: 3px solid transparent;
    border-radius: 50%;
  }

  &::before {
    top: -12px;
    left: -12px;
    right: -12px;
    bottom: -12px;
    border-top-color: #1890ff;
    animation: ${spin} 3s linear infinite;
    opacity: 0.6;
  }

  &::after {
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border-top-color: #1890ff;
    animation: ${spin} 1.5s linear infinite;
    opacity: 0.3;
  }
`;

const dotAnimation = keyframes`
  0%, 20% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
  80%, 100% { transform: translateY(0); }
`;

const LoadingMessage = styled.div`
  margin-top: 5rem;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 1.2rem;
  font-weight: 500;
  color: #4b5563;
  letter-spacing: 0.3px;

  .dot {
    width: 4px;
    height: 4px;
    background-color: #1890ff;
    border-radius: 50%;
    display: inline-block;
    margin: 0 2px;
    opacity: 0.8;

    &:nth-child(1) {
      animation: ${dotAnimation} 1.4s infinite;
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation: ${dotAnimation} 1.4s infinite;
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation: ${dotAnimation} 1.4s infinite;
      animation-delay: 0.4s;
    }
  }
`;

const LoadingSpinner = () => (
  <LoaderContainer>
    <SpinnerWrapper>
      <Spinner />
    </SpinnerWrapper>
    <LoadingMessage>
      Loading, please wait
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </LoadingMessage>
  </LoaderContainer>
);

export default LoadingSpinner;