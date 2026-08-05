import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";
import { z } from "zod";

const FIXED_TABLE_COLUMNS = [
  // { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
];
export const feedbacksModuleSchema = {
  title: "Reviews",
  description: "Monitor customer ratings, comments, and resolution status in one place.",
  menu_id: 20,
  primaryKey: 'adminID',
  api: {
    list: "/reviews",
    definitions: "/system/getDefinations",
    definitionsFallback: "/system/getstructure",
  },
  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "user",
  },
  staticJoined: [],
  defaultColumns: [
    'client_id',
    'rating',
    'comment',
    'is_resolved',
    'ticket_id',
  ],
  skipFields: ['feedback_submitted', 'feedback_id','submitted_at','feedback_submitted'],
  tableCellConfig: [],
  columnMappings: [
    { ticket_id: "Ticket No" },
    { client_id: "Client Name" },
    { rating: "Rating" },
    { is_resolved: "Resolved" },
    { comment: "Comment" },
    { submitted_at: "Submitted At" },
    { feedback_submitted: "Feedback Submitted" },
  ],
  savedFilters: [],
  form: {
    initialValues: {},
    sections: []
  },
  validationSchema: z.object({})
};

export const feedbacksFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(feedbacksModuleSchema.defaultColumns, {
    columnMappings: feedbacksModuleSchema.columnMappings,
    tableCellConfig: feedbacksModuleSchema.tableCellConfig,
  }),
];
