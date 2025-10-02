"use client"
import React from "react"
import { X } from "lucide-react"

interface ModalProps {
  show: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

const Modal = ({ show, onClose, title, children }: ModalProps) => {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-in">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal
