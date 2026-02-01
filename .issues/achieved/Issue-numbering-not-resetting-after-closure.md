
是不是在关闭issue了之后编号没有重新从0开始呢？应该收集当前有哪些编号
比如有[1, 2, 4] 那新的两个issue应该是0, 3

---

## Solution

# Solution for Issue #13: Issue-numbering-not-resetting-after-closure

## Progress
- Updated ID allocation to pick the smallest missing number from active issues (stash + doing).
- Adjusted unit tests to reflect gap-filling behavior.
