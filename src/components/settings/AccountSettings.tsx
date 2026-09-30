import { secondaryButtonClass } from "@/components/button-styles";

export function AccountSettings({
  name,
  email,
  signOutAction,
}: {
  name: string;
  email: string | null;
  signOutAction: () => void | Promise<void>;
}) {
  return (
    <div className="min-w-0">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Settings</h1>
      <p className="mt-2 text-sm text-slate-600 sm:text-base">The Google account signed in to DocTalk.</p>

      <section className="mt-8" aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-lg font-semibold text-slate-950">
          Account
        </h2>
        <dl className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid min-w-0 gap-1 px-4 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
            <dt className="text-sm text-slate-500">Name</dt>
            <dd className="min-w-0 break-words text-sm font-medium text-slate-950">{name}</dd>
          </div>
          <div className="grid min-w-0 gap-1 px-4 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="min-w-0 break-words text-sm font-medium text-slate-950">
              {email ?? "No email on this Google account"}
            </dd>
          </div>
          <div className="grid min-w-0 gap-1 px-4 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
            <dt className="text-sm text-slate-500">Sign-in</dt>
            <dd className="min-w-0 text-sm font-medium text-slate-950">Google</dd>
          </div>
        </dl>
        <form action={signOutAction} className="mt-6">
          <button type="submit" className={secondaryButtonClass}>
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
