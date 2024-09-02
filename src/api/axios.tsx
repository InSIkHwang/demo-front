import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";
import { message } from "antd";
import {
  getAccessToken,
  refreshToken,
  removeTokens,
  setAccessToken,
} from "./auth";

// Axios 인스턴스 생성
const instance = axios.create({
  // baseURL: "https://test.bas-korea.org/", //dev
  baseURL: "https://pro-api.bas-korea.org/", //배포
});

// Axios 요청 인터셉터 설정
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
      // config.headers가 AxiosRequestHeaders 타입임을 보장
      if (config.headers) {
        (config.headers as AxiosRequestHeaders).Authorization = `${token}`;
      } else {
        config.headers = {
          Authorization: `${token}`,
        } as AxiosRequestHeaders;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Axios 응답 인터셉터 설정
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 액세스 토큰 갱신
        const newAccessToken = await refreshToken();
        if (newAccessToken) {
          setAccessToken(newAccessToken); // 갱신된 액세스 토큰 설정
          // 실패한 요청을 새 액세스 토큰으로 재시도
          if (originalRequest.headers) {
            (
              originalRequest.headers as AxiosRequestHeaders
            ).Authorization = `${newAccessToken}`;
          }
          return instance(originalRequest);
        }
      } catch (err) {
        // 리프레시 토큰 갱신 실패 시 로그아웃 처리
        removeTokens();
        message.error("Session expired. Please log in again.");
        throw err;
      }
    }

    // 다른 에러는 그대로 전달
    return Promise.reject(error);
  }
);

export default instance;
