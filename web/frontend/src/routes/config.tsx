import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/config")({
  component: ConfigPage,
})

function ConfigPage() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t("navigation.config", "Config")} />
      <div className="flex-1 overflow-auto p-4 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <RawJsonPanel />
        </div>
      </div>
    </div>
  )
}

function RawJsonPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/config")
      if (!res.ok) {
        throw new Error("Failed to fetch config")
      }
      return res.json()
    },
  })

  const mutation = useMutation({
    mutationFn: async (newConfig: string) => {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: newConfig,
      })
      if (!res.ok) {
        throw new Error("Failed to save config")
      }
    },
    onSuccess: () => {
      toast.success(t("pages.config.save_success", "Configuration saved successfully."))
      queryClient.invalidateQueries({ queryKey: ["config"] })
    },
    onError: () => {
      toast.error(t("pages.config.save_error", "Failed to save configuration."))
    },
  })

  const [editorValue, setEditorValue] = useState("")

  useEffect(() => {
    if (config) {
      setEditorValue(JSON.stringify(config, null, 2))
    }
  }, [config])

  const handleSave = () => {
    try {
      // Validate JSON before saving
      JSON.parse(editorValue)
      mutation.mutate(editorValue)
    } catch (e) {
      toast.error(t("pages.config.invalid_json", "Invalid JSON format."))
    }
  }

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(editorValue), null, 2)
      setEditorValue(formatted)
      toast.success(t("pages.config.format_success", "JSON formatted successfully."))
    } catch (error) {
      toast.error(t("pages.config.format_error", "Invalid JSON format."))
    }
  }

  const [showResetDialog, setShowResetDialog] = useState(false)

  const confirmReset = () => {
    queryClient.invalidateQueries({ queryKey: ["config"] })
    toast.info(t("pages.config.reset_success", "Configuration has been reset."))
    setShowResetDialog(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("pages.config.raw_json_title", "Raw JSON Configuration")}
        </CardTitle>
        <CardDescription>
          {t(
            "pages.config.raw_json_desc",
            "Advanced users can directly edit the raw JSON configuration below.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <p>{t("labels.loading", "Loading...")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/30 relative rounded-lg border">
              <ScrollArea className="h-[calc(100vh-20rem)] min-h-[200px]">
                <Textarea
                  value={editorValue}
                  onChange={(e) => setEditorValue(e.target.value)}
                  className="font-mono text-sm min-h-[200px] resize-none border-0 bg-transparent px-4 py-3 shadow-none focus-visible:ring-0"
                  placeholder={t(
                    "pages.config.json_placeholder",
                    "Enter valid JSON configuration...",
                  )}
                />
              </ScrollArea>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleFormat} disabled={mutation.isPending}>
                {t("pages.config.format", "Format")}
              </Button>
              <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={mutation.isPending}
                    onClick={() => setShowResetDialog(true)}
                  >
                    {t("common.reset", "Reset")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("pages.config.reset_confirm_title", "Reset Configuration")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("pages.config.reset_confirm_desc", "Are you sure you want to reset the configuration? This action cannot be undone.")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmReset}>
                      {t("common.confirm", "Confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={handleSave} disabled={mutation.isPending}>
                {mutation.isPending
                  ? t("common.saving", "Saving...")
                  : t("common.save", "Save")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}