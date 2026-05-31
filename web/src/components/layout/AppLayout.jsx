import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import TopBar from "./TopBar";
import dashboardBackground from "@/assets/dashboard-background.png";

const AppLayout = () => (
  <div className="relative min-h-screen flex w-full overflow-hidden bg-[#eef4fb] dark:bg-[#061225]">
    <img
      src={dashboardBackground}
      alt=""
      className="absolute inset-0 h-full w-full object-cover transition-opacity dark:opacity-25"
      draggable="false"
    />
    <div className="absolute inset-0 bg-white/45 backdrop-blur-[1px] dark:bg-[#020817]/78" />
    <AppSidebar />
    <div className="relative z-10 flex-1 flex flex-col min-w-0 h-screen">
      <TopBar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  </div>
);
export default AppLayout;
