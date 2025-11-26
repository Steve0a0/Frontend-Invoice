export const DEFAULT_EMAIL_DELIVERY_METHOD = "custom";

export const EMAIL_DELIVERY_OPTIONS = [
    {
        value: "custom",
        title: "Send using my email",
        description: "Use your business email with an app password so invoices come directly from you.",
        badge: "Requires app password",
    },
    {
        value: "default",
        title: "InvoiceGen secure delivery",
        description: "Send invoices from InvoiceGen's delivery address without sharing credentials. We'll CC your business email and set it as reply-to automatically.",
        badge: "No setup needed",
    },
];
