import { makeAutoObservable } from "mobx";
import { api } from "./api";

type EditMethod = "patch" | "put";

type ModelConfig = {
  url: string;
  primaryKey?: string;
  editMethod?: EditMethod;
};

export class Model<T> {
  private data: T | null = null;
  private pastData: T | null = null;
  private loading = false;
  private modelConfig: ModelConfig = {
    url: "",
    primaryKey: "id",
    editMethod: "put",
  };

  // TODO: analisar ligação com uma Collection
  // TODO: adicionar estado de carregamento das requests
  constructor(modelConfig: ModelConfig) {
    makeAutoObservable(this, {}, { autoBind: true });

    this.modelConfig = { ...this.modelConfig, ...modelConfig };
  }

  private setLoading(loading: boolean) {
    this.loading = loading;
  }

  get isLoading() {
    return this.loading;
  }

  get id() {
    return this.data[this.modelConfig.primaryKey];
  }

  setData(data: T) {
    this.data = data;
  }

  set(data: Partial<T>) {
    if (this.data) {
      const newData = { ...this.data, ...data };
      const isDifferent = JSON.stringify(this.data) !== JSON.stringify(newData);

      if (isDifferent && !this.hasChanges()) {
        this.pastData = JSON.parse(JSON.stringify(this.data));
      }

      this.data = newData;
    }
  }

  // TODO: "species.name" -> bulbasaur
  get(param?: string): T | null {
    if (param && !this.data[param])
      throw new ReferenceError("This parameter doesn't exists in this model.");
    if (param && this.data[param]) return this.data[param];
    return this.data;
  }

  getOriginalData() {
    return this.pastData || this.data;
  }

  url() {
    const url = this.modelConfig.url;
    const hasSlash = url[url.length - 1] === "/";

    return hasSlash ? url + this.id : url + "/" + this.id;
  }

  /**
   * Requests
   */

  async save() {
    this.pastData = null;

    this.setLoading(true);
    try {
      if (this.data && !this.id) {
        const response = await api.post(this.url(), this.data);

        this.data = response.data;
      }

      if (this.data) {
        const response = await api[this.modelConfig.editMethod](
          this.url(),
          this.data
        );

        this.data = response.data;
      }
    } catch (error) {
      throw new Error(
        `Wasn't possible to send your request to api. \n\n ${error.message}`
      );
    } finally {
      this.setLoading(false);
    }
  }

  async remove() {
    if (this.data) {
      try {
        await api.delete(this.url());
        this.pastData = null;
        this.data = null;
      } catch (err) {
        throw new Error("Failed to delete model!");
      }
    }
  }

  /**
   * Changes
   */

  // TODO: -> executando a função mais que deve (revisar dps)
  getChanges(): Partial<T> | null {
    if (!this.hasChanges()) return null;

    const pastEntries = Object.entries(this.pastData);
    const currentEntries = Object.entries(this.data);
    const changesArr = [];

    currentEntries.forEach((entry, index) => {
      if (JSON.stringify(entry[1]) !== JSON.stringify(pastEntries[index][1])) {
        changesArr.push([entry[0], entry[1]]);
      }
    });

    const changesObj = Object.fromEntries(changesArr) as Partial<T>;
    return changesObj;
  }

  hasChanges(property?: keyof T): boolean {
    if (property)
      return (
        JSON.stringify(this.pastData[property]) !==
        JSON.stringify(this.data[property])
      );

    return (
      !!this.pastData &&
      JSON.stringify(this.data) !== JSON.stringify(this.pastData)
    );
  }

  discardChanges() {
    if (this.pastData) this.data = JSON.parse(JSON.stringify(this.pastData));
  }
}
