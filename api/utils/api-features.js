export class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    // build the query
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach((el) => delete queryObj[el]);

    // if the user want to use any filter operations
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (s) => `$${s}`);

    // we do not use await here so we can use additional functionality on it later for ex if there is a sort or a pagination
    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // sort the data and ASC or DESC(if DESC user need to add - before the field name)
    // and add a second sorting field incase of tie in first one
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // default sorting if the user did not specify any sorting
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    // select specific fields that user wants
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // default fields that will be returned if the user did not specify any fields
      this.query = this.query.select(['-__v']);
    }
    return this;
  }

  paginate() {
    // add pagination (if the user did not specify a page it will return first 100 documents)
    // convert to number
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
