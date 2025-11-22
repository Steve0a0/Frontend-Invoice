export const BANK_REGION_CONFIG = {
  eu: {
    value: "eu",
    label: "International / EU (SEPA)",
    description: "Use IBAN and BIC/SWIFT codes for cross-border transfers.",
    fields: [
      {
        name: "iban",
        label: "IBAN",
        placeholder: "IE29 AIBK 9311 5212 3456 78",
      },
      {
        name: "bic",
        label: "BIC / SWIFT Code",
        placeholder: "AIBKIE2D",
      },
    ],
  },
  uk: {
    value: "uk",
    label: "United Kingdom",
    description: "Standard UK domestic bank transfer details.",
    fields: [
      {
        name: "sortCode",
        label: "Sort Code",
        placeholder: "12-34-56",
      },
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "12345678",
      },
    ],
  },
  us: {
    value: "us",
    label: "United States",
    description: "ACH / wire transfer details.",
    fields: [
      {
        name: "routingNumber",
        label: "Routing Number",
        placeholder: "021000021",
      },
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "123456789",
      },
      {
        name: "swiftCode",
        label: "SWIFT Code",
        placeholder: "CHASUS33",
      },
    ],
  },
};

export const detectBankRegion = (details = {}) => {
  if (!details) return "eu";
  if (details.iban || details.bic) return "eu";
  if (details.sortCode) return "uk";
  if (details.routingNumber) return "us";
  return "eu";
};
