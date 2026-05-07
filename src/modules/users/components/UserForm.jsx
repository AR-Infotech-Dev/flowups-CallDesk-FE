import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { makeRequest } from "../../../api/httpClient";
import { usersModuleSchema } from "../data/module.schema";
import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import ActionButton from "../../../components/ui/ActionButton";
import Spinner from "../../../components/ui/Spinner";
import DynamicModuleForm from "../../../components/ui/DynamicModuleForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

function buildJoinedOptions(joinConfig, selectedValue, selectedLabel) {
  const configuredOptions = (joinConfig?.options || []).map((option) => ({
    value: option.value ?? option[joinConfig.primaryKey],
    label: option.label ?? option[joinConfig.labelKey],
  }));

  if (selectedValue && !configuredOptions.some((option) => String(option.value) === String(selectedValue))) {
    return [
      ...configuredOptions,
      {
        value: selectedValue,
        label: selectedLabel || selectedValue,
      },
    ];
  }

  return configuredOptions;
}

function getSelectedLabel(field, value, selectedUser) {
  if (!value) {
    return "";
  }

  if (field.name === "roleID") {
    return selectedUser?.roleName || selectedUser?.role_name || selectedUser?.roleID || value;
  }

  if (field.name === "default_company") {
    return selectedUser?.company_name || selectedUser?.default_company_name || selectedUser?.default_company || value;
  }

  return value;
}

function getUserIdentifier(user = {}) {
  return user?.adminID;
}

function normalizeUserData(selectedUser = {}) {
  return {
    ...usersModuleSchema.form.initialValues,
    ...selectedUser,
    userName: selectedUser?.userName || selectedUser?.user_name || "",
    contactNo: selectedUser?.contactNo || selectedUser?.contactno || "",
    whatsappNo: selectedUser?.whatsappNo || selectedUser?.whatsappno || "",
    // dateOfBirth: selectedUser?.dateOfBirth || selectedUser?.dateofbirth || "",
    roleID: selectedUser?.roleID || selectedUser?.roleid || selectedUser?.roleId || "",
    default_company: selectedUser?.default_company || selectedUser?.company_id || "",
    is_approver: selectedUser?.is_approver || "no",
    time_zone: selectedUser?.time_zone || "Asia/Kolkata",
    google_location: selectedUser?.google_location || "",
    address: selectedUser?.address || "",
    status: selectedUser?.status || "active",
    dateOfBirth: selectedUser?.dateOfBirth
      ? new Date(selectedUser.dateOfBirth).toISOString().split("T")[0]
      : "",
  };
}
function generateUsernamePassword() {

}

