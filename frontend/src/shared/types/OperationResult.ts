export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export class OperationResults {
  static success<T>(data?: T, message?: string): OperationResult<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  static failure<T = void>(
    errors?: Record<string, string>,
    message?: string
  ): OperationResult<T> {
    return {
      success: false,
      errors,
      message,
    };
  }
}
