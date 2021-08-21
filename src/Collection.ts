import { makeAutoObservable } from "mobx";
import { api } from "./api";
import { Model } from "./Model";

export class Collection<T> {
  private data: T[];

  constructor(private url: string) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private setData(data: T[]) {
    this.data = data;
  }

  getFullData() {
    if (this.data) return this.data;
  }

  async get(primaryKey: number | string) {
    try {
      const response = await api.get(`${this.url}/${primaryKey}`);
      const model = new Model<T>({ url: "/pokemon" });

      model.setData(response.data);

      return model;
    } catch (err) {
      throw new Error("Wasn't possible to connect to this api's endpoint.");
    }
  }
}
