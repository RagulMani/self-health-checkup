import { Navigate, type RouteObject } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/components/layout/RequireAuth";
import CheckInPage from "@/pages/check-in";
import DashboardPage from "@/pages/dashboard";
import ForgotPasswordPage from "@/pages/forgot-password";
import HistoryPage from "@/pages/history";
import LoginPage from "@/pages/login";
import NotificationsPage from "@/pages/notifications";
import ProfilePage from "@/pages/profile";
import RemindersPage from "@/pages/reminders";
import ReportPage from "@/pages/report";
import ResetPasswordPage from "@/pages/reset-password";
import SignupPage from "@/pages/signup";
import SymptomsPage from "@/pages/symptoms";

export const routes: RouteObject[] = [
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/check-in", element: <CheckInPage /> },
      { path: "/history", element: <HistoryPage /> },
      { path: "/symptoms", element: <SymptomsPage /> },
      { path: "/reminders", element: <RemindersPage /> },
      { path: "/report", element: <ReportPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/notifications", element: <NotificationsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
];

export default routes;
