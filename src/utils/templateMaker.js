import Handlebars from "handlebars";

import customerReportTemplate from "../templates/customerReport.excel.hbs?raw";

const templates = {
    "customerReport.excel": customerReportTemplate,
};

export const renderTemplate = (templateName, data = {}) => {
    const source = templates[templateName];
    const template = Handlebars.compile(source);
    return template(data);
};