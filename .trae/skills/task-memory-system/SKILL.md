---
name: Task Memory System
description: 每个任务必须绑定 tasks 目录中的任务文件。 执行前读取任务文件，执行后更新任务文件。 避免重复步骤。
---

# Task Memory System

所有调试或开发任务必须绑定一个任务文件。

任务文件路径：

tasks/task_<name>.txt

任务索引文件：

tasks/task_index.txt

------------------------------------------------

如果任务文件不存在：

1 自动创建任务文件
2 使用 tasks/task_template.txt 作为模板
3 将任务名称加入 task_index.txt

------------------------------------------------

执行流程

Step 1 读取任务文件

开始分析前必须读取任务文件并输出摘要：

Task Memory Loaded

Current Problem
Already Tried
Eliminated Hypotheses
Next Direction

禁止复述完整文件。

------------------------------------------------

Step 2 避免重复步骤

WHAT_HAS_BEEN_TRIED 中记录的步骤不得重复。

如果必须重试，
必须说明本次与之前尝试的不同。

------------------------------------------------

Step 3 三阶段执行

Analysis
Plan
Execute

------------------------------------------------

Step 4 Attempt 自动编号

读取任务文件中的 Attempt 记录。

新 Attempt 编号：

max_attempt + 1

------------------------------------------------

Step 5 执行完成后更新任务文件

必须：

1 追加 Attempt
2 更新 NEXT_DIRECTION
3 更新 LAST_EXECUTION_STATUS
4 更新 LAST_UPDATED

------------------------------------------------

Attempt 格式：

Attempt <number>

- date:
- summary:
- files:
- result:
- conclusion:

------------------------------------------------

如果问题解决：

STATUS 更新为

FIXED

并写入

ROOT_CAUSE

------------------------------------------------

任务完成后：

保持任务文件，
但不再加入 ACTIVE_TASKS。