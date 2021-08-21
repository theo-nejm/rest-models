declare type EditMethod = "patch" | "put";
declare type ModelConfig = {
    url: string;
    primaryKey?: string;
    editMethod?: EditMethod;
};
export declare class Model<T> {
    private data;
    private pastData;
    private loading;
    private modelConfig;
    constructor(modelConfig: ModelConfig);
    private setLoading;
    get isLoading(): boolean;
    get id(): any;
    setData(data: T): void;
    set(data: Partial<T>): void;
    get(param?: string): T | null;
    getOriginalData(): T;
    url(): string;
    /**
     * Requests
     */
    save(): Promise<void>;
    remove(): Promise<void>;
    /**
     * Changes
     */
    getChanges(): Partial<T> | null;
    hasChanges(property?: keyof T): boolean;
    discardChanges(): void;
}
export {};
