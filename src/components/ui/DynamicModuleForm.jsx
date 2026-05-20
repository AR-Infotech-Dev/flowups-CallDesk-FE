import Input from "../form-inputs/Input";
import Radio from "../form-inputs/Radio";
import Select from "../form-inputs/Select";
import TextArea from "../form-inputs/TextArea";
import RichTextEditor from "../form-inputs/RichTextEditor";
import SmartSelect from "../form-inputs/smartSelect";
import SmartSelectInput from "../form-inputs/smartSelectInput";
import ColorSwatches from "../form-inputs/ColorSwatches";
import IconPicker from "../form-inputs/IconPicker";
import { useAuth } from "../../auth/AuthProvider";
import { hasFieldEditablePermission, hasFieldVisiblePermission } from "../../auth/permissions";

const SECTION_COLUMN_CLASS = {
  1: "grid grid-cols-12 gap-x-4 gap-y-5",
  2: "grid grid-cols-12 gap-x-4 gap-y-5",
  3: "grid grid-cols-12 gap-x-4 gap-y-5",
  4: "grid grid-cols-12 gap-x-4 gap-y-5",
};

const FIELD_SPAN_CLASS = {
  1: "col-span-12 md:col-span-1",
  2: "col-span-12 md:col-span-2",
  3: "col-span-12 md:col-span-3",
  4: "col-span-12 md:col-span-4",
  5: "col-span-12 md:col-span-5",
  6: "col-span-12 md:col-span-6",
  7: "col-span-12 md:col-span-7",
  8: "col-span-12 md:col-span-8",
  9: "col-span-12 md:col-span-9",
  10: "col-span-12 md:col-span-10",
  11: "col-span-12 md:col-span-11",
  12: "col-span-12",
};

function DynamicModuleForm({ sections = [], values = {}, onChange, onObjectSelect, addNewHandlers = {}, errors = {}, oldValues = {}, mode = '', menuId }) {
  const { authSession } = useAuth();
  const user = authSession?.user;

  const getConditionalFlag = (field, key) => {
    const flag = field[key];
    return typeof flag === "function" ? Boolean(flag(values)) : Boolean(flag);
  };

  const renderField = (field) => {
    const value = values[field.name] ?? "";
    const emitValueChange = (nextValue) => {
      onChange?.({
        target: {
          name: field.name,
          value: nextValue,
        },
      });
    };

    switch (field.type) {
      case "radio":
        return <Radio field={field} value={value} onChange={onChange} error={errors[field.name]} />
        break;
      case "select":
        return <Select field={field} onChange={onChange} value={value} error={errors[field.name]} />
        break;
      case "textarea":
        return <TextArea field={field} onChange={onChange} value={value} error={errors[field.name]} />;
        break;
      case "editor":
        return <RichTextEditor field={field} onChange={onChange} value={value} error={errors[field.name]} />;
        break;
      case "smartSelect":
        return <SmartSelect field={field} value={value} onSelect={onChange} config={field.config} error={errors[field.name]} />
        break;
      case "smartSelectInput":
        return <SmartSelectInput
          id={field.id || field.name}
          field={field}
          value={value}
          onSelect={emitValueChange}
          onObjectSelect={(item) => onObjectSelect?.(field, item)}
          addNewFunction={addNewHandlers[field.name]}
          config={field.config}
          error={errors[field.name]}
        />;
        break;
      case "colorSwatches":
        return <ColorSwatches field={field} onChange={onChange} value={value} error={errors[field.name]} />;
        break;
      case "iconPicker":
        return <IconPicker field={field} onChange={onChange} value={value} error={errors[field.name]} />;
        break;
      default:
        return <Input field={field} onChange={onChange} value={value} error={errors[field.name]} />
        break;
    }
  };

  return (
    <div className="space-y-5">
      {sections.map((section, sectionIndex) => {
        const Icon = section.icon; 
        return (
          <>
            {section.title &&
              <div className={`flex text-md font-semibold items-center mb-1 ${sectionIndex != 0 && "mt-4"}`}  >
                {Icon && <Icon className="m1 mr-2" size={15} />}
                <h4 className="">{section.title || ''}</h4>
              </div>
            }
            <div key={`section-${sectionIndex}`} className={`mb-2 ${SECTION_COLUMN_CLASS[section.columns] || SECTION_COLUMN_CLASS[2]}`}>
              {section.fields.map((field) => {
                const isVisible = field.visibleWhen
                  ? field.visibleWhen(values, oldValues, mode)
                  : true;

                if (!isVisible) return null;
                const canViewField = hasFieldVisiblePermission({ menuId, field, user });
                if (!canViewField) return null;

                const canEditField = hasFieldEditablePermission({ menuId, field, user });
                const isDisabled = getConditionalFlag(field, "disabled") || getConditionalFlag(field, "disabledWhen");
                const isReadOnly =
                  getConditionalFlag(field, "readOnly") ||
                  getConditionalFlag(field, "readonly") ||
                  getConditionalFlag(field, "readOnlyWhen") ||
                  getConditionalFlag(field, "readonlyWhen");
                const resolvedField = {
                  ...field,
                  disabled: isDisabled,
                  readOnly: isReadOnly || !canEditField,
                };
                const sectionColumns = Number(section.columns) || 2;
                const defaultSpan = Math.max(1, Math.floor(12 / sectionColumns));
                const fieldSpan = Number(field.gridSpan || field.columns || defaultSpan);

                return (
                  <div key={field.name} className={`w-full ${FIELD_SPAN_CLASS[fieldSpan] || FIELD_SPAN_CLASS[defaultSpan]}`}>
                    {renderField(resolvedField)}
                  </div>
                )
              })}
            </div>
          </>
        )
      })}
    </div>
  );
}

export default DynamicModuleForm;
