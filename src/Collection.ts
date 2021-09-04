import { AxiosRequestConfig } from "axios";
import { makeAutoObservable } from "mobx";
import { api } from "./api";
import { Model } from "./Model";

export class Collection<T> {
  private data: Model<T>[] = [];

  constructor(private url: string) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private setData(data: Model<T>[]) {
    this.data = data;
  }

  get list() {
    return this.data;
  }

  async fetch(params?: AxiosRequestConfig["params"]) {
    try {
      const response = await api.get<T[]>(this.url, {
        params,
      });

      const newData = response.data.map((data) => {
        return this.createModel(data);
      });

      this.setData(newData);
    } catch (error) {
      throw new Error(`Failed to fetch new data! \n\n ${error.message}`);
    }
  }

  async get(primaryKey: number | string) {
    try {
      const cachedData = this.list.find((data) => data.id === primaryKey);

      if (cachedData) return cachedData;

      const response = await api.get(`${this.url}/${primaryKey}`);

      return this.createModel(response.data);
    } catch (err) {
      throw new Error("Wasn't possible to connect to this api's endpoint.");
    }
  }

  private createModel(initialData: T) {
    const model = new Model<T>({ url: this.url });
    model.setData(initialData);
    return model;
  }
}
