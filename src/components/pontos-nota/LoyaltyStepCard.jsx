import { createElement } from "react"
import { Link } from "react-router-dom"

export default function LoyaltyStepCard({
  icon,
  title,
  description,
  to,
  href,
  label,
  className = "",
  buttonVariant = "slate",
  hideButton = false,
}) {
  const btnBase =
    "inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold shadow-md transition duration-200 hover:shadow-lg active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"

  const btnVariant = {
    slate: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900",
    indigo: "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-600",
    emerald: "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-600",
  }[buttonVariant]

  const btnClass = `${btnBase} ${btnVariant}`

  return (
    <article
      className={`group flex flex-col rounded-2xl border-2 border-slate-300 bg-white p-7 shadow-md transition duration-300 ease-out hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg motion-safe:opacity-0 motion-safe:animate-fade-in-up motion-reduce:opacity-100 ${className}`}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-950 shadow-sm ring-2 ring-slate-400/90 transition duration-300 group-hover:scale-105 group-hover:bg-slate-300 group-hover:ring-slate-500/90">
        {createElement(icon, {
          className: "h-7 w-7 text-slate-950",
          strokeWidth: 2.5,
          "aria-hidden": true,
        })}
      </div>
      <h3 className="text-lg font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-slate-800">{description}</p>
      {!hideButton && label && (
        <div className="mt-6">
          {href ? (
            <a
              href={href}
              className={btnClass}
              {...(href.startsWith("#")
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
            >
              {label}
            </a>
          ) : (
            <Link to={to || "/"} className={btnClass}>
              {label}
            </Link>
          )}
        </div>
      )}
    </article>
  )
}