function UserForm({ isOpen, onClose, selectedUser, onAfterSave, menu_id }) {
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [formData, setFormData] = useState(usersModuleSchema.form.initialValues);
  const [errors, setErrors] = useState({});
  const mode = selectedUser ? "edit" : "create";
  const userID = getUserIdentifier(selectedUser);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!isOpen || !userID) {
        return;
      }

      try {
        setFetchingUser(true);

        const res = await makeRequest(
          `${usersModuleSchema.api.edit}/${userID}`,
          {
            method: "GET",
          }
        );

        const userData = res?.data;

        setFormData(normalizeUserData(userData));

      } catch (error) {
        toast.error("Unable to fetch user details");
        setFormData(normalizeUserData(selectedUser));
      } finally {
        setFetchingUser(false);
      }
    };

    // EDIT MODE
    if (selectedUser && isOpen) {
      fetchUserDetails();
      return;
    }

    // CREATE MODE
    setFormData(usersModuleSchema.form.initialValues);

  }, [selectedUser, isOpen, userID]);

  const joinedFieldOptions = useMemo(
    () =>
      usersModuleSchema.staticJoined.reduce((accumulator, item) => {
        const fieldValue = formData[item.field];
        accumulator[item.field] = buildJoinedOptions(
          item,
          fieldValue,
          getSelectedLabel({ name: item.field }, fieldValue, selectedUser)
        );
        return accumulator;
      }, {}),
    [formData, selectedUser]
  );
  const selectOptionsMap = useMemo(
    () =>
      usersModuleSchema.form.sections.reduce((accumulator, section) => {
        section.fields.forEach((field) => {
          if (field.type === "select") {
            accumulator[field.name] = field.joinedField
              ? joinedFieldOptions[field.joinedField] || []
              : field.options || [];
          }
        });
        return accumulator;
      }, {}),
    [joinedFieldOptions]
  );

  if (!isOpen) {
    return null;
  }
  const handleClose = () => {
    setFormData(usersModuleSchema.form.initialValues);
    setErrors({});
    onClose();
  }
  const handleChange = (event) => {
    const { name, value } = event.target;
    const updatedData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedData);
    if ((name === "name" || name === "dateOfBirth") && updatedData.name && updatedData.dateOfBirth) {
      generateCredentials(updatedData.name, updatedData.dateOfBirth);
    }
  };

  const generateCredentials = (name, birthDate) => {
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, "");

    const dob = new Date(birthDate);
    const day = String(dob.getDate()).padStart(2, "0");
    const month = String(dob.getMonth() + 1).padStart(2, "0");
    const year = dob.getFullYear();

    const username = cleanName.split("_")[0] + "@" + year;
    // const username = cleanName.substring(0, 6) + year;

    const password =
      cleanName.charAt(0).toUpperCase() +
      day +
      month +
      "@" +
      String(year).slice(-2);

    setFormData((prev) => ({
      ...prev,
      userName: username,
      password: password,
    }));
  };

  const handleSave = async () => {
    const result = usersModuleSchema.validationSchema.safeParse(formData);

    if (result.success == false) {
      const newErrors = {};

      result.error.issues.forEach((item) => {
        newErrors[item.path[0]] = item.message;
      });

      setErrors(newErrors);
      return;
    }

    try {
      setErrors({});
      setLoading(true);

      const saveUrl =
        mode === "create"
          ? usersModuleSchema.api.create
          : `${usersModuleSchema.api.edit}/${userID}`;

      const method = mode === "create" ? "PUT" : "POST";

      const res = await makeRequest(saveUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // ✅ FIX
      });

      if (res.success) {
        toast.success(
          res?.message||
          `User ${mode === "create" ? "created" : "updated"} successfully`
        );

        setFormData(usersModuleSchema.form.initialValues);
        onClose();
        onAfterSave?.();
        return;
      }

      toast.error(res?.message || "Something went wrong");
    } catch (error) {
      toast.error(error.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // const handleSave = async () => {
  //   const result = usersModuleSchema.validationSchema.safeParse(formData);
  //   if (!result.success) {
  //     const newErrors = {};
  //     result.error.issues.forEach((item) => {
  //       const fieldName = item.path[0];
  //       newErrors[fieldName] = item.message;
  //     });
  //     setErrors(newErrors);
  //     return;
  //   }

  //   setErrors({});
  //   setLoading(true);
  //   const saveUrl = mode === "create" ? usersModuleSchema.api.create : `${usersModuleSchema.api.edit}/${userID}`;
  //   const method = mode === "create" ? 'PUT' : 'POST';
  //   const res = await makeRequest(saveUrl, {
  //     method: method,
  //     headers: { "Content-Type": "application/json" },
  //     body: formData,
  //   });
  //   setLoading(false);
  //   if (res.flag == 'S') {
  //     toast.success(res?.msg || `User ${mode === "create" ? "created" : "updated"} successfully.`);
  //     setFormData(usersModuleSchema.form.initialValues);
  //     onClose();
  //     onAfterSave?.();
  //     return;
  //   }
  //   toast.error(res?.msg || `Error while ${mode === "create" ? "creating" : "updating"} user`);
  // };

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedUser ? "Edit User" : "Create User"}
      panelClassName="!w-[640px] max-w-full"
      closeButton={
        <button className="flyout-close" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      }
      footer={
        <ActionButton
          className={loading ? "bg-purple-200 cursor-not-allowed" : ""}
          disabled={loading}
          variant="flyoutPrimary"
          onClick={handleSave}
        >
          {loading || fetchingUser ? <Spinner /> : null} Save
        </ActionButton>
      }
    >
      <div className="flyout-form-shell px-2 py-1">
        <div className="ws-main-container">
          {fetchingUser ? (
            <div className="p-5 text-center">
              <Spinner />
            </div>
          ) : (
            <DynamicModuleForm
              sections={usersModuleSchema.form.sections}
              values={formData}
              onChange={handleChange}
              errors={errors}
              menuId={menu_id}
            />
          )}
        </div>
      </div>
    </FlyoutPanel>
  );
}

export default UserForm;
