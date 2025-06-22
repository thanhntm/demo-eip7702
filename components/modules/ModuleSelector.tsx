import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AVAILABLE_MODULES } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { CustomContractForm } from "./CustomContractForm";
import { useTaskStore } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { ExampleContracts } from "./ExampleContracts";
import { mockAArr } from "@/app/api/mock";
import { truncateString } from "@/lib/utils";

export function ModuleSelector() {
  const [contractAddress, setContractAddress] = useState("");
  const [contractName, setContractName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contractMethods, setContractMethods] = useState([]);

  const addModule = useTaskStore((state) => state.addModule);

  const handlePresetModuleSelect = (module: (typeof AVAILABLE_MODULES)[0]) => {
    console.log("module===>", module);
    addModule({
      name: module.title,
      id: uuidv4(),
      type: module.type,
      title: module.title,
      description: module.description,
      icon: module.icon,
      method: module.method,
      params: {},
      customComponent: module.customComponent,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Available Modules
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Select a module to add to your transaction workflow
          </p>
        </div>
        <div className="space-y-3">
          {AVAILABLE_MODULES.map((module) => (
            <div
              key={module.id}
              className="w-full h-auto py-3 sm:py-4 px-3 sm:px-4 cursor-pointer border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  {module.title}
                </h3>
                <Plus
                  className="h-5 w-5 sm:h-6 sm:w-6 opacity-50 flex-shrink-0 hover:opacity-100 transition-opacity"
                  onClick={() => handlePresetModuleSelect(module)}
                />
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg sm:text-xl flex-shrink-0">
                  {module.icon}
                </span>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{module.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
