import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

export let api: AxiosInstance;

export function setAxiosConfig(config: AxiosRequestConfig): void {
  api = axios.create(config);
}
