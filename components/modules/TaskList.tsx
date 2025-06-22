import { useTaskStore } from "@/lib/store"
import { ModuleCard } from "./ModuleCard"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { EmptyState } from "./EmptyState"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useState } from "react"

export function TaskList() {
  const modules = useTaskStore(state => state.modules)
  const reorderModules = useTaskStore(state => state.reorderModules)
  const { isConnected } = useAccount()
  const [executionError, setExecutionError] = useState<string | null>(null)

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(modules)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    reorderModules(items)
  }

  const handleExecute = async () => {
    // Check if all required fields are filled
    const hasEmptyParams = modules.some(module => {
      if (!module.method?.inputs) return false
      return module.method.inputs.some((input: { name: string | number }) => {
        const value = module.params[input.name]
        return !value || value.trim() === ""
      })
    })

    if (hasEmptyParams) {
      toast.error("Please fill in all required parameters")
      return
    }

    try {
      // Clear previous errors
      setExecutionError(null)
      
      // Collect all module data
      const transactions = modules.map(module => ({
        contractAddress: module.contractAddress,
        method: module.method,
        params: module.params
      }))

      // TODO: Execute contract transaction
      console.log("Executing transaction:", transactions)
      toast.success("Transaction submitted")
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || "Transaction execution failed"
      setExecutionError(errorMessage)
      console.error("Transaction execution failed:", error)
      toast.error("Transaction execution failed")
    }
  }

  if (modules.length === 0) {
    return (
      <EmptyState />
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Error Display */}
      {executionError && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong className="font-medium">Execution Error:</strong>
            <div className="mt-1 text-sm">{executionError}</div>
          </AlertDescription>
        </Alert>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="task-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3 sm:space-y-4"
            >
              {modules.map((module, index) => (
                <Draggable
                  key={module.id}
                  draggableId={module.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${snapshot.isDragging ? "opacity-50" : ""} w-full`}
                    >
                      <ModuleCard
                        module={module}
                        index={index}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}