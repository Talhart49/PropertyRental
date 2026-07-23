export function roleDashboardPath(role) {
  if (role === "landlord") {
    return "/landlord";
  }

  if (role === "admin") {
    return "/admin/dashboard";
  }

  return "/tenant";
}
