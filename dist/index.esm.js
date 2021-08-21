import axios from 'axios';
import { makeAutoObservable } from 'mobx';

let api;
function setAxiosConfig(config) {
    api = axios.create(config);
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class Model {
    // TODO: analisar ligação com uma Collection
    // TODO: adicionar estado de carregamento das requests
    constructor(modelConfig) {
        this.data = null;
        this.pastData = null;
        this.loading = false;
        this.modelConfig = {
            url: "",
            primaryKey: "id",
            editMethod: "put",
        };
        makeAutoObservable(this, {}, { autoBind: true });
        this.modelConfig = Object.assign(Object.assign({}, this.modelConfig), modelConfig);
    }
    setLoading(loading) {
        this.loading = loading;
    }
    get isLoading() {
        return this.loading;
    }
    get id() {
        return this.data[this.modelConfig.primaryKey];
    }
    setData(data) {
        this.data = data;
    }
    set(data) {
        if (this.data) {
            const newData = Object.assign(Object.assign({}, this.data), data);
            const isDifferent = JSON.stringify(this.data) !== JSON.stringify(newData);
            if (isDifferent && !this.hasChanges()) {
                this.pastData = JSON.parse(JSON.stringify(this.data));
            }
            this.data = newData;
        }
    }
    // TODO: "species.name" -> bulbasaur
    get(param) {
        if (param && !this.data[param])
            throw new ReferenceError("This parameter doesn't exists in this model.");
        if (param && this.data[param])
            return this.data[param];
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
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            this.pastData = null;
            this.setLoading(true);
            try {
                if (this.data && !this.id) {
                    const response = yield api.post(this.url(), this.data);
                    this.data = response.data;
                }
                if (this.data) {
                    const response = yield api[this.modelConfig.editMethod](this.url(), this.data);
                    this.data = response.data;
                }
            }
            catch (error) {
                throw new Error(`Wasn't possible to send your request to api. \n\n ${error.message}`);
            }
            finally {
                this.setLoading(false);
            }
        });
    }
    remove() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data) {
                try {
                    yield api.delete(this.url());
                    this.pastData = null;
                    this.data = null;
                }
                catch (err) {
                    throw new Error("Failed to delete model!");
                }
            }
        });
    }
    /**
     * Changes
     */
    // TODO: -> executando a função mais que deve (revisar dps)
    getChanges() {
        if (!this.hasChanges())
            return null;
        const pastEntries = Object.entries(this.pastData);
        const currentEntries = Object.entries(this.data);
        const changesArr = [];
        currentEntries.forEach((entry, index) => {
            if (JSON.stringify(entry[1]) !== JSON.stringify(pastEntries[index][1])) {
                changesArr.push([entry[0], entry[1]]);
            }
        });
        const changesObj = Object.fromEntries(changesArr);
        return changesObj;
    }
    hasChanges(property) {
        if (property)
            return (JSON.stringify(this.pastData[property]) !==
                JSON.stringify(this.data[property]));
        return (!!this.pastData &&
            JSON.stringify(this.data) !== JSON.stringify(this.pastData));
    }
    discardChanges() {
        if (this.pastData)
            this.data = JSON.parse(JSON.stringify(this.pastData));
    }
}

class Collection {
    constructor(url) {
        this.url = url;
        makeAutoObservable(this, {}, { autoBind: true });
    }
    setData(data) {
        this.data = data;
    }
    getFullData() {
        if (this.data)
            return this.data;
    }
    get(primaryKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield api.get(`${this.url}/${primaryKey}`);
                const model = new Model({ url: "/pokemon" });
                model.setData(response.data);
                return model;
            }
            catch (err) {
                throw new Error("Wasn't possible to connect to this api's endpoint.");
            }
        });
    }
}

export { Collection, Model, setAxiosConfig };
