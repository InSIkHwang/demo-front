import { atom } from 'recoil';

export const textState = atom({
  key: 'textState', // 유니크한 키 값
  default: '', // 기본 값
});
