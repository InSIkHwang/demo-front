import React, { useState, Dispatch, SetStateAction } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Typography,
  Checkbox,
  Upload,
  Tag,
} from "antd";
import { SendOutlined, MailOutlined, UploadOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { sendQuotationMail } from "../../api/api";
import { offerEmailSendData } from "../../types/types";
import { useNavigate } from "react-router-dom";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import LoadingSpinner from "../LoadingSpinner";

const { TextArea } = Input;
const { Title } = Typography;

const StyledForm = styled(Form)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const StyledFormItem = styled(Form.Item)`
  margin-bottom: 16px;
`;

const StyledButton = styled(Button)`
  margin-top: 24px;
`;

interface FormValue {
  documentNumber: string;
  customer: string;
  refNumber: string;
  vesselName: string;
}

const OfferMailSender = ({
  inquiryFormValues,
  handleSubmit,
  setFileData,
  isPdfAutoUploadChecked,
  setIsPdfAutoUploadChecked,
  pdfFileData,
  mailData,
  pdfHeader,
  idList,
}: {
  inquiryFormValues: FormValue;
  handleSubmit: () => Promise<unknown>;
  setFileData: Dispatch<SetStateAction<(File | null)[]>>;
  isPdfAutoUploadChecked: boolean;
  setIsPdfAutoUploadChecked: Dispatch<SetStateAction<boolean>>;
  pdfFileData: File | null;
  mailData: offerEmailSendData | null;
  pdfHeader: string;
  idList: { offerId: any; supplierId: any };
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File[]>([]);

  const navigate = useNavigate();
  const INITIAL_DATA = {
    documentNumber: inquiryFormValues.documentNumber ?? "",
    toRecipient: mailData?.toRecipient ?? "",
    subject: mailData?.subject ?? "",
    content: mailData?.content ?? "",
  };

  const handlePdfAutoUploadChange = (e: CheckboxChangeEvent) => {
    setIsPdfAutoUploadChecked(e.target.checked);
  };

  const onFinish = async (values: any) => {
    setLoading(true);

    try {
      const updatedFileData = [...uploadFile];
      setFileData(updatedFileData);

      const { documentNumber, ...restValues } = values;

      const updateMailData = {
        ...mailData, // existing mailData as base
        ...restValues, // values from the form excluding documentNumber
      };

      const mailDataToSend = {
        emailSend: {
          toRecipient: updateMailData.toRecipient,
          subject: updateMailData.subject,
          content: updateMailData.content,
          ccRecipient: updateMailData.ccRecipient,
          bccRecipient: updateMailData.bccRecipient,
        },
        quotationHeader: pdfHeader,
        supplierInquiryIds: idList.offerId,
      };

      // 메일 전송 로직
      if (isPdfAutoUploadChecked && pdfFileData) {
        const finalFileData = [...updatedFileData, pdfFileData];
        setFileData(finalFileData);
        await sendQuotationMail(finalFileData, mailDataToSend);
      } else {
        await sendQuotationMail(updatedFileData, mailDataToSend);
      }

      message.success("The email has been sent successfully!");
      navigate("/supplierInquirylist");
    } catch (error) {
      console.error("Error sending email:", error);
      message.error("Email sending failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: any) => {
    setUploadFile((prevFileData) => [...prevFileData, file]);
    return false;
  };

  const handleFileRemove = (fileIndex: number) => {
    setUploadFile((prevFileData) =>
      prevFileData.filter((_, index) => index !== fileIndex)
    );
  };

  if (mailData === null) {
    return <LoadingSpinner></LoadingSpinner>;
  }
  return (
    <StyledForm form={form} onFinish={onFinish} initialValues={INITIAL_DATA}>
      <StyledFormItem name="documentNumber" label="Document Number">
        <Input disabled placeholder="문서 번호" />
      </StyledFormItem>
      <StyledFormItem
        name="toRecipient"
        label="Recipient"
        rules={[{ required: true, message: "Please enter the recipient" }]}
      >
        <Input prefix={<MailOutlined />} placeholder="Recipient" />
      </StyledFormItem>
      <StyledFormItem
        name="subject"
        label="Title"
        rules={[{ required: true, message: "Please enter a title." }]}
      >
        <Input placeholder="Title" />
      </StyledFormItem>
      <StyledFormItem
        name="content"
        label="Content"
        rules={[{ required: true, message: "Please enter the contents." }]}
      >
        <TextArea style={{ height: 300 }} placeholder="Content" rows={6} />
      </StyledFormItem>

      <StyledFormItem>
        <Title level={5}>Attached File</Title>
        <Upload
          customRequest={({ file }) => handleFileUpload(file)}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Upload File</Button>
        </Upload>
        <Checkbox
          checked={isPdfAutoUploadChecked}
          onChange={handlePdfAutoUploadChange}
          style={{ marginLeft: 15 }}
        >
          Automatic PDF File Upload
        </Checkbox>
        {uploadFile.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            {uploadFile.map((file, fileIndex) => (
              <Tag
                key={fileIndex}
                closable
                onClose={() => handleFileRemove(fileIndex)}
                style={{ marginBottom: "8px" }}
              >
                {file?.name}
              </Tag>
            ))}
          </div>
        )}
      </StyledFormItem>

      <StyledButton
        type="primary"
        htmlType="submit"
        loading={loading}
        icon={<SendOutlined />}
        size="large"
        block
      >
        Send Email
      </StyledButton>
    </StyledForm>
  );
};

export default OfferMailSender;
