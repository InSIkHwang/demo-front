import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Button,
  AutoComplete,
  ColorPickerProps,
  ColorPicker,
  Col,
  Divider,
  theme,
  Row,
} from "antd";
import { presetPalettes } from "@ant-design/colors";
import styled from "styled-components";
import { FormValuesType, VesselList } from "../../types/types";
import { chkDuplicateRefNum, fetchCompanyNames } from "../../api/api";
import CreateCompanyModal from "../company/CreateCompanyModal";
import { debounce } from "lodash";
import CreateVesselModal from "../vessel/CreateVesselModal";
import { Color } from "antd/es/color-picker";

const { Option } = Select;

type Presets = Required<ColorPickerProps>["presets"][number];

const customPresets = {
  rainbow: [
    "#FF3333",
    "#FFA366",
    "#FFFF99",
    "#66FF66",
    "#6699FF",
    "#9966CC",
    "#CC99FF",
  ],
  pastel: [
    "#FFB3BA",
    "#BAFFC9",
    "#BAE1FF",
    "#FFFFBA",
    "#FFB3F7",
    "#B3FFF7",
    "#C4C4C4",
  ],
};

const genPresets = (presets = presetPalettes) =>
  Object.entries(presets).map<Presets>(([label, colors]) => ({
    label,
    colors,
  }));

const StyledRow = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

const FormItem = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

interface ColorPickerComponentProps {
  onChange: (color: string) => void;
  defaultValue?: string;
}

const ColorPickerComponent = ({
  onChange,
  defaultValue,
}: ColorPickerComponentProps) => {
  const { token } = theme.useToken();

  const presets = genPresets(customPresets);

  const customPanelRender: ColorPickerProps["panelRender"] = (
    _,
    { components: { Picker, Presets } }
  ) => (
    <Row justify="space-between" wrap={false}>
      <Col span={12}>
        <Presets />
      </Col>
      <Divider type="vertical" style={{ height: "auto" }} />
      <Col flex="auto">
        <Picker />
      </Col>
    </Row>
  );

  const handleColorChange = (value: Color) => {
    onChange(value.toHexString());
  };

  return (
    <ColorPicker
      defaultValue={defaultValue || token.colorPrimary}
      styles={{ popupOverlayInner: { width: 480 } }}
      presets={presets}
      panelRender={customPanelRender}
      onChange={handleColorChange}
    />
  );
};

interface FormComponentProps {
  formValues: any;
  handleFormChange: <K extends keyof FormValuesType>(
    key: K,
    value: FormValuesType[K]
  ) => void;
  setCusVesIdList: Dispatch<
    SetStateAction<{ customerId: number | null; vesselId: number | null }>
  >;
  cusVesIdList: { customerId: number | null; vesselId: number | null };
  offerId: number;
}

