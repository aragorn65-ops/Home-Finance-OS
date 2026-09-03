import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
} from "react";

import type { Account } from "../../accounts/models/Account";
import {
  isAccountVisibleForMember,
} from "../../accounts/services/accountVisibility";
import type { HouseholdMember } from "../../household/models/HouseholdMember";
import {
  resolveHouseholdMemberReference,
} from "../../household/services/householdMemberResolution";

import type { OperationResult } from "../../../shared/types/index";
import {
  currencies,
} from "../../../shared/data/currencies";
import CurrencyInput from "../../../shared/ui/CurrencyInput";
import CurrencyRateLookupButton from "../../../shared/ui/CurrencyRateLookupButton";
import FormValidationAlert from "../../../shared/ui/FormValidationAlert";
import formatCurrency from "../../../shared/utils/formatCurrency";
import openAttachmentPreview, {
  hasAttachmentPreviewData,
} from "../../../shared/utils/openAttachmentPreview";

import type {
  StoredAttachment,
  StoredAttachmentCategory,
} from "../../../shared/models/StoredAttachment";

import type { Transaction } from "../models/Transaction";

import {
  createExpenseAllocationForm,
  type ExpenseAllocationForm,
} from "../models/ExpenseAllocationForm";

import {
  calculatePersonalItemsTotal,
  createPersonalExpenseItem,
  type PersonalExpenseItem,
} from "../models/PersonalExpenseItem";

import {
  defaultTransactionForm,
  type TransactionForm as TransactionFormData,
} from "../models/TransactionForm";
import {
  isCanonicalTransactionCategory,
  normalizeTransactionCategory,
  transactionCategories,
} from "../models/TransactionCategory";
import {
  normalizeTransactionFormMemberReferences,
} from "../services/transactionFormMemberNormalization";

type TransactionFormProps = {
  accounts: Account[];
  members?: HouseholdMember[];
  currency?: string;
  initialValues?: TransactionFormData;
  submitLabel?: string;

  onSubmit: (
    form: TransactionFormData
  ) =>
    | OperationResult<Transaction>
    | Promise<OperationResult<Transaction>>;

  onCancel?: () => void;
};

interface SharedPersonalPreview {
  includedCount: number;
  personalTotal: number;
  commonAmount: number;
  excessAmount: number;
  isOverAmount: boolean;
  commonShareAmounts: number[];
  finalAmounts: number[];
}

const acceptedAttachmentMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const acceptedAttachmentExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
] as const;

const maximumAttachmentCount = 3;

const maximumAttachmentSizeBytes =
  1024 * 1024;

const maximumStoredImageDimension =
  1600;

const storedImageQuality =
  0.78;

const storedImageQualityFallbacks = [
  storedImageQuality,
  0.68,
  0.58,
  0.48,
  0.38,
] as const;

const unlinkedPaymentAccountOptions = [
  {
    value: "__cash__",
    label: "Cash",
  },
  {
    value: "__other_account__",
    label: "Other account (as registered by member)",
  },
] as const;

const transactionFieldLabels:
  Record<string, string> = {
    general: "General",
    type: "Transaction Type",
    amount: "Amount",
    enteredAmount: "Entered Amount",
    enteredCurrency: "Transaction Currency",
    baseAmount: "Base Amount",
    exchangeRate: "Exchange Rate",
    paidByMemberId: "Member",
    visibility: "Visibility",
    sourceAccountId: "Source or Payment Account",
    destinationAccountId: "Destination Account",
    category: "Category",
    description: "Description",
    transactionDate: "Transaction Date",
    splitMethod: "Split Method",
    allocations: "Allocation",
    attachments: "Receipts and Bills",
    isActive: "Active transaction",
  };

function isUnlinkedPaymentAccountOption(
  accountId: string
): boolean {
  return unlinkedPaymentAccountOptions.some(
    (option) =>
      option.value === accountId
  );
}

function isAcceptedAttachmentMimeType(
  mimeType: string
): boolean {
  return acceptedAttachmentMimeTypes.includes(
    mimeType as
      typeof acceptedAttachmentMimeTypes[number]
  );
}

function isAcceptedAttachmentFile(
  file: File
): boolean {
  if (
    file.type &&
    isAcceptedAttachmentMimeType(
      file.type
    )
  ) {
    return true;
  }

  const fileName =
    file.name.toLowerCase();

  return acceptedAttachmentExtensions.some(
    (extension) =>
      fileName.endsWith(extension)
  );
}

function getAttachmentMimeType(
  file: File
): string {
  if (
    file.type &&
    isAcceptedAttachmentMimeType(
      file.type
    )
  ) {
    return file.type === "image/jpg" ||
      file.type === "image/pjpeg"
      ? "image/jpeg"
      : file.type;
  }

  const fileName =
    file.name.toLowerCase();

  if (
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg")
  ) {
    return "image/jpeg";
  }

  if (fileName.endsWith(".png")) {
    return "image/png";
  }

  if (fileName.endsWith(".webp")) {
    return "image/webp";
  }

  if (fileName.endsWith(".pdf")) {
    return "application/pdf";
  }

  return file.type;
}

function getDefaultAttachmentCategory(
  fileName: string
): StoredAttachmentCategory {
  const normalizedName =
    fileName.toLowerCase();

  if (
    normalizedName.includes(
      "bill"
    ) ||
    normalizedName.includes(
      "invoice"
    )
  ) {
    return "bill";
  }

  if (
    normalizedName.includes(
      "receipt"
    )
  ) {
    return "receipt";
  }

  return "other";
}

function formatFileSize(
  sizeBytes: number
): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  return `${(
    sizeBytes /
    1024
  ).toFixed(1)} KB`;
}

function readFileAsDataUrl(
  file: Blob
): Promise<string> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result ===
          "string"
        ) {
          resolve(
            reader.result
          );

          return;
        }

        reject(
          new Error(
            "The selected attachment could not be read."
          )
        );
      };

      reader.onerror = () => {
        reject(
          reader.error ??
            new Error(
              "The selected attachment could not be read."
            )
        );
      };

      reader.readAsDataURL(
        file
      );
    }
  );
}

function loadImage(
  source: string
): Promise<HTMLImageElement> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image = new Image();

      image.onload = () =>
        resolve(image);

      image.onerror = () =>
        reject(
          new Error(
            "The selected image could not be prepared."
          )
        );

      image.src = source;
    }
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      resolve,
      "image/jpeg",
      quality
    );
  });
}

async function compressCanvasToAttachmentBlob(
  canvas: HTMLCanvasElement
): Promise<Blob | null> {
  let smallestBlob: Blob | null =
    null;

  for (const quality of storedImageQualityFallbacks) {
    const blob =
      await canvasToBlob(
        canvas,
        quality
      );

    if (!blob) {
      continue;
    }

    if (
      !smallestBlob ||
      blob.size < smallestBlob.size
    ) {
      smallestBlob = blob;
    }

    if (
      blob.size <=
      maximumAttachmentSizeBytes
    ) {
      return blob;
    }
  }

  return smallestBlob;
}

