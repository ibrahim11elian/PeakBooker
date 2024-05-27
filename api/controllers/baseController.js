import { APIFeatures } from '../utils/api-features.js';
import AppError from '../utils/error.js';

export default class BaseController {
  constructor(model) {
    this.model = model;
  }

  deleteOne = async (req, res, next) => {
    try {
      const { id } = req.params;
      const document = await this.model.findByIdAndDelete(id);

      if (!document) {
        return next(new AppError('Document not found!', 404));
      }

      res.status(204).json({
        status: 'success',
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateOne = async (req, res, next) => {
    try {
      const { id } = req.params;
      const document = await this.model.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!document) {
        return next(new AppError('Document not found!', 404));
      }

      res.status(200).json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  };

  createOne = async (req, res, next) => {
    try {
      const newDocument = await this.model.create(req.body);

      res.status(201).json({
        status: 'success',
        data: newDocument,
      });
    } catch (error) {
      next(new AppError(error, 400));
    }
  };

  getOne = (populateOptions) => {
    return async (req, res, next) => {
      try {
        const { id } = req.params;

        let query = this.model.findById(id);

        if (populateOptions) query = query.populate(populateOptions);

        const document = await query;

        if (!document) {
          return next(new AppError('Document not found!', 404));
        }

        res.status(200).json({
          status: 'success',
          data: document,
        });
      } catch (error) {
        next(error);
      }
    };
  };

  getAll = async (req, res, next) => {
    try {
      const features = new APIFeatures(this.model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

      const documents = await features.query;
      res.status(200).json({
        status: 'success',
        results: documents.length,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  };
}
