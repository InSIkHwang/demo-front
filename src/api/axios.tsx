import axios from "axios";

const instance = axios.create({
  baseURL: "https://test.bas-korea.org/",
});

export default instance;