async function prepareAttachmentFile(
  file: File
): Promise<{
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
}> {
  const mimeType =
    getAttachmentMimeType(
      file
    );

  if (!mimeType.startsWith("image/")) {
    return {
      dataUrl:
        await readFileAsDataUrl(
          file
        ),
      mimeType:
        mimeType,
      sizeBytes:
        file.size,
    };
  }

  const objectUrl =
    URL.createObjectURL(file);

  try {
    const image =
      await loadImage(objectUrl);

    const scale =
      Math.min(
        1,
        maximumStoredImageDimension /
          Math.max(
            image.naturalWidth,
            image.naturalHeight
          )
      );

    const width =
      Math.max(
        1,
        Math.round(
          image.naturalWidth * scale
        )
      );

    const height =
      Math.max(
        1,
        Math.round(
          image.naturalHeight * scale
        )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width = width;
    canvas.height = height;

    const context =
      canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "The selected image could not be prepared."
      );
    }

    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const compressedBlob =
      await compressCanvasToAttachmentBlob(
        canvas
      );

    if (!compressedBlob) {
      throw new Error(
        "The selected image could not be prepared."
      );
    }

    return {
      dataUrl:
        await readFileAsDataUrl(
          compressedBlob
        ),
      mimeType:
        mimeType === "image/png" ||
        mimeType === "image/webp"
          ? compressedBlob.type ||
            "image/jpeg"
          : "image/jpeg",
      sizeBytes:
        compressedBlob.size,
    };
  } finally {
    URL.revokeObjectURL(
      objectUrl
    );
  }
}

