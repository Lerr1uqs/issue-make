
添加对list命令的支持, 列出一个表格 当前有哪些issue 打印他们的type和index
（迁移和缓解：当前由于刚增加index支持 所以有的frontmatter里面可能没有index 但是后面都会有）

---

## Solution

# Solution for Issue #11: Add-support-for-list-command

## Progress
- Added CLI list command to display a table of current stash/doing issues with type and index.
- Implemented FileManager listIssues with index fallback for legacy frontmatter.
- Added unit test coverage for list behavior and index fallback.
