import { configureStore } from "@reduxjs/toolkit";
import moduleFiltersReducer from "./moduleFiltersSlice";
import usersReducer from "@modules/users/data/users.slice"
import customersReducer from "@modules/customer/data/customer.slice";
import productsReducer from "@modules/products/data/products.slice";
import categoriesReducer from "@modules/category/data/categories.slice";
import amcManagementReducer from "@modules/amc-reminders/data/amcReminder.slice";
import companyMasterReducer from "@modules/company-master/data/companyMaster.slice";
import menuMasterReducer from "@modules/menu-master/data/menuMaster.slice";
import ticketsReducer from "@modules/tickets/data/tickets.slice";
import amcticketsReducer from "@modules/amc-tickets/data/anctickets.slice";
import subscriptionsReducer from "@modules/subscription-plans/data/subscriptions.slice";
import feedbacksReducer from "@modules/feedbacks/data/feedbacks.slice.js";
export const store = configureStore({
  reducer: {
    moduleFilters: moduleFiltersReducer,
    users: usersReducer,
    customers: customersReducer,
    products: productsReducer,
    categories: categoriesReducer,
    amcManagement: amcManagementReducer,
    companyMaster: companyMasterReducer,
    menuMaster: menuMasterReducer,
    tickets: ticketsReducer,
    amctickets: amcticketsReducer,
    subscriptions: subscriptionsReducer,
    feedbacks: feedbacksReducer,
  },
});

export default store;
