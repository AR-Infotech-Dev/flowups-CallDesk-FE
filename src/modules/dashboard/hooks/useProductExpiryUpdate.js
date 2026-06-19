import { useCallback, useEffect, useMemo, useState } from "react";
import { parseCustomerProducts, productMatchesAlert } from "../utils/dashboard.utils";
import { getProduct, updateProductExpiry } from "../data/dashboard.service"
import { toast } from "react-toastify";

export const useProductExpiryUpdate = ({loadDashboard}) => {
    const [expiryModal, setExpiryModal] = useState({
        alert: null,
        customer: null,
        expiryDate: "",
        error: "",
        loading: false,
        saving: false,
    });


    const openProductExpiryModal = async (alert) => {
        setExpiryModal({
            alert,
            customer: null,
            expiryDate: String(alert.expiry_date || "").slice(0, 10),
            error: "",
            loading: true,
            saving: false,
        });

        const res = await getProduct(alert.customer_id);

        if (!res?.success) {
            toast.error(res?.message || "Unable to load customer products");
            setExpiryModal((current) => ({ ...current, loading: false }));
            return;
        }

        setExpiryModal((current) => ({
            ...current,
            customer: res.data || {},
            loading: false,
        }));
    };

    const closeProductExpiryModal = () => {
        setExpiryModal({
            alert: null,
            customer: null,
            expiryDate: "",
            error: "",
            loading: false,
            saving: false,
        });
    };

    const validateExpiryDate = (expiryDate, currentExpiry = "") => {
        if (!expiryDate) return "Expiry date is required";

        const selectedDate = new Date(`${expiryDate}T00:00:00`);
        if (Number.isNaN(selectedDate.getTime())) return "Select a valid expiry date";

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) return "Expiry date cannot be in the past";

        const currentExpiryValue = String(currentExpiry || "").slice(0, 10);
        const currentExpiryDate = currentExpiryValue ? new Date(`${currentExpiryValue}T00:00:00`) : null;
        if (currentExpiryDate && !Number.isNaN(currentExpiryDate.getTime()) && currentExpiryDate >= today && selectedDate < currentExpiryDate) {
            return "New expiry date cannot be before current expiry date";
        }

        return "";
    };

    const saveProductExpiry = async () => {
        const { alert, customer, expiryDate } = expiryModal;
        if (!alert?.customer_id || !customer || !expiryDate) return;

        const validationError = validateExpiryDate(expiryDate, alert.expiry_date);
        if (validationError) {
            setExpiryModal((current) => ({ ...current, error: validationError }));
            toast.error(validationError);
            return;
        }

        const products = parseCustomerProducts(customer.customer_products || customer.products);
        const matchedIndex = products.findIndex((product) => productMatchesAlert(product, alert));

        if (matchedIndex < 0) {
            toast.error("Product not found in customer products");
            return;
        }

        const customerProducts = products.map((product, index) => (
            index === matchedIndex
                ? { ...product, expiry_date: expiryDate }
                : product
        ));

        setExpiryModal((current) => ({ ...current, saving: true }));

        const payload = {
            ...customer,
            customer_products: customerProducts,
        };
        delete payload.products;
        delete payload.product_ids;

        const res = await updateProductExpiry(alert.customer_id, payload);

        if (!res?.success) {
            toast.error(res?.message || "Unable to update product expiry");
            setExpiryModal((current) => ({ ...current, saving: false }));
            return;
        }

        toast.success("Product expiry updated");
        closeProductExpiryModal();
        loadDashboard();
    };

    return{
        openProductExpiryModal,
        expiryModal,
        setExpiryModal,
        closeProductExpiryModal,
        saveProductExpiry,
        validateExpiryDate
    }
}