const FormComponent = ({
  formValues,
  handleFormChange,
  setCusVesIdList,
  cusVesIdList,
  offerId,
}: FormComponentProps) => {
  const [form] = Form.useForm();
  const [companyNameList, setCompanyNameList] = useState<
    { companyName: string; code: string }[]
  >([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [vesselList, setVesselList] = useState<VesselList[]>([]);
  const [vesselNameList, setVesselNameList] = useState<
    { id: number; name: string; imoNumber: number }[]
  >([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<VesselList | null>(null);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<
    { value: string }[]
  >([]);
  const [isRefNumDuplicate, setIsRefNumDuplicate] = useState<boolean>(false);

  useEffect(() => {
    if (selectedCustomerId && selectedVessel) {
      setCusVesIdList({
        customerId: selectedCustomerId,
        vesselId: selectedVessel.id,
      });
    }
  }, [selectedCustomerId, selectedVessel, setCusVesIdList]);

  useEffect(() => {
    const searchTerm = formValues.companyName?.toLowerCase();

    const filteredOptions = companyNameList
      .filter(
        (item) =>
          item.companyName?.toLowerCase().includes(searchTerm) ||
          item.code?.toLowerCase().includes(searchTerm)
      )
      .map((item) => item.companyName) // 배열의 값만 가져옴
      .filter((value, index, self) => self.indexOf(value) === index) // 중복 제거

      .map((item) => ({ value: item })); // 객체 형태로 변환

    setAutoCompleteOptions(filteredOptions);
  }, [companyNameList, formValues.companyName]);

  useEffect(() => {
    const searchCompanyName = async (companyName: string) => {
      try {
        const { isExist, customerDetailResponse } = await fetchCompanyNames(
          companyName
        );
        if (isExist) {
          setCompanyNameList(
            customerDetailResponse.map((c) => ({
              companyName: c.companyName,
              code: c.code,
            }))
          );

          const selectedCustomer = customerDetailResponse.find(
            (c) => c.companyName === companyName || c.code === companyName
          );
          if (selectedCustomer) {
            setSelectedCustomerId(selectedCustomer.id);
            setVesselNameList(
              selectedCustomer.vesselList.map((v) => ({
                id: v.id,
                name: v.vesselName,
                imoNumber: v.imoNumber,
              }))
            );
            setVesselList(selectedCustomer.vesselList);
          } else {
            setSelectedCustomerId(null);
            setVesselNameList([]);
            setVesselList([]);
          }
        } else {
          setCompanyNameList([]);
          setSelectedCustomerId(null);
          setVesselNameList([]);
          setVesselList([]);
        }
      } catch (error) {
        console.error("Error fetching company name:", error);
      }
    };

    const debouncedSearchCompanyName = debounce((companyName: string) => {
      if ((companyName + "").trim() !== "") {
        searchCompanyName(companyName);
      } else {
        setCompanyNameList([]);
        setSelectedCustomerId(null);
        setVesselNameList([]);
        setVesselList([]);
      }
    }, 500);

    debouncedSearchCompanyName(formValues.companyName);

    return () => {
      debouncedSearchCompanyName.cancel();
    };
  }, [formValues.companyName, isCustomerModalOpen, isVesselModalOpen]);

  useEffect(() => {
    const selectedVessel = vesselList.find(
      (v) => v.vesselName === formValues.vesselName
    );

    setSelectedVessel(selectedVessel ?? null);
  }, [formValues.vesselName, formValues.companyName, vesselList]);

  const validateCustomer = () => {
    if (!cusVesIdList.customerId) {
      return {
        status: (formValues.companyName + "").trim() === "" ? "error" : "error",
        message:
          (formValues.companyName + "").trim() === ""
            ? "Please enter a customer"
            : "This is an unregistered customer",
      };
    }
    return { status: undefined, message: undefined };
  };

  const validateVessel = () => {
    if (!cusVesIdList.vesselId || !selectedVessel) {
      return {
        status: (formValues.vesselName + "").trim() === "" ? "error" : "error",
        message:
          (formValues.vesselName + "").trim() === ""
            ? "Please enter a vessel"
            : "This is an unregistered vessel",
      };
    }
    return { status: undefined, message: undefined };
  };

  return (
    <>
      <Form form={form} layout="vertical" initialValues={formValues}>
        <StyledRow>
          <FormItem
            label="문서번호(Document No.)"
            name="documentNumber"
            rules={[{ required: true, message: "Please write Document No." }]}
            normalize={(value) => value.trim()} // 입력값을 트리밍하여 저장
            style={{ maxWidth: 350 }}
          >
            <Input
              value={formValues.docNumber}
              style={{ cursor: "default" }}
              onChange={(e) => {
                const newValue = e.target.value.trim();
                handleFormChange("documentNumber", newValue); // 그냥 newValue로 설정
              }}
              disabled
            />
          </FormItem>
          <FormItem
            label="Ref No."
            name="refNumber"
            rules={[{ required: true, message: "Please enter ref number" }]}
            validateStatus={
              !formValues.refNumber
                ? "error"
                : isRefNumDuplicate
                ? "error"
                : undefined
            } // 비어있거나 중복일 때 오류 상태 설정
            help={
              !formValues.refNumber
                ? "Please enter ref number"
                : isRefNumDuplicate
                ? "The Ref number is duplicated."
                : undefined
            }
            style={{ maxWidth: 350 }}
          >
            <Input
              value={formValues.refNumber}
              onChange={(e) => handleFormChange("refNumber", e.target.value)}
              onBlur={async (e) => {
                const refNumber = e.target.value.trim();
                const isDuplicate = await chkDuplicateRefNum(
                  refNumber,
                  offerId
                );
                setIsRefNumDuplicate(isDuplicate); // 중복 여부 설정
              }}
            />
          </FormItem>

          <FormItem
            label="작성일자(Register Date)"
            name="registerDate"
            rules={[{ required: true, message: "Please select register date" }]}
            style={{ width: 140 }}
          >
            <DatePicker
              value={formValues.registerDate}
              onChange={(date) => handleFormChange("registerDate", date!)}
              format="YYYY-MM-DD"
              style={{ width: "100%" }}
            />
          </FormItem>
          <FormItem
            label="화폐(Currency)"
            name="currencyType"
            rules={[{ required: true, message: "Please select currency type" }]}
          >
            <Select
              value={formValues.currencyType}
              onChange={(value) => {
                handleFormChange("currencyType", value);
                let currency = 0;
                if (value === "USD") {
                  currency = 1050;
                } else if (value === "EUR") {
                  currency = 1150;
                } else if (value === "INR") {
                  currency = 14;
                }

                handleFormChange("currency", currency);

                // form 필드 동기화
                form.setFieldsValue({ currency: currency });
              }}
            >
              {["USD", "EUR", "INR"].map((currencyType) => (
                <Option key={currencyType} value={currencyType}>
                  {currencyType}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            label="환율(Exchange Rate)"
            name="currency"
            rules={[
              {
                required: true,
                message: "Please enter currency exchange rate",
              },
            ]}
          >
            <InputNumber
              value={formValues.currency}
              onChange={(value) =>
                handleFormChange("currency", parseFloat(value))
              }
              min={0}
              style={{ width: "100%" }}
            />
          </FormItem>
        </StyledRow>

        <StyledRow>
          <FormItem
            label="매출처(Customer)"
            name="companyName"
            validateStatus={
              validateCustomer().status as
                | ""
                | "error"
                | "success"
                | "warning"
                | "validating"
                | undefined
            }
            help={validateCustomer().message}
            rules={[{ required: true, message: "Please enter customer" }]}
          >
            <Button
              type="primary"
              style={{ position: "absolute", top: "-35px", right: "0" }}
              onClick={() => setIsCustomerModalOpen(true)}
            >
              Register
            </Button>
            <AutoComplete
              value={formValues.companyName}
              onChange={(value) => handleFormChange("companyName", value)}
              options={autoCompleteOptions}
              style={{ width: "100%" }}
            >
              <Input />
            </AutoComplete>
          </FormItem>
          <FormItem
            label="선명(Vessel Name)"
            name="vesselName"
            validateStatus={
              validateVessel().status as
                | ""
                | "error"
                | "success"
                | "warning"
                | "validating"
                | undefined
            }
            help={validateVessel().message}
            rules={[{ required: true, message: "Please enter vessel name" }]}
          >
            <Button
              type="primary"
              style={{ position: "absolute", top: "-35px", right: "0" }}
              onClick={() => setIsVesselModalOpen(true)}
            >
              Register
            </Button>
            <AutoComplete
              value={formValues.vesselName}
              onChange={(value, option) => {
                handleFormChange("vesselName", value);
              }}
              options={vesselNameList.map((vessel) => ({
                label: vessel.imoNumber
                  ? `${vessel.name} (IMO No.: ${vessel.imoNumber})`
                  : `${vessel.name} (IMO No.: None)`, // 표시용 텍스트
                value: vessel.name, // 실제로 선택되는 값은 vessel.name
                key: vessel.id, // 각 항목의 고유 ID
              }))}
              style={{ width: "100%" }}
              filterOption={(inputValue, option) =>
                option!.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            >
              <Input />
            </AutoComplete>
          </FormItem>
          <FormItem label="IMO NO." name="imoNo">
            <Input
              value={formValues.imoNo}
              onChange={(e) =>
                handleFormChange("imoNo", Number(e.target.value))
              }
            />
          </FormItem>
          <FormItem label="HULL NO." name="veeselHullNo">
            <Input
              value={formValues.vesselHullNo}
              onChange={(e) => handleFormChange("vesselHullNo", e.target.value)}
            />
          </FormItem>
        </StyledRow>
        <StyledRow>
          <FormItem
            label="담당자(Document Manager)"
            name="docManager"
            style={{ flex: 1 }}
          >
            <Input disabled />
          </FormItem>
          <FormItem
            label="문서상태(Document Status)"
            name="documentStatus"
            style={{ flex: 1 }}
          >
            <Input disabled />
          </FormItem>
          <FormItem label="색상(Color)" name="color" style={{ flex: 0.5 }}>
            <div style={{ width: "100%", display: "flex" }}>
              <ColorPickerComponent
                onChange={(color) => handleFormChange("color", color)}
                defaultValue={formValues.color || "#fff"}
              />
              <Input
                style={{ marginLeft: "10px" }}
                value={formValues.color || "#fff"}
                readOnly
              />
            </div>
          </FormItem>
          <FormItem label="비고(Remark)" name="docRemark" style={{ flex: 1.5 }}>
            <Input.TextArea
              value={formValues.docRemark}
              onChange={(e) => handleFormChange("docRemark", e.target.value)}
              rows={1}
            />
          </FormItem>
        </StyledRow>
      </Form>
      {isCustomerModalOpen && (
        <CreateCompanyModal
          category={"customer"}
          onClose={() => setIsCustomerModalOpen(false)}
          onUpdate={() => setIsCustomerModalOpen(false)}
        />
      )}
      {isVesselModalOpen && (
        <CreateVesselModal
          onClose={() => setIsVesselModalOpen(false)}
          onUpdate={() => setIsVesselModalOpen(false)}
        />
      )}
    </>
  );
};

export default FormComponent;
