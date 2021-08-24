import { AxiosRequestConfig } from "axios";
import { makeAutoObservable } from "mobx";
import { api } from "./api";
import { Model } from "./Model";

type PrimaryKey = string | number;

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

  async filter(filters: Array<Array<string | unknown>>, params?: AxiosRequestConfig["params"]) {
    let fetchUrl = `${this.url}`;
    filters.forEach((filter, index) => {
      if (filter.length !== 2)
        throw new Error(`Each index in you array must have a pair of filter's key/value.
        
Expected key/value pair, but got ${filter[0]}/${filter[1]} 
        `)

      index === 0
      ? fetchUrl += `?${filter[0]}=${filter[1]}`
      : fetchUrl += `&${filter[0]}=${filter[1]}`
      
    })

    const response = await api.get<T[]>(fetchUrl, { params });
    const newData = response.data.map(data => this.createModel(data));

    this.setData(newData);
  }

  async saveAll() {
    this.list.forEach(async model => {
      await model.save();
    })

    return this.list;
  }

  private createModel(initialData: T) {
    const model = new Model<T>({ url: this.url });
    model.setData(initialData);
    return model;
  }

  private getCachedData(primaryKey: PrimaryKey) {
    return this.list.find((data) => data.id === primaryKey);
  }
}