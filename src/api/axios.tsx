import axios from "axios";

const instance = axios.create({
  baseURL: "http://test.bas-korea.org:8888/",
});

export default instance;
