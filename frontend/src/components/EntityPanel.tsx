"use client";

/**
 * Renders grouped extracted entities for fast document scanning.
 */

import { Users, Calendar, DollarSign, MapPin, type LucideIcon } from "lucide-react";
import type { DocumentEntities } from "@/types";

interface SectionConfig {
  key: keyof DocumentEntities;
  label: string;
  Icon: LucideIcon;
  iconColor: string;
  badgeClass: string;
}

const SECTIONS: SectionConfig[] = [
  {
    key: "parties",
    label: "Parties",
    Icon: Users,
    iconColor: "text-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-100",
  },
  {
    key: "dates",
    label: "Dates",
    Icon: Calendar,
    iconColor: "text-violet-500",
    badgeClass: "bg-violet-50 text-violet-700 border border-violet-100",
  },
  {
    key: "amounts",
    label: "Amounts",
    Icon: DollarSign,
    iconColor: "text-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  {
    key: "jurisdictions",
    label: "Jurisdictions",
    Icon: MapPin,
    iconColor: "text-orange-500",
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-100",
  },
];

interface EntityPanelProps {
  entities: DocumentEntities | null | undefined;
}

export default function EntityPanel({ entities }: EntityPanelProps) {
  const hasAny = SECTIONS.some(
    (s) => (entities?.[s.key] ?? []).length > 0,
  );

  return (
    <div className="panel-card p-5 mt-3">
      <h2 className="section-heading">Key Entities</h2>

      {!hasAny && (
        <p className="text-sm text-slate-400">No entities extracted.</p>
      )}

      {SECTIONS.map(({ key, label, Icon, iconColor, badgeClass }) => {
        const items = entities?.[key] ?? [];
        if (items.length === 0) return null;
        return (
          <div key={key} className="mb-3 last:mb-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
              <span className="text-xs text-slate-500 font-medium">
                {label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {items.map((item) => (
                <span
                  key={item}
                  className={`${badgeClass} text-xs px-2 py-0.5 rounded`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
