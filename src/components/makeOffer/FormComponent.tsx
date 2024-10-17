import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Button,
  AutoComplete,
} from "antd";
import styled from "styled-components";
import { FormValuesType, VesselList } from "../../types/types";
import { fetchCompanyNames } from "../../api/api";
import CreateCompanyModal from "../company/CreateCompanyModal";
import { debounce } from "lodash";
import CreateVesselModal from "../vessel/CreateVesselModal";

const { Option } = Select;

const Row = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

const FormItem = styled(Form.Item)`
  margin-bottom: 8px;
  margin-right: 10px;
  flex: auto;
`;

interface FormComponentProps {
  formValues: any;
  readOnly?: boolean; // readOnly prop 추가
  handleFormChange: <K extends keyof FormValuesType>(
    key: K,
    value: FormValuesType[K]
  ) => void;
  setCusVesIdList: Dispatch<
    SetStateAction<{ customerId: number | null; vesselId: number | null }>
  >;
  cusVesIdList: { customerId: number | null; vesselId: number | null };
}

const FormComponent = ({
  formValues,
  readOnly,
  handleFormChange,
  setCusVesIdList,
  cusVesIdList,
}: FormComponentProps) => {
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

  useEffect(() => {
    if (selectedCustomerId && selectedVessel) {
      setCusVesIdList({
        customerId: selectedCustomerId,
        vesselId: selectedVessel.id,
      });
    }
  }, [selectedCustomerId, selectedVessel, setCusVesIdList]);

  useEffect(() => {
    const searchTerm = formValues.customerName?.toLowerCase();

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
  }, [companyNameList, formValues.customerName]);

  useEffect(() => {
    const searchCompanyName = async (customerName: string) => {
      try {
        const { isExist, customerDetailResponse } = await fetchCompanyNames(
          customerName
        );
        if (isExist) {
          setCompanyNameList(
            customerDetailResponse.map((c) => ({
              companyName: c.companyName,
              code: c.code,
            }))
          );

          const selectedCustomer = customerDetailResponse.find(
            (c) => c.companyName === customerName || c.code === customerName
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

    const debouncedSearchCompanyName = debounce((customerName: string) => {
      if ((customerName + "").trim() !== "") {
        searchCompanyName(customerName);
      } else {
        setCompanyNameList([]);
        setSelectedCustomerId(null);
        setVesselNameList([]);
        setVesselList([]);
      }
    }, 500);

    debouncedSearchCompanyName(formValues.customerName);

    return () => {
      debouncedSearchCompanyName.cancel();
    };
  }, [formValues.customerName, isCustomerModalOpen, isVesselModalOpen]);

  useEffect(() => {
    const selectedVessel = vesselList.find(
      (v) => v.vesselName === formValues.vesselName
    );

    setSelectedVessel(selectedVessel ?? null);
  }, [formValues.vesselName, formValues.customerName, vesselList]);

  const validateCustomer = () => {
    if (!cusVesIdList.customerId) {
      return {
        status:
          (formValues.customerName + "").trim() === "" ? "error" : "error",
        message:
          (formValues.customerName + "").trim() === ""
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

  console.log(cusVesIdList);

  return (
    <>
      <Form layout="vertical" initialValues={formValues}>
        <Row>
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
            style={{ maxWidth: 350 }}
          >
            <Input disabled={readOnly} />
          </FormItem>
          <FormItem label="문서상태" name="documentStatus">
            <Input disabled />
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
              disabled={readOnly}
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
              onChange={(value) => handleFormChange("currencyType", value)}
              disabled={readOnly}
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
              disabled={readOnly}
            />
          </FormItem>
        </Row>

        <Row>
          <FormItem
            label="매출처(Customer)"
            name="customerName"
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
              disabled={readOnly}
            >
              Register
            </Button>
            <AutoComplete
              value={formValues.customerName}
              onChange={(value) => handleFormChange("customerName", value)}
              options={autoCompleteOptions}
              style={{ width: "100%" }}
              disabled={readOnly}
            >
              <Input readOnly={readOnly} />
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
              disabled={readOnly}
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
              disabled={readOnly}
            >
              <Input readOnly={readOnly} />
            </AutoComplete>
          </FormItem>
          <FormItem label="HULL NO." name="veeselHullNo">
            <Input
              value={formValues.veeselHullNo}
              onChange={(e) => handleFormChange("veeselHullNo", e.target.value)}
              disabled={readOnly}
            />
          </FormItem>
        </Row>
        <Row>
          <FormItem
            label="의뢰처(Supplier Name)"
            name="supplierName"
            rules={[
              {
                required: true,
                message: "Please enter supplier name",
              },
            ]}
            style={{ flex: 3 }}
          >
            <Input disabled />
          </FormItem>
          <FormItem label="비고(Remark)" name="docRemark" style={{ flex: 7 }}>
            <Input.TextArea
              value={formValues.docRemark}
              onChange={(e) => handleFormChange("docRemark", e.target.value)}
              rows={1}
              disabled={readOnly}
            />
          </FormItem>
        </Row>
      </Form>{" "}
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
