import axios from "axios";

export const http = axios.create({
  timeout: 12000,
  headers: {
    Accept: "application/json"
  }
});

export function isOfflineError(error: unknown) {
  return axios.isAxiosError(error) && !error.response;
}
