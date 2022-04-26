const mongoose = require("mongoose");
const {
  errorMessages,
  USER_ORGANIZATION_STATUS,
} = require("../../lib/constants");
const { createUniqueId, createUniqueCustomId } = require("../../lib/utils");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  OAuthId: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  strategy: {
    type: String,
    required: true,
    default: "local",
  },
  displayName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  active: {
    type: Boolean,
    required: true,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: "organization",
  },
  organization_status: {
    type: Number,
    required: true,
    default: USER_ORGANIZATION_STATUS.DEFAULT,
  },
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const existing = await this.model.find({ username: this._update.username });

  if (existing)
    this._update.username = `${
      this._update.username || this._update.display_name
    }${await createUniqueCustomId(4, "1234567890")}`;

  next();
});

userSchema.post("findOne", function (error, _, next) {
  if (!error) next();
  console.log("=== UserSchema post findOne middleware");
  console.log(error);
  // prettier-ignore
  if (error.name === 'ValidationError' || error.name === 'ValidatorError') return next(new Error(errorMessages.ValidationError));
  // prettier-ignore
  if (error.name === 'DocumentNotFoundError') return next(new Error(errorMessages.NOT_FOUND));
  // prettier-ignore
  if (error.name === 'DocumentNotFoundError') return next(new Error(errorMessages.NOT_FOUND));

  next(new Error(errorMessages.INTERNAL));
});

userSchema.post("save", function (error, _, next) {
  if (!error) next();

  console.log("=== UserSchema post save middleware");
  console.log(error);

  // prettier-ignore
  if (error.name === 'ValidationError' || error.name === 'ValidatorError') return next(new Error(errorMessages.ValidationError));
  // prettier-ignore
  if (error.name === 'DocumentNotFoundError') return next(new Error(errorMessages.NOT_FOUND));
  // prettier-ignore
  if (error.name === 'DocumentNotFoundError') return next(new Error(errorMessages.NOT_FOUND));

  console.log(error);

  next(new Error(errorMessages.INTERNAL));
});

module.exports = mongoose.model("User", userSchema);
