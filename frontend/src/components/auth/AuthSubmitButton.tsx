import type { ReactNode } from "react";

interface AuthSubmitButtonProps {
  loading: boolean;
  loadingLabel?: string;
  children: ReactNode;
  disabled?: boolean;
}

export default function AuthSubmitButton({ loading, loadingLabel, children, disabled }: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white
        transition-all duration-150 ease-out
        hover:bg-welve-600
        active:scale-[0.97]
        disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          {loadingLabel && <span>{loadingLabel}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
