import { ROLE_IDS, ROLES } from "@/domain/roles";

export const ROLE_SELECT_OPTIONS = ROLE_IDS.map((id) => ({ value: id, label: ROLES[id].name }));