function createAttachmentId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `attachment-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function getDefaultFormValues(
  currency = "PHP"
): TransactionFormData {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  return {
    ...defaultTransactionForm,

    paidByMemberId: "",
    enteredCurrency:
      currency,
    exchangeRate: 1,
    exchangeRateEffectiveDate:
      today,

    transactionDate:
      today,
  };
}

function toCents(
  amount: number
): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(
    amount * 100
  );
}

function normalizePersonalItems(
  allocation: ExpenseAllocationForm
): PersonalExpenseItem[] {
  const storedItems =
    allocation.personalItems?.map(
      (item) => ({
        ...item,
      })
    ) ?? [];

  if (storedItems.length > 0) {
    return storedItems;
  }

  if (
    allocation.personalAmount > 0
  ) {
    return [
      {
        id: crypto.randomUUID(),
        description:
          "Personal items",
        amount:
          allocation.personalAmount,
      },
    ];
  }

  return [];
}

function calculateEqualPreview(
  amount: number,
  allocations: ExpenseAllocationForm[]
): number[] {
  const includedIndexes =
    allocations
      .map(
        (
          allocation,
          index
        ) => ({
          allocation,
          index,
        })
      )
      .filter(
        ({ allocation }) =>
          allocation.isIncluded
      )
      .map(
        ({ index }) =>
          index
      );

  const result =
    allocations.map(() => 0);

  if (
    includedIndexes.length === 0 ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return result;
  }

  const totalCents =
    toCents(amount);

  const baseShareCents =
    Math.floor(
      totalCents /
        includedIndexes.length
    );

  const remainderCents =
    totalCents -
    baseShareCents *
      includedIndexes.length;

  includedIndexes.forEach(
    (
      allocationIndex,
      includedIndex
    ) => {
      const isLast =
        includedIndex ===
        includedIndexes.length - 1;

      result[allocationIndex] =
        (
          baseShareCents +
          (
            isLast
              ? remainderCents
              : 0
          )
        ) / 100;
    }
  );

  return result;
}

function calculateSharedPersonalPreview(
  amount: number,
  allocations: ExpenseAllocationForm[]
): SharedPersonalPreview {
  const includedIndexes =
    allocations
      .map(
        (
          allocation,
          index
        ) => ({
          allocation,
          index,
        })
      )
      .filter(
        ({ allocation }) =>
          allocation.isIncluded
      )
      .map(
        ({ index }) =>
          index
      );

  const commonShareAmounts =
    allocations.map(() => 0);

  const finalAmounts =
    allocations.map(() => 0);

  const totalCents =
    Math.max(
      0,
      toCents(amount)
    );

  const personalAmountCents =
    allocations.map(
      (allocation) => {
        if (!allocation.isIncluded) {
          return 0;
        }

        return Math.max(
          0,
          toCents(
            allocation.personalAmount
          )
        );
      }
    );

  const personalTotalCents =
    personalAmountCents.reduce(
      (
        total,
        personalAmount
      ) =>
        total +
        personalAmount,
      0
    );

  const rawCommonAmountCents =
    totalCents -
    personalTotalCents;

  const isOverAmount =
    rawCommonAmountCents < 0;

  const commonAmountCents =
    Math.max(
      0,
      rawCommonAmountCents
    );

  const excessAmountCents =
    Math.max(
      0,
      personalTotalCents -
        totalCents
    );

  if (
    includedIndexes.length > 0 &&
    !isOverAmount
  ) {
    const baseCommonShareCents =
      Math.floor(
        commonAmountCents /
          includedIndexes.length
      );

    const remainderCents =
      commonAmountCents -
      baseCommonShareCents *
        includedIndexes.length;

    includedIndexes.forEach(
      (
        allocationIndex,
        includedIndex
      ) => {
        const isLastIncluded =
          includedIndex ===
          includedIndexes.length - 1;

        const commonShareCents =
          baseCommonShareCents +
          (
            isLastIncluded
              ? remainderCents
              : 0
          );

        commonShareAmounts[
          allocationIndex
        ] =
          commonShareCents / 100;
      }
    );
  }

  allocations.forEach(
    (
      allocation,
      index
    ) => {
      if (!allocation.isIncluded) {
        finalAmounts[index] = 0;

        return;
      }

      finalAmounts[index] =
        (
          personalAmountCents[
            index
          ] +
          toCents(
            commonShareAmounts[
              index
            ]
          )
        ) / 100;
    }
  );

  return {
    includedCount:
      includedIndexes.length,

    personalTotal:
      personalTotalCents / 100,

    commonAmount:
      commonAmountCents / 100,

    excessAmount:
      excessAmountCents / 100,

    isOverAmount,

    commonShareAmounts,

    finalAmounts,
  };
}

function formatAmount(
  amount: number,
  currency?: string
): string {
  return formatCurrency(
    amount,
    currency
  );
}

function resolveMemberReference(
  members: HouseholdMember[],
  memberId: string
): HouseholdMember | undefined {
  return resolveHouseholdMemberReference(
    members,
    memberId
  );
}

const normalizeFormMemberReferences =
  normalizeTransactionFormMemberReferences;

export default function TransactionForm({
  accounts,
  members = [],
  currency,
  initialValues,
  submitLabel = "Save Transaction",
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const activeMembers =
    members.filter(
      (member) =>
        member.isActive
    );

  const selectedMember =
    initialValues?.paidByMemberId
      ? resolveMemberReference(
          members,
          initialValues.paidByMemberId
        )
      : undefined;

  const memberOptions =
    selectedMember &&
    !activeMembers.some(
      (member) =>
        member.id ===
        selectedMember.id
    )
      ? [
          selectedMember,
          ...activeMembers,
        ]
      : activeMembers;

  const [form, setForm] =
    useState<TransactionFormData>(
      initialValues ??
        getDefaultFormValues(
          currency
        )
    );

  const supportsCurrencyConversion =
    form.type === "income" ||
    form.type === "expense";

  const transactionCurrencyLabel =
    form.type === "income"
      ? "Income Currency"
      : "Expense Currency";

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [message, setMessage] =
    useState("");

  const [
    validationAlertErrors,
    setValidationAlertErrors,
  ] = useState<Record<string, string>>(
    {}
  );

  const [
    isValidationAlertOpen,
    setIsValidationAlertOpen,
  ] = useState(false);

  const [
    isPreparingAttachments,
    setIsPreparingAttachments,
  ] = useState(false);
  const [
    isSavingTransaction,
    setIsSavingTransaction,
  ] = useState(false);

  const [
    attachmentStatus,
    setAttachmentStatus,
  ] = useState("");

  const attachmentSectionRef =
    useRef<HTMLElement>(null);

  const pendingAttachmentFilesRef =
    useRef<Record<string, File>>({});

  const localAttachmentUrlsRef =
    useRef<Record<string, string>>({});

  const clearPendingAttachments = () => {
    Object.values(
      localAttachmentUrlsRef.current
    ).forEach((objectUrl) => {
      URL.revokeObjectURL(objectUrl);
    });

    pendingAttachmentFilesRef.current = {};
    localAttachmentUrlsRef.current = {};
  };

  const showValidationAlert = (
    nextErrors:
      Record<string, string> | undefined,
    fallbackMessage =
      "Please correct the highlighted fields."
  ) => {
    const visibleErrors =
      nextErrors &&
      Object.keys(nextErrors).length >
        0
        ? nextErrors
        : {
            general:
              fallbackMessage,
          };

    setValidationAlertErrors(
      visibleErrors
    );

    setIsValidationAlertOpen(
      true
    );
  };

  useEffect(() => {
    clearPendingAttachments();

    const nextForm =
      initialValues
        ? normalizeFormMemberReferences(
            {
              ...initialValues,

              allocations:
                initialValues.allocations.map(
                  (allocation) => {
                    const personalItems =
                      normalizePersonalItems(
                        allocation
                      );

                    return {
                      ...allocation,

                      personalItems,

                      personalAmount:
                        calculatePersonalItemsTotal(
                          personalItems
                        ),
                    };
                  }
                ),

              attachments:
                initialValues.attachments?.map(
                  (attachment) => ({
                    ...attachment,

                    createdAt:
                      new Date(
                        attachment.createdAt
                      ),
                  })
                ) ?? [],
            },
            members
          )
        : getDefaultFormValues(
            currency
          );

    setForm(nextForm);
    setErrors({});
    setMessage("");
  }, [
    initialValues,
    currency,
    members,
  ]);

  useEffect(() => {
    return () => {
      clearPendingAttachments();
    };
  }, []);

  const availableAccounts =
    useMemo(() => {
      if (!form.paidByMemberId) {
        return [];
      }

      return accounts.filter(
        (account) =>
          account.isActive &&
          isAccountVisibleForMember(
            account,
            form.paidByMemberId
          )
      );
    }, [
      accounts,
      form.paidByMemberId,
    ]);

  const equalPreview =
    useMemo(
      () =>
        calculateEqualPreview(
          form.amount,
          form.allocations
        ),
      [
        form.amount,
        form.allocations,
      ]
    );

  const sharedPersonalPreview =
    useMemo(
      () =>
        calculateSharedPersonalPreview(
          form.amount,
          form.allocations
        ),
      [
        form.amount,
        form.allocations,
      ]
    );

  const enteredAllocationTotal =
    useMemo(() => {
      return form.allocations.reduce(
        (
          total,
          allocation
        ) =>
          total +
          (
            allocation.isIncluded
              ? allocation
                  .allocatedAmount
              : 0
          ),
        0
      );
    }, [form.allocations]);

  const sharedPersonalFinalTotal =
    useMemo(() => {
      return sharedPersonalPreview
        .finalAmounts
        .reduce(
          (
            total,
            amount
          ) =>
            total + amount,
          0
        );
    }, [sharedPersonalPreview]);

  const updateField = <
    Field extends keyof TransactionFormData,
  >(
    field: Field,
    value: TransactionFormData[Field]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = {
        ...current,
      };

      delete nextErrors[field];

      return nextErrors;
    });

    setMessage("");
  };

  const clearAllocationError = () => {
    setErrors((current) => {
      if (!current.allocations) {
        return current;
      }

      const nextErrors = {
        ...current,
      };

      delete nextErrors.allocations;

      return nextErrors;
    });

    setMessage("");
  };

  const handleMemberChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const memberId =
      event.target.value;

    setForm((current) => ({
      ...current,

      paidByMemberId:
        memberId,

      sourceAccountId: "",
      destinationAccountId: "",
    }));

    setErrors((current) => {
      const nextErrors = {
        ...current,
      };

      delete nextErrors.paidByMemberId;
      delete nextErrors.sourceAccountId;
      delete nextErrors.destinationAccountId;

      return nextErrors;
    });

    setMessage("");
  };

  const handleTypeChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const type =
      event.target
        .value as TransactionFormData["type"];

    setForm((current) => ({
      ...current,

      type,

      sourceAccountId:
        type === "income"
          ? ""
          : current.sourceAccountId,

      destinationAccountId:
        type === "expense"
          ? ""
          : current.destinationAccountId,

      enteredCurrency:
        type === "income" ||
        type === "expense"
          ? current.enteredCurrency ||
            currency ||
            "PHP"
          : currency || "PHP",

      exchangeRate:
        type === "income" ||
        type === "expense"
          ? current.exchangeRate || 1
          : 1,
      exchangeRateEffectiveDate:
        type === "income" ||
        type === "expense"
          ? current.exchangeRateEffectiveDate ||
            current.transactionDate
          : current.transactionDate,
      exchangeRateSource:
        type === "income" ||
        type === "expense"
          ? current.exchangeRateSource
          : "manual",
      exchangeRateProvider:
        type === "income" ||
        type === "expense"
          ? current.exchangeRateProvider
          : "",

      splitMethod:
        type === "expense"
          ? current.splitMethod
          : "none",

      allocations:
        type === "expense"
          ? current.allocations
          : [],
    }));

    setErrors({});
    setMessage("");
    setAttachmentStatus("");
  };

  const handleSourceAccountChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const nextAccountId =
      event.target.value;

    const selectedAccount =
      availableAccounts.find(
        (account) =>
          account.id === nextAccountId
      );

    setForm((current) => {
      if (
        current.type !== "expense" ||
        !selectedAccount
      ) {
        return {
          ...current,
          sourceAccountId:
            nextAccountId,
        };
      }

      return {
        ...current,
        sourceAccountId:
          nextAccountId,
        enteredCurrency:
          selectedAccount.currency ||
          currency ||
          "PHP",
        exchangeRate:
          selectedAccount.exchangeRate ||
          current.exchangeRate ||
          1,
        exchangeRateEffectiveDate:
          selectedAccount.exchangeRateEffectiveDate
            ? selectedAccount.exchangeRateEffectiveDate
                .toISOString()
                .slice(0, 10)
            : current.transactionDate,
        exchangeRateSource:
          selectedAccount.exchangeRateSource ??
          "manual",
        exchangeRateProvider:
          selectedAccount.exchangeRateSource ===
          "api"
            ? selectedAccount.exchangeRateProvider ??
              ""
            : "",
      };
    });

    setErrors((current) => {
      const nextErrors = {
        ...current,
      };

      delete nextErrors.sourceAccountId;
      delete nextErrors.enteredCurrency;
      delete nextErrors.exchangeRate;

      return nextErrors;
    });

    setMessage("");
  };

  const handleDestinationAccountChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const nextAccountId =
      event.target.value;

    const selectedAccount =
      availableAccounts.find(
        (account) =>
          account.id === nextAccountId
      );

    setForm((current) => {
      if (
        current.type !== "income" ||
        !selectedAccount
      ) {
        return {
          ...current,
          destinationAccountId:
            nextAccountId,
        };
      }

      return {
        ...current,
        destinationAccountId:
          nextAccountId,
        enteredCurrency:
          selectedAccount.currency ||
          currency ||
          "PHP",
        exchangeRate:
          selectedAccount.exchangeRate ||
          current.exchangeRate ||
          1,
        exchangeRateEffectiveDate:
          selectedAccount.exchangeRateEffectiveDate
            ? selectedAccount.exchangeRateEffectiveDate
                .toISOString()
                .slice(0, 10)
            : current.transactionDate,
        exchangeRateSource:
          selectedAccount.exchangeRateSource ??
          "manual",
        exchangeRateProvider:
          selectedAccount.exchangeRateSource ===
          "api"
            ? selectedAccount.exchangeRateProvider ??
              ""
            : "",
      };
    });

    setErrors((current) => {
      const nextErrors = {
        ...current,
      };

      delete nextErrors.destinationAccountId;
      delete nextErrors.enteredCurrency;
      delete nextErrors.exchangeRate;

      return nextErrors;
    });

    setMessage("");
  };

  const handleSplitMethodChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const splitMethod =
      event.target
        .value as TransactionFormData["splitMethod"];

    setForm((current) => ({
      ...current,

      splitMethod,

      allocations:
        splitMethod === "none"
          ? []
          : activeMembers.map(
              (member) => {
                const existing =
                  current.allocations.find(
                    (allocation) =>
                      allocation.memberId ===
                      member.id
                  );

                const allocation =
                  existing ??
                  createExpenseAllocationForm(
                    member.id
                  );

                const personalItems =
                  splitMethod ===
                  "shared-personal"
                    ? normalizePersonalItems(
                        allocation
                      )
                    : [];

                return {
                  ...allocation,

                  allocatedAmount:
                    splitMethod ===
                      "exact" ||
                    splitMethod ===
                      "submeter"
                      ? allocation
                          .allocatedAmount
                      : 0,

                  personalItems,

                  personalAmount:
                    calculatePersonalItemsTotal(
                      personalItems
                    ),
                };
              }
            ),
    }));

    setErrors((current) => {
      const nextErrors = {
        ...current,
      };

      delete nextErrors.splitMethod;
      delete nextErrors.allocations;

      return nextErrors;
    });

    setMessage("");
  };

  const updateAllocation = (
    memberId: string,
    changes: Partial<ExpenseAllocationForm>
  ) => {
    setForm((current) => ({
      ...current,

      allocations:
        current.allocations.map(
          (allocation) =>
            allocation.memberId ===
            memberId
              ? {
                  ...allocation,
                  ...changes,
                }
              : allocation
        ),
    }));

    clearAllocationError();
  };

  const updatePersonalItems = (
    memberId: string,
    updater: (
      items: PersonalExpenseItem[]
    ) => PersonalExpenseItem[]
  ) => {
    setForm((current) => ({
      ...current,

      allocations:
        current.allocations.map(
          (allocation) => {
            if (
              allocation.memberId !==
              memberId
            ) {
              return allocation;
            }

            const nextItems =
              updater(
                allocation.personalItems ??
                  []
              );

            return {
              ...allocation,

              personalItems:
                nextItems,

              personalAmount:
                calculatePersonalItemsTotal(
                  nextItems
                ),
            };
          }
        ),
    }));

    clearAllocationError();
  };

  const handleIncludedChange = (
    memberId: string,
    isIncluded: boolean
  ) => {
    updateAllocation(
      memberId,
      {
        isIncluded,

        allocatedAmount: 0,

        personalAmount: 0,

        personalItems: [],
      }
    );
  };

  const handleAllocationAmountChange = (
    memberId: string,
    amount: number
  ) => {
    updateAllocation(
      memberId,
      {
        allocatedAmount:
          amount,
      }
    );
  };

  const handleAddPersonalItem = (
    memberId: string
  ) => {
    updatePersonalItems(
      memberId,
      (items) => [
        ...items,
        createPersonalExpenseItem(),
      ]
    );
  };

  const handlePersonalItemChange = (
    memberId: string,
    itemId: string,
    changes: Partial<PersonalExpenseItem>
  ) => {
    updatePersonalItems(
      memberId,
      (items) =>
        items.map(
          (item) =>
            item.id === itemId
              ? {
                  ...item,
                  ...changes,
                }
              : item
        )
    );
  };

  const handlePersonalItemAmountChange = (
    memberId: string,
    itemId: string,
    amount: number
  ) => {
    handlePersonalItemChange(
      memberId,
      itemId,
      {
        amount,
      }
    );
  };

  const handleRemovePersonalItem = (
    memberId: string,
    itemId: string
  ) => {
    updatePersonalItems(
      memberId,
      (items) =>
        items.filter(
          (item) =>
            item.id !== itemId
        )
    );
  };

  const clearAttachmentError =
    () => {
      setErrors((current) => {
        if (!current.attachments) {
          return current;
        }

        const nextErrors = {
          ...current,
        };

        delete nextErrors.attachments;

        return nextErrors;
      });

      setMessage("");
    };

  const setAttachmentError = (
    attachmentError: string
  ) => {
    const nextErrors = {
      attachments:
        attachmentError,
    };

    setErrors((current) => ({
      ...current,
      ...nextErrors,
    }));

    setMessage(
      "Unable to add attachment."
    );

    setAttachmentStatus("");

    showValidationAlert(
      nextErrors,
      attachmentError
    );
  };

  const addAttachmentFiles =
    async (
      files: File[]
    ): Promise<void> => {
      if (files.length === 0) {
        return;
      }

      if (
        (form.attachments?.length ?? 0) +
          files.length >
        maximumAttachmentCount
      ) {
        setAttachmentError(
          `Add no more than ${maximumAttachmentCount} attachments.`
        );

        return;
      }

      for (
        const file of files
      ) {
        const mimeType =
          getAttachmentMimeType(
            file
          );

        if (
          !isAcceptedAttachmentFile(
            file
          )
        ) {
          setAttachmentError(
            "Attachments must be JPEG, PNG, WebP, or PDF files."
          );

          return;
        }

        if (
          file.size >
            maximumAttachmentSizeBytes &&
          !mimeType.startsWith(
            "image/"
          )
        ) {
          setAttachmentError(
            `${file.name} exceeds the 1 MB attachment limit.`
          );

          return;
        }
      }

      try {
        const attachments:
          StoredAttachment[] =
          [];

        for (
          const file of files
        ) {
          const mimeType =
            getAttachmentMimeType(
              file
            );

          const attachmentId =
            createAttachmentId();

          const objectUrl =
            URL.createObjectURL(file);

          pendingAttachmentFilesRef.current[
            attachmentId
          ] = file;

          localAttachmentUrlsRef.current[
            attachmentId
          ] = objectUrl;

          attachments.push({
            id:
              attachmentId,

            category:
              getDefaultAttachmentCategory(
                file.name
              ),

            fileName:
              file.name,

            mimeType:
              mimeType,

            sizeBytes:
              file.size,

            dataUrl:
              objectUrl,

            createdAt:
              new Date(),
          });
        }

        setForm((current) => ({
          ...current,

          attachments: [
            ...(current.attachments ?? []),
            ...attachments,
          ].slice(
            0,
            maximumAttachmentCount
          ),
        }));

        clearAttachmentError();
        setAttachmentStatus(
          `${attachments.length} attachment${
            attachments.length === 1
              ? ""
              : "s"
          } added.`
        );

        window.requestAnimationFrame(
          () => {
            attachmentSectionRef.current
              ?.scrollIntoView({
                block: "center",
                behavior: "smooth",
              });
          }
        );
      } catch (
        error
      ) {
        setAttachmentError(
          error instanceof Error
            ? error.message
            : "The selected attachment could not be read."
        );
      }
    };

  const handleAttachmentInputChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const files =
        Array.from(
          event.target.files ??
            []
        );

      await addAttachmentFiles(
        files
      );

      event.target.value =
        "";
    };

  const handleAttachmentPaste =
    async (
      event:
        ClipboardEvent<HTMLDivElement>
    ) => {
      if (isPreparingAttachments) {
        event.preventDefault();

        return;
      }

      const imageFiles =
        Array.from(
          event.clipboardData.items
        )
          .filter(
            (item) =>
              item.kind ===
                "file" &&
              item.type.startsWith(
                "image/"
              )
          )
          .map(
            (item) =>
              item.getAsFile()
          )
          .filter(
            (
              file
            ): file is File =>
              Boolean(file)
          );

      if (
        imageFiles.length === 0
      ) {
        setAttachmentError(
          "Clipboard does not contain a supported image."
        );

        return;
      }

      event.preventDefault();

      await addAttachmentFiles(
        imageFiles
      );
    };

  const handleAttachmentDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    if (isPreparingAttachments) {
      return;
    }

    event.preventDefault();
  };

  const handleAttachmentDrop =
    async (
      event: DragEvent<HTMLDivElement>
    ) => {
      if (isPreparingAttachments) {
        event.preventDefault();

        return;
      }

      const files =
        Array.from(
          event.dataTransfer.files
        );

      if (files.length === 0) {
        return;
      }

      event.preventDefault();

      await addAttachmentFiles(
        files
      );
    };

  const updateAttachmentCategory = (
    attachmentId: string,
    category:
      StoredAttachmentCategory
  ) => {
    setForm((current) => ({
      ...current,

      attachments:
        (current.attachments ?? []).map(
          (attachment) =>
            attachment.id ===
            attachmentId
              ? {
                  ...attachment,
                  category,
                }
              : attachment
        ),
    }));

    clearAttachmentError();
    setAttachmentStatus(
      "Attachment removed."
    );
  };

  const removeAttachment = (
    attachmentId: string
  ) => {
    const objectUrl =
      localAttachmentUrlsRef.current[
        attachmentId
      ];

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    delete pendingAttachmentFilesRef
      .current[attachmentId];

    delete localAttachmentUrlsRef
      .current[attachmentId];

    setForm((current) => ({
      ...current,

      attachments:
        (current.attachments ?? []).filter(
          (attachment) =>
            attachment.id !==
            attachmentId
        ),
    }));

    clearAttachmentError();
  };

  const resolvePendingAttachments =
    async (
      attachments:
        StoredAttachment[]
    ): Promise<StoredAttachment[]> => {
      const resolvedAttachments:
        StoredAttachment[] = [];

      for (const attachment of attachments) {
        const pendingFile =
          pendingAttachmentFilesRef
            .current[
              attachment.id
            ];

        if (!pendingFile) {
          resolvedAttachments.push(
            attachment
          );

          continue;
        }

        const preparedFile =
          await prepareAttachmentFile(
            pendingFile
          );

        if (
          preparedFile.sizeBytes >
          maximumAttachmentSizeBytes
        ) {
          throw new Error(
            `${pendingFile.name} is still larger than 1 MB after image preparation.`
          );
        }

        resolvedAttachments.push({
          ...attachment,

          dataUrl:
            preparedFile.dataUrl,

          mimeType:
            preparedFile.mimeType,

          sizeBytes:
            preparedFile.sizeBytes,
        });
      }

      return resolvedAttachments;
    };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    let submissionForm =
      form;

    if (isPreparingAttachments) {
      const nextErrors = {
        attachments:
          "Please wait until attachments finish preparing.",
      };

      setErrors((current) => ({
        ...current,
        ...nextErrors,
      }));

      setMessage(
        "Unable to save the transaction."
      );

      showValidationAlert(
        nextErrors
      );

      return;
    }

    if (
      form.type === "expense" &&
      form.splitMethod === "equal"
    ) {
      submissionForm = {
        ...form,

        allocations:
          form.allocations.map(
            (
              allocation,
              index
            ) => ({
              ...allocation,

              allocatedAmount:
                allocation.isIncluded
                  ? equalPreview[index] ??
                    0
                  : 0,

              personalAmount: 0,

              personalItems: [],
            })
          ),
      };
    }

    if (
      form.type === "expense" &&
      form.splitMethod ===
        "shared-personal"
    ) {
      const allocationsWithTotals =
        form.allocations.map(
          (allocation) => {
            if (!allocation.isIncluded) {
              return {
                ...allocation,

                allocatedAmount: 0,

                personalAmount: 0,

                personalItems: [],
              };
            }

            const personalItems =
              allocation.personalItems ??
              [];

            return {
              ...allocation,

              personalItems,

              personalAmount:
                calculatePersonalItemsTotal(
                  personalItems
                ),
            };
          }
        );

      const submissionPreview =
        calculateSharedPersonalPreview(
          form.amount,
          allocationsWithTotals
        );

      submissionForm = {
        ...form,

        allocations:
          allocationsWithTotals.map(
            (
              allocation,
              index
            ) => ({
              ...allocation,

              allocatedAmount:
                allocation.isIncluded
                  ? submissionPreview
                      .finalAmounts[
                        index
                      ] ?? 0
                  : 0,
            })
          ),
      };
    }

    try {
      setIsPreparingAttachments(
        true
      );

      submissionForm = {
        ...submissionForm,

        sourceAccountId:
          submissionForm.type ===
            "expense" &&
          isUnlinkedPaymentAccountOption(
            submissionForm.sourceAccountId
          )
            ? ""
            : submissionForm.sourceAccountId,

        attachments:
          await resolvePendingAttachments(
            submissionForm.attachments ?? []
          ),
      };
    } catch (error) {
      setAttachmentError(
        error instanceof Error
          ? error.message
          : "The selected attachment could not be prepared."
      );

      return;
    } finally {
      setIsPreparingAttachments(
        false
      );
    }

    setIsSavingTransaction(true);

    const result =
      await onSubmit(
        submissionForm
      );

    setIsSavingTransaction(false);

    if (!result.success) {
      setErrors(
        result.errors ?? {}
      );

      setMessage(
        result.message ??
          "Unable to save the transaction."
      );

      showValidationAlert(
        result.errors,
        result.message ??
          "Unable to save the transaction."
      );

      return;
    }

    setErrors({});
    setValidationAlertErrors({});
    setIsValidationAlertOpen(false);
    setMessage(
      result.message ?? ""
    );

    clearPendingAttachments();
  };

  const showAllocationAmountInputs =
    form.splitMethod === "exact" ||
    form.splitMethod === "submeter";

  const showPersonalItemInputs =
    form.splitMethod ===
    "shared-personal";

  const normalizedCategory =
    normalizeTransactionCategory(
      form.category
    );

  const isUtilityCategory =
    normalizedCategory ===
      "Electricity" ||
    normalizedCategory === "Water";

  const selectedCategoryValue =
    isCanonicalTransactionCategory(
      form.category
    )
      ? form.category
      : normalizeTransactionCategory(
          form.category
        );

  const showCustomCategoryInput =
    selectedCategoryValue === "Other";

  return (
    <form
      onSubmit={handleSubmit}
      className="hfos-transaction-form space-y-6 rounded-lg border bg-white p-6"
    >
      <FormValidationAlert
        open={isValidationAlertOpen}
        errors={validationAlertErrors}
        fieldLabels={
          transactionFieldLabels
        }
        onClose={() =>
          setIsValidationAlertOpen(
            false
          )
        }
      />

      {message && (
        <div
          className={
            Object.keys(errors).length > 0
              ? "rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground"
          }
        >
          {message}
        </div>
      )}

      {errors.general && (
        <p className="text-sm text-destructive">
          {errors.general}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="transaction-type"
            className="text-sm font-medium text-foreground"
          >
            Transaction Type
          </label>

          <select
            id="transaction-type"
            value={form.type}
            onChange={handleTypeChange}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="income">
              Income
            </option>

            <option value="expense">
              Expense
            </option>

            <option value="transfer">
              Transfer
            </option>
          </select>

          {errors.type && (
            <p className="text-sm text-destructive">
              {errors.type}
            </p>
          )}
        </div>

        <div>
          <CurrencyInput
            id="transaction-amount"
            label={
              supportsCurrencyConversion
                ? `Entered Amount (${form.enteredCurrency || currency || "PHP"})`
                : "Amount"
            }
            min="0"
            value={form.amount}
            onValueChange={(nextValue) =>
              updateField(
                "amount",
                nextValue
              )
            }
            error={errors.amount}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
      </div>

      {supportsCurrencyConversion && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="transaction-entered-currency"
              className="text-sm font-medium text-foreground"
            >
              {transactionCurrencyLabel}
            </label>

            <select
              id="transaction-entered-currency"
              value={form.enteredCurrency}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  enteredCurrency:
                    event.target.value,
                  exchangeRateSource:
                    "manual",
                  exchangeRateProvider:
                    "",
                }))
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
            >
              {currencies
                .filter(
                  (option) =>
                    option.value
                )
                .map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
            </select>

            {errors.enteredCurrency && (
              <p className="text-sm text-destructive">
                {errors.enteredCurrency}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="transaction-exchange-rate"
              className="text-sm font-medium text-foreground"
            >
              Exchange Rate
            </label>

            <input
              id="transaction-exchange-rate"
              type="number"
              min="0.000001"
              step="0.000001"
              value={form.exchangeRate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  exchangeRate:
                    Number(
                      event.target.value
                    ),
                  exchangeRateEffectiveDate:
                    current.transactionDate,
                  exchangeRateSource:
                    "manual",
                  exchangeRateProvider:
                    "",
                }))
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
            />

            <p className="text-xs text-muted-foreground">
              Base currency value for 1 unit of the
              transaction currency.
            </p>

            {errors.exchangeRate && (
              <p className="text-sm text-destructive">
                {errors.exchangeRate}
              </p>
            )}
          </div>

          {form.enteredCurrency !==
            currency && (
            <CurrencyRateLookupButton
              fromCurrency={
                form.enteredCurrency ??
                currency ??
                "PHP"
              }
              toCurrency={
                currency ?? "PHP"
              }
              effectiveDate={
                form.transactionDate
              }
              onRateSelected={(rate) =>
                setForm(
                  (current) => ({
                    ...current,
                    exchangeRate:
                      rate.rate,
                    exchangeRateEffectiveDate:
                      rate.effectiveDate,
                    exchangeRateSource:
                      rate.source,
                    exchangeRateProvider:
                      rate.providerName ??
                      "",
                  })
                )
              }
            />
          )}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="transaction-member"
            className="text-sm font-medium text-foreground"
          >
            {form.type === "expense"
              ? "Paid By"
              : "Recorded By"}
          </label>

          <select
            id="transaction-member"
            value={form.paidByMemberId}
            onChange={handleMemberChange}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">
              Select household member
            </option>

            {memberOptions.map(
              (member) => (
                <option
                  key={member.id}
                  value={member.id}
                >
                  {member.displayName}
                  {member.isActive
                    ? ""
                    : " (inactive)"}
                </option>
              )
            )}
          </select>

          {errors.paidByMemberId && (
            <p className="text-sm text-destructive">
              {errors.paidByMemberId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="transaction-visibility"
            className="text-sm font-medium text-foreground"
          >
            Visibility
          </label>

          <select
            id="transaction-visibility"
            value={form.visibility}
            onChange={(event) =>
              updateField(
                "visibility",
                event.target
                  .value as TransactionFormData["visibility"]
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="household">
              Household
            </option>

            <option value="participants">
              Participants Only
            </option>

            <option value="private">
              Private
            </option>
          </select>

          {errors.visibility && (
            <p className="text-sm text-destructive">
              {errors.visibility}
            </p>
          )}
        </div>
      </div>

      {(form.type === "expense" ||
        form.type === "transfer") && (
        <div className="space-y-2">
          <label
            htmlFor="source-account"
            className="text-sm font-medium text-foreground"
          >
            {form.type === "expense"
              ? "Payment Account"
              : "Source Account"}
          </label>

          <select
            id="source-account"
            value={form.sourceAccountId}
            onChange={(event) =>
              handleSourceAccountChange(
                event
              )
            }
            disabled={
              !form.paidByMemberId
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {form.paidByMemberId
                ? form.type === "expense"
                  ? "Select payment account"
                  : "Select account"
                : "Select member first"}
            </option>

            {form.type === "expense" &&
              unlinkedPaymentAccountOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}

            {availableAccounts.map(
              (account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  {account.name} - {account.currency}
                  {account.visibility ===
                  "private"
                    ? " — Personal"
                    : ""}
                  {account.accountClass ===
                  "liability"
                    ? " — Liability"
                    : ""}
                </option>
              )
            )}
          </select>

          {errors.sourceAccountId && (
            <p className="text-sm text-destructive">
              {errors.sourceAccountId}
            </p>
          )}
        </div>
      )}

      {(form.type === "income" ||
        form.type === "transfer") && (
        <div className="space-y-2">
          <label
            htmlFor="destination-account"
            className="text-sm font-medium text-foreground"
          >
            Destination Account
          </label>

          <select
            id="destination-account"
            value={
              form.destinationAccountId
            }
            onChange={(event) =>
              handleDestinationAccountChange(
                event
              )
            }
            disabled={
              !form.paidByMemberId
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {form.paidByMemberId
                ? "Select destination account"
                : "Select member first"}
            </option>

            {availableAccounts.map(
              (account) => (
                <option
                  key={account.id}
                  value={account.id}
                  disabled={
                    form.type ===
                      "transfer" &&
                    account.id ===
                      form.sourceAccountId
                  }
                >
                  {account.name} - {account.currency}
                  {account.visibility ===
                  "private"
                    ? " — Personal"
                    : ""}
                  {account.accountClass ===
                  "liability"
                    ? " — Liability"
                    : ""}
                </option>
              )
            )}
          </select>

          {errors.destinationAccountId && (
            <p className="text-sm text-destructive">
              {errors.destinationAccountId}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="transaction-category"
            className="text-sm font-medium text-foreground"
          >
            Category
          </label>

          <select
            id="transaction-category"
            value={selectedCategoryValue}
            onChange={(event) =>
              updateField(
                "category",
                normalizeTransactionCategory(
                  event.target.value
                )
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">
              Select category
            </option>

            {transactionCategories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              )
            )}
          </select>

          {showCustomCategoryInput && (
            <div className="space-y-2">
              <label
                htmlFor="transaction-custom-category"
                className="text-sm font-medium text-foreground"
              >
                Other Category
              </label>

              <input
                id="transaction-custom-category"
                type="text"
                value={
                  form.category === "Other"
                    ? ""
                    : form.category
                }
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value ||
                      "Other"
                  )
                }
                placeholder="Example: Pet Care"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          )}

          {errors.category && (
            <p className="text-sm text-destructive">
              {errors.category}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="transaction-date"
            className="text-sm font-medium text-foreground"
          >
            Transaction Date
          </label>

          <input
            id="transaction-date"
            type="date"
            value={form.transactionDate}
            onChange={(event) =>
              {
                const transactionDate =
                  event.target.value;

                setForm((current) => ({
                  ...current,
                  transactionDate,
                  exchangeRateEffectiveDate:
                    current.exchangeRateSource ===
                    "api"
                      ? current.exchangeRateEffectiveDate
                      : transactionDate,
                }));

                setErrors((current) => {
                  if (
                    !current.transactionDate
                  ) {
                    return current;
                  }

                  const nextErrors = {
                    ...current,
                  };

                  delete nextErrors.transactionDate;

                  return nextErrors;
                });

                setMessage("");
              }
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          />

          {errors.transactionDate && (
            <p className="text-sm text-destructive">
              {errors.transactionDate}
            </p>
          )}
        </div>
      </div>

      {form.type === "expense" && (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="font-medium text-foreground">
              Divide Expense
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Choose which members participate and how
              the expense should be divided.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="split-method"
              className="text-sm font-medium text-foreground"
            >
              Split Method
            </label>

            <select
              id="split-method"
              value={form.splitMethod}
              onChange={
                handleSplitMethodChange
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="none">
                Individual Expense
              </option>

              <option value="equal">
                Divide Equally
              </option>

              <option value="shared-personal">
                Shared + Personal Items
              </option>

              <option value="exact">
                Enter Exact Amounts
              </option>

              {isUtilityCategory && (
                <option value="submeter">
                  Utility / Submeter Allocation
                </option>
              )}
            </select>

            {errors.splitMethod && (
              <p className="text-sm text-destructive">
                {errors.splitMethod}
              </p>
            )}
          </div>

          {form.splitMethod !==
            "none" && (
            <div className="space-y-3">
              {form.allocations.map(
                (
                  allocation,
                  index
                ) => {
                  const member =
                    resolveMemberReference(
                      members,
                      allocation.memberId
                    );

                  return (
                    <div
                      key={
                        allocation.memberId
                      }
                      className="rounded-md border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {member?.displayName ??
                              "Unknown Member"}
                          </p>

                          {form.splitMethod ===
                            "equal" &&
                            allocation.isIncluded && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                Equal share:{" "}
                                {formatAmount(
                                  equalPreview[
                                    index
                                  ] ?? 0,
                                  currency
                                )}
                              </p>
                            )}

                          {form.splitMethod ===
                            "shared-personal" &&
                            allocation.isIncluded && (
                              <div className="mt-1 space-y-1 text-sm">
                                <p className="text-muted-foreground">
                                  Common share:{" "}
                                  {formatAmount(
                                    sharedPersonalPreview
                                      .commonShareAmounts[
                                        index
                                      ] ?? 0,
                                    currency
                                  )}
                                </p>

                                <p className="font-medium text-foreground">
                                  Final share:{" "}
                                  {formatAmount(
                                    sharedPersonalPreview
                                      .finalAmounts[
                                        index
                                      ] ?? 0,
                                    currency
                                  )}
                                </p>
                              </div>
                            )}

                          {!allocation.isIncluded && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Opted out — allocation is 0.00
                            </p>
                          )}
                        </div>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={
                              allocation.isIncluded
                            }
                            onChange={(
                              event
                            ) =>
                              handleIncludedChange(
                                allocation.memberId,
                                event.target
                                  .checked
                              )
                            }
                            className="h-4 w-4 rounded border"
                          />

                          <span className="text-sm text-foreground">
                            Included
                          </span>
                        </label>
                      </div>

                      {showPersonalItemInputs &&
                        allocation.isIncluded && (
                          <div className="mt-4 space-y-3 rounded-md bg-muted/30 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Personal Items
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  Add items used only by this member.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleAddPersonalItem(
                                    allocation.memberId
                                  )
                                }
                                className="rounded-md border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                              >
                                Add Personal Item
                              </button>
                            </div>

                            {allocation.personalItems
                              .length === 0 && (
                              <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                                No personal items added.
                              </p>
                            )}

                            {allocation.personalItems.map(
                              (
                                item,
                                itemIndex
                              ) => (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="grid gap-3 rounded-md border bg-background p-3 md:grid-cols-[minmax(0,1fr)_10rem_auto]"
                                >
                                  <div className="space-y-2">
                                    <label
                                      htmlFor={`personal-item-description-${item.id}`}
                                      className="text-xs font-medium text-foreground"
                                    >
                                      Item{" "}
                                      {itemIndex +
                                        1}
                                    </label>

                                    <input
                                      id={`personal-item-description-${item.id}`}
                                      type="text"
                                      value={
                                        item.description
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handlePersonalItemChange(
                                          allocation.memberId,
                                          item.id,
                                          {
                                            description:
                                              event
                                                .target
                                                .value,
                                          }
                                        )
                                      }
                                      placeholder="Example: Shampoo"
                                      className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                  </div>

                                  <div>
                                    <CurrencyInput
                                      id={`personal-item-amount-${item.id}`}
                                      label="Amount"
                                      min="0"
                                      value={
                                        item.amount
                                      }
                                      onValueChange={(
                                        nextValue
                                      ) =>
                                        handlePersonalItemAmountChange(
                                          allocation.memberId,
                                          item.id,
                                          nextValue
                                        )
                                      }
                                      className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                  </div>

                                  <div className="flex items-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemovePersonalItem(
                                          allocation.memberId,
                                          item.id
                                        )
                                      }
                                      className="w-full rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 md:w-auto"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              )
                            )}

                            {allocation.personalItems
                              .length > 0 && (
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddPersonalItem(
                                      allocation.memberId
                                    )
                                  }
                                  className="rounded-md border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                                >
                                  Add Another Personal Item
                                </button>
                              </div>
                            )}

                            <div className="flex items-center justify-between border-t pt-3 text-sm">
                              <span className="text-muted-foreground">
                                Personal Subtotal
                              </span>

                              <span className="font-semibold text-foreground">
                                {formatAmount(
                                  allocation.personalAmount,
                                  currency
                                )}
                              </span>
                            </div>
                          </div>
                        )}

                      {showAllocationAmountInputs &&
                        allocation.isIncluded && (
                          <div className="mt-4">
                            <CurrencyInput
                              id={`allocation-${allocation.memberId}`}
                              label="Allocated Amount"
                              min="0"
                              value={
                                allocation.allocatedAmount
                              }
                              onValueChange={(
                                nextValue
                              ) =>
                                handleAllocationAmountChange(
                                  allocation.memberId,
                                  nextValue
                                )
                              }
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                            />
                          </div>
                        )}

                      <div className="mt-4 space-y-2">
                        <label
                          htmlFor={`allocation-note-${allocation.memberId}`}
                          className="text-sm font-medium text-foreground"
                        >
                          Allocation Note
                        </label>

                        <input
                          id={`allocation-note-${allocation.memberId}`}
                          type="text"
                          value={
                            allocation.notes
                          }
                          onChange={(
                            event
                          ) =>
                            updateAllocation(
                              allocation.memberId,
                              {
                                notes:
                                  event.target
                                    .value,
                              }
                            )
                          }
                          placeholder={
                            allocation.isIncluded
                              ? "Optional note"
                              : "Reason for opting out"
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </div>
                    </div>
                  );
                }
              )}

              {form.splitMethod ===
                "shared-personal" && (
                <div className="space-y-3 rounded-md bg-muted/40 px-4 py-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Total Expense
                    </span>

                    <span className="font-medium text-foreground">
                      {formatAmount(
                        form.amount,
                        currency
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Personal Items Total
                    </span>

                    <span className="font-medium text-foreground">
                      {formatAmount(
                        sharedPersonalPreview
                          .personalTotal,
                        currency
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Common Items Amount
                    </span>

                    <span className="font-medium text-foreground">
                      {formatAmount(
                        sharedPersonalPreview
                          .commonAmount,
                        currency
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Participating Members
                    </span>

                    <span className="font-medium text-foreground">
                      {
                        sharedPersonalPreview
                          .includedCount
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t pt-3">
                    <span className="font-medium text-foreground">
                      Final Allocation Total
                    </span>

                    <span className="font-semibold text-foreground">
                      {formatAmount(
                        sharedPersonalFinalTotal,
                        currency
                      )}{" "}
                      /{" "}
                      {formatAmount(
                        form.amount,
                        currency
                      )}
                    </span>
                  </div>

                  {sharedPersonalPreview
                    .isOverAmount && (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                      Personal items exceed the total
                      expense by{" "}
                      {formatAmount(
                        sharedPersonalPreview
                          .excessAmount,
                        currency
                      )}
                      .
                    </p>
                  )}
                </div>
              )}

              {showAllocationAmountInputs && (
                <div className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Allocation Total
                  </span>

                  <span className="font-semibold text-foreground">
                    {formatAmount(
                      enteredAllocationTotal,
                      currency
                    )}{" "}
                    /{" "}
                    {formatAmount(
                      form.amount,
                      currency
                    )}
                  </span>
                </div>
              )}

              {errors.allocations && (
                <p className="text-sm text-destructive">
                  {errors.allocations}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="transaction-description"
          className="text-sm font-medium text-foreground"
        >
          Description
        </label>

        <input
          id="transaction-description"
          type="text"
          value={form.description}
          onChange={(event) =>
            updateField(
              "description",
              event.target.value
            )
          }
          placeholder="Describe this transaction"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
        />

        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="transaction-notes"
          className="text-sm font-medium text-foreground"
        >
          Notes
        </label>

        <textarea
          id="transaction-notes"
          rows={4}
          value={form.notes}
          onChange={(event) =>
            updateField(
              "notes",
              event.target.value
            )
          }
          placeholder="Optional notes"
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <section
        ref={attachmentSectionRef}
        className="space-y-4 rounded-lg border p-4"
      >
        <div>
          <h3 className="font-medium text-foreground">
            Receipts and Bills
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Add JPEG, PNG, WebP, or PDF files. Paste
            clipboard images, drop files here, or choose
            files from your device.
          </p>
        </div>

        <div
          tabIndex={0}
          role="group"
          aria-disabled={
            isPreparingAttachments
          }
          onPaste={
            handleAttachmentPaste
          }
          onDragOver={
            handleAttachmentDragOver
          }
          onDrop={
            handleAttachmentDrop
          }
          className={`rounded-md border border-dashed bg-muted/20 px-4 py-5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            isPreparingAttachments
              ? "cursor-wait opacity-70"
              : "cursor-default hover:bg-muted/40"
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {isPreparingAttachments
                  ? "Preparing attachment..."
                  : "Add receipts or bills"}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Paste an image, drop files, or select up to{" "}
                {maximumAttachmentCount} files. Each file
                must be 1 MB or smaller.
              </p>
            </div>

            <label
              htmlFor="transaction-attachment-input"
              className="inline-flex cursor-pointer justify-center rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Choose Files
            </label>
          </div>

          <input
            id="transaction-attachment-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            className="sr-only"
            disabled={
              isPreparingAttachments
            }
            onChange={
              handleAttachmentInputChange
            }
          />

          <p className="mt-3 text-xs text-muted-foreground">
            {(form.attachments?.length ?? 0)} of{" "}
            {maximumAttachmentCount} attachments added.
            Images are compressed on save.
          </p>

          {attachmentStatus && (
            <p
              role="status"
              className="mt-2 text-sm text-foreground"
            >
              {attachmentStatus}
            </p>
          )}
        </div>

        {isPreparingAttachments && (
          <p
            role="status"
            className="text-sm text-muted-foreground"
          >
            Preparing attachment. Tall receipt images and PDFs may take a few seconds.
          </p>
        )}

        {(form.attachments?.length ?? 0) ===
        0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            No receipt or bill attached.
          </p>
        ) : (
          <div className="space-y-3">
            {(form.attachments ?? []).map(
              (attachment) => {
                const hasPreview =
                  hasAttachmentPreviewData(
                    attachment
                  );

                return (
                <article
                  key={
                    attachment.id
                  }
                  className="grid gap-4 rounded-md border p-3 md:grid-cols-[6rem_minmax(0,1fr)_auto]"
                >
                  <div className="flex h-24 items-center justify-center overflow-hidden rounded-md bg-muted">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {attachment.mimeType.startsWith(
                        "image/"
                      )
                        ? "IMG"
                        : "PDF"}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="truncate text-sm font-medium text-foreground">
                        {
                          attachment.fileName
                        }
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatFileSize(
                          attachment.sizeBytes
                        )}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor={`attachment-category-${attachment.id}`}
                        className="text-xs font-medium text-foreground"
                      >
                        Document Type
                      </label>

                      <select
                        id={`attachment-category-${attachment.id}`}
                        value={
                          attachment.category
                        }
                        onChange={(event) =>
                          updateAttachmentCategory(
                            attachment.id,
                            event.target
                              .value as StoredAttachmentCategory
                          )
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                      >
                        <option value="receipt">
                          Receipt
                        </option>

                        <option value="bill">
                          Bill
                        </option>

                        <option value="other">
                          Other
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 md:flex-col">
                    {hasPreview ? (
                      <button
                        type="button"
                        onClick={() =>
                          openAttachmentPreview(
                            attachment
                          )
                        }
                        className="rounded-md border px-3 py-2 text-center text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Open
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Preview unavailable in cloud beta.
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeAttachment(
                          attachment.id
                        )
                      }
                      className="rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </button>
                  </div>
                </article>
                );
              }
            )}
          </div>
        )}

        {errors.attachments && (
          <p className="text-sm text-destructive">
            {errors.attachments}
          </p>
        )}
      </section>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) =>
            updateField(
              "isActive",
              event.target.checked
            )
          }
          className="h-4 w-4 rounded border"
        />

        <span className="text-sm text-foreground">
          Active transaction
        </span>
      </label>

      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
        {onCancel && (
          <button
          type="button"
          onClick={onCancel}
          disabled={
            isPreparingAttachments ||
            isSavingTransaction
          }
          className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={
            isPreparingAttachments ||
            isSavingTransaction
          }
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {isPreparingAttachments
            ? "Preparing..."
            : isSavingTransaction
              ? "Saving..."
            : submitLabel}
        </button>
      </div>
    </form>
  );
}
