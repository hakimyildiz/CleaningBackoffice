self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/api/:path*"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/CleanersPage",
    "/LoginPage",
    "/_app",
    "/_error",
    "/dashboard/AdminDashboard",
    "/dashboard/AgencyBookkeeperDashboard",
    "/dashboard/AgencyManagerDashboard",
    "/dashboard/AgencyStaffDashboard",
    "/dashboard/CleanerDashboard",
    "/dashboard/CleanerManagerDashboard",
    "/dashboard/CustomerDashboard",
    "/dashboard/ManagerDashboard"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()