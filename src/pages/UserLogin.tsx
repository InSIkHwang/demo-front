import React from "react";
import styled from "styled-components";
import { Form, Input, Button } from "antd";
import { postUserLogin } from "../api/api";
import { useNavigate } from "react-router-dom";
import { setAccessToken, setRefreshToken } from "../api/auth";

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e6e6 100%);
`;

const LoginFormWrapper = styled.div`
  background: #ffffff;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 450px;
  text-align: center;
`;

const Title = styled.h2`
  margin-bottom: 24px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 24px;
  }
`;

const StyledInput = styled(Input)`
  border-radius: 8px;
  border: 1px solid #dcdcdc;
  padding: 12px;
  &:focus {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

const LoginButton = styled(Button)`
  background-color: #1890ff;
  border-color: #1890ff;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  margin-bottom: 10px;
  &:hover {
    background-color: #40a9ff;
    border-color: #40a9ff;
  }
`;

const SignUpButton = styled(Button)`
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  margin-bottom: 10px;
`;

interface UserLoginProps {
  onLogin: () => void;
}

const UserLogin = ({ onLogin }: UserLoginProps) => {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    const { email, password } = values;
    try {
      const response = await postUserLogin(email, password);

      // 액세스 토큰을 메모리 변수에 저장
      setAccessToken(response.accessToken);

      // 리프레시 토큰을 쿠키에 저장
      setRefreshToken(response.refreshToken);

      onLogin();
      navigate("/customerInquirylist");
    } catch (error) {
      console.error("Login error", error);
    }
  };

  return (
    <LoginContainer>
      <LoginFormWrapper>
        <Title>Login</Title>
        <StyledForm
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please enter your email" }]}
          >
            <StyledInput placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <StyledInput.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <LoginButton type="primary" htmlType="submit" block>
              Login
            </LoginButton>
            <SignUpButton
              type="default"
              block
              onClick={() => navigate("/usersignup")}
            >
              Sign Up
            </SignUpButton>
          </Form.Item>
        </StyledForm>
      </LoginFormWrapper>
    </LoginContainer>
  );
};

export default UserLogin;
