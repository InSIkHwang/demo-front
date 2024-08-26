import Cookies from "js-cookie";
import axios from "../api/axios";

// 액세스 토큰과 리프레시 토큰을 메모리 변수로 관리
let accessToken: string | null = null;

// 리프레시 토큰을 이용해 액세스 토큰을 재발급받는 함수
export const refreshToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Refresh token not found");
  }

  try {
    // 리프레시 토큰을 헤더에 담아 요청
    const response = await axios.post(
      "/api/auth/reissue-token",
      {},
      {
        headers: {
          Authorization: `${refreshToken}`,
        },
      }
    );

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      response.data;

    // 새로운 액세스 토큰과 리프레시 토큰을 저장
    Cookies.set("refreshToken", newRefreshToken, {
      secure: true,
    });
    setAccessToken(newAccessToken);
    // Access Token을 반환
    return newAccessToken;
  } catch (error) {
    throw new Error("Failed to refresh access token");
  }
};

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getRefreshToken = (): string | undefined =>
  Cookies.get("refreshToken");

export const setRefreshToken = (token: string) => {
  Cookies.set("refreshToken", token, { expires: 30, secure: true });
};

export const removeTokens = () => {
  Cookies.remove("refreshToken");
  accessToken = null;
};
