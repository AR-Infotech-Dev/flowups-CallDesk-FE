import { menuMasterSchema } from "../data/module.schema";

export const getMenuIdentifier = (menu = {}) => menu?.menu_id ?? menu?.menuID ?? menu?.id;

export const normalizeMenuData = (selectedMenu = {}) => ({
  ...menuMasterSchema.form.initialValues,
  ...selectedMenu,
  menu_id: selectedMenu?.menu_id || selectedMenu?.menuID || selectedMenu?.id || null,
  menu_name: selectedMenu?.menu_name || selectedMenu?.menuName || "",
  menuName: selectedMenu?.menuName || selectedMenu?.menu_name || "",
  module_name: selectedMenu?.module_name || selectedMenu?.moduleName || "",
  module_desc: selectedMenu?.module_desc || "",
  menu_link: selectedMenu?.menu_link || selectedMenu?.menuLink || "",
  menuLink: selectedMenu?.menuLink || selectedMenu?.menu_link || "",
  parentID: selectedMenu?.parentID || selectedMenu?.parent_id || "",
  icon_name: selectedMenu?.icon_name || selectedMenu?.iconName || "",
  iconName: selectedMenu?.iconName || selectedMenu?.icon_name || "",
  status: selectedMenu?.status || "active",
});
