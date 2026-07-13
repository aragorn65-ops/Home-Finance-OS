export interface AccountForm {
  name: string;
  type: string;
  institution: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

export const defaultAccountForm: AccountForm = {
  name: "",
  type: "Checking",
  institution: "",
  balance: 0,
  currency: "USD",
  isActive: true,
};