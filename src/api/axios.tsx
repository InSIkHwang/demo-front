import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { message } from "antd";
import { setAccessToken } from "./auth";

// 액세스 토큰을 메모리 변수로 관리
let accessToken: string | null = null;

// Axios 인스턴스 생성
const instance = axios.create({
  baseURL: "https://test.bas-korea.org/",
});

instance
  .get("/supplierInquirylist")
  .then((response) => console.log(response))
  .catch((error) => console.error(error));

// Axios 요청 및 응답 인터셉터 설정
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 헤더에 액세스 토큰을 추가
    if (accessToken) {
      (config.headers as Record<string, string>)[
        "Authorization"
      ] = `${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 쿠키에서 리프레시 토큰 가져오기
        const refreshToken = Cookies.get("refreshToken");

        if (!refreshToken) {
          // 리프레시 토큰이 없으면 로그아웃 처리
          throw new Error("Refresh token not found");
        }

        // 리프레시 토큰을 이용해 새로운 액세스 토큰 요청
        const response = await axios.post(
          "/api/auth/token",
          {}, // 요청 바디는 빈 객체로 설정 (헤더에 리프레시 토큰을 담아서 보냄)
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        // 새로운 액세스 토큰과 리프레시 토큰을 저장
        accessToken = newAccessToken;
        setAccessToken(newAccessToken);
        Cookies.set("refreshToken", newRefreshToken, {
          secure: true,
        }); // 새로운 리프레시 토큰을 쿠키에 저장
        instance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${accessToken}`;

        // 실패한 요청을 새 액세스 토큰으로 재시도
        return instance(originalRequest);
      } catch (err) {
        // 리프레시 토큰 갱신 실패 시 로그아웃 처리
        Cookies.remove("refreshToken");
        accessToken = null;
        message.error("Session expired. Please log in again.");
        // 로그아웃 처리를 위해 에러를 던짐
        throw err;
      }
    }

    // 다른 에러는 그대로 전달
    return Promise.reject(error);
  }
);

export default instance;
