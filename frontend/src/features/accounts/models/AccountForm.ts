import type {
  AccountClass,
  AccountType,
  AccountVisibility,
} from "./Account";
import type {
  ExchangeRateSource,
} from "../../../shared/services/CurrencyRateProvider";

export interface AccountForm {
  ownerMemberId: string;
  visibility: AccountVisibility;

  name: string;
  institution: string;

  accountClass: AccountClass;
  type: AccountType;

  currency: string;
  baseCurrency: string;
  exchangeRate: number;
  exchangeRateEffectiveDate: string;
  exchangeRateSource: ExchangeRateSource;
  exchangeRateProvider: string;

  /**
   * Asset account:
   * Opening available balance.
   *
   * Liability account:
   * Current outstanding amount owed.
   */
  balance: number;

  /**
   * Liability-specific fields.
   *
   * These remain zero or empty for asset accounts.
   */
  creditLimit: number;
  statementBalance: number;
  minimumPayment: number;
  paymentDueDate: string;

  isActive: boolean;
}

export const defaultAccountForm: AccountForm = {
  ownerMemberId: "",
  visibility: "household",

  name: "",
  institution: "",

  accountClass: "asset",
  type: "checking",

  currency: "PHP",
  baseCurrency: "PHP",
  exchangeRate: 1,
  exchangeRateEffectiveDate: "",
  exchangeRateSource: "manual",
  exchangeRateProvider: "",

  balance: 0,

  creditLimit: 0,
  statementBalance: 0,
  minimumPayment: 0,
  paymentDueDate: "",

  isActive: true,
};
