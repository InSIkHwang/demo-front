# 프로젝트 소개

이 프로젝트는 React와 Create React App을 기반으로 한 견적 관리 시스템입니다.

## 주요 기능

### 1. 견적 관리
- 견적서 작성 및 수정
- PDF 견적서 생성
- 견적서 이메일 발송
- 견적 이력 관리

### 2. 공급업체 관리
- 공급업체 정보 등록/수정
- 공급업체별 견적 관리
- 다국어 지원 (한글/영문)

### 3. 문서 관리
- 문서 번호 자동 생성
- 문서 상태 관리
- 휴지통 기능

### 4. 데이터 관리
- Excel 데이터 가져오기/내보내기
- 통화 환율 관리
- 마진율 계산

## 시작하기

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm start

# 프로덕션 빌드
npm run build
```

## 주요 컴포넌트

### MakeInquiry
견적 요청서를 작성하는 메인 컴포넌트입니다.

### MakeOffer
견적서를 작성하는 메인 컴포넌트입니다.

### PDFGenerator
PDF 문서를 생성하는 컴포넌트입니다.


## 기술 스택

- React
- TypeScript
- Ant Design
- Axios
- Day.js
- React-PDF

## 환경 설정

개발 환경에서는 다음과 같은 설정이 필요합니다:

- Node.js 16.x 이상
- npm 8.x 이상
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## API 연동

API 호출은 axios를 사용하여 구현되어 있습니다

