import axios from "axios";

const instance = axios.create({
  baseURL: "http://3.39.105.22:8888",
});

export default instance;
