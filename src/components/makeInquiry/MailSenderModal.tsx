import React, { useState, useEffect } from "react";
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
import { SendOutlined, MailOutlined, WarningOutlined } from "@ant-design/icons";
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

// 스타일 컴포넌트 추가
const ValidationMessage = styled.div`
  padding: 16px;
  margin: 16px 0;
  border-radius: 8px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #cf1322;

  .title {
    font-weight: bold;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .missing-items {
    padding-left: 24px;
  }

  .supplier-item {
    margin-bottom: 4px;
  }
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
  getItemsForSupplier: (supplierId: number) => InquiryItem[];
  vesselInfo: VesselList | null;
  pdfHeader: string;
  handleLanguageChange: (value: string, id: number) => void;
  isMailSenderVisible: boolean;
}

const MailSenderModal = ({
  mode,
  mailDataList,
  inquiryFormValues,
  handleSubmit,
  selectedSupplierTag,
  getItemsForSupplier,
  vesselInfo,
  pdfHeader,
  handleLanguageChange,
  isMailSenderVisible,
}: MailSenderModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentMailDataList, setCurrentMailDataList] = useState(mailDataList);
  const [selectedMailIndexes, setSelectedMailIndexes] = useState<Set<number>>(
    new Set()
  );
  const [uploadFile, setUploadFile] = useState<File[]>([]);
  const [missingFieldsState, setMissingFieldsState] = useState<{
    [key: string]: string[];
  } | null>(null);

  const navigate = useNavigate();

  const formValues = Form.useWatch([], form);

  useEffect(() => {
    if (isMailSenderVisible && selectedSupplierTag.length > 0) {
      // 모든 탭의 초기값을 설정
      const initialValues = {
        docNumber: inquiryFormValues.docNumber,
        refNumber: inquiryFormValues.refNumber,
        customer: inquiryFormValues.customer,
        vesselName: inquiryFormValues.vesselName,
        mails: selectedSupplierTag.map((supplier, index) => ({
          toRecipient: mailDataList[index]?.toRecipient || supplier.email || "",
          subject: mailDataList[index]?.subject || "",
          content: mailDataList[index]?.content || "",
          ccRecipient: mailDataList[index]?.ccRecipient || "",
          bccRecipient: mailDataList[index]?.bccRecipient || "",
          communicationLanguage: supplier.communicationLanguage || "",
        })),
      };

      // 폼 초기화
      form.setFieldsValue(initialValues);

      // 모든 탭의 필드를 한 번에 터치하여 유효성 검사 트리거
      selectedSupplierTag.forEach((_, index) => {
        form
          .validateFields([
            ["mails", index, "toRecipient"],
            ["mails", index, "subject"],
            ["mails", index, "content"],
          ])
          .catch(() => {
            // 유효성 검사 실패는 무시 - validateAndUpdateFields에서 처리됨
          });
      });

      setCurrentMailDataList(mailDataList);
    }
  }, [isMailSenderVisible, selectedSupplierTag, mailDataList]);

  const validateAndUpdateFields = () => {
    const currentValues = form.getFieldsValue();
    const missingFields: { [key: string]: string[] } = {};

    selectedSupplierTag.forEach((supplier, index) => {
      const supplierName = supplier?.name || `Supplier ${index + 1}`;
      const missing: string[] = [];
      const currentMail = currentValues.mails?.[index];
      const mailListData = mailDataList[index];

      if (
        !currentMail?.toRecipient &&
        !mailListData?.toRecipient &&
        !supplier.email
      ) {
        missing.push("Recipient email");
      }

      if (!currentMail?.subject && !mailListData?.subject) {
        missing.push("Email title");
      }

      if (!currentMail?.content && !mailListData?.content) {
        missing.push("Email content");
      }

      if (!supplier.communicationLanguage) {
        missing.push("Language");
      }

      if (missing.length > 0) {
        missingFields[supplierName] = missing;
      }
    });

    setMissingFieldsState(
      Object.keys(missingFields).length > 0 ? missingFields : null
    );
  };

  useEffect(() => {
    validateAndUpdateFields();
  }, [formValues, selectedSupplierTag]);

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
        const results = [];
        const selectedSuppliers = Array.from(selectedMailIndexes).map(
          (index) => selectedSupplierTag[index]
        );
        for (let i = 0; i < selectedSuppliers.length; i++) {
          console.log(`Processing email ${i + 1}/${selectedSuppliers.length}`);
          const updatedFileData = [...uploadFile];
          const currentSupplier = selectedSuppliers[i];
          console.log(currentSupplier, "currentSupplier");

          const pdfFiles = await generatePDFs(
            [currentSupplier],
            inquiryFormValues,
            getItemsForSupplier,
            vesselInfo,
            pdfHeader
          );

          if (!pdfFiles || pdfFiles.length === 0) {
            throw new Error("Failed to generate PDF files");
          }

          const currentFormData = {
            toRecipient:
              values.mails?.[i]?.toRecipient ||
              currentMailDataList[i]?.toRecipient ||
              selectedSuppliers[i]?.email ||
              "",
            subject:
              values.mails?.[i]?.subject ||
              currentMailDataList[i]?.subject ||
              "",
            content:
              values.mails?.[i]?.content ||
              currentMailDataList[i]?.content ||
              "",
            ccRecipient:
              values.mails?.[i]?.ccRecipient ||
              currentMailDataList[i]?.ccRecipient ||
              "",
            bccRecipient: values.mails?.[i]?.bccRecipient || "",
            supplierName: selectedSuppliers[i]?.name || "",
            supplierId: selectedSuppliers[i]?.id,
          };

          console.log(currentFormData, "currentFormData");

          // 유효성 검사 실행
          if (!validateFormData(currentFormData, i)) {
            throw new Error("Required input fields are missing.");
          }

          const finalFileData = [...updatedFileData, ...pdfFiles];

          await sendInquiryMail(
            mode,
            values.docNumber,
            inquiryId,
            finalFileData,
            [currentFormData]
          );
          results.push({ i, success: true });
        }

        // 모든 이메일 전송 결과 확인
        const allSuccess = results.every((r) => r.success);
        if (allSuccess) {
          message.success("All emails sent successfully!");
          navigate("/supplierInquirylist");
        } else {
          message.warning(
            "Some emails failed to send. Please check the console for details."
          );
        }
      } else {
        message.error("Save failed.");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Detailed error information:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });

        if (error.message === "Failed to generate PDF files") {
          message.error("Failed to generate PDF files. Please try again.");
        } else if (error.message === "404") {
          message.error("PLEASE CHECK YOUR ATTACHED FILE");
        } else {
          // 구체적인 에러 메시지 표시
          console.log("values(error)", values);

          message.error(`Email sending failed: ${error.message}`);
        }
      } else {
        console.error("Unknown error details:", error);
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

  const validateFormData = (data: any, index: number) => {
    let isValid = true;

    if (!data.toRecipient || data.toRecipient.trim() === "") {
      message.error(
        `Recipient email is missing for ${
          selectedSupplierTag[index]?.name || `${index + 1}th supplier`
        }.`
      );
      isValid = false;
    }

    if (!data.subject || data.subject.trim() === "") {
      message.error(
        `Email title is missing for ${
          selectedSupplierTag[index]?.name || `${index + 1}th supplier`
        }.`
      );
      isValid = false;
    }

    if (!data.content || data.content.trim() === "") {
      message.error(
        `Email content is missing for ${
          selectedSupplierTag[index]?.name || `${index + 1}th supplier`
        }.`
      );
      isValid = false;
    }

    if (!data.supplierName) {
      message.error(`Supplier information is missing for ${index + 1}th item.`);
      isValid = false;
    }

    if (!data.supplierId) {
      message.error(`Supplier ID is missing for ${index + 1}th item.`);
      isValid = false;
    }

    return isValid;
  };

  useEffect(() => {
    if (!isMailSenderVisible) {
      setMissingFieldsState(null);
      setSelectedMailIndexes(new Set());
    }
  }, [isMailSenderVisible]);

  if (!isMailSenderVisible) {
    return null;
  }

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
            <Input disabled placeholder="Document Number" />
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
          <Tabs defaultActiveKey="0" type="card" items={tabsItems} />
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
            multiple={true} // 여러 파 업로드 가능
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
        {missingFieldsState && (
          <ValidationMessage>
            <div className="title">
              <WarningOutlined />
              Missing Required Information
            </div>
            <div className="missing-items">
              {Object.entries(missingFieldsState).map(([supplier, fields]) => (
                <div key={supplier} className="supplier-item">
                  • {supplier}: {fields.join(", ")}
                </div>
              ))}
            </div>
          </ValidationMessage>
        )}
        <StyledButton
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<SendOutlined />}
          size="large"
          block
          disabled={!!missingFieldsState || selectedMailIndexes.size === 0}
        >
          {missingFieldsState
            ? "Required information is missing"
            : "Send Email"}
        </StyledButton>
      </StyledForm>
    </>
  );
};

export default MailSenderModal;
