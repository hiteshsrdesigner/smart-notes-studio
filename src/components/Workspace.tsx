import { useState } from "react";
import TopBar from "./TopBar";
import RichEditor from "../editor/RichEditor";
import PreviewPane from "./Preview/PreviewPane";
import SettingsPanel from "./Settings/SettingsPanel";
import ValidationBanner from "./ValidationBanner";

type Tab = "editor" | "preview" | "settings";

export default function Workspace() {
  const [showValidate, setShowValidate] = useState(false);
  const [mobileTab, setMobileTab] = useState<Tab>("editor");

  return (
    <div className="h-screen flex flex-col relative">
      <TopBar onValidate={() => setShowValidate((v) => !v)} />
      {showValidate && <ValidationBanner onClose={() => setShowValidate(false)} />}

      {/* mobile tabs */}
      <div className="flex md:hidden border-b border-app-border bg-white flex-none">
        {(["editor", "preview", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize ${
              mobileTab === t ? "text-app-crimson border-b-2 border-app-crimson" : "text-app-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className={`w-full md:w-[46%] border-r border-app-border bg-white min-h-0 ${mobileTab === "editor" ? "flex" : "hidden md:flex"}`}>
          <RichEditor />
        </div>
        <div className={`w-full md:flex-1 min-h-0 ${mobileTab === "preview" ? "flex" : "hidden md:flex"}`}>
          <PreviewPane />
        </div>
        <div className={`w-full md:w-[280px] border-l border-app-border bg-white min-h-0 ${mobileTab === "settings" ? "block" : "hidden md:block"}`}>
          <SettingsPanel />
        </div>
      </div>
    </div>
  );
}
