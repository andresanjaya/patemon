import * as React from "react";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className = "", ...props }, ref) => (
  <div className="table-metronic-wrapper dark:border-border/80 dark:bg-card relative w-full overflow-x-auto rounded-xl border border-[#e9e9ed] bg-white shadow-2xs">
    <table
      ref={ref}
      className={`table-metronic w-full caption-bottom border-collapse text-sm ${className}`}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => (
  <thead
    ref={ref}
    className={`dark:bg-muted/40 dark:text-muted-foreground bg-[#f9f9fb] text-xs font-semibold text-[#65656f] ${className}`}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => (
  <tbody
    ref={ref}
    className={`dark:divide-border/80 divide-y divide-[#e9e9ed] ${className}`}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className = "", ...props }, ref) => (
  <tr
    ref={ref}
    className={`dark:hover:bg-muted/20 dark:data-[state=selected]:bg-muted/30 transition-colors hover:bg-[#fbfbfd] data-[state=selected]:bg-[#f4f4f7] ${className}`}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className = "", ...props }, ref) => (
  <th
    ref={ref}
    className={`dark:border-border/80 dark:text-muted-foreground h-11 border-r border-b border-[#e9e9ed] px-4 text-left align-middle text-xs font-semibold text-[#65656f] last:border-r-0 [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className = "", ...props }, ref) => (
  <td
    ref={ref}
    className={`dark:border-border/80 dark:text-foreground border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle text-sm text-[#18181b] last:border-r-0 [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
