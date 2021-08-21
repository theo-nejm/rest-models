import { Model } from "./Model";
export declare class Collection<T> {
    private url;
    private data;
    constructor(url: string);
    private setData;
    getFullData(): T[];
    get(primaryKey: number | string): Promise<Model<T>>;
}
