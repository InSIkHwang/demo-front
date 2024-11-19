import React, { useState, Dispatch, SetStateAction } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Typography,
  Upload,
  Tag,
  Modal,
  Spin,
} from "antd";
import { SendOutlined, MailOutlined, UploadOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { sendQuotationMail } from "../../api/api";
import { HeaderFormData, offerEmailSendData } from "../../types/types";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../LoadingSpinner";

const { TextArea } = Input;
const { Title } = Typography;

// 페이지 전체를 덮는 블로킹 레이어 스타일 컴포넌트
const BlockingLayer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  pointer-events: all; /* 모든 이벤트 차단 */
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
`;

const StyledForm = styled(Form)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex: 1;
`;

const StyledFormItem = styled(Form.Item)`
  width: 100%;
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
  setFileData,
  pdfFileData,
  mailData,
  pdfHeader,
  selectedSupplierIds,
}: {
  inquiryFormValues: FormValue;
  handleSubmit: () => Promise<unknown>;
  setFileData: Dispatch<SetStateAction<(File | null)[]>>;
  pdfFileData: File | null;
  mailData: offerEmailSendData | null;
  pdfHeader: HeaderFormData;
  selectedSupplierIds: number[];
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File[]>([]);

  const navigate = useNavigate();
  const INITIAL_DATA = {
    documentNumber: inquiryFormValues.documentNumber ?? "",
    customer: inquiryFormValues.customer ?? "",
    refNumber: inquiryFormValues.refNumber ?? "",
    vesselName: inquiryFormValues.vesselName ?? "",
    toRecipient: mailData?.toRecipient ?? "",
    subject: mailData?.subject ?? "",
    content: mailData?.content ?? "",
  };

  const onFinish = async (values: any) => {
    setLoading(true);

    // 진행 상황 모달 표시 (OK 버튼 숨김)
    const modal = Modal.confirm({
      title: "Sending Emails...",
      content: (
        <div>
          <Spin />
          Please wait while emails are being sent.
        </div>
      ),
      maskClosable: false, // 모달 외부 클릭 시 닫히지 않도록 설정
      closable: false, // X 버튼 비활성화
      okButtonProps: { style: { display: "none" } }, // OK 버튼 숨기기
      cancelButtonProps: { style: { display: "none" } }, // Cancel 버튼도 숨길 수 있음
    });

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
        supplierInquiryIds: selectedSupplierIds, //추후 offerId로 변경
      };

      // 메일 전송 로직
      if (pdfFileData) {
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
      modal.destroy(); // 이메일 전송 완료 시 모달 닫기
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
    <>
      {loading && <BlockingLayer />}
      <StyledForm
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={INITIAL_DATA}
      >
        <FormRow>
          <StyledFormItem name="documentNumber" label="Document Number">
            <Input disabled placeholder="Document Number" />
          </StyledFormItem>
          <StyledFormItem name="refNumber" label="Ref Number">
            <Input disabled placeholder="Ref Number" />
          </StyledFormItem>
        </FormRow>
        <FormRow>
          <StyledFormItem name="customer" label="Customer">
            <Input disabled placeholder="Customer" />
          </StyledFormItem>
          <StyledFormItem name="vesselName" label="Vessel Name">
            <Input disabled placeholder="Vessel Name" />
          </StyledFormItem>
        </FormRow>
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
        <div style={{ display: "flex", gap: 20 }}>
          <StyledFormItem
            style={{ width: "50%" }}
            name="ccRecipient"
            label="ccRecipient"
          >
            <Input placeholder="CC Recipient" />
          </StyledFormItem>
        </div>
        <StyledFormItem>
          <Title level={5}>Attached File</Title>
          <Upload
            customRequest={({ file }) => handleFileUpload(file)}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Upload File</Button>
          </Upload>

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
    </>
  );
};

export default OfferMailSender;
