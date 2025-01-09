import { Progress, Typography } from "antd";
import { styled } from "styled-components";

const { Text } = Typography;

interface PDFDownloadProgressProps {
  downloading: boolean;
  downloadedFiles: number;
  totalFiles: number;
}

const ProgressWrapper = styled.div`
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const StatusText = styled(Text)<{ $isComplete?: boolean }>`
  font-size: 14px;
  color: ${(props: { $isComplete?: boolean }) =>
    props.$isComplete ? "#52c41a" : "#1890ff"};
  font-weight: 500;
`;

const StyledProgress = styled(Progress)`
  .ant-progress-inner {
    background-color: #f5f5f5;
  }

  .ant-progress-bg {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const PDFDownloadProgress = ({
  downloading,
  downloadedFiles,
  totalFiles,
}: PDFDownloadProgressProps) => {
  if (!downloading) return null;

  const percent = Math.round((downloadedFiles / totalFiles) * 100);
  const isComplete = downloadedFiles === totalFiles;

  return (
    <ProgressWrapper>
      <ProgressHeader>
        <Text strong>PDF Download Progress</Text>
        <StatusText $isComplete={isComplete}>
          {isComplete ? "Download Complete" : "Downloading..."}
        </StatusText>
      </ProgressHeader>
      <StyledProgress
        percent={percent}
        status={isComplete ? "success" : "active"}
        format={() => (
          <Text strong>
            {downloadedFiles}/{totalFiles} files
          </Text>
        )}
        strokeColor={{
          from: "#108ee9",
          to: "#87d068",
        }}
        strokeWidth={8}
      />
    </ProgressWrapper>
  );
};

export default PDFDownloadProgress;
