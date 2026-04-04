import { useERPCRMContext } from '../context/ERPCRMContext';

const columns = [
  { name: 'New', border: 'border-blue-500' },
  { name: 'Contacted', border: 'border-amber-400' },
  { name: 'Interested', border: 'border-indigo-500' },
  { name: 'Converted', border: 'border-emerald-500' },
  { name: 'Lost', border: 'border-rose-500' },
];

const nextStatusMap = {
  New: ['Contacted', 'Interested', 'Lost'],
  Contacted: ['Interested', 'Converted', 'Lost'],
  Interested: ['Converted', 'Lost'],
  Converted: [],
  Lost: [],
};

const probabilityClass = (probability) => {
  if (probability > 60) {
    return 'text-emerald-600';
  }

  if (probability >= 40) {
    return 'text-amber-600';
  }

  return 'text-rose-600';
};

function LeadPipeline() {
  const { leads, updateLeadStatus } = useERPCRMContext();
  const totalPipelineValue = leads.reduce((sum, lead) => sum + lead.conversionProbability, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Lead Pipeline</h3>
          <p className="mt-1 text-sm text-slate-500">Track potential users through the CRM funnel.</p>
        </div>
        <p className="text-sm font-semibold text-slate-600">Pipeline Score: {totalPipelineValue}</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((column) => {
          const columnLeads = leads.filter((lead) => lead.status === column.name);

          return (
            <div
              key={column.name}
              className={`min-w-48 rounded-xl border-t-4 bg-gray-50 p-3 ${column.border}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold text-slate-800">{column.name}</h4>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                  {columnLeads.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnLeads.map((lead) => (
                  <div key={lead.id} className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="font-semibold text-slate-900">{lead.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{lead.college}</p>
                    <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {lead.source}
                    </span>
                    <p className={`mt-3 text-sm font-semibold ${probabilityClass(lead.conversionProbability)}`}>
                      {lead.conversionProbability}% probability
                    </p>
                    {nextStatusMap[lead.status].length > 0 && (
                      <select
                        value=""
                        onChange={(event) => {
                          if (event.target.value) {
                            updateLeadStatus(lead.id, event.target.value);
                          }
                        }}
                        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">Update Status</option>
                        {nextStatusMap[lead.status].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                {columnLeads.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-400">
                    No leads here yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LeadPipeline;
