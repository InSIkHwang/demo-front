import React, { useState } from "react";
import { Form, Input, Button, Space, message } from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  SendOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { sendInquiryMail } from "../../api/api";
import { MailData } from "../../types/types";

const { TextArea } = Input;

interface FormValues {
  docNumber: string;
  mails: MailData[];
}

const StyledForm = styled(Form)`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background-color: #f0f2f5;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const StyledFormItem = styled(Form.Item)`
  margin-bottom: 24px;
`;

const StyledButton = styled(Button)`
  margin-right: 8px;
`;

const MailSenderComponent = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    const typedValues: FormValues = values;
    setLoading(true);
    try {
      await sendInquiryMail(typedValues.docNumber, typedValues.mails);
      message.success("Emails sent successfully!");
      form.resetFields();
    } catch (error) {
      message.error("Failed to send emails. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledForm form={form} onFinish={onFinish}>
      <StyledFormItem
        name="docNumber"
        label="Document Number"
        rules={[
          { required: true, message: "Please input the document number!" },
        ]}
      >
        <Input />
      </StyledFormItem>

      <Form.List name="mails">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space
                key={key}
                style={{ display: "flex", marginBottom: 8 }}
                align="baseline"
              >
                <StyledFormItem
                  {...restField}
                  name={[name, "toRecipient"]}
                  rules={[{ required: true, message: "To is required" }]}
                >
                  <Input placeholder="To" />
                </StyledFormItem>
                <StyledFormItem
                  {...restField}
                  name={[name, "subject"]}
                  rules={[{ required: true, message: "Subject is required" }]}
                >
                  <Input placeholder="Subject" />
                </StyledFormItem>
                <StyledFormItem
                  {...restField}
                  name={[name, "content"]}
                  rules={[{ required: true, message: "Content is required" }]}
                >
                  <TextArea placeholder="Content" rows={4} />
                </StyledFormItem>
                <StyledFormItem {...restField} name={[name, "ccRecipient"]}>
                  <Input placeholder="CC" />
                </StyledFormItem>
                <StyledFormItem {...restField} name={[name, "bccRecipient"]}>
                  <Input placeholder="BCC" />
                </StyledFormItem>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <StyledFormItem>
              <StyledButton
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Add Mail
              </StyledButton>
            </StyledFormItem>
          </>
        )}
      </Form.List>

      <StyledFormItem>
        <StyledButton
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<SendOutlined />}
        >
          Send Mails
        </StyledButton>
      </StyledFormItem>
    </StyledForm>
  );
};

export default MailSenderComponent;
