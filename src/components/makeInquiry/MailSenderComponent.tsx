import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Tabs, Typography, Card } from "antd";
import { SendOutlined, MailOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { sendInquiryMail } from "../../api/api";
import { MailData } from "../../types/types";
import dayjs from "dayjs";

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Title } = Typography;

interface FormValues {
  docNumber: string;
  mails: MailData[];
}

const StyledForm = styled(Form)`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
`;

const StyledFormItem = styled(Form.Item)`
  margin-bottom: 16px;
`;

const StyledButton = styled(Button)`
  margin-top: 24px;
`;

const AttachmentList = styled.ul`
  list-style-type: none;
  padding-left: 0;
`;

const AttachmentItem = styled.li`
  margin-bottom: 8px;
`;

interface FormValue {
  docNumber: string;
  registerDate: dayjs.Dayjs;
  shippingDate: dayjs.Dayjs;
  customer: string;
  vesselName: string;
  refNumber: string;
  currencyType: string;
  currency: number;
  remark: string;
  supplierName: string;
}

const MailSenderComponent = ({
  mailDataList,
  inquiryFormValues,
}: {
  mailDataList: MailData[];
  inquiryFormValues: FormValue;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentMailDataList, setCurrentMailDataList] = useState(mailDataList);

  useEffect(() => {
    form.setFieldsValue({
      docNumber: inquiryFormValues.docNumber,
      mails: mailDataList.map((mail) => ({
        toRecipient: mail.toRecipient || "",
        subject: mail.subject || "",
        content: mail.content || "",
        ccRecipient: mail.ccRecipient || "",
        bccRecipient: mail.bccRecipient || "",
      })),
    });
    setCurrentMailDataList(mailDataList);
  }, [mailDataList, form, inquiryFormValues.docNumber]);

  const onFinish = async (values: any) => {
    const updatedMailDataList = currentMailDataList.map((mailData, index) => ({
      ...mailData,
      ...values.mails[index],
    }));

    setLoading(true);
    try {
      await sendInquiryMail(values.docNumber, updatedMailDataList);
      console.log(updatedMailDataList);
      message.success("이메일이 성공적으로 전송되었습니다!");
    } catch (error) {
      console.log(updatedMailDataList);
      message.error("이메일 전송에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledForm form={form} onFinish={onFinish}>
      <StyledCard>
        <Form.Item
          name="docNumber"
          label="문서 번호"
          initialValue={inquiryFormValues.docNumber}
        >
          <Input disabled placeholder="문서 번호" />
        </Form.Item>
      </StyledCard>
      <Tabs defaultActiveKey="0" type="card">
        {currentMailDataList.map((mailData, index) => (
          <TabPane tab={`의뢰처 ${index + 1}`} key={index.toString()}>
            <StyledCard>
              <StyledFormItem
                name={["mails", index, "toRecipient"]}
                rules={[{ required: true, message: "받는 사람을 입력하세요." }]}
              >
                <Input prefix={<MailOutlined />} placeholder="받는 사람" />
              </StyledFormItem>
              <StyledFormItem
                name={["mails", index, "subject"]}
                rules={[{ required: true, message: "제목을 입력하세요." }]}
              >
                <Input placeholder="제목" />
              </StyledFormItem>
              <StyledFormItem
                name={["mails", index, "content"]}
                rules={[{ required: true, message: "내용을 입력하세요." }]}
              >
                <TextArea placeholder="내용" rows={6} />
              </StyledFormItem>
              <StyledFormItem name={["mails", index, "ccRecipient"]}>
                <Input placeholder="CC" />
              </StyledFormItem>
              <StyledFormItem name={["mails", index, "bccRecipient"]}>
                <Input placeholder="BCC" />
              </StyledFormItem>

              <StyledFormItem>
                <Title level={5}>첨부파일</Title>
                <AttachmentList>
                  {mailData.attachments.map((attachment, attachIndex) => (
                    <AttachmentItem key={attachIndex}>
                      {attachment.fileName}
                    </AttachmentItem>
                  ))}
                </AttachmentList>
              </StyledFormItem>
            </StyledCard>
          </TabPane>
        ))}
      </Tabs>

      <StyledButton
        type="primary"
        htmlType="submit"
        loading={loading}
        icon={<SendOutlined />}
        size="large"
        block
      >
        메일 보내기
      </StyledButton>
    </StyledForm>
  );
};

export default MailSenderComponent;
