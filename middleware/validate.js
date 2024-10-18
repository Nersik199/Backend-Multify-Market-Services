import fs from "fs/promises";

export default (schemas, target) => {
  return (req, res, next) => {
    const { error } = schemas.validate(req[target], {
      abortEarly: false,
    });
    if (error) {
      if (req.file) {
        fs.unlink(req.file.path);
      }
      if (req.files) {
        req.files.forEach((file) => fs.unlink(file.path));
      }
      const fields = {};
      error.details.forEach((detail) => {
        fields[detail.path[0]] = detail.message;
      });
      const hasErrors = Object.keys(fields).length > 0;
      if (hasErrors) {
        return res.status(422).json({
          message: "Validation error",
          fields,
        });
      }
    }
    next();
  };
};
