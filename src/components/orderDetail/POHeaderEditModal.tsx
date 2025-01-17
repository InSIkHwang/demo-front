import { Button, Select } from "antd";
import { Modal } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useEffect, useState } from "react";
import { OrderAckHeaderFormData, orderRemark } from "../../types/types";
import { parseKoreanDate } from "../orderList/DetailOrderModal";
import { parseEnglishDate } from "../orderList/DetailOrderModal";

const POHeaderEditModal = ({
  visible,
  onClose,
  pdfPOHeader,
  pdfPOFooter,
  setPdfPOHeader,
  setPdfPOFooter,
  language,
  setLanguage,
  commonSaveHeader,
}: {
  visible: boolean;
  onClose: () => void;
  pdfPOHeader: {
    orderHeaderId: number | null;
    receiverType: string;
  };
  pdfPOFooter: orderRemark;
  setPdfPOHeader: (value: {
    orderHeaderId: number | null;
    orderRemark: string;
    receiverType: string;
  }) => void;
  setPdfPOFooter: (value: orderRemark) => void;
  language: string;
  setLanguage: (value: string) => void;
  commonSaveHeader: (
    header:
      | OrderAckHeaderFormData
      | {
          orderHeaderId: number | null;
          receiverType: string;
        },
    footer: orderRemark[]
  ) => void;
}) => {
  const [tempFooter, setTempFooter] = useState(pdfPOFooter);

  const handleSave = () => {
    commonSaveHeader(pdfPOHeader, [tempFooter]);
    setPdfPOFooter(tempFooter);
    onClose();
  };

  const handleReset = () => {
    if (language === "KOR") {
      setTempFooter((prev) => ({
        orderRemarkId: prev.orderRemarkId,
        orderRemark:
          "1. 귀사의 무궁한 발전을 기원합니다.\n2. 상기와 같이 발주하오니 업무에 참조하시기 바랍니다.\n3. 세금 계산서 - 법인\n4. 희망 납기일 - 월 일 이내\n5. 예정 납기일 포함된 발주서 접수 회신 메일 부탁 드립니다. 감사합니다.",
      }));
    } else {
      setTempFooter((prev) => ({
        orderRemarkId: prev.orderRemarkId,
        orderRemark: "EXPECTED DELIVERY DATE : ",
      }));
    }
  };

  console.log(tempFooter);
  console.log(pdfPOFooter);

  useEffect(() => {
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
        <TextArea
          value={tempFooter.orderRemark}
          onChange={(e) =>
            setTempFooter({
              ...tempFooter,
              orderRemark: e.target.value,
            })
          }
          rows={8}
        />
      </div>
    </Modal>
  );
};

export default POHeaderEditModal;
