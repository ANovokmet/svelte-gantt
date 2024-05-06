---
title: Tasks
---

# Task

Tasks are intervals of time that are assigned to a resource. They are defined as a list of objects:

| Name | Description | Type | Default |
| - | - | - | -: |
`id` | `Number`\|`String` | Id of task, every task needs to have a unique one. | undefined |
`amountDone` | `Number` | Task completion in percent, indicated on task. | undefined |
`classes` | `String`\|`Array` | Custom CSS classes to apply to task. | undefined |
`from` | `number` | Datetime task starts on. | undefined |
`to` | `number` | Datetime task ends on. | undefined |
`label` | `String` | Label of task. | undefined |
`html` | `String` | Html content of task, will override label. | undefined |
`showButton` | `Boolean` | Show button bar. | undefined |
`buttonClasses` | `String`\|`Array` | Button classes, useful for fontawesome icons. | undefined |
`buttonHtml` | `String` | Html content of button. | undefined |
`enableDragging` | `Boolean` | enable dragging of task. | true |
`enableResize` | `Boolean` | enable resize of task. | true |
