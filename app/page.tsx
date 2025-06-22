"use client";

import { Button } from "@/components/ui/button";
import { ModuleSelector } from "@/components/modules/ModuleSelector";
import { WalletConnect } from "@/components/WalletConnect";
import { useAccount } from "wagmi";
import { useTaskStore } from "@/lib/store";
import { TaskList } from "@/components/modules/TaskList";
import { useBatchCallContract } from "@/contracts/useContract";
import { toast } from "sonner";
import { encodeFunctionData } from "viem";
import Records from "@/components/history/Records";
import Footer from "@/components/Footer";

export default function Home() {
  const modules = useTaskStore((state) => state.modules);
  const { isConnected } = useAccount();

  const { write, status } = useBatchCallContract();

  const handleExecute = async () => {
    try {
      if (modules.length === 0) {
        toast.error("Please add at least one module");
        return;
      }
      write();
    } catch (error) {
      alert("Error executing transaction: " + error);
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                EIP-7702 Aggregator
              </h1>
            </div>
            <div className="text-lg sm:text-xl font-bold mb-2 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span>Use EIP-7702 to build and send multiple transactions.</span>
            </div>
            <p className="text-gray-600">
              <small className="text-xs sm:text-sm text-gray-400">
                <i className="ri-error-warning-fill mr-1 text-red-400"></i>
                Note: You need to use the MetaMask and set account as a EIP-7702
                smart account.
                <a
                  href="https://support.metamask.io/configure/accounts/switch-to-or-revert-from-a-smart-account/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-600 ml-2 underline"
                >
                  Learn more 👉
                </a>
              </small>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <WalletConnect />
            <Records />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* Left module selection area */}
        <div className="xl:col-span-4">
          <div className="xl:sticky top-0 bg-white/80 backdrop-blur-sm z-10">
            <ModuleSelector />
          </div>
        </div>

        {/* Right form area */}
        <div className="xl:col-span-8">
          <div className="xl:sticky top-0 bg-white/80 backdrop-blur-sm z-10 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold">Task Chain</h2>
                <span className="text-sm text-gray-500">
                  {modules.length > 0 && `(${modules.length})`}
                </span>
              </div>
              {modules.length > 0 && isConnected && (
                <Button
                  onClick={handleExecute}
                  loading={status === "pending"}
                  className="w-full sm:w-auto"
                >
                  {status === "pending"
                    ? "Executing..."
                    : "Execute Transaction"}
                </Button>
              )}
            </div>
          </div>
          <TaskList />
        </div>
      </div>
    </div>
  );
}
