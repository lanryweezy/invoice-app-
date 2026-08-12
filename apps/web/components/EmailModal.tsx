import React, { useState, useEffect } from "react";
import { ClipboardIcon } from "./Icons";
import {
  EMAIL_TEMPLATES,
  type EmailTemplateType,
} from "../utils/emailGenerator";
import { auth } from "../services/firebase";

interface SmtpSettings {
  host: string;
  port: string;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailContent: string;
  onTemplateChange?: (template: EmailTemplateType) => void;
  activeTemplate?: EmailTemplateType;
  recipientEmail?: string;
  smtpSettings?: SmtpSettings | null;
  onOpenSmtpSettings?: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  emailContent,
  onTemplateChange,
  activeTemplate = "formal",
  recipientEmail,
  smtpSettings,
  onOpenSmtpSettings,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplateType>(activeTemplate);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setSendResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedTemplate(activeTemplate);
  }, [activeTemplate]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTemplateSelect = (id: EmailTemplateType) => {
    setSelectedTemplate(id);
    onTemplateChange?.(id);
  };

  const handleSend = async () => {
    if (!smtpSettings || !recipientEmail) return;
    setSending(true);
    setSendResult(null);

    // 🌱 Flora: Wraps native fetch with AbortController to prevent indefinite UI hangs if the external SMTP server is unresponsive
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const subject =
        emailContent.match(/Subject: (.*)/)?.[1] || "Your Invoice";
      const body = emailContent.substring(emailContent.indexOf("\n\n") + 2);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject,
          text: body,
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ type: "success", text: "Email sent successfully!" });
        setTimeout(() => onClose(), 1500);
      } else {
        setSendResult({
          type: "error",
          text: data.error || "Failed to send email.",
        });
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setSendResult({
          type: "error",
          text: "Request timed out. The SMTP server took too long to respond.",
        });
      } else {
        setSendResult({ type: "error", text: err.message || "Network error." });
      }
    } finally {
      clearTimeout(timeoutId);
      setSending(false);
    }
  };

  const subject = emailContent.match(/Subject: (.*)/)?.[1] || "Your Invoice";
  const body = emailContent.substring(emailContent.indexOf("\n\n") + 2);
  const hasSmtp = !!smtpSettings?.host;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3
                  id="modal-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Generate Email
                </h3>
                <p className="text-sm text-slate-500">
                  {hasSmtp
                    ? "Send directly or copy to clipboard"
                    : "Pick a template and copy to send"}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                title="Close"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 rounded-full transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Template Selector */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {EMAIL_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    selectedTemplate === t.id
                      ? "bg-teal-50 border-teal-300 text-teal-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="mr-1">{t.icon}</span> {t.name}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Subject
                </p>
                <p className="text-slate-900 font-semibold select-all">
                  {subject}
                </p>
              </div>

              {hasSmtp && recipientEmail && (
                <div className="bg-teal-50 rounded-xl p-3 border border-teal-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                      Sending to
                    </p>
                    <p className="text-sm text-teal-800 font-semibold">
                      {recipientEmail}
                    </p>
                  </div>
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-bold">
                    SMTP Active
                  </span>
                </div>
              )}

              <div className="relative group">
                <textarea
                  readOnly
                  value={body}
                  className="block w-full rounded-xl border-slate-300 bg-white text-slate-700 leading-relaxed resize-none h-64 p-4 focus:border-teal-500 focus:ring-teal-500 sm:text-sm shadow-inner"
                />
              </div>
            </div>

            {sendResult && (
              <div
                className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${sendResult.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {sendResult.text}
              </div>
            )}

            {!hasSmtp && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Send directly from your inbox
                  </p>
                  <p className="text-xs text-amber-600">
                    Connect Gmail, Outlook, or any SMTP — Pro feature
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSmtpSettings?.();
                  }}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 whitespace-nowrap bg-amber-100 px-3 py-1.5 rounded-lg"
                >
                  Connect →
                </button>
              </div>
            )}
          </div>
          <div className="bg-slate-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-slate-100">
            {hasSmtp && (
              <button
                type="button"
                disabled={sending || !recipientEmail}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSend}
              >
                {sending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>{" "}
                    Sending...
                  </>
                ) : (
                  "Send Email"
                )}
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
              onClick={() => {
                handleCopy();
                setTimeout(onClose, 500);
              }}
            >
              <ClipboardIcon className="w-4 h-4" />{" "}
              {copied ? "Copied!" : "Copy & Close"}
            </button>
            <button
              type="button"
              className="inline-flex w-full sm:w-auto justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
