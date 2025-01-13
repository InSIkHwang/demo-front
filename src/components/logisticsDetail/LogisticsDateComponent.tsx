import { DatePicker, Form } from "antd";
import styled from "styled-components";
import { LogisticsDate } from "../../types/types";
import dayjs from "dayjs";

const DateFormContainer = styled.div`
  margin: 20px 0;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const StyledFormItem = styled(Form.Item)`
  flex: 1;
  margin-bottom: 0;

  .ant-form-item-label {
    font-weight: 500;
  }
`;

interface LogisticsDateComponentProps {
  logisticsDate: LogisticsDate;
  setLogisticsDate: (date: LogisticsDate) => void;
}

const LogisticsDateComponent = ({
  logisticsDate,
  setLogisticsDate,
}: LogisticsDateComponentProps) => {
  const handleDateChange = (
    field: keyof LogisticsDate,
    value: dayjs.Dayjs | null
  ) => {
    setLogisticsDate({
      ...logisticsDate,
      [field]: value ? value.format("YYYY-MM-DD") : "",
    });
  };

  return (
    <DateFormContainer>
      <Form layout="vertical">
        <FormRow>
          <StyledFormItem label="Delivery Date(납기일)">
            <DatePicker
              value={
                logisticsDate.deliveryDate
                  ? dayjs(logisticsDate.deliveryDate)
                  : null
              }
              onChange={(date) => handleDateChange("deliveryDate", date)}
              format="YYYY-MM-DD"
              style={{ width: "100%" }}
              placeholder="Select Delivery Date(납기일을 선택하세요)"
            />
          </StyledFormItem>
          <StyledFormItem label="Expected Receiving Date(예정 입고일)">
            <DatePicker
              value={
                logisticsDate.expectedReceivingDate
                  ? dayjs(logisticsDate.expectedReceivingDate)
                  : null
              }
              onChange={(date) =>
                handleDateChange("expectedReceivingDate", date)
              }
              format="YYYY-MM-DD"
              style={{ width: "100%" }}
              placeholder="Select Expected Receiving Date(예정 입고일을 선택하세요)"
            />
          </StyledFormItem>
          <StyledFormItem label="Receiving Date(입고일)">
            <DatePicker
              value={
                logisticsDate.receivingDate
                  ? dayjs(logisticsDate.receivingDate)
                  : null
              }
              onChange={(date) => handleDateChange("receivingDate", date)}
              format="YYYY-MM-DD"
              style={{ width: "100%" }}
              placeholder="Select Receiving Date(입고일을 선택하세요)"
            />
          </StyledFormItem>
          <StyledFormItem label="Shipping Date(출고일)">
            <DatePicker
              value={
                logisticsDate.shippingDate
                  ? dayjs(logisticsDate.shippingDate)
                  : null
              }
              onChange={(date) => handleDateChange("shippingDate", date)}
              format="YYYY-MM-DD"
              style={{ width: "100%" }}
              placeholder="Select Shipping Date(출고일을 선택하세요)"
            />
          </StyledFormItem>
        </FormRow>
      </Form>
    </DateFormContainer>
  );
};

export default LogisticsDateComponent;
