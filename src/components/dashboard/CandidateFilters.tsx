import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Filter } from "lucide-react";

export type SortOption = "score" | "status" | "date_added" | "date_updated";
export type StatusFilter = "all" | "active" | "just_matched" | "texting" | "planning_date" | "dating" | "dating_casually" | "getting_serious" | "serious_relationship" | "no_contact" | "archived";

interface CandidateFiltersProps {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "score", label: "Compatibility Score" },
  { value: "status", label: "Status" },
  { value: "date_added", label: "Date Added" },
  { value: "date_updated", label: "Recently Updated" },
];

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Candidates" },
  { value: "active", label: "Active Only" },
  { value: "just_matched", label: "Just Matched" },
  { value: "texting", label: "Texting" },
  { value: "planning_date", label: "Planning Date" },
  { value: "dating_casually", label: "Dating Casually" },
  { value: "getting_serious", label: "Getting Serious" },
  { value: "serious_relationship", label: "Serious Relationship" },
  { value: "dating", label: "Situationship" },
  { value: "no_contact", label: "No Contact" },
  { value: "archived", label: "Archived" },
];

export const CandidateFilters: React.FC<CandidateFiltersProps> = ({
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="flex gap-2">
      <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-[160px] h-9 text-sm">
          <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
