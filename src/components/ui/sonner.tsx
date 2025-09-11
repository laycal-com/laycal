"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as any}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "bg-white text-gray-950 border border-gray-200 shadow-lg rounded-md",
          description: "text-gray-700",
          actionButton: "bg-gray-900 text-white",
          cancelButton: "bg-gray-100 text-gray-600",
          success: "!bg-green-50 !text-green-800 !border-green-200 [&_.sonner-toast-description]:!text-green-700",
          error: "!bg-red-50 !text-red-800 !border-red-200 [&_.sonner-toast-description]:!text-red-800 [&_.sonner-toast-description]:!font-semibold", 
          warning: "!bg-orange-50 !text-orange-800 !border-orange-200 [&_.sonner-toast-description]:!text-orange-700",
          info: "!bg-blue-50 !text-blue-800 !border-blue-200 [&_.sonner-toast-description]:!text-blue-700",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
