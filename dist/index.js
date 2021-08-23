'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var axios = require('axios');
var mobx = require('mobx');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);

let api;
function setAxiosConfig(config) {
    api = axios__default['default'].create(config);
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
    constructor(modelConfig) {
        this.data = null;
        this.pastData = null;
        this.loading = false;
        this.modelConfig = {
            url: "",
            primaryKey: "id",
            editMethod: "put",
        };
        mobx.makeAutoObservable(this, {}, { autoBind: true });
        this.modelConfig = Object.assign(Object.assign({}, this.modelConfig), modelConfig);
    }
    setPastData(data) {
        this.pastData = data;
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
        const dataKeys = Object.keys(data);
        if (dataKeys.includes("id"))
            console.warn("We discourage changing the id value.");
        if (this.data) {
            const newData = Object.assign(Object.assign({}, this.data), data);
            const isDifferent = JSON.stringify(this.data) !== JSON.stringify(newData);
            if (isDifferent && !this.hasChanges()) {
                this.pastData = JSON.parse(JSON.stringify(this.data));
            }
            this.data = newData;
        }
    }
    // TODO: implementar overloadings para quando não apssar um parâmetro saber que virá apenas T
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
        if (this.id) {
            return hasSlash ? url + this.id : url + "/" + this.id;
        }
        return url;
    }
    /**
     * Requests
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setLoading(true);
            try {
                let response;
                if (this.data) {
                    if (this.id) {
                        response = yield api[this.modelConfig.editMethod](this.url(), this.data);
                    }
                    else {
                        response = yield api.post(this.url(), this.data);
                    }
                }
                this.setData(response.data);
                this.setPastData(null);
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
            this.setLoading(true);
            if (!this.id) {
                throw new Error("Impossible to delete objects without a primary key.");
            }
            if (this.data) {
                try {
                    yield api.delete(this.url());
                    this.setData(null);
                    this.setPastData(null);
                }
                catch (err) {
                    throw new Error("Failed to delete model!");
                }
                finally {
                    this.setLoading(false);
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
        this.data = [];
        mobx.makeAutoObservable(this, {}, { autoBind: true });
    }
    setData(data) {
        this.data = data;
    }
    get list() {
        return this.data;
    }
    fetch(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield api.get(this.url, {
                    params,
                });
                const newData = response.data.map((data) => {
                    return this.createModel(data);
                });
                this.setData(newData);
            }
            catch (error) {
                throw new Error(`Failed to fetch new data! \n\n ${error.message}`);
            }
        });
    }
    get(primaryKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cachedData = this.list.find((data) => data.id === primaryKey);
                if (cachedData)
                    return cachedData;
                const response = yield api.get(`${this.url}/${primaryKey}`);
                return this.createModel(response.data);
            }
            catch (err) {
                throw new Error("Wasn't possible to connect to this api's endpoint.");
            }
        });
    }
    createModel(initialData) {
        const model = new Model({ url: this.url });
        model.setData(initialData);
        return model;
    }
}

exports.Collection = Collection;
exports.Model = Model;
exports.setAxiosConfig = setAxiosConfig;
