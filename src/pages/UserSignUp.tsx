import React from "react";
import styled from "styled-components";
import { Form, Input, Button, Select, message } from "antd";
import { postUserSignUp } from "../api/api";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const SignUpContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e6e6 100%);
`;

const SignUpFormWrapper = styled.div`
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

const StyledSelect = styled(Select)`
  width: 100%;
  .ant-select-selector {
    border-radius: 8px !important;
    padding: 7px 12px !important;
  }
`;

const SignUpButton = styled(Button)`
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  margin-bottom: 10px;
`;

const BackToLoginButton = styled(Button)`
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
`;

const UserSignUp = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      const { email, password, name, country } = values;
      await postUserSignUp(email, password, name, country);
      navigate("/userlogin");
    } catch (error) {
      message.error("Error during signup");
    }
  };

  return (
    <SignUpContainer>
      <SignUpFormWrapper>
        <Title>Sign Up</Title>
        <StyledForm
          form={form}
          name="signup"
          onFinish={onFinish}
          scrollToFirstError
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <StyledInput placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <StyledInput.Password placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <StyledInput.Password placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item
            name="name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <StyledInput placeholder="Name" />
          </Form.Item>

          <Form.Item
            name="country"
            rules={[{ required: true, message: "Please select your country" }]}
          >
            <StyledSelect placeholder="Select Country">
              <Option value="KOREA">KOREA</Option>
              <Option value="INDIA">INDIA</Option>
              <Option value="JAPAN">JAPAN</Option>
              <Option value="CHINA">CHINA</Option>
              <Option value="OTHER">OTHER</Option>
            </StyledSelect>
          </Form.Item>
          <div style={{ marginTop: 50 }}>
            <Form.Item>
              <SignUpButton type="primary" htmlType="submit" block>
                Sign Up
              </SignUpButton>
              <BackToLoginButton
                type="default"
                block
                onClick={() => navigate("/userlogin")}
              >
                Login
              </BackToLoginButton>
            </Form.Item>
          </div>
        </StyledForm>
      </SignUpFormWrapper>
    </SignUpContainer>
  );
};

export default UserSignUp;
