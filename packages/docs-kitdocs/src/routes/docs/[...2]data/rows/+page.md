---
title: Rows
---

# Row

Rows are defined as a list of objects. Rows can be rendered as a collapsible tree (rows are collapsed with SvelteGanttTable module). Row objects may have these parameters:

-   `id` (`Number`|`String`) Id of row, every row needs to have a unique one.
-   `classes` (`String`|`Array`) Custom CSS classes to apply to row.
-   `contentHtml` (`String`) Html content of row, renders as background to a row.
-   `enableDragging` (`Boolean`) enable dragging of tasks to and from this row.
-   `enableResize` (`Boolean`) enable resize of tasks on this row.
-   `label` (`String`) Label of row, could be any other property, can be displayed with SvelteGanttTable.
-   `headerHtml` (`String`) Html content of table row header, displayed in SvelteGanttTable.
-   `children` (`Array`) List of children row objects, these can have their own children.
-   `expanded` (`Boolean`) (`optional`) Used when tree view is enabled, controls the expanded state.