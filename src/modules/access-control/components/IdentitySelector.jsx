import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, UserRoundCheck } from "lucide-react";
import { toast } from "react-toastify";
import { makeRequest } from "../../../api/httpClient";
import { usersModuleSchema } from "../../users/data/module.schema";
import { normalizeUserIdentity } from "../data/helper";

function IdentitySelector({ companyId, selectedIdentity, onSelect }) {
  const [identities, setIdentities] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (text = "") => {
    try {
      setLoading(true);
      const res = await makeRequest('get-users', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          status: "active",
          page: 1,
          searchText: text,
          ...(companyId ? { company_id: companyId } : {}),
        },
      });

      if (!res?.success) {
        toast.error(res?.message || "Error while fetching users");
        setIdentities([]);
        onSelect?.(null);
        return;
      }

      const nextIdentities = (res.data || []).map(normalizeUserIdentity).filter((user) => user.id);
      setIdentities(nextIdentities);
    } catch (error) {
      toast.error(error.message || "Error while fetching users");
      setIdentities([]);
      onSelect?.(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchUsers(searchText.trim());
    }, searchText.trim() ? 350 : 0);

    return () => window.clearTimeout(timeout);
  }, [companyId, searchText]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading...";
    return `${identities.length} user${identities.length === 1 ? "" : "s"}`;
  }, [identities.length, loading]);

  return (
    <aside className="min-h-full border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Select User or Role</h3>
          <p className="text-[11px] text-slate-500">{countLabel}</p>
        </div>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          onClick={() => fetchUsers(searchText.trim())}
          aria-label="Refresh users"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <label className="block text-xs font-semibold text-slate-500" htmlFor="access-identity-search">
          Search Identity
        </label>
        <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-slate-400">
          <Search size={15} />
          <input
            id="access-identity-search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Name, email or role..."
            className="min-w-0 flex-1 border-0 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="max-h-[calc(100vh-250px)] space-y-2 overflow-y-auto pr-1">
          {loading && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
              Loading users...
            </div>
          )}
          {!loading && identities.length === 0 && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
              No users found
            </div>
          )}
          {identities.map((identity) => (
            <button
              type="button"
              key={identity.id}
              className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                selectedIdentity?.id === identity.id
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
              onClick={() => onSelect?.(identity)}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                {identity.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-700">{identity.name}</span>
                <span className="block truncate text-[11px] text-slate-500">{identity.email}</span>
                <span className="block truncate text-[10px] font-medium text-slate-400">
                  Company ID: {identity.company_id || "-"}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                  {identity.badge}
                </span>
                {/* <span className="max-w-[72px] truncate text-[10px] text-slate-400">{identity.companyLabel}</span> */}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-3 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <UserRoundCheck size={14} />
            Change Selection
          </button>
        </div>
      </div>
    </aside>
  );
}

export default IdentitySelector;
