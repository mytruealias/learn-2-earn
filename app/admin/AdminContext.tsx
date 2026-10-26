"use client";

import { createContext, useContext } from "react";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export const AdminContext = createContext<{ admin: AdminUser | null; logout: () => void }>({
  admin: null,
  logout: () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}
