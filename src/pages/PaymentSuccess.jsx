import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { usePaymentManagement } from "../context/PaymentContext";
import { API_BASE_URL } from '../config/api';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [countdown, setCountdown] = useState(5);
    const { paymentManagementEnabled } = usePaymentManagement();

    useEffect(() => {
        // Redirect to dashboard if payment management is disabled
        if (!paymentManagementEnabled) {
            navigate("/dashboard");
            return;
        }

        const invoiceId = searchParams.get("invoiceId");
        if (invoiceId) {
            // ✅ 1. Update invoice status
            fetch(`${API_BASE_URL}/api/stripe/success?invoiceId=${invoiceId}`)
                .then(res => res.json())
                .then(data => console.log("Invoice marked as paid:", data))
                .catch(err => console.error("Status update error:", err));

            // ✅ 2. Fetch invoice details
            fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`)
                .then(res => res.json())
                .then(data => {
                    setInvoice(data);
                })
                .catch(err => {
                    console.error("Failed to fetch invoice data:", err);
                });
        }

        // ✅ Countdown logic
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        const redirectTimer = setTimeout(() => {
            navigate("/dashboard");
        }, 5000);

        return () => {
            clearInterval(timer);
            clearTimeout(redirectTimer);
        };
    }, [searchParams, navigate, paymentManagementEnabled]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
            <div className="bg-green-600 p-4 rounded-full">
                <FaCheckCircle size={50} className="text-white" />
            </div>

            <h2 className="text-3xl font-bold mt-4">Payment Successful!</h2>
            <p className="mt-2 text-gray-400 text-center px-4">
                Thank you for your payment. Your transaction has been completed successfully.
            </p>

            {/* ✅ Real Transaction Details */}
            {invoice ? (
                <div className="bg-green-800 text-white p-4 rounded-lg mt-6 w-80 text-center">
                    <h3 className="font-semibold">Transaction Details</h3>
                    <p>Invoice #: <span className="font-bold">{invoice.id}</span></p>
                    <p>Amount: <span className="font-bold">${Number(invoice.totalAmount).toFixed(2)}</span></p>
                    <p>Date: <span className="font-bold">{new Date(invoice.date).toLocaleDateString()}</span></p>
                </div>
            ) : (
                <div className="mt-6 text-gray-400">Loading invoice details...</div>
            )}

            <p className="mt-4 text-gray-400 text-sm">
                Redirecting to dashboard in <span className="font-bold">{countdown}</span> seconds...
            </p>
        </div>
    );
};

export default PaymentSuccess;

