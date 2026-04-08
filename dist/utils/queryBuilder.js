"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QueryBuilder {
    query;
    queryString;
    constructor(queryString) {
        this.queryString = queryString;
        this.query = {};
    }
    filter(allowedFields) {
        let { page, sort, limit, fields, ...filters } = this.queryString;
        let safeFilters = {};
        for (const key in filters) {
            if (allowedFields.includes(key)) {
                safeFilters[key] = filters[key];
                if (key === 'InStock') {
                    safeFilters[key] = filters[key] === "true";
                }
            }
        }
        let str = JSON.stringify(safeFilters);
        str = str.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        const parsed = JSON.parse(str);
        let where = {};
        for (const key in parsed) {
            if (typeof parsed[key] === "object") {
                where[key] = {};
                for (const operator in parsed[key]) {
                    const op = operator.replace("$", "");
                    where[key][op] = Number(parsed[key][operator]);
                }
            }
            else {
                where[key] = parsed[key];
            }
        }
        this.query.where = where;
        return this;
    }
    sort(allowedFields) {
        const { sort } = this.queryString;
        let orderBy = [];
        if (sort) {
            const sortFields = sort.split(",");
            sortFields.filter(field => allowedFields.includes(field.replace("-", "")));
            orderBy = sortFields.map(field => {
                if (field.startsWith("-")) {
                    return { [field.substring(1)]: "desc" };
                }
                return { [field]: "asc" };
            });
        }
        this.query.orderBy = orderBy;
        return this;
    }
    limitFields(allowedFields) {
        const { fields } = this.queryString;
        let select = {};
        if (fields) {
            const fieldList = fields.split(",");
            fieldList.forEach((f) => {
                if (f !== "password")
                    select[f] = true;
            });
            fieldList.forEach((field) => {
                if (allowedFields.includes(field)) {
                    select[field] = true;
                }
            });
        }
        else {
            allowedFields.forEach((field) => {
                select[field] = true;
            });
        }
        this.query.select = select;
        return this;
    }
    paginate() {
        const page = Number(this.queryString.page) || 1;
        const limit = Number(this.queryString.limit) || 5;
        const skip = (page - 1) * limit;
        this.query.take = limit;
        this.query.skip = skip;
        return this;
    }
}
exports.default = QueryBuilder;
