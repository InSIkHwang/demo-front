import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Tabs,
  Typography,
  Card,
  Checkbox,
  Upload,
  Tag,
  Modal,
  Spin,
  Select,
} from "antd";
import { SendOutlined, MailOutlined } from "@ant-design/icons";
import { UploadOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { sendInquiryMail } from "../../api/api";
import { emailSendData, InquiryItem, VesselList } from "../../types/types";
import dayjs from "dayjs";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { useNavigate } from "react-router-dom";
import { generatePDFs } from "./PDFGenerator";

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

const StyledForm = styled(Form)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const StyledCard = styled(Card)`
  margin-bottom: 10px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const StyledFormItem = styled(Form.Item)`
  margin-bottom: 16px;
`;

const StyledButton = styled(Button)`
  margin-top: 24px;
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

interface MailSenderModalProps {
  mode: string;
  mailDataList: emailSendData[];
  inquiryFormValues: FormValue;
  handleSubmit: () => Promise<unknown>;
  selectedSupplierTag: {
    id: number;
    name: string;
    korName: string;
    code: string;
    email: string;
    communicationLanguage: string;
  }[];
  setFileData: Dispatch<SetStateAction<File[]>>;
  setIsSendMail: Dispatch<SetStateAction<boolean>>;
  getItemsForSupplier: (supplierId: number) => InquiryItem[];
  vesselInfo: VesselList | null;
  pdfHeader: string;
  setPdfFileData: Dispatch<SetStateAction<File[]>>;
  handleLanguageChange: (value: string, id: number) => void;
}

const MailSenderModal = ({
  mode,
  mailDataList,
  inquiryFormValues,
  handleSubmit,
  selectedSupplierTag,
  setFileData,
  setIsSendMail,
  getItemsForSupplier,
  vesselInfo,
  pdfHeader,
  setPdfFileData,
  handleLanguageChange,
}: MailSenderModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentMailDataList, setCurrentMailDataList] = useState(mailDataList);
  const [activeTabIndex, setActiveTabIndex] = useState("0");
  const [selectedMailIndexes, setSelectedMailIndexes] = useState<Set<number>>(
    new Set()
  );
  const [uploadFile, setUploadFile] = useState<File[]>([]);

  const navigate = useNavigate();

  const filteredSupplierTags = selectedSupplierTag.filter((_, index) =>
    selectedMailIndexes.has(index)
  );

  useEffect(() => {
    // 기존 폼 데이터 초기화
    form.resetFields();

    // 새로운 데이터로 폼 설정
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

  const handleTabChange = (key: string) => {
    setActiveTabIndex(key);
  };

  const handleSelectAllChange = (e: CheckboxChangeEvent) => {
    if (e.target.checked) {
      setSelectedMailIndexes(
        new Set(currentMailDataList.map((_, index) => index))
      );
    } else {
      setSelectedMailIndexes(new Set());
    }
  };

  const handleMailSelectionChange = (index: number, checked: boolean) => {
    setSelectedMailIndexes((prev) => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(index);
      } else {
        newSelection.delete(index);
      }
      return newSelection;
    });
  };

  const onFinish = async (values: any) => {
    if (selectedMailIndexes.size === 0) {
      return message.error("There is no selected mail destination");
    }
    setLoading(true);
    setIsSendMail(true);

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
      const savedInquiryId = await handleSubmit(); // inquiryId 반환받기
      const inquiryId: number | null = savedInquiryId as number | null;

      if (inquiryId || mode === "addSupplier") {
        for (const index of Array.from(selectedMailIndexes)) {
          const updatedFileData = [...uploadFile];
          setFileData(updatedFileData);

          const pdfFiles = await generatePDFs(
            filteredSupplierTags,
            inquiryFormValues,
            getItemsForSupplier,
            vesselInfo,
            pdfHeader,
            setPdfFileData,
            index
          );

          if (!pdfFiles || pdfFiles.length === 0) {
            throw new Error("Failed to generate PDF files");
          }

          const currentFormData = {
            toRecipient: values.mails[index].toRecipient,
            subject: values.mails[index].subject,
            content: values.mails[index].content,
            ccRecipient: values.mails[index].ccRecipient,
            bccRecipient: values.mails[index].bccRecipient,
            supplierName: selectedSupplierTag[index]?.name || "",
            supplierId: selectedSupplierTag[index]?.id,
          };

          const finalFileData = [...updatedFileData, ...pdfFiles];
          setFileData(finalFileData);

          await sendInquiryMail(
            mode,
            values.docNumber,
            inquiryId,
            finalFileData,
            [currentFormData]
          );
        }
        message.success("The selected email has been sent successfully!");
        navigate("/supplierInquirylist");
      } else {
        message.error("Save failed.");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error sending email:", error);
        if (error.message === "Failed to generate PDF files") {
          message.error("Failed to generate PDF files. Please try again.");
        } else if (error.message === "404") {
          message.error("PLEASE CHECK YOUR ATTACHED FILE");
        } else {
          message.error("Email sending failed. Please try again.");
        }
      } else {
        console.error("Unknown error:", error);
        message.error("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
      modal.destroy();
    }
  };

  const handleFileUpload = (file: any) => {
    setUploadFile((prevFileData: any) => [...prevFileData, file]);
  };

  const handleFileRemove = (fileIndex: number) => {
    setUploadFile((prevFileData) => {
      // 파일 목록에서 선택된 파일을 제거
      const updatedFileData = prevFileData.filter(
        (_, index) => index !== fileIndex
      );
      return updatedFileData;
    });
  };

  const tabsItems = currentMailDataList.map((mailData, index) => ({
    key: index.toString(),
    label: `${selectedSupplierTag[index]?.name || ` ${index + 1}`}`,
    children: (
      <StyledCard>
        <div style={{ display: "flex", gap: 20 }}>
          <StyledFormItem
            style={{ width: "30%" }}
            name={["mails", index, "toRecipient"]}
            rules={[{ required: true, message: "Please enter the recipient" }]}
            label="Recipient"
          >
            <Input prefix={<MailOutlined />} placeholder="Recipient" />
          </StyledFormItem>
          <StyledFormItem
            style={{ width: "50%" }}
            name={["mails", index, "subject"]}
            rules={[{ required: true, message: "Please enter a title." }]}
            label="Title"
          >
            <Input placeholder="Title" />
          </StyledFormItem>
          <StyledFormItem
            style={{ width: "20%" }}
            rules={[{ required: true, message: "Please select a language." }]}
            label="Language"
          >
            <Select
              value={selectedSupplierTag[index]?.communicationLanguage}
              onChange={(value) =>
                handleLanguageChange(value, selectedSupplierTag[index]?.id)
              }
            >
              <Select.Option value="KOR">KOR</Select.Option>
              <Select.Option value="ENG">ENG</Select.Option>
            </Select>
          </StyledFormItem>
        </div>
        <StyledFormItem
          name={["mails", index, "content"]}
          rules={[{ required: true, message: "Please enter the contents." }]}
        >
          <TextArea style={{ height: 300 }} placeholder="Content" rows={6} />
        </StyledFormItem>
        <div style={{ display: "flex", gap: 20 }}>
          <StyledFormItem
            style={{ width: "50%" }}
            name={["mails", index, "ccRecipient"]}
            label="ccRecipient"
          >
            <Input placeholder="CC Recipient" />
          </StyledFormItem>
        </div>
      </StyledCard>
    ),
  }));

  return (
    <>
      {loading && <BlockingLayer />}
      <StyledForm form={form} onFinish={onFinish}>
        <FormRow style={{ marginBottom: 0 }}>
          <StyledFormItem
            name="docNumber"
            label="DocNumber"
            initialValue={inquiryFormValues.docNumber}
            style={{ flex: 0.8 }}
          >
            <Input disabled placeholder="문서 번호" />
          </StyledFormItem>
          <StyledFormItem
            name="refNumber"
            label="REF NO."
            initialValue={inquiryFormValues.refNumber}
            style={{ flex: 1 }}
          >
            <Input disabled placeholder="REF NO." />
          </StyledFormItem>
        </FormRow>
        <FormRow>
          <StyledFormItem
            name="customer"
            label="Customer"
            initialValue={inquiryFormValues.customer}
            style={{ flex: 1 }}
          >
            <Input disabled placeholder="customer" />
          </StyledFormItem>
          <StyledFormItem
            name="vesselName"
            label="Vessel Name"
            initialValue={inquiryFormValues.vesselName}
            style={{ flex: 0.8 }}
          >
            <Input disabled placeholder="vesselName" />
          </StyledFormItem>
        </FormRow>
        {selectedSupplierTag.length === 0 ? (
          <Typography.Paragraph
            style={{ textAlign: "center", padding: 20, color: "red" }}
          >
            No Supplier selected!
          </Typography.Paragraph>
        ) : (
          <Tabs
            defaultActiveKey="0"
            type="card"
            onChange={handleTabChange}
            items={tabsItems}
          />
        )}

        <div>
          <span style={{ marginRight: 10, fontWeight: 700 }}>
            Email destination:
          </span>
          <Checkbox
            checked={currentMailDataList.length === selectedMailIndexes.size}
            indeterminate={
              selectedMailIndexes.size > 0 &&
              selectedMailIndexes.size < currentMailDataList.length
            }
            onChange={handleSelectAllChange}
            style={{ marginRight: 20 }}
          >
            All
          </Checkbox>
          {currentMailDataList.map((_, index) => (
            <Checkbox
              key={index}
              checked={selectedMailIndexes.has(index)}
              onChange={(e: CheckboxChangeEvent) =>
                handleMailSelectionChange(index, e.target.checked)
              }
            >
              {selectedSupplierTag[index]?.name || ` ${index + 1}`}
            </Checkbox>
          ))}
        </div>
        <StyledFormItem>
          <Title level={5}>
            Attached File
            <span style={{ fontSize: 12 }}>
              (PDF files are automatically attached)
            </span>
          </Title>
          <Upload.Dragger
            customRequest={({ file }) => handleFileUpload(file)}
            showUploadList={false}
            multiple={true} // 여러 파일 업로드 가능
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              Drag and drop files here or click to upload
            </p>
          </Upload.Dragger>
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

export default MailSenderModal;
