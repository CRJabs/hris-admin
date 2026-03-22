import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";

export default function AppLayout() {
  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onSearch={setGlobalSearch} />
        <main className="flex-1 overflow-auto">
          <Outlet context={{ globalSearch }} />
        </main>
      </div>
    </div>
  );
}