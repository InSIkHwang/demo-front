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
  List,
  Tag,
} from "antd";
import { SendOutlined, MailOutlined } from "@ant-design/icons";
import { UploadOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { sendInquiryMail } from "../../api/api";
import { emailSendData } from "../../types/types";
import dayjs from "dayjs";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { useNavigate } from "react-router-dom";

const { TextArea } = Input;
const { Title } = Typography;

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

const MailSenderModal = ({
  mailDataList,
  inquiryFormValues,
  handleSubmit,
  setIsMailSenderVisible,
  selectedSupplierTag,
  fileData,
  setFileData,
  pdfFileData,
}: {
  mailDataList: emailSendData[];
  inquiryFormValues: FormValue;
  handleSubmit: () => Promise<unknown>;
  setIsMailSenderVisible: Dispatch<SetStateAction<boolean>>;
  selectedSupplierTag: {
    id: number;
    name: string;
    code: string;
    email: string;
  }[];
  fileData: File[];
  setFileData: Dispatch<SetStateAction<File[]>>;
  pdfFileData: File[];
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentMailDataList, setCurrentMailDataList] = useState(mailDataList);
  const [activeTabIndex, setActiveTabIndex] = useState("0");
  const [selectedMailIndexes, setSelectedMailIndexes] = useState<Set<number>>(
    new Set()
  );
  const [isPdfAutoUploadChecked, setIsPdfAutoUploadChecked] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isPdfAutoUploadChecked) {
      setFileData((prevFileData) => [...prevFileData, ...pdfFileData]);
    }
  }, [isPdfAutoUploadChecked, pdfFileData, setFileData]);

  const handlePdfAutoUploadChange = (e: CheckboxChangeEvent) => {
    setIsPdfAutoUploadChecked(e.target.checked);
    if (e.target.checked) {
      // PDF 파일 자동 업로드 활성화
      setFileData((prevFileData) => [...prevFileData, ...pdfFileData]);
    } else {
      // PDF 파일 자동 업로드 비활성화
      setFileData((prevFileData) =>
        prevFileData.filter(
          (file) => !pdfFileData.some((pdfFile) => pdfFile.name === file.name)
        )
      );
    }
  };

  const filteredFileData = fileData.filter((file) => {
    return !selectedSupplierTag.some(
      (tag) =>
        file.name.startsWith(
          `${tag.name} REQUEST FOR QUOTATION ${inquiryFormValues.refNumber}.pdf`
        ) ||
        file.name.startsWith(
          `${tag.name} 견적의뢰서 ${inquiryFormValues.refNumber}.pdf`
        )
    );
  });

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

    try {
      const submitSuccess = await handleSubmit();

      if (submitSuccess) {
        // 선택된 의뢰처의 메일 데이터만 필터링
        const mailDataToSend = Array.from(selectedMailIndexes).map((index) => ({
          ...currentMailDataList[index],
          ...values.mails[index],
        }));

        // `fileData`와 함께 `sendInquiryMail` 호출
        await sendInquiryMail(values.docNumber, fileData, mailDataToSend);

        message.success("The selected email has been sent successfully!");
        navigate("/");
      } else {
        message.error("Save failed.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      message.error("Email sending failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: any, index: number) => {
    const fileDataItem = file;

    // `fileData` 배열에 파일 추가
    setFileData((prevFileData: any) => [...prevFileData, fileDataItem]);

    return false;
  };

  const handleFileRemove = (fileIndex: number) => {
    setFileData((prevFileData) => {
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
        <StyledFormItem
          name={["mails", index, "toRecipient"]}
          rules={[{ required: true, message: "Please enter the recipient" }]}
        >
          <Input prefix={<MailOutlined />} placeholder="Recipient" />
        </StyledFormItem>
        <StyledFormItem
          name={["mails", index, "subject"]}
          rules={[{ required: true, message: "Please enter a title." }]}
        >
          <Input placeholder="Title" />
        </StyledFormItem>
        <StyledFormItem
          name={["mails", index, "content"]}
          rules={[{ required: true, message: "Please enter the contents." }]}
        >
          <TextArea placeholder="Content" rows={6} />
        </StyledFormItem>
        <StyledFormItem name={["mails", index, "ccRecipient"]}>
          <Input placeholder="CC Recipient" />
        </StyledFormItem>
        <StyledFormItem name={["mails", index, "bccRecipient"]}>
          <Input placeholder="BCC Recipient" />
        </StyledFormItem>
        <StyledFormItem>
          <Title level={5}>Attached File</Title>
          <Upload
            customRequest={({ file }) => handleFileUpload(file, index)}
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
          {fileData.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              {filteredFileData.map((file, fileIndex) => (
                <Tag
                  key={fileIndex}
                  closable
                  onClose={() => handleFileRemove(fileIndex)}
                  style={{ marginBottom: "8px" }}
                >
                  {file.name}
                </Tag>
              ))}
            </div>
          )}
        </StyledFormItem>
      </StyledCard>
    ),
  }));

  return (
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
          No customer selected!
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
        <span style={{ marginRight: 10 }}>Email destination:</span>
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

export default MailSenderModal;
