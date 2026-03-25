import { ParsedQs } from "qs";
import { appError } from "./appError";

class QueryBuilder {
  query: any;
  queryString: ParsedQs;

  constructor(queryString: ParsedQs) {
    this.queryString = queryString;
    this.query = {};
  }

  filter(allowedFields: string[]) {
    let { page, sort, limit, fields, ...filters } = this.queryString;

    let safeFilters: any = {};

    for (const key in filters) {
      if (allowedFields.includes(key)) {
        safeFilters[key] = filters[key]

        if (key === 'InStock') {
          safeFilters[key] = filters[key] === "true";
        }
      }
    }

    let str = JSON.stringify(safeFilters);

    str = str.replace(
      /\b(gte|gt|lte|lt)\b/g,
      match => `$${match}`
    );

    const parsed = JSON.parse(str);

    let where: any = {};

    for (const key in parsed) {
      if (typeof parsed[key] === "object") {

        where[key] = {};

        for (const operator in parsed[key]) {
          const op = operator.replace("$", "");
          where[key][op] = Number(parsed[key][operator])
        }
      } else {
        where[key] = parsed[key];
      }
    }

    this.query.where = where;
    return this;
  }

  sort(allowedFields: string[]) {
    const { sort } = this.queryString;

    let orderBy: any = [];

    if (sort) {
      const sortFields = (sort as string).split(",");

      sortFields.filter(field => allowedFields.includes(field.replace("-", "")))

      orderBy = sortFields.map(field => {

        if (field.startsWith("-")) {
          return { [field.substring(1)]: "desc" };
        }

        return { [field]: "asc" };
      })
    }

    this.query.orderBy = orderBy;
    return this;
  }

  limitFields(allowedFields: string[]) {
    const { fields } = this.queryString;

    let select: any = {};

    if (fields) {
      const fieldList = (fields as string).split(",");

      fieldList.forEach((f) => {
        if (f !== "password") select[f] = true;
      });

      fieldList.forEach((field) => {
        if (allowedFields.includes(field)) {
          select[field] = true
        }
      });

    } else {
      allowedFields.forEach((field) => {
        select[field] = true
      })
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

export default QueryBuilder;