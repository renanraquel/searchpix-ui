import { createElement } from "react"
import { Link } from "react-router-dom"

export default function LoyaltyStepCard({ icon, title, description, to, label, className = "", buttonVariant = "slate" }) {
  const btnBase =
    "inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold shadow-md transition duration-200 hover:shadow-lg active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"

  const btnVariant = {
    slate: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900",
    indigo: "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-600",
    emerald: "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-600",
  }[buttonVariant]

  return (
    <article
      className={`group flex flex-col rounded-2xl border border-slate-200/90 bg-white/95 p-7 shadow-soft backdrop-blur-sm transition duration-300 ease-out hover:-translate-y-1 hover:border-slate-200 hover:shadow-soft-lg motion-safe:opacity-0 motion-safe:animate-fade-in-up motion-reduce:opacity-100 ${className}`}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/95 text-slate-900 shadow-sm ring-1 ring-slate-300/90 transition duration-300 group-hover:scale-105 group-hover:bg-slate-200">
        {createElement(icon, {
          className: "h-7 w-7 text-slate-900",
          strokeWidth: 2.25,
          "aria-hidden": true,
        })}
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-6">
        <Link to={to} className={`${btnBase} ${btnVariant}`}>
          {label}
        </Link>
      </div>
    </article>
  )
}
