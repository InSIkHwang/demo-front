import { Button, Select } from "antd";
import { Modal } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useEffect, useState } from "react";

const POHeaderEditModal = ({
  visible,
  onClose,
  pdfPOHeader,
  pdfPOFooter,
  setPdfPOHeader,
  setPdfPOFooter,
  language,
  setLanguage,
}: {
  visible: boolean;
  onClose: () => void;
  pdfPOHeader: string;
  pdfPOFooter: string;
  setPdfPOHeader: (value: string) => void;
  setPdfPOFooter: (value: string) => void;
  language: string;
  setLanguage: (value: string) => void;
}) => {
  const [tempHeader, setTempHeader] = useState(pdfPOHeader);
  const [tempFooter, setTempFooter] = useState(pdfPOFooter);

  const handleSave = () => {
    setPdfPOHeader(tempHeader);
    setPdfPOFooter(tempFooter);
    onClose();
  };

  const handleReset = () => {
    if (language === "KOR") {
      setTempHeader(
        "1. 귀사의 무궁한 발전을 기원합니다.\n2. 하기와 같이 발주하오니 업무에 참조하시기 바랍니다."
      );
      setTempFooter(
        "1. 세금 계산서 - 법인\n2. 희망 납기일 - \n3. 예정 납기일 포함된 발주서 접수 회신 메일 부탁 드립니다. 감사합니다."
      );
    } else {
      setTempHeader("EXPECTED DELIVERY DATE : ");
      setTempFooter("");
    }
  };

  useEffect(() => {
    setTempHeader(pdfPOHeader);
    setTempFooter(pdfPOFooter);
  }, [pdfPOHeader, pdfPOFooter]);

  return (
    <Modal
      title={"Edit Header/Footer"}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="reset" onClick={handleReset}>
          Reset
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSave}>
          Save
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 20 }}>
        <Select
          value={language}
          onChange={(value) => setLanguage(value)}
          options={[
            { value: "KOR", label: "KOR" },
            { value: "ENG", label: "ENG" },
          ]}
        />
        <div style={{ marginBottom: 10 }}>Header Content:</div>
        <TextArea
          value={tempHeader}
          onChange={(e) => setTempHeader(e.target.value)}
          rows={4}
          style={{ marginBottom: 20 }}
        />
        <div style={{ marginBottom: 10 }}>Footer Content:</div>
        <TextArea
          value={tempFooter}
          onChange={(e) => setTempFooter(e.target.value)}
          rows={4}
        />
      </div>
    </Modal>
  );
};

export default POHeaderEditModal;
