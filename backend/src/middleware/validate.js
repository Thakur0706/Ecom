import { AppError } from '../utils/http.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(
        new AppError(
          result.error.issues.map((issue) => issue.message).join(', ') || 'Validation failed.',
          400,
        ),
      );
    }

    req[source] = result.data;
    return next();
  };
}
