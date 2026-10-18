import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';

//ограничения из swagger, используем и в схеме mongoose, и во входных dto (валидация)
export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
  match: /^[a-zA-Z0-9_-]*$/,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

export const emailConstraints = {
  match: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
};

//флаг timestamps автоматически добавляет поля updatedAt и createdAt
/**
 * User Entity Schema
 * This class represents the schema and behavior of a User entity.
 */
@Schema({ timestamps: true })
export class User {
  /**
   * Login of the user (must be uniq)
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true, ...loginConstraints })
  login: string;

  /**
   * Password hash for authentication
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  passwordHash: string;

  /**
   * Email of the user (must be uniq)
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true, ...emailConstraints })
  email: string;

  /**
   * Email confirmation status
   * @type {boolean}
   * @default false
   */
  @Prop({ type: Boolean, required: true, default: false })
  isEmailConfirmed: boolean;

  /**
   * Code for email confirmation (sent in the registration email)
   * @type {string | null}
   */
  @Prop({ type: String, default: null })
  confirmationCode: string | null;

  /**
   * Expiration date of the confirmation code
   * @type {Date | null}
   */
  @Prop({ type: Date, default: null })
  confirmationCodeExpirationDate: Date | null;

  /**
   * Code for password recovery (sent in the password recovery email)
   * @type {string | null}
   */
  @Prop({ type: String, default: null })
  recoveryCode: string | null;

  /**
   * Expiration date of the recovery code
   * @type {Date | null}
   */
  @Prop({ type: Date, default: null })
  recoveryCodeExpirationDate: Date | null;

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  /**
   * Deletion timestamp, nullable, if date exist, means entity soft deleted
   * @type {Date | null}
   */
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  /**
   * Factory method to create a User instance
   * @param {CreateUserDomainDto} dto - The data transfer object for user creation
   * @returns {UserDocument} The created user document
   */
  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;
    user.isEmailConfirmed = false; // пользователь ВСЕГДА должен после регистрации подтвердить свой Email

    return user as UserDocument;
  }

  /**
   * Marks the user as deleted
   * Throws an error if already deleted
   * @throws {Error} If the entity is already deleted
   */
  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  /**
   * Sets a new email confirmation code with its lifetime
   * @param {string} code - confirmation code
   * @param {number} lifetimeInMs - code lifetime in milliseconds
   */
  setConfirmationCode(code: string, lifetimeInMs: number) {
    this.confirmationCode = code;
    this.confirmationCodeExpirationDate = new Date(Date.now() + lifetimeInMs);
  }

  /**
   * Confirms user email (registration confirmation, or user created by admin)
   */
  confirmEmail() {
    this.isEmailConfirmed = true;
  }

  /**
   * Sets a new password recovery code with its lifetime
   * @param {string} code - recovery code
   * @param {number} lifetimeInMs - code lifetime in milliseconds
   */
  setPasswordRecoveryCode(code: string, lifetimeInMs: number) {
    this.recoveryCode = code;
    this.recoveryCodeExpirationDate = new Date(Date.now() + lifetimeInMs);
  }

  /**
   * Sets a new password hash and resets the recovery code (code can be used only once)
   * @param {string} passwordHash - new password hash
   */
  updatePassword(passwordHash: string) {
    this.passwordHash = passwordHash;
    this.recoveryCode = null;
    this.recoveryCodeExpirationDate = null;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;